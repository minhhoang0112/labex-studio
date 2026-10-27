import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLab } from '../server/data/catalog.js';
import { compareLearningOrder } from '../server/services/windowsPracticalCurriculum.js';

test('GUI curriculum keeps the original grading contract and progress IDs', () => {
  for (const id of ['win-it-file-in-use', 'win-it-scheduled-backup-permissions']) {
    const original = JSON.parse(fs.readFileSync(new URL(`../server/data/labs/${id}.json`, import.meta.url)));
    const served = loadLab(id);
    assert.equal(served.teaching_format, 'ticket-gui-v2');
    assert.deepEqual(served.steps.map(s => [s.id, s.verification, s.verify_command]), original.steps.map(s => [s.id, s.verification, s.verify_command]));
    for (const section of served.sections.filter(s => s.kind !== 'summary')) {
      assert.ok(section.practice_brief.tasks.length >= 3);
      assert.ok(section.practice_brief.acceptance.length >= 1);
      assert.equal(section.practice_brief.hints.length, 3);
      assert.equal(section.content_vi, original.sections.find(s => s.id === section.id).content_vi);
    }
  }
});
test('practical ordering is shared by course API and next-lab sequence without renumbering legacy IDs', () => {
  const labs = ['win-it-file-extension-fix', 'win-it-file-in-use', 'win-it-scheduled-backup-permissions'].map(loadLab).sort(compareLearningOrder);
  assert.deepEqual(labs.map(l => l.id), ['win-it-scheduled-backup-permissions', 'win-it-file-in-use', 'win-it-file-extension-fix']);
  assert.equal(labs[0].order, 26);
  assert.equal(loadLab('win-fnd-system-tools').teaching_format, undefined);
});
