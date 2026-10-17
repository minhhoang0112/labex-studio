"""Explicit default-WSL-user smoke; creates and removes only its own test container."""
import importlib.util
import json
from pathlib import Path
import subprocess
import time
import uuid

repository = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('docker_runner', repository / 'server/pty/docker_runner.py')
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)
alias = 'docker-runtime-smoke-' + uuid.uuid4().hex[:12]
name = runtime.name_for(alias)
results = {}


def command(code, timeout=15, check=True):
    return runtime.docker('exec', '--user', '0', name, *runtime.BOOTSTRAP, 'command', code, timeout=timeout, check=check)


try:
    runtime.create(name, alias)
    record = runtime.inspect(name)
    assert not record.get('Mounts'), 'Learner container must have no host mounts'
    assert not record['HostConfig']['Privileged']
    assert record['HostConfig']['NetworkMode'] != 'host'
    command('test "$(whoami)" = labex && test "$HOME" = /home/labex && test "$PWD" = /home/labex/project && sudo -n true')
    command("printf '%s' 'quoted learner file' > '/home/labex/project/a file.txt'")
    command("test \"$(cat '/home/labex/project/a file.txt')\" = 'quoted learner file'")
    command('nohup sleep 1234 >/tmp/process.log 2>&1 & echo $! >/tmp/process.pid')
    command('test "$(ps -o comm= -p "$(cat /tmp/process.pid)")" = sleep && kill "$(cat /tmp/process.pid)"')
    results['persistent_processes'] = True
    command('ip addr show >/dev/null && ifconfig >/dev/null && ss -tuln >/dev/null')
    results['ifconfig'] = True
    command('sudo apt-get update -qq && sudo apt-get install -y --no-install-recommends neofetch >/tmp/apt-install.log && command -v neofetch >/dev/null', timeout=180)
    command('dpkg-query -W -f=\'${db:Status-Status}\' figlet | grep -qx installed && sudo apt-get remove -y figlet >/tmp/apt-remove.log && sudo apt-get autoremove -y >/tmp/apt-autoremove.log && ! dpkg-query -W -f=\'${db:Status-Status}\' libtext-charwidth-perl 2>/dev/null | grep -qx installed', timeout=90)
    results['package_management'] = True
    before = int(command('date +%s').stdout.strip())
    command("printf '%s\\n' '* * * * * date +\\%s >> /tmp/cron-proof' | crontab -")
    deadline = time.monotonic() + 75
    while time.monotonic() < deadline:
        value = command('cat /tmp/cron-proof 2>/dev/null', check=False)
        if value.returncode == 0 and value.stdout.strip():
            assert int(value.stdout.splitlines()[-1]) >= before
            results['cron_scheduler'] = True
            break
        time.sleep(2)
    assert results.get('cron_scheduler'), 'Real cron did not run through a scheduled minute'
    command('crontab -r')
    ping = command('ping -c 3 -W 2 8.8.8.8', check=False)
    results['network'] = ping.returncode == 0
    results['ping_exit_code'] = ping.returncode
    firewall = command('sudo ufw --force enable && sudo ufw allow 8000/tcp && sudo ufw status | grep -q "Status: active"', check=False)
    results['firewall'] = firewall.returncode == 0
    if firewall.returncode:
        results['firewall_error'] = (firewall.stderr + firewall.stdout)[-1800:]
    command('sudo ufw --force disable', check=False)
    results['kernel_logs'] = False
    results['container_no_host_mounts'] = True
    print(json.dumps(results, indent=2))
finally:
    runtime.docker('rm', '--force', name, check=False)
