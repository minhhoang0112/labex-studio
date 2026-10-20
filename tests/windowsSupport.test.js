import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { getVmTargetConfig } from '../server/services/cloudConfig.js';
import { resolveVmTarget } from '../server/services/vmTargets.js';
import { createCloudVmRouter } from '../server/routes/cloudVm.js';
import { createWindowsFaultService, faultCommand } from '../server/services/windowsFaults.js';
import { withVmLock } from '../server/services/vmOperationLock.js';
import { createWindowsRemoteExecutor } from '../server/services/windowsRemoteExecutor.js';
import { clientTemplate } from '../scripts/provision-windows-client.mjs';
import { verifyWindowsRemote } from '../server/services/windowsRemoteVerifier.js';

test('client lab routing does not reuse the server address or password', () => {
  const env = { AZURE_VM_IP: 'server-address', WINDOWS_ADMIN_PASSWORD: 'server-secret' };
  assert.equal(getVmTargetConfig('client', env).publicIp, '');
  assert.equal(getVmTargetConfig('client', env).password, '');
  assert.equal(getVmTargetConfig('server', env).publicIp, 'server-address');
  assert.equal(resolveVmTarget({ labId: 'win-it-printer-spooler-fix' }), 'client');
  assert.equal(resolveVmTarget({ labId: 'win-server-iis-web' }), 'server');
  assert.throws(() => resolveVmTarget({ labId: 'win-it-printer-spooler-fix', target: 'server' }), /khớp/);
  assert.throws(() => resolveVmTarget({ target: 'attacker-vm' }), /hợp lệ/);
});

test('all cloud routes resolve the lab target and reject mismatches before invoking ARM', async t => {
  const app = express(); app.use(express.json());
  const calls = [];
  app.use(createCloudVmRouter({
    faults: { status: () => null, assertAccess: () => {} },
    status: async value => { calls.push(['status', value.target]); return value; },
    start: async value => { calls.push(['start', value.target]); return { accepted: true }; },
    stop: async value => { calls.push(['stop', value.target]); return { accepted: true }; },
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve)); t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  await fetch(base + '/cloud-vm/status?labId=win-it-printer-spooler-fix');
  for (const action of ['start', 'stop']) {
    assert.equal((await fetch(base + '/cloud-vm/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labId: 'win-it-printer-spooler-fix' }) })).status, 202);
  }
  assert.equal((await fetch(base + '/cloud-vm/status?labId=win-it-printer-spooler-fix&target=server')).status, 400);
  assert.deepEqual(calls, [['status', 'client'], ['start', 'client'], ['stop', 'client']]);
});

function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'labex-fault-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const operations = [];
  let healthy = false;
  const service = createWindowsFaultService({ journal: path.join(directory, 'session.json'), baseline: async () => {},
    execute: async (command, target) => {
      assert.equal(target.target, 'client');
      const operation = command.match(/-Operation '([A-Za-z]+)' -Scenario/)[1]; operations.push(operation);
      return { exitCode: operation === 'Healthy' && operations.includes('Inject') && !healthy ? 1 : 0 };
    }, ...options });
  return { service, operations, repair: () => { healthy = true; } };
}

test('fault lifecycle proves failure before repair, persists ownership and verifies reset', async t => {
  const { service, operations, repair } = fixture(t);
  const lab = 'win-it-printer-spooler-fix';
  assert.equal((await service.verify(lab)).supported, false);
  assert.equal((await service.prepare(lab)).state, 'active');
  assert.deepEqual(operations, ['Baseline', 'Healthy', 'Inject', 'Faulted']);
  assert.equal((await service.verify(lab)).passed, false);
  await assert.rejects(service.prepare('win-it-disk-cleanup-recovery'), error => error.code === 'CLOUD_SESSION_CONFLICT');
  assert.throws(() => service.assertAccess('win-it-pc-onboarding-setup', 'client'), error => error.code === 'CLOUD_SESSION_CONFLICT');
  repair(); assert.equal((await service.verify(lab)).passed, true);
  const result = await service.reset(lab);
  assert.equal(result.state, 'reset'); assert.equal(result.fullVmReset, false);
  assert.equal((await service.verify(lab)).passed, false);
});

test('baseline denial, injection failure and failed restore never become successful sessions', async t => {
  const denied = fixture(t, { baseline: async () => { throw new Error('no recovery'); } });
  await assert.rejects(denied.service.prepare('win-it-printer-spooler-fix'));
  assert.deepEqual(denied.operations, []);
  const failed = fixture(t, { execute: async () => ({ exitCode: 1 }) });
  await assert.rejects(failed.service.prepare('win-it-disk-cleanup-recovery'), error => error.code === 'CLOUD_FAULT_PREPARE_FAILED');
  assert.equal(failed.service.status().state, 'failed');
  await assert.rejects(failed.service.reset('win-it-disk-cleanup-recovery'), error => error.code === 'CLOUD_FAULT_RESET_FAILED');
  assert.equal(failed.service.status().state, 'failed');
});

test('guest execution cannot overlap fault operations on the same target', async () => {
  const execute = createWindowsRemoteExecutor({ client: () => assert.fail('ARM should not be called') });
  await withVmLock('client', 'test-fault', async () => {
    await assert.rejects(execute('hostname', { labId: 'win-it-pc-onboarding-setup' }), error => error.code === 'CLOUD_BUSY');
  });
});

test('a successful server command cannot certify a client task', async () => {
  const labId = 'win-it-pc-onboarding-setup', step = { id: 'win-it-onb-sec-2' };
  const faults = { assertAccess: () => {} };
  const wrongTarget = await verifyWindowsRemote(labId, step, { faults,
    readHistory: async () => [{ command: 'hostname', status: 0, target: 'LabEx-WinServer', computerName: 'LabEx-WinServer' }],
    execute: () => assert.fail('A command on the wrong machine must not reach the client grader.'),
  });
  assert.equal(wrongTarget.passed, false);
  const correctTarget = await verifyWindowsRemote(labId, step, { faults,
    readHistory: async () => [{ command: 'hostname', status: 0, target: 'LabEx-CLIENT01', computerName: 'CLIENT01' }],
    execute: async (_command, options) => { assert.equal(options.target, 'client'); return { exitCode: 0, target: 'LabEx-CLIENT01' }; },
  });
  assert.equal(correctTarget.passed, true);
});

test('deployment stays within the requested B2s/64 GiB and applies Azure-side 23:00 shutdown', () => {
  const template = clientTemplate();
  const vm = template.resources.find(resource => resource.type === 'Microsoft.Compute/virtualMachines');
  assert.equal(vm.properties.hardwareProfile.vmSize, 'Standard_B2s');
  assert.equal(vm.properties.storageProfile.osDisk.diskSizeGB, 64);
  assert.equal(template.parameters.password.type, 'secureString');
  const schedule = template.resources.find(resource => resource.type === 'Microsoft.DevTestLab/schedules');
  assert.equal(schedule.properties.dailyRecurrence.time, '2300');
  assert.equal(schedule.properties.timeZoneId, 'SE Asia Standard Time');
  const nsg = template.resources.find(resource => resource.type === 'Microsoft.Network/networkSecurityGroups');
  assert.notEqual(nsg.properties.securityRules[0].properties.sourceAddressPrefix, '*');
  const approved = clientTemplate(128, 'Standard_B2als_v2').resources.find(resource => resource.type === 'Microsoft.Compute/virtualMachines');
  assert.equal(approved.properties.storageProfile.osDisk.diskSizeGB, 128);
  assert.equal(approved.properties.hardwareProfile.vmSize, 'Standard_B2als_v2');
  assert.throws(() => clientTemplate(512, 'Standard_D8s_v5'));
  assert.throws(() => faultCommand("hosts'; bad", 'Inject'));
});
