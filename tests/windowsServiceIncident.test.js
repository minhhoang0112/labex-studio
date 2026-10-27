import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { loadLab } from '../server/data/catalog.js';
import { createWindowsFaultService, faultCommand } from '../server/services/windowsFaults.js';

const labId = 'win-it-service-config-recovery';
test('service ticket needs actual fresh functional probe, retains timeout and cannot verify outside its session', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'labex-service-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  let result = { exitCode: 0 };
  const phases = [];
  const faults = createWindowsFaultService({ journal: path.join(directory, 'journal.json'), baseline: async () => {},
    execute: async (command, options) => {
      assert.equal(options.target, 'client');
      assert.equal(options.labId, labId);
      const phase = command.match(/-Operation '([A-Za-z]+)' -Scenario/)[1];
      phases.push(phase);
      return result;
    },
  });
  assert.equal((await faults.verify(labId)).supported, false);
  await faults.prepare(labId);
  assert.deepEqual(phases, ['Baseline', 'Healthy', 'Inject', 'Faulted']);
  result = { exitCode: 1 };
  assert.equal((await faults.verify(labId)).passed, false);
  result = { exitCode: 0, timedOut: true };
  const incomplete = await faults.verify(labId);
  assert.equal(incomplete.passed, false);
  assert.equal(incomplete.timedOut, true);
  result = { exitCode: 2 };
  assert.match((await faults.verify(labId)).reason, /fixture/);
  result = { exitCode: 0 };
  assert.equal((await faults.verify(labId)).passed, true);
  await faults.reset(labId);
  assert.equal((await faults.verify(labId)).supported, false);
});
test('service lesson uses GUI-first presentation without learner-generated evidence files', () => {
  const lab = loadLab(labId);
  assert.equal(lab.teaching_format, 'ticket-gui-v2');
  assert.equal(lab.target_vm, 'client');
  assert.equal(lab.steps.length, 1);
  assert.equal(lab.sections.find(s => s.kind === 'task').id, lab.steps[0].id);
  assert.equal(lab.steps[0].verification.kind, 'windows-remote');
  assert.ok(lab.sections[0].practice_brief.ticket);
  const command = faultCommand('serviceconfig', 'Healthy');
  assert.ok(!command.includes('__LABEX_SERVICE_SOURCE_B64__'));
  assert.ok(command.length < 16000);
  assert.ok(Buffer.from(command + 'x'.repeat(300), 'utf16le').toString('base64').length < 31000);
  const packed = command.match(/FromBase64String\('([^']+)'\)/)[1];
  const unpacked = gunzipSync(Buffer.from(packed, 'base64')).toString('utf8');
  assert.ok(unpacked.includes('function Test-Function'));
  assert.ok(!unpacked.includes('__LABEX_SERVICE_SOURCE_B64__'));
  assert.throws(() => faultCommand('serviceconfig', 'DeleteEverything'));
});
