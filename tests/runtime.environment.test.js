import test from "node:test";
import assert from "node:assert/strict";
import { createEnvironmentProbe } from "../server/pty/linuxEnvironment.js";

test("concurrent health, terminal and verification share one Linux probe", async () => {
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const environment = createEnvironmentProbe({
    probe: async () => { calls += 1; await gate; return { exitCode: 0 }; },
  });
  const requests = Array.from({ length: 24 }, () => environment());
  assert.equal(calls, 1);
  release();
  const results = await Promise.all(requests);
  assert.equal(results.every((result) => result.available), true);
  assert.equal(results.every((result) => result === results[0]), true);
});

test("healthy Linux result stays cached for sixty seconds", async () => {
  let time = 0;
  let calls = 0;
  const environment = createEnvironmentProbe({
    now: () => time,
    probe: async () => { calls += 1; return { exitCode: 0 }; },
  });
  await environment();
  time = 59000;
  await environment();
  assert.equal(calls, 1);
  time = 60001;
  await Promise.all([environment(), environment(), environment()]);
  assert.equal(calls, 2);
});

test("failed Linux probe retries soon and logs only diagnostic fields", async () => {
  let time = 0;
  let calls = 0;
  const diagnostics = [];
  const environment = createEnvironmentProbe({
    now: () => time,
    report: (message) => diagnostics.push(message),
    probe: async () => {
      calls += 1;
      return calls === 1
        ? { exitCode: 1, timedOut: true, stderr: "secret output", error: { code: "ETIMEDOUT", signal: "SIGTERM", message: "secret details" } }
        : { exitCode: 0 };
    },
  });
  assert.equal((await environment()).available, false);
  time = 1000;
  assert.equal((await environment()).available, false);
  assert.equal(calls, 1);
  time = 1600;
  assert.equal((await environment()).available, true);
  assert.equal(calls, 2);
  assert.match(diagnostics[0], /ETIMEDOUT/);
  assert.match(diagnostics[0], /SIGTERM/);
  assert.match(diagnostics[0], /timeout=true/);
  assert.doesNotMatch(diagnostics[0], /secret/);
});

test("synchronous probe rejection reports Linux unavailable", async () => {
  const environment = createEnvironmentProbe({
    probe: () => { throw Object.assign(new Error("permission denied"), { code: "EPERM" }); },
    report: () => {},
  });
  assert.equal((await environment()).available, false);
});
