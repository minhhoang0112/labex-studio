// Real cloud checks on the dedicated CLIENT01 only; never touches LabEx-WinServer.
import 'dotenv/config';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { azureClient } from '../server/services/azureComputeClient.js';
import { getVmTargetConfig } from '../server/services/cloudConfig.js';
import { windowsFaults, assertClientBaseline } from '../server/services/windowsFaults.js';
import { executeWindowsRemote } from '../server/services/windowsRemoteExecutor.js';
import { verifyWindowsRemote } from '../server/services/windowsRemoteVerifier.js';

const config = getVmTargetConfig('client');
if (config.vmName !== 'LabEx-CLIENT01') throw new Error('Unexpected target.');
await assertClientBaseline();
if (windowsFaults.status() && windowsFaults.status().state !== 'reset') throw new Error('An unfinished learner session already exists. Refusing smoke test.');
const client = azureClient();
const report = { checkedAt: new Date().toISOString(), realAzure: true, target: config.vmName, checks: [] };
const scenarios = [
  { labId: 'win-it-printer-spooler-fix', stepId: 'win-it-pr-sec-2', repair: `Stop-Service Spooler -Force
$queue=Join-Path $env:windir 'System32\\spool\\PRINTERS'
foreach ($name in @('LabEx-orphan.SHD','LabEx-orphan.SPL')) { $file=Join-Path $queue $name; if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file -Force } }
Start-Service Spooler` },
  { labId: 'win-it-network-dns-troubleshoot', stepId: 'win-it-net-sec-2', repair: `$file=Join-Path $env:windir 'System32\\drivers\\etc\\hosts'
$lines=@(Get-Content -LiteralPath $file | Where-Object { $_ -notmatch '(^|\\s)portal\\.company\\.local(\\s|$)' })
[IO.File]::WriteAllLines($file,@($lines)+@('127.0.0.1 portal.company.local'))
Clear-DnsClientCache` },
  { labId: 'win-it-disk-cleanup-recovery', stepId: 'win-it-dsk-sec-2', repair: `$directory=[IO.Path]::GetFullPath('C:\\Windows\\Temp\\DummyLogs')
if ($directory -ne (Join-Path $env:windir 'Temp\\DummyLogs')) { throw 'Unexpected fixture location' }
if ((Get-Item -LiteralPath $directory).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Unexpected reparse point' }
for ($i=1; $i -le 4; $i++) { Remove-Item -LiteralPath (Join-Path $directory "application-$i.log") -Force }` },
];
let activeLab;
try {
  await client.virtualMachines.start(config.resourceGroup, config.vmName).pollUntilDone();
  for (const scenario of scenarios) {
    activeLab = scenario.labId;
    await windowsFaults.prepare(activeLab);
    assert.equal((await verifyWindowsRemote(activeLab, { id: scenario.stepId })).passed, false, 'Unrepaired actual fault must fail.');
    const repaired = await executeWindowsRemote(scenario.repair, { labId: activeLab, target: 'client' });
    assert.equal(repaired.exitCode, 0, 'Reviewed repair must execute on CLIENT01.');
    assert.equal((await verifyWindowsRemote(activeLab, { id: scenario.stepId })).passed, true, 'Actual repaired state must pass.');
    const reset = await windowsFaults.reset(activeLab);
    assert.equal(reset.state, 'reset');
    report.checks.push({ labId: activeLab, injectedFaultProved: true, negative: true, positive: true, reset: true });
    console.log('PASS actual fault / negative / repair / positive / reset:', activeLab);
    activeLab = null;
  }
  report.complete = true;
} catch (error) {
  report.error = error.code || error.message;
  console.error('Cloud smoke failed:', report.error);
  process.exitCode = 1;
} finally {
  if (activeLab && windowsFaults.status()?.labId === activeLab && windowsFaults.status()?.state !== 'reset') {
    try { await windowsFaults.reset(activeLab); } catch { report.resetRequiresRecovery = true; }
  }
  try {
    await client.virtualMachines.deallocate(config.resourceGroup, config.vmName).pollUntilDone();
    report.deallocated = true;
    console.log('CLIENT01 deallocated.');
  } catch { report.deallocated = false; process.exitCode = 1; }
  fs.mkdirSync('.artifacts', { recursive: true });
  fs.writeFileSync('.artifacts/windows-support-cloud-smoke.json', JSON.stringify(report, null, 2));
}
