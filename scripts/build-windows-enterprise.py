"""Build two server curricula. Never install roles, start VMs, or assert live completion."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'server/data'
source=(ROOT/'server/runtime/windows/enterprise-common.ps1').read_text(encoding='utf-8')
functions={m.group(1):m.group(0).strip() for m in re.finditer(r'(?ms)^function ([\w-]+).*?(?=^function |\Z)',source)}
def ps(lid,code):
    code=code.replace('AD:\\\\','AD:\\')
    names={n for n in functions if n in code};pending=list(names)
    while pending:
        body=functions[pending.pop()]
        for n in functions:
            if n in body and n not in names:names.add(n);pending.append(n)
    text=f"$ErrorActionPreference='Stop'\n$labId='{lid}'\n"+'\n'.join(v for n,v in functions.items() if n in names)+'\n'+code
    if len(text)>10700:raise ValueError((lid,'Split oversized command',len(text)))
    return text
AD='windows-active-directory-group-policy';DNS='windows-dns-dhcp-network-services'
MS='https://learn.microsoft.com/en-us/'
DOMAIN_PATH='Cần đường mạng riêng Server–CLIENT01 và domain join đã kiểm thử. Hai VNet hiện tách biệt; chưa xác nhận kết nối/domain, không chấm bằng máy Server thay cho client.'
DHCP_PATH='Cần client DHCP trong mạng cô lập/relay đã kiểm chứng; Azure VNet hiện tại không cấp lease từ DHCP Server này cho CLIENT01. Không dùng lease thêm bằng cmdlet thay giao dịch thật.'
lessons=[]
isolated_guides={
 ('lease-audit',2):'''### Quy trình thực hành khi đã có mạng DHCP cô lập
1. Quản trị xác nhận virtual switch/relay thật, subnet/scope, IP server và NIC client. NIC thử tách NIC quản trị; có baseline và đường truy cập dự phòng. Không lấy hai Azure VNet hiện tại làm LAN broadcast.
2. Trong DHCP console, chọn đúng scope thuộc run. So subnet mask/range/exclusion/reservation/options với worksheet; không dùng scope tài liệu đang Inactive của bài khác.
3. Chỉ activate scope đã được provider cô lập phê duyệt. Trên client chỉ đặt IPv4/DNS Automatic cho NIC thử; giữ nguyên NIC quản trị.
4. Đọc ipconfig /all và Get-CimInstance Win32_NetworkAdapterConfiguration: IP/subnet/gateway/DNS, DHCPEnabled, DHCPServer, DHCPLeaseObtained/Expires và MAC/ClientId. Địa chỉ phải thuộc range sau exclusion, DHCPServer đúng server lab; không chỉ nhìn IP có dạng private.
5. Trên Server dùng Get-DhcpServerv4Lease -ScopeId <scope thật> -AllLeases. Đối chiếu cùng ClientId/IP/trạng thái/thời điểm; reservation không thay lease. Không tạo lease bằng cmdlet để làm đủ bảng.
6. Ghi trước/sau có timestamp UTC và target NIC. Nếu client vẫn nhận lease của Azure/router khác, phép thử chưa đạt môi trường, không đổi số liệu trong báo cáo.''',
 ('lease-audit',3):'''### Đọc giao dịch và renew thật
1. Xác nhận lease thật của task2; đồng bộ cách đọc giờ server/client, không chỉnh clock để làm evidence khớp.
2. Đọc Get-DhcpServerAuditLog để biết audit đang bật, đường log và dung lượng. Đọc log đúng ngày/thời điểm/client; không tự ghi thêm dòng vào DhcpSrvLog để giả giao dịch.
3. Quan sát DORA: Discover tìm server, Offer đề xuất, Request chọn/cấp lại, ACK xác nhận. Khi renew T1 thường gửi unicast tới server đã cấp; T2 rebind mở rộng tìm server. Không áp cùng một kết luận cho relay trên Azure và LAN trực tiếp.
4. Chỉ renew adapter thử trong môi trường cô lập đã xác minh; không chạy release/renew không tên adapter. Đọc lại server lease và client obtained/expiry/options, không coi exit0 là đã nhận cấu hình mới.
5. Nếu cần packet evidence, chỉ capture NIC cô lập theo quy trình lab; audit/lease không đủ để khẳng định đã nhìn thấy đủ bốn packet. Không chụp lưu lượng NIC quản trị hoặc đưa secret vào file bàn giao.
6. Kết thúc giữ client/network về baseline, trả scope trạng thái cũ và đối chiếu đường quản trị còn hoạt động. Task chưa có provider/grader tương ứng nên không tự chấm đạt trên web.''',
 ('dhcp-incident',1):'''### Tái hiện có kiểm soát sau khi provider sẵn sàng
1. Từ một client cô lập đang có lease tốt, chụp Get-NetIPConfiguration, ipconfig /all và kết quả query tên lab. Xác nhận DNS server lab thật hoạt động.
2. Trên Server đọc Get-DhcpServerv4OptionValue -ScopeId <scope riêng> -OptionId 6, lưu baseline từng giá trị vào manifest/journal tin cậy của provider. Kiểm scope thuộc run, không sửa server-wide option hay reservation của người khác.
3. Theo thao tác inject của provider, đổi duy nhất option006 scope sang địa chỉ DNS sai được bố trí trong mạng cô lập; không dùng địa chỉ public tùy ý và không đổi Azure VNet DNS.
4. Client nhận lại option bằng quy trình renew chỉ NIC thử, sau đó ghi DNS thực nhận và lỗi query. Nếu client vẫn giữ DNS cũ và query tốt thì chưa tái hiện được lỗi; không ghi trạng thái faulted.
5. Giữ nguyên IP/gateway khi chẩn đoán để chứng minh lỗi nằm ở option DNS; đọc lease/ClientId/time cùng phía server. Không quy kết server DHCP ngừng hoạt động khi client vẫn có lease.''',
 ('dhcp-incident',2):'''### Sửa tối thiểu và chứng minh client nhận cấu hình
1. Đọc baseline và trước-sửa của task1; kiểm đúng scope ID và client NIC. Không bắt đầu bằng tắt firewall, reset TCP/IP hoặc restart toàn dịch vụ.
2. Sửa option006 của scope riêng về đúng DNS lab đã đo; giữ nguyên option003/015 nếu chúng không sai.
3. Renew chỉ NIC cô lập đã phê duyệt. Đọc lại DHCPServer, DNS server thực nhận, lease obtained/expiry và ClientId. Server option đúng mà client vẫn giữ giá trị sai thì chưa hoàn thành.
4. So sánh Resolve-DnsName tên lab theo resolver mặc định với query chỉ định DNS lab; kiểm cache nếu kết quả còn cũ, không sửa hosts để che lỗi. Query authoritative tốt không thay query thực từ client.
5. Chứng minh truy cập chức năng nằm trong mục tiêu bài; nếu chỉ kiểm DNS thì báo sửa DNS, không kết luận Internet/HTTPS/đăng nhập mọi user đã tốt. Provider/grader hai phía chưa có trên hạ tầng hiện tại nên web vẫn khóa chấm.''',
 ('dhcp-incident',3):'''### Bàn giao và hoàn nguyên
1. Ticket cần scope ID, clientId/NIC, thời điểm, IP và option trước/sau, lỗi query, thay đổi duy nhất đã làm, kết quả kiểm lại và phần chưa thử; không chứa password/token.
2. Reset qua journal của provider: trả option/duration/activation về baseline đã lưu; chỉ thu hồi lease/client disposable nếu chúng do run tạo và quy trình cho phép.
3. Đọc lại Server scope/options/binding và client cấu hình, query tên lab. Chỉ in reset OK khi những phép kiểm này đạt; lỗi một phía phải giữ phiên cần khôi phục.
4. Xác nhận NIC quản trị/Azure Agent/RDP, các scope/zone/domain ngoài bài còn nguyên. Không deauthorize server có sẵn, không stop DHCP service và không xóa toàn bộ lease.
5. Đóng tài nguyên do lab bật theo trạng thái đầu; snapshot/disk không tự miễn phí khi VM deallocate. Lưu bằng chứng kiểm reset và giới hạn môi trường để buổi sau tiếp tục đúng chỗ.'''
}
def T(title,why,code,probe,expected,question,client=None,blocked=None,modules=None):
    return dict(title=title,why=why,code=code,probe=probe,expected=expected,question=question,client=client,blocked=blocked,modules=modules)
def L(course,slug,title,module,theory,gui,tasks,modules,refs):
    lessons.append(dict(course=course,id=('win-adg-' if course==AD else 'win-dnsdhcp-')+slug,title=title,module=module,theory=theory,gui=gui,tasks=tasks,modules=modules,refs=refs))

L(AD,'ou-groups','Thiết kế OU, nhóm bảo mật và AGDLP',1,
 'OU phục vụ tổ chức, delegation và phạm vi GPO; security group phục vụ cấp quyền. Domain → Accounts → Global group → Domain Local group → Permissions là mô hình AGDLP trong một domain. Đưa người dùng vào OU không tự cấp quyền tài nguyên. Security khác Distribution; scope Global và DomainLocal có vai trò khác nhau. Bài tạo cây OU riêng có GUID/manifest, không sửa OU hoặc nhóm quản trị của bài cũ.',
 'Server Manager → Tools → Active Directory Users and Computers (dsa.msc), bật View → Advanced Features. Tìm OU có tên LabEx-win-adg-ou-groups-<run>. Dùng Properties → Object/Member Of và đối chiếu lệnh; không tạo đối tượng trong domain root ngoài OU bài.',[
 T('Tạo cây OU có phạm vi và ownership','Chuẩn bị manifest riêng rồi tạo Users/Groups/Workstations. Chạy lại không chiếm OU không có ownership.',
 "Initialize-SrvContext|Out-Null\nNew-SrvOU 'Users'|Out-Null;New-SrvOU 'Groups'|Out-Null;New-SrvOU 'Workstations'|Out-Null\n(Get-SrvContext).RootDN",
 "$m=Get-SrvContext;$ok=$true;foreach($name in @('Users','Groups','Workstations')){$o=Get-ADOrganizationalUnit -Identity ('OU='+$name+','+$m.RootDN) -Properties ProtectedFromAccidentalDeletion;$ok=$ok -and $o.ProtectedFromAccidentalDeletion -and (Test-SrvOwned 'AD' $o.ObjectGUID.ToString())};$ok",
 'Ba OU con đúng parent/GUID, được đăng ký và bảo vệ xóa nhầm; OU cùng tên ở nơi khác không đạt.','Vì sao OU Users của bài khác với container CN=Users mặc định?'),
 T('Tạo Global và DomainLocal Security group','Tên nhóm có runId để tránh đụng dữ liệu khác; scope phải đúng, không chỉ tên giống.',
 "New-SrvGroup 'Global'|Select-Object Name,GroupScope,GroupCategory\nNew-SrvGroup 'DomainLocal'|Select-Object Name,GroupScope,GroupCategory",
 "$m=Get-SrvContext;$ok=$true;foreach($scope in @('Global','DomainLocal')){$g=Get-ADGroup -Identity ('lx'+$m.Run.Substring(0,8)+$scope);$ok=$ok -and $g.GroupScope -eq $scope -and $g.GroupCategory -eq 'Security' -and $g.DistinguishedName.EndsWith(',OU=Groups,'+$m.RootDN) -and (Test-SrvOwned 'AD' $g.ObjectGUID.ToString())};$ok",
 'Hai nhóm Security đúng scope, đúng OU và GUID.','Đổi group thành Distribution có còn dùng để cấp quyền tài nguyên không?'),
 T('Nối user → GG → DL và kiểm membership','Thực hành membership thật; chưa gọi là kiểm quyền NTFS vì bài chưa đặt ACL tài nguyên.',
 "$u=New-SrvUser 'learner';$gg=New-SrvGroup 'Global';$dl=New-SrvGroup 'DomainLocal'\nAdd-ADGroupMember -Identity $gg -Members $u;Add-ADGroupMember -Identity $dl -Members $gg\nGet-ADGroupMember $dl -Recursive|Select-Object Name,ObjectClass",
 "$m=Get-SrvContext;$gg=Get-ADGroup -Identity ('lx'+$m.Run.Substring(0,8)+'Global');$dl=Get-ADGroup -Identity ('lx'+$m.Run.Substring(0,8)+'DomainLocal');$u=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'learner');(Test-SrvOwned 'AD' $u.ObjectGUID.ToString()) -and (Test-SrvOwned 'AD' $gg.ObjectGUID.ToString()) -and (Test-SrvOwned 'AD' $dl.ObjectGUID.ToString()) -and $gg.GroupCategory -eq 'Security' -and $dl.GroupCategory -eq 'Security' -and $gg.GroupScope -eq 'Global' -and $dl.GroupScope -eq 'DomainLocal' -and $gg.DistinguishedName.EndsWith(',OU=Groups,'+$m.RootDN) -and $dl.DistinguishedName.EndsWith(',OU=Groups,'+$m.RootDN) -and @(Get-ADGroupMember $gg|Where-Object SID -eq $u.SID).Count -eq 1 -and @(Get-ADGroupMember $dl|Where-Object SID -eq $gg.SID).Count -eq 1",
 'Kiểm thành viên trực tiếp user trong GG và GG trong DL, không chỉ membership đệ quy.','Vì sao thêm user vào DL trực tiếp có thể làm khó quản lý theo vai trò?')],['ActiveDirectory'],[MS+'windows-server/identity/ad-ds/plan/understanding-the-active-directory-logical-model',MS+'windows-server/identity/ad-ds/manage/understand-security-groups'])

L(AD,'account-delegation','Vòng đời tài khoản và delegation tối thiểu',1,
 'Onboarding cần tên, OU, nhóm và quyền theo vai trò; offboarding thường disable và thu hồi nhóm trước khi quyết định xóa theo chính sách. SID giúp nhận diện tài khoản qua đổi tên. Delegation phải đúng principal, extended right, class và inheritance; cho Domain Admin để helpdesk reset password là quá quyền. Bài dùng user dùng một lần trong OU bài, không reset password tài khoản thật. Password ban đầu được sinh ngẫu nhiên và không xuất ra web/log.',
 'Trong ADUC mở OU bài. Để thực hiện bằng identity delegate, đặt mật khẩu riêng cho user delegate bằng GUI Reset Password, không gửi mật khẩu vào chat/API. Mở PowerShell trong Desktop bằng Run as different user để thao tác ADUC/Reset Password cho learner. PowerShell web chạy SYSTEM không phải identity delegate. Nếu thiếu audit thành công 4724, cần cấu hình audit đúng phạm vi bởi quản trị và kiểm lại; không tự giả event.',[
 T('Tạo hai user thử và nhóm helpdesk','Password tạo ngẫu nhiên để không rò rỉ; GUI dùng để đặt secret riêng khi cần đăng nhập thử.',
 "Initialize-SrvContext|Out-Null\n$u=New-SrvUser 'learner';$d=New-SrvUser 'delegate';$g=New-SrvGroup 'Global';Add-ADGroupMember $g -Members $d\n@($u,$d)|Select-Object SamAccountName,Enabled,SID",
 "$m=Get-SrvContext;$ok=$true;foreach($s in @('learner','delegate')){$u=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+$s);$ok=$ok -and $u.Enabled -and $u.DistinguishedName.EndsWith(',OU=Users,'+$m.RootDN) -and (Test-SrvOwned 'AD' $u.ObjectGUID.ToString())};$g=Get-ADGroup -Identity ('lx'+$m.Run.Substring(0,8)+'Global');$d=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'delegate');$ok -and @(Get-ADGroupMember $g|Where-Object SID -eq $d.SID).Count -eq 1",
 'User đúng OU, Enabled, GUID sở hữu; delegate thuộc nhóm helpdesk.','Vì sao disable khác với delete khi cần audit/bàn giao tài khoản?'),
 T('Delegate riêng quyền Reset Password','Resolve GUID extended right và class user từ schema thay vì đoán. Chỉ tác động ACL của OU Users thuộc bài.',
 "$m=Get-SrvContext;$g=New-SrvGroup 'Global';$dn='OU=Users,'+$m.RootDN\n$acl=Get-Acl ('AD:\\'+$dn);$right=Get-SrvResetRight\n$user=Get-ADObject -Identity ('CN=User,'+(Get-ADRootDSE).schemaNamingContext) -Properties schemaIDGUID\n$rule=[DirectoryServices.ActiveDirectoryAccessRule]::new($g.SID,[DirectoryServices.ActiveDirectoryRights]::ExtendedRight,[Security.AccessControl.AccessControlType]::Allow,$right,[DirectoryServices.ActiveDirectorySecurityInheritance]::Descendents,[guid]::new([byte[]]$user.schemaIDGUID))\n$acl.AddAccessRule($rule);Set-Acl ('AD:\\'+$dn) $acl",
 'Test-SrvDelegation',
 'Một ACE Allow ExtendedRight đúng Reset Password, đúng group SID, kế thừa xuống user; không GenericAll hoặc quyền thừa cho nhóm này.','Vì sao kiểm mỗi IdentityReference không đủ chứng minh delegation đúng?'),
 T('Chứng minh identity ít quyền và offboard user','Trước tiên thực sự reset password learner bằng delegate trong Desktop. Sau đó dùng khối này disable learner. Backend cần Security event4724 AuditSuccess đúng Subject SID, Target SID và thời điểm của run, không tin file mô tả. Không thử reset user thật ngoài OU.',
 "$m=Get-SrvContext;$u=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'learner');if(-not(Test-SrvResetAudit)){throw 'Need successful password reset by delegate identity, Security 4724'}\nDisable-ADAccount -Identity $u;Get-ADUser $u|Select-Object SamAccountName,Enabled",
 "$m=Get-SrvContext;$u=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'learner');(Test-SrvDelegation) -and (Test-SrvResetAudit) -and -not $u.Enabled",
 'Có event OS chứng minh delegate reset user bài và learner đã disable; SYSTEM/admin thực hiện thay không đạt. Đây chưa là kiểm thử mọi quyền hiệu lực ngoài OU.','Vì sao có đúng ACE chưa chứng minh thao tác đã chạy thành công dưới identity delegate?')],['ActiveDirectory'],[MS+'windows-server/identity/ad-ds/manage/delegation-control-wizard',MS+'windows/security/threat-protection/auditing/event-4724'])

gpo_key="HKLM\\Software\\Policies\\LabExTraining"
gpo_probe="$m=Get-SrvContext;$g=Get-GPO -Guid $m.GpoA;$v=Get-GPRegistryValue -Guid $g.Id -Key 'HKLM\\Software\\Policies\\LabExTraining' -ValueName CourseMarker;(Test-SrvOwned 'GPO' $g.Id.ToString()) -and $v.Type -eq 'String' -and $v.Value -eq $m.Run"
L(AD,'gpo-scope','Tạo GPO, marker và phạm vi liên kết',2,
 'GPO gồm phần trong AD và template tại SYSVOL. Có GPO không đồng nghĩa đã liên kết hoặc được áp dụng. Computer configuration gắn máy, User configuration gắn user; không lấy HKCU của SYSTEM để suy ra user Desktop. Bài dùng marker chuỗi vô hại HKLM\\Software\\Policies\\LabExTraining, không tắt firewall, khóa công cụ hay sửa Default Domain Policy. Không link ở domain root.',
 'Win+R → gpmc.msc. Tìm GPO LabEx-<run>-GpoA và OU Workstations trong OU bài. Xem Settings/Scope/Delegation; không chọn Default Domain Policy. Registry marker riêng không phải security policy có tác dụng bảo vệ hệ thống.',[
 T('Tạo GPO riêng có GUID manifest','New-SrvGpo giữ GUID và đăng ký sở hữu, không nhận GPO chỉ trùng tên.',
 "Initialize-SrvContext|Out-Null;New-SrvOU 'Workstations'|Out-Null\nNew-SrvGpo 'GpoA'|Select-Object DisplayName,Id,GpoStatus",
 "$m=Get-SrvContext;$g=Get-GPO -Guid $m.GpoA;(Test-SrvOwned 'GPO' $g.Id.ToString()) -and $g.DisplayName -eq ('LabEx-'+$m.Run+'-GpoA')",
 'GPO đúng GUID và tên namespace bài, không dựa vào display name đơn thuần.','GPO chưa liên kết có tự áp dụng cho client không?'),
 T('Cấu hình Computer registry policy marker','Đặt policy trong GPO; không viết registry client trực tiếp để giả kết quả áp dụng.',
 "$m=Get-SrvContext;Set-GPRegistryValue -Guid $m.GpoA -Key 'HKLM\\Software\\Policies\\LabExTraining' -ValueName CourseMarker -Type String -Value $m.Run|Out-Null",
 gpo_probe,
 'Registry policy thật trong GPO có Type String/Value runId. Chưa xác nhận máy trạm đã nhận.','Computer marker khác user policy ở identity và thời điểm áp dụng thế nào?'),
 T('Link đúng OU, enabled, không Enforced','Liên kết chỉ OU Workstations riêng, không đổi GPO của các khóa khác.',
 "$m=Get-SrvContext;$target='OU=Workstations,'+$m.RootDN\nif(-not @((Get-GPInheritance -Target $target).GpoLinks|Where-Object GpoId -eq $m.GpoA).Count){New-GPLink -Guid $m.GpoA -Target $target -LinkEnabled Yes -Enforced No|Out-Null}",
 "$m=Get-SrvContext;$links=@((Get-GPInheritance -Target ('OU=Workstations,'+$m.RootDN)).GpoLinks|Where-Object GpoId -eq $m.GpoA);$links.Count -eq 1 -and $links[0].Enabled -and -not $links[0].Enforced -and (Test-SrvOwned 'GPO' $m.GpoA)",
 'Link đúng GUID/OU, Enabled=true, Enforced=false.','Vì sao không dùng Enforced để xử lý mọi vấn đề policy?')],['ActiveDirectory','GroupPolicy'],[MS+'windows-server/identity/ad-ds/manage/group-policy/group-policy-overview',MS+'powershell/module/grouppolicy/set-gpregistryvalue'])

L(AD,'policy-diagnostics','Chẩn đoán GPO bằng phạm vi và RSoP',2,
 'GPO có thể không áp dụng vì sai OU, security filtering, phần Computer/User disabled, chưa refresh hoặc lỗi SYSVOL. Link order không thay thế kiểm RSoP/effective state. Bài này chỉ dùng marker riêng. Nếu client chưa join, làm bài Domain Join trước rồi quay lại; không chạy gpresult trên DC để giả máy trạm.',
 'Trên server xem GPMC Scope/Inheritance; trên CLIENT01 domain joined chạy gpresult /scope computer /r hoặc tạo HTML để đọc. Máy phải ở OU Workstations của chính bài này sau khi đã ghi baseline vị trí cũ; không move DC hoặc computer của người khác.',[
 T('Chuẩn bị policy marker và link riêng','Chuẩn bị bên server để có đối tượng chính xác cần chẩn đoán.',
 "Initialize-SrvContext|Out-Null;New-SrvOU 'Workstations'|Out-Null;$g=New-SrvGpo 'GpoA';$m=Get-SrvContext\nSet-GPRegistryValue -Guid $g.Id -Key 'HKLM\\Software\\Policies\\LabExTraining' -ValueName CourseMarker -Type String -Value $m.Run|Out-Null\nif(-not @((Get-GPInheritance ('OU=Workstations,'+$m.RootDN)).GpoLinks|Where-Object GpoId -eq $g.Id).Count){New-GPLink -Guid $g.Id -Target ('OU=Workstations,'+$m.RootDN) -LinkEnabled Yes|Out-Null}",
 gpo_probe+" -and @((Get-GPInheritance -Target ('OU=Workstations,'+$m.RootDN)).GpoLinks|Where-Object {$_.GpoId -eq $m.GpoA -and $_.Enabled}).Count -eq 1",
 'GPO marker đúng giá trị, GUID được sở hữu.','Bạn cần kiểm thêm link hay RSoP trước khi kết luận policy đã áp dụng?'),
 T('Đối chiếu effective policy trên CLIENT01','Dùng GUI ADUC chuyển riêng computer CLIENT01 vào OU Workstations bài sau khi ghi vị trí cũ để restore. Trên CLIENT01 chạy gpupdate /target:computer /force trong Desktop elevated; không chỉnh registry tay.',
 "$m=Get-SrvContext;Write-Output ('Expected OU: OU=Workstations,'+$m.RootDN);Write-Output ('Expected marker: '+$m.Run)\nWrite-Output 'On CLIENT01 Desktop elevated: gpupdate /target:computer /force; gpresult /scope computer /r'",
 "$m=Get-SrvContext;$c=Get-ADComputer -Identity CLIENT01;$c.DistinguishedName.EndsWith(',OU=Workstations,'+$m.RootDN)",
 'Computer đúng OU và client có marker hiệu lực, RSoP có đúng GUID GPO. Chỉ marker registry không đủ.',
 'Nếu marker tồn tại nhưng RSoP không có GPO đó thì cần nghi ngờ điều gì?',client=r"(Get-CimInstance Win32_ComputerSystem).Domain -eq $expectedDomain -and (Get-ItemProperty -LiteralPath 'HKLM:\Software\Policies\LabExTraining').CourseMarker -eq $expectedRun -and @(Get-CimInstance -Namespace root\RSOP\Computer -ClassName RSOP_GPO|Where-Object {$_.guidName -match [regex]::Escape($expectedGpo)}).Count -gt 0",blocked=DOMAIN_PATH),
 T('Chẩn đoán phần policy disabled và khôi phục','Trong GPMC đổi riêng GPO bài Computer settings disabled, refresh client và xem RSoP; sau đó bật lại AllSettingsEnabled, refresh và xác minh. Không tạo lỗi bằng GPO domain root. Backend xác nhận trạng thái cuối; ảnh/log trước sửa là bài tự đánh giá, không tự tuyên bố đã kiểm incident lifecycle.',
 "$m=Get-SrvContext;$g=Get-GPO -Guid $m.GpoA;$g.GpoStatus='AllSettingsEnabled';Write-Output 'Refresh computer policy on CLIENT01; inspect RSoP, then verify.'",
 "$m=Get-SrvContext;(Get-GPO -Guid $m.GpoA).GpoStatus -eq 'AllSettingsEnabled'",
 'Cấu hình cuối enabled và RSoP/effective marker đúng trên client. Không chấm gpupdate exit0 một mình.',
 'Unlink GPO có luôn xóa mọi thiết lập registry đã từng có không?',client=r"(Get-ItemProperty -LiteralPath 'HKLM:\Software\Policies\LabExTraining').CourseMarker -eq $expectedRun -and @(Get-CimInstance -Namespace root\RSOP\Computer -ClassName RSOP_GPO|Where-Object {$_.guidName -match [regex]::Escape($expectedGpo)}).Count -gt 0",blocked=DOMAIN_PATH)],['ActiveDirectory','GroupPolicy'],[MS+'windows-server/administration/windows-commands/gpresult',MS+'powershell/module/grouppolicy/get-gpinheritance'])

L(AD,'domain-join','Domain join, DNS và kiểm tra secure channel',3,
 'Domain join cần DNS domain, tìm DC, đồng bộ thời gian và quyền tạo/reuse computer account; không chỉ tạo object trong AD. Azure Agent SYSTEM trên máy chưa join không tự có quyền Domain Admin. Không truyền password vào web command/history. Join có thể cần reboot và đường đăng nhập local dự phòng. Test-ComputerSecureChannel áp dụng member computer, không dùng cho DC. Không unjoin một client đang join đúng chỉ để diễn bài.',
 'Server ADUC xác định domain/DC thật. Mở tab khóa Windows11 nền tảng để dùng Desktop CLIENT01; Settings → System → About → Domain or workgroup hoặc sysdm.cpl. Join bằng GUI hoặc Add-Computer -Credential (Get-Credential) trong PowerShell Desktop, không PowerShell web noninteractive. Ghi baseline DNS/OU/domain, giữ local admin/Azure Agent; không tự đổi NIC IP Azure.',[
 T('Khảo sát DC/domain và đường riêng','Server cung cấp domain thật. Cần peering/private path và DNS client có thể phân giải SRV, không chỉ ping.',
 "Initialize-SrvContext|Out-Null;$m=Get-SrvContext;Get-ADDomainController -Discover|Select-Object HostName,IPv4Address,Domain\nWrite-Output $m.DomainDNS",
 "$m=Get-SrvContext;$dc=Get-ADDomainController -Discover;$dc.Domain -eq $m.DomainDNS",
 'DC discovery server đúng domain; từ client có SRV domain thực, không suy ra chỉ từ Get-ADDomain trên server.',
 'Vì sao DNS public có Internet tốt vẫn có thể làm domain join thất bại?',client=r"@(Resolve-DnsName -Name ('_ldap._tcp.dc._msdcs.'+$expectedDomain) -Type SRV -DnsOnly -NoHostsFile).Count -gt 0",blocked=DOMAIN_PATH),
 T('Join bằng identity được phép và kiểm hai phía','Nếu đã join đúng domain thì xác minh, không unjoin/rejoin. Credential nhập trong Windows Desktop; backend không nhận password từ trình duyệt.',
 "$m=Get-SrvContext;Write-Output ('Join domain in CLIENT01 Desktop: '+$m.DomainDNS);Write-Output 'Use sysdm.cpl / GUI credential prompt. Reboot CLIENT01 only when ready; retain local recovery login.'",
 "$m=Get-SrvContext;$c=Get-ADComputer CLIENT01;$c.Enabled -and $c.DNSHostName.EndsWith('.'+$m.DomainDNS)",
 'Client PartOfDomain/domain đúng và object computer server khớp; object AD tồn tại một mình không đạt.',
 'Cần giữ đường truy cập nào trước khi reboot hoặc đổi DNS client?',client=r"$c=Get-CimInstance Win32_ComputerSystem;$c.PartOfDomain -and $c.Domain -eq $expectedDomain -and $env:COMPUTERNAME -eq 'CLIENT01'",blocked=DOMAIN_PATH),
 T('Kiểm tra secure channel sau reboot','Chạy Test-ComputerSecureChannel trên member CLIENT01; chỉ kiểm tra, không dùng -Repair hay reset machine password để tạo bài.',
 "$m=Get-SrvContext;Write-Output 'CLIENT01 Desktop elevated: Test-ComputerSecureChannel -Verbose; nltest /dsgetdc:<domain shown in task 1>'",
 "$m=Get-SrvContext;(Get-ADComputer CLIENT01).Enabled",
 'Secure channel của CLIENT01 trả True và membership domain đúng; không thực thi kiểm này trên DC thay client.',
 'Nếu channel tốt mà user không đăng nhập được, cần kiểm credentials, user state hay logon rights thế nào?',client=r"(Get-CimInstance Win32_ComputerSystem).PartOfDomain -and (Get-CimInstance Win32_ComputerSystem).Domain -eq $expectedDomain -and (Test-ComputerSecureChannel)",blocked=DOMAIN_PATH)],['ActiveDirectory'],[MS+'windows-server/identity/ad-ds/manage/join-computer-to-domain',MS+'powershell/module/microsoft.powershell.management/test-computersecurechannel'])

L(AD,'auth-runbook','Điều tra đăng nhập domain và biên bản xử lý',3,
 'Phân biệt lỗi tìm DC/DNS/time, secure channel, sai password, account disabled và quyền đăng nhập. Enabled không chứng minh logon thành công. Bài dùng đúng user lab và event Security trên máy thực hiện logon; không dùng tài khoản quản trị hoặc phá machine trust. Trạng thái trước/sau phải gắn SID/time/run, không tin ticket tự khai.',
 'Tạo user thử bằng task 1, đặt password riêng qua ADUC để dùng Desktop CLIENT01. Trong Event Viewer → Windows Logs → Security lọc 4624/4625 và đúng account. Không đưa password vào ảnh hoặc ticket. Nếu audit không có dữ kiện cần thiết thì báo thiếu evidence, không sinh log giả.',[
 T('Chuẩn bị user dùng một lần và đường domain khỏe','Không dùng adminlab hay tài khoản đang học để diễn lỗi.',
 "Initialize-SrvContext|Out-Null;New-SrvUser 'learner'|Select-Object SamAccountName,SID,Enabled;Write-Output 'Set a private test password using ADUC GUI, not web history.'",
 "$m=Get-SrvContext;$u=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'learner');$u.Enabled -and (Test-SrvOwned 'AD' $u.ObjectGUID.ToString())",
 'User lab đúng GUID và Enabled; CLIENT01 có domain/secure channel đúng.',
 'Vì sao thử bằng Domain Admin không phản ánh trải nghiệm người dùng thông thường?',client=r"(Get-CimInstance Win32_ComputerSystem).Domain -eq $expectedDomain -and (Test-ComputerSecureChannel)",blocked=DOMAIN_PATH),
 T('Tái hiện account disabled rồi sửa đúng user','Qua ADUC disable user bài, thực sự thử đăng nhập bằng user đó trên CLIENT01 để có event4625; rồi enable và đăng nhập lại. Không sửa policy/domain trust. Backend cần event thất bại và thành công đúng user/thời gian, không chỉ Enabled.',
 "$m=Get-SrvContext;$u=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'learner');Enable-ADAccount $u;Write-Output 'Retry real logon on CLIENT01; inspect 4625/4624 for the test user.'",
 "$m=Get-SrvContext;(Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'learner')).Enabled",
 'Có failed logon account-disabled và successful logon đúng user thử, sau mốc run; việc enable user một mình không đủ.',
 'Status/SubStatus khác nhau giúp phân biệt password sai và account disabled ra sao?',client=r"Test-EnterpriseLogonEvidence",blocked=DOMAIN_PATH),
 T('Báo cáo sau sửa, phân biệt điều chưa đo','Ghi ticket trong workspace riêng; không ghi password. Backend vẫn đòi evidence logon thật, ticket không thay bằng chứng OS.',
 "$m=Get-SrvContext;$u=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'learner')\nWrite-SrvObservation 'step3.json' @{UserSid=$u.SID.Value;Diagnosis='AccountDisabled';Change='EnableOnlyLabUser';Rollback='RestoreLabUserBaseline';NotTested='AllDomainUsers'}",
 "$m=Get-SrvContext;$d=Read-SrvObservation 'step3.json';$u=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'learner');$u.Enabled -and $d.UserSid -eq $u.SID.Value -and $d.Diagnosis -eq 'AccountDisabled' -and $d.Change -eq 'EnableOnlyLabUser' -and $d.Rollback -eq 'RestoreLabUserBaseline' -and $d.NotTested -eq 'AllDomainUsers'",
 'Ticket đúng run/user/phạm vi và vẫn có OS evidence đăng nhập; không kết luận đã kiểm mọi user.',
 'Khi nào cần chuyển ticket sang nhóm AD thay vì tiếp tục reset password?',client=r"Test-EnterpriseLogonEvidence",blocked=DOMAIN_PATH)],['ActiveDirectory'],[MS+'windows/security/threat-protection/auditing/event-4624',MS+'windows/security/threat-protection/auditing/event-4625'])

L(DNS,'zones-records','Forward zone, A/CNAME và reverse PTR',1,
 'DNS authoritative quản lý RRset trong zone. A ánh xạ IPv4, CNAME trỏ tên chuẩn, PTR phục vụ phân giải ngược. Tạo A không tự đảm bảo có PTR. Bài dùng primary file-backed zone với DynamicUpdate=None để không sửa AD-integrated zone domain. IP 192.0.2.x là dữ liệu tài liệu để query DNS, không gán NIC và không chứng minh kết nối ứng dụng. Zone riêng có runId, không sửa _msdcs hoặc forwarder chung.',
 'Server Manager → Tools → DNS (dnsmgmt.msc). Xem zone lx-<run>.test và zone reverse riêng; query chỉ định server 127.0.0.1 từ chính server. Không suy ra resolver CLIENT01 đang dùng server này. Nếu reverse zone mẫu đã tồn tại không thuộc bài thì không chiếm/xóa.',[
 T('Tạo primary zone riêng, cấm dynamic update','Manifest kiểm ZoneFile riêng để không nhận một zone có tên giống nhưng thuộc người khác.',
 "Initialize-SrvContext|Out-Null;New-SrvZone|Select-Object ZoneName,ZoneType,IsDsIntegrated,DynamicUpdate",
 "$m=Get-SrvContext;$z=Get-DnsServerZone $m.Zone;(Test-SrvOwned 'ZONE' $m.Zone) -and $z.ZoneType -eq 'Primary' -and -not $z.IsDsIntegrated -and $z.DynamicUpdate -eq 'None' -and $z.ZoneFile -eq $m.ZoneFile",
 'Zone primary/file-backed đúng manifest, DynamicUpdate=None; không đụng namespace domain.','AD-integrated zone khác file-backed primary ở storage và replication thế nào?'),
 T('Tạo A và CNAME, kiểm query thật','Tạo bản ghi chỉ khi chưa có; nếu RRset đã có nhưng sai thì xem và sửa có chủ đích, không xóa record toàn zone.',
 "$m=Get-SrvContext\nif(-not(Get-DnsServerResourceRecord -ZoneName $m.Zone -Name app -RRType A -ErrorAction SilentlyContinue)){Add-DnsServerResourceRecordA -ZoneName $m.Zone -Name app -IPv4Address '192.0.2.10' -TimeToLive (New-TimeSpan -Minutes 5)}\nif(-not(Get-DnsServerResourceRecord -ZoneName $m.Zone -Name portal -RRType CNAME -ErrorAction SilentlyContinue)){Add-DnsServerResourceRecordCName -ZoneName $m.Zone -Name portal -HostNameAlias ('app.'+$m.Zone) -TimeToLive (New-TimeSpan -Minutes 5)}\nResolve-DnsName ('portal.'+$m.Zone) -Server 127.0.0.1 -Type CNAME -DnsOnly -NoHostsFile",
 "$m=Get-SrvContext;(Test-SrvDnsRecord 'app' 'A' '192.0.2.10') -and (Test-SrvDnsRecord 'portal' 'CNAME' ('app.'+$m.Zone)) -and (Get-DnsServerResourceRecord -ZoneName $m.Zone -Name app -RRType A).TimeToLive.TotalSeconds -eq 300",
 'Đúng RRset/TTL và query DNS server thật trả A/CNAME mong đợi; hosts/file JSON giả không đủ.','CNAME có nên cùng owner name với một A record khác không?'),
 T('Tạo reverse zone và PTR riêng','Dùng reverse zone mẫu 2.0.192.in-addr.arpa chỉ nếu chưa có; ownership gồm ZoneFile riêng. Không đụng reverse zone hạ tầng.',
 "$m=Get-SrvContext;$zone='2.0.192.in-addr.arpa';$file='reverse-'+$m.ZoneFile\nif(-not(Get-DnsServerZone $zone -ErrorAction SilentlyContinue)){Add-DnsServerPrimaryZone -NetworkId '192.0.2.0/24' -ZoneFile $file -DynamicUpdate None;Register-SrvObject 'ZONE' $zone}\nif(-not(Test-SrvOwned 'ZONE' $zone)){throw 'Reverse zone already belongs to another owner'}\nif(-not(Get-DnsServerResourceRecord -ZoneName $zone -Name 10 -RRType PTR -ErrorAction SilentlyContinue)){Add-DnsServerResourceRecordPtr -ZoneName $zone -Name 10 -PtrDomainName ('app.'+$m.Zone)}\nResolve-DnsName '10.2.0.192.in-addr.arpa' -Server 127.0.0.1 -Type PTR -DnsOnly -NoHostsFile",
 "$m=Get-SrvContext;$z='2.0.192.in-addr.arpa';$q=@(Resolve-DnsName '10.2.0.192.in-addr.arpa' -Server 127.0.0.1 -Type PTR -DnsOnly -NoHostsFile);(Test-SrvOwned 'ZONE' $z) -and (Get-DnsServerZone $z).ZoneFile -eq ('reverse-'+$m.ZoneFile) -and @($q|Where-Object {$_.Type -eq 'PTR' -and $_.NameHost.TrimEnd('.') -eq ('app.'+$m.Zone)}).Count -eq 1",
 'PTR authoritative đúng FQDN trong reverse zone bài; không chỉ có A record.','PTR đúng có chứng minh dịch vụ ở địa chỉ đó đang chạy không?')],['DnsServer'],[MS+'windows-server/networking/dns/quickstart-install-configure-dns-server',MS+'powershell/module/dnsserver/add-dnsserverresourcerecordptr'])

L(DNS,'resolver-cache','Resolver, cache, TTL và forwarder',1,
 'Query chỉ định server khác resolver mặc định của client. Windows có cache/hosts nên lookup thành công không luôn là một truy vấn tới DNS ngoài máy. TTL là thời gian cache và giảm theo thời gian, không so cứng từng giây. Forwarder cấp server ảnh hưởng nhiều namespace; không đổi DNS/DC sang public DNS để thử. Bài chỉ đọc forwarder chung, không pretend đã triển khai conditional forwarding upstream khi chưa có upstream lab.',
 'DNS Manager → Properties server → Forwarders chỉ xem và Cancel. Trên CLIENT01, sau khi đường private và DNS đúng, query tên riêng của bài; xem Get-DnsClientCache. Không Clear-DnsServerCache toàn server hay đổi NIC của DC. Client thực hành qua tab Windows11 nền tảng.',[
 T('Chuẩn bị tên riêng và so sánh query từ client','Tạo record .10/TTL300 trong zone riêng, rồi lookup từ CLIENT01 tới DNS riêng đã cấu hình.',
 "Initialize-SrvContext|Out-Null;New-SrvZone|Out-Null;$m=Get-SrvContext\nif(-not(Get-DnsServerResourceRecord -ZoneName $m.Zone -Name app -RRType A -ErrorAction SilentlyContinue)){Add-DnsServerResourceRecordA -ZoneName $m.Zone -Name app -IPv4Address '192.0.2.10' -TimeToLive (New-TimeSpan -Minutes 5)}\nWrite-Output ('CLIENT01: Resolve-DnsName app.'+$m.Zone+' -Type A')",
 "Test-SrvDnsRecord 'app' 'A' '192.0.2.10'",
 'Server trả RRset đúng và resolver client thực trả .10 cho tên bài. Không dùng localhost làm bằng chứng.',
 'Tại sao query -Server thành công nhưng app dùng resolver mặc định có thể vẫn lỗi?',client=r"@(Resolve-DnsName -Name ('app.'+$expectedZone) -Type A|Where-Object {$_.Type -eq 'A' -and $_.IPAddress -eq '192.0.2.10'}).Count -eq 1",blocked=DOMAIN_PATH),
 T('Đọc cache đúng tên và khoảng TTL','Trên CLIENT01 chạy [Net.Dns]::GetHostAddresses tên bài rồi Get-DnsClientCache. Nếu entry hết hạn thì thu lại; không tạo file giả làm cache.',
 "$m=Get-SrvContext;Write-Output ('CLIENT01 Desktop: [Net.Dns]::GetHostAddresses(\"app.'+$m.Zone+'\"); Get-DnsClientCache')",
 "Test-SrvDnsRecord 'app' 'A' '192.0.2.10'",
 'Windows cache thật có đúng tên/dữ liệu và TTL trong (0,300]; không so giây cố định.',
 'Sau khi authoritative record đổi, vì sao cache client còn có thể trả địa chỉ cũ?',client=r"@(Get-DnsClientCache|Where-Object {$_.Entry.TrimEnd('.') -eq ('app.'+$expectedZone) -and $_.Data -eq '192.0.2.10' -and $_.TimeToLive -gt 0 -and $_.TimeToLive -le 300}).Count -gt 0",blocked=DOMAIN_PATH),
 T('Khảo sát forwarder, ghi phạm vi kết luận','Đọc cấu hình thật và lưu report có run/time. Đây là kiểm kê forwarder, chưa phải bài tạo upstream mới.',
 "$f=Get-DnsServerForwarder\nWrite-SrvObservation 'step3.json' @{Addresses=@($f.IPAddress|ForEach-Object {$_.IPAddressToString});Scope='ServerForwardersReadOnly';ExternalDnsProven=$false}",
 "$d=Read-SrvObservation 'step3.json';$actual=@((Get-DnsServerForwarder).IPAddress|ForEach-Object {$_.IPAddressToString}|Sort-Object);$saved=@($d.Addresses|Sort-Object);$d.Scope -eq 'ServerForwardersReadOnly' -and $d.ExternalDnsProven -eq $false -and ($actual -join '|') -eq ($saved -join '|')",
 'Danh sách forwarder khớp server; mảng rỗng hợp lệ. Không kết luận Internet DNS tốt chỉ vì có IP forwarder.','Khi nào dùng conditional forwarder thay vì thay global forwarder?')],['DnsServer'],[MS+'powershell/module/dnsclient/resolve-dnsname',MS+'powershell/module/dnsserver/get-dnsserverforwarder'])

L(DNS,'scope-options','DHCP scope inactive, exclusion, reservation và option',2,
 'Scope gồm subnet/range/lease duration; exclusion loại địa chỉ khỏi pool; reservation ràng ClientId với địa chỉ, chưa chứng minh đã cấp lease. Option003 router, 006 DNS, 015 suffix là các thuộc tính khác nhau, có cấp server/scope/reservation. Bài quản trị cấu hình thật nhưng giữ scope Inactive và dùng dải tài liệu 192.0.2.0/24. MAC 02-00-00-12-34-56 là mẫu lập kế hoạch, không giả có client vật lý tương ứng. Không activate hay release NIC Azure quản trị.',
 'Win+R → dhcpmgmt.msc. Nếu DHCP role chưa cài, cần quản trị cài bằng Install-WindowsFeature DHCP -IncludeManagementTools sau khảo sát/baseline; không tự authorization hay thay role AD. Scope bài tên LabEx-<run>, Inactive. Không sửa server-wide options hoặc scope khác.',[
 T('Tạo scope riêng giữ Inactive','Chỉ tạo nếu scope ID chưa tồn tại; scope có sẵn không thuộc run thì từ chối.',
 "Initialize-SrvContext|Out-Null;New-SrvScope|Select-Object ScopeId,StartRange,EndRange,State,LeaseDuration",
 "$m=Get-SrvContext;$s=Get-DhcpServerv4Scope -ScopeId '192.0.2.0';(Test-SrvOwned 'SCOPE' '192.0.2.0') -and $s.Name -eq ('LabEx-'+$m.Run) -and $s.State -eq 'Inactive' -and $s.StartRange.IPAddressToString -eq '192.0.2.20' -and $s.EndRange.IPAddressToString -eq '192.0.2.100' -and $s.SubnetMask.IPAddressToString -eq '255.255.255.0' -and $s.LeaseDuration.TotalHours -eq 8",
 'Range .20–.100, mask /24, lease8h, scope Inactive và thuộc manifest.','Một scope đúng cấu hình nhưng Inactive có cấp lease được chưa?'),
 T('Thêm exclusion và reservation mẫu','Exclusion .20–.24 và reservation .25 không xung đột. MAC mẫu không được ghi thành lease/client đã hoạt động.',
 "$s=New-SrvScope\nif(-not(Get-DhcpServerv4ExclusionRange -ScopeId $s.ScopeId|Where-Object {$_.StartRange.IPAddressToString -eq '192.0.2.20' -and $_.EndRange.IPAddressToString -eq '192.0.2.24'})){Add-DhcpServerv4ExclusionRange -ScopeId $s.ScopeId -StartRange '192.0.2.20' -EndRange '192.0.2.24'}\nif(-not(Get-DhcpServerv4Reservation -ScopeId $s.ScopeId|Where-Object IPAddress -eq '192.0.2.25')){Add-DhcpServerv4Reservation -ScopeId $s.ScopeId -IPAddress '192.0.2.25' -ClientId '02-00-00-12-34-56' -Name ('LabEx-'+(Get-SrvContext).Run)}",
 "$m=Get-SrvContext;$s=Get-DhcpServerv4Scope '192.0.2.0';$e=@(Get-DhcpServerv4ExclusionRange -ScopeId $s.ScopeId|Where-Object {$_.StartRange.IPAddressToString -eq '192.0.2.20' -and $_.EndRange.IPAddressToString -eq '192.0.2.24'});$r=@(Get-DhcpServerv4Reservation -ScopeId $s.ScopeId|Where-Object {$_.IPAddress.IPAddressToString -eq '192.0.2.25' -and ($_.ClientId -replace '[-:]','').ToLower() -eq '020000123456' -and $_.Name -eq ('LabEx-'+$m.Run)});(Test-SrvOwned 'SCOPE' '192.0.2.0') -and $s.State -eq 'Inactive' -and $e.Count -eq 1 -and $r.Count -eq 1",
 'Exclusion/reservation đúng scope, IP/ClientId mẫu chính xác; không gọi là đã nhận lease.','Reservation khác exclusion ở đối tượng và cơ chế cấp phát như thế nào?'),
 T('Đặt scope option, không chạm global','Router .1 và DNS .10 là dữ liệu thiết kế trong subnet tài liệu, không gán cho NIC thật.',
 "$s=New-SrvScope;Set-DhcpServerv4OptionValue -ScopeId $s.ScopeId -Router '192.0.2.1' -DnsServer '192.0.2.10' -DnsDomain 'training.test'",
 "$m=Get-SrvContext;$s=Get-DhcpServerv4Scope '192.0.2.0';$r=Get-DhcpServerv4OptionValue -ScopeId $s.ScopeId -OptionId 3;$d=Get-DhcpServerv4OptionValue -ScopeId $s.ScopeId -OptionId 6;$n=Get-DhcpServerv4OptionValue -ScopeId $s.ScopeId -OptionId 15;(Test-SrvOwned 'SCOPE' '192.0.2.0') -and $s.State -eq 'Inactive' -and @($r.Value).Count -eq 1 -and $r.Value[0] -eq '192.0.2.1' -and @($d.Value).Count -eq 1 -and $d.Value[0] -eq '192.0.2.10' -and $n.Value[0] -eq 'training.test'",
 'Option003/006/015 ở scope đúng, vẫn Inactive. Không kết luận client thực nhận các option.','Cùng một option ở cấp server và scope thì cần xem cấp nào có hiệu lực cho client?')],['DhcpServer'],[MS+'windows-server/networking/technologies/dhcp/quickstart-install-configure-dhcp-server',MS+'powershell/module/dhcpserver/set-dhcpserverv4optionvalue'])

L(DNS,'lease-audit','DHCP authorization, lease thật và nhật ký',2,
 'Trong AD, authorization DHCP là kiểm soát riêng; service Running, server authorized và scope Active là ba điều khác nhau. Lease thật phải khớp clientId, server cấp, IP/options client và thời điểm giao dịch. Reservation hoặc Add-DhcpServerv4Lease không thay bằng chứng DORA. Azure VNet không truyền broadcast như LAN, nên phần cấp lease cần mạng cô lập/relay và provider phù hợp; hiện chưa có, các task đó bị khóa trung thực.',
 'DHCP console xem server/IPv4/Address Leases, chỉ quan sát authorization và binding trên NIC hiện tại. Không deauthorize server có sẵn, không activate scope tài liệu và không release/renew NIC Azure. Các bước client DHCP chỉ thực hiện ở mạng lab cô lập đã xác minh.',[
 T('Đọc service, binding và authorization thực','Bài chỉ khảo sát, không tự authorize/deauthorize hoặc đổi binding chung.',
 "Initialize-SrvContext|Out-Null\n$a=@(Get-DhcpServerInDC|ForEach-Object {$_.DnsName+'|'+$_.IPAddress.IPAddressToString}|Sort-Object)\n$b=@(Get-DhcpServerv4Binding|ForEach-Object {$_.InterfaceAlias+'|'+$_.IPAddress.IPAddressToString+'|'+$_.BindingState}|Sort-Object)\nWrite-SrvObservation 'step1.json' @{Service=(Get-Service DHCPServer).Status.ToString();Authorization=$a;Bindings=$b}",
 "$d=Read-SrvObservation 'step1.json';$a=@(Get-DhcpServerInDC|ForEach-Object {$_.DnsName+'|'+$_.IPAddress.IPAddressToString}|Sort-Object);$b=@(Get-DhcpServerv4Binding|ForEach-Object {$_.InterfaceAlias+'|'+$_.IPAddress.IPAddressToString+'|'+$_.BindingState}|Sort-Object);$d.Service -eq (Get-Service DHCPServer).Status.ToString() -and (@($d.Authorization|Sort-Object) -join ';') -eq ($a -join ';') -and (@($d.Bindings|Sort-Object) -join ';') -eq ($b -join ';')",
 'Report đúng run/time và khớp service/authorization/binding thực; chưa chứng minh lease.','Vì sao service Running chưa đủ để kết luận DHCP đang cấp địa chỉ?'),
 T('Cấp lease trong mạng cô lập và đối chiếu hai phía','Cần provider cô lập. Khởi tạo scope theo subnet thật, thiết bị thật; chỉ activate sau baseline. Không dùng CLIENT01 Azure như một DHCP client LAN.',
 "Write-Output 'Blocked: configure isolated DHCP provider and real client before activation. Do not activate documentation scopes or synthesize leases.'",
 "$m=Get-SrvContext;$leases=@(Get-DhcpServerv4Lease -ScopeId '198.51.100.0'|Where-Object AddressState -eq 'Active');$leases.Count -gt 0",
 'Cần lease thật đối chiếu IP/options/ClientId trên client và server. Task chưa được bật vì chưa có provider cô lập.',
 'Vì sao một dòng trong Address Leases chưa đủ chứng minh client đã nhận IP?',blocked=DHCP_PATH),
 T('Phân tích renew và audit DORA','Phải có trace/journal giao dịch từ client thật cùng run/time, không tạo file audit mẫu.',
 "Write-Output 'Blocked: capture real isolated-client DHCP transaction and renewal; never release Azure management NIC.'",
 "$m=Get-SrvContext;$leases=@(Get-DhcpServerv4Lease -ScopeId '198.51.100.0'|Where-Object {$_.AddressState -eq 'Active' -and $_.LeaseExpiryTime -gt (Get-Date)});$leases.Count -gt 0",
 'Cần packet/audit evidence thật và renew thành công trong mạng cô lập; hiện chặn thực thi/chấm.',
 'T1/T2 renewal khác giao dịch Discover ban đầu thế nào?',blocked=DHCP_PATH)],['DhcpServer'],[MS+'azure/virtual-network/how-to-dhcp-azure',MS+'powershell/module/dhcpserver/get-dhcpserverv4lease'])

L(DNS,'dns-incident','Sửa record DNS sai bằng bằng chứng authoritative',3,
 'NXDOMAIN khác bản ghi có giá trị sai, khác timeout. Bài tạo lỗi chỉ ở record app trong zone riêng, không dừng DNS service/DC hoặc xóa SRV. Trước sửa phải đo query sai; sau sửa đo RRset và query đúng. IP tài liệu chỉ để học DNS, không kết luận dịch vụ ứng dụng tại IP đó hoạt động.',
 'DNS Manager mở zone lx-<run>.test của bài; task1 tạo app A=.99 sai theo baseline .10. Dùng query -Server127.0.0.1 -DnsOnly -NoHostsFile để đo. Không flush cache server toàn hệ thống hoặc chỉnh hosts để che record sai.',[
 T('Tái hiện record sai trong zone của bài','Tạo namespace riêng; task1 đặt lại riêng RRset app A, không chạm record khác. Sau sửa task2, task1 tái chấm sẽ không còn đúng trạng thái lỗi.',
 "Initialize-SrvContext|Out-Null;New-SrvZone|Out-Null;$m=Get-SrvContext\n$r=@(Get-DnsServerResourceRecord -ZoneName $m.Zone -Name app -RRType A -ErrorAction SilentlyContinue);foreach($x in $r){Remove-DnsServerResourceRecord -ZoneName $m.Zone -InputObject $x -Force}\nAdd-DnsServerResourceRecordA -ZoneName $m.Zone -Name app -IPv4Address '192.0.2.99' -TimeToLive (New-TimeSpan -Minutes 5)\n$q=Resolve-DnsName ('app.'+$m.Zone) -Server 127.0.0.1 -Type A -DnsOnly -NoHostsFile\nWrite-SrvObservation 'step1.json' @{Before='192.0.2.99';Expected='192.0.2.10';Name=('app.'+$m.Zone)}",
 "$m=Get-SrvContext;$d=Read-SrvObservation 'step1.json';(Test-SrvDnsRecord 'app' 'A' '192.0.2.99') -and $d.Before -eq '192.0.2.99' -and $d.Expected -eq '192.0.2.10' -and $d.Name -eq ('app.'+$m.Zone)",
 'Có query record sai thực .99, context report đúng; chưa gọi là NXDOMAIN.','Tại sao nhận A=.99 là lỗi khác với tên không tồn tại?'),
 T('Sửa đúng RRset và xác minh lại server','Đọc báo cáo trước sửa; chỉ sửa đúng A record app trong zone sở hữu.',
 "$m=Get-SrvContext;$before=Read-SrvObservation 'step1.json';if($before.Before -ne '192.0.2.99'){throw 'Run step 1 first'}\n$old=Get-DnsServerResourceRecord -ZoneName $m.Zone -Name app -RRType A;$new=$old.Clone();$new.RecordData.IPv4Address=[Net.IPAddress]::Parse('192.0.2.10');Set-DnsServerResourceRecord -ZoneName $m.Zone -OldInputObject $old -NewInputObject $new",
 "$m=Get-SrvContext;$d=Read-SrvObservation 'step1.json';$d.Before -eq '192.0.2.99' -and $d.Expected -eq '192.0.2.10' -and (Test-SrvDnsRecord 'app' 'A' '192.0.2.10')",
 'RRset và authoritative query hiện .10, còn report trước sửa đúng run.','Nếu chỉ sửa hosts client thì authoritative record đã đúng chưa?'),
 T('Xác minh từ client và ghi giới hạn ticket','Client phải dùng DNS thật có thể trả zone lab; không xem kết quả server thay cho client.',
 "Write-SrvObservation 'step3.json' @{Diagnosis='WrongAuthoritativeA';Change='OnlyOwnedAppRecord';NotTested='ApplicationConnectivity'}",
 "$d=Read-SrvObservation 'step3.json';(Test-SrvDnsRecord 'app' 'A' '192.0.2.10') -and $d.Diagnosis -eq 'WrongAuthoritativeA' -and $d.Change -eq 'OnlyOwnedAppRecord' -and $d.NotTested -eq 'ApplicationConnectivity'",
 'Client resolver trả .10 và ticket không khẳng định sửa kết nối ứng dụng khi chưa thử.',
 'Bạn phân biệt authoritative record và cache client trong biên bản ra sao?',client=r"@(Resolve-DnsName -Name ('app.'+$expectedZone) -Type A|Where-Object {$_.Type -eq 'A' -and $_.IPAddress -eq '192.0.2.10'}).Count -eq 1",blocked=DOMAIN_PATH)],['DnsServer'],[MS+'powershell/module/dnsserver/set-dnsserverresourcerecord',MS+'powershell/module/dnsclient/resolve-dnsname'])

L(DNS,'dhcp-incident','Điều tra lease và option DHCP sai',3,
 'Có IP nhưng option DNS sai khác hết pool hoặc không nhận lease. Sửa option ở server không tự làm client đang giữ lease cập nhật ngay. Bài cần scope và NIC client cô lập đã có baseline; không gây lỗi trên DHCP Azure hoặc scope dùng chung. Hiện provider này chưa có, các task được trình bày để học nhưng không giả chấm đạt.',
 'Chỉ trên mạng DHCP lab thật: ghi lease/clientId/options trước sửa, sửa scope option006, renew đúng NIC thử, so lại option và query DNS. Không dùng lệnh release/renew trên NIC quản trị Azure, không thêm lease bằng cmdlet để làm bài đạt.',[
 T('Baseline và tái hiện sai option ở scope cô lập','Phải có giao dịch/client thực và ownership scope; chưa có provider thì không inject.',
 "Write-Output 'Blocked: real isolated DHCP client, baseline, ownership and recovery proof required before fault injection.'",
 "$m=Get-SrvContext;$s=Get-DhcpServerv4Scope '203.0.113.0';(Test-SrvOwned 'SCOPE' '203.0.113.0') -and $s.State -eq 'Active'",
 'Chưa hỗ trợ runtime: cần client thực nhận option sai và evidence trước sửa.',
 'Nếu chỉ server option sai nhưng client chưa renew, bạn đã tái hiện triệu chứng client chưa?',blocked=DHCP_PATH),
 T('Sửa option, renew NIC cô lập và kiểm chức năng','Backend tương lai phải đối chiếu giá trị thực nhận ở client, không chỉ kiểm option server.',
 "Write-Output 'Blocked: do not renew Azure NIC. Restore owned-scope option only after isolated provider is ready.'",
 "$m=Get-SrvContext;$s=Get-DhcpServerv4Scope '203.0.113.0';(Test-SrvOwned 'SCOPE' '203.0.113.0') -and @(Get-DhcpServerv4Lease -ScopeId $s.ScopeId|Where-Object AddressState -eq 'Active').Count -gt 0",
 'Cần lease/options client và DNS query sau sửa; hiện task bị khóa, chưa có grader đủ hai phía.',
 'Sửa scope option xong mà client vẫn lỗi thì cần đọc lease/options hiện tại thế nào?',blocked=DHCP_PATH),
 T('Báo cáo, reset và kiểm reset trên mạng cô lập','Không cho phép chỉ tạo ticket chữ “done” làm bằng chứng đã hoàn nguyên DHCP.',
 "Write-Output 'Blocked: verify DHCP baseline and actual client recovery before completing the incident.'",
 "$m=Get-SrvContext;$s=Get-DhcpServerv4Scope '203.0.113.0';(Test-SrvOwned 'SCOPE' '203.0.113.0') -and $s.State -eq 'Inactive'",
 'Chưa có runtime/provider nên không được đánh dấu hoàn thành; cần kiểm reset thật ở cả scope/client.',
 'Cần bàn giao những gì để người khác phân biệt lỗi pool, option và DNS?',blocked=DHCP_PATH)],['DhcpServer'],[MS+'azure/virtual-network/how-to-dhcp-azure',MS+'windows-server/networking/technologies/dhcp/quickstart-install-configure-dhcp-server'])

rules={};orders={AD:0,DNS:0}
for l in lessons:
    lid=l['id'];orders[l['course']]+=1;sections=[];steps=[]
    intro=f"## {l['title']}\n\n### Bản chất và mục tiêu\n{l['theory']}\n\n### GUI và quan sát\n{l['gui']}\n\n### Môi trường\nTarget chính Windows Server. Lệnh web chạy SYSTEM, mỗi request là process mới; chạy nguyên khối, không giữ biến từ request trước. Không mặc định domain/IP. Thực hành client dùng tab riêng khóa Windows11 trên CLIENT01; backend chỉ kiểm hai target cố định. Các bước domain/private network và DHCP cần hạ tầng đúng được đánh dấu rõ. Không tạo VM/resize, không đổi NIC/firewall/forest để ép bài qua.\n\n### Chuẩn bị và phạm vi\nTask1 có thể tạo manifest tại C:\\ProgramData\\LabEx\\EnterpriseLabs cùng namespace riêng. Nếu prepare dở dang, dừng đọc lỗi và manifest, không xóa OU theo tên để thử lại. Mọi lệnh chỉ sửa đối tượng bài; module/role/quyền không có phải chuẩn bị đúng trước. Nội dung có sẵn không đồng nghĩa đã kiểm thử trên VM hoặc đủ môi trường."
    sections.append(dict(id=lid+'-intro',title='Giới thiệu, phạm vi và chuẩn bị',title_vi='Giới thiệu, phạm vi và chuẩn bị',kind='introduction',position=0,need_verify=False,content=intro,content_vi=intro))
    for n,t in enumerate(l['tasks'],1):
        sid=f'{lid}-task-{n}-v1';command=ps(lid,t['code'])
        body=f"## {t['title']}\n\n### Vì sao và tự làm trước\n{t['why']} Hãy ghi dự đoán, rồi thao tác GUI hoặc lệnh trước khi xem lời giải.\n\n### Thực hành\n{l['gui']}\n\nLời giải/khối lệnh cho PowerShell web trên Server (các thao tác interactive phải làm trong Desktop như mô tả):\n\n```powershell\n{command}\n```\n\n### Kết quả mong đợi và bộ chấm\n{t['expected']} Bộ chấm đối chiếu GUID/SID/namespace hoặc trạng thái OS/query thật, không chỉ tên file hay lệnh đã gõ.\n\n### Khi chưa đạt\nLàm/chấm task trước nếu task này dùng dữ liệu trước; kiểm module, target, quyền thực thi và ownership. Không sửa report để ép qua. Lỗi module/credential/capacity không phải lý do tắt bảo vệ hoặc dùng admin toàn domain tùy tiện.\n\n### Tự giải thích (không chấm tự động)\n{t['question']}\n\n### Làm lại\nĐọc phần Reset cuối bài. Các task trạng thái trước/sau có thể không cùng đúng sau khi sửa; điểm trước đó là bằng chứng tại thời điểm chấm, không khẳng định trạng thái luôn còn như cũ."
        if t['blocked']:body+='\n\n### Điều kiện môi trường chưa xác nhận\n'+t['blocked']
        if t['blocked']==DHCP_PATH:body+='\n\n'+isolated_guides[(lid.removeprefix('win-dnsdhcp-'),n)]
        isolated=t['blocked']==DHCP_PATH
        step=dict(id=sid,title=t['title'],title_vi=t['title'],kind='task',position=n,need_verify=True,content=body,content_vi=body,task=t['expected'],task_vi=t['expected'],hint=command,hint_vi=command,verification=({'kind':'unsupported','reason':DHCP_PATH} if isolated else {'kind':'windows-remote'}))
        sections.append(step.copy());steps.append(step)
        rules[sid]=dict(lab_id=lid,target_vm='server',modules=t['modules'] or l['modules'],exercise=t['code'],probe=None if isolated else t['probe'],client_probe=t['client'],blocked_reason=t['blocked'],runtime='isolated-dhcp' if isolated else 'domain-client' if t['client'] else 'server')
    reset=ps(lid,'Reset-SrvContext')
    summary=f"## Tổng kết và hoàn nguyên\n\n{l['theory']}\n\n### Reset riêng bài\nKhông reset khi đã move computer CLIENT01 vào OU bài mà chưa đưa về OU baseline, hoặc có đối tượng lạ trong OU; backend từ chối xóa không biết ownership. Ghi baseline DN trước thao tác move; khôi phục DN trong ADUC, refresh policy và kiểm marker trên client trước khi xóa GPO. Không unjoin/reboot/restore snapshot DC bằng reset thông thường.\n\nKhối sau chỉ xóa đối tượng đăng ký thuộc bài, không recursive domain delete. Nếu phát hiện object/GPO link ngoài phạm vi, scope không còn Inactive hoặc ZoneFile đổi thì dừng để kiểm tra.\n\n```powershell\n{reset}\n```\n\nSau reset kiểm namespace bài không còn, domain/SYSVOL/DNS/RDP/Azure Agent vẫn khỏe. Reset lỗi không có nghĩa đã hoàn nguyên; không đổi sang thông báo thành công. Khi prepare lỗi trước khi đủ manifest, cần quản trị kiểm intent và quyền, không tự xóa cây AD theo prefix. Câu hỏi tự giải thích và thao tác GUI chưa có evidence OS không được tự chứng nhận đã hiểu/đã làm."
    sections.append(dict(id=lid+'-summary',title='Tổng kết và reset có phạm vi',title_vi='Tổng kết và reset có phạm vi',kind='summary',position=4,need_verify=False,content=summary,content_vi=summary))
    lab=dict(id=lid,course_id=l['course'],order=orders[l['course']],title=l['title'],title_vi=l['title'],type='lab',difficulty='Intermediate',estimated_time='40–60 mins',target_vm='server',curriculum_version=1,curriculum_origin='locally-authored-microsoft-references',curriculum_module=f'{l["course"]}-module-{l["module"]}',overview=l['theory'],practice_mode='configuration-diagnostics',preparation=dict(mode='scoped-enterprise',requires_vm_start=True,target='server',fault_injection=False),validation_status='awaiting-live-server',references=[dict(title='Microsoft Learn',url=u,publisher='Microsoft',accessed_at='2026-10-23') for u in l['refs']],sections=sections,steps=steps)
    (DATA/'labs'/f'{lid}.json').write_text(json.dumps(lab,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(DATA/'windows-enterprise-rules.json').write_text(json.dumps(rules,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
plan=json.loads((DATA/'windows-roadmap.json').read_text(encoding='utf-8'));catalog=json.loads((DATA/'courses.json').read_text(encoding='utf-8'))
for cid in (AD,DNS):
    c=next(c for c in plan['courses'] if c['id']==cid)
    for i,m in enumerate(c['syllabus_modules'],1):
        own=[l for l in lessons if l['course']==cid and l['module']==i];m['lab_ids']=[l['id'] for l in own];m['planned_lessons']=[l['title'] for l in own]
    c['practice_strategy']='6 bài/18 nhiệm vụ đã có nội dung; xem readiness từng task. Phần domain/client và DHCP cô lập chưa đủ môi trường không được chấm giả.'
    c['environment_plan']='Windows Server hiện có; AD/DNS/GPO có namespace và manifest riêng. Client cần private path/domain; DHCP lease cần runtime cô lập. Chưa xác nhận live vì Azure thiếu capacity.'
    item=next(c for c in catalog if c['id']==cid);item.update(curriculum_status='implemented',validation_status='awaiting-live-server',curriculum_origin='locally-authored-microsoft-references',description=c['practice_strategy']+' '+c['environment_plan'])
plan['updated_at']='2026-10-23'
for path,value in [(DATA/'windows-roadmap.json',plan),(DATA/'courses.json',catalog)]:path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Built 12 enterprise lessons / 36 task specifications. Blocked runtime tasks remain explicitly unsupported; no VM or domain changes performed.')
import runpy
runpy.run_path(str(ROOT/'scripts/upgrade-windows-professional.py'),run_name='__main__')
