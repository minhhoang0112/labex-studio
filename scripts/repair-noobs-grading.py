"""Reviewed Noobs contracts; preserve lesson IDs, source captures and live files.

Writes dedicated Docker manifests and scenarios, never resets a learner.
"""
import copy
import json
from pathlib import Path
import re
import shlex
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from audit_noobs_labs import actions

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'server/data'
BASE='/home/labex/project/'


def py(code): return "python3 - <<'NOOBS_CHECK'\n"+code.strip()+"\nNOOBS_CHECK"
def state(command): return {'kind':'state','command':command}
def commands(*groups, statuses=None):
    return {'kind':'commands','user':'labex','allowed_status':statuses or [0],
            'groups':[[g] if isinstance(g,str) else g for g in groups]}
def all_checks(*checks): return {'kind':'all','checks':list(checks)}
def exact(path,value): return 'cmp -s '+shlex.quote(path)+' <(printf %s '+shlex.quote(value)+')'
def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    text=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
    if not path.exists() or path.read_text(encoding='utf-8')!=text:path.write_text(text,encoding='utf-8')


def main():
    labs=[]
    for path in (DATA/'labs').glob('*.json'):
        lab=json.loads(path.read_text(encoding='utf-8'))
        if lab.get('course_id')=='linux-for-noobs':labs.append((path,lab))
    labs.sort(key=lambda pair:pair[1]['order'])
    plan=json.loads((ROOT/'tests/scenarios/linux-for-noobs-docker.json').read_text(encoding='utf-8'))
    previous={row['lab_id']:row for row in plan['lessons']}
    plan['lessons']=[]
    plan['provenance']='Reviewed against displayed instructions and actual isolated runtime; local graders, not original LabEx private checks.'
    patches={}
    root=BASE+'first-commands/'
    patches[1,2]=state(py(f'''from pathlib import Path
import datetime, subprocess
root=Path({root!r})
saved=datetime.date.fromisoformat((root/'today.txt').read_text().strip())
assert abs((datetime.date.today()-saved).days)<=1
calendar=(root/'calendar.txt').read_text()
expected=subprocess.check_output(['cal',str(saved.month),str(saved.year)],text=True)
assert calendar.strip()==expected.strip()
'''))
    patches[4,1]=state(py(f'''from pathlib import Path
text=Path({(BASE+'command-help/command-types.txt')!r}).read_text()
assert any(('builtin' in line or 'built-in' in line) and line.startswith('cd ') for line in text.splitlines())
assert any(line.startswith('ls ') for line in text.splitlines())
assert any(line.startswith('cp ') for line in text.splitlines())
'''))
    patches[4,3]=all_checks(state('test -s '+BASE+'command-help/ls-man-excerpt.txt && grep -Eq "NAME|LS\\(1\\)" '+BASE+'command-help/ls-man-excerpt.txt'),
        commands(r'^\s*man\s+ls\s*$'))
    patches[4,4]=state('test -s '+BASE+'command-help/password-topics.txt && grep -Eq "^passwd[[:space:](]" '+BASE+'command-help/password-topics.txt')
    patches[10,5]=state('test -f /home/labex/.zshrc && test "$(env -u PROJECT_DIR zsh -ic \'printf %s "$PROJECT_DIR"\')" = /home/labex/project && '+exact(BASE+'environment-lab/future-shell.txt','PROJECT_DIR=/home/labex/project\n/home/labex/bin/course-status\n'))
    patches[11,1]=state('test -f /home/labex/.zshrc && test "$(env -u PROJECT_DIR zsh -ic \'printf %s "$PROJECT_DIR"\')" = /home/labex/project && '+exact(BASE+'project-variable.txt','/home/labex/project\n'))
    patches[6,4]=all_checks(state('sudo passwd -S contractor | awk \'{exit !($2=="L")}\''),
        commands(r'^\s*sudo\s+usermod\s+-L\s+contractor\s*$',r'^\s*sudo\s+usermod\s+-U\s+contractor\s*$'))
    patches[6,8]=all_checks(state('test "$(stat -c %U:%G '+BASE+'team-share/labex-note.txt)" = labex:developers'),commands(r'^\s*newgrp\s+developers\s*$'))
    patches[3,7]=all_checks(state(exact(BASE+'file-basics/shortcuts-complete.txt','Shortcuts practiced\n')),
        {'kind':'terminal-input','keys':['up','tab','ctrl-c','ctrl-l']},
        commands(r'^\s*tail\s+-f\s+/dev/null\s*$',statuses=[130]))
    patches[24,5]=all_checks(state('test -f '+BASE+'process-lab/job-control.done && ! pgrep -f "^labex-job 300$" >/dev/null'),
        {'kind':'terminal-input','keys':['ctrl-z','ctrl-c']},
        commands(r'^\s*bg\s+%[0-9]+\s*$'),commands(r'^\s*fg\s+%[0-9]+\s*$',statuses=[130]))
    patches[14,1]=all_checks(commands(r'^\s*lsblk\s+-o\s+NAME,TYPE,SIZE,FSTYPE,MOUNTPOINTS\s*$',
        r'^\s*findmnt\s+-T\s+/home/labex/project\s*$'),state('test -d '+BASE+'storage-lab'))
    patches[14,3]=state('test "$(stat -c %s '+BASE+'storage-lab/virtual.img)" = 134217728 && test "$(sudo blkid -s TYPE -o value '+BASE+'storage-lab/virtual.img)" = ext4 && test "$(sudo blkid -s LABEL -o value '+BASE+'storage-lab/virtual.img)" = LABEXDATA')
    patches[14,5]=all_checks(state('test "$(stat -c %s '+BASE+'storage-lab/partition-demo.img)" = 67108864 && test "$(sudo blkid -s TYPE -o value '+BASE+'storage-lab/virtual.img)" = ext4 && ! sudo blkid -p '+BASE+'storage-lab/partition-demo.img >/dev/null 2>&1'),
        commands(r'^\s*sudo\s+fdisk\s+-l\s+virtual\.img\s*$',r'^\s*sudo\s+fdisk\s+-l\s+partition-demo\.img\s*$'))
    patches[30,1]=state(py(f'''from pathlib import Path
import subprocess
name=subprocess.check_output(['hostname'],text=True).strip()
addresses=' '.join(subprocess.check_output(['hostname','-I'],text=True).split())
assert Path({(BASE+'network-lab/host-identity.txt')!r}).read_text()==f'hostname={{name}}\naddresses={{addresses}}\n'
'''.replace("{name}\naddresses={addresses}\n'", "{name}\\naddresses={addresses}\\n'")))
    patches[30,6]=all_checks(state('cmp -s '+BASE+'network-lab/http-response.html <(curl -fsS http://127.0.0.1:8088/) && grep -Fq "network demo ready" '+BASE+'network-lab/http-response.html'),
        commands(r'^\s*(?:sudo\s+)?ss\s+-ltnp\s*\|\s*grep\s+[\x27\x22]?:8088[\x27\x22]?\s*$'))
    for order in (29,31):
        patches[order,1]={'kind':'unsupported','reason':'Bài cần systemd và service thật trên Ubuntu Server VM. Runtime container hiện không có systemd PID 1; không chấm đạt chỉ vì đã gõ systemctl hoặc curl.'}
    hints={
        (1,1):'Cần lưu Hello, Linux vào /home/labex/project/first-commands/greeting.txt, không chỉ in ra màn hình.',
        (1,2):'Trong /home/labex/project/first-commands, chạy date +%F > today.txt và cal > calendar.txt. Bộ chấm kiểm tra cả ngày hợp lệ và nội dung lịch; tệp cùng tên ở thư mục khác không thay thế kết quả của bước này.',
        (1,3):'Cần calculation.txt chứa kết quả 42 tại /home/labex/project/first-commands. Tên đúng là calculation.txt (không thêm s).',
        (3,1):'Trong /home/labex/project/file-basics, chạy pwd > starting-location.txt để lưu vị trí, không chỉ xem pwd.',
        (3,2):'relative-location.txt phải nằm ở /home/labex/project/file-basics và chứa đường dẫn kết thúc bằng /path-map/south.',
        (3,3):'Lưu danh sách có tên ẩn bằng ls -A > all-names.txt trong /home/labex/project/file-basics.',
        (3,4):'Kiểm tra workspace/docs/guide.txt có đủ hai dòng trong hướng dẫn và workspace/logs/app.log đã được tạo.',
        (3,5):'Trong workspace/logs, lưu printf \'%s\\n\' *.log > matched-logs.txt. Tệp cần chứa đủ các tên log được hướng dẫn.',
        (3,6):'Bản guide.txt và workspace/archived-guide.txt phải giống nhau; docs/guide-backup.txt và logs/notes.txt đã được di chuyển/xóa đúng bước.',
    }

    for path,lab in labs:
        order=lab['order']
        fixture_path=DATA/'environment-setups/docker'/path.name
        fixture=json.loads((fixture_path if fixture_path.exists() else DATA/'environment-setups'/path.name).read_text(encoding='utf-8'))
        fixture.setdefault('docker',{})['image']='labex-local/noobs-ubuntu22:1'
        if order==6:
            for account in fixture['accounts']:
                if account['name']=='contractor':account['password_status']='unlocked'
        overrides={}
        if order in (32,33):
            setup_ssh(lab,fixture,patches,overrides)
        old_cases={s['id']:s for s in previous[lab['id']]['steps']}
        cases=[]
        for step in lab['steps']:
            number=step['position']
            rule=copy.deepcopy(patches.get((order,number),step.get('verification_by_provider',{}).get('docker',step['verification'])))
            # Cron comments are not a learning objective; the documented nano
            # session need not insert our integration helper's private comment.
            if order==36 and number==6:
                rule['checks'][0]['command']=rule['checks'][0]['command'].replace("[line for line in p.stdout.splitlines() if line.strip()]", "[' '.join(line.split()) for line in p.stdout.splitlines() if line.strip() and not line.lstrip().startswith('#')]").replace("['## LabEx managed backup schedule', '","['")
                rule['checks'][1]=commands([r'^\s*(?:EDITOR=\S+\s+)?crontab\s+-e\s*$',r'^\s*crontab\s+backup\.crontab\s*$'])
            # apt -y is optional for people who answer the confirmation prompt.
            def relax(check):
                if check.get('kind')=='commands':
                    check['groups']=[[p.replace(r'\s+-y\s+',r'\s+(?:-y\s+)?').replace(r'\s+apt\s+',r'\s+apt(?:-get)?\s+') for p in group] for group in check['groups']]
                for child in check.get('checks',[]):relax(child)
            relax(rule)
            if (order,number) in hints:
                step['hint_vi']=hints[order,number]
                def explain(check):
                    if check.get('kind')=='state':check['failure_hint']=hints[order,number]
                    for child in check.get('checks',[]):explain(child)
                explain(rule)
            step.setdefault('verification_by_provider',{})['docker']=rule
            section=next(s for s in lab['sections'] if s['id']==step['id'])
            # Keep original English captures untouched. Correct the local typo.
            for item in (step,section):
                if order==1 and number==5 and item.get('content_vi'):
                    item['content_vi']=item['content_vi'].replace('`calculations.txt`','`calculation.txt`')
                item['verification_by_provider']=copy.deepcopy(step['verification_by_provider'])
                item['required_capabilities_by_provider']=copy.deepcopy(step.get('required_capabilities_by_provider',{}))
                if (order,number) in hints:item['hint_vi']=hints[order,number]
            case=copy.deepcopy(old_cases[step['id']])
            unsupported=rule['kind']=='unsupported'
            if unsupported:
                case={'id':step['id'],'commands':[],'unsupported':True,'reason':rule['reason']}
            elif (order,number) in patches:
                case={'id':step['id'],'commands':actions(section['content'])}
                if order==4 and number==3:
                    case['commands']=[{'command':'man ls','input':[{'wait_for':'LS(1)','text':'q','raw':True}]},'man -P cat ls | col -b | head -n 20 > ls-man-excerpt.txt']
                if order==3 and number==7:
                    case['commands']=['cd '+BASE+'file-basics/workspace/docs','cat guide.txt',
                        {'command':'# Recall previous command','input':[{'wait_for':'','text':'\x1b[A','raw':True},{'wait_for':'','text':'\r','raw':True}]},
                        {'command':'cat g','append_enter':False,'input':[{'wait_for':'','text':'\t','raw':True},{'wait_for':'','text':'\r','raw':True}]},
                        {'command':'tail -f /dev/null','input':[{'wait_for':'tail -f /dev/null','text':'\x03','raw':True,'delay_ms':150}],'allowed_status':[130]},
                        {'command':'echo shortcuts','input':[{'wait_for':'','text':'\x0c','raw':True}]},
                        'echo "Shortcuts practiced" > '+BASE+'file-basics/shortcuts-complete.txt']
                if order==24 and number==5:
                    case['commands']=['cd '+BASE+'process-lab',
                        {'command':"bash -c 'exec -a labex-job sleep 300'",'input':[{'wait_for':'sleep 300','text':'\x1a','raw':True,'delay_ms':150}],'allowed_status':[148]},
                        'jobs -l','bg %1','jobs -l',
                        {'command':'fg %1','input':[{'wait_for':'fg %1','text':'\x03','raw':True,'delay_ms':150}],'allowed_status':[130]},'touch job-control.done']
                if order==6 and number==8:
                    case['commands']=[{'command':'newgrp developers','input':[{'wait_for':'labex@labex:',
                        'text':"id\ntouch /home/labex/project/team-share/labex-note.txt\nstat -c 'owner=%U group=%G mode=%a' /home/labex/project/team-share/labex-note.txt\nexit"}]}]
                if order==14 and number==1:case['allow_preexisting']=False
                if order==14 and number==5:case['commands']=[c for c in case['commands'] if (c.get('command','') if isinstance(c,dict) else c)!='sudo fdisk -l']
                if order==30 and number in (1,6):case['commands']=[c for c in case['commands'] if not re.search(r'\b(?:systemctl|hostnamectl)\b',c.get('command','') if isinstance(c,dict) else c)]
                if order==11:
                    case['commands']=["printf '%s\\n' 'export PROJECT_DIR=\"$HOME/project\"' >> /home/labex/.zshrc",'source /home/labex/.zshrc',"printf '%s\\n' \"$PROJECT_DIR\" > /home/labex/project/project-variable.txt"]
            elif case.get('unsupported'):
                case={'id':step['id'],'commands':actions(section['content'])}
                if order==11:
                    case['commands']=["printf '%s\\n' 'export PROJECT_DIR=\"$HOME/project\"' >> /home/labex/.zshrc",
                        "zsh -ic 'printf \"%s\\n\" \"$PROJECT_DIR\"' > /home/labex/project/environment-config-proof.txt"]
            if number in overrides:case={'id':step['id'],'commands':overrides[number]}
            cases.append(case)
        lab['grading_audit']={'date':'2026-10-24','scope':'Noobs instruction/fixture/grader consistency','image':'labex-local/noobs-ubuntu22:1','original_private_grader':'unknown'}
        write(path,lab);write(fixture_path,fixture)
        plan['lessons'].append({'lab_id':lab['id'],'source_lab_id':lab['source_lab_id'],'setup_manifest':lab['environment_setup'],'steps':cases})
    write(ROOT/'tests/scenarios/linux-for-noobs-docker.json',plan)
    print('Updated Noobs contracts/manifests/scenarios; no learner files touched.')


def setup_ssh(lab,fixture,patches,overrides):
    order=lab['order']; user='remoteuser' if order==32 else 'opsuser'
    root=BASE+('ssh-lab' if order==32 else 'remote-admin')
    fixture['accounts']=[{'name':user,'uid':2000,'group':user,'shell':'/bin/bash','password_status':'unlocked'}]
    fixture['groups']=[{'name':user,'gid':2000}]
    def directory(path,owner='labex:labex',mode='0755'):return {'path':path,'owner':owner,'mode':mode}
    fixture['directories']=[directory(root),directory('/home/'+user,user+':'+user),directory('/home/'+user+'/incoming',user+':'+user)]
    fixture['files']=[{'path':'/home/'+user+'/.bashrc','owner':user+':'+user,'content':"PS1='"+user+"@labex:\\w\\$ '\n"}]
    service='mode=training\nport=8080\n'
    if order==33:fixture['files'].append({'path':root+'/service.conf','owner':'labex:labex','content':service})
    boot='''#!/bin/bash
set -eu
sudo mkdir -p /run/sshd
if ! sudo test -f /etc/ssh/labex_host_ed25519; then sudo ssh-keygen -q -t ed25519 -N '' -f /etc/ssh/labex_host_ed25519; fi
sudo tee /etc/ssh/labex_sshd_config >/dev/null <<'CONFIG'
Port 22
ListenAddress 127.0.0.1
ListenAddress ::1
HostKey /etc/ssh/labex_host_ed25519
PidFile /run/labex-sshd.pid
PasswordAuthentication yes
PubkeyAuthentication yes
UsePAM no
PermitRootLogin no
LogLevel VERBOSE
Subsystem sftp internal-sftp
CONFIG
'''
    boot+=f"printf '%s\\n' '{user}:RemoteLab123!' | sudo chpasswd\n"
    if order==33:
        boot+=f'''if [ ! -f '{root}/id_ed25519' ]; then ssh-keygen -q -t ed25519 -N '' -f '{root}/id_ed25519'; fi
sudo install -d -m 700 -o {user} -g {user} /home/{user}/.ssh
sudo install -m 600 -o {user} -g {user} '{root}/id_ed25519.pub' /home/{user}/.ssh/authorized_keys
'''
    boot+="sudo /usr/sbin/sshd -t -f /etc/ssh/labex_sshd_config\nsudo /usr/sbin/sshd -f /etc/ssh/labex_sshd_config -E /var/log/labex/sshd.log\n"
    fixture['files'].append({'path':root+'/prepare-ssh.sh','owner':'labex:labex','mode':'0755','content':boot})
    fixture['docker']['startup']=[{'script':root+'/prepare-ssh.sh','user':'labex'}]
    if order==33:
        patches[33,1]=all_checks(state(exact(root+'/service.conf',service)+' && cmp -s '+root+'/service.conf /home/opsuser/incoming/service.conf && test "$(stat -c %U /home/opsuser/incoming/service.conf)" = opsuser && test -s '+root+'/id_ed25519 && sudo grep -Fq "Accepted publickey for opsuser" /var/log/labex/sshd.log'),commands(r'^\s*scp\s+.*opsuser@localhost:/home/opsuser/incoming/service\.conf\s*$'))
        overrides[1]=['cd '+root,{'command':'scp -i id_ed25519 service.conf opsuser@localhost:/home/opsuser/incoming/service.conf','input':[{'wait_for':'(yes/no/[fingerprint])?','text':'yes'}]}]
        return
    home='/home/remoteuser'
    patches[32,1]=all_checks(state(exact(root+'/ssh-target.txt','target=localhost\nport=22\nuser=remoteuser\n')),commands(r'^\s*ssh-keyscan\s+-t\s+ed25519\s+localhost\s+2>/dev/null\s*\|\s*ssh-keygen\s+-lf\s+-\s*$'))
    patches[32,2]=all_checks(state(exact(home+'/ssh-lab/connected.txt','connected as remoteuser\n')+' && test "$(stat -c %U '+home+'/ssh-lab/connected.txt)" = remoteuser && sudo grep -Fq "Accepted password for remoteuser" /var/log/labex/sshd.log'),commands(r'^\s*ssh\s+remoteuser@localhost\s*$'))
    patches[32,3]=state(exact(root+'/remote-context.txt','remote_user=remoteuser\nremote_home=/home/remoteuser\n')+' && sudo grep -Fq "Accepted password for remoteuser" /var/log/labex/sshd.log')
    patches[32,4]=all_checks(state(exact(root+'/app.conf',service)+' && cmp -s '+root+'/app.conf '+home+'/incoming/app.conf && cmp -s '+root+'/app.conf '+root+'/downloaded-app.conf && test "$(stat -c %U '+home+'/incoming/app.conf)" = remoteuser'),commands(r'^\s*scp\s+.*remoteuser@localhost:.*$'))
    patches[32,5]=all_checks(state(exact(home+'/incoming/site/index.html','<h1>SSH transfer practice</h1>\n')+' && '+exact(home+'/incoming/site/assets/style.css','body { color: navy; }\n')+' && diff -r '+root+'/site '+home+'/incoming/site >/dev/null'),commands(r'^\s*scp\s+-r\s+site\s+remoteuser@localhost:.*$'))
    patches[32,6]=state('test "$(stat -c %a /home/labex/.ssh)" = 700 && test "$(stat -c %a /home/labex/.ssh/labex_remote_ed25519)" = 600 && cmp -s <(ssh-keygen -y -f /home/labex/.ssh/labex_remote_ed25519 | cut -d\' \' -f1,2) <(cut -d\' \' -f1,2 /home/labex/.ssh/labex_remote_ed25519.pub)')
    patches[32,7]=state(exact(root+'/key-authenticated.txt','key authentication works\n')+' && '+exact(home+'/ssh-lab/key-authenticated.txt','key authentication works\n')+' && sudo grep -Fq "Accepted publickey for remoteuser" /var/log/labex/sshd.log')
    overrides[1]=['cd '+root,'ssh -V 2>&1','sudo ss -ltnp | grep :22','ssh-keyscan -t ed25519 localhost 2>/dev/null | ssh-keygen -lf -',"printf 'target=localhost\\nport=22\\nuser=remoteuser\\n' > ssh-target.txt"]
    overrides[2]=[{'command':'ssh remoteuser@localhost','input':[{'wait_for':'(yes/no/[fingerprint])?','text':'yes'},{'wait_for':"password:",'text':'RemoteLab123!'},{'wait_for':'remoteuser@labex:','text':"whoami\nhostname\npwd\nmkdir -p ~/ssh-lab\nprintf 'connected as %s\\n' \"$(whoami)\" > ~/ssh-lab/connected.txt\nexit"}]}]
    for n in (3,4,5,6,7):
        text=next(s['content'] for s in lab['sections'] if s.get('position')==n)
        seq=actions(text)
        for item in seq:
            command=item.get('command','') if isinstance(item,dict) else item
            if isinstance(item,dict) and (command.startswith('ssh remoteuser') or command.startswith('scp ') or command.startswith('ssh-copy-id ')) and n<6 or isinstance(item,dict) and command.startswith('ssh-copy-id '):
                item['input']=[{'wait_for':"password:",'text':'RemoteLab123!'}]
        overrides[n]=seq


if __name__=='__main__':main()
