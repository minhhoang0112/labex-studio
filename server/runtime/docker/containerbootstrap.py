"""Trusted private-container initialization, shell entry and minimal PID 1."""
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

from linux_runner import BASHRC, ACCOUNT, apply_manifest, history, write_file, writable_path

MARKER = Path('/var/lib/labex/initialized.json')


def initialize():
    payload = json.load(sys.stdin)
    if MARKER.exists():
        return
    manifest = payload.get('manifest')
    if manifest is not None:
        # Docker has a private writable /usr layer; namespace runtimes keep
        # their default strict fixture roots and never receive this extension.
        apply_manifest(Path('/'), manifest, extra_writable_prefixes=('/usr/local/bin/',))
    runtime = (manifest or {}).get('docker', {})
    if not isinstance(runtime, dict):
        raise ValueError('Docker setup must be an object')
    processes = []
    for item in runtime.get('startup', []):
        script = item.get('script')
        target = writable_path(Path('/'), script)
        if not target.is_file() or not script.endswith('.sh'):
            raise ValueError('Startup script must be a private manifest .sh file')
        args = item.get('args', [])
        if not isinstance(args, list) or any(not isinstance(value, str) or len(value) > 4096 for value in args):
            raise ValueError('Invalid startup arguments')
        if item.get('user', 'labex') != 'labex':
            raise ValueError('Startup processes must run as labex')
        processes.append(['/bin/bash', script, *args])
    for item in runtime.get('http_services', []):
        port = item.get('port')
        directory = item.get('directory', '/home/labex/project')
        if not isinstance(port, int) or not 1024 <= port <= 65535 or not writable_path(Path('/'), directory).is_dir():
            raise ValueError('Invalid private HTTP service')
        if item.get('user', 'labex') != 'labex':
            raise ValueError('HTTP service must run as labex')
        processes.append(['/usr/bin/python3', '-m', 'http.server', str(port), '--bind', '0.0.0.0', '--directory', directory])
    write_file(Path('/var/lib/labex/startup.json'), json.dumps(processes))
    write_file(Path('/etc/labex.bashrc'), BASHRC)
    write_file(Path('/opt/labex/bashrc'), "source /etc/labex.bashrc\nprintf '__LABEX_LOCAL_SHELL_READY_173A__\\n'\n")
    journal = Path('/var/log/labex/commands.tsv')
    write_file(journal, '')
    os.chown(journal, 1000, 1000)
    write_file(MARKER, json.dumps({'manifestSha256': payload.get('manifestSha256'), 'labId': payload['labId'], 'runnerVersion': 1}))


def shell(command=None):
    if not MARKER.exists():
        raise RuntimeError('Container setup has not completed')
    # Run through setpriv to load current supplementary group membership.
    args = ['/usr/bin/setpriv', '--reuid=labex', '--regid=labex', '--init-groups', '/bin/bash', '--noprofile']
    args += ['--rcfile', '/opt/labex/bashrc', '-i'] if command is None else ['--norc', '-c', command]
    os.chdir('/home/labex/project')
    os.execve(args[0], args, {**os.environ, 'HOME': '/home/labex', 'USER': 'labex', 'LOGNAME': 'labex', 'SHELL': '/bin/bash'})


def serve():
    # A real daemon stays in this same persistent PID namespace as all execs.
    stopping = False
    def stop(_signal, _frame):
        nonlocal stopping
        stopping = True
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    cron = subprocess.Popen(['/usr/sbin/cron', '-f'])
    started = False
    try:
        while not stopping:
            if MARKER.exists() and not started:
                processes = json.loads(Path('/var/lib/labex/startup.json').read_text())
                for argv in processes:
                    subprocess.Popen(['/usr/bin/setpriv', '--reuid=labex', '--regid=labex', '--init-groups', *argv], cwd='/home/labex/project', stdin=subprocess.DEVNULL)
                started = True
            if cron.poll() is not None:
                raise RuntimeError('Private cron daemon exited unexpectedly')
            # Reap orphaned learner descendants adopted by PID 1.
            while True:
                try:
                    child, _ = os.waitpid(-1, os.WNOHANG)
                    if child == 0:
                        break
                except ChildProcessError:
                    break
            time.sleep(.2)
    finally:
        if cron.poll() is None:
            cron.terminate()
            try:
                cron.wait(timeout=3)
            except subprocess.TimeoutExpired:
                cron.kill()


def main():
    mode = sys.argv[1]
    if mode == 'serve':
        serve()
    elif mode == 'initialize':
        initialize()
    elif mode == 'interactive':
        shell()
    elif mode == 'command':
        shell(sys.argv[2])
    elif mode == 'history':
        print(json.dumps(history(Path('/'))))
    elif mode == 'status':
        print(MARKER.read_text() if MARKER.exists() else '{}')
    elif mode == 'probe':
        result = subprocess.run(['/bin/bash', '-c', 'test "$(id -u labex)" = 1000 && command -v sudo apt-get crontab ip ifconfig ss >/dev/null && pgrep -x cron >/dev/null && sudo -u labex sudo -n true'], capture_output=True, text=True)
        if result.returncode:
            raise RuntimeError('Container semantic probe failed: ' + result.stderr[:250])
        release = {}
        for line in Path('/etc/os-release').read_text().splitlines():
            if '=' in line:
                key, value = line.split('=', 1)
                release[key] = value.strip('"')
        if release.get('VERSION_ID') != '22.04':
            raise RuntimeError('Expected genuine Ubuntu 22.04 image')
        print(json.dumps({'osVersion': release['PRETTY_NAME']}))
    else:
        raise ValueError('Unknown container operation')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        print(f'Linux runtime: {error}', file=sys.stderr)
        raise SystemExit(78)
