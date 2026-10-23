import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createAzureVmService } from '../server/services/azureVmService.js';
import { createWindowsRemoteExecutor } from '../server/services/windowsRemoteExecutor.js';
import { createCloudVmRouter } from '../server/routes/cloudVm.js';
import { verifyWindowsRemote } from '../server/services/windowsRemoteVerifier.js';
import { cloudError } from '../server/services/cloudConfig.js';

test('VM control sends actual ARM start/deallocate and rejects overlapping operations', async () => {
  const calls = [];
  let finish;
  const complete = new Promise(resolve => { finish = resolve; });
  const client = { virtualMachines: {
    instanceView: async () => ({ statuses: [{ code: 'PowerState/deallocated', displayStatus: 'VM deallocated' }] }),
    start: (...args) => { calls.push(['start', ...args]); return { poll: async () => {}, pollUntilDone: () => complete }; },
    deallocate: (...args) => { calls.push(['deallocate', ...args]); return { poll: async () => {}, pollUntilDone: async () => {} }; },
  } };
  const service = createAzureVmService({ client: () => client, config: () => ({ subscriptionId: 'sub', resourceGroup: 'rg', vmName: 'vm' }) });
  assert.equal((await service.status()).powerState, 'VM deallocated');
  assert.equal((await service.start()).accepted, true);
  await assert.rejects(service.stop(), error => error.status === 409);
  finish(); await new Promise(resolve => setImmediate(resolve));
  await service.stop();
  assert.deepEqual(calls, [['start', 'rg', 'vm'], ['deallocate', 'rg', 'vm']]);
});

test('ARM failure never becomes a successful start or a guessed deallocated status', async () => {
  const service = createAzureVmService({ client: () => { throw cloudError('Login required', 503, 'CLOUD_AUTH_REQUIRED'); },
    config: () => ({ subscriptionId: 'sub' }) });
  assert.equal((await service.status()).powerState, 'unknown');
  await assert.rejects(service.start(), error => error.code === 'CLOUD_AUTH_REQUIRED');
});

test('PowerShell runs through the Azure agent and validates an unpredictable result envelope', async () => {
  let script;
  const client = { virtualMachines: { runCommand: (_rg, _vm, input) => {
    script = input.script[0];
    const marker = script.match(/LABEX_RESULT_[a-f0-9]+:/)[0];
    return { pollUntilDone: async () => ({ value: [{ code: 'ComponentStatus/StdOut/succeeded',
      message: marker + JSON.stringify({ exitCode: 0, executionConfirmed:true, stdout: 'REMOTE', stderr: '', computerName: 'VM01', identity: 'NT AUTHORITY\\SYSTEM', timedOut: false }) }] }) };
  } } };
  const execute = createWindowsRemoteExecutor({ client: () => client, config: () => ({ resourceGroup: 'rg', vmName: 'vm' }) });
  const result = await execute('whoami', { labId: 'win-powershell-basics' });
  assert.equal(result.transport, 'azure-run-command');
  assert.equal(result.target, 'vm');
  assert.match(script, /WorkingDirectory/);
  const encoded = script.match(/\$payload='([^']+)'/)[1];
  assert.ok(Buffer.from(encoded, 'base64').toString('utf16le').includes('whoami'));
  assert.match(Buffer.from(encoded,'base64').toString('utf16le'),/finally.*LABEX_EXECUTED_/);
  const broken = createWindowsRemoteExecutor({ client: () => ({ virtualMachines: { runCommand: () => ({ pollUntilDone: async () => ({ value: [] }) }) } }), config: () => ({}) });
  await assert.rejects(broken('whoami'), error => error.code === 'CLOUD_REMOTE_PROTOCOL');
  const empty = createWindowsRemoteExecutor({client:()=>({virtualMachines:{runCommand:(_rg,_vm,input)=>({pollUntilDone:async()=>({value:[{code:'StdOut',message:input.script[0].match(/LABEX_RESULT_[a-f0-9]+:/)[0]+JSON.stringify({exitCode:0,stdout:'',stderr:'',computerName:'VM01',timedOut:false})}]})})}}),config:()=>({})});
  await assert.rejects(empty('Write-Output expected'),error=>error.code==='CLOUD_REMOTE_PROTOCOL');
});

test('remote GUI grading checks actual AD/IIS state, rejects failures and ignores local command history', async () => {
  let command;
  const execute = async value => { command = value; return { exitCode: 1, timedOut: false, target: 'vm' }; };
  const result = await verifyWindowsRemote('win-server-iis-web', { id: 'win-iis-05-sec-1' }, { execute });
  assert.equal(result.passed, false);
  assert.match(command, /Get-Website -Name PortalCorp/);
  assert.match(command, /8080/);
  const missingRole = await verifyWindowsRemote('win-server-iis-web', { id: 'win-iis-05-sec-1' }, {
    execute: async () => ({ exitCode: 42, timedOut: false }),
  });
  assert.equal(missingRole.supported, false);
  assert.match(missingRole.reason, /WebAdministration/);
  const noHistory = await verifyWindowsRemote('win-powershell-basics', { id: 'win-ps-01-sec-2' }, {
    readHistory: async () => [{ command: 'Get-Process | Get-Member', status: 0 }],
    execute: () => assert.fail('Local history must not count as VM work'),
  });
  assert.equal(noHistory.passed, false);
});

test('cloud command API requires a valid Windows lab and returns remote failures truthfully', async t => {
  const app = express(); app.use(express.json());
  let calls = 0;
  app.use(createCloudVmRouter({ findLab: id => id === 'win-test', execute: async () => { calls++; throw cloudError('VM unavailable'); } }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve)); t.after(() => server.close());
  const post = body => fetch(`http://127.0.0.1:${server.address().port}/cloud-vm/powershell`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  assert.equal((await post({ labId: 'linux-test', command: 'whoami' })).status, 400);
  assert.equal(calls, 0);
  assert.equal((await post({ labId: 'win-test', command: 'whoami' })).status, 503);
  assert.equal(calls, 1);
});
