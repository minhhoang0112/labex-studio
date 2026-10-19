import { Router } from 'express';
import { getAzureVmStatus, startAzureVm, stopAzureVm, generateRdpConfigFile } from '../services/azureVmService.js';
import { executeWindowsRemote } from '../services/windowsRemoteExecutor.js';
import { publicCloudError } from '../services/cloudConfig.js';
import { recordWindowsCommand } from '../pty/linuxEnvironment.js';
import { isValidId, loadLab } from '../data/catalog.js';

export function createCloudVmRouter({ desktop, status = getAzureVmStatus, start = startAzureVm,
  stop = stopAzureVm, execute = executeWindowsRemote, findLab = loadLab } = {}) {
  const router = Router();
  const endpoint = fn => async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { await fn(req, res); }
    catch (error) { const safe = publicCloudError(error); res.status(safe.status).json({ error: safe.message, code: safe.code }); }
  };
  const windowsLab = id => isValidId(id) && id.startsWith('win-') && findLab(id);
  router.get('/cloud-vm/status', endpoint(async (_req, res) => res.json({ ...await status(),
    desktop: desktop ? await desktop.status() : { configured: false } })));
  router.post('/cloud-vm/start', endpoint(async (_req, res) => res.status(202).json(await start())));
  router.post('/cloud-vm/stop', endpoint(async (_req, res) => res.status(202).json(await stop())));
  router.get('/cloud-vm/connect.rdp', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.type('application/x-rdp').attachment('LabEx-WinServer.rdp').send(generateRdpConfigFile());
  });
  router.post('/cloud-vm/desktop-session', endpoint(async (req, res) => {
    const { labId, width, height, dpi } = req.body || {};
    if (!windowsLab(labId)) return res.status(400).json({ error: 'Chọn một bài thực hành Windows hợp lệ.' });
    if (!desktop) return res.status(503).json({ error: 'Desktop gateway chưa được khởi tạo.' });
    res.json(await desktop.issue(labId, { width, height, dpi }));
  }));
  router.post('/cloud-vm/powershell', endpoint(async (req, res) => {
    const { labId, command } = req.body || {};
    if (!windowsLab(labId)) return res.status(400).json({ error: 'Chọn một bài thực hành Windows hợp lệ.' });
    if (typeof command !== 'string' || !command.trim() || command.length > 16000) {
      return res.status(400).json({ error: 'Lệnh PowerShell trống hoặc quá dài.' });
    }
    const result = await execute(command, { labId });
    recordWindowsCommand(labId, command, result.exitCode, { target: result.target, computerName: result.computerName });
    res.json(result);
  }));
  return router;
}
