"""Create ONLY the dedicated VMware lab. No calls modify any existing VM.
Requires the official image downloader and project-local pycdlib installation.
"""
from pathlib import Path
import subprocess,json,sys,secrets,uuid,io,hashlib
ROOT=Path(__file__).resolve().parents[1]
VM=ROOT/'server/runtime/vms/linux-upskill-lab'
KEYS=ROOT/'server/runtime/keys'
WORKSTATION=Path(r'C:\Program Files (x86)\VMware\VMware Workstation')
sys.path.insert(0,str(ROOT/'.tools/luc-vm-python'))
import pycdlib

def run(args,timeout=180):
    p=subprocess.run([str(a) for a in args],capture_output=True,text=True,timeout=timeout,creationflags=subprocess.CREATE_NO_WINDOW)
    if p.returncode:raise RuntimeError(f'{Path(str(args[0])).name} failed: '+p.stderr[-500:]+p.stdout[-500:])
    return p.stdout
if not (WORKSTATION/'vmrun.exe').is_file():raise SystemExit('VMware Workstation required')
if VM.exists():
    marker=VM/'owner.json'
    if not marker.is_file() or json.loads(marker.read_text()).get('course')!='linux-upskill-challenge':raise SystemExit('Refuse an existing unowned folder')
else:
    VM.mkdir(parents=True)
    (VM/'owner.json').write_text(json.dumps({'course':'linux-upskill-challenge','run':uuid.uuid4().hex,'note':'Separate lab; never modify the CV VM'}))
KEYS.mkdir(parents=True,exist_ok=True)
# Private keys, seed and console secret remain local and ignored by Git.
for folder in [VM,KEYS]:
    run(['icacls.exe',folder,'/inheritance:r','/grant:r',f'{__import__("getpass").getuser()}:(OI)(CI)F','*S-1-5-18:(OI)(CI)F','*S-1-5-32-544:(OI)(CI)F'])
ssh_keygen=Path(r'C:\Windows\System32\OpenSSH\ssh-keygen.exe')
for stem in ['luc-client','luc-host']:
    p=KEYS/stem
    if not p.exists():run([ssh_keygen,'-q','-t','ed25519','-N','','-f',p])
image=ROOT/'.artifacts/upskill-vm-download/ubuntu-24.04-server-cloudimg-amd64.vmdk'
info=json.loads((image.parent/'manifest.json').read_text())
with image.open('rb') as f: digest=hashlib.file_digest(f,'sha256').hexdigest()
if digest!=info['sha256']:raise SystemExit('Image SHA mismatch')
disk=VM/'ubuntu.vmdk'
if not disk.exists():
    print('Converting a new disk for the dedicated lab...',flush=True)
    run([WORKSTATION/'vmware-vdiskmanager.exe','-r',image,'-t','0',disk],300)
    run([WORKSTATION/'vmware-vdiskmanager.exe','-x','20GB',disk],120)
vmx=VM/'linux-upskill-lab.vmx'
if vmx.exists():
    print('Dedicated VM already prepared. Existing configuration left intact.');sys.exit(0)
owner=json.loads((VM/'owner.json').read_text())
password=secrets.token_urlsafe(24)
(KEYS/'luc-console.txt').write_text('VM console only; SSH still requires key.\nUser: luc\nPassword: '+password+'\n',encoding='utf-8')
data={'hostname':'luc-lab','manage_etc_hosts':True,'ssh_pwauth':False,'disable_root':True,
 'users':[{'name':'luc','gecos':'Linux Upskill learner','groups':['sudo'],'sudo':['ALL=(ALL:ALL) NOPASSWD:ALL'],'shell':'/bin/bash','lock_passwd':False,'ssh_authorized_keys':[(KEYS/'luc-client.pub').read_text().strip()]}],
 'chpasswd':{'expire':False,'users':[{'name':'luc','password':password,'type':'text'}]},
 'ssh_deletekeys':False,'ssh_keys':{'ed25519_private':(KEYS/'luc-host').read_text(),'ed25519_public':(KEYS/'luc-host.pub').read_text().strip()},
 'package_update':True,'packages':['openssh-server','open-vm-tools','python3','sudo','curl','ca-certificates','less','man-db','nano','vim'],
 'write_files':[{'path':'/etc/labex-upskill-vm','owner':'root:root','permissions':'0644','content':'LabEx Linux Upskill Challenge dedicated VM v1\n'}],
 'runcmd':[['systemctl','enable','--now','ssh'],['systemctl','enable','--now','open-vm-tools']]}
files={'user-data':'#cloud-config\n'+json.dumps(data),'meta-data':json.dumps({'instance-id':'luc-'+owner['run'],'local-hostname':'luc-lab'}),'network-config':json.dumps({'version':2,'ethernets':{'labnet':{'match':{'name':'e*'},'dhcp4':True,'optional':True}}})}
iso=pycdlib.PyCdlib();iso.new(interchange_level=3,joliet=3,rock_ridge='1.09',vol_ident='cidata')
for i,(name,content) in enumerate(files.items()):
    raw=content.encode();iso.add_fp(io.BytesIO(raw),len(raw),iso_path=f'/DATA{i}.;1',rr_name=name,joliet_path='/'+name)
iso.write(str(VM/'seed.iso'));iso.close()
vmx.write_text('''.encoding = "UTF-8"
config.version = "8"
virtualHW.version = "18"
displayName = "LabEx Linux Upskill LAB - separate from CV"
guestOS = "ubuntu-64"
firmware = "efi"
uefi.secureBoot.enabled = "FALSE"
numvcpus = "2"
memsize = "2048"
scsi0.present = "TRUE"
scsi0.virtualDev = "lsilogic"
scsi0:0.present = "TRUE"
scsi0:0.fileName = "ubuntu.vmdk"
ide1:0.present = "TRUE"
ide1:0.deviceType = "cdrom-image"
ide1:0.fileName = "seed.iso"
ide1:0.startConnected = "TRUE"
ethernet0.present = "TRUE"
ethernet0.connectionType = "nat"
ethernet0.virtualDev = "e1000"
ethernet0.addressType = "generated"
usb.present = "FALSE"
sound.present = "FALSE"
floppy0.present = "FALSE"
uuid.action = "create"
tools.syncTime = "TRUE"
''',encoding='utf-8')
print('Created separate VMware lab: 2 vCPU, 2 GiB RAM, 20 GiB sparse disk, NAT. No existing VM modified.')
print('VMX: '+str(vmx))
