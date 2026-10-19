import { Router } from 'express';
import { execFile } from 'node:child_process';
import { getAzureVmStatus, startAzureVm, stopAzureVm, generateRdpConfigFile } from '../services/azureVmService.js';
import { recordWindowsCommand } from '../pty/linuxEnvironment.js';

const router = Router();

// Get live Azure VM status
router.get('/cloud-vm/status', async (req, res, next) => {
  try {
    const status = await getAzureVmStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Start Azure VM
router.post('/cloud-vm/start', async (req, res, next) => {
  try {
    const result = await startAzureVm();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Stop / Deallocate Azure VM
router.post('/cloud-vm/stop', async (req, res, next) => {
  try {
    const result = await stopAzureVm();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Download .RDP file for 1-click native Remote Desktop
router.get('/cloud-vm/connect.rdp', (req, res) => {
  const content = generateRdpConfigFile();
  res.setHeader('Content-Type', 'application/x-rdp');
  res.setHeader('Content-Disposition', 'attachment; filename="LabEx-WinServer.rdp"');
  res.send(content);
});

// Execute PowerShell command in browser web terminal and record history
router.post('/cloud-vm/powershell', (req, res) => {
  const { labId, command } = req.body || {};
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command is required' });
  }
  const cleanCmd = command.trim();
  const isWin = process.platform === 'win32';
  const bin = isWin ? 'powershell.exe' : 'pwsh';
  const args = ['-NoProfile', '-NonInteractive', '-Command', cleanCmd];

  execFile(bin, args, { timeout: 12000, maxBuffer: 1024 * 512, windowsHide: true }, (err, stdout, stderr) => {
    const exitCode = err ? (typeof err.code === 'number' ? err.code : 1) : 0;
    if (labId) {
      recordWindowsCommand(labId, cleanCmd, exitCode);
    }
    res.json({
      stdout: stdout || '',
      stderr: stderr || (err && !stderr ? err.message : ''),
      exitCode
    });
  });
});

export default router;

