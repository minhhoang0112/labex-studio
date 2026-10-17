import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createEnvironmentRouter } from "../server/routes/environment.js";

test("reset requires explicit intent, disconnects only that lab and returns the runtime result", async t => {
  const calls = [];
  const app = express();
  app.use(express.json());
  app.use(createEnvironmentRouter({ findLab: id => id === "known", environment: async () => ({ capabilities: { desktop: false } }),
    status: async id => ({ labId: id, initialized: true, setup_current: false, reset_required: true, reason: "Setup changed; files preserved" }),
    disconnect: async id => calls.push(["disconnect", id]), reset: async id => { calls.push(["reset", id]); return { reset: true, labId: id, reconnectRequired: true }; } }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (id, body) => fetch(`${base}/labs/${id}/reset`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await post("missing", { confirmReset: true })).status, 404);
  assert.equal((await post("known", {})).status, 400);
  assert.deepEqual(calls, []);
  const state = await fetch(`${base}/labs/known/environment`).then(r => r.json());
  assert.equal(state.reset_required, true);
  assert.deepEqual(calls, [], "reading status must never reset learner files");
  const response = await post("known", { confirmReset: true });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reconnectRequired, true);
  assert.deepEqual(calls, [["disconnect", "known"], ["reset", "known"]]);
  assert.equal((await fetch(`${base}/environment`).then(r => r.json())).capabilities.desktop, false);
});
