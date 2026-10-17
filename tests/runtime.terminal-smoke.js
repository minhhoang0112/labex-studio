// Explicit integration check: node tests/runtime.terminal-smoke.js
import { EventEmitter } from "node:events";
import assert from "node:assert/strict";
import { createTerminalSession } from "../server/pty/terminalManager.js";
import { execLabCommand, getCommandHistory, resetLabEnvironment } from "../server/pty/linuxEnvironment.js";

class Socket extends EventEmitter {
  readyState = 1;
  output = "";
  shellReady = false;
  send(raw) {
    const message = JSON.parse(raw);
    if (message.type === "error") this.emit("terminal-error", new Error(message.message));
    if (message.type === "ready") this.shellReady = true;
    if (message.type === "output") {
      this.output += message.data;
      if (/PTY_SMOKE_OK\r*\n/.test(this.output)) this.emit("complete");
    }
  }
  close() { this.readyState = 3; this.emit("close"); }
}

await resetLabEnvironment("runtime-terminal-smoke");
const ws = new Socket();
let timeout;
const complete = new Promise((resolve, reject) => {
  timeout = setTimeout(() => reject(new Error(`PTY smoke timeout: ${ws.output}`)), 15000);
  ws.once("complete", resolve);
  ws.once("terminal-error", reject);
});
try {
  const terminal = await createTerminalSession(ws, { labId: "runtime-terminal-smoke" });
  assert.ok(terminal);
  ws.emit("message", Buffer.from("touch malformed-packet-was-executed\n"));
  ws.emit("message", Buffer.from(JSON.stringify({ type: "resize", cols: -1, rows: 999999 })));
  for (const data of ["\x1b[?1;2c", "\x1b[>0;276;0c", "\x1b[I", "\x1b[O"]) {
    ws.emit("message", Buffer.from(JSON.stringify({ type: "input", data })));
  }
  ws.emit("message", Buffer.from(JSON.stringify({ type: "input", data: "whoami\nid\nfalse\ntest ! -e malformed-packet-was-executed && printf '%s' 'shared terminal state' > pty-state.txt && printf '\\nPTY_SMOKE_OK\\n'\n" })));
  await complete;
  assert.equal(ws.shellReady, true);
  assert.doesNotMatch(ws.output, /__LABEX_LOCAL_SHELL_READY_173A__/);
  const verification = await execLabCommand("runtime-terminal-smoke", "grep -Fxq 'shared terminal state' /home/labex/project/pty-state.txt");
  assert.equal(verification.exitCode, 0, verification.stderr);
  const history = await getCommandHistory("runtime-terminal-smoke");
  assert.ok(history.some((entry) => entry.command === "whoami" && entry.status === 0 && entry.user === "labex"));
  assert.ok(history.some((entry) => entry.command === "id" && entry.status === 0));
  assert.ok(history.some((entry) => entry.command === "false" && entry.status === 1));
  assert.equal(history.length, 4, "DA/focus responses must not become Bash commands");
  assert.equal(history.some((entry) => entry.command.includes("1;2c")), false);
  console.log("PTY Bash, malformed packet rejection, shared project filesystem and command/status/user journal verified.");
} finally {
  clearTimeout(timeout);
  ws.close();
}
