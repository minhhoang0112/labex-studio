import { azureClient } from './azureComputeClient.js';
import { getVmTargetConfig, cloudError, publicCloudError } from './cloudConfig.js';
import { isVmBusy, acquireVmLock } from './vmOperationLock.js';

export function createAzureVmService({ client = azureClient, config = getVmTargetConfig, now = Date.now } = {}) {
  const targets = new Map();
  function forTarget(target = 'server') {
    if (!targets.has(target)) targets.set(target, createTargetService(target));
    return targets.get(target);
  }
  function createTargetService(target) {
  let pending = null, cached = null, lastError = null;
  function publicConfig() {
    const { resourceGroup, vmName, publicIp, adminUsername, rdpPort } = config(target);
    return { target, resourceGroup, vmName, publicIp, adminUsername, rdpPort, statusSource: 'azure-arm',
      controlConfigured: Boolean(config(target).subscriptionId) };
  }
  async function status({ force = false } = {}) {
    if (!force && cached && now() - cached.lastChecked < 4000) return { ...cached.value, isBusy: Boolean(pending) || isVmBusy(target) };
    const base = publicConfig();
    if (!base.controlConfigured) return { ...base, powerState: 'unknown', isBusy: false,
      error: 'Chưa đăng nhập/cấu hình Azure. Chạy scripts/azure-login.ps1.' };
    try {
      const { resourceGroup, vmName } = config(target);
      const view = await client().virtualMachines.instanceView(resourceGroup, vmName);
      const power = view.statuses?.find(item => item.code?.startsWith('PowerState/'));
      const value = { ...base, powerState: power?.displayStatus || 'unknown',
        powerStateCode: power?.code || null, isBusy: Boolean(pending) || isVmBusy(target),
        operation: pending, operationError: lastError, lastChecked: new Date(now()).toISOString() };
      cached = { lastChecked: now(), value };
      return value;
    } catch (error) {
      return { ...base, powerState: 'unknown', isBusy: Boolean(pending), error: publicCloudError(error).message };
    }
  }
  async function operate(action) {
    if (isVmBusy(target)) throw cloudError('VM đang chạy lệnh/nạp lỗi. Chờ hoàn tất trước khi bật/tắt.', 409, 'CLOUD_BUSY');
    if (pending) throw cloudError('VM đang thực hiện một thao tác. Chờ thao tác hoàn tất.', 409, 'CLOUD_BUSY');
    const release = acquireVmLock(target, action);
    pending = action; lastError = null; cached = null;
    try {
      const { resourceGroup, vmName } = config(target);
      const machines = client().virtualMachines;
      const poller = action === 'start' ? machines.start(resourceGroup, vmName)
        : machines.deallocate(resourceGroup, vmName);
      // Confirm ARM accepted the request before reporting success to the UI.
      await poller.poll();
      const completion = poller.pollUntilDone();
      completion.catch(error => { lastError = publicCloudError(error).message; })
        .finally(() => { pending = null; cached = null; release(); });
      return { accepted: true, success: true, operation: action,
        powerState: action === 'start' ? 'starting' : 'deallocating',
        message: 'Azure đã nhận yêu cầu. Trạng thái cuối cùng sẽ cập nhật từ Azure ARM.' };
    } catch (error) {
      release();
      pending = null;
      throw publicCloudError(error);
    }
  }
  return { status, start: () => operate('start'), stop: () => operate('deallocate') };
  }
  return { status: options => forTarget(options?.target).status(options),
    start: options => forTarget(options?.target).start(), stop: options => forTarget(options?.target).stop() };
}

const vm = createAzureVmService();
export const getAzureVmStatus = options => vm.status(options);
export const startAzureVm = options => vm.start(options);
export const stopAzureVm = options => vm.stop(options);
export function generateRdpConfigFile({ target = 'server' } = {}) {
  const config = getVmTargetConfig(target);
  // No password is embedded in downloads.
  return [`full address:s:${config.publicIp}:${config.rdpPort}`, `username:s:${config.adminUsername}`,
    'prompt for credentials:i:1', 'administrative session:i:1', 'screen mode id:i:2',
    'redirectclipboard:i:1', 'redirectprinters:i:0', 'drivestoredirect:s:'].join('\r\n');
}
