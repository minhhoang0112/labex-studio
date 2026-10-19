import { execLabCommand, getCommandHistory } from "../pty/linuxEnvironment.js";

export function hasUnconditionalSuccess(command) {
  if (typeof command !== "string" || !command.trim()) return true;
  return /^(?:true|:|echo\s+(['"]?)ok\1)\s*;?$/i.test(command.trim()) ||
    /\|\|\s*(?:true|:)\s*;?\s*$/.test(command);
}

export function isUnboundedCommandPattern(pattern) {
  return typeof pattern !== "string" || ["", ".", ".*", ".+", "^", "$", "^.*$", "^.+$", "^\\s*.*$",
    // Importers must not turn unknown practical graders into "any command".
    "^\\s*[a-zA-Z0-9_\\-\\./]+\\s*.*$",
    "(?:cat|ls|pwd|cd|mkdir|touch|grep|test|echo|bash|sh|python|sed|awk)",
  ].includes(pattern.trim());
}

export function getVerificationDefinition(step, provider = process.env.LABEX_RUNTIME_PROVIDER || "namespace") {
  const definition = step.verification_by_provider?.[provider] || step.verification ||
    (typeof step.verify_command === "string" ? { kind: "state", command: step.verify_command } : null);
  // A scraper cannot infer a practical task's grader from the absence of a
  // one-line command. Only an explicitly authored reading/Continue step may
  // use acknowledgement. Check nested rules as well as the top-level rule.
  const acknowledgements = rule => !rule ? [] : rule.kind === "acknowledgement" ? [rule]
    : rule.kind === "all" && Array.isArray(rule.checks) ? rule.checks.flatMap(acknowledgements) : [];
  if (acknowledgements(definition).some(rule => rule.scope !== "informational" || step.action !== "continue")) {
    return { kind: "unsupported", reason: "Nhiệm vụ thực hành cần bộ kiểm tra thực tế; xác nhận đã đọc không thể hoàn thành bài." };
  }
  return definition;
}

function commandRules(definition) {
  if (definition?.kind === "commands") return [definition];
  return definition?.kind === "all" && Array.isArray(definition.checks)
    ? definition.checks.flatMap(commandRules) : [];
}

// Each required group can be fulfilled by its own completed shell command.
// Return the earliest history boundary satisfying all groups, including when
// a single compound command fulfills several groups.
function commandEnd(rule, history, startIndex) {
  if (!Array.isArray(rule.groups) || !rule.groups.length) return null;
  const statuses = Array.isArray(rule.allowed_status) ? rule.allowed_status : [0];
  const ends = [];
  for (const group of rule.groups) {
    if (!Array.isArray(group) || !group.length || group.some(isUnboundedCommandPattern)) return null;
    let patterns;
    try { patterns = group.map(pattern => new RegExp(pattern)); } catch { return null; }
    const end = history.findIndex((entry, index) => index >= startIndex &&
      statuses.includes(entry?.status) && (!rule.user || entry?.user === rule.user) &&
      typeof entry?.command === "string" && entry.command.length <= 8192 &&
      patterns.some(pattern => pattern.test(entry.command)));
    if (end < 0) return null;
    ends.push(end);
  }
  return Math.max(...ends);
}

export async function verifyDefinition(labId, definition, {
  runCommand = execLabCommand,
  readHistory = getCommandHistory,
  acknowledged = false,
  stepIndex = 0,
  allSteps = [],
} = {}) {
  if (!definition || typeof definition !== "object") {
    return { supported: false, passed: false, reason: "Bước chưa có bộ kiểm tra được xác nhận." };
  }
  if (definition.kind === "acknowledgement") {
    if (definition.scope !== "informational") {
      return { supported: false, passed: false, reason: "Chỉ bước hướng dẫn thông tin mới được xác nhận đã đọc." };
    }
    return { supported: true, passed: acknowledged === true, method: "learner-acknowledgement" };
  }
  if (definition.kind === "state") {
    if (hasUnconditionalSuccess(definition.command)) {
      return { supported: false, passed: false, reason: "Bộ kiểm tra chứa nhánh tự động báo đạt." };
    }
    const result = await runCommand(labId, definition.command);
    return { supported: true, passed: result.exitCode === 0 && !result.timedOut,
      timedOut: Boolean(result.timedOut), method: "filesystem-or-account-state" };
  }
  if (definition.kind === "commands") {
    const groups = definition.groups;
    if (!Array.isArray(groups) || !groups.length || groups.some(group => !Array.isArray(group) || !group.length || group.some(isUnboundedCommandPattern))) {
      return { supported: false, passed: false, reason: "Thiếu quy tắc kiểm tra lệnh thực hành." };
    }
    const rawHistory = await readHistory(labId);
    if (!Array.isArray(rawHistory) || !rawHistory.length) {
      return { supported: true, passed: false, reason: "Chưa có lệnh nào được thực thi trong terminal.", method: "completed-shell-command-history" };
    }

    // Determine starting boundary in command history based on preceding command-based steps
    let startIndex = 0;
    if (Array.isArray(allSteps) && allSteps.length > 0 && typeof stepIndex === "number" && stepIndex > 0) {
      let previousEndIndex = -1;
      for (let prevIdx = 0; prevIdx < stepIndex; prevIdx++) {
        const prevStep = allSteps[prevIdx];
        const prevDef = getVerificationDefinition(prevStep);
        const rules = commandRules(prevDef);
        if (rules.length) {
          const ends = rules.map(rule => commandEnd(rule, rawHistory, previousEndIndex + 1));
          if (ends.every(end => end !== null)) previousEndIndex = Math.max(...ends);
        }
      }
      if (previousEndIndex >= 0) {
        startIndex = previousEndIndex + 1;
      }
    }

    const history = rawHistory.slice(startIndex);
    if (!history.length) {
      return { supported: true, passed: false, reason: "Chưa có lệnh nào được thực hiện cho bước này trong terminal.", method: "completed-shell-command-history" };
    }

    const statuses = Array.isArray(definition.allowed_status) ? definition.allowed_status : [0];
    const passed = commandEnd(definition, history, 0) !== null;

    const lastEntry = history[history.length - 1];
    let failureDetail = "";
    if (!passed && lastEntry) {
      if (lastEntry.status !== 0 && !statuses.includes(lastEntry.status)) {
        failureDetail = `Lệnh gần nhất ("${lastEntry.command}") thực thi không thành công (mã lỗi ${lastEntry.status}).`;
      } else {
        failureDetail = `Lệnh gần nhất ("${lastEntry.command}") chưa đúng yêu cầu của nhiệm vụ.`;
      }
    }

    return { 
      supported: true, 
      passed, 
      method: "completed-shell-command-history",
      reason: failureDetail || (passed ? "" : "Chưa thực thi câu lệnh phù hợp.")
    };
  }
  if (definition.kind === "all") {
    if (!Array.isArray(definition.checks) || !definition.checks.length) {
      return { supported: false, passed: false, reason: "Thiếu các điều kiện kiểm tra." };
    }
    // A verification observes one completed-command snapshot, including nested
    // groups. Re-reading Linux for every group is slow and can mix histories
    // if the learner keeps typing while the request is running.
    let snapshot;
    const readSnapshot = id => {
      if (id !== labId) return readHistory(id);
      snapshot ??= Promise.resolve().then(() => readHistory(id));
      return snapshot;
    };
    const results = [];
    for (const check of definition.checks) results.push(await verifyDefinition(labId, check, { runCommand, readHistory: readSnapshot, acknowledged, stepIndex, allSteps }));
    return { supported: results.every(result => result.supported), passed: results.every(result => result.supported && result.passed),
      timedOut: results.some(result => result.timedOut), method: "combined", reason: results.find(result => !result.supported)?.reason };
  }
  return { supported: false, passed: false, reason: definition.reason || "Chưa hỗ trợ kiểm tra bước này." };
}
