import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadLab, listLabs, synchronizeTaskPresentation} from '../server/data/catalog.js';
import {verifyDefinition} from '../server/services/verification.js';

const id = 'linux-the-manuscript-mystery';
const lab = loadLab(id);
const entry = (command, status = 0) => ({command, status, user: 'labex'});
const evaluate = (index, history, state = 0) => verifyDefinition(id, lab.steps[index].verification, {
  readHistory: async () => history.map(item => typeof item === 'string' ? entry(item) : item),
  runCommand: async () => ({exitCode: state}),
});

test('all Quick Start persisted task copies match document sections, including translations and grading', () => {
  const labs = listLabs().filter(item => item.course_id === 'quick-start-with-linux');
  assert.equal(labs.length, 10);
  for (const item of labs) {
    const raw = JSON.parse(fs.readFileSync(new URL(`../server/data/labs/${item.id}.json`, import.meta.url), 'utf8'));
    for (const step of raw.steps) assert.deepEqual(step, raw.sections.find(s => s.id === step.id), `${item.id}/${step.id}`);
  }
});

test('catalog always presents canonical section instructions without changing private task graders', () => {
  const normalized = synchronizeTaskPresentation({sections: [{id: 'a', content_vi: 'current', task: 'old task', verification: {kind: 'unsupported'}}],
    steps: [{id: 'a', content_vi: 'old', task: 'current task', verification: {kind: 'state', command: 'check'}}]});
  assert.equal(normalized.steps[0].content_vi, 'current');
  assert.equal(normalized.steps[0].task, 'current task');
  assert.equal(normalized.steps[0].task_vi, undefined);
  assert.equal(normalized.steps[0].verification.command, 'check');
  assert.equal(normalized.sections[0].verification.command, 'check');
  assert.equal(normalized.sections[0].task, 'current task');
});

test('every catalog task exposes identical instructions, hints and grading in both views', () => {
  for (const item of listLabs()) {
    if (!item.sections) continue;
    for (const step of item.steps || []) {
      const section = item.sections.find(s => s.id === step.id);
      if (!section) continue;
      for (const key of ['content', 'content_vi', 'task', 'task_vi', 'hint', 'hint_vi', 'verification', 'verification_by_provider']) {
        assert.deepEqual(step[key], section[key], `${item.id}/${step.id}/${key}`);
      }
    }
  }
});

test('manuscript Vietnamese examples agree with actual fixture bytes and line counts', () => {
  const fixture = JSON.parse(fs.readFileSync(new URL('../server/data/environment-setups/linux-the-manuscript-mystery.json', import.meta.url), 'utf8'));
  const content = lab.steps[0].content_vi;
  const v1 = fixture.files.find(f => f.path.endsWith('manuscript_v1.txt')).content.trim();
  const v2 = fixture.files.find(f => f.path.endsWith('manuscript_v2.txt')).content.split('\n').slice(0, 2).join('\n');
  assert.ok(content.includes(v1));
  assert.ok(content.includes(v2));
  assert.match(content, /head -n 2 manuscript_v2\.txt/);
  assert.match(content, /tail -n 1 manuscript_v1\.txt manuscript_v2\.txt/);
  assert.doesNotMatch(JSON.stringify(lab), /manuscript_page_|grandfather clock|head -n 3|tail -n 3/);
});

test('documented manuscript solution passes, including equivalent cat/line-count variants', async () => {
  for (const commands of [
    ['cat manuscript_v1.txt', 'head -n 2 manuscript_v2.txt', 'tail -n 1 manuscript_v1.txt manuscript_v2.txt'],
    ['cat -n manuscript_v1.txt manuscript_v2.txt', 'head -n2 manuscript_v2.txt', 'tail -n1 manuscript_v1.txt', 'tail --lines=1 manuscript_v2.txt'],
    ['cat ./manuscript_v2.txt ./manuscript_v1.txt', 'head --lines=2 ./manuscript_v2.txt', 'tail -1 ./manuscript_v2.txt ./manuscript_v1.txt'],
  ]) assert.equal((await evaluate(0, commands)).passed, true);
});

test('wrong line counts, missing second tail, failed commands and changed fixture never pass', async () => {
  const correct = ['cat manuscript_v1.txt', 'head -n 2 manuscript_v2.txt', 'tail -n 1 manuscript_v1.txt manuscript_v2.txt'];
  for (const commands of [
    [correct[0], 'head -n 3 manuscript_v2.txt', correct[2]],
    [correct[0], correct[1], 'tail -n 3 manuscript_v1.txt manuscript_v2.txt'],
    [correct[0], correct[1], 'tail -n 1 manuscript_v1.txt'],
    [entry(correct[0], 1), correct[1], correct[2]],
    ['echo cat manuscript_v1.txt', correct[1], correct[2]],
    ['cat manuscript_page_v1.txt', correct[1], correct[2]],
  ]) assert.equal((await evaluate(0, commands)).passed, false);
  assert.equal((await evaluate(0, correct, 1)).passed, false);
});

test('diff differences (exit 1) are valid in default/unified form; missing files (exit 2) fail', async () => {
  for (const option of ['', '-u ', '--unified ']) {
    assert.equal((await evaluate(1, [entry(`diff ${option}manuscript_v1.txt manuscript_v2.txt`, 1)])).passed, true);
  }
  assert.equal((await evaluate(1, [entry('diff manuscript_v1.txt manuscript_v2.txt', 2)])).passed, false);
});

test('combined grading preserves the specific command/state failure reason', async () => {
  assert.match((await evaluate(0, ['head -n 3 manuscript_v2.txt'])).reason, /yêu cầu/);
  assert.match((await evaluate(0, ['cat manuscript_v1.txt', 'head -n 2 manuscript_v2.txt', 'tail -n1 manuscript_v1.txt manuscript_v2.txt'], 1)).reason, /Trạng thái/);
});
