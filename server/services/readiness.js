import fs from "node:fs";
import { windowsStepReadiness } from './windowsRemoteVerifier.js';
import { hasUnconditionalSuccess, isUnboundedCommandPattern, getVerificationDefinition } from "./verification.js";

// Curriculum support for the current namespace provider. Live startup health is
// reported separately by /api/environment; catalog reads never start a VM.
const capabilities = new Set([
  "terminal", "files", "users", "sudo", "permissions", "shell", "archives"
]);

function providerCapabilities(provider) {
  const result = new Set(capabilities);
  if (provider !== "docker") return result;
  try {
    const record = JSON.parse(fs.readFileSync(new URL("../runtime/docker/capabilities.json", import.meta.url), "utf8"));
    if (record.image !== (process.env.LABEX_DOCKER_IMAGE || "labex-local/ubuntu22:1")) return result;
    for (const [name, supported] of Object.entries(record.capabilities || {})) if (supported === true) result.add(name);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return result;
}

function unsupportedRule(rule) {
  if (!rule || rule.kind === "unsupported") return rule?.reason || "Chưa có bộ kiểm tra cho nhiệm vụ này.";
  if (rule.kind === "state") return hasUnconditionalSuccess(rule.command) ? "Bộ kiểm tra chưa hợp lệ." : null;
  if (rule.kind === "commands") {
    if (!Array.isArray(rule.groups) || !rule.groups.length || rule.groups.some(g => !Array.isArray(g) || !g.length || g.some(isUnboundedCommandPattern))) return "Quy tắc kiểm tra lệnh quá rộng hoặc còn thiếu.";
    try { for (const group of rule.groups) for (const expression of group) new RegExp(expression); }
    catch { return "Quy tắc kiểm tra lệnh không hợp lệ."; }
    return null;
  }
  if (rule.kind === "acknowledgement") return null;
  if (rule.kind === "all") return rule.checks?.length ? rule.checks.map(unsupportedRule).find(Boolean) || null : "Thiếu điều kiện kiểm tra.";
  return "Loại kiểm tra chưa được hỗ trợ.";
}

export function getStepReadiness(step, lab = {}) {
  const provider = process.env.LABEX_RUNTIME_PROVIDER || "namespace";
  const available = providerCapabilities(provider);
  const requirements = [...new Set([...(lab.course_id === "docker-for-beginners" ? ["docker"] : []),
    ...(lab.required_capabilities_by_provider?.[provider] || lab.required_capabilities || []),
    ...(step.required_capabilities_by_provider?.[provider] || step.required_capabilities || [])])];
  const missing = requirements.filter(capability => !available.has(capability));
  if (lab.id?.startsWith('win-')) {
    const win = windowsStepReadiness(step);
    const allMissing = [...new Set([...missing, ...win.missing_capabilities])];
    return {
      ready: win.ready && !missing.length,
      missing_capabilities: allMissing,
      reasons: [...win.reasons, ...(missing.length ? [`Môi trường hiện tại thiếu: ${missing.join(", ")}.`] : [])]
    };
  }
  const reason = unsupportedRule(getVerificationDefinition(step, provider));
  return { ready: !reason && !missing.length, missing_capabilities: missing,
    reasons: [...(reason ? [reason] : []), ...(missing.length ? [`Môi trường hiện tại thiếu: ${missing.join(", ")}.`] : [])] };
}

export function getLabReadiness(lab) {
  const steps = lab.steps || [];
  const results = steps.map(step => getStepReadiness(step, lab));
  const supported = results.filter(result => result.ready).length;
  return { state: !steps.length ? "reference-only" : supported === steps.length ? "ready" : supported ? "partial" : "blocked",
    can_open: Boolean(steps.length), can_start_terminal: !lab.id?.startsWith('win-') && supported > 0, can_grade: supported === steps.length && supported > 0,
    supported_steps_count: supported, total_steps_count: steps.length,
    missing_capabilities: [...new Set(results.flatMap(result => result.missing_capabilities))],
    reasons: [...new Set(results.flatMap(result => result.reasons))] };
}
