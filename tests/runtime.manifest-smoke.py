"""Explicit WSL-root integration check; all files live in temporary test state."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile

runner_path = Path(__file__).resolve().parents[1] / "server/pty/linux_runner.py"
spec = importlib.util.spec_from_file_location("linux_runner", runner_path)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)

with tempfile.TemporaryDirectory(prefix="labex-manifest-test-") as directory:
    base = Path(directory)
    root = base / "environment"
    manifest = base / "setup.json"
    manifest.write_text(json.dumps({
        "version": 1,
        "groups": [{"name": "group1", "gid": 1200, "members": ["labex"]}],
        "accounts": [{"name": "user1", "uid": 1001, "group": "group1"}, {"name": "j.doe", "uid": 1002, "password_status": "unlocked"}],
        "directories": [{"path": "/home/labex/Desktop", "mode": "755"}],
        "files": [{"path": "/tmp/hello", "content": "local test fixture\n", "owner": "root:root", "mode": "644"}],
    }))
    runner.initialize(root, "runtime-manifest", manifest)
    assert runner.environment_status(root, "runtime-manifest", manifest)["setup_current"] is True
    runner.write_file(root / "tmp/edit-crontab", "#!/bin/sh\nsleep 1\nprintf '%s\\n' '* * * * * /bin/true' > \"$1\"\n", 0o755)
    registration = subprocess.run(runner.command_args(root, "set -e; EDITOR=/tmp/edit-crontab crontab -e; crontab -l | grep -Fxq '* * * * * /bin/true'; crontab -r"), capture_output=True, text=True, timeout=15)
    assert registration.returncode == 0, registration.stdout + registration.stderr
    dotted = subprocess.run(runner.command_args(root, "set -e; getent passwd j.doe; sudo passwd -S j.doe | grep -q ' P '; sudo passwd -l j.doe >/dev/null; sudo passwd -S j.doe | grep -q ' L '; sudo passwd -u j.doe >/dev/null; sudo passwd -S j.doe | grep -q ' P '; id -Gn | grep -qw group1; sudo useradd b.smith; getent passwd b.smith | grep -q ':/bin/sh$'; test ! -d /home/b.smith; sudo userdel b.smith"), capture_output=True, text=True, timeout=15)
    assert dotted.returncode == 0, dotted.stdout + dotted.stderr
    sgid = subprocess.run(runner.command_args(root, "set -e; sudo chown user1:group1 /home/labex/Desktop; sudo chmod 2770 /home/labex/Desktop; test \"$(sudo stat -c '%a' /home/labex/Desktop)\" = 2770; probe=$(mktemp /home/labex/Desktop/inheritance-XXXXXX); test \"$(stat -c '%G' \"$probe\")\" = group1; rm \"$probe\""), capture_output=True, text=True, timeout=15)
    assert sgid.returncode == 0, sgid.stdout + sgid.stderr
    result = subprocess.run(runner.command_args(root, "set -e; getent passwd user1; getent group group1; test -d ~/Desktop; grep -Fxq 'local test fixture' /tmp/hello; sudo chown user1:group1 /tmp/hello; sudo chmod 760 /tmp/hello; test \"$(stat -c '%U:%G %a' /tmp/hello)\" = 'user1:group1 760'; sudo useradd -m -U runtime_su_user; printf 'runtime_su_user:ephemeral-test-only\\n' | sudo chpasswd; printf 'ephemeral-test-only\\n' | su runtime_su_user -c 'test \"$(whoami)\" = runtime_su_user'; sudo userdel -r runtime_su_user"), capture_output=True, text=True, timeout=15)
    assert result.returncode == 0, result.stdout + result.stderr
    with (root / "tmp/hello").open("r+") as fixture:
        fixture.seek(0)
        fixture.write("learner work\n")
        fixture.truncate()
    runner.initialize(root, "runtime-manifest", manifest)
    assert (root / "tmp/hello").read_text() == "learner work\n", "fixture must not overwrite learner work"
    manifest.write_text(manifest.read_text() + "\n")
    status = runner.environment_status(root, "runtime-manifest", manifest)
    assert status["initialized"] is True and status["setup_current"] is False and status["reset_required"] is True
    assert (root / "tmp/hello").read_text() == "learner work\n", "status check must not rewrite learner files"
    for invalid in ("/etc/passwd", "/home/../etc/passwd", "relative/path"):
        try:
            runner.writable_path(root, invalid)
        except ValueError:
            pass
        else:
            raise AssertionError("unsafe manifest path accepted")
    (root / "tmp/escape").symlink_to("/etc")
    try:
        runner.writable_path(root, "/tmp/escape/passwd")
    except ValueError:
        pass
    else:
        raise AssertionError("setup followed symlink")
    journal = root / "var/log/labex/commands.tsv"
    journal.unlink()
    journal.symlink_to("/etc/passwd")
    try:
        runner.history(root)
    except OSError:
        pass
    else:
        raise AssertionError("history reader followed learner symlink outside environment")
assert subprocess.run(["getent", "passwd", "user1"], capture_output=True).returncode != 0
assert subprocess.run(["getent", "passwd", "runtime_su_user"], capture_output=True).returncode != 0
print("Manifest fixtures, dotted users/password lock, group membership, ownership760, real su, private crontab-e registration, seed-once and symlink guards verified; host accounts unchanged. Cron execution is not provided.")
