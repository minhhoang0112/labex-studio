import express from "express";
import { isValidId, loadLab } from "../data/catalog.js";
import { execLabCommand } from "../pty/linuxEnvironment.js";
import { verifyDefinition, getVerificationDefinition } from "../services/verification.js";
import { getStepReadiness } from "../services/readiness.js";
import { verifyWindowsRemote } from '../services/windowsRemoteVerifier.js';
import { isWindowsLab } from '../services/vmTargets.js';

export function createVerifyRouter({ findLab = loadLab, runCommand = execLabCommand, readHistory, verifyWindows = verifyWindowsRemote } = {}) {
  const router = express.Router();
  router.post("/verify", async (req, res) => {
    const { labId, stepId } = req.body || {};
    if (!isValidId(labId) || !isValidId(stepId)) {
      return res.status(400).json({ passed: false, message: "Mã bài thực hành hoặc bước không hợp lệ.", hint: "Mở lại bài thực hành và thử lại." });
    }
    try {
      const lab = findLab(labId);
      const step = lab?.steps?.find((item) => item.id === stepId);
      if (!step) {
        return res.status(404).json({ passed: false, message: "Không tìm thấy bài thực hành hoặc bước này.", hint: "Chọn một bài thực hành hiện có." });
      }
      const readiness = getStepReadiness(step, lab);
      if (!readiness.ready) return res.status(422).json({ passed: false, message: readiness.reasons.join(" "),
        missing_capabilities: readiness.missing_capabilities, hint: step.hint || "Bước này cần môi trường hoặc bộ kiểm tra chưa được hỗ trợ." });
      const stepIndex = Array.isArray(lab?.steps) ? lab.steps.findIndex((item) => item.id === stepId) : -1;
      const definition = getVerificationDefinition(step);
      // All rules come from the local curriculum. Browser-supplied commands,
      // history, success flags and output never contribute to a grade.
      const result = isWindowsLab(lab) ? await verifyWindows(labId, step) : await verifyDefinition(labId, definition, {
        runCommand,
        acknowledged: req.body.acknowledge === true,
        stepIndex,
        allSteps: lab?.steps || [],
        ...(readHistory ? { readHistory } : {})
      });
      if (!result.supported) return res.status(422).json({ passed: false, message: result.reason,
        hint: step.hint || "Bước này chưa được hỗ trợ kiểm tra tự động." });
      const passed = result.passed;
      return res.json({
        passed,
        message: passed 
          ? (result.method === "learner-acknowledgement" ? "Đã ghi nhận. Bạn có thể tiếp tục." : "Chính xác! Bạn đã hoàn thành bước này.") 
          : result.timedOut
          ? "Kiểm tra quá thời gian chờ. Hãy thử lại." 
          : (result.reason || "Nhiệm vụ chưa hoàn thành. Kiểm tra lại kết quả trong terminal."),
        hint: passed ? "" : step.hint_vi || step.hint || "Kiểm tra lại câu lệnh và kết quả theo yêu cầu.",
        verification_method: result.method,
      });
    } catch (error) {
      if (error.code?.startsWith('CLOUD_')) return res.status(error.status || 503).json({ passed: false, message: error.message, code: error.code });
      return res.status(error.code === "ENVIRONMENT_UNAVAILABLE" ? 503 : 500).json({
        passed: false,
        message: error.code === "ENVIRONMENT_UNAVAILABLE" ? error.message : "Không thể kiểm tra bước này lúc này.",
        hint: isWindowsLab(findLab(labId))
          ? "Kiểm tra trạng thái Windows VM và PowerShell của bài rồi thử lại."
          : "Kiểm tra terminal Linux và thử lại.",
      });
    }
  });
  return router;
}

export default createVerifyRouter();
