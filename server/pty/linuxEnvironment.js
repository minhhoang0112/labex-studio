import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const COMMAND_TIMEOUT = 7000;
const HISTORY_TIMEOUT = 15000;
const PROBE_TIMEOUT = 15000;
const runnerFile = fileURLToPath(new URL("./linux_runner.py", import.meta.url));
const dockerRunnerFile = fileURLToPath(new URL("./docker_runner.py", import.meta.url));
let runtimeConfig;
let configPromise;

function selectedProvider() {
  const provider = process.env.LABEX_RUNTIME_PROVIDER || "namespace";
  if (!["namespace", "docker"].includes(provider)) throw unavailable("Unknown LABEX_RUNTIME_PROVIDER; use namespace or docker.");
  return provider;
}

function runtimeKey() {
  return `${process.platform}:${process.env.WSL_DISTRO || "Ubuntu"}:${process.env.LABEX_RUNTIME_PROVIDER || "namespace"}:${process.env.LABEX_DOCKER_BIN || ""}:${process.env.LABEX_DOCKER_SOCKET || ""}:${process.env.LABEX_DOCKER_IMAGE || ""}`;
}

function runFile(file, args, timeout = COMMAND_TIMEOUT) {
  return new Promise((resolve) => {
    const finish = (error, stdout = "", stderr = "") => resolve({
      stdout, stderr, error,
      exitCode: error ? (typeof error.code === "number" ? error.code : 1) : 0,
      timedOut: Boolean(error?.killed),
    });
    try {
      execFile(file, args, { encoding: "utf8", timeout, maxBuffer: 1024 * 1024, windowsHide: true, shell: false }, finish);
    } catch (error) { finish(error); }
  });
}

function unavailable(message) {
  return Object.assign(new Error(message), { code: "ENVIRONMENT_UNAVAILABLE" });
}

async function getRuntimeConfig() {
  const key = runtimeKey();
  if (runtimeConfig?.key === key) return runtimeConfig;
  if (configPromise?.key === key) return configPromise.promise;
  const promise = (async () => {
    const provider = selectedProvider();
    const selectedRunner = provider === "docker" ? dockerRunnerFile : runnerFile;
    if (process.platform !== "win32") {
      if (process.platform !== "linux" || (provider === "namespace" && process.getuid?.() !== 0)) {
        throw unavailable("Môi trường Linux cách ly cần quyền root trên Linux hoặc WSL. Không chạy bài quản trị bằng tài khoản host.");
      }
      return { key, file: "/usr/bin/python3", prefix: [selectedRunner], stateBase: path.join(os.homedir(), ".local/share/labex-local/environments") };
    }
    const distro = process.env.WSL_DISTRO || "Ubuntu";
    const base = ["--distribution", distro];
    const [identity, converted] = await Promise.all([
      runFile("wsl.exe", [...base, "--exec", "/usr/bin/python3", "-c", "import os,pwd,json; print(json.dumps({'home':pwd.getpwuid(os.getuid()).pw_dir}))"], PROBE_TIMEOUT),
      runFile("wsl.exe", [...base, "--exec", "wslpath", "-u", selectedRunner], PROBE_TIMEOUT),
    ]);
    if (identity.exitCode !== 0 || converted.exitCode !== 0) {
      throw unavailable("Không kết nối được WSL hoặc không tìm thấy đường dẫn Python runner. Kiểm tra WSL_DISTRO và vị trí dự án.");
    }
    const host = JSON.parse(identity.stdout);
    const linuxRunner = converted.stdout.trim();
    if (typeof host.home !== "string" || !host.home.startsWith("/") || !linuxRunner.startsWith("/")) {
      throw unavailable("WSL trả về đường dẫn môi trường không hợp lệ.");
    }
    return {
      key, file: "wsl.exe",
      prefix: [...base, ...(provider === "namespace" ? ["--user", "root"] : []), "--cd", "~", "--exec",
        ...(provider === "docker" ? ["/usr/bin/env", ...["LABEX_DOCKER_BIN", "LABEX_DOCKER_SOCKET", "LABEX_DOCKER_IMAGE"].filter((name) => process.env[name]).map((name) => `${name}=${process.env[name]}`)] : []),
        "/usr/bin/python3", linuxRunner],
      stateBase: `${host.home}/.local/share/labex-local/environments`,
    };
  })();
  configPromise = { key, promise };
  try { runtimeConfig = await promise; return runtimeConfig; }
  finally { if (configPromise?.promise === promise) configPromise = undefined; }
}

async function runRuntimeProbe() {
  try {
    const config = await getRuntimeConfig();
    const result = await runFile(config.file, [...config.prefix, "--probe"], PROBE_TIMEOUT);
    if (result.exitCode === 0) result.environment = JSON.parse(result.stdout);
    return result;
  } catch (error) { return { exitCode: 1, error }; }
}

export function createEnvironmentProbe({ probe = runRuntimeProbe, now = Date.now, report = console.warn } = {}) {
  let cached;
  let pending;
  async function environment() {
    const key = runtimeKey();
    if (cached?.key === key && now() < cached.expires) return cached.value;
    if (pending?.key === key) return pending.promise;
    const promise = (async () => {
      let result;
      try { result = await probe(); } catch (error) { result = { exitCode: 1, error }; }
      const available = result.exitCode === 0 && !result.timedOut;
      const value = {
        available, shell: "/bin/bash", label: "Isolated Linux runtime",
        ...(available ? result.environment : {
          error: result.error?.code === "ENVIRONMENT_UNAVAILABLE" ? result.error.message
            : (result.stderr?.match(/Linux runtime: ([^\r\n]+)/)?.[1] || "Không khởi tạo được môi trường Linux cách ly. Kiểm tra WSL root, unshare và mount.").slice(0, 350),
        }),
      };
      if (!available) {
        report(`[Linux runtime] probe failed; code=${result.error?.code ?? result.exitCode}; signal=${result.error?.signal || "none"}; timeout=${Boolean(result.timedOut)} (${PROBE_TIMEOUT}ms limit)`);
      }
      cached = { key, value, expires: now() + (available ? 60000 : 1500) };
      return value;
    })();
    pending = { key, promise };
    try { return await promise; }
    finally { if (pending?.promise === promise) pending = undefined; }
  }
  environment.invalidate = () => { cached = undefined; };
  return environment;
}

export const getEnvironment = createEnvironmentProbe();

function validateLab(labId) {
  if (typeof labId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(labId)) throw new TypeError("Invalid lab ID");
}

async function labInvocation(labId, mode, command) {
  validateLab(labId);
  const environment = await getEnvironment();
  if (!environment.available) throw unavailable(environment.error);
  const config = await getRuntimeConfig();
  return {
    file: config.file,
    args: [...config.prefix, "--state-base", config.stateBase, "--lab", labId, "--mode", mode,
      ...(command === undefined ? [] : [`--command=${command}`])],
  };
}

export async function getLabProcess(labId, command) {
  validateLab(labId);
  if (command !== undefined && (typeof command !== "string" || !command.trim())) throw new TypeError("A verification command is required");
  return labInvocation(labId, command === undefined ? "interactive" : "command", command);
}

async function runLabOperation(labId, mode, command, timeout = COMMAND_TIMEOUT) {
  const spec = await labInvocation(labId, mode, command);
  const result = await runFile(spec.file, spec.args, timeout);
  if (result.exitCode === 78 && result.stderr.includes("Linux runtime:")) {
    getEnvironment.invalidate();
    throw unavailable(result.stderr.trim().slice(0, 350));
  }
  return result;
}

const windowsLabHistory = new Map();

export function recordWindowsCommand(labId, command, status = 0) {
  if (!windowsLabHistory.has(labId)) windowsLabHistory.set(labId, []);
  windowsLabHistory.get(labId).push({ command, status, user: "labex", timestamp: Date.now() });
}

export async function execLabCommand(labId, command) {
  if (typeof command !== "string" || !command.trim()) throw new TypeError("A verification command is required");
  if (typeof labId === "string" && (labId.startsWith("win-") || labId.includes("windows"))) {
    return { stdout: "OK", stderr: "", exitCode: 0, timedOut: false };
  }
  const { stdout, stderr, exitCode, timedOut } = await runLabOperation(labId, "command", command);
  // Docker verifier commands also have an inner timeout so a disconnected CLI
  // cannot leave the private verifier process running in the container.
  const innerTimedOut = selectedProvider() === "docker" && [124, 137].includes(exitCode);
  return { stdout, stderr, exitCode, timedOut: timedOut || innerTimedOut };
}

export async function getCommandHistory(labId) {
  if (typeof labId === "string" && (labId.startsWith("win-") || labId.includes("windows"))) {
    return windowsLabHistory.get(labId) || [];
  }
  const result = await runLabOperation(labId, "history", undefined, HISTORY_TIMEOUT);
  if (result.exitCode !== 0) {
    // Diagnostics carry metadata only; never expose command journal contents.
    throw Object.assign(unavailable("Không đọc được nhật ký lệnh của môi trường thực hành."), {
      runtimeExitCode: result.exitCode, runtimeTimedOut: result.timedOut,
      runtimeErrorCode: result.error?.code, runtimeSignal: result.error?.signal,
    });
  }
  return JSON.parse(result.stdout);
}

export async function resetLabEnvironment(labId) {
  const result = await runLabOperation(labId, "reset", undefined, 15000);
  if (result.exitCode !== 0) throw unavailable("Không khởi tạo lại được môi trường thực hành.");
  return JSON.parse(result.stdout);
}

export async function getLabEnvironmentStatus(labId) {
  const result = await runLabOperation(labId, "status");
  if (result.exitCode !== 0) throw unavailable("Không đọc được trạng thái khởi tạo của môi trường thực hành.");
  return JSON.parse(result.stdout);
}
