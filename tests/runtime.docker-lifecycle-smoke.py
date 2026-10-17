"""Exercise lifecycle only on a disposable uniquely labelled test environment."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import time
import uuid

runner = Path(__file__).resolve().parents[1] / 'server/pty/docker_runner.py'
spec = importlib.util.spec_from_file_location('runtime', runner)
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)
alias = 'docker-lifecycle-smoke-' + uuid.uuid4().hex[:12]
name = runtime.name_for(alias)
archive_names = []


def cli(mode, command=None):
    args = [sys.executable, str(runner), '--lab', alias, '--mode', mode]
    if command is not None:
        args += ['--command=' + command]
    return subprocess.run(args, text=True, capture_output=True, timeout=15)


try:
    assert not runtime.status(name, alias)['initialized']
    assert json.loads(cli('history').stdout) == []
    assert runtime.inspect(name) is None, 'History read must not initialize'
    runtime.create(name, alias)
    assert runtime.status(name, alias)['setup_current']
    assert cli('command', 'printf preserved > /home/labex/project/work.txt').returncode == 0
    runtime.docker('stop', '--time', '3', name)
    assert not runtime.inspect(name)['State']['Running']
    assert runtime.status(name, alias)['setup_current']
    assert not runtime.inspect(name)['State']['Running'], 'Status must not start stopped containers'
    assert cli('command', 'test "$(cat work.txt)" = preserved').returncode == 0
    original_manifest = runtime.manifest
    runtime.manifest = lambda lab_id: {**original_manifest(lab_id), 'manifestSha256': 'changed-for-test'}
    assert runtime.status(name, alias)['reset_required']
    runtime.manifest = original_manifest
    assert cli('command', 'test "$(cat work.txt)" = preserved').returncode == 0
    started = time.monotonic()
    timeout = cli('command', 'exec -a labex-owned-verifier-timeout sleep 90')
    assert timeout.returncode == 124, timeout.stderr
    assert time.monotonic() - started < 9
    assert cli('command', "! pgrep -f '[l]abex-owned-verifier-timeout' >/dev/null").returncode == 0, 'Timed-out verifier survived'
    reset = cli('reset')
    assert reset.returncode == 0, reset.stderr
    assert json.loads(reset.stdout)['backupCreated']
    assert cli('command', 'test ! -e work.txt').returncode == 0
    all_names = runtime.docker('ps', '-a', '--filter', f'label=io.labex-local.lab={alias}', '--format', '{{.Names}}').stdout.splitlines()
    archive_names = [item for item in all_names if item.startswith(name + '-archive-')]
    assert len(archive_names) == 1
    saved = runtime.inspect(archive_names[0])
    assert not saved['State']['Running']
    # Read archived learner content without restarting it.
    assert runtime.docker('cp', archive_names[0] + ':/home/labex/project/work.txt', '-').returncode == 0
    print(json.dumps({'passed': True, 'status_read_only': True, 'restart_preserves_work': True,
                      'manifest_change_preserves_work': True, 'verifier_timeout_stops_inner_process': True,
                      'reset_archives_old_container': True, 'learner_containers_touched': False}, indent=2))
finally:
    candidates = [name, *archive_names]
    # Recover archive names even if an assertion failed after reset.
    result = runtime.docker('ps', '-a', '--filter', f'label=io.labex-local.lab={alias}', '--format', '{{.Names}}', check=False)
    candidates += result.stdout.splitlines()
    for candidate in set(candidates):
        if candidate != name and not candidate.startswith(name + '-archive-'):
            continue
        record = runtime.inspect(candidate)
        if record and record['Config']['Labels'].get('io.labex-local.lab') == alias:
            runtime.docker('rm', '--force', candidate, check=False)
