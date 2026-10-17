// The Windows process broker starts this helper independently of the coding
// terminal. No scheduled task or boot service is registered.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const workspace = fileURLToPath(new URL("../", import.meta.url));
const artifacts = path.join(workspace, ".artifacts");
fs.mkdirSync(artifacts, { recursive: true });
const out = fs.openSync(path.join(artifacts, "server.stdout.log"), "a");
const err = fs.openSync(path.join(artifacts, "server.stderr.log"), "a");
const child = spawn(process.execPath, [path.join(workspace, "server/server.js")], {
  cwd: workspace, detached: true, windowsHide: true, stdio: ["ignore", out, err],
});
child.on("error", error => fs.appendFileSync(path.join(artifacts, "server.stderr.log"), error.message + "\n"));
fs.writeFileSync(path.join(artifacts, "server.pid"), String(child.pid));
child.unref();
fs.closeSync(out);
fs.closeSync(err);
