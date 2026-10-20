// Initializes ONLY the newly-created dedicated CLIENT01, then proves full OS-disk recovery.
// Writes no guest credentials to output. Leaves CLIENT01 deallocated even on failure.
import 'dotenv/config';
import fs from 'node:fs';
import { AzureCliCredential } from '@azure/identity';
import { azureClient } from '../server/services/azureComputeClient.js';
import { enableProjectAzureCli, getVmTargetConfig } from '../server/services/cloudConfig.js';
import { executeWindowsRemote } from '../server/services/windowsRemoteExecutor.js';

enableProjectAzureCli();
const config = getVmTargetConfig('client');
if (config.vmName !== 'LabEx-CLIENT01' || config.resourceGroup !== 'LabEx-India-RG') throw new Error('Unexpected target; refusing initialization.');
const client = azureClient();
const rg = config.resourceGroup, name = config.vmName;
const credential = new AzureCliCredential();
const reportPath = 'server/runtime/state/client-baseline.json';
fs.mkdirSync('server/runtime/state', { recursive: true });
if (fs.existsSync(reportPath)) throw new Error('A baseline report already exists. Refusing to overwrite/reinitialize a learner VM.');
const report = { vmName: name, resourceGroup: rg, recoveryTested: false, steps: [] };
function record(step) { report.steps.push(step); fs.writeFileSync(reportPath, JSON.stringify(report, null, 2)); console.log(step); }
function updateEnv(values) {
  let text = fs.readFileSync('.env', 'utf8');
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
    const regex = new RegExp(`^${key}=.*$`, 'm'), line = `${key}=${value}`;
    text = regex.test(text) ? text.replace(regex, () => line) : text.trimEnd() + '\n' + line + '\n';
  }
  fs.writeFileSync('.env', text);
}
async function arm(id) {
  const { token } = await credential.getToken('https://management.azure.com/.default');
  const response = await fetch(`https://management.azure.com${id}?api-version=2023-11-01`, { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Cannot read client network metadata.');
  return response.json();
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function probe(script, retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await executeWindowsRemote(script, { labId: 'win-it-pc-onboarding-setup', target: 'client' });
      if (result.exitCode === 0 && !result.timedOut) return result;
      if (i === retries - 1) throw new Error('Client guest probe failed.');
    } catch (error) { if (i === retries - 1) throw error; }
    console.log('Waiting for CLIENT01 guest agent readiness...'); await delay(15000);
  }
}
async function cleanStop() {
  await client.virtualMachines.powerOff(rg, name, { skipShutdown: false }).pollUntilDone();
  await client.virtualMachines.deallocate(rg, name).pollUntilDone();
}
async function main() {
  let vm;
  for (let i = 0; i < 40; i++) {
    try { vm = await client.virtualMachines.get(rg, name); if (vm.provisioningState === 'Succeeded') break; } catch {}
    if (i === 39) throw new Error('CLIENT01 creation did not complete.');
    await delay(15000);
  }
  if (vm.osProfile?.computerName !== 'CLIENT01' || vm.hardwareProfile?.vmSize !== 'Standard_B2als_v2' || vm.storageProfile?.imageReference?.publisher !== 'MicrosoftWindowsDesktop') throw new Error('VM identity/size/image does not match the new approved client.');
  const nic = await arm(vm.networkProfile.networkInterfaces[0].id);
  const ip = await arm(nic.properties.ipConfigurations[0].properties.publicIPAddress.id);
  updateEnv({ AZURE_CLIENT_VM_IP: ip.properties.ipAddress });
  record('CLIENT01 network configured privately in .env.');
  const initial = await probe("if ($env:COMPUTERNAME -ne 'CLIENT01') { exit 1 }; $b=Get-BitLockerVolume -MountPoint C:; [pscustomobject]@{computer=$env:COMPUTERNAME;os=(Get-CimInstance Win32_OperatingSystem).Caption;protection=[string]$b.ProtectionStatus;volume=[string]$b.VolumeStatus} | ConvertTo-Json -Compress");
  report.guest = JSON.parse(initial.stdout);
  if (report.guest.protection !== 'Off' || report.guest.volume !== 'FullyDecrypted') throw new Error('Device encryption requires a reviewed recovery-key/vTPM procedure; do not clone automatically.');
  record('Real Azure Agent PowerShell verified; CLIENT01 OS volume fully decrypted.');
  await probe("if (Test-Path -LiteralPath 'C:\\LabEx\\RecoveryTest\\after-baseline.txt') { exit 1 }; New-Item -ItemType Directory -Path 'C:\\LabEx\\RecoveryTest' -Force | Out-Null; Write-Output 'Baseline clean'");
  report.originalDiskId = vm.storageProfile.osDisk.managedDisk.id;
  const snapshotName = 'LabEx-CLIENT01-Baseline-Snap';
  // Do not overwrite a pre-existing recovery point.
  try { await client.snapshots.get(rg, snapshotName); throw new Error('Baseline snapshot already exists.'); }
  catch (error) { if (error.statusCode !== 404) throw error; }
  await cleanStop(); record('Client cleanly shut down and deallocated before baseline snapshot.');
  const snapshot = await client.snapshots.createOrUpdate(rg, snapshotName, { location: vm.location, sku: { name: 'Standard_LRS' },
    creationData: { createOption: 'Copy', sourceResourceId: report.originalDiskId }, tags: { purpose: 'LabEx-CLIENT01-baseline' } }).pollUntilDone();
  report.snapshotId = snapshot.id; report.snapshotName = snapshotName;
  record('Standard LRS baseline snapshot created.');
  await client.virtualMachines.start(rg, name).pollUntilDone();
  await probe("[IO.File]::WriteAllText('C:\\LabEx\\RecoveryTest\\after-baseline.txt','Recovery test marker'); if (-not (Test-Path -LiteralPath 'C:\\LabEx\\RecoveryTest\\after-baseline.txt')) { exit 1 }");
  record('Post-baseline marker created; full disk restore must remove it.');
  // Azure may replay the latest Run Command goal state after restoring an older
  // agent disk. Replace the marker-writing command with a read-only goal state.
  await probe("Write-Output 'Recovery-safe read-only goal state'");
  await cleanStop();
  const recoveredName = 'LabEx-CLIENT01-OS-Recovered';
  try { await client.disks.get(rg, recoveredName); throw new Error('Recovered disk already exists.'); }
  catch (error) { if (error.statusCode !== 404) throw error; }
  const recovered = await client.disks.createOrUpdate(rg, recoveredName, { location: vm.location, sku: { name: 'StandardSSD_LRS' },
    creationData: { createOption: 'Copy', sourceResourceId: snapshot.id }, tags: { purpose: 'LabEx-CLIENT01-active-os' } }).pollUntilDone();
  report.activeDiskId = recovered.id;
  record('Recovery disk created from the baseline.');
  await client.virtualMachines.update(rg, name, { storageProfile: { osDisk: { name: recoveredName, managedDisk: { id: recovered.id },
    osType: 'Windows' } } }).pollUntilDone();
  await client.virtualMachines.start(rg, name).pollUntilDone();
  await probe("if ($env:COMPUTERNAME -ne 'CLIENT01' -or (Test-Path -LiteralPath 'C:\\LabEx\\RecoveryTest\\after-baseline.txt')) { exit 1 }; Write-Output 'Recovered baseline verified'");
  report.recoveryTested = true;
  report.verifiedAt = new Date().toISOString();
  updateEnv({ WINDOWS_CLIENT_BASELINE_SNAPSHOT: snapshotName, WINDOWS_CLIENT_RECOVERY_TESTED: 'true' });
  record('Full OS-disk recovery proved: guest boots and post-baseline marker is absent.');
  // Delete only the original disposable disk created by this deployment, after recovery succeeds.
  const originalName = report.originalDiskId.split('/').at(-1);
  if (originalName !== 'LabEx-CLIENT01-OS') throw new Error('Unexpected original disk name; refusing cleanup.');
  const original = await client.disks.get(rg, originalName);
  if (original.diskState !== 'Unattached') throw new Error('Original disk is still attached; refusing cleanup.');
  await client.disks.delete(rg, originalName).pollUntilDone();
  record('Disposable original OS disk removed after successful recovery; one active OS disk retained.');
}
try { await main(); }
catch (error) { record('Initialization blocked: ' + (error.code || error.message)); process.exitCode = 1; }
finally {
  try { await client.virtualMachines.deallocate(rg, name).pollUntilDone(); record('CLIENT01 left deallocated.'); }
  catch { record('Could not confirm deallocation. Check Azure immediately.'); process.exitCode = 1; }
}
