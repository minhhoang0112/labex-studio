import express from "express";
import { isValidId, loadLab } from "../data/catalog.js";
import { getEnvironment, resetLabEnvironment, getLabEnvironmentStatus } from "../pty/linuxEnvironment.js";

export function createEnvironmentRouter({ environment = getEnvironment, reset = resetLabEnvironment,
  status = getLabEnvironmentStatus, findLab = loadLab, disconnect = async () => {} } = {}) {
  const router = express.Router();
  router.get("/environment", async (_req, res, next) => {
    try { res.json(await environment()); } catch (error) { next(error); }
  });
  router.get("/labs/:id/environment", async (req, res, next) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Mã bài thực hành không hợp lệ." });
    if (!findLab(req.params.id)) return res.status(404).json({ error: "Không tìm thấy bài thực hành." });
    if (req.params.id.startsWith('win-')) return res.json({ provider: 'azure', shared: true,
      reset_supported: false, initialized: false, reason: 'Windows dùng VM Azure riêng; không sử dụng môi trường Linux.' });
    try { res.json(await status(req.params.id)); }
    catch (error) {
      if (error.code === "ENVIRONMENT_UNAVAILABLE") return res.status(503).json({ error: error.message });
      next(error);
    }
  });
  router.post("/labs/:id/reset", async (req, res, next) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Mã bài thực hành không hợp lệ." });
    if (!findLab(req.params.id)) return res.status(404).json({ error: "Không tìm thấy bài thực hành." });
    if (req.body?.confirmReset !== true) return res.status(400).json({ error: "Cần xác nhận khởi tạo lại bằng confirmReset: true." });
    if (req.params.id.startsWith('win-')) return res.status(409).json({ error: 'Chưa hỗ trợ hoàn nguyên từng bài trên VM Windows dùng chung.' });
    try {
      await disconnect(req.params.id);
      res.json(await reset(req.params.id));
    } catch (error) {
      if (error.code === "ENVIRONMENT_UNAVAILABLE") return res.status(503).json({ error: error.message });
      next(error);
    }
  });
  return router;
}
