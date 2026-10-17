import { spawnSync } from "node:child_process";
// The launcher name avoids Node's automatic test-file discovery patterns.
const result = spawnSync(process.execPath, ["--test"], {
  stdio: "inherit", windowsHide: true,
  env: { ...process.env, LABEX_RUNTIME_PROVIDER: "docker" },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
