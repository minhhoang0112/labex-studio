import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import {assessmentSummary, readAssessmentBank, createAssessmentService} from '../server/services/courseAssessment.js';
import {createAssessmentRouter} from '../server/routes/assessments.js';
import {loadLab, listLabs} from '../server/data/catalog.js';

const bank = readAssessmentBank(), questions = bank.groups.flatMap(g => g.questions);
function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'labex-assessment-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  return {directory, service: createAssessmentService({directory, ...options})};
}
const correctAnswers = () => Object.fromEntries(questions.map(q => [q.id, q.correct_option_id]));

test('80 reviewed questions cover every step of all ten Quick Start lessons with valid distinct choices', () => {
  assert.equal(questions.length, 80);
  assert.equal(bank.groups.length, 10);
  assert.equal(assessmentSummary().order, 11);
  const labs = listLabs().filter(l => l.course_id === bank.course_id);
  assert.equal(labs.length, 10);
  const ids = new Set();
  for (const group of bank.groups) {
    const lab = loadLab(group.lab_id);
    assert.ok(lab && lab.course_id === bank.course_id);
    const covered = new Set();
    for (const q of group.questions) {
      assert.ok(!ids.has(q.id)); ids.add(q.id);
      assert.ok(q.prompt.trim().length >= 10 && q.explanation.trim().length >= 35, q.id);
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options.map(o => o.text)).size, 4);
      assert.equal(q.options.filter(o => o.id === q.correct_option_id).length, 1);
      for (const stepId of q.source_step_ids) {assert.ok(lab.steps.some(s => s.id === stepId)); covered.add(stepId);}
    }
    for (const step of lab.steps) assert.ok(covered.has(step.id), `${lab.id}/${step.id} is not assessed`);
  }
});

test('attempts never expose keys/explanations before submission; shuffled choices and drafts survive restart', t => {
  const {service, directory} = fixture(t);
  const start = service.start(bank.id);
  assert.doesNotMatch(JSON.stringify(start), /correct_option_id|explanation|reviews|revision/);
  assert.equal(start.result, null);
  for (const q of start.questions) assert.deepEqual([...q.options.map(o => o.id)].sort(), ['a', 'b', 'c', 'd']);
  const answers = {[questions[0].id]: questions[0].correct_option_id};
  service.update(start.id, answers);
  const reloaded = createAssessmentService({directory}).get(start.id);
  assert.deepEqual(reloaded.answers, answers);
  assert.deepEqual(reloaded.questions, start.questions);
});

test('grading is computed by backend, includes every group, exact threshold and immutable submitted results', t => {
  const {service} = fixture(t);
  const all = service.start(bank.id);
  const perfect = service.submit(all.id, correctAnswers());
  assert.equal(perfect.result.correct, 80); assert.equal(perfect.result.percent, 100);
  assert.equal(perfect.result.score_out_of_10, 10); assert.equal(perfect.result.passed, true);
  assert.equal(perfect.result.groups.length, 10); assert.equal(perfect.result.reviews.length, 80);
  assert.deepEqual(service.submit(all.id, {}).result, perfect.result);
  assert.throws(() => service.update(all.id, {}), /đã nộp/);
  for (const [count, passed] of [[64, true], [63, false], [0, false]]) {
    const attempt = service.start(bank.id);
    const result = service.submit(attempt.id, Object.fromEntries(questions.slice(0, count).map(q => [q.id, q.correct_option_id]))).result;
    assert.equal(result.correct, count); assert.equal(result.unanswered, 80-count); assert.equal(result.passed, passed);
    assert.equal(result.groups.reduce((n, g) => n+g.correct, 0), count);
  }
});

test('wrong answers do not pass, malformed payloads are rejected, and changed bank revisions cannot be silently graded', t => {
  let current = structuredClone(bank);
  const {service} = fixture(t, {readBank: () => current});
  const attempt = service.start(bank.id);
  for (const answers of [null, [], 'a', {'unknown': 'a'}, {[questions[0].id]: 'x'}, {[questions[0].id]: 0}]) {
    assert.throws(() => service.submit(attempt.id, answers), e => e.status === 400);
  }
  assert.throws(() => service.get('../anything'), e => e.status === 400);
  assert.throws(() => service.get('a'.repeat(32)), e => e.status === 404);
  const wrong = Object.fromEntries(questions.map(q => [q.id, q.options.find(o => o.id !== q.correct_option_id).id]));
  assert.equal(service.submit(attempt.id, wrong).result.correct, 0);
  const before = service.start(bank.id);
  current.version++;
  assert.throws(() => service.submit(before.id, correctAnswers()), e => e.status === 409);
});

test('assessment HTTP API keeps answer keys private and ignores client supplied score/pass flags', async t => {
  const {service} = fixture(t);
  const app = express(); app.use(express.json()); app.use('/api', createAssessmentRouter({service}));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api/assessments`;
  const summary = await fetch(`${base}/${bank.id}`).then(r => r.json());
  assert.equal(summary.question_count, 80); assert.doesNotMatch(JSON.stringify(summary), /correct_option/);
  assert.equal((await fetch(`${base}/unknown`)).status, 404);
  const start = await fetch(`${base}/${bank.id}/attempts`, {method: 'POST'}).then(r => r.json());
  const response = await fetch(`${base}/attempts/${start.id}/submit`, {method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({answers: {}, score: 100, passed: true})});
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const graded = await response.json(); assert.equal(graded.result.correct, 0); assert.equal(graded.result.passed, false);
  const resumed = await fetch(`${base}/attempts/${start.id}`).then(r => r.json());
  assert.deepEqual(resumed.result, graded.result);
});
