import { Router } from 'express';
import { getAzureVmStatus, startAzureVm, stopAzureVm, generateRdpConfigFile } from '../services/azureVmService.js';
import { executeWindowsRemote } from '../services/windowsRemoteExecutor.js';
import { publicCloudError } from '../services/cloudConfig.js';
import { recordWindowsCommand } from '../pty/linuxEnvironment.js';
import { isValidId, loadLab } from '../data/catalog.js';
import { resolveVmTarget } from '../services/vmTargets.js';
import { windowsFaults, faultScenarios } from '../services/windowsFaults.js';

export function createCloudVmRouter({ desktop, status = getAzureVmStatus, start = startAzureVm,
  stop = stopAzureVm, execute = executeWindowsRemote, findLab = loadLab, faults = windowsFaults } = {}) {
  const router = Router();
  const endpoint = fn => async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { await fn(req, res); }
    catch (error) { const safe = publicCloudError(error); res.status(safe.status).json({ error: safe.message, code: safe.code }); }
  };
  const windowsLab = id => isValidId(id) && /^(win-|win11-)/.test(id) && findLab(id);
  const options = req => {
    const target = resolveVmTarget(req.method === 'GET' ? req.query : req.body, findLab);
    if (req.method === 'POST' && target === 'client' && ['preparing', 'resetting'].includes(faults.status()?.state)) {
      throw Object.assign(new Error('CLIENT01 đang chuẩn bị/hoàn nguyên kịch bản.'), { status: 409, code: 'CLOUD_BUSY' });
    }
    return { target };
  };
  router.get('/cloud-vm/status', endpoint(async (req, res) => { const target = options(req);
    const value = await status(target);
    const session = target.target === 'client' ? faults.status() : null;
    res.json({ ...value, isBusy: value.isBusy || ['preparing', 'resetting'].includes(session?.state), faultSession: session,
      faultScenario: faultScenarios[req.query.labId] || null,
      desktop: desktop ? await desktop.status(target) : { configured: false } }); }));
  router.post('/cloud-vm/start', endpoint(async (req, res) => res.status(202).json(await start(options(req)))));
  router.post('/cloud-vm/stop', endpoint(async (req, res) => res.status(202).json(await stop(options(req)))));
  router.get('/cloud-vm/connect.rdp', endpoint(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const target = options(req);
    res.type('application/x-rdp').attachment(`LabEx-${target.target}.rdp`).send(generateRdpConfigFile(target));
  }));
  router.post('/cloud-vm/desktop-session', endpoint(async (req, res) => {
    const { labId, width, height, dpi } = req.body || {};
    if (!windowsLab(labId)) return res.status(400).json({ error: 'Chọn một bài thực hành Windows hợp lệ.' });
    if (!desktop) return res.status(503).json({ error: 'Desktop gateway chưa được khởi tạo.' });
    const target = options(req);
    faults.assertAccess(labId, target.target);
    res.json(await desktop.issue(labId, { width, height, dpi, ...target }));
  }));
  router.post('/cloud-vm/powershell', endpoint(async (req, res) => {
    const { labId, command } = req.body || {};
    if (!windowsLab(labId)) return res.status(400).json({ error: 'Chọn một bài thực hành Windows hợp lệ.' });
    if (typeof command !== 'string' || !command.trim() || command.length > 16000) {
      return res.status(400).json({ error: 'Lệnh PowerShell trống hoặc quá dài.' });
    }
    const target = options(req);
    faults.assertAccess(labId, target.target);
    const result = await execute(command, { labId, ...target });
    recordWindowsCommand(labId, command, result.exitCode, { target: result.target, computerName: result.computerName });
    res.json(result);
  }));
  for (const action of ['prepare', 'reset']) router.post('/cloud-vm/fault/' + action, endpoint(async (req, res) => {
    const { labId, confirm } = req.body || {};
    if (confirm !== true) throw Object.assign(new Error('Cần xác nhận thao tác nạp lỗi/hoàn nguyên.'), { status: 400, code: 'CLOUD_CONFIRM_REQUIRED' });
    options(req); // Reject mismatched or non-Windows targets before changing anything.
    if (action === 'prepare' && req.body?.labId && findLab(req.body.labId)?.target_vm === 'client') desktop?.disconnectTarget?.('client');
    res.json(await faults[action](labId));
  }));
  return router;
}
