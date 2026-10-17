"""Optional persistent Ubuntu 22 Docker provider, run as the rootless daemon owner.

No host filesystem is mounted in learner containers. Commands use Docker CLI
argument arrays; only trusted verifier code is passed to the private Bash shell.
"""
import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import uuid

ID = re.compile(r'[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}\Z')
SETUPS = Path(__file__).resolve().parents[1] / 'data/environment-setups'
APP = Path.home() / '.local/share/labex-local/docker-rootless'
DOCKER = os.environ.get('LABEX_DOCKER_BIN', str(APP / 'versions/29.9.1/bin/docker'))
SOCKET = os.environ.get('LABEX_DOCKER_SOCKET', str(APP / 'run/docker.sock'))
IMAGE = os.environ.get('LABEX_DOCKER_IMAGE', 'labex-local/ubuntu22:1')
COMMANDS_IMAGE = 'labex-local/commands-ubuntu22:1'
LABEL = 'io.labex-local.provider'
OWNER = 'ubuntu22-v1'
BOOTSTRAP = ['/usr/bin/python3', '/opt/labex/containerbootstrap.py']


def docker_args(*args):
    return [DOCKER, '--host', f'unix://{SOCKET}', *args]


def docker(*args, input=None, check=True, timeout=15):
    result = subprocess.run(docker_args(*args), input=input, text=True, capture_output=True, timeout=timeout)
    if check and result.returncode:
        raise RuntimeError('Docker operation failed: ' + result.stderr.strip()[:300])
    return result


def name_for(lab_id):
    # Fixed lower-case hash avoids collisions and Docker name normalization.
    return 'labex-local-' + hashlib.sha256(lab_id.encode()).hexdigest()[:24]


def inspect(name):
    result = docker('container', 'inspect', name, check=False)
    if result.returncode:
        if 'No such' in result.stderr:
            return None
        raise RuntimeError('Cannot inspect private container: ' + result.stderr.strip()[:300])
    record = json.loads(result.stdout)[0]
    if record.get('Config', {}).get('Labels', {}).get(LABEL) != OWNER:
        raise RuntimeError('Refusing a container without application ownership label')
    return record


def manifest(lab_id, manifest_path=None):
    path = manifest_path or SETUPS / 'docker' / f'{lab_id}.json'
    if manifest_path is None and not path.is_file():
        path = SETUPS / f'{lab_id}.json'
    raw = path.read_bytes() if path.is_file() else None
    return {'labId': lab_id, 'manifest': json.loads(raw) if raw else None,
            'manifestSha256': hashlib.sha256(raw).hexdigest() if raw is not None else None}


def create(name, lab_id, manifest_path=None):
    recipe = manifest(lab_id, manifest_path)
    runtime = (recipe.get('manifest') or {}).get('docker', {})
    if not isinstance(runtime, dict):
        raise ValueError('Docker setup must be an object')
    requested_image = runtime.get('image')
    if requested_image is not None and requested_image != COMMANDS_IMAGE:
        raise ValueError('Unsupported trusted course image override')
    image = requested_image or IMAGE
    docker('create', '--name', name, '--hostname', 'labex', '--label', f'{LABEL}={OWNER}',
           '--label', f'io.labex-local.lab={lab_id}', '--cap-add', 'NET_ADMIN',
           '--network', 'bridge', image)
    docker('start', name)
    docker('exec', '-i', '--user', '0', name, *BOOTSTRAP, 'initialize', input=json.dumps(recipe))


def ensure(name, lab_id):
    record = inspect(name)
    if record is None:
        create(name, lab_id)
    else:
        if record.get('Config', {}).get('Labels', {}).get('io.labex-local.lab') != lab_id:
            raise RuntimeError('Container lab identity does not match')
        if not record['State']['Running']:
            docker('start', name)
        marker = docker('exec', '--user', '0', name, *BOOTSTRAP, 'status')
        if not json.loads(marker.stdout):
            raise RuntimeError('Container initialization was interrupted; explicit reset required')


def status(name, lab_id):
    recipe = manifest(lab_id)
    result = {'labId': lab_id, 'initialized': False, 'setup_current': False,
              'reset_required': False, 'manifest_available': recipe['manifest'] is not None,
              'reason': 'Environment has not been initialized.'}
    record = inspect(name)
    if record is None:
        return result
    # docker cp reads stopped containers without starting or changing them.
    stored = subprocess.run(docker_args('cp', f'{name}:/var/lib/labex/initialized.json', '-'), capture_output=True, timeout=10)
    if stored.returncode:
        return {**result, 'initialized': True, 'reset_required': True,
                'reason': 'Initialization marker unavailable; learner files preserved.'}
    # docker cp emits a tar stream, so use binary subprocess and bounded extraction.
    import io
    import tarfile
    with tarfile.open(fileobj=io.BytesIO(stored.stdout)) as archive:
        item = archive.extractfile('initialized.json')
        if item is None:
            raise RuntimeError('Container marker archive is invalid')
        marker = json.loads(item.read(16384))
    current = marker.get('manifestSha256') == recipe['manifestSha256']
    return {**result, 'initialized': True, 'setup_current': current, 'reset_required': not current,
            'reason': 'Environment setup is current.' if current else 'Setup changed; explicit reset archives the old container before applying it.'}


def probe():
    info = json.loads(docker('info', '--format', '{{json .}}').stdout)
    if not any('rootless' in value for value in info.get('SecurityOptions', [])):
        raise RuntimeError('Configured Docker endpoint is not rootless; refusing host-root daemon')
    name = 'labex-probe-' + uuid.uuid4().hex[:12]
    try:
        create(name, 'runtime-probe')
        metadata = json.loads(docker('exec', '--user', '0', name, *BOOTSTRAP, 'probe').stdout)
    finally:
        # Only this disposable probe container is removed; learner state is never deleted.
        docker('rm', '--force', name, check=False)
    capabilities = {key: True for key in ('terminal', 'files', 'users', 'sudo', 'permissions', 'shell', 'archives', 'packages', 'persistentProcesses', 'cron', 'cronRegistration', 'ip', 'ifconfig', 'ss')}
    capabilities.update({'network': False, 'firewall': False, 'kernelLogs': False, 'desktop': False, 'webide': False})
    capabilities.update({'persistent_processes': True, 'package_management': True, 'cron_scheduler': True})
    evidence_file = Path(__file__).resolve().parents[1] / 'runtime/docker/capabilities.json'
    if evidence_file.is_file():
        evidence = json.loads(evidence_file.read_text())
        if evidence.get('version') == 1 and evidence.get('image') == IMAGE:
            capabilities.update(evidence.get('capabilities', {}))
    print(json.dumps({'available': True, 'provider': 'docker-rootless', 'shell': '/bin/bash',
        'label': 'Private rootless container / ' + metadata['osVersion'], **metadata,
        'user': 'labex', 'home': '/home/labex', 'cwd': '/home/labex/project',
        'isolated': True, 'isolation': True, 'network': capabilities.get('network', False), 'desktop': False, 'webide': False,
        'capabilities': capabilities, 'engineVersion': info.get('ServerVersion'),
        'cgroupDriver': info.get('CgroupDriver'),
        'lifecycle': {'persistence': 'per-lab container writable layer', 'processes': 'terminal and verifier share persistent PID namespace',
                      'reset': 'stops and renames old container as archive; reconnect required', 'scheduler': 'real private cron daemon'},
        'setupProvenance': 'Ubuntu 22.04 official base with local course compatibility fixtures'}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--probe', action='store_true')
    parser.add_argument('--state-base')
    parser.add_argument('--lab')
    parser.add_argument('--mode', choices=('interactive', 'command', 'history', 'reset', 'status'), default='command')
    parser.add_argument('--command')
    args = parser.parse_args()
    if os.geteuid() == 0:
        raise RuntimeError('Docker provider must run as the rootless daemon owner, not WSL root')
    if args.probe:
        probe()
        return
    if not args.lab or not ID.fullmatch(args.lab):
        raise ValueError('Valid lab ID required')
    if args.mode == 'command' and not args.command:
        raise ValueError('Verification command required')
    name = name_for(args.lab)
    if args.mode == 'status':
        print(json.dumps(status(name, args.lab)))
        return
    lock_dir = APP / 'locks'
    lock_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd = os.open(lock_dir / (name + '.lock'), os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if args.mode == 'reset':
            record = inspect(name)
            if record is not None:
                if record['State']['Running']:
                    docker('stop', '--time', '5', name)
                archive = name + '-archive-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:6]
                docker('rename', name, archive)
            create(name, args.lab)
            print(json.dumps({'reset': True, 'labId': args.lab, 'backupCreated': record is not None, 'reconnectRequired': True}))
            return
        if args.mode == 'history' and inspect(name) is None:
            print('[]')
            return
        ensure(name, args.lab)
    # A killed Docker CLI can leave its exec process alive in the container.
    # Bound trusted verifier process groups inside the private container too;
    # interactive learner work and persistent services have no such timeout.
    deadline = ['/usr/bin/timeout', '--signal=TERM', '--kill-after=1s', '5s'] if args.mode == 'command' else []
    argv = docker_args('exec', *(['-it'] if args.mode == 'interactive' else []), '--user', '0', name,
                       *deadline, *BOOTSTRAP, args.mode, *([args.command] if args.mode == 'command' else []))
    os.execv(argv[0], argv)


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        print(f'Linux runtime: {error}', file=sys.stderr)
        raise SystemExit(78)
