"""Run in WSL as the normal Docker daemon owner; preserve learner containers."""
import importlib.util
import os
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('docker_runner', root/'server/pty/docker_runner.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
if os.getuid() == 0:
    raise SystemExit('Use the normal WSL account that owns the rootless Docker daemon.')
environment = {**os.environ, 'DOCKER_BUILDKIT':'0'}
for dockerfile, tag in [('Dockerfile', runner.IMAGE), ('Commands.Dockerfile', runner.COMMANDS_IMAGE)]:
    subprocess.run(runner.docker_args('build', '--file', str(root/'server/runtime/docker'/dockerfile),
                                     '--tag', tag, str(root)),
                   env=environment, check=True, timeout=600)
print('Commands runtime images ready. Existing learner containers have not been reset.')
