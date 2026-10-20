import fs from 'node:fs';
import path from 'node:path';

export function cloudConfig(env = process.env) {
  return getVmTargetConfig('server', env);
}

export function getVmTargetConfig(target = 'server', env = process.env) {
  if (!['server', 'client'].includes(target)) throw cloudError('Target VM không hợp lệ.', 400, 'CLOUD_INVALID_TARGET');
  const prefix = target === 'client' ? 'CLIENT' : 'SERVER';
  return {
    target,
    subscriptionId: env.AZURE_SUBSCRIPTION_ID || '',
    resourceGroup: env[`AZURE_${prefix}_VM_RG`] || env.AZURE_VM_RG || 'LabEx-India-RG',
    vmName: env[`AZURE_${prefix}_VM_NAME`] || (target === 'server' ? env.AZURE_VM_NAME || 'LabEx-WinServer' : 'LabEx-CLIENT01'),
    publicIp: env[`AZURE_${prefix}_VM_IP`] || (target === 'server' ? env.AZURE_VM_IP || '20.40.49.168' : ''),
    adminUsername: env[`WINDOWS_${prefix}_ADMIN_USERNAME`] || env.WINDOWS_ADMIN_USERNAME || 'adminlab',
    password: env[`WINDOWS_${prefix}_ADMIN_PASSWORD`] || (target === 'server' ? env.WINDOWS_ADMIN_PASSWORD || '' : ''),
    rdpDomain: env[`WINDOWS_${prefix}_RDP_DOMAIN`] || (target === 'server' ? env.WINDOWS_RDP_DOMAIN || '' : ''),
    rdpPort: Number(env.WINDOWS_RDP_PORT || 3389),
    guacdHost: env.GUACD_HOST || '127.0.0.1',
    guacdPort: Number(env.GUACD_PORT || 4822),
    authMode: env.AZURE_AUTH_MODE || 'cli',
  };
}

export function enableProjectAzureCli() {
  const folder = path.resolve('.tools/azure-cli/Scripts');
  if (fs.existsSync(folder) && !process.env.PATH?.includes(folder)) {
    process.env.PATH = folder + path.delimiter + (process.env.PATH || '');
  }
}

export function cloudError(message, status = 503, code = 'CLOUD_UNAVAILABLE') {
  return Object.assign(new Error(message), { status, code });
}

export function publicCloudError(error) {
  if (error?.code?.startsWith('CLOUD_')) return error;
  if (error?.statusCode === 403 || error?.code === 'AuthorizationFailed') {
    return cloudError('Tài khoản Azure chưa có quyền điều khiển VM trong resource group đã cấu hình.', 403, 'CLOUD_FORBIDDEN');
  }
  if (error?.statusCode === 404) return cloudError('Không tìm thấy VM trong subscription/resource group đã cấu hình.', 404, 'CLOUD_NOT_FOUND');
  if (/credential|authentication|login|AADSTS/i.test(error?.name + ' ' + error?.message)) {
    return cloudError('Chưa đăng nhập Azure hoặc phiên đăng nhập đã hết hạn. Chạy scripts/azure-login.ps1.', 503, 'CLOUD_AUTH_REQUIRED');
  }
  return cloudError('Azure chưa hoàn tất yêu cầu hoặc mất kết nối. Kiểm tra lại trạng thái VM trước khi thử lại.');
}
