// Explicit live test, dedicated CLIENT01. Restores initial deallocated power state.
import 'dotenv/config';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { listLabs } from '../server/data/catalog.js';
import { azureClient } from '../server/services/azureComputeClient.js';
import { getVmTargetConfig } from '../server/services/cloudConfig.js';
import { windowsFaults, assertClientBaseline } from '../server/services/windowsFaults.js';
import { executeWindowsRemote } from '../server/services/windowsRemoteExecutor.js';
import { verifyWindowsRemote } from '../server/services/windowsRemoteVerifier.js';
import { archiveCommand } from './archive-windows-smoke-evidence.mjs';

if (!process.argv.includes('--live')) throw new Error('Use --live only for an authorized CLIENT01 test.');
const config = getVmTargetConfig('client');
assert.equal(config.vmName, 'LabEx-CLIENT01');
await assertClientBaseline();
if (windowsFaults.status() && windowsFaults.status().state !== 'reset') throw new Error('Unfinished learner fault session; no test changes made.');
const arm = azureClient();
const before = await arm.virtualMachines.instanceView(config.resourceGroup, config.vmName);
const originalPower = before.statuses?.find(item => item.code.startsWith('PowerState/'))?.code;
// Never displace an active learner desktop session.
assert.equal(originalPower, 'PowerState/deallocated', 'Live test requires an idle, deallocated CLIENT01.');
const labs = listLabs().filter(lab => lab.course_id === 'windows-11-it-support-troubleshooting' && lab.curriculum_version === 3).sort((a,b) => a.order-b.order);
const rules = JSON.parse(fs.readFileSync('server/data/windows-support-rules.json', 'utf8'));
const reportFile = '.artifacts/windows-support-expanded-live.json';
const previous = process.argv.includes('--resume') ? JSON.parse(fs.readFileSync(reportFile,'utf8')) : null;
const report = { realAzure: true, target: config.vmName, originalPower, startedAt: new Date().toISOString(), checks: previous?.checks.filter(check=>check.exitCode === 0 || check.reset) || [] };
let activeLab;
function save() { fs.writeFileSync('.artifacts/windows-support-expanded-live.json', JSON.stringify(report, null, 2)); }
try {
  console.log('Starting idle CLIENT01 for live curriculum checks; initial deallocated state will be restored.');
  await arm.virtualMachines.start(config.resourceGroup, config.vmName).pollUntilDone();
  const completed = new Set(report.checks.flatMap(check=>check.labs || [check.lab]));
  const normal = labs.filter(lab => !lab.fault_scenario && !completed.has(lab.id));
  for (let i=0; i<normal.length; i+=3) {
    const batch = normal.slice(i,i+3);
    console.log('Checking learner commands and probes:', batch.map(lab=>lab.id).join(', '));
    const payload = batch.flatMap(lab => lab.steps.map(step => ({ lab: lab.id, step: step.id, command: step.hint, probe: rules[step.id].probe })));
    const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
    const command = `$items=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded}')) | ConvertFrom-Json
$failed=@(); $passed=0
foreach ($item in $items) {
  try {
    $labRoot='C:\\LabEx\\Labs\\'+$item.lab
    $null=& ([ScriptBlock]::Create($item.command))
    $value=& ([ScriptBlock]::Create($item.probe))
    if ($value -isnot [bool] -or -not $value) { throw 'State probe failed' }
    $passed++
  } catch { $failed+=@{step=$item.step; error=$_.Exception.Message} }
}
@{passed=$passed; failed=@($failed)} | ConvertTo-Json -Depth 5 -Compress
if ($failed.Count) { exit 1 }`;
    assert.ok(command.length <= 16000);
    const result = await executeWindowsRemote(command, { labId: batch[0].id, target: 'client' });
    const detail = result.stdout.trim();
    report.checks.push({ type: 'configuration-diagnostics', labs: batch.map(lab=>lab.id), exitCode: result.exitCode, timedOut: result.timedOut, detail, stderr: result.stderr }); save();
    assert.equal(result.exitCode, 0, 'Live lesson failed: ' + detail + ' ' + result.stderr);
    assert.equal(result.outputTruncated, false, 'Live report truncated.');
    console.log('PASS live learner commands + state probes:', batch.map(lab=>lab.id).join(', '));
  }
  for (const lab of labs.filter(lab=>lab.fault_scenario && !completed.has(lab.id))) {
    activeLab = lab.id;
    console.log('Preparing real fault:', activeLab);
    await windowsFaults.prepare(activeLab);
    assert.equal((await verifyWindowsRemote(activeLab, lab.steps[0])).passed, true, 'Diagnostic state must match injected fault.');
    assert.equal((await verifyWindowsRemote(activeLab, lab.steps[1])).passed, false, 'Broken state must fail repair grading.');
    const result = await executeWindowsRemote(lab.steps[1].hint, { labId: activeLab, target: 'client' });
    assert.equal(result.exitCode, 0, result.stderr);
    assert.equal((await verifyWindowsRemote(activeLab, lab.steps[1])).passed, true, 'Repair must pass functional probe.');
    assert.equal((await windowsFaults.reset(activeLab)).state, 'reset');
    report.checks.push({ type: 'fault-injection', lab: activeLab, injected: true, diagnostic: true, negative: true, repaired: true, reset: true }); save();
    console.log('PASS live fault / diagnostic / negative / repair / functional check / reset:', activeLab);
    activeLab = null;
  }
  const archived = await executeWindowsRemote(archiveCommand(labs.map(lab=>lab.id)), {target:'client',workspaceOnly:true});
  assert.equal(archived.exitCode,0,archived.stderr);
  report.smokeEvidenceArchived = true;
  console.log(archived.stdout.trim());
  report.passed = true;
} catch (error) {
  report.error = error.message; process.exitCode = 1; console.error(error.message);
} finally {
  if (activeLab && windowsFaults.status()?.labId === activeLab && windowsFaults.status()?.state !== 'reset') {
    try { await windowsFaults.reset(activeLab); report.failedScenarioReset = true; }
    catch { report.failedScenarioReset = false; }
  }
  try { await arm.virtualMachines.deallocate(config.resourceGroup, config.vmName).pollUntilDone(); report.deallocated = true; }
  catch { report.deallocated = false; process.exitCode = 1; }
  report.finishedAt = new Date().toISOString(); save();
  console.log(JSON.stringify({ passed: report.passed || false, deallocated: report.deallocated, checks: report.checks.length }));
}
