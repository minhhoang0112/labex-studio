// Explicit integration run (Linux root / WSL root required):
// node tests/source-course.smoke.mjs <scenario-plan.json>
// Uses new test-only environment IDs; never opens or resets learner lab IDs.
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createTerminalSession } from "../server/pty/terminalManager.js";
import { getEnvironment, getCommandHistory } from "../server/pty/linuxEnvironment.js";
import { verifyDefinition, getVerificationDefinition } from "../server/services/verification.js";
import { getStepReadiness } from "../server/services/readiness.js";

const execute = promisify(execFile);
const providerFlag = process.argv.find((argument) => argument.startsWith("--provider="))?.slice(11);
if (providerFlag) {
  assert.ok(["namespace", "docker"].includes(providerFlag));
  process.env.LABEX_RUNTIME_PROVIDER = providerFlag;
}
const repository = fileURLToPath(new URL("../", import.meta.url));
const planFile = (process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null) || "tests/scenarios/source-course.json";
const plan = JSON.parse(await fs.readFile(path.resolve(repository, planFile), "utf8"));
const only = process.argv.find((argument) => argument.startsWith("--only="))?.slice(7);
const from = process.argv.find((argument) => argument.startsWith("--from="))?.slice(7);
const through = process.argv.find((argument) => argument.startsWith("--through="))?.slice(10);
assert.ok(!(only && (from || through)), "Use --only or a --from/--through range, not both");
if (only) plan.lessons = plan.lessons.filter((lesson) => lesson.lab_id === only);
if (from || through) {
  const first = from ? plan.lessons.findIndex(lesson => lesson.lab_id === from) : 0;
  const last = through ? plan.lessons.findIndex(lesson => lesson.lab_id === through) : plan.lessons.length - 1;
  assert.ok(first >= 0 && last >= first, "Unknown or reversed scenario lesson range");
  plan.lessons = plan.lessons.slice(first, last + 1);
}
assert.equal(plan.version, 1);
assert.ok(Array.isArray(plan.lessons) && plan.lessons.length, "scenario lessons are required");
const runId = Date.now().toString(36);
const reportFile = path.join(repository, ".artifacts", `source-course-smoke-${runId}.json`);
const report = { runId, plan: planFile, selection: { only, from, through }, startedAt: new Date().toISOString(), complete: false, tasks: [] };
const dockerTestSpecs = new Map();
async function persistReport() {
  await fs.mkdir(path.dirname(reportFile), { recursive: true });
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2) + "\n");
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function hostAccountMetadata() {
  const program = "import os,json; paths=['/etc/passwd','/etc/group','/etc/shadow','/etc/gshadow']; print(json.dumps({p:[os.stat(p).st_ino,os.stat(p).st_size,os.stat(p).st_mtime_ns,os.stat(p).st_ctime_ns] for p in paths}))";
  const result = process.platform === "win32"
    ? await execute("wsl.exe", ["--distribution", process.env.WSL_DISTRO || "Ubuntu", "--user", "root", "--exec", "/usr/bin/python3", "-c", program])
    : await execute("/usr/bin/python3", ["-c", program]);
  return JSON.parse(result.stdout);
}

class Socket extends EventEmitter {
  readyState = 1;
  shellReady = false;
  output = "";
  failure;
  send(raw) {
    const message = JSON.parse(raw);
    if (message.type === "ready") this.shellReady = true;
    if (message.type === "output") this.output += message.data;
    if (message.type === "error") this.failure = new Error(message.message);
    if (message.type === "exit" && this.readyState === 1) this.failure ||= new Error(`Shell exited with ${message.exitCode}`);
  }
  write(data) { this.emit("message", Buffer.from(JSON.stringify({ type: "input", data }))); }
  close() { if (this.readyState !== 1) return; this.readyState = 3; this.emit("close"); }
}

async function until(check, timeout = 30000, failureMessage = "Timed out waiting for interactive shell or completed command journal") {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await check();
    if (value) return value;
    await wait(120);
  }
  throw new Error(failureMessage);
}

async function seedAlias(alias, lesson) {
  const isDocker = process.env.LABEX_RUNTIME_PROVIDER === "docker";
  const runner = path.join(repository, isDocker ? "server/pty/docker_runner.py" : "server/pty/linux_runner.py");
  let manifest = path.resolve(repository, lesson.setup_manifest || `server/data/environment-setups/${lesson.lab_id}.json`);
  if (isDocker) {
    const dockerManifest = path.resolve(repository, `server/data/environment-setups/docker/${lesson.lab_id}.json`);
    try { await fs.access(dockerManifest); manifest = dockerManifest; } catch {}
  }
  let runnerPath = runner;
  let manifestPath = manifest;
  let stateBase = path.join(os.homedir(), ".local/share/labex-local/environments");
  let file = "/usr/bin/python3";
  let prefix = [];
  if (process.platform === "win32") {
    const distro = process.env.WSL_DISTRO || "Ubuntu";
    const base = ["--distribution", distro];
    const [r, m, home] = await Promise.all([
      execute("wsl.exe", [...base, "--exec", "wslpath", "-u", runner]),
      execute("wsl.exe", [...base, "--exec", "wslpath", "-u", manifest]),
      execute("wsl.exe", [...base, "--exec", "/usr/bin/python3", "-c", "import os,pwd; print(pwd.getpwuid(os.getuid()).pw_dir)"]),
    ]);
    runnerPath = r.stdout.trim();
    manifestPath = m.stdout.trim();
    stateBase = `${home.stdout.trim()}/.local/share/labex-local/environments`;
    file = "wsl.exe";
    prefix = [...base, ...(isDocker ? [] : ["--user", "root"]), "--exec", "/usr/bin/python3"];
  } else {
    assert.equal(process.platform, "linux");
    if (!isDocker) assert.equal(process.getuid(), 0, "native Linux integration smoke requires root");
  }
  const program = "import importlib.util,sys; from pathlib import Path; spec=importlib.util.spec_from_file_location('runner',sys.argv[1]); runner=importlib.util.module_from_spec(spec); spec.loader.exec_module(runner); manifest=Path(sys.argv[4]); assert manifest.is_file(), 'Source setup manifest is missing'; " + (isDocker ? "runner.create(runner.name_for(sys.argv[3]),sys.argv[3],manifest)" : "runner.initialize(Path(sys.argv[2])/sys.argv[3],sys.argv[3],manifest)");
  if (isDocker) dockerTestSpecs.set(alias, { file, prefix, runnerPath });
  await execute(file, [...prefix, "-c", program, runnerPath, stateBase, alias, manifestPath], { timeout: 20000 });
}

async function stopTestContainer(alias) {
  const spec = dockerTestSpecs.get(alias);
  if (!spec) return;
  assert.ok(alias.startsWith(`source-smoke-${runId}-`), "cleanup only owns current test run IDs");
  const program = "import importlib.util,sys; spec=importlib.util.spec_from_file_location('runner',sys.argv[1]); runner=importlib.util.module_from_spec(spec); spec.loader.exec_module(runner); name=runner.name_for(sys.argv[2]); record=runner.inspect(name); assert record is None or record['Config']['Labels']['io.labex-local.lab']==sys.argv[2]; runner.docker('stop','--time','3',name) if record and record['State']['Running'] else None";
  await execute(spec.file, [...spec.prefix, "-c", program, spec.runnerPath, alias], { timeout: 15000 });
  dockerTestSpecs.delete(alias);
}

let commandSequence = 0;
async function runInteractive(ws, alias, instruction) {
  const item = typeof instruction === "string" ? { command: instruction } : instruction;
  assert.ok(item && typeof item.command === "string" && item.command.trim(), "smoke command must be text");
  const commandTimeout = item.timeout_ms || (/\bapt(?:-get)?\b/.test(item.command) ? 180000 : 30000);
  assert.ok(Number.isInteger(commandTimeout) && commandTimeout > 0 && commandTimeout <= 240000);
  let position = ws.output.length;
  const markerStart = position;
  const previous = (await getCommandHistory(alias)).length;
  ws.write(item.command + (item.append_enter === false ? '' : "\r"));
  const answers = item.input || [];
  for (let index = 0; index < answers.length; index += 1) {
    const answer = answers[index];
    const prompt = typeof answer === "string"
      ? (/\bpasswd\b/.test(item.command) ? (index === 0 ? "New password:" : "Retype new password:") : "Password:")
      : answer.wait_for;
    const text = typeof answer === "string" ? answer : answer.text;
    assert.equal(typeof prompt, "string");
    assert.equal(typeof text, "string");
    await until(() => {
      if (ws.failure) throw ws.failure;
      const found = ws.output.indexOf(prompt, position);
      if (found < 0) return false;
      position = found + prompt.length;
      return true;
    });
    if(typeof answer==='object' && answer.delay_ms){assert.ok(answer.delay_ms>0 && answer.delay_ms<=2000);await wait(answer.delay_ms);}
    ws.write(text + (typeof answer === "object" && answer.raw ? "" : "\r"));
  }
  // A code block can contain several top-level commands. The first new shell
  // journal entry proves only the first command ended, not the entire block.
  // Queue a unique completion marker after the block and interactive replies.
  // Splitting the prefix/token in printf prevents terminal input echo from
  // masquerading as executed output. Capture the last real command's status
  // before printf changes it. Graders still read the genuine shell journal.
  const token = `${runId}-${++commandSequence}`;
  const marker = new RegExp(`__LABEX_SMOKE_DONE_${token}:([0-9]+)__`);
  // Do not type the marker while apt/top/another foreground program owns the
  // TTY: such programs can consume queued keyboard input. A completed journal
  // entry means Bash has regained control; then the marker follows any queued
  // lines of a multi-command block in the same shell.
  await until(async () => {
    if (ws.failure) throw ws.failure;
    return (await getCommandHistory(alias)).length > previous;
  }, commandTimeout);
  // Preserve $? for the next documented instruction (exit-status lessons).
  ws.write(`__labex_smoke_status=$?; printf '__LABEX_SMOKE_DONE_%s:%s__\\n' '${token}' "$__labex_smoke_status"; (exit "$__labex_smoke_status")\r`);
  const status = await until(() => {
    if (ws.failure) throw ws.failure;
    const match = marker.exec(ws.output.slice(markerStart));
    return match ? { value: Number(match[1]) } : false;
  }, commandTimeout, "Timed out waiting for the entire interactive instruction to finish");
  const allowed = item.allowed_status || (/^\s*diff\b/.test(item.command) ? [0, 1] : [0]);
  assert.ok(allowed.includes(status.value), `Interactive command failed with status ${status.value}`);
}

const hostAccountsBefore = await hostAccountMetadata();
const environment = await getEnvironment();
assert.equal(environment.available, true, environment.error);
assert.equal(environment.isolation, true);
console.log(`Runtime: ${environment.label}; test run ${runId}`);
let tasks = 0;
let negativeChecks = 0;
let blocked = 0;
await persistReport();
try {
for (const [index, lesson] of plan.lessons.entries()) {
  const alias = `source-smoke-${runId}-${index + 1}`;
  const source = JSON.parse(await fs.readFile(path.join(repository, "server/data/labs", `${lesson.lab_id}.json`), "utf8"));
  await seedAlias(alias, lesson);
  const ws = new Socket();
  try {
    assert.ok(await createTerminalSession(ws, { labId: alias, cols: 120, rows: 30 }));
    await until(() => { if (ws.failure) throw ws.failure; return ws.shellReady; });
    for (const scenario of lesson.steps) {
      const step = source.steps.find((entry) => entry.id === scenario.id);
      assert.ok(step, `Unknown source step ${lesson.lab_id}/${scenario.id}`);
      const definition = getVerificationDefinition(step);
      const readiness = getStepReadiness(step, source);
      // Mirror POST /api/verify, including boundaries between repeated
      // observations in successive steps (for example reopening less).
      const verificationOptions = { stepIndex: source.steps.indexOf(step), allSteps: source.steps };
      const before = await verifyDefinition(alias, definition, verificationOptions);
      if (scenario.unsupported || !readiness.ready) {
        assert.ok(scenario.unsupported || scenario.allow_missing_capabilities === true,
          `${lesson.lab_id}/${scenario.id}: unexpectedly missing capabilities: ${readiness.missing_capabilities.join(', ')}`);
        assert.ok(!before.supported || !readiness.ready, `${lesson.lab_id}/${scenario.id}: expected an explicitly unsupported rule or capability`);
        assert.equal(before.passed, false);
        const forgedAcknowledgement = await verifyDefinition(alias, definition, { ...verificationOptions, acknowledged: true });
        assert.equal(forgedAcknowledgement.passed, false, "unsupported task must not pass through acknowledgement");
        blocked += 1;
        report.tasks.push({ labId: lesson.lab_id, testEnvironment: alias, stepId: scenario.id, passed: false, blockedAsExpected: true, reason: before.reason || readiness.reasons.join(' '), missingCapabilities: readiness.missing_capabilities });
        await persistReport();
        console.log(`BLOCKED ${lesson.lab_id}/${scenario.id}`);
        continue;
      }
      assert.equal(before.supported, true, before.reason);
      if (!scenario.allow_preexisting) {
        assert.equal(before.passed, false, `${lesson.lab_id}/${scenario.id}: passed before work`);
        negativeChecks += 1;
      }
      try {
        for (const command of scenario.commands || []) await runInteractive(ws, alias, command);
      } catch (error) {
        const tail = ws.output.slice(-2000).replace(/\$[^\s:]+/g, "[redacted-test-hash]").replaceAll("ephemeral-test-only", "[test-input]");
        throw new Error(`${lesson.lab_id}/${scenario.id}: ${error.message}; terminal tail=${JSON.stringify(tail)}`, { cause: error });
      }
      let result = await verifyDefinition(alias, definition, { ...verificationOptions, acknowledged: scenario.acknowledge === true });
      if (scenario.wait_for_pass_ms) {
        assert.ok(Number.isInteger(scenario.wait_for_pass_ms) && scenario.wait_for_pass_ms > 0 && scenario.wait_for_pass_ms <= 180000);
        result = await until(async () => {
          const current = await verifyDefinition(alias, definition, { ...verificationOptions, acknowledged: scenario.acknowledge === true });
          assert.equal(current.supported, true, current.reason);
          return current.passed ? current : false;
        }, scenario.wait_for_pass_ms, "Timed out waiting for actual scheduled task verification");
      }
      assert.equal(result.supported, true, result.reason);
      assert.equal(result.passed, true, `${lesson.lab_id}/${scenario.id}: failed after interactive work`);
      if (lesson.source_lab_id === 49 && scenario.id === "source-49-section-6") {
        await runInteractive(ws, alias, {
          command: `su - joker -c 'test "$(sudo -S -k id -u)" = 0'`,
          input: [
            { wait_for: "Password:", text: "ephemeral-test-only" },
            { wait_for: "[sudo] password for joker:", text: "ephemeral-test-only" },
          ],
        });
        console.log("PASS real su authentication and sudo-group password authorization");
      }
      tasks += 1;
      report.tasks.push({ labId: lesson.lab_id, testEnvironment: alias, stepId: scenario.id, passed: true, beforeFailed: !before.passed });
      await persistReport();
      console.log(`PASS ${lesson.lab_id}/${scenario.id}`);
    }
  } finally { ws.close(); await stopTestContainer(alias); }
}
assert.equal(tasks + blocked, only || from || through ? plan.lessons.reduce((count, lesson) => count + lesson.steps.length, 0) : plan.expected_tasks ?? 47, "unexpected source task coverage");
assert.deepEqual(await hostAccountMetadata(), hostAccountsBefore, "host account databases changed during isolated course tests");
report.complete = true;
report.hostAccountsUnchanged = true;
report.passedTasks = tasks;
report.blockedTasks = blocked;
report.finishedAt = new Date().toISOString();
await persistReport();
console.log(`Source course integration PASS: ${plan.lessons.length} lessons, ${tasks} passed tasks, ${blocked} explicitly blocked tasks, ${negativeChecks} pre-work negative checks; all environments use test-only IDs.`);
console.log(`Report: ${reportFile}`);
} catch (error) {
  report.failure = error.message;
  report.failureMetadata = { code: error.code, runtimeExitCode: error.runtimeExitCode ?? error.cause?.runtimeExitCode,
    runtimeTimedOut: error.runtimeTimedOut ?? error.cause?.runtimeTimedOut,
    runtimeErrorCode: error.runtimeErrorCode ?? error.cause?.runtimeErrorCode,
    runtimeSignal: error.runtimeSignal ?? error.cause?.runtimeSignal };
  report.finishedAt = new Date().toISOString();
  await persistReport();
  throw error;
} finally {
  for (const alias of dockerTestSpecs.keys()) await stopTestContainer(alias);
}
