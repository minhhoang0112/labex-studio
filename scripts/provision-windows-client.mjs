// Default: ARM validation only. --deploy is required to create billable resources.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import { AzureCliCredential } from '@azure/identity';
import { enableProjectAzureCli } from '../server/services/cloudConfig.js';

export function clientTemplate(diskGiB = 64, vmSize = 'Standard_B2s') {
  if (![64, 128].includes(diskGiB)) throw new Error('Only reviewed 64/128 GiB disk sizes are allowed.');
  if (!['Standard_B2s', 'Standard_B2als_v2'].includes(vmSize)) throw new Error('Only 2-vCPU/4-GiB B-series candidates are allowed.');
  const loc = "[resourceGroup().location]";
  const ref = (type, name) => `[resourceId('${type}', '${name}')]`;
  const ip = 'LabEx-CLIENT01-IP', nsg = 'LabEx-CLIENT01-NSG', vnet = 'LabEx-CLIENT01-VNET', nic = 'LabEx-CLIENT01-NIC';
  return {
    $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#', contentVersion: '1.0.0.0',
    parameters: { password: { type: 'secureString' }, rdpSource: { type: 'string' }, imageVersion: { type: 'string' } },
    resources: [
      { type: 'Microsoft.Network/publicIPAddresses', apiVersion: '2023-11-01', name: ip, location: loc,
        sku: { name: 'Standard' }, properties: { publicIPAllocationMethod: 'Static', publicIPAddressVersion: 'IPv4' } },
      { type: 'Microsoft.Network/networkSecurityGroups', apiVersion: '2023-11-01', name: nsg, location: loc,
        properties: { securityRules: [{ name: 'RDP-from-lab-gateway', properties: { priority: 1000, protocol: 'Tcp', access: 'Allow',
          direction: 'Inbound', sourceAddressPrefix: "[parameters('rdpSource')]", sourcePortRange: '*', destinationAddressPrefix: '*', destinationPortRange: '3389' } }] } },
      { type: 'Microsoft.Network/virtualNetworks', apiVersion: '2023-11-01', name: vnet, location: loc,
        properties: { addressSpace: { addressPrefixes: ['10.42.0.0/16'] }, subnets: [{ name: 'clients', properties: { addressPrefix: '10.42.0.0/24' } }] } },
      { type: 'Microsoft.Network/networkInterfaces', apiVersion: '2023-11-01', name: nic, location: loc,
        dependsOn: [ref('Microsoft.Network/publicIPAddresses', ip), ref('Microsoft.Network/networkSecurityGroups', nsg), ref('Microsoft.Network/virtualNetworks', vnet)],
        properties: { networkSecurityGroup: { id: ref('Microsoft.Network/networkSecurityGroups', nsg) }, ipConfigurations: [{ name: 'primary', properties: {
          privateIPAllocationMethod: 'Dynamic', subnet: { id: `[resourceId('Microsoft.Network/virtualNetworks/subnets', '${vnet}', 'clients')]` },
          publicIPAddress: { id: ref('Microsoft.Network/publicIPAddresses', ip) } } }] } },
      { type: 'Microsoft.Compute/virtualMachines', apiVersion: '2024-07-01', name: 'LabEx-CLIENT01', location: loc,
        dependsOn: [ref('Microsoft.Network/networkInterfaces', nic)], tags: { purpose: 'personal-devtest-it-support', owner: 'LabEx', autoShutdown: '23:00-Asia-Saigon' },
        properties: { licenseType: 'Windows_Client', hardwareProfile: { vmSize },
          securityProfile: { securityType: 'TrustedLaunch', uefiSettings: { secureBootEnabled: true, vTpmEnabled: true } },
          osProfile: { computerName: 'CLIENT01', adminUsername: 'adminlab', adminPassword: "[parameters('password')]",
            windowsConfiguration: { provisionVMAgent: true, enableAutomaticUpdates: true } },
          storageProfile: { imageReference: { publisher: 'MicrosoftWindowsDesktop', offer: 'windows-11', sku: 'win11-24h2-ent', version: "[parameters('imageVersion')]" },
            osDisk: { name: 'LabEx-CLIENT01-OS', createOption: 'FromImage', diskSizeGB: diskGiB, managedDisk: { storageAccountType: 'StandardSSD_LRS' } } },
          networkProfile: { networkInterfaces: [{ id: ref('Microsoft.Network/networkInterfaces', nic) }] },
          diagnosticsProfile: { bootDiagnostics: { enabled: true } } } },
      { type: 'Microsoft.DevTestLab/schedules', apiVersion: '2018-09-15', name: 'shutdown-computevm-LabEx-CLIENT01', location: loc,
        dependsOn: [ref('Microsoft.Compute/virtualMachines', 'LabEx-CLIENT01')],
        properties: { status: 'Enabled', taskType: 'ComputeVmShutdownTask', dailyRecurrence: { time: '2300' },
          timeZoneId: 'SE Asia Standard Time', targetResourceId: ref('Microsoft.Compute/virtualMachines', 'LabEx-CLIENT01'),
          notificationSettings: { status: 'Disabled', timeInMinutes: 30 } } },
    ],
  };
}

async function main() {
  dotenv.config({ quiet: true }); enableProjectAzureCli();
  const subscription = process.env.AZURE_SUBSCRIPTION_ID;
  if (!subscription) throw new Error('AZURE_SUBSCRIPTION_ID missing; run azure-login.ps1.');
  const password = process.env.WINDOWS_CLIENT_ADMIN_PASSWORD || crypto.randomBytes(24).toString('base64url') + '!aA9';
  const credential = new AzureCliCredential({ processTimeoutInMs: 20000 });
  async function arm(path, method = 'GET', body) {
    const { token } = await credential.getToken('https://management.azure.com/.default');
    const response = await fetch('https://management.azure.com' + path, { method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(120000) });
    const data = await response.json();
    if (!response.ok) {
      const message = JSON.stringify(data.error || { status: response.status }).replaceAll(password, '[REDACTED]');
      throw new Error(message.slice(0, 3000));
    }
    return data;
  }
  const group = `/subscriptions/${subscription}/resourceGroups/LabEx-India-RG`;
  const diskGiB = process.argv.includes('--disk-gib=128') ? 128 : 64;
  const vmSize = process.argv.includes('--size=Standard_B2als_v2') ? 'Standard_B2als_v2' : 'Standard_B2s';
  const machines = await arm(`${group}/providers/Microsoft.Compute/virtualMachines?api-version=2024-07-01`);
  if (machines.value.some(vm => vm.name === 'LabEx-CLIENT01')) throw new Error('CLIENT01 already exists. Refusing to overwrite.');
  // Pin the exact image version inspected with Azure CLI on 20/10/2026.
  const image = await arm(`/subscriptions/${subscription}/providers/Microsoft.Compute/locations/centralindia/publishers/MicrosoftWindowsDesktop/artifacttypes/vmimage/offers/windows-11/skus/win11-24h2-ent/versions/26100.9711.261011?api-version=2024-07-01`);
  const minSize = image.properties?.osDiskImage?.sizeInGB || image.properties?.osDiskImage?.sizeInGb;
  if (minSize && minSize > diskGiB) throw new Error(`Image minimum OS disk ${minSize} GiB exceeds the selected ${diskGiB} GiB. No resources created.`);
  const ipResponse = await fetch('https://api.ipify.org', { signal: AbortSignal.timeout(15000) });
  const ip = (await ipResponse.text()).trim();
  if (!ipResponse.ok || !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) throw new Error('Cannot determine gateway IPv4; no deployment.');
  const properties = { mode: 'Incremental', template: clientTemplate(diskGiB, vmSize), parameters: {
    password: { value: password }, rdpSource: { value: ip + '/32' }, imageVersion: { value: image.name },
  } };
  fs.mkdirSync('.artifacts', { recursive: true });
  try {
    await arm(`${group}/providers/Microsoft.Resources/deployments/LabEx-CLIENT01-validated/validate?api-version=2022-09-01`, 'POST', { properties });
    fs.writeFileSync('.artifacts/client01-provision-result.json', JSON.stringify({ validated: true, deployed: false, size: vmSize, diskGiB, imageVersion: image.name, autoShutdown: '23:00 SE Asia Standard Time' }, null, 2));
    console.log(`ARM validation passed: ${vmSize} / ${diskGiB} GiB / Windows 11 / auto-shutdown 23:00 UTC+7.`);
  } catch (error) {
    fs.writeFileSync('.artifacts/client01-provision-result.json', JSON.stringify({ validated: false, deployed: false, error: error.message }, null, 2));
    throw error;
  }
  if (!process.argv.includes('--deploy')) return;
  // Persist the client credential privately before creation so recovery does not depend on console output.
  const envPath = '.env';
  let envText = fs.readFileSync(envPath, 'utf8');
  for (const [key, value] of Object.entries({ WINDOWS_CLIENT_ADMIN_PASSWORD: password, WINDOWS_CLIENT_ADMIN_USERNAME: 'adminlab', AZURE_CLIENT_VM_NAME: 'LabEx-CLIENT01' })) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    envText = pattern.test(envText) ? envText.replace(pattern, () => line) : envText.trimEnd() + '\n' + line + '\n';
  }
  fs.writeFileSync(envPath, envText);
  const deployment = await arm(`${group}/providers/Microsoft.Resources/deployments/LabEx-CLIENT01-validated?api-version=2022-09-01`, 'PUT', { properties });
  console.log('Deployment submitted; track provisioningState in Azure. Baseline snapshot is created only after guest setup and clean shutdown.');
  fs.writeFileSync('.artifacts/client01-provision-result.json', JSON.stringify({ validated: true, submitted: true, provisioningState: deployment.properties?.provisioningState }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
