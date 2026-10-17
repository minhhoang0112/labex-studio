// Explicit integration check: node tests/runtime.wsl-smoke.js
// Creates files and accounts only in a dedicated namespace environment.
import assert from "node:assert/strict";
import { getEnvironment, execLabCommand, resetLabEnvironment } from "../server/pty/linuxEnvironment.js";

const environment = await getEnvironment();
console.log(environment);
assert.equal(environment.available, true);
assert.equal(environment.provider, "linux-namespaces");
assert.equal(environment.desktop, false);
assert.equal(environment.webide, false);
await resetLabEnvironment("runtime-smoke");
const first = await execLabCommand("runtime-smoke", `set -e; test "$(whoami)" = labex; test "$(id -u)" = 1000; test "$HOME" = /home/labex; test "$PWD" = /home/labex/project; printf '%s\\n' 'hello "Linux"' > "a file's name"; printf '%s\\n' "$HOME"`);
assert.equal(first.exitCode, 0, first.stderr);
assert.equal(first.stdout, "/home/labex\n");
const second = await execLabCommand("runtime-smoke", `grep -Fxq 'hello "Linux"' "a file's name" && printf '%s' verified`);
assert.equal(second.exitCode, 0, second.stderr);
assert.equal(second.stdout, "verified");
const failure = await execLabCommand("runtime-smoke", "test -f file-that-does-not-exist");
assert.notEqual(failure.exitCode, 0);
const accounts = await execLabCommand("runtime-smoke", `set -e
sudo -n true
sudo useradd -m -U -s /bin/bash runtime_test_user
sudo groupadd runtime_test_group
printf 'runtime_test_user:ephemeral-test-only\\n' | sudo chpasswd
sudo passwd -l runtime_test_user >/dev/null
sudo passwd -S runtime_test_user | grep -q ' L '
sudo passwd -u runtime_test_user >/dev/null
sudo passwd -S runtime_test_user | grep -q ' P '
touch permissions.txt
sudo chown runtime_test_user:runtime_test_group permissions.txt
chmod 760 permissions.txt 2>/dev/null || sudo chmod 760 permissions.txt
test "$(stat -c '%U:%G %a' permissions.txt)" = 'runtime_test_user:runtime_test_group 760'
sudo userdel runtime_test_user
sudo groupdel runtime_test_group
! getent passwd runtime_test_user
test ! -e /home/minh
test ! -e /mnt/c
grep -q '00000000000000db' /proc/self/status
findmnt -n -o OPTIONS --target /usr | grep -q '^ro,'
printf 'private accounts verified'
`);
assert.equal(accounts.exitCode, 0, accounts.stderr);
assert.match(accounts.stdout, /private accounts verified/);
const reset = await resetLabEnvironment("runtime-smoke-reset");
assert.equal(reset.reset, true);
assert.equal((await execLabCommand("runtime-smoke-reset", "touch before-reset.txt")).exitCode, 0);
const next = await resetLabEnvironment("runtime-smoke-reset");
assert.equal(next.backupCreated, true);
assert.equal((await execLabCommand("runtime-smoke-reset", "test ! -e before-reset.txt")).exitCode, 0);
console.log("Isolated identity/HOME/project, persistent files, quoting, real sudo/account management, permissions, read-only /usr and reset archive verified.");
