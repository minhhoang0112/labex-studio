// Opt-in acceptance against an already running CLIENT01; never starts a VM.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = 'http://127.0.0.1:5000', labId = 'win-it-service-config-recovery';
const report = { passed: false, labId, checks: [], reset: false };
let priorSession, attempted = false;
async function request(path, body) {
  const response = await fetch(base + path, { ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(600000) });
  const value = await response.json();
  if (!response.ok) throw Error(value.message || value.error || response.status);
  return value;
}
async function command(text) {
  const value = await request('/api/cloud-vm/powershell', { labId, command: text });
  assert.equal(value.exitCode, 0, 'Remote test command must succeed');
  return value;
}
const verify = () => request('/api/verify', { labId, stepId: labId + '-sec-2' });
try {
  const status = await request('/api/cloud-vm/status?labId=' + labId);
  assert.equal(status.powerStateCode, 'PowerState/running', 'Do not start VM without approval');
  assert.ok(!status.faultSession || status.faultSession.state === 'reset', 'Leave learner sessions untouched');
  priorSession = status.faultSession?.id;
  attempted = true;
  console.log('Preparing real SCM service, proving healthy → broken with native error log...');
  await request('/api/cloud-vm/fault/prepare', { labId, confirm: true });
  assert.equal((await verify()).passed, false);
  report.checks.push('SCM service healthy baseline, injected config prevents startup, real application error and failed grade.');
  console.log('Repairing the same config field described in the GUI lesson...');
  await command(`'<settings><dataDirectory>C:\\LabEx\\PracticeFaults\\serviceconfig\\Data</dataDirectory></settings>' | Set-Content -LiteralPath 'C:\\LabEx\\PracticeFaults\\serviceconfig\\agent.config' -Encoding UTF8; Start-Service LabExDocumentAgentV2`);
  assert.equal((await verify()).passed, true);
  report.checks.push('Correct config + real LOCAL SERVICE process handles a new unpredictable request.');
  await command(`Stop-Service LabExDocumentAgentV2`);
  assert.equal((await verify()).passed, false);
  report.checks.push('Old receipt with stopped service cannot pass.');
  await command(`Start-Service LabExDocumentAgentV2; 'wrong data' | Set-Content -LiteralPath 'C:\\LabEx\\PracticeFaults\\serviceconfig\\Data\\catalog.txt' -Encoding UTF8`);
  assert.equal((await verify()).passed, false);
  report.checks.push('Running service with damaged source cannot pass.');
  await command(`[IO.File]::WriteAllText('C:\\LabEx\\PracticeFaults\\serviceconfig\\Data\\catalog.txt','Finance catalog revision 7; retain original data.',[Text.UTF8Encoding]::new($false))`);
  assert.equal((await verify()).passed, true);
  report.passed = true;
} catch (error) { report.error = error.message; process.exitCode = 1; }
finally {
  if (attempted) {
    try {
      const status = await request('/api/cloud-vm/status?labId=' + labId);
      if (status.faultSession?.labId === labId && status.faultSession.id !== priorSession && status.faultSession.state !== 'reset') {
        console.log('Resetting only this owned service, event source and directory...');
        report.reset = (await request('/api/cloud-vm/fault/reset', { labId, confirm: true })).state === 'reset';
      }
      assert.equal(report.reset, true);
    } catch (error) { report.resetError = error.message; report.passed = false; process.exitCode = 1; }
  }
  await fs.writeFile('.artifacts/it-support-service-live.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
