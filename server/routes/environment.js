import express from "express";
import { isValidId, loadLab } from "../data/catalog.js";
import { getEnvironment, resetLabEnvironment, getLabEnvironmentStatus } from "../pty/linuxEnvironment.js";
import { isWindowsLab, labVmTarget } from '../services/vmTargets.js';
import {clearTerminalEvidence} from '../services/terminalEvidence.js';
import {upskillVmStatus,powerUpskillVm} from '../services/upskillVm.js';

export function createEnvironmentRouter({ environment = getEnvironment, reset = resetLabEnvironment,
  status = getLabEnvironmentStatus, findLab = loadLab, disconnect = async () => {} } = {}) {
  const router = express.Router();
  router.get('/upskill/vm/status',async(_req,res)=>{try{res.json(await upskillVmStatus());}catch{res.status(503).json({error:'Chưa đọc được trạng thái VM lab local.'});}});
  for(const action of ['start','stop'])router.post('/upskill/vm/'+action,async(req,res)=>{
    if(req.body?.confirm!==true)return res.status(400).json({error:'Cần xác nhận thao tác VM lab.'});
    try{res.json(await powerUpskillVm(action));}catch{res.status(503).json({error:'Chưa bật/tắt được VM lab; kiểm tra VMware và đóng công việc trên VM trước khi tắt.'});}
  });
  router.get("/environment", async (req, res, next) => {
    if(req.query.labId!==undefined && (typeof req.query.labId!=='string' || !isValidId(req.query.labId) || !findLab(req.query.labId))) return res.status(400).json({error:'Mã bài thực hành không hợp lệ.'});
    try { res.json(await environment(req.query.labId)); } catch (error) { next(error); }
  });
  router.get("/labs/:id/environment", async (req, res, next) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Mã bài thực hành không hợp lệ." });
    const lab = findLab(req.params.id);
    if (!lab) return res.status(404).json({ error: "Không tìm thấy bài thực hành." });
    if (isWindowsLab(lab)) return res.json({ provider: 'azure', target_vm: labVmTarget(lab), shared: true,
      reset_supported: false, initialized: false, reason: 'Windows dùng VM Azure riêng; không sử dụng môi trường Linux.' });
    try { res.json(await status(req.params.id)); }
    catch (error) {
      if (error.code === "ENVIRONMENT_UNAVAILABLE") return res.status(503).json({ error: error.message });
      next(error);
    }
  });
  router.post("/labs/:id/reset", async (req, res, next) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Mã bài thực hành không hợp lệ." });
    const lab = findLab(req.params.id);
    if (!lab) return res.status(404).json({ error: "Không tìm thấy bài thực hành." });
    if (req.body?.confirmReset !== true) return res.status(400).json({ error: "Cần xác nhận khởi tạo lại bằng confirmReset: true." });
    if (isWindowsLab(lab)) return res.status(409).json({ error: 'Hoàn nguyên kịch bản Windows qua chức năng riêng; không reset môi trường Linux cho bài này.' });
    try {
      await disconnect(req.params.id);
      const result=await reset(req.params.id);
      clearTerminalEvidence(req.params.id);
      res.json(result);
    } catch (error) {
      if (error.code === "ENVIRONMENT_UNAVAILABLE") return res.status(503).json({ error: error.message });
      next(error);
    }
  });
  return router;
}
