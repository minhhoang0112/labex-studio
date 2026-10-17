"""Replace unverified Noobs grading with reviewed private-Docker task checks.

Only linux-for-noobs labs are written. Existing source text and section IDs are
preserved from current files; the first-run backup is archival only. Unreviewed practical work
is explicitly blocked, never accepted through an acknowledgement.
"""
import copy
import json
from pathlib import Path
import re
import shutil
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from noobs_core_plans import BASE, plans

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'server/data'
BACKUP = ROOT / '.artifacts/noobs-before-backend-audit'


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


def blocks(content):
    return [block.strip() for block in re.findall(r'```(?:bash|sh|shell)\s*\n(.*?)```',content,re.S)]


def actions(content):
    result = []
    for block in blocks(content):
        multiline_compound=any(re.match(r'^\s*(?:for|while|if)\b',line) and
                               not re.search(r';\s*(?:fi|done)\b',line)
                               for line in block.splitlines())
        if '<<' in block or multiline_compound:
            pieces=[block]
        else:
            pieces=[line for line in block.splitlines() if line.strip() and not line.lstrip().startswith('#')]
        for command in pieces:
            # These deliberate error demonstrations must complete, while final
            # state and separate successful work checks determine task success.
            item={'command':command,'allowed_status':[0,1,2,130]}
            if command=='top':item['input']=[{'wait_for':'PID','text':'q','raw':True}]
            if re.search(r'^sudo apt (update|install|remove)',command):item['timeout_ms']=180000
            result.append(item)
    return result


def pattern(command):
    # Exact full command, flexible whitespace. No arbitrary-command alternatives.
    escaped=re.escape(command).replace(r'\ ',r'\s+').replace('\\\n',r'\s*')
    return r'^\s*'+escaped+r'\s*$'


def trim_observations(commands, rule):
    """Keep mutations, failure demonstrations, and every required history item.

    Repeated plain cat/ls/stat output does not change a filesystem task or add
    independent grading evidence. Removing only these avoids WSL round trips.
    """
    patterns=[]
    def visit(check):
        if check.get('kind')=='commands':patterns.extend(p for g in check['groups'] for p in g)
        for child in check.get('checks',[]):visit(child)
    visit(rule)
    result=[]
    for item in commands:
        command=item['command'] if isinstance(item,dict) else item
        required=any(re.search(p,command) for p in patterns)
        plain_observation=bool(re.match(r'^(?:cat|ls|stat|head|tail|file|pwd|wc)\b',command))
        meaningful=any(token in command for token in ('>','tee',';','&&','||','missing','absent','\n','<<'))
        if required or not plain_observation or meaningful:result.append(item)
    return result


def complete_manifest_parents(setup):
    """Private learner directories must be writable before moving fixture files.

    apply_manifest creates implicit parents as root. Explicit parent entries keep
    reconstructed workspace trees owned by labex while preserving explicit modes.
    """
    setup=copy.deepcopy(setup)
    directories={item['path']:item for item in setup.get('directories',[])}
    for item in [*setup.get('directories',[]),*setup.get('files',[])]:
        parent=Path(item['path']).parent
        while parent.as_posix().startswith('/home/labex/project/'):
            directories.setdefault(parent.as_posix(),{'path':parent.as_posix(),'owner':'labex:labex'})
            parent=parent.parent
    setup['directories']=sorted(directories.values(),key=lambda item:(len(Path(item['path']).parts),item['path']))
    # Standard Ubuntu includes nobody/nogroup=65534. Do not derive fixture IDs
    # from max(system IDs), which would exceed the runtime's valid UID/GID range.
    groups=setup.setdefault('groups',[])
    used_gids={item['gid'] for item in groups if 'gid' in item}
    def free_gid():
        value=2000
        while value in used_gids:value+=1
        used_gids.add(value)
        return value
    for group in groups:
        if 'gid' not in group:group['gid']=free_gid()
    for index,account in enumerate(setup.setdefault('accounts',[])):
        account.setdefault('uid',2000+index)
        primary=account.get('group',account['name'])
        if primary==account['name'] and not any(group['name']==primary for group in groups):
            groups.append({'name':primary,'gid':free_gid()})
    return setup


def blocked_reason(order, number):
    if order in (28,29,31) or (order==30 and number in (1,6,7)):
        return 'Bài cần systemd PID 1, service unit và journal thật; Docker hiện dùng supervisor tối giản, chưa hỗ trợ đúng yêu cầu này.'
    if order in (32,33):
        return 'Bài cần sshd, tài khoản remote và xác thực/key transfer thật; chưa dựng và kiểm chứng các fixture SSH.'
    if order==14:
        return 'Chưa cấp thiết bị block/loop và mount filesystem riêng; không chạy fdisk hoặc mount trên thiết bị của máy chủ.'
    if order in (11,) or (order==10 and number==5):
        return 'Bài yêu cầu Zsh thật; image hiện chưa có Zsh, không chấm Bash thay cho phiên Zsh.'
    if order==1 and number==2:
        return 'Bài yêu cầu lệnh cal; image hiện chưa xác nhận ncal/cal. Không tự báo đạt chỉ từ lệnh date.'
    if order==24 and number==7:
        return 'Bài yêu cầu đọc kernel log dmesg; runtime chưa cấp CAP_SYSLOG.'
    if order==3 and number==7:
        return 'Chưa kiểm chứng được các tương tác Up/Tab/Ctrl+C/Ctrl+L theo yêu cầu; marker file đơn lẻ không chứng minh các thao tác này.'
    if order==6 and number==8:
        return 'Cần kiểm chứng newgrp mở subshell, group mới và thoát về shell ban đầu; chưa có bài kiểm tra tương tác phù hợp.'
    if order==6 and number==4:
        return 'Chưa dựng trạng thái mật khẩu ban đầu và kiểm chứng chuỗi khóa/mở/khóa tài khoản contractor.'
    return 'Bộ kiểm tra trước chỉ kiểm tra lệnh đầu hoặc xác nhận đã đọc. Chưa hoàn thành đối chiếu fixture và bài kiểm tra thực cho nhiệm vụ này.'


CHALLENGE_ACTIONS={
    2:['cd '+BASE+'terminal-greeting','figlet Welcome > welcome-banner.txt'],
    5:['cd '+BASE+'file-organization','mv incoming/draft-notes.txt archive/final-notes.txt'],
    7:['sudo useradd -m -U -s /bin/bash trainee','sudo usermod -aG developers trainee'],
    9:['cd '+BASE+'file-search',r"find . -type f -name app.conf -exec chmod 600 {} \;"],
    13:['cd '+BASE+'log-backup','tar -czf logs-backup.tar.gz -C source logs'],
    15:['cd '+BASE+'disk-audit','du -sh workspace/* | sort -h > reports/directory-usage.txt'],
    17:['cd '+BASE+'sensor-pipeline',"grep ',ALERT,' sensor-events.csv > alert-events.csv"],
    19:['cd '+BASE+'path-audit',"tr ':' '\n' < configured-path.txt | sort | uniq > path-directories.txt"],
    21:['cd '+BASE+'extraction-challenge',r"grep -Eo '[[:alnum:]._-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}' handover.txt | sort | uniq > emails.txt"],
    23:['cd '+BASE+'history-analysis','cut -d\'|\' -f2 command-history.txt > programs.txt'],
}


def main():
    BACKUP.mkdir(parents=True,exist_ok=True)
    sources=[]
    for path in (DATA/'labs').glob('*.json'):
        lab=json.loads(path.read_text(encoding='utf-8'))
        if lab.get('course_id')!='linux-for-noobs':continue
        saved=BACKUP/path.name
        if not saved.exists():shutil.copyfile(path,saved)
        # The backup records the original audit, not the current teaching text.
        # Preserve subsequent translations and reviewed content on regeneration.
        sources.append((path,lab))
    sources.sort(key=lambda item:item[1]['order'])
    assert len(sources)==37
    reviewed=plans()
    from noobs_operations_plans import plans as operations_plans
    reviewed.update(operations_plans())
    try:
        from noobs_automation_plans import plans as automation_plans
    except ModuleNotFoundError as error:
        if error.name != 'noobs_automation_plans':raise
    else:
        reviewed.update(automation_plans())
    scenario={'version':1,'course_id':'linux-for-noobs','provider':'docker','expected_tasks':134,
              'provenance':'Local audit of current Anti lesson bodies; source text preserved, fixture bytes reconstructed, private LabEx graders unknown.', 'lessons':[]}
    supported=blocked=old_ack=weak_cd=0
    audit=[]
    for path,lab in sources:
        order=lab['order'];plan=reviewed.get(order)
        old_ack+=sum(step.get('verification',{}).get('kind')=='acknowledgement' for step in lab['steps'])
        weak_cd+=sum(any('cd ' in str(group) for group in step.get('verification',{}).get('groups',[])) for step in lab['steps'])
        setup=plan['setup'] if plan else {'version':1,'directories':[],'files':[],'accounts':[],'groups':[],
                                         'provenance':{'fixture_fidelity':'unsupported-not-seeded'}}
        setup=complete_manifest_parents(setup)
        lesson={'lab_id':lab['id'],'source_lab_id':lab.get('source_lab_id'),
                'setup_manifest':'server/data/environment-setups/'+lab['id']+'.json','steps':[]}
        step_map={}
        for step in lab['steps']:
            old_id=step['id']
            number=step.get('position')
            if number is None: number=int(old_id.rsplit('-',1)[-1])
            reason=blocked_reason(order,number)
            namespace_rule=copy.deepcopy(step.get('verification_by_provider',{}).get('namespace'))
            namespace_caps=copy.deepcopy(step.get('required_capabilities_by_provider',{}).get('namespace',[]))
            step['id']=f"source-{lab['source_lab_id']}-section-{number}-v3"
            step.pop('verify_command',None)
            step.pop('verification_by_provider',None)
            step.pop('required_capabilities_by_provider',None)
            step['verification']={'kind':'unsupported','reason':reason}
            step['required_capabilities']=[]
            case={'id':step['id'],'commands':[],'unsupported':True,'reason':reason}
            if plan and number in plan['states']:
                state=plan['states'][number]
                commands=actions(step.get('content',''))
                if lab['type']=='challenge':commands=CHALLENGE_ACTIONS.get(order,[])
                commands=plan.get('actions',{}).get(number,commands)
                if state is None:
                    rule={'kind':'commands','user':'labex','allowed_status':[0],
                          'groups':[[pattern('ls /')],[pattern('ls -ld /etc /home /tmp /usr /var')]]}
                else:
                    rule={'kind':'state','command':state}
                # Grade resulting artifacts directly. Equivalent printf/echo,
                # quoting and redirection forms must not require the exact demo.
                # Explicit history remains for observations/operations that
                # cannot be established by final filesystem/account state.
                if number in plan.get('history',{}):
                    rule={'kind':'all','checks':[{'kind':'state','command':state},plan['history'][number]]}
                caps=plan['capabilities']
                if order in (1,2):caps=[*caps,'package_management']
                step['verification_by_provider']={'docker':rule}
                step['required_capabilities_by_provider']={'docker':caps}
                case={'id':step['id'],'commands':trim_observations(commands,rule)}
                if number in plan.get('wait_for_pass_ms',{}):case['wait_for_pass_ms']=plan['wait_for_pass_ms'][number]
                supported+=1
            else:blocked+=1
            if namespace_rule:
                step.setdefault('verification_by_provider',{})['namespace']=namespace_rule
                step.setdefault('required_capabilities_by_provider',{})['namespace']=namespace_caps
            for key in ('action','acknowledgement','allow_acknowledgement'):step.pop(key,None)
            step_map[old_id]=step
            lesson['steps'].append(case)
        for section in lab.get('sections',[]):
            if section['id'] in step_map:
                content=section.get('content')
                translated={key:value for key,value in section.items() if key.endswith('_vi')}
                old_section_id=section['id']
                for key in ('verify_command','verification','verification_by_provider',
                            'required_capabilities','required_capabilities_by_provider',
                            'action','acknowledgement','allow_acknowledgement'):
                    section.pop(key,None)
                section.update(copy.deepcopy(step_map[old_section_id]))
                if content is not None:section['content']=content
                section.update(translated)
                for key,value in translated.items(): step_map[old_section_id][key]=copy.deepcopy(value)
        lab['curriculum_version']=3
        lab['backend_audit']={'date':'2026-10-16','source':'existing-local-Anti-course-bodies',
                              'source_body_fidelity':'preserved-exactly-from-pre-audit-copy',
                              'original_private_checks':'not-observed','fixtures':'independently-reconstructed',
                              'integration_status':'candidate-checks-require-Docker-smoke-report'}
        lab['environment_setup']=lesson['setup_manifest']
        write(path,lab);write(DATA/'environment-setups'/path.name,setup)
        scenario['lessons'].append(lesson)
        audit.append(f"| {order} | {lab['title']} | {sum(not s.get('unsupported',False) for s in lesson['steps'])} | {sum(s.get('unsupported',False) for s in lesson['steps'])} |")
    write(ROOT/'tests/scenarios/linux-for-noobs-docker.json',scenario)
    documentation=f'''# Noobs backend audit

Audit date: 2026-10-16. Source: 37 existing local Anti lesson JSON files. No new full-text source scraping was performed. Their English/Vietnamese content and source IDs are preserved. This audit does **not** establish equality with current LabEx lesson bodies or recover the original private graders.

This regeneration found {old_ack} practical acknowledgement checks and {weak_cd} checks based on navigation. No practical task can pass through acknowledgement. Unreviewed work is explicitly unsupported. Previously reviewed namespace variants are preserved; read provider-specific readiness and integration evidence.

Task IDs now use `source-<source_lab_id>-section-<position>-v3` in tasks, task sections and test scenarios. Earlier unearned acknowledgement/navigation completion IDs therefore do not satisfy this audited curriculum. Intro/summary IDs, source positions and all teaching content remain unchanged. No learner files are reset or removed.

Docker candidate coverage: **{supported}/134 tasks**; **{blocked} explicitly unsupported**. Candidate means authored checks, not successful integration proof. Read the generated integration report before claiming these tasks work.

Fixtures are independently reconstructed from the local instructions. Unknown original bytes are never described as recovered. Docker systemd, SSH, Zsh, raw block/loop mounts and kernel-log exercises remain unsupported where their real dependencies are missing. A command like `cd` alone never establishes successful practical work.

Artifact checks accept equivalent commands and quote styles when the required bytes, ownership, modes and behavior are correct. No first-command or redirection-to-regex heuristic is used. Explicit operation-history checks remain only where final state cannot prove the required observation/process/package/interactive action; the original hidden LabEx grader's accepted alternatives are unknown.

| Order | Local lesson | Docker candidates | Blocked |
| --- | --- | ---: | ---: |
'''+ '\n'.join(audit)+'''

Regenerate with `python scripts/audit_noobs_labs.py`. First-run source copies remain in `.artifacts/noobs-before-backend-audit` for history. Reruns read current lesson files and preserve current English text, reviewed translations and namespace variants. `scripts/apply-reviewed-translations.py` reapplies separately stored translations after checking source hashes where supplied.

Integration command: `node tests/source-course.smoke.mjs tests/scenarios/linux-for-noobs-docker.json --provider=docker`. This runs separate test-only lab IDs, checks tasks fail before work, performs the documented work and checks resulting state. Some unsupported dependencies are deliberately blocked rather than simulated.

FE handoff: read the backend readiness counts/reasons and show partial lessons honestly. Keep reference text readable and permit navigation to later sections without awarding a passed task. Disable grading for unsupported practical tasks; do not turn them into a Continue/acknowledgement success. Intro/summary navigation is separate from practical completion. Ignore saved completion IDs from the old section-N curriculum.
'''
    (ROOT/'docs/NOOBS_BACKEND_AUDIT.md').write_text(documentation,encoding='utf-8')
    print(f'Noobs: 37 lessons, {supported} Docker candidates, {blocked} explicit blocked tasks; {old_ack} acknowledgements removed, {weak_cd} navigation-only checks removed.')


if __name__=='__main__':main()
