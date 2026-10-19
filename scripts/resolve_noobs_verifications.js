// Regenerate reviewed checks instead of accepting failed/unrelated commands.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('./audit_noobs_labs.py', import.meta.url));
const result = spawnSync('python', ['-X', 'utf8', script], { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
