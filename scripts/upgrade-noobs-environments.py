"""Install missing course tools in existing owned Noobs containers, preserving files.

Default is inventory only. --apply does not reseed fixtures, reset progress,
change learner accounts or remove containers. New SSH accounts use a fresh lab.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('runner',ROOT/'server/pty/docker_runner.py')
runner=importlib.util.module_from_spec(spec);spec.loader.exec_module(runner)
parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');args=parser.parse_args()
labs={}
for file in (ROOT/'server/data/labs').glob('*.json'):
    lab=json.loads(file.read_text())
    if lab.get('course_id')=='linux-for-noobs':labs[lab['id']]=lab
rows=[json.loads(line) for line in runner.docker('ps','-a','--filter',f'label={runner.LABEL}={runner.OWNER}','--format','{{json .}}').stdout.splitlines() if line.strip()]
owned_names={runner.name_for(lab_id) for lab_id in labs}
report={'applied':args.apply,'containers':[]}
for row in rows:
    name=row['Names']
    if name not in owned_names:continue
    record=runner.inspect(name)
    lab_id=record['Config']['Labels'].get('io.labex-local.lab')
    if lab_id not in labs or name!=runner.name_for(lab_id):continue
    order=labs[lab_id]['order'];entry={'labId':lab_id,'running':record['State']['Running']}
    report['containers'].append(entry)
    if not args.apply:continue
    if order in (32,33):entry['status']='SSH fixture changed; explicit reset archives old files, no automatic account changes.';continue
    started=not record['State']['Running']
    try:
        if started:runner.docker('start',name)
        packages={1:['ncal'],4:['man-db','manpages','bsdextrautils'],10:['zsh'],11:['zsh'],14:['fdisk','e2fsprogs']}.get(order,[])
        if packages:
            script='set -eu; export DEBIAN_FRONTEND=noninteractive; apt-get update -qq; apt-get install -y --no-install-recommends '+' '.join(packages)
            runner.docker('exec','--user','0',name,'/bin/bash','-c',script,timeout=240)
        # Acknowledge only an image/tool change to the same original fixture.
        # Other fixture differences remain visible; never reseed over user work.
        target=runner.manifest(lab_id)
        manifest=target['manifest'];base_path=ROOT/'server/data/environment-setups'/f'{lab_id}.json'
        base=json.loads(base_path.read_text())
        without_image=json.loads(json.dumps(manifest));without_image.get('docker',{}).pop('image',None)
        if without_image.get('docker')=={}:without_image.pop('docker',None)
        if without_image==base:
            current=json.loads(runner.docker('exec','--user','0',name,'cat','/var/lib/labex/initialized.json').stdout)
            allowed={hashlib.sha256(base_path.read_bytes()).hexdigest(),target['manifestSha256']}
            if current.get('manifestSha256') in allowed:
                runner.docker('exec','--user','0',name,'python3','-c',
                    "import json,pathlib;p=pathlib.Path('/var/lib/labex/initialized.json');d=json.loads(p.read_text());d['manifestSha256']="+repr(target['manifestSha256'])+";p.write_text(json.dumps(d))")
                entry['setup_current']=True
            else:
                entry['setup_current']=False
                entry['fixture_warning']='Existing fixture revision differs; preserved without reseeding.'
        entry['status']='tools ready; learner files and accounts preserved'
    except Exception as error:
        entry['error']=str(error)[:300]
    finally:
        if started:runner.docker('stop','--time','5',name,check=False)
report_path=ROOT/'.artifacts/noobs-existing-environment-upgrade.json'
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
