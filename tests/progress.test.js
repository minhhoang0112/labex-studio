import test from 'node:test';
import assert from 'node:assert/strict';
import { courseProgress, isLabCompleted, validPassedSteps, unmarkProgressStep, resetLocalLabProgress, saveProgress } from '../client/src/lib/progress.js';

function storage(action) {
  const values = new Map();
  const oldStorage = globalThis.localStorage, oldWindow = globalThis.window;
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  globalThis.window = new EventTarget();
  try { action(values); }
  finally { globalThis.localStorage = oldStorage; globalThis.window = oldWindow; }
}
const key = 'labex.local.progress.v2';

test('curriculum changes invalidate stale completion and duplicate or removed task IDs', () => storage(values => {
  const lab = { id: 'lesson', course_id: 'linux', step_ids: ['a-v4', 'b-v4'] };
  const entry = { passed: ['a-v4', 'a-v4', 'b-v3'], complete: true, total: 2, courseId: 'linux' };
  values.set(key, JSON.stringify({ lesson: entry }));
  assert.deepEqual(validPassedSteps(lab, entry), ['a-v4']);
  assert.equal(isLabCompleted(lab, entry), false);
  assert.equal(courseProgress('linux', [lab]), 0);
  assert.equal(courseProgress('linux', ['lesson']), 0);
  assert.equal(saveProgress(lab, 'summary', 'b-v4').complete, true);
  assert.equal(courseProgress('linux', [lab]), 1);
}));

test('rechecking a task removes its pass and filters stale IDs against the current curriculum', () => storage(values => {
  const lab = { id: 'lesson', step_ids: ['new-a', 'new-b'] };
  values.set(key, JSON.stringify({ lesson: { passed: ['new-a', 'new-b', 'old'], total: 3, complete: true } }));
  const saved = unmarkProgressStep(lab, 'new-b');
  assert.deepEqual(saved.passed, ['new-a']);
  assert.equal(saved.complete, false);
}));

test('reset deletes only the selected lesson and leaves other progress and settings intact', () => storage(values => {
  values.set(key, JSON.stringify({ one: { passed: ['one'] }, two: { passed: ['two'] } }));
  values.set('labex.language', 'vi');
  resetLocalLabProgress('one');
  assert.deepEqual(JSON.parse(values.get(key)), { two: { passed: ['two'] } });
  assert.equal(values.get('labex.language'), 'vi');
}));
