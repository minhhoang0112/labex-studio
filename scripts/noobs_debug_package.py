"""Inspect only an explicitly named stopped disposable Noobs smoke container."""
import importlib.util
import json
from pathlib import Path
import sys

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server/pty'))
import docker_runner as runner

alias=sys.argv[1]
assert alias.startswith('source-smoke-') and alias.endswith('-1')
name=runner.name_for(alias)
record=runner.inspect(name)
assert record['Config']['Labels']['io.labex-local.lab']==alias
assert record['State']['Running'] is False,'Only stopped disposable test containers may be inspected'
try:
    runner.docker('start',name)
    command="for f in /home/labex/project/package-lab/local-package-output.txt /home/labex/project/package-lab/local-package-state.txt; do printf '%s\\n' \"$f\"; od -An -tx1 \"$f\"; done; dpkg-query -W -f='${db:Status-Status}' labex-greeter 2>/dev/null; printf '\\n'"
    print(runner.docker('exec','--user','0',name,*runner.BOOTSTRAP,'command',command,check=False).stdout)
    result=runner.docker('exec','--user','0',name,*runner.BOOTSTRAP,'history')
    history=json.loads(result.stdout)
    for entry in history:
        if 'greeter' in entry.get('command',''):print(json.dumps(entry))
finally:
    runner.docker('stop','--time','3',name)
