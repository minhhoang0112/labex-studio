// Resume only the disk-swap proof for the newly initialized CLIENT01.
import 'dotenv/config';
import fs from 'node:fs';
import { azureClient } from '../server/services/azureComputeClient.js';
import { executeWindowsRemote } from '../server/services/windowsRemoteExecutor.js';

const reportPath = 'server/runtime/state/client-baseline.json';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
if (report.vmName !== 'LabEx-CLIENT01' || report.resourceGroup !== 'LabEx-India-RG' || report.recoveryTested || !report.activeDiskId || !report.snapshotId) throw new Error('No matching interrupted recovery proof.');
const client = azureClient(), rg = report.resourceGroup, name = report.vmName;
const record = text => { report.steps.push(text); fs.writeFileSync(reportPath, JSON.stringify(report, null, 2)); console.log(text); };
const guest = command => executeWindowsRemote(command, { labId: 'win-it-pc-onboarding-setup', target: 'client' });
try {
  await client.virtualMachines.deallocate(rg, name).pollUntilDone();
  const vm = await client.virtualMachines.get(rg, name);
  const oldId = vm.storageProfile.osDisk.managedDisk.id.toLowerCase();
  if (![report.originalDiskId.toLowerCase(), report.activeDiskId.toLowerCase()].includes(oldId)) throw new Error('VM disk changed unexpectedly; refusing resume.');
  let diskName = report.activeDiskId.split('/').at(-1);
  if (!['LabEx-CLIENT01-OS-Recovered', 'LabEx-CLIENT01-OS-Proven'].includes(diskName)) throw new Error('Unexpected recovery disk.');
  let priorRecoveryDisk;
  if (process.argv.includes('--clear-replayed-goal-state')) {
    if (diskName !== 'LabEx-CLIENT01-OS-Recovered' || oldId !== report.activeDiskId.toLowerCase()) throw new Error('Unexpected state for replay recovery.');
    await client.virtualMachines.start(rg, name).pollUntilDone();
    const inspection = await guest("[pscustomobject]@{computer=$env:COMPUTERNAME;marker=(Test-Path -LiteralPath 'C:\\LabEx\\RecoveryTest\\after-baseline.txt')} | ConvertTo-Json -Compress");
    if (inspection.exitCode !== 0) throw new Error('Could not inspect recovery replay.');
    report.replayInspection = JSON.parse(inspection.stdout);
    record('Latest Azure Run Command goal state replaced with read-only inspection.');
    await client.virtualMachines.powerOff(rg, name, { skipShutdown: false }).pollUntilDone();
    await client.virtualMachines.deallocate(rg, name).pollUntilDone();
    priorRecoveryDisk = diskName;
    diskName = 'LabEx-CLIENT01-OS-Proven';
    const snapshot = await client.snapshots.get(rg, report.snapshotName);
    const disk = await client.disks.createOrUpdate(rg, diskName, { location: vm.location, sku: { name: 'StandardSSD_LRS' },
      creationData: { createOption: 'Copy', sourceResourceId: snapshot.id }, tags: { purpose: 'LabEx-CLIENT01-active-os' } }).pollUntilDone();
    report.activeDiskId = disk.id; record('Fresh recovery disk prepared after clearing replayed command.');
  }
  if (oldId !== report.activeDiskId.toLowerCase()) {
    await client.virtualMachines.update(rg, name, { storageProfile: { osDisk: { name: diskName, managedDisk: { id: report.activeDiskId } } } }).pollUntilDone();
  }
  record('OS disk swap succeeded without changing immutable createOption.');
  await client.virtualMachines.start(rg, name).pollUntilDone();
  const result = await guest("if ($env:COMPUTERNAME -ne 'CLIENT01' -or (Test-Path -LiteralPath 'C:\\LabEx\\RecoveryTest\\after-baseline.txt')) { exit 1 }; Write-Output 'Recovered baseline verified'");
  report.proof = { exitCode: result.exitCode, timedOut: Boolean(result.timedOut) };
  if (result.exitCode !== 0 || result.timedOut) throw new Error('Recovered guest proof failed.');
  report.recoveryTested = true; report.verifiedAt = new Date().toISOString();
  record('Full OS recovery verified: CLIENT01 boots, and the post-baseline marker is absent.');
  let envText = fs.readFileSync('.env', 'utf8');
  for (const [key, value] of Object.entries({ WINDOWS_CLIENT_BASELINE_SNAPSHOT: report.snapshotName, WINDOWS_CLIENT_RECOVERY_TESTED: 'true' })) {
    const regex = new RegExp(`^${key}=.*$`, 'm'), line = `${key}=${value}`;
    envText = regex.test(envText) ? envText.replace(regex, () => line) : envText.trimEnd() + '\n' + line + '\n';
  }
  fs.writeFileSync('.env', envText);
  const originalName = report.originalDiskId.split('/').at(-1);
  if (originalName !== 'LabEx-CLIENT01-OS') throw new Error('Unexpected disposable original disk.');
  const original = await client.disks.get(rg, originalName);
  if (original.diskState !== 'Unattached') throw new Error('Original disk is not detached.');
  await client.disks.delete(rg, originalName).pollUntilDone();
  if (priorRecoveryDisk) {
    const prior = await client.disks.get(rg, priorRecoveryDisk);
    if (prior.diskState !== 'Unattached') throw new Error('Prior recovery disk remains attached.');
    await client.disks.delete(rg, priorRecoveryDisk).pollUntilDone();
  }
  record('Disposable original disk removed after successful recovery; no extra active OS disk retained.');
} catch (error) { record('Resume failed: ' + error.message); process.exitCode = 1; }
finally {
  try { await client.virtualMachines.deallocate(rg, name).pollUntilDone(); record('CLIENT01 deallocated.'); }
  catch { console.error('Check CLIENT01 deallocation immediately.'); process.exitCode = 1; }
}
