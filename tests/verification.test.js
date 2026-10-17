import test from "node:test";
import assert from "node:assert/strict";
import { verifyDefinition, hasUnconditionalSuccess, getVerificationDefinition } from "../server/services/verification.js";

test("provider-specific grading is selected by server configuration and preserves the unsupported fallback", () => {
  const step = { verification: { kind: "unsupported", reason: "Requires a writable package image" },
    verification_by_provider: { docker: { kind: "state", command: "check-real-package-state" } } };
  assert.equal(getVerificationDefinition(step, "namespace").kind, "unsupported");
  assert.equal(getVerificationDefinition(step, "docker").command, "check-real-package-state");
});

test("an informational Continue step requires explicit acknowledgement and never runs Linux", async () => {
  const options = { runCommand: () => assert.fail("No command task"), readHistory: () => assert.fail("No history task") };
  const rule = { kind: "acknowledgement", scope: "informational" };
  assert.equal((await verifyDefinition("intro", rule, options)).passed, false);
  assert.equal((await verifyDefinition("intro", rule, { ...options, acknowledged: true })).passed, true);
});

test("scraped practical tasks cannot use acknowledgement as a fallback grader", async () => {
  const rule = { kind: "acknowledgement" };
  const result = await verifyDefinition("practical", rule, { acknowledged: true });
  assert.equal(result.supported, false);
  assert.equal(result.passed, false);
  for (const verification of [rule, { kind: "all", checks: [rule] }, { ...rule, scope: "informational" }]) {
    assert.equal(getVerificationDefinition({ verification }).kind, "unsupported");
  }
  assert.equal(getVerificationDefinition({ action: "continue", verification: { ...rule, scope: "informational" } }).kind, "acknowledgement");
});

test("display-only tasks require completed commands, not an invented output file", async () => {
  const rule = { kind: "commands", groups: [["^whoami$", "^id -un$"]], user: "labex" };
  const evaluate = history => verifyDefinition("challenge", rule, {
    readHistory: async () => history, runCommand: () => assert.fail("No file check belongs to this task"),
  });
  assert.equal((await evaluate([])).passed, false);
  assert.equal((await evaluate([{ command: "whoami", status: 127, user: "labex" }])).passed, false);
  assert.equal((await evaluate([{ command: "whoami", status: 0, user: "root" }])).passed, false);
  assert.equal((await evaluate([{ command: "echo whoami", status: 0, user: "labex" }])).passed, false);
  assert.equal((await evaluate([{ command: "id -un", status: 0, user: "labex" }])).passed, true);
});

test("a meaningful diff exit code can satisfy a comparison lesson", async () => {
  const result = await verifyDefinition("comparison", { kind: "commands", groups: [["^diff file1 file2$"]], allowed_status: [0, 1] }, {
    readHistory: async () => [{ command: "diff file1 file2", status: 1, user: "labex" }],
  });
  assert.equal(result.passed, true);
});

test("repeated pager invocations need new work after a nested combined previous task", async () => {
  const pager = { kind: "commands", user: "labex", groups: [["^less server_log.txt$"]] };
  const combined = { kind: "all", checks: [{ kind: "state", command: "check-private-fixture" }, pager] };
  const allSteps = [{ verification: combined }, { verification: combined }];
  const entry = { command: "less server_log.txt", status: 0, user: "labex" };
  const options = { runCommand: async () => ({ exitCode: 0 }), stepIndex: 1, allSteps };
  assert.equal((await verifyDefinition("pager", combined, { ...options, readHistory: async () => [entry] })).passed, false);
  assert.equal((await verifyDefinition("pager", combined, { ...options, readHistory: async () => [entry, entry] })).passed, true);
});

test("history boundaries match multi-group tasks across separate commands and skip unfinished earlier tasks", async () => {
  const previous = { kind: "commands", groups: [["^pwd$"], ["^ls$"]] };
  const current = { kind: "commands", groups: [["^ls$"]] };
  const entry = command => ({ command, status: 0, user: "labex" });
  const options = { stepIndex: 1, allSteps: [{ verification: previous }, { verification: current }] };
  assert.equal((await verifyDefinition("history", current, { ...options, readHistory: async () => [entry("pwd"), entry("ls")] })).passed, false);
  assert.equal((await verifyDefinition("history", current, { ...options, readHistory: async () => [entry("pwd"), entry("ls"), entry("ls")] })).passed, true);
  assert.equal((await verifyDefinition("history", current, { ...options, readHistory: async () => [entry("ls")] })).passed, true);
});

test("all checks must pass and unsupported requirements cannot be marked complete", async () => {
  const result = await verifyDefinition("ownership", { kind: "all", checks: [
    { kind: "state", command: "test-owner-and-mode" }, { kind: "unsupported", reason: "Unobserved fixture" },
  ] }, { runCommand: async () => ({ exitCode: 0 }) });
  assert.equal(result.supported, false);
  assert.equal(result.passed, false);
});

test("unconditional legacy success is rejected before executing Linux", async () => {
  for (const command of ["true", ":", "echo 'ok'", "grep whoami ~/.bash_history || true"]) {
    assert.equal(hasUnconditionalSuccess(command), true);
    const result = await verifyDefinition("legacy", { kind: "state", command }, { runCommand: () => assert.fail("must not execute") });
    assert.equal(result.supported, false);
    assert.equal(result.passed, false);
  }
});

test("generic command-history fallbacks never mark an unrelated task complete", async () => {
  for (const pattern of [".", ".*", "^.*$", "^.+$"]) {
    const result = await verifyDefinition("unimplemented", { kind: "commands", groups: [[pattern]] }, {
      readHistory: () => assert.fail("A generic pattern must be rejected before reading history"),
    });
    assert.equal(result.supported, false);
    assert.equal(result.passed, false);
  }
});
