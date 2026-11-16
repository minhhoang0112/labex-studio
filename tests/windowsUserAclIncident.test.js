import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { loadLab } from '../server/data/catalog.js';
import { createWindowsFaultService, faultCommand } from '../server/services/windowsFaults.js';

const labId = 'win-it-user-folder-permissions';
test('NTFS ticket is attached to client with a single functional grading contract and dated live status', () => {
  const lab = loadLab(labId);
  assert.equal(lab.target_vm, 'client');
  assert.equal(lab.validation_status, 'live-client-verified-2026-10-28');
  assert.equal(lab.teaching_format, 'ticket-gui-v2');
  assert.equal(lab.steps.length, 1);
  assert.equal(lab.steps[0].id, lab.sections.find(s => s.need_verify).id);
  assert.equal(lab.steps[0].verification.kind, 'windows-remote');
  const command = faultCommand('useracl', 'Healthy');
  assert.ok(command.length < 16000);
  assert.ok(Buffer.from(command + 'x'.repeat(300), 'utf16le').toString('base64').length < 31000);
  const packed = command.match(/FromBase64String\('([^']+)'\)/)[1];
  const source = gunzipSync(Buffer.from(packed, 'base64')).toString('utf8');
  assert.ok(!source.includes('__LABEX_NTFS_'));
  const probe = fs.readFileSync(new URL('../server/runtime/windows/ntfs-user-probe.cs', import.meta.url)).toString('base64');
  assert.ok(source.includes(probe));
});
test('NTFS session requires baseline positive then injected negative; false and timeout never pass', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'labex-ntfs-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const phases = [];
  let result = { exitCode: 0 };
  const service = createWindowsFaultService({ journal: path.join(directory, 'journal.json'), baseline: async () => {},
    execute: async (command, options) => {
      assert.equal(options.target, 'client');
      phases.push(command.match(/-Operation '([A-Za-z]+)' -Scenario/)[1]);
      return result;
    },
  });
  assert.equal((await service.verify(labId)).supported, false);
  await service.prepare(labId);
  assert.deepEqual(phases, ['Baseline', 'Healthy', 'Inject', 'Faulted']);
  result = { exitCode: 1 }; assert.equal((await service.verify(labId)).passed, false);
  result = { exitCode: 2 }; assert.equal((await service.verify(labId)).passed, false);
  result = { exitCode: 0, timedOut: true }; assert.equal((await service.verify(labId)).passed, false);
  result = { exitCode: 0 }; assert.equal((await service.verify(labId)).passed, true);
  await service.reset(labId);
  assert.equal((await service.verify(labId)).supported, false);
});
