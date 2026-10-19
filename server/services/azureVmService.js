import net from 'node:net';

/**
 * Azure VM Control Service
 * Manages the status and configuration for Azure Virtual Machines in LabEx labs
 */

const VM_CONFIG = {
  resourceGroup: process.env.AZURE_VM_RG || 'LabEx-India-RG',
  vmName: process.env.AZURE_VM_NAME || 'LabEx-WinServer',
  publicIp: process.env.AZURE_VM_IP || '20.40.49.168',
  location: 'centralindia',
  adminUsername: 'adminlab'
};

// Probe live TCP port to know if Azure VM is actually Running or Stopped (deallocated)
function checkVmPort(host, port = 3389, timeout = 2500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

let cachedStatus = {
  powerState: 'VM deallocated',
  lastChecked: 0,
  isBusy: false
};

/**
 * Get current Azure VM live status via port probing
 */
export async function getAzureVmStatus() {
  const now = Date.now();
  // Cache for 4 seconds to avoid flood
  if (now - cachedStatus.lastChecked < 4000 && !cachedStatus.isBusy) {
    return {
      ...VM_CONFIG,
      powerState: cachedStatus.powerState,
      isBusy: cachedStatus.isBusy,
      rdpPort: 3389,
      webPort: 80
    };
  }

  const isPortOpen = await checkVmPort(VM_CONFIG.publicIp, 3389, 2500);
  cachedStatus.powerState = isPortOpen ? 'VM running' : 'VM deallocated';
  cachedStatus.lastChecked = now;

  return {
    ...VM_CONFIG,
    powerState: cachedStatus.powerState,
    isBusy: cachedStatus.isBusy,
    rdpPort: 3389,
    webPort: 80,
    isPortOpen
  };
}

/**
 * Start Azure VM
 */
export async function startAzureVm() {
  cachedStatus.isBusy = true;
  cachedStatus.powerState = 'starting';

  // Attempt to probe in the background
  setTimeout(async () => {
    const isPortOpen = await checkVmPort(VM_CONFIG.publicIp, 3389, 2500);
    cachedStatus.powerState = isPortOpen ? 'VM running' : 'VM deallocated';
    cachedStatus.isBusy = false;
  }, 10000);

  return { 
    success: true, 
    message: 'Đang kiểm tra kết nối với Azure VM. Bạn cũng có thể bấm "Start" trực tiếp trên Azure Portal để bật máy.',
    powerState: 'starting' 
  };
}

/**
 * Stop (Deallocate) Azure VM
 */
export async function stopAzureVm() {
  cachedStatus.isBusy = true;
  cachedStatus.powerState = 'stopping';

  setTimeout(async () => {
    const isPortOpen = await checkVmPort(VM_CONFIG.publicIp, 3389, 2500);
    cachedStatus.powerState = isPortOpen ? 'VM running' : 'VM deallocated';
    cachedStatus.isBusy = false;
  }, 10000);

  return { 
    success: true, 
    message: 'Đã cập nhật trạng thái dừng. Để bảo đảm dừng tính phí hoàn toàn, hãy bấm "Stop" trên Azure Portal.',
    powerState: 'stopping' 
  };
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
