// Move only curriculum test outputs to a separate VM evidence folder after a
// successful live check, so learners do not inherit pre-satisfied task files.
import 'dotenv/config';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { listLabs } from '../server/data/catalog.js';
import { azureClient } from '../server/services/azureComputeClient.js';
import { getVmTargetConfig } from '../server/services/cloudConfig.js';
import { windowsFaults } from '../server/services/windowsFaults.js';
import { executeWindowsRemote } from '../server/services/windowsRemoteExecutor.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export function archiveCommand(ids) {
assert.equal(ids.length,21);
assert.ok(ids.every(id=>/^win-it-[a-z0-9-]+$/.test(id)));
const encoded=Buffer.from(JSON.stringify(ids),'utf8').toString('base64');
const archive='C:\\LabEx\\SmokeEvidence\\expanded-support-20261020';
return `if ($env:COMPUTERNAME -ne 'CLIENT01') { throw 'Wrong VM' }
$ids=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded}')) | ConvertFrom-Json
$archive='${archive}'
$sourceBase=[IO.Path]::GetFullPath('C:\\LabEx\\Labs\\')
$evidenceBase=[IO.Path]::GetFullPath('C:\\LabEx\\SmokeEvidence\\')
foreach ($parent in @('C:\\LabEx','C:\\LabEx\\Labs','C:\\LabEx\\SmokeEvidence',$archive)) {
  if ((Test-Path -LiteralPath $parent) -and ((Get-Item -LiteralPath $parent -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Reparse parent refused' }
}
New-Item -ItemType Directory -Path $archive -Force | Out-Null
foreach ($id in $ids) {
  $source=[IO.Path]::GetFullPath((Join-Path $sourceBase $id)); $destination=[IO.Path]::GetFullPath((Join-Path $archive $id))
  if (-not $source.StartsWith($sourceBase,[StringComparison]::OrdinalIgnoreCase) -or -not $destination.StartsWith($evidenceBase,[StringComparison]::OrdinalIgnoreCase)) { throw 'Outside intended workspace' }
  if (Test-Path -LiteralPath $destination) { throw 'Evidence destination exists; refusing overwrite' }
  if (-not (Test-Path -LiteralPath $source)) { continue }
  $items=@(Get-Item -LiteralPath $source -Force)+@(Get-ChildItem -LiteralPath $source -Recurse -Force)
  if (@($items | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { throw 'Reparse point refused' }
  Move-Item -LiteralPath $source -Destination $destination
}
Write-Output 'Archived test outputs; learner task directories are empty.'`;
}
async function main() {
if (!process.argv.includes('--live')) throw new Error('Explicit --live required.');
const report=JSON.parse(fs.readFileSync('.artifacts/windows-support-expanded-live.json','utf8'));
assert.equal(report.passed,true);
assert.equal(windowsFaults.status()?.state,'reset');
const config=getVmTargetConfig('client'); assert.equal(config.vmName,'LabEx-CLIENT01');
const arm=azureClient();
const view=await arm.virtualMachines.instanceView(config.resourceGroup,config.vmName);
assert.ok(view.statuses.some(status=>status.code === 'PowerState/deallocated'),'Do not displace a running learner VM.');
const labs=listLabs().filter(lab=>lab.course_id === 'windows-11-it-support-troubleshooting' && lab.curriculum_version === 3);
assert.equal(labs.length,21);
const ids=labs.map(lab=>lab.id);
assert.ok(ids.every(id=>/^win-it-[a-z0-9-]+$/.test(id)));
const archive='C:\\LabEx\\SmokeEvidence\\expanded-support-20261020';
try {
  await arm.virtualMachines.start(config.resourceGroup,config.vmName).pollUntilDone();
  const command=archiveCommand(ids);
  const result=await executeWindowsRemote(command,{target:'client',workspaceOnly:true});
  assert.equal(result.exitCode,0,result.stderr);
  report.smokeEvidenceArchived=true; report.smokeEvidenceFolder=archive.replaceAll('\\\\','\\');
  console.log(result.stdout.trim());
} finally {
  await arm.virtualMachines.deallocate(config.resourceGroup,config.vmName).pollUntilDone();
  report.deallocated=true;
  fs.writeFileSync('.artifacts/windows-support-expanded-live.json',JSON.stringify(report,null,2));
}
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
