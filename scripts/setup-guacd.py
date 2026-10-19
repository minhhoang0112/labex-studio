"""Start a private, loopback-only guacd container on the existing rootless engine."""
import importlib.util
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('labex_docker', root / 'server/pty/docker_runner.py')
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)
name = 'labex-guacd'
image = 'guacamole/guacd:1.6.0'
result = runtime.docker('container', 'inspect', name, check=False)
if result.returncode == 0:
    record = json.loads(result.stdout)[0]
    if record.get('Config', {}).get('Labels', {}).get('io.labex-local.component') != 'guacd':
        sys.exit('Refusing to modify an existing container without the guacd ownership label.')
    bindings = record.get('HostConfig', {}).get('PortBindings', {}).get('4822/tcp', [])
    if bindings != [{'HostIp': '127.0.0.1', 'HostPort': '4822'}]:
        sys.exit('Existing guacd binding differs; inspect it manually instead of recreating it.')
    runtime.docker('start', name)
else:
    runtime.docker('pull', image, timeout=300)
    runtime.docker('run', '-d', '--name', name,
                   '--label', 'io.labex-local.component=guacd', '--restart', 'unless-stopped',
                   '--security-opt', 'no-new-privileges', '--cap-drop', 'ALL',
                   '-p', '127.0.0.1:4822:4822', image, timeout=60)
print(json.dumps({'container': name, 'image': image, 'host': '127.0.0.1', 'port': 4822}))
