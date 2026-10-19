import { Router } from 'express';
import { getAzureVmStatus, startAzureVm, stopAzureVm, generateRdpConfigFile } from '../services/azureVmService.js';

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

export default router;

