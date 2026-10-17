"""Prove real traffic and UFW enforcement between disposable private peers."""
import importlib.util
import json
from pathlib import Path
import time
import uuid

spec = importlib.util.spec_from_file_location('runtime', Path(__file__).resolve().parents[1] / 'server/pty/docker_runner.py')
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)
token = uuid.uuid4().hex[:12]
aliases = [f'docker-network-smoke-{token}-{role}' for role in ('server', 'peer')]
names = [runtime.name_for(alias) for alias in aliases]
network = 'labex-network-smoke-' + token


def shell(name, code, check=True):
    return runtime.docker('exec', '--user', '0', name, *runtime.BOOTSTRAP, 'command', code, check=check)


def connects(address, port):
    code = 'import socket; socket.create_connection((' + repr(address) + ',' + str(port) + '),2).close()'
    result = runtime.docker('exec', '--user', '1000', names[1], '/usr/bin/python3', '-c', code, check=False, timeout=5)
    return result.returncode == 0


try:
    runtime.docker('network', 'create', '--internal', '--label', f'{runtime.LABEL}={runtime.OWNER}', network)
    for alias, name in zip(aliases, names):
        runtime.create(name, alias)
        if name == names[0]:
            external = shell(name, 'ping -c 3 -W 2 8.8.8.8', check=False)
            assert external.returncode == 0, 'Actual source-required external ICMP failed'
        runtime.docker('network', 'connect', network, name)
        runtime.docker('network', 'disconnect', 'bridge', name)
    record = runtime.inspect(names[0])
    address = record['NetworkSettings']['Networks'][network]['IPAddress']
    # Genuine TCP listeners; port 22 proves a port rule, not SSH authentication.
    listener = "import socket,threading,time\ndef serve(p):\n s=socket.socket(); s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1); s.bind(('0.0.0.0',p)); s.listen()\n while True:\n  c,a=s.accept(); c.close()\nfor p in (22,8000): threading.Thread(target=serve,args=(p,),daemon=True).start()\ntime.sleep(300)"
    runtime.docker('exec', '-d', '--user', '0', names[0], '/usr/bin/python3', '-c', listener)
    time.sleep(.5)
    assert connects(address, 22) and connects(address, 8000), 'Baseline private traffic failed'
    shell(names[0], 'sudo ufw default deny incoming && sudo ufw default allow outgoing && sudo ufw --force enable')
    assert not connects(address, 22) and not connects(address, 8000), 'UFW did not deny real inbound traffic'
    shell(names[0], 'sudo ufw allow 8000/tcp')
    assert connects(address, 8000) and not connects(address, 22), '8000 allow rule did not selectively permit traffic'
    shell(names[0], 'sudo ufw allow 22/tcp')
    assert connects(address, 22), '22/tcp rule did not permit TCP traffic'
    shell(names[0], 'sudo ufw delete allow 8000/tcp')
    assert not connects(address, 8000) and connects(address, 22), 'Deleting 8000 rule did not restore denial'
    shell(names[0], 'sudo ufw --force disable')
    assert connects(address, 8000), 'Disabling firewall did not restore traffic'
    result = {'passed': True, 'network_ports': True, 'external_icmp': True, 'firewall': True, 'peer': 'two disposable containers on an internal private bridge',
              'traffic': 'actual TCP connect to ports 8000 and 22; deny, selective allow, rule removal and disable tested',
              'ssh_authentication': False, 'host_mounts': False, 'host_network': False}
    print(json.dumps(result, indent=2))
finally:
    for alias, name in zip(aliases, names):
        record = runtime.inspect(name)
        if record and record['Config']['Labels'].get('io.labex-local.lab') == alias:
            runtime.docker('rm', '--force', name, check=False)
    runtime.docker('network', 'rm', network, check=False)
