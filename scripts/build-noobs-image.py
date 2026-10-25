"""Build a dedicated Noobs image; never replace learner containers."""
import importlib.util
import os
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('docker_runner', root/'server/pty/docker_runner.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
if os.getuid() == 0:
    raise SystemExit('Use the rootless Docker owner account.')
subprocess.run(runner.docker_args('build', '--file', str(root/'server/runtime/docker/Noobs.Dockerfile'),
    '--tag', runner.NOOBS_IMAGE, str(root)), env={**os.environ,'DOCKER_BUILDKIT':'0'}, check=True, timeout=600)
check = runner.docker('run','--rm','--entrypoint','/bin/bash',runner.NOOBS_IMAGE,'-ec',
    'for p in cal zsh ssh sshd mkfs.ext4 fdisk man col; do command -v "$p"; done; cal >/dev/null; zsh -fc "exit 0"; test -s /usr/share/man/man1/ls.1.gz; man -P cat ls | grep -q NAME',timeout=25)
print(check.stdout)
print('Dedicated Noobs image verified; no existing learner container was reset.')
