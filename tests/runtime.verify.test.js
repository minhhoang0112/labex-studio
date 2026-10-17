import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createVerifyRouter } from "../server/routes/verify.js";
import { isValidId, loadLab } from "../server/data/catalog.js";
import { getLabProcess } from "../server/pty/linuxEnvironment.js";

const trustedCommand = `test -f "$HOME/a file's name" && grep -Fxq 'hello "Linux"' "$HOME/a file's name"`;
const lab = { id: "practice", steps: [{ id: "step-1", verify_command: trustedCommand, hint: "Create the file first." }] };

async function request(body, dependencies = {}) {
  const app = express();
  app.use(express.json({ strict: false }));
  app.use(createVerifyRouter({ findLab: (id) => id === lab.id ? lab : null, ...dependencies }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/verify`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

test("verification ignores client commands and preserves trusted shell quotes", async () => {
  let invoked = false;
  const result = await request({ labId: "practice", stepId: "step-1", verifyCommand: "exit 0", command: "exit 0" }, {
    runCommand: async (id, command) => {
      assert.equal(id, "practice");
      assert.equal(command, trustedCommand);
      invoked = true;
      return { exitCode: 1, stdout: "", stderr: "missing file", timedOut: false };
    },
  });
  assert.equal(invoked, true);
  assert.equal(result.status, 200);
  assert.equal(result.body.passed, false);
  assert.equal(result.body.hint, lab.steps[0].hint);
});

test("unknown or malformed identifiers never invoke Linux", async () => {
  const runCommand = async () => assert.fail("must not run");
  for (const body of [null, {}, { labId: "../practice", stepId: "step-1" }, { labId: ["practice"], stepId: "step-1" }]) {
    const result = await request(body, { runCommand });
    assert.equal(result.status, 400);
  }
  for (const body of [{ labId: "missing", stepId: "step-1" }, { labId: "practice", stepId: "missing" }]) {
    assert.equal((await request(body, { runCommand })).status, 404);
  }
});

test("missing and placeholder checks cannot silently pass", async () => {
  for (const verify_command of [undefined, "", "echo 'ok'"]) {
    const result = await request({ labId: "practice", stepId: "step-1", verifyCommand: "exit 0" }, {
      findLab: () => ({ ...lab, steps: [{ id: "step-1", verify_command }] }),
      runCommand: async () => assert.fail("must not run"),
    });
    assert.equal(result.status, 422);
    assert.equal(result.body.passed, false);
  }
});

test("an imported practical task cannot pass by claiming acknowledgement", async () => {
  const result = await request({ labId: "practice", stepId: "step-1", acknowledge: true, success: true }, {
    findLab: () => ({ ...lab, steps: [{ id: "step-1", kind: "task", verification: { kind: "acknowledgement" } }] }),
    runCommand: async () => assert.fail("An unimplemented grader must not execute"),
  });
  assert.equal(result.status, 422);
  assert.equal(result.body.passed, false);
});

test("success, timeout, unavailable environment and runner failures are truthful", async () => {
  const body = { labId: "practice", stepId: "step-1" };
  const success = await request(body, { runCommand: async () => ({ exitCode: 0 }) });
  assert.equal(success.body.passed, true);
  const timeout = await request(body, { runCommand: async () => ({ exitCode: 0, timedOut: true }) });
  assert.equal(timeout.body.passed, false);
  for (const [code, status] of [["ENVIRONMENT_UNAVAILABLE", 503], ["OTHER", 500]]) {
    const result = await request(body, { runCommand: async () => { throw Object.assign(new Error("Linux unavailable"), { code }); } });
    assert.equal(result.status, status);
    assert.equal(result.body.passed, false);
  }
});

test("catalog and process entrypoints reject path traversal", async () => {
  for (const id of ["../x", "x/y", "x\\y", "", null, {}, "x\n"]) {
    assert.equal(isValidId(id), false);
    assert.equal(loadLab(id), null);
    await assert.rejects(getLabProcess(id), TypeError);
  }
});
