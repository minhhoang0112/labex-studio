"""Seed the Windows learning plan. Adds missing course shells; never writes labs."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'server' / 'data'
refs = {
    'client': {'title': 'Windows Client: xử lý sự cố mạng', 'url': 'https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/networking-overview'},
    'powershell': {'title': 'Get started with Windows PowerShell', 'url': 'https://learn.microsoft.com/en-us/training/paths/get-started-windows-powershell/'},
    'automation': {'title': 'Maintain system administration tasks in Windows PowerShell', 'url': 'https://learn.microsoft.com/en-us/training/paths/maintain-system-administration-tasks-windows-powershell/'},
    'ad': {'title': 'Deploy and manage Active Directory Domain Services', 'url': 'https://learn.microsoft.com/en-us/training/paths/deploy-manage-active-directory-domain-services/'},
    'network': {'title': 'Windows Server Networking', 'url': 'https://learn.microsoft.com/en-us/windows-server/networking/'},
    'storage': {'title': 'Manage storage and file services', 'url': 'https://learn.microsoft.com/en-us/training/paths/manage-storage-file-services/'},
    'monitor': {'title': 'Monitor and troubleshoot Windows Server environments', 'url': 'https://learn.microsoft.com/en-us/training/paths/monitor-troubleshoot-windows-server-environments/'},
    'security': {'title': 'Windows security documentation', 'url': 'https://learn.microsoft.com/en-us/windows/security/'},
    'iis': {'title': 'IIS documentation', 'url': 'https://learn.microsoft.com/en-us/iis/'},
}
courses = []

def add(cid, name, stage, prerequisites, outcomes, modules, references, environment, existing=False, optional=False):
    courses.append(dict(id=cid, name=name, stage=stage, prerequisites=prerequisites,
        prerequisite_skills=[] if not prerequisites else ['Kiến thức từ các khóa học trước được gợi ý bên dưới'],
        learning_outcomes=outcomes, optional=optional, environment_plan=environment,
        references=[refs[r] for r in references],
        practice_strategy='Đã có bài local; học theo danh sách bài và kiểm tra khả năng hỗ trợ từng nhiệm vụ.' if existing else 'Xem đề cương trước. Hướng dẫn, dữ liệu thực hành và bộ chấm sẽ được bổ sung sau.',
        syllabus_modules=[dict(id=f'{cid}-module-{i+1}', title=title, planned_lessons=lessons) for i, (title, lessons) in enumerate(modules)],
        initially_implemented=existing))

F='windows-11-fundamentals';N='windows-networking-fundamentals';P='windows-powershell-for-sysadmins'
H='windows-11-it-support-troubleshooting';S='windows-server-administration-essentials'
A='windows-active-directory-group-policy';D='windows-dns-dhcp-network-services';T='windows-file-services-storage'
I='windows-iis-web-services';U='windows-powershell-automation';M='windows-troubleshooting-and-incident-response'
B='windows-backup-disaster-recovery';E='windows-security-hardening';Z='windows-azure-hybrid-administration';C='windows-system-administrator-capstone'

add(F,'Nền tảng Windows 11 cho IT Support','foundations',[],
    ['Hiểu tài khoản, hệ thống tệp, tiến trình và dịch vụ', 'Dùng công cụ quản trị và làm việc theo quy trình thay đổi có hoàn nguyên'],[
    ('Kiến trúc và công cụ Windows',['Khảo sát phiên bản, phần cứng và công cụ quản trị','Phân biệt tiến trình, dịch vụ và tác vụ khởi động']),
    ('Tài khoản và dữ liệu',['Tài khoản local, UAC và quyền quản trị','Đường dẫn, profile, NTFS và quyền truy cập']),
    ('Cài đặt và bảo trì',['Cài ứng dụng, driver và cập nhật: kiểm tra nguồn, lập kế hoạch hoàn nguyên','Thu thập thông tin máy và lập biên bản cấu hình'])],['security','client'],'CLIENT01 hiện có; chưa triển khai bài mới')
add(N,'Mạng máy tính căn bản trên Windows','foundations',[F],
    ['Hiểu IP, subnet, gateway, DNS, DHCP và cổng TCP', 'Chẩn đoán theo lớp thay vì thử lệnh ngẫu nhiên'],[
    ('Đọc cấu hình mạng',['Đọc IP, subnet mask, gateway và đường đi gói tin','Phân biệt IP tĩnh, DHCP và địa chỉ APIPA']),
    ('Phân giải tên và kết nối',['Phân biệt lỗi DNS với lỗi đường truyền','Kiểm tra TCP, firewall và kết nối ứng dụng']),
    ('Tình huống helpdesk',['Chẩn đoán có mạng nhưng không truy cập được dịch vụ','Lập sơ đồ mạng và báo cáo bằng chứng trước/sau'])],['network','client'],'CLIENT01 hiện có; bài thay đổi IP cần đường truy cập dự phòng')
add(P,'PowerShell cơ bản cho quản trị hệ thống','foundations',[F],
    ['Hiểu cmdlet, đối tượng và pipeline', 'Đọc trạng thái dịch vụ, tiến trình và tệp bằng lệnh'],[
    ('Cú pháp và trợ giúp',['Cmdlet, Get-Help và pipeline']),('Quản trị bằng lệnh',['Tiến trình, dịch vụ, tệp và quyền'])],['powershell'],'Windows VM hiện có',existing=True)
add(H,'IT Support Windows 11: xử lý sự cố thực tế','support',[F,N,P],
    ['Tiếp nhận ticket, xác định phạm vi lỗi và thu thập bằng chứng', 'Thực hành cấu hình, sửa lỗi, backup và xác minh kết quả'],[
    ('Quy trình helpdesk',['Tiếp nhận ticket, phân loại và giao tiếp với người dùng']),('Sửa lỗi và khôi phục',['25 bài đã có; gồm 7 kịch bản nạp lỗi và các bài chẩn đoán/cấu hình'])],['client','security'],'CLIENT01 hiện có; chỉ nạp lỗi qua kịch bản đã có baseline/restore',existing=True)
add(S,'Windows Server: nền tảng và Active Directory','server',[N,P],
    ['Hiểu vai trò máy chủ, domain và mô hình client/server', 'Làm quen AD DS, GPO, DNS/DHCP và chia sẻ tệp'],[
    ('Quản trị máy chủ',['Vai trò, dịch vụ và công cụ quản trị']),('Dịch vụ nền tảng',['Bài AD DS, GPO, DNS/DHCP và SMB hiện có'])],['ad','network'],'Windows Server VM hiện có',existing=True)
add(A,'Active Directory và Group Policy chuyên sâu','server',[S],
    ['Thiết kế OU, nhóm và phân quyền theo vai trò', 'Triển khai GPO và chẩn đoán xác thực/domain join'],[
    ('Thiết kế danh tính',['Thiết kế OU, security group và quy tắc cấp quyền','Vòng đời tài khoản: onboarding, offboarding và delegation']),
    ('Group Policy',['Thiết lập, liên kết và kiểm tra phạm vi áp dụng GPO','Đọc gpresult, xử lý xung đột và lỗi policy']),
    ('Máy trạm trong domain',['Domain join, DNS và đồng bộ thời gian','Chẩn đoán đăng nhập domain và secure channel'])],['ad'],'Server + CLIENT01: phải khảo sát VNet/DNS/domain và baseline trước khi triển khai')
add(D,'DNS, DHCP và dịch vụ mạng Windows Server','server',[S,N],
    ['Quản lý zone/record DNS và scope/lease DHCP', 'Chẩn đoán sự cố cấp IP và phân giải tên theo bằng chứng'],[
    ('DNS nội bộ',['Tạo forward/reverse zone và bản ghi cần thiết','Kiểm tra client resolver, cache và forwarder']),
    ('DHCP',['Thiết kế scope, exclusion, reservation và option','Đọc lease, authorization và nhật ký DHCP']),
    ('Xử lý lỗi mạng doanh nghiệp',['Chẩn đoán DNS record sai hoặc dịch vụ dừng','Phân tích thiếu lease và sai tùy chọn mạng'])],['network'],'DNS có thể dùng Server hiện có; DHCP cần mạng lab cô lập phù hợp, không thay DHCP của Azure VNet')
add(T,'File Server, phân quyền và lưu trữ Windows','server',[S,A],
    ['Tính quyền hiệu lực SMB kết hợp NTFS', 'Quản lý dung lượng, quota và truy cập thư mục theo nhóm'],[
    ('Chia sẻ tệp theo phòng ban',['Thiết kế nhóm và thư mục chia sẻ theo vai trò','Kiểm tra quyền share, NTFS và kế thừa']),
    ('Vận hành lưu trữ',['Kiểm tra volume, dung lượng và sự kiện ổ đĩa','Lập kế hoạch quota, FSRM và kiểm soát loại tệp']),
    ('Tình huống thực tế',['Sửa lỗi Access Denied mà không cấp Full Control tràn lan','Khôi phục tệp thử nghiệm và xác nhận quyền sau restore'])],['storage'],'Server + client; bài volume/disk cần VHD hoặc đĩa dữ liệu thử, chưa cấp phát')
add(I,'IIS và vận hành dịch vụ web nội bộ','server',[S,N],
    ['Hiểu website, application pool, binding và quyền truy cập', 'Phân biệt lỗi dịch vụ, HTTP, DNS và firewall'],[
    ('Triển khai website',['Tạo website thử nghiệm và application pool riêng','Cấu hình binding, tên miền nội bộ và truy cập từ client']),
    ('Đọc log và chẩn đoán',['Phân tích HTTP status, IIS log và lỗi quyền thư mục','Xử lý app pool dừng và website không phản hồi']),
    ('Bảo trì có hoàn nguyên',['Lập kế hoạch HTTPS và chứng chỉ trong lab','Backup cấu hình IIS, thay đổi và rollback'])],['iis'],'Server hiện có; không mở cổng công khai mới khi chưa cần')
add(U,'PowerShell tự động hóa công việc SysAdmin','operations',[P,S],
    ['Viết script có kiểm tra đầu vào, log và xử lý lỗi', 'Tự động hóa tác vụ lặp lại có khả năng chạy lại an toàn'],[
    ('Script vận hành',['Tham số, biến, điều kiện và vòng lặp trong tác vụ quản trị','Xử lý lỗi, log, exit code và kiểm tra kết quả']),
    ('Dữ liệu và lập lịch',['Nhập CSV, kiểm tra dữ liệu và xuất báo cáo','Task Scheduler, tài khoản chạy tác vụ và quyền tối thiểu']),
    ('Quản trị từ xa',['Khảo sát WinRM và thực thi từ xa trong lab','Viết script kiểm kê có dry-run và cơ chế hoàn nguyên'])],['automation'],'VM hiện có; phân biệt PowerShell qua Azure Agent chạy SYSTEM với phiên người dùng')
add(M,'Chẩn đoán sự cố Windows Server','operations',[S,N,P],
    ['Đọc Event Viewer, theo dõi hiệu năng và đặt giả thuyết', 'Xác minh dịch vụ phục hồi bằng phép thử chức năng'],[
    ('Quan sát và bằng chứng',['Log, Event ID và hiệu năng']),('Khắc phục và xác minh',['Dịch vụ, mạng và cấu hình: các bài đã có'])],['monitor'],'Windows Server VM hiện có',existing=True)
add(B,'Backup, khôi phục và diễn tập sự cố Windows','operations',[T,U],
    ['Phân biệt backup, snapshot, restore point, RPO và RTO', 'Khôi phục dữ liệu và chứng minh bản backup sử dụng được'],[
    ('Thiết kế sao lưu',['Xác định dữ liệu quan trọng, lịch backup, RPO/RTO và retention','Phân biệt file backup, system state và snapshot']),
    ('Diễn tập khôi phục',['Sao lưu và restore dữ liệu vào thư mục kiểm chứng riêng','Thử phục hồi cấu hình và quyền truy cập sau lỗi']),
    ('Phục hồi dịch vụ',['Lập runbook mất máy chủ và khôi phục từng dịch vụ','Thiết kế diễn tập system state/AD restore trên bản sao cô lập'])],['storage','monitor'],'Bài file dùng VM hiện có; system-state/AD restore cần bản sao lab và lưu trữ riêng, chưa triển khai')
add(E,'Bảo mật và hardening Windows cho SysAdmin','operations',[A,T,M],
    ['Áp dụng quyền tối thiểu, auditing và quản lý bản vá', 'Đánh giá tác động bảo mật và giữ đường quản trị dự phòng'],[
    ('Tài khoản và quyền',['Rà soát local admin, tài khoản dịch vụ và quyền đăng nhập','Thiết kế password/account policy và kiểm tra phạm vi']),
    ('Bảo vệ máy và mạng',['Kiểm tra Windows Defender, firewall và nhật ký bảo mật','Lập kế hoạch bản vá, reboot và xác minh dịch vụ']),
    ('Hardening có kiểm chứng',['So sánh cấu hình với baseline và lập báo cáo sai lệch','Thử một thay đổi hardening có backup và rollback'])],['security','ad'],'VM lab hiện có; không bật BitLocker hoặc thay chính sách truy cập diện rộng trước khi có phương án khôi phục')
add(Z,'Windows Server và Azure hybrid — mở rộng','hybrid',[E,B],
    ['Phân biệt AD DS, Microsoft Entra ID và danh tính hybrid', 'Lập kế hoạch quản trị Azure VM, giám sát, backup và chi phí'],[
    ('Danh tính hybrid',['So sánh AD DS, Entra ID và các kiểu join thiết bị','Thiết kế đồng bộ danh tính và kiểm tra điều kiện tenant']),
    ('Vận hành Azure VM',['Đọc boot diagnostics, VM Agent và kết nối quản trị','Phân biệt stop/deallocate, disk, IP và ngân sách']),
    ('Quản trị hybrid',['Thiết kế theo dõi máy chủ với Azure Monitor/Arc','Lập phương án Azure Backup và dự toán chi phí'])],['ad','monitor'],'Nhánh tùy chọn; cần kiểm tra tenant, license, quyền và chi phí trước mọi tài nguyên mới',optional=True)
add(C,'Dự án tổng hợp: vận hành hạ tầng Windows doanh nghiệp','capstone',[H,A,D,T,I,U,M,B,E],
    ['Thiết kế, triển khai và bàn giao một hệ thống Windows nhỏ', 'Xử lý ticket, giải thích nguyên nhân gốc và chứng minh khôi phục'],[
    ('Thiết kế doanh nghiệp nhỏ',['Lập sơ đồ, danh tính, địa chỉ mạng và ma trận quyền','Viết kế hoạch triển khai, kiểm thử và hoàn nguyên']),
    ('Triển khai và xử lý ticket',['Onboarding nhân viên, cấp thư mục và policy theo vai trò','Điều tra ticket kết hợp DNS, quyền và dịch vụ web']),
    ('Diễn tập và bàn giao',['Khôi phục dữ liệu, kiểm thử chức năng và đo RPO/RTO thực tế','Bàn giao runbook, bằng chứng, báo cáo sự cố và phỏng vấn giải thích'])],['ad','network','storage','monitor'],'Dự kiến tái dùng server + client nếu topology cho phép; không tự tạo VM mới')

stages = [
    ('foundations','Nền tảng máy trạm, mạng và PowerShell','Hiểu công cụ và bản chất trước khi sửa lỗi.'),
    ('support','IT Support và Helpdesk','Áp dụng nền tảng để tiếp nhận ticket, chẩn đoán và phục hồi máy trạm.'),
    ('server','Junior Windows System Administrator','Đi từ nền tảng máy chủ đến danh tính, dịch vụ mạng, tệp và IIS.'),
    ('operations','Vận hành, khôi phục và bảo mật','Tự động hóa, giám sát, backup và thay đổi có kiểm chứng.'),
    ('hybrid','Azure và quản trị hybrid — tùy chọn','Học sau nền tảng; cần khảo sát quyền, license và chi phí khi triển khai.'),
    ('capstone','Dự án thực tế và chuẩn bị đi làm','Ghép kỹ năng qua ticket, báo cáo sự cố và bàn giao hệ thống.'),
]
plan=dict(id='windows-system-administrator',alias='windows',title='Lộ trình Windows: IT Support → System Administrator',
    description='Lộ trình từ máy trạm Windows 11, mạng và PowerShell đến hỗ trợ người dùng, quản trị Windows Server, vận hành, bảo mật và dự án doanh nghiệp. Nhánh Azure hybrid là tùy chọn.',
    curriculum_origin='locally-planned-microsoft-references',updated_at='2026-10-20',
    start_course_id=F,available_start_course_id=H,
    prerequisites_advisory=True,source_order=[],
    guidance='Thứ tự là khuyến nghị, không khóa bài đã có. Có thể thực hành 25 bài IT Support hiện có trong khi chờ các khóa nền tảng được bổ sung. Mỗi bài mới phải có giải thích bản chất, hướng dẫn, tự thực hành, bộ kiểm tra trạng thái và hoàn nguyên trước khi đánh dấu triển khai.',
    stages=[dict(id=sid,name=name,description=desc,course_ids=[c['id'] for c in courses if c['stage']==sid]) for sid,name,desc in stages],courses=courses)

def save(path,value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Preserve reviewed course metadata when reseeding the outline after lessons ship.
previous_path=DATA/'windows-roadmap.json'
if previous_path.exists():
    previous=json.loads(previous_path.read_text(encoding='utf-8'))
    for course in plan['courses']:
        prior=next((c for c in previous.get('courses',[]) if c['id']==course['id']),None)
        if prior and any((DATA/'labs').glob('*.json')):
            linked=[lid for m in prior.get('syllabus_modules',[]) for lid in m.get('lab_ids',[])]
            if linked and all((DATA/'labs'/f'{lid}.json').exists() for lid in linked):
                for key in ('practice_strategy','environment_plan','references','syllabus_modules'):
                    if key in prior:course[key]=prior[key]
                plan['updated_at']=max(plan['updated_at'],previous.get('updated_at',plan['updated_at']))
                if course['id']==plan['start_course_id']:
                    plan['available_start_course_id']=course['id']
                    plan['guidance']=previous.get('guidance',plan['guidance'])
save(DATA/'windows-roadmap.json',plan)
catalog=json.loads((DATA/'courses.json').read_text(encoding='utf-8'))
ids={c['id'] for c in catalog}
for index,c in enumerate(courses):
    if c['id'] in ids:continue
    catalog.append(dict(id=c['id'],alias=c['id'],numeric_id=9100+index,name=c['name'],topic='windows',
        level='Beginner' if c['stage']=='foundations' else 'Advanced' if c['stage'] in ('hybrid','capstone') else 'Intermediate',
        description='; '.join(c['learning_outcomes'])+'. Khóa đã có đề cương; nội dung và bài thực hành sẽ được bổ sung sau.',
        cover='/images/windows-course.svg',skills=c['learning_outcomes'],tags=['Windows','IT Support' if c['stage']=='foundations' else 'SysAdmin'],
        has_cert=False,curriculum_status='planned',curriculum_origin='locally-planned-microsoft-references'))
save(DATA/'courses.json',catalog)
paths=json.loads((DATA/'paths.json').read_text(encoding='utf-8'))
windows=dict(id=8,alias='windows',name='Windows: IT Support → System Administrator',img_url='/images/windows-course.svg',
    description=plan['description'],has_cert=False,curriculum_origin=plan['curriculum_origin'],
    levels=[dict(level=i+1,name=s['name'],courses=[dict(alias=cid) for cid in s['course_ids']]) for i,s in enumerate(plan['stages'])])
paths=[windows if p['alias']=='windows' else p for p in paths]
if not any(p['alias']=='windows' for p in paths):paths.append(windows)
save(DATA/'paths.json',paths)
print('Windows roadmap: 15 courses, 6 stages; added missing shells only; no labs or VM resources created.')
