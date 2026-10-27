"""Publish substantive Windows practice; never starts or changes cloud VMs.

Re-runnable after the original curriculum generators. Existing task IDs and
learner progress are preserved. Runtime acceptance is deliberately separate.
"""
import copy
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'server/data'
LABS = DATA / 'labs'
MS = 'https://learn.microsoft.com/en-us/'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


# Topic-specific decision exercises, not a generic "run the collector" preface.
# GUI, short diagnostic command, interpretation, independent work, escalation.
RUNBOOKS = {
 'backup': ('Explorer: so sánh cây Source, Backup, Restore; bật File name extensions và xem Modified/Size.',
  'Get-FileHash -LiteralPath <duong-dan-tep> -Algorithm SHA256',
  'Hash kiểm nội dung, không chứng minh ACL, nguồn tin cậy hay khôi phục được cả máy. Bản sao trên cùng đĩa mất theo đĩa; đồng bộ xóa không phải retention.',
  'Chọn một tệp lồng trong thư mục con, dự đoán nó có trong backup không. Khôi phục vào thư mục mới và mở nội dung, đối chiếu hash trước khi đụng dữ liệu đang dùng.',
  'Chuyển nhóm backup khi thiếu recovery point hoặc cần system-state/AD restore. Không restore snapshot DC đang chạy để thử.'),
 'network': ('Win+R → ncpa.cpl: xác định NIC đang dùng, xem Status/Details; giữ nguyên cấu hình NIC quản trị.',
  'Get-NetIPConfiguration\nGet-NetRoute -AddressFamily IPv4 | Sort-Object RouteMetric',
  'Tách NIC/IP → route → DNS → TCP → HTTP/SMB. Ping thành công không chứng minh ứng dụng tốt; loopback không chứng minh đường CLIENT01–Server.',
  'Viết bảng: kiểm tra nào loại trừ nguyên nhân nào? So kết quả query DNS chỉ định với resolver mặc định, sau đó kiểm đúng cổng dịch vụ.',
  'Không release IP, đổi DNS/VNet hay tắt firewall toàn máy từ phiên RDP. Thiếu private path phải xử lý hạ tầng trước.'),
 'permission': ('Explorer → Properties → Security → Advanced → Effective Access; đối chiếu account thực hiện thao tác.',
  'whoami /user\nwhoami /groups\nGet-Acl -LiteralPath <thu-muc-cua-bai> | Format-List Owner,AccessToString',
  'Token của người dùng/service quyết định quyền; administrator đọc được không chứng minh nhân viên đọc được. Qua SMB cần cả share và NTFS. Đổi tên user không đổi SID.',
  'Dự đoán Read so với Modify cho phép thao tác nào. Thử đọc/tạo/sửa/xóa dưới identity cần phục vụ nếu bài cung cấp identity thử; không dùng SYSTEM làm bằng chứng thay người dùng.',
  'Không cấp Everyone Full control, không thêm user vào Administrators để chữa Access denied. User local có trên client, còn AD là quản trị domain trên Server.'),
 'service': ('Win+R → services.msc → đúng service → Log On, Dependencies và Recovery; Task Scheduler có identity/action riêng.',
  'Get-Service Spooler | Select-Object Name,Status,StartType,RequiredServices',
  'Running chỉ là trạng thái SCM; còn phải thử công việc dịch vụ. Restart có thể xóa triệu chứng nhưng không sửa nguyên nhân và có thể làm mất dữ liệu chờ.',
  'Ghi thời điểm lỗi, identity, đường dẫn, mã lỗi và thay đổi gần nhất. Chỉ thử restart hoặc sửa startup khi có bằng chứng và nêu tác động.',
  'Không dừng Azure Agent, RDP, DNS/DC hoặc xóa hàng đợi dùng chung. Lab printer mẫu chưa chứng minh đã in thành công trên máy in vật lý.'),
 'performance': ('Task Manager → Processes/Details; Resource Monitor → CPU, Memory, Disk. Lấy ít nhất hai mẫu lúc tái hiện chậm.',
  'Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 5 Id,ProcessName,CPU,WorkingSet64',
  'CPU của Get-Process là giây tích lũy, không phải phần trăm tức thời. RAM cao có thể do cache; thiếu dung lượng đĩa khác I/O latency cao.',
  'Ghi tác vụ người dùng, thời điểm bắt đầu/kết thúc và ảnh hưởng. So mẫu trước/trong/sau; chưa đo thì không kết luận cần tăng RAM hay kill process.',
  'B2s có tài nguyên/CPU credit hạn chế; kết quả VM không đại diện mọi máy văn phòng. Không tạo tải vô hạn hoặc làm đầy ổ hệ thống.'),
 'event': ('Event Viewer → Windows Logs → System/Application → Filter Current Log theo khoảng giờ và provider.',
  "Get-WinEvent -FilterHashtable @{LogName='System';StartTime=(Get-Date).AddHours(-2)} -MaxEvents 20 | Select-Object TimeCreated,ProviderName,Id,LevelDisplayName,Message",
  'Event ID chỉ có nghĩa cùng provider và ngữ cảnh. Không có event phù hợp không đồng nghĩa máy khỏe; sai khoảng giờ/retention/audit cũng làm thiếu evidence.',
  'Dựng timeline trước lỗi → triệu chứng → can thiệp → thử lại. Chọn một event và viết rõ nó chứng minh gì, chưa chứng minh gì; giữ log gốc.',
  'Không xóa log hay tạo event giả để đủ bài. Khi chuyển nhóm gửi timestamp, provider, ID, thông báo và ảnh hưởng, không chỉ chụp một dấu đỏ.'),
 'software': ('Settings → Apps → Installed apps; Properties của gói cài → Digital Signatures; xem log cài đặt nếu có.',
  'Get-AuthenticodeSignature -LiteralPath <goi-cai-da-xac-minh>\nGet-FileHash -LiteralPath <goi-cai-da-xac-minh>',
  'Portable, MSI/MSIX và per-user/per-machine có cách triển khai/gỡ khác nhau. Hash tự tính không xác minh publisher. Ứng dụng 32-bit không tự là lỗi trên Windows 64-bit.',
  'Lập bảng phiên bản trước/sau, nguồn tải, phạm vi cài, yêu cầu reboot và rollback. Chạy lại chức năng người dùng cần, không chỉ xem mục Installed apps.',
  'Bài script portable chỉ dạy quản lý file/phiên bản; chưa phải diễn tập MSI/Office. Không chạy Win32_Product để kiểm kê và không tải installer không rõ nguồn.'),
 'configuration': ('Explorer/Notepad: mở cấu hình đúng ứng dụng, đọc thông báo và đường dẫn thực trước khi sửa.',
  'Test-Path -LiteralPath <duong-dan-trong-thong-bao>\nGet-Content -LiteralPath <tep-cau-hinh-cua-bai>',
  'Cú pháp hợp lệ vẫn có thể sai giá trị. PATH Process/User/Machine khác nhau. Một process mới chưa chắc nhận thay đổi của process cũ.',
  'Lưu bản trước khi sửa; thay đúng một giá trị, chạy lại nghiệp vụ, so diff và thực hành rollback. Không dùng cài lại Windows thay cho việc khoanh vùng.',
  'Chỉ sửa namespace bài; không ghi đè PATH máy, tắt UAC hoặc sửa registry hệ thống theo phỏng đoán.'),
 'ad': ('ADUC: bật Advanced Features, đối chiếu OU, Object GUID, Member Of và phạm vi nhóm; GPMC: Scope/Delegation/Results.',
  'Get-ADDomain | Select-Object DNSRoot,DistinguishedName,DomainSID\nGet-ADOrganizationalUnit -Filter * | Select-Object Name,DistinguishedName',
  'OU tổ chức/delegation/GPO; security group cấp quyền. AGDLP là Accounts → Global → DomainLocal → Permissions. Tên giống không thay SID/GUID. GPO link không chứng minh đã áp trên client.',
  'Vẽ user → nhóm vai trò → nhóm tài nguyên → quyền. Với GPO/domain join: ghi server-side và client-side riêng; thử dưới user mục tiêu, đối chiếu gpresult và secure channel.',
  'Không dùng Domain Admin như cách chữa lỗi thường lệ. Chưa có domain/private path đã kiểm chứng thì dừng bước client; không dùng kết quả Server thay CLIENT01.'),
 'dns': ('DNS Manager: xem zone/record/TTL; DHCP console: chỉ scope thuộc bài, luôn phân biệt scope option và server option.',
  'Get-DnsServerZone | Select-Object ZoneName,ZoneType,IsDsIntegrated\nGet-DnsClientServerAddress -AddressFamily IPv4',
  'DNS authoritative, resolver cache và hosts là ba đường khác nhau. DHCP reservation không phải lease; thêm lease bằng cmdlet không chứng minh client nhận cấu hình qua DORA.',
  'Vẽ client → resolver → authoritative; ghi tên/IP/TTL trước và sau. Record đúng nhưng client giữ cache cũ khác lỗi server; kiểm thực từ CLIENT01 khi bài yêu cầu.',
  'Không bật DHCP phục vụ NIC Azure. DHCP cấp lease thật cần mạng cô lập/relay được kiểm chứng; các bước đó vẫn khóa chấm cho đến khi có provider.'),
 'iis': ('IIS Manager: Sites → đúng site → Bindings/Basic Settings; Application Pools → identity/state; xem IIS log đúng site ID.',
  'Get-Website | Select-Object Name,State,PhysicalPath,ApplicationPool\nGet-WebAppPoolState -Name <pool-cua-bai>',
  'Website, binding và app pool khác nhau. TCP mở không chứng minh HTTP đúng; HTTP 404 khác 503. Phải đọc status/substatus và kiểm đường dẫn/identity.',
  'Ghi URL gồm host/port/path, HTTP status và thời điểm. Thử localhost trước rồi mới từ client; chỉ kết luận cho đường đã thử.',
  'Không chạy app pool bằng LocalSystem để né quyền. Không mở Internet hoặc sửa site mặc định để ép bài qua.'),
}


def topic(lab):
    lid = lab['id']
    if lid.startswith('win-adg-') or any(x in lid for x in ['server-ad-', 'group-policy']): return 'ad'
    if lid.startswith('win-dnsdhcp-'): return 'dns'
    if 'iis' in lid: return 'iis'
    if any(x in lid for x in ['backup', 'restore', 'capstone']): return 'backup'
    if any(x in lid for x in ['account', 'permission', 'ntfs', 'file-storage']): return 'permission'
    if any(x in lid for x in ['network', 'route', 'dns', 'tcp', 'firewall']): return 'network'
    if any(x in lid for x in ['printer', 'service', 'startup']): return 'service'
    if any(x in lid for x in ['performance', 'disk', 'inventory']): return 'performance'
    if any(x in lid for x in ['event', 'log']): return 'event'
    if any(x in lid for x in ['software', 'driver', 'update']): return 'software'
    return 'configuration'


def improve_existing():
    changed = []
    for path in sorted(LABS.glob('win-*.json')):
        lab = read(path)
        if lab['id'].startswith(('win-fnd-', 'win-nwf-', 'win-bkr-', 'win-web-')): continue
        if lab['id'] in ('win-it-scheduled-backup-permissions', 'win-it-file-in-use'): continue
        key = topic(lab)
        gui, command, interpretation, exercise, escalation = RUNBOOKS[key]
        # <...> placeholders are intentional, documented, and never auto-executed.
        runbook = f'''<!-- professional-runbook-v1 -->
## Quy trình thực hành và ra quyết định
### Tình huống cần giải quyết
{lab.get('overview', lab.get('title_vi', lab['title']))}

### Tự làm trước khi xem khối lệnh tham khảo
{gui}

Lệnh dưới đây để đọc dữ kiện, không tự sửa máy. Chỗ `<...>` là tham số bạn phải thay bằng tài nguyên thuộc bài; không dán nguyên dấu ngoặc. Nếu module chưa có, kiểm đúng máy/role thay vì tải ngẫu nhiên.
```powershell
{command}
```

### Bản chất cần hiểu
{interpretation}

### Bài tập độc lập
{exercise}

### Điều kiện dừng hoặc chuyển nhóm
{escalation}

### Cách đánh giá
Nút chấm xác nhận đúng các tiêu chí ghi ở nhiệm vụ, không tự chứng nhận phần giải thích miệng hoặc việc bạn đã tự làm. Task kiểm kê/báo cáo là bài chẩn đoán; có báo cáo đúng chưa chứng minh đã sửa một sự cố. Chỉ bài có tái hiện lỗi và phép thử chức năng sau sửa mới được xem là diễn tập xử lý lỗi.
'''
        for step in lab['steps']:
            old = step.get('content_vi', step.get('content', ''))
            if '<!-- professional-runbook-v1 -->' in old:
                old = old.split('\n\n---\n\n', 1)[1]
            # Preserve runnable reference in hint, but don't overwhelm the lesson
            # with expanded ownership helpers/JSON collectors before concepts.
            reference = step.get('hint_vi', step.get('hint', ''))
            if len(reference) > 450:
                old = re.sub(r'```(?:powershell|ps1)?\s*\n[\s\S]*?```',
                    lambda m: 'Khối lệnh đầy đủ nằm trong **Gợi ý → Xem khối lệnh PowerShell đầy đủ** bên dưới. Đọc mục tiêu, tự thao tác và dự đoán kết quả trước khi mở.' if len(m.group(0)) > 1200 else m.group(0), old)
            # Keep the full runbook once in the introduction, not once per task.
            preface = f'''<!-- professional-runbook-v1 -->
### Tự thực hành trước khi mở lời giải
{gui}

### Bài tập độc lập
{exercise}

### Điều kiện dừng
{escalation}

### Phạm vi điểm số
Task kiểm kê/báo cáo chỉ chứng minh đúng tiêu chí đó; có báo cáo đúng chưa chứng minh đã sửa sự cố. Xem bản chất và quy trình ở phần Giới thiệu; giải thích và xác nhận của người dùng không được tự chấm thay bằng file.
'''
            step['content'] = step['content_vi'] = preface + '\n\n---\n\n' + old
            step['learning_flow'] = 'practice-before-reference'
            step['assessment_scope'] = 'criteria-only-not-understanding'
        by_id = {s['id']: s for s in lab['steps']}
        for section in lab.get('sections', []):
            if section['id'] in by_id: section.update(copy.deepcopy(by_id[section['id']]))
            elif section.get('kind') == 'introduction':
                old = section.get('content_vi', section.get('content', '')).split('\n\n<!-- professional-runbook-v1 -->',1)[0]
                section['content'] = section['content_vi'] = old + '\n\n' + runbook
        lab['teaching_review'] = {'version': 1, 'date': '2026-10-26', 'topic': key,
                                  'runtime_revalidated': False}
        write(path, lab)
        changed.append(lab['id'])
    return changed


RULES = {}
NEW = []
BACKUP = 'windows-backup-disaster-recovery'
WEB = 'windows-iis-web-services'


def task(title, theory, code, expected, probe, question):
    return dict(title=title, theory=theory, code=code.strip(), expected=expected,
                probe=probe, question=question)


def publish(lid, course, order, title, ticket, tasks, references, module=2, target='client'):
    root = 'C:' + chr(92) + 'LabEx' + chr(92) + 'Labs' + chr(92) + lid
    intro = f'''## Ticket và mục tiêu
{ticket}

### Môi trường và giới hạn
Máy **{'CLIENT01 Windows 11' if target == 'client' else 'Windows Server'}**, thư mục riêng `{root}`. Không tạo hoặc resize VM. PowerShell Desktop giữ biến trong cửa sổ; PowerShell web chạy SYSTEM, mỗi lần gửi là process mới. Mỗi khối bên dưới khai báo lại `$p` để chạy độc lập. Không có script thu JSON bắt buộc.

{'Đây là diễn tập file trên cùng VM: không thay backup offsite, VSS, system-state hoặc AD disaster recovery. RPO là mức mất dữ liệu chấp nhận theo thời gian; RTO là thời gian phục hồi mục tiêu. Tự đo thời gian restore và thời điểm phiên bản, không suy RPO/RTO từ exit code.' if course == BACKUP else 'Cần IIS với Static Content và module WebAdministration đã cài bởi quản trị. Không tự cài role hoặc đổi firewall bằng nút chấm. Chỉ bind loopback; bài chưa kiểm DNS, HTTPS hoặc truy cập từ CLIENT01. Không sửa Default Web Site hay website của bài khác.'}

### Cách học
Đọc yêu cầu, dự đoán kết quả; thao tác GUI/lệnh cốt lõi, tự kiểm, sau cùng mới bấm chấm. Bài yêu cầu tên/đường dẫn cố định để xác định đúng tài nguyên; được đổi tên trong phần tự luyện, không đổi tài nguyên chấm mà chưa đổi hợp đồng bài.

### An toàn khi làm lại
Lần đầu tạo thư mục bằng `New-Item` không `-Force` để không ghi đè dữ liệu cũ. Nếu đã tồn tại, đọc nội dung trước, không chạy lại phần tạo dữ liệu. Không dùng đường dẫn liên kết/junction. Chỉ dọn dữ liệu tự tạo sau khi kiểm đúng đường dẫn; không có thao tác xóa cả VM hoặc thư mục cha.

### Trạng thái kiểm thử
Đã có hướng dẫn và bộ chấm trạng thái; chưa xác nhận chạy đầu-cuối trên VM Azure. Thiếu role/quyền/môi trường phải báo thiếu, không coi là đã hoàn thành.
'''
    sections = [dict(id=lid+'-intro', title='Ticket, môi trường và tiêu chuẩn bàn giao', title_vi='Ticket, môi trường và tiêu chuẩn bàn giao', kind='introduction', position=0, need_verify=False, content=intro, content_vi=intro)]
    steps = []
    for n, t in enumerate(tasks, 1):
        sid = f'{lid}-task-{n}-v1'
        body = f"## {t['title']}\n\n### Bản chất và cách làm\n{t['theory']}\n\n### Thực hành từng khối\n```powershell\n{t['code']}\n```\n\n### Kết quả và cách tự kiểm tra\n{t['expected']}\n\n### Câu hỏi tự giải thích\n{t['question']}\n\n### Khi chưa đạt\nXác nhận đúng VM, đúng thư mục, dữ liệu và bước trước; đọc lỗi thực. Không thay dữ liệu trong report để qua bài. Bộ chấm đọc file/cấu hình và thử chức năng, không chạy script do người học cung cấp.\n"
        step = dict(id=sid, title=t['title'], title_vi=t['title'], kind='task', position=n, need_verify=True, content=body, content_vi=body,
                    task=t['expected'], task_vi=t['expected'], hint='Tự đối chiếu kết quả theo từng tiêu chí ở phần hướng dẫn.', hint_vi='Tự đối chiếu kết quả theo từng tiêu chí ở phần hướng dẫn.', verification={'kind':'windows-remote'})
        sections.append(copy.deepcopy(step)); steps.append(step)
        RULES[sid] = dict(lab_id=lid, target_vm=target, modules=['WebAdministration'] if course == WEB else [], probe=t['probe'], root=root)
    summary = f'''## Bàn giao
Viết bằng lời của bạn: yêu cầu → bằng chứng trước sửa → thay đổi nhỏ nhất → kết quả sau sửa → phần chưa thử → cách quay lui. Phần giải thích này không được tự chấm thay bằng một chuỗi “done”.

Giữ tài nguyên riêng để ôn lại; không tự dọn khi bài khác đang sử dụng. {'IIS Manager: chỉ xóa site/pool có đúng tên và physical path của bài sau khi kiểm chúng không được site khác dùng; dừng khi phát hiện khác biệt. Không xóa binding/site mặc định.' if course == WEB else 'Chỉ xóa đúng thư mục bài sau khi đã lưu tài liệu cần giữ; không xóa C:\\LabEx\\Labs hoặc dữ liệu bài khác. File backup, snapshot và backup ngoài máy có failure domain khác nhau.'}

Tự luyện: làm lại với dữ liệu do bạn tạo trong thư mục khác, giải thích từng tham số mà không xem khối mẫu. Chưa có lab VM live không được tự nhận đã diễn tập phục hồi production.
'''
    sections.append(dict(id=lid+'-summary', title='Bàn giao, giới hạn và làm lại', title_vi='Bàn giao, giới hạn và làm lại', kind='summary', position=len(tasks)+1, need_verify=False, content=summary, content_vi=summary))
    lab = dict(id=lid, course_id=course, order=order, title=title, title_vi=title, type='lab', difficulty='Intermediate', estimated_time='45–60 mins', target_vm=target,
               curriculum_version=1, curriculum_origin='locally-authored-microsoft-references', curriculum_module=f'{course}-module-{module}', overview=ticket,
               practice_mode='functional-state', validation_status='awaiting-live-vm', references=[dict(title='Microsoft Learn',url=u) for u in references], sections=sections, steps=steps)
    write(LABS / (lid+'.json'), lab); NEW.append(lab)


def build_new():
    publish('win-bkr-complete-restore', BACKUP, 1, 'Backup thiếu thư mục con: khôi phục tài liệu và kiểm toàn vẹn',
      'Phòng kế toán có hóa đơn và hợp đồng trong thư mục con. Một bản sao chỉ lấy *.txt ở thư mục gốc bỏ sót hợp đồng. Bạn phải sao lưu đủ dữ liệu nghiệp vụ, bỏ cache rồi khôi phục hóa đơn bị xóa vào nơi kiểm chứng riêng.', [
      task('Chọn dữ liệu, sao lưu cả thư mục con',
       'Explorer: tạo Source/Contracts và Source/Cache trong thư mục bài. Hợp đồng là dữ liệu nghiệp vụ; cache có thể tái tạo. /E lấy thư mục con kể cả rỗng; /XD loại thư mục; /R:1 /W:1 giới hạn retry. /MIR có thể xóa ở đích nên không dùng ở đây. Robocopy có exit code khác 0 khi vẫn sao chép thành công; từ 8 trở lên là có lỗi. Đọc log và đối chiếu tệp, không chỉ nhìn mã.',
       r'''$p='C:\LabEx\Labs\win-bkr-complete-restore'
New-Item -ItemType Directory -Path "$p\Source\Contracts","$p\Source\Cache" -ErrorAction Stop
Set-Content "$p\Source\invoice.txt" 'Invoice 1042: total 2500000 VND' -Encoding UTF8
Set-Content "$p\Source\Contracts\contract.txt" 'Contract ACME: retain until 2030' -Encoding UTF8
Set-Content "$p\Source\Cache\preview.tmp" 'Rebuildable cache' -Encoding UTF8
robocopy "$p\Source" "$p\Backup" /E /XD "$p\Source\Cache" /R:1 /W:1 /LOG:"$p\backup.log"
if($LASTEXITCODE -ge 8){throw 'Backup co loi: doc backup.log'}
Get-ChildItem "$p\Backup" -Recurse -File''',
       r'Backup có invoice.txt và Contracts\contract.txt đúng nội dung; không có Cache\preview.tmp; dữ liệu nguồn còn nguyên.',
       "(Test-ProText 'Source\\invoice.txt' 'Invoice 1042: total 2500000 VND') -and (Test-ProText 'Source\\Contracts\\contract.txt' 'Contract ACME: retain until 2030') -and (Test-ProText 'Source\\Cache\\preview.tmp' 'Rebuildable cache') -and (Test-ProText 'Backup\\invoice.txt' 'Invoice 1042: total 2500000 VND') -and (Test-ProText 'Backup\\Contracts\\contract.txt' 'Contract ACME: retain until 2030') -and -not(Test-Path -LiteralPath (Join-Path $labRoot 'Backup\\Cache\\preview.tmp'))",
       r'Tại sao copy Source\*.txt bỏ sót hợp đồng? Vì sao /MIR không phải cơ chế giữ lịch sử phiên bản?'),
      task('Diễn tập mất tệp và restore ra vị trí riêng',
       'Chỉ sau khi task trước đạt, xóa đúng hóa đơn mẫu. Explorer: mở Backup và khôi phục vào Restore, không ghi đè thư mục đang làm việc. Get-FileHash kiểm byte; mở file để kiểm nội dung nghiệp vụ. Không xóa contract hoặc bản backup.',
       r'''$p='C:\LabEx\Labs\win-bkr-complete-restore'
Remove-Item -LiteralPath "$p\Source\invoice.txt" -ErrorAction Stop
New-Item -ItemType Directory -Path "$p\Restore" -ErrorAction Stop
Copy-Item -LiteralPath "$p\Backup\invoice.txt" -Destination "$p\Restore\invoice.txt"
Get-FileHash "$p\Backup\invoice.txt","$p\Restore\invoice.txt"
Get-Content "$p\Restore\invoice.txt"''',
       'Hóa đơn nguồn đã bị xóa; bản restore đúng hash bản backup và đúng nội dung; hợp đồng nguồn/backup vẫn giữ. Đây là restore file mẫu, chưa phải cứu đĩa hỏng.',
       "-not(Test-Path -LiteralPath (Join-Path $labRoot 'Source\\invoice.txt')) -and (Test-ProText 'Backup\\invoice.txt' 'Invoice 1042: total 2500000 VND') -and (Test-ProSame 'Backup\\invoice.txt' 'Restore\\invoice.txt') -and (Test-ProText 'Source\\Contracts\\contract.txt' 'Contract ACME: retain until 2030') -and (Test-ProText 'Backup\\Contracts\\contract.txt' 'Contract ACME: retain until 2030')",
       'Nếu ổ C: mất cả Source và Backup thì bước này còn khôi phục được không? Retention và offsite cần bổ sung gì?')], [MS+'windows-server/administration/windows-commands/robocopy',MS+'powershell/module/microsoft.powershell.utility/get-filehash'])

    publish('win-bkr-version-rollback', BACKUP, 2, 'Khôi phục nhầm phiên bản: rollback cấu hình mà không mất dữ liệu mới',
      'Sau thay đổi cấu hình, công cụ dùng sai cổng. Thư mục nghiệp vụ đã có ghi chú mới nên không được trả toàn bộ thư mục về bản cũ. Cần chọn đúng phiên bản cấu hình và giữ phần dữ liệu phát sinh.', [
      task('Giữ hai phiên bản và xác định recovery point',
       'Thực hành bằng file JSON mẫu, không sửa ứng dụng production. V1 là điểm tốt đã biết; V2 thay cổng. Hai tên phiên bản phải tồn tại độc lập. Thư mục Backup không phải retention nếu bạn liên tục ghi đè cùng một tên.',
       r'''$p='C:\LabEx\Labs\win-bkr-version-rollback'
New-Item -ItemType Directory -Path "$p\Working","$p\Versions" -ErrorAction Stop
'{"Port":8080,"Department":"Finance"}' | Set-Content "$p\Versions\config-v1.json" -Encoding UTF8
'{"Port":9999,"Department":"Finance"}' | Set-Content "$p\Versions\config-v2.json" -Encoding UTF8
Copy-Item "$p\Versions\config-v2.json" "$p\Working\config.json"
'New order 1043 must survive rollback' | Set-Content "$p\Working\orders.txt" -Encoding UTF8
Get-Content "$p\Versions\config-v1.json","$p\Working\config.json"''',
       'Hai recovery point có Port 8080/9999; cấu hình Working dùng 9999 và orders.txt còn dữ liệu mới.',
       "(Test-ProJsonPort 'Versions\\config-v1.json' 8080) -and (Test-ProJsonPort 'Versions\\config-v2.json' 9999) -and (Test-ProJsonPort 'Working\\config.json' 9999) -and (Test-ProText 'Working\\orders.txt' 'New order 1043 must survive rollback')",
       'Chọn backup theo tên mới nhất có chắc đáp ứng yêu cầu phục hồi không? Cần timestamp và kiểm tốt từ trước như thế nào?'),
      task('Rollback chọn lọc và kiểm dữ liệu ngoài phạm vi',
       r'Explorer: chỉ chép config-v1.json thành Working\config.json, giữ orders.txt. Đây là sửa cấu hình mẫu, không giả có HTTP service đã hồi phục; muốn đóng ticket ứng dụng phải kiểm chức năng ứng dụng thật ở bài khác.',
       r'''$p='C:\LabEx\Labs\win-bkr-version-rollback'
Copy-Item -LiteralPath "$p\Versions\config-v1.json" -Destination "$p\Working\config.json"
Get-Content "$p\Working\config.json" -Raw | ConvertFrom-Json
Get-Content "$p\Working\orders.txt"
Get-FileHash "$p\Versions\config-v1.json","$p\Working\config.json"''',
       'Working khớp byte V1, Port 8080; V2 vẫn có để điều tra; orders.txt còn nguyên. Không chấp nhận sửa một dòng “rollback OK” thay dữ liệu.',
       "(Test-ProJsonPort 'Versions\\config-v1.json' 8080) -and (Test-ProJsonPort 'Versions\\config-v2.json' 9999) -and (Test-ProSame 'Versions\\config-v1.json' 'Working\\config.json') -and (Test-ProText 'Working\\orders.txt' 'New order 1043 must survive rollback')",
       'Vì sao restore cả Working từ bản cũ có thể làm mất đơn hàng mới? File JSON hợp lệ đã chứng minh dịch vụ chạy tốt chưa?')], [MS+'powershell/module/microsoft.powershell.management/copy-item',MS+'powershell/module/microsoft.powershell.utility/convertfrom-json'])

    publish('win-bkr-archive-validation', BACKUP, 3, 'Archive tồn tại nhưng hỏng: xác thực và diễn tập restore',
      'Có hai file mang đuôi ZIP, một bản bị cắt cụt. Bạn phải chọn bản mở đọc được và đủ nội dung, restore ra thư mục mới, giữ nguyên cả bản hỏng để điều tra.', [
      task('Tạo archive và phát hiện bản hỏng',
       'Đuôi .zip, dung lượng khác 0 và hash riêng lẻ chưa chứng minh archive đọc được. Compress-Archive tạo ZIP; Expand-Archive thử đọc thật. Trong bài không có tài liệu ẩn; với production phải kiểm giới hạn công cụ, ACL và file đang mở.',
       r'''$p='C:\LabEx\Labs\win-bkr-archive-validation'
New-Item -ItemType Directory -Path "$p\Source" -ErrorAction Stop
'Recovery document: revision 7' | Set-Content "$p\Source\handover.txt" -Encoding UTF8
Compress-Archive -LiteralPath "$p\Source\handover.txt" -DestinationPath "$p\good.zip"
[IO.File]::WriteAllBytes("$p\damaged.zip",[byte[]](80,75,3,4))
try { Expand-Archive "$p\damaged.zip" "$p\Rejected" -ErrorAction Stop } catch { $_.Exception.Message }
Get-FileHash "$p\good.zip","$p\damaged.zip"''',
       'good.zip chứa đúng handover.txt đọc được; damaged.zip là mẫu cắt cụt 4 byte, không phải bản dùng restore. Không đánh đồng đây với chẩn đoán mọi loại ZIP hỏng.',
       "(Test-ProText 'Source\\handover.txt' 'Recovery document: revision 7') -and (Test-ProArchive) -and (Test-ProDamagedArchive)",
       'Hash của ZIP hỏng vẫn tính được; tại sao điều đó không đủ chứng minh backup tốt?'),
      task('Restore bản đã xác thực và mở nội dung',
       'Explorer → Extract All hoặc Expand-Archive vào Restore trống. Không dùng -Force lên dữ liệu đang làm việc. Đối chiếu hash file bên trong, không so hash ZIP với file đã giải nén.',
       r'''$p='C:\LabEx\Labs\win-bkr-archive-validation'
Expand-Archive -LiteralPath "$p\good.zip" -DestinationPath "$p\Restore" -ErrorAction Stop
Get-FileHash "$p\Source\handover.txt","$p\Restore\handover.txt"
Get-Content "$p\Restore\handover.txt"''',
       r'Restore\handover.txt đúng byte với nguồn và nội dung revision 7; good.zip còn đọc được; damaged.zip vẫn giữ nguyên.',
       "(Test-ProText 'Source\\handover.txt' 'Recovery document: revision 7') -and (Test-ProSame 'Source\\handover.txt' 'Restore\\handover.txt') -and (Test-ProArchive) -and (Test-ProDamagedArchive)",
       'Đã restore file text thì có thể kết luận database hoặc system state cũng phục hồi được không?')], [MS+'powershell/module/microsoft.powershell.archive/compress-archive',MS+'powershell/module/microsoft.powershell.archive/expand-archive'])

    publish('win-web-isolated-site', WEB, 1, 'Triển khai IIS: binding, application pool và quyền đọc tối thiểu',
      'Triển khai portal tĩnh trên Server bằng site/pool riêng. Dịch vụ phải trả đúng nội dung qua HTTP thật; không dùng Default Web Site, không mở cổng public.', [
      task('Xuất bản site tĩnh trong namespace riêng',
       r'IIS Manager → Application Pools → Add LabExCoursePortal; identity ApplicationPoolIdentity. Tạo site LabExCoursePortal, đường site trong bài, binding 127.0.0.1:18081. Anonymous Authentication → Edit → Application pool identity. Explorer Security cấp Read & execute cho IIS AppPool\LabExCoursePortal. Không dùng LocalSystem hoặc Everyone Full control. Lệnh mẫu tương đương, phải kiểm chưa có site/pool cùng tên trước khi tạo.',
       r'''Import-Module WebAdministration
$p='C:\LabEx\Labs\win-web-isolated-site'
if((Test-Path 'IIS:\Sites\LabExCoursePortal') -or (Test-Path 'IIS:\AppPools\LabExCoursePortal')){throw 'Ten da ton tai: kiem ownership truoc'}
New-Item -ItemType Directory -Path "$p\site" -ErrorAction Stop
'<h1>Finance portal revision 1</h1>' | Set-Content "$p\site\index.html" -Encoding UTF8
New-WebAppPool -Name LabExCoursePortal
Set-ItemProperty 'IIS:\AppPools\LabExCoursePortal' -Name processModel.identityType -Value 4
New-Website -Name LabExCoursePortal -Port 18081 -IPAddress 127.0.0.1 -PhysicalPath "$p\site" -ApplicationPool LabExCoursePortal
Set-WebConfigurationProperty -PSPath 'IIS:\' -Location LabExCoursePortal -Filter 'system.webServer/security/authentication/anonymousAuthentication' -Name userName -Value ''
icacls "$p\site" /grant 'IIS AppPool\LabExCoursePortal:(OI)(CI)RX'
if($LASTEXITCODE -ne 0){throw 'Cap quyen khong thanh cong'}
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:18081/index.html''',
       'Site/pool riêng, đúng physical path và binding loopback duy nhất; identity ít quyền; HTTP /index.html trả 200 và đúng Finance portal revision 1.',
       "Test-ProWebsite",
       'Tại sao site Started vẫn có thể trả lỗi? Anonymous identity khác account bạn dùng IIS Manager như thế nào?'),
      task('HTTP 404: sửa đúng tài nguyên thay vì đổi firewall',
       'Trên trình duyệt Server mở /handbook.html trước khi tạo file để thấy 404; /index.html vẫn trả 200. Đây là tình huống thiếu tài nguyên thật, không nạp lỗi NIC. IIS logs xem đúng site ID, status/substatus và URI; log có thể ghi trễ. Sau đó xuất bản đúng trang, không đổi binding hay mở port public.',
       r'''$p='C:\LabEx\Labs\win-web-isolated-site'
try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:18081/handbook.html -ErrorAction Stop } catch { $_.Exception.Response.StatusCode }
'<h1>Finance handbook approved</h1>' | Set-Content "$p\site\handbook.html" -Encoding UTF8
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:18081/handbook.html''',
       'Site/pool/identity/binding ban đầu còn đúng; index và handbook đều trả 200 với nội dung tương ứng. Phần quan sát 404 tự giải thích, không tự chứng nhận bằng file report.',
       "(Test-ProWebsite) -and (Test-ProHttp 'http://127.0.0.1:18081/handbook.html' '<h1>Finance handbook approved</h1>')",
       'Nếu TCP thành công nhưng URL sai trả 404, đổi DNS hoặc tắt firewall có sửa được đường dẫn file không?')], [MS+'iis/manage/configuring-security/application-pool-identities', MS+'troubleshoot/developer/webapps/iis/site-behavior-performance/troubleshoot-404-file-not-found-error'],module=1,target='server')


def update_catalog(changed):
    courses = read(DATA/'courses.json'); plan = read(DATA/'windows-roadmap.json')
    for cid in (BACKUP, WEB):
        labs = [l for l in NEW if l['course_id'] == cid]
        c = next(c for c in courses if c['id'] == cid)
        c.update(curriculum_status='partial', labs_count=len(labs), validation_status='awaiting-live-vm', curriculum_origin='locally-authored-microsoft-references',
                 description=f'{len(labs)} bài thực hành có bộ chấm trạng thái/chức năng; chưa kiểm thử đầu-cuối trên Azure. Các mục nâng cao trong đề cương chưa triển khai đầy đủ.')
        outline = next(c for c in plan['courses'] if c['id'] == cid)
        outline['practice_strategy'] = c['description']
        # Retain the six intended outcomes; do not call a partly built course ready.
        for m in outline['syllabus_modules']:
            m['lab_ids'] = [l['id'] for l in labs if l['curriculum_module'] == m['id']]
    plan['updated_at'] = '2026-10-26'
    write(DATA/'courses.json', courses); write(DATA/'windows-roadmap.json', plan)
    write(DATA/'windows-professional-rules.json', RULES)
    write(ROOT/'docs/windows-professional-review.json', {'date':'2026-10-26','teaching_reviewed':changed,'new_labs':[l['id'] for l in NEW],
          'new_tasks':sum(len(l['steps']) for l in NEW),'state_rules':len(RULES),'live_acceptance':'pending',
          'live_verified_labs':['win-it-file-in-use'],'deferred':['windows-11-fundamentals','windows-networking-fundamentals'],
          'not_implemented':['File Server two-identity SMB acceptance','IIS HTTPS/client path','system-state/AD recovery','real isolated DHCP provider']})


def build_file_lock():
    lid='win-it-file-in-use'
    title='Ticket thực tế: file đang được tiến trình khác sử dụng'
    intro=r'''## Ticket HD-P02: không cập nhật được báo cáo dùng chung
Nhân viên lưu báo cáo thì Windows báo file đang được chương trình khác sử dụng. Bạn phải xác định đúng process đang giữ handle, giải phóng an toàn và giữ nguyên dữ liệu; không cấp thêm quyền hoặc reboot máy để né chẩn đoán.

### Cơ chế thật và giới hạn
Chỉ cần CLIENT01. Nút **Chuẩn bị sự cố** tạo file CSV mẫu và tác vụ riêng `LabExSupportFileLock`. Một process Windows PowerShell mở file bằng FileShare.None, gây **sharing violation thật** ở Windows. Không phải Excel/Office; lab không giả có phần mềm chưa cài. Không chặn file người dùng, không đổi service hệ thống.

### Trước khi thao tác
Hoàn nguyên kịch bản khác nếu đang học. Task không có lịch lặp và tự thoát sau 30 phút để tránh phiên bỏ quên; hết thời gian không được tính là tự sửa thành công. Học xong bấm **Hoàn nguyên kịch bản**. Không chạy lại script tạo file hoặc xóa tác vụ bằng tay.

Phần chẩn đoán tự ghi nhận bằng lời; chỉ phần giải phóng và kiểm sử dụng file có nút chấm. Đã kiểm thử đầu-cuối trên CLIENT01 ngày 26/10/2026: lỗi khóa thật → chưa sửa trượt → sửa đúng đạt → hoàn nguyên sạch. Kết quả này không tự chứng nhận bạn đã làm bài.
'''
    diagnosis=r'''## Tìm đúng ứng dụng đang giữ file
### Quan sát từ Desktop
1. Bấm Chuẩn bị sự cố, chờ xác minh hoàn tất. Explorer mở `C:\LabEx\PracticeFaults\filelock`. Thử mở shared.csv bằng Notepad: lỗi đọc/ghi có thể khác tùy cách ứng dụng mở file, không suy từ một thông báo duy nhất.
2. Win+R → `resmon.exe` → CPU → **Associated Handles**. Nhập `shared.csv`, đối chiếu cả đường dẫn; có thể cần nâng quyền để thấy process SYSTEM. Đọc Image/PID, không End process theo tên powershell.exe chung.
3. Task Manager → Details → Select columns → Command line. Đối chiếu PID vừa tìm với đường script `C:\LabEx\PracticeFaults\filelock\locker.ps1`. Process này do lab tạo; không phải cửa sổ PowerShell bạn đang gõ.
4. Task Scheduler Library → LabExSupportFileLock → Actions/General, đối chiếu action và identity. Chưa dừng vội: ghi tại sao là lỗi giữ handle, không phải NTFS.

### Tự tái hiện bằng thao tác mở độc quyền
```powershell
$s=[IO.File]::Open('C:\LabEx\PracticeFaults\filelock\shared.csv',[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
$s.Dispose()
```
Khi lỗi, dòng đầu ném IOException do file đang được giữ; dòng Dispose có thể báo biến null, không phải nguyên nhân mới. Trong .NET, FileShare.None không cho process khác mở tương thích cho đến khi handle đóng. Với ứng dụng thật phải yêu cầu người dùng lưu và đóng ứng dụng trước; kill có thể làm mất phần chưa lưu.

### Tự giải thích
Ghi PID, command line và đường file thật. Vì sao cho Everyone Full control không giải phóng handle? Vì sao reboot có thể hết lỗi nhưng chưa chỉ ra nguồn gốc? Vì sao phải xác nhận người dùng trước khi đóng ứng dụng?
'''
    repair=r'''## Giải phóng đúng process và thử lại
### Can thiệp nhỏ nhất
Trong phần mềm thật: lưu phần đang làm và đóng ứng dụng giữ file bằng chức năng thoát bình thường. Trong lab, process cố tình giữ file không có cửa sổ tương tác; dùng **Task Scheduler → LabExSupportFileLock → End** để kết thúc đúng tác vụ đã đối chiếu. Không chọn End task cho mọi powershell.exe.

Lệnh tương đương, chỉ tác động đúng task của bài:
```powershell
Stop-ScheduledTask -TaskName LabExSupportFileLock
```
Đợi trạng thái không còn Running rồi thử mở file bằng Notepad. Nội dung vẫn phải có cột Order,Amount và dòng 1042,2500000. Không xóa/đổi tên/ghi đè file để hết thông báo.

```powershell
$s=[IO.File]::Open('C:\LabEx\PracticeFaults\filelock\shared.csv',[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
$s.Dispose()
Get-Content 'C:\LabEx\PracticeFaults\filelock\shared.csv'
```
Mở được handle ReadWrite mới và đóng sạch chứng minh file sử dụng được tại thời điểm thử; chưa chứng minh nghiệp vụ Excel hoặc SMB. Bấm **Kiểm tra kết quả**: backend tự mở lại file thật, đối chiếu nội dung gốc và ownership/action task. Task vẫn chạy, sửa nội dung file, thay action hoặc chờ quá hạn đều không đạt.

### Bàn giao và hoàn nguyên
Ticket: sharing violation → PID/handle đúng script lab → kết thúc đúng task → mở lại file thành công, dữ liệu giữ nguyên. Hoàn nguyên trên web để xóa đúng task và thư mục do bài tạo; reset kiểm ownership, không kill process theo PID đoán và không xóa thư mục khác.
'''
    sections=[]
    for n,(name,body,kind) in enumerate([('Ticket và phạm vi',intro,'introduction'),('Tìm handle và khoanh vùng',diagnosis,'document'),('Giải phóng khóa và thử chức năng',repair,'task')]):
        section=dict(id=f'{lid}-sec-{n}',title=name,title_vi=name,position=n,kind=kind,need_verify=kind=='task',content=body,content_vi=body)
        if kind=='task':section.update(task='File mở ReadWrite độc quyền được, nội dung gốc giữ nguyên, đúng ownership và task không còn giữ khóa.',task_vi='File mở ReadWrite độc quyền được, nội dung gốc giữ nguyên, đúng ownership và task không còn giữ khóa.',hint='Tìm Associated Handles trước; chỉ End đúng LabExSupportFileLock.',hint_vi='Tìm Associated Handles trước; chỉ End đúng LabExSupportFileLock.',verification={'kind':'windows-remote'})
        sections.append(section)
    lab=dict(id=lid,course_id='windows-11-it-support-troubleshooting',order=27,title=title,title_vi=title,type='lab',difficulty='Intermediate',estimated_time='35–45 mins',target_vm='client',
             curriculum_version=4,curriculum_origin='locally-authored-microsoft-references',overview='Xử lý sharing violation thật: Associated Handles → đúng process → giải phóng → kiểm ReadWrite và dữ liệu.',practice_mode='fault-injection',
             preparation={'mode':'fault-injection','requires_vm_start':True,'target':'client','fault_injection':True},validation_status='live-client-verified-2026-10-26',
             references=[{'title':'File sharing and file handles','url':MS+'windows/win32/fileio/creating-and-opening-files'},{'title':'Stop-ScheduledTask','url':MS+'powershell/module/scheduledtasks/stop-scheduledtask'}],sections=sections,steps=[copy.deepcopy(sections[2])])
    write(LABS/(lid+'.json'),lab); NEW.append(lab)


if __name__ == '__main__':
    changed = improve_existing(); build_new(); build_file_lock(); update_catalog(changed)
    catalog=read(DATA/'courses.json'); support=next(c for c in catalog if c['id']=='windows-11-it-support-troubleshooting')
    support['labs_count']=27
    support['curriculum_review_status']='in-progress'
    support['description']='Khóa đang nâng cấp: giữ 25 bài chẩn đoán/cấu hình; thêm ticket LOCAL SERVICE/NTFS và sharing violation thật. Phân biệt bài thu bằng chứng với bài kiểm chức năng; không coi toàn khóa đã kiểm thử live.'
    write(DATA/'courses.json',catalog)
    roadmap=read(DATA/'windows-roadmap.json'); support=next(c for c in roadmap['courses'] if c['id']=='windows-11-it-support-troubleshooting')
    module=next(m for m in support['syllabus_modules'] if m['id'].endswith('-practical-v2'))
    module['lab_ids']=['win-it-scheduled-backup-permissions','win-it-file-in-use']
    module['planned_lessons']=['Backup LOCAL SERVICE lỗi quyền NTFS','Sharing violation: tìm đúng process đang giữ file']
    write(DATA/'windows-roadmap.json',roadmap)
    print(f'Reviewed teaching in {len(changed)} existing lessons; published {len(NEW)} new practical lessons/{sum(len(l["steps"]) for l in NEW)} tasks. No VM operations. See per-lab live validation status.')
