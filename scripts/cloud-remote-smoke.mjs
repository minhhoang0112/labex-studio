import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { executeWindowsRemote } from '../server/services/windowsRemoteExecutor.js';
import { verifyWindowsRemote } from '../server/services/windowsRemoteVerifier.js';

const report = { checkedAt: new Date().toISOString(), transport: 'azure-run-command', checks: [] };
const workspace = 'win-cloud-smoke';
const workspaceOptions = { labId: workspace, target: 'server', workspaceOnly: true };
const probe = await executeWindowsRemote("[pscustomobject]@{ computer=$env:COMPUTERNAME; identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name; version=$PSVersionTable.PSVersion.ToString(); ad=[bool](Get-Module -ListAvailable ActiveDirectory); iis=[bool](Get-Module -ListAvailable WebAdministration) } | ConvertTo-Json -Compress", workspaceOptions);
assert.equal(probe.exitCode, 0);
assert.ok(probe.computerName);
report.environment = { ...probe, stderr: undefined };
console.log('PASS remote PowerShell executed on', probe.computerName, probe.identity);
const negative = await verifyWindowsRemote('win-file-system-ntfs', { id: 'win-fs-03-sec-1' }, {
  execute: (command) => executeWindowsRemote(command, workspaceOptions),
});
assert.equal(negative.passed, false, 'No FinanceDocs exists in the test-only workspace');
report.checks.push({ name: 'missing NTFS artifact fails the real remote grader', passed: true });
// Create and remove ONLY a directory belonging to this explicit smoke test.
const created = await executeWindowsRemote("New-Item -ItemType Directory -Path ./FinanceDocs -Force | Out-Null", workspaceOptions);
assert.equal(created.exitCode, 0);
try {
  const positive = await verifyWindowsRemote('win-file-system-ntfs', { id: 'win-fs-03-sec-1' }, {
    execute: command => executeWindowsRemote(command, workspaceOptions),
  });
  assert.equal(positive.passed, true);
  report.checks.push({ name: 'created NTFS artifact passes the real remote grader', passed: true });
} finally {
  await executeWindowsRemote("Remove-Item -LiteralPath ./FinanceDocs -Force", workspaceOptions);
}
report.complete = true;
await fs.mkdir('.artifacts', { recursive: true });
await fs.writeFile('.artifacts/cloud-remote-smoke.json', JSON.stringify(report, null, 2));
console.log('PASS real remote verifier negative/positive; test artifact removed.');
