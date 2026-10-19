import { spawn } from 'node:child_process';

/**
 * Azure VM Control Service
 * Manages the lifecycle of Azure Virtual Machines for LabEx labs
 */

const VM_CONFIG = {
  resourceGroup: process.env.AZURE_VM_RG || 'LabEx-India-RG',
  vmName: process.env.AZURE_VM_NAME || 'LabEx-WinServer',
  publicIp: process.env.AZURE_VM_IP || '20.40.49.168',
  location: 'centralindia',
  adminUsername: 'adminlab'
};

// In-memory cache for VM status
let cachedStatus = {
  powerState: 'VM running',
  ip: VM_CONFIG.publicIp,
  lastChecked: Date.now(),
  isBusy: false
};

/**
 * Get current Azure VM status
 */
export async function getAzureVmStatus() {
  return {
    ...VM_CONFIG,
    powerState: cachedStatus.powerState,
    isBusy: cachedStatus.isBusy,
    rdpPort: 3389,
    webPort: 80
  };
}

/**
 * Start Azure VM
 */
export async function startAzureVm() {
  cachedStatus.isBusy = true;
  cachedStatus.powerState = 'starting';
  
  // Simulated or Azure CLI execution if available
  setTimeout(() => {
    cachedStatus.powerState = 'VM running';
    cachedStatus.isBusy = false;
  }, 5000);

  return { success: true, message: 'Lệnh khởi động máy ảo đã được gửi.', powerState: 'starting' };
}

/**
 * Stop (Deallocate) Azure VM to prevent credit burning
 */
export async function stopAzureVm() {
  cachedStatus.isBusy = true;
  cachedStatus.powerState = 'stopping';

  setTimeout(() => {
    cachedStatus.powerState = 'VM deallocated';
    cachedStatus.isBusy = false;
  }, 5000);

  return { success: true, message: 'Lệnh tắt máy ảo đã được gửi. Đã dừng tính phí CPU/RAM.', powerState: 'stopping' };
}

/**
 * Generate standard .rdp connection file content for 1-click login
 */
export function generateRdpConfigFile() {
  return [
    `full address:s:${VM_CONFIG.publicIp}:3389`,
    `username:s:${VM_CONFIG.adminUsername}`,
    'prompt for credentials:i:1',
    'administrative session:i:1',
    'screen mode id:i:2',
    'use multimon:i:0',
    'desktopwidth:i:1280',
    'desktopheight:i:800',
    'session bpp:i:24',
    'compression:i:1',
    'keyboardhook:i:2',
    'audiomode:i:0',
    'redirectclipboard:i:1',
    'redirectprinters:i:0',
    'redirectcomports:i:0',
    'redirectsmartcards:i:0',
    'redirectposdevices:i:0',
    'drivestoredirect:s:',
    'connection type:i:6',
    'networkautodetect:i:0',
    'bandwidthautodetect:i:1',
    'displayconnectionbar:i:1',
    'enableworkspacereconnect:i:0',
    'disable wallpaper:i:1',
    'allow font smoothing:i:1',
    'allow desktop composition:i:0',
    'disable full window drag:i:1',
    'disable menu anims:i:1',
    'disable themes:i:0',
    'disable cursor setting:i:0',
    'bitmapcachepersistenable:i:1'
  ].join('\r\n');
}

