// Only the two disposable disks from CLIENT01's recorded recovery proof.
import 'dotenv/config';
import fs from 'node:fs';
import { azureClient } from '../server/services/azureComputeClient.js';
const file = 'server/runtime/state/client-baseline.json';
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!report.recoveryTested || report.vmName !== 'LabEx-CLIENT01' || report.resourceGroup !== 'LabEx-India-RG') throw new Error('Recovery is not proven; retain all disks.');
const client = azureClient();
const vm = await client.virtualMachines.get(report.resourceGroup, report.vmName);
if (vm.storageProfile.osDisk.managedDisk.id.toLowerCase() !== report.activeDiskId.toLowerCase()) throw new Error('Active disk differs from proven disk.');
for (const name of ['LabEx-CLIENT01-OS', 'LabEx-CLIENT01-OS-Recovered']) {
  if (report.activeDiskId.toLowerCase().endsWith('/' + name.toLowerCase())) continue;
  let disk;
  try { disk = await client.disks.get(report.resourceGroup, name); }
  catch (error) { if (error.statusCode === 404) continue; throw error; }
  if (disk.diskState !== 'Unattached') throw new Error('Refusing to delete an attached disk.');
  if (name === 'LabEx-CLIENT01-OS' && disk.id.toLowerCase() !== report.originalDiskId.toLowerCase()) throw new Error('Original disk ID mismatch.');
  await client.disks.delete(report.resourceGroup, name).pollUntilDone();
  report.steps.push('Removed disposable detached recovery-test disk: ' + name);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log('Removed disposable detached disk:', name);
}
