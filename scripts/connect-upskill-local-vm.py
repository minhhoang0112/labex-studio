"""Discover only this lab's DHCP lease, pin its pre-generated host key and set LUC env."""
from pathlib import Path
import re,json,ipaddress
ROOT=Path(__file__).resolve().parents[1]
vm=ROOT/'server/runtime/vms/linux-upskill-lab'
assert json.loads((vm/'owner.json').read_text())['course']=='linux-upskill-challenge'
text=(vm/'linux-upskill-lab.vmx').read_text()
mac=re.search(r'ethernet0.generatedAddress\s*=\s*"([0-9a-f:]+)"',text,re.I).group(1)
leases=Path('C:/ProgramData/VMware/vmnetdhcp.leases').read_text()
matches=[(ip,body) for ip,body in re.findall(r'^lease (\d+\.\d+\.\d+\.\d+)\s*\{(.*?)^}',leases,re.M|re.S) if mac.lower() in body.lower()]
if not matches:raise SystemExit('Dedicated VM has no DHCP lease yet; wait for first boot')
host=matches[-1][0]
if not ipaddress.ip_address(host).is_private:raise SystemExit('Expected VMware private address')
keys=ROOT/'server/runtime/keys'
known=keys/'luc-known-hosts'
public=(keys/'luc-host.pub').read_text().split()
known.write_text(host+' '+public[0]+' '+public[1]+'\n')
values={'LUC_SSH_HOST':host,'LUC_SSH_PORT':'22','LUC_SSH_USER':'luc','LUC_SSH_KEY':(keys/'luc-client').as_posix(),'LUC_SSH_KNOWN_HOSTS':known.as_posix()}
env=ROOT/'.env'
lines=env.read_text(encoding='utf-8').splitlines()
lines=[line for line in lines if line.split('=',1)[0] not in values]
env.write_text('\n'.join(lines+[k+'='+v for k,v in values.items()])+'\n',encoding='utf-8')
print('Connected profile for dedicated local lab: '+host+' (SSH host key pinned from seed, CV VM untouched).')
