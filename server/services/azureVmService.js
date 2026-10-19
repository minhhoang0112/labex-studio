import { azureClient } from './azureComputeClient.js';
import { cloudConfig, cloudError, publicCloudError } from './cloudConfig.js';

export function createAzureVmService({ client = azureClient, config = cloudConfig, now = Date.now } = {}) {
  let pending = null, cached = null, lastError = null;
  function publicConfig() {
    const { resourceGroup, vmName, publicIp, adminUsername, rdpPort } = config();
    return { resourceGroup, vmName, publicIp, adminUsername, rdpPort, statusSource: 'azure-arm',
      controlConfigured: Boolean(config().subscriptionId) };
  }
  async function status({ force = false } = {}) {
    if (!force && cached && now() - cached.lastChecked < 4000) return { ...cached.value, isBusy: Boolean(pending) };
    const base = publicConfig();
    if (!base.controlConfigured) return { ...base, powerState: 'unknown', isBusy: false,
      error: 'Chưa đăng nhập/cấu hình Azure. Chạy scripts/azure-login.ps1.' };
    try {
      const { resourceGroup, vmName } = config();
      const view = await client().virtualMachines.instanceView(resourceGroup, vmName);
      const power = view.statuses?.find(item => item.code?.startsWith('PowerState/'));
      const value = { ...base, powerState: power?.displayStatus || 'unknown',
        powerStateCode: power?.code || null, isBusy: Boolean(pending),
        operation: pending, operationError: lastError, lastChecked: new Date(now()).toISOString() };
      cached = { lastChecked: now(), value };
      return value;
    } catch (error) {
      return { ...base, powerState: 'unknown', isBusy: Boolean(pending), error: publicCloudError(error).message };
    }
  }
  async function operate(action) {
    if (pending) throw cloudError('VM đang thực hiện một thao tác. Chờ thao tác hoàn tất.', 409, 'CLOUD_BUSY');
    pending = action; lastError = null; cached = null;
    try {
      const { resourceGroup, vmName } = config();
      const machines = client().virtualMachines;
      const poller = action === 'start' ? machines.start(resourceGroup, vmName)
        : machines.deallocate(resourceGroup, vmName);
      // Confirm ARM accepted the request before reporting success to the UI.
      await poller.poll();
      const completion = poller.pollUntilDone();
      completion.catch(error => { lastError = publicCloudError(error).message; })
        .finally(() => { pending = null; cached = null; });
      return { accepted: true, success: true, operation: action,
        powerState: action === 'start' ? 'starting' : 'deallocating',
        message: 'Azure đã nhận yêu cầu. Trạng thái cuối cùng sẽ cập nhật từ Azure ARM.' };
    } catch (error) {
      pending = null;
      throw publicCloudError(error);
    }
  }
  return { status, start: () => operate('start'), stop: () => operate('deallocate') };
}

const vm = createAzureVmService();
export const getAzureVmStatus = options => vm.status(options);
export const startAzureVm = () => vm.start();
export const stopAzureVm = () => vm.stop();
export function generateRdpConfigFile() {
  const config = cloudConfig();
  // No password is embedded in downloads.
  return [`full address:s:${config.publicIp}:${config.rdpPort}`, `username:s:${config.adminUsername}`,
    'prompt for credentials:i:1', 'administrative session:i:1', 'screen mode id:i:2',
    'redirectclipboard:i:1', 'redirectprinters:i:0', 'drivestoredirect:s:'].join('\r\n');
}
