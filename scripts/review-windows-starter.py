"""Review existing starter lessons; keep course/lab IDs and do not provision VMs."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LABS=ROOT/'server/data/labs'
RULES=ROOT/'server/data/windows-starter-rules.json'
PS='https://learn.microsoft.com/en-us/powershell/module/'
review={}

def task(sid,theory,expected,question,practice,command=None,goal=None,probe=None,history=False):
    return dict(id=sid,theory=theory,expected=expected,question=question,practice=practice,command=command,goal=goal,probe=probe,history=history)

review['win-powershell-basics']=(
 'PowerShell truyền đối tượng có thuộc tính và phương thức qua pipeline, khác với chỉ ghép chuỗi văn bản. Cmdlet thường có tên Verb-Noun. Get-Help là tài liệu lệnh; Get-Member là tài liệu kiểu đối tượng, không phải danh sách các tiến trình. Phân biệt Windows PowerShell 5.1 và PowerShell 7: module Windows Server có thể chỉ hoạt động trong Windows PowerShell. Bài này chỉ đọc trạng thái, không thay dịch vụ.',[
 task('win-ps-01-sec-1','Get-Command tìm lệnh đã cài trên máy, không tải hoặc chạy các lệnh đó. Dấu * là wildcard. $PSVersionTable mô tả engine đang thực thi, không phải phiên bản Windows.',
      'Có các cmdlet như Get-Service; PSVersion có Major ít nhất 5. Tên và số lượng lệnh có thể khác theo module đã cài.',
      'Vì sao cùng là PowerShell nhưng hai máy có danh sách cmdlet khác nhau?',
      'Dùng Get-Help Get-Service -Examples, sau đó tự tìm cmdlet có Noun Process. Phần này tự luyện, không được chấm thành một task riêng.'),
 task('win-ps-01-sec-2','Get-Process trả các đối tượng Process. Get-Member cho biết các thuộc tính như Id, ProcessName và phương thức; Select-Object chọn cột, Where-Object lọc hàng. Format-Table chỉ nên dùng ở cuối khi trình bày, không đặt trước bộ lọc dữ liệu.',
      'TypeName tương ứng System.Diagnostics.Process; thấy Property/Method. CPU ở Get-Process là số giây CPU tích lũy từ khi tiến trình khởi động, không phải phần trăm CPU tức thời.',
      'Khác biệt giữa Get-Process và Get-Process | Get-Member là gì?',
      'Tự hiển thị 3 tiến trình với Id và ProcessName. Không dùng Stop-Process để thử trên tiến trình hệ thống.')])

service="Get-Service | Where-Object Status -eq 'Running' | Sort-Object DisplayName | Select-Object -First 10 Name, DisplayName, Status"
review['win-manage-services-processes']=(
 'Một service là thành phần do Service Control Manager quản lý; process là chương trình đang chạy. Service có thể chạy trong một process dùng chung, vì vậy không được đồng nhất tên service với tên process. Bắt đầu bằng quan sát, chưa dừng hoặc đổi StartupType khi chưa hiểu dịch vụ phụ thuộc.',[
 task('win-ps-02-sec-1','Where-Object lọc trạng thái tại thời điểm truy vấn. Sort-Object phải đứng trước Select-Object -First để lấy đúng 10 mục đầu theo tên hiển thị.',
      'Tối đa 10 dịch vụ Running được sắp tăng dần theo DisplayName. Ít hơn 10 dịch vụ không có nghĩa truy vấn sai.',
      'Lấy 10 dòng trước rồi mới sắp xếp khác gì sắp xếp toàn bộ trước?',
      'Đổi bộ lọc thành Stopped để so sánh, sau đó quay lại lệnh yêu cầu khi kiểm tra task.',service,
      'Lọc dịch vụ Running, sắp xếp tăng dần theo DisplayName và hiển thị 10 mục đầu.',
      '@(Get-Service | Where-Object Status -eq Running).Count -gt 0',True),
 task('win-ps-02-sec-2','Sắp xếp CPU của Get-Process chỉ tìm tiến trình đã dùng nhiều thời gian CPU tích lũy; một process chạy lâu có thể đứng đầu dù hiện đang nhàn. WorkingSet64 là số byte bộ nhớ vật lý đang sử dụng, không phải tổng RAM được cấp phát. Muốn CPU tức thời cần lấy mẫu theo thời gian/counter.',
      'Tối đa 5 tiến trình, CPU giảm dần; có thể có giá trị trống khi không đọc được process. Không suy ra ngay một process có lỗi chỉ từ thứ hạng này.',
      'Một process lâu năm có CPU(s) cao có chắc đang làm máy chậm lúc này không?',
      'Tự đổi Sort-Object sang WorkingSet64 và so sánh. Không Kill process chỉ vì nằm trong top 5.')])

aclcmd="(Get-Acl ./FinanceDocs).Access | Format-Table IdentityReference, FileSystemRights, AccessControlType"
review['win-file-system-ntfs']=(
 'DACL gồm các ACE Allow/Deny cho user hoặc group. Owner không đồng nghĩa có FullControl; IsInherited cho biết quyền kế thừa. Quyền hiệu lực còn phụ thuộc nhóm, inheritance và khi truy cập qua mạng còn có quyền share. Bài này tạo thư mục riêng và đọc quyền, chưa dạy thay ACL trên dữ liệu doanh nghiệp. Không thực hiện Set-Acl lên Windows, Program Files hoặc thư mục của người khác.',[
 task('win-fs-03-sec-1','Tạo FinanceDocs trong thư mục riêng của bài. Chạy hai khối lần lượt ở PowerShell web để hệ thống ghi nhận thao tác đọc ACL; không chỉ tạo thư mục rồi bấm kiểm tra.',
      'FinanceDocs tồn tại; bảng ACL có IdentityReference, FileSystemRights và AccessControlType. Owner/nhóm cụ thể tùy VM. Xem thêm (Get-Acl ./FinanceDocs).Owner và .Access.IsInherited để phân biệt chủ sở hữu với các quyền.',
      'Owner khác một ACE Allow Modify thế nào? Bật kế thừa có thể ảnh hưởng những user nào?',
      'Tạo một tệp ghi chú trong FinanceDocs rồi so sánh ACL của tệp với thư mục. Chỉ xóa tệp tự tạo khi ôn lại; không cần xóa FinanceDocs để làm lại task.',
      'New-Item -ItemType Directory -Path ./FinanceDocs -Force\n'+aclcmd,
      'Tạo FinanceDocs và đọc bảng quyền NTFS thực tế bằng Get-Acl ở PowerShell web.',
      '(Test-Path ./FinanceDocs -PathType Container) -and @( (Get-Acl ./FinanceDocs).Access ).Count -gt 0',True)])

reportcmd="Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object @{Name='ComputerName';Expression={$env:COMPUTERNAME}}, DeviceID, Size, FreeSpace | Export-Csv -LiteralPath ./health_report.csv -NoTypeInformation -Encoding UTF8"
reportprobe="""if(-not(Test-Path ./health_report.csv -PathType Leaf)){return $false}; $rows=@(Import-Csv -LiteralPath ./health_report.csv); $actual=@(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3'); if($rows.Count -ne $actual.Count -or $rows.Count -lt 1){return $false}; $seen=@{}; foreach($r in $rows){$disk=@($actual | Where-Object DeviceID -eq $r.DeviceID); if($seen.ContainsKey([string]$r.DeviceID) -or $disk.Count -ne 1 -or $r.ComputerName -ne $env:COMPUTERNAME){return $false}; $seen[[string]$r.DeviceID]=$true; [long]$size=0; [long]$free=0; if(-not [long]::TryParse($r.Size,[ref]$size) -or -not [long]::TryParse($r.FreeSpace,[ref]$free) -or $size -ne [long]$disk[0].Size -or $free -lt 0 -or $free -gt $size){return $false}}; return $true"""
review['win-powershell-scripting-automation']=(
 'Tự động hóa vận hành cần báo cáo có cấu trúc để máy khác đọc lại. CSV là dữ liệu; Format-Table là trình bày. Không đưa Format-Table vào trước Export-Csv. Báo cáo chỉ phản ánh một thời điểm; dung lượng trống thay đổi trong lúc hệ thống hoạt động. Bài này là bước đầu trước biến, điều kiện, vòng lặp và script có xử lý lỗi ở khóa nâng cao.',[
 task('win-sc-05-sec-1','Get-CimInstance đọc ổ local cố định (DriveType=3). Gắn ComputerName để tránh nhầm báo cáo của máy khác. Size/FreeSpace tính bằng byte; dùng GiB khi trình bày cho người dùng, giữ số nguyên trong CSV.',
      'health_report.csv có một dòng cho mỗi ổ local, đúng ComputerName, DeviceID và Size của VM; FreeSpace nằm trong khoảng 0..Size. Tệp chỉ có chữ DeviceID/FreeSpace/Size hoặc sao chép từ máy khác không đạt.',
      'Tại sao dung lượng trống không thể yêu cầu khớp tuyệt đối vài phút sau?',
      'Đọc lại bằng Import-Csv ./health_report.csv. Tự tính phần trăm trống và giải thích vì sao phải chuyển chuỗi CSV sang số trước khi so sánh.',reportcmd,
      'Xuất báo cáo CSV các ổ local với đúng tên máy, mã ổ, Size và FreeSpace.',reportprobe,True)])

def eventcmd(filter_text):
    return "try { Get-WinEvent -FilterHashtable @{"+filter_text+"} -MaxEvents 5 -ErrorAction Stop | Format-Table TimeCreated, Id, ProviderName, Message -Wrap } catch { if ($_.FullyQualifiedErrorId -like 'NoMatchingEventsFound*') { Write-Output 'Khong co su kien phu hop trong log hien tai.' } else { throw } }"

for lid,sid,filter_text,scope in [
 ('win-event-log-analysis','win-el-04-sec-1',"LogName='System'; Level=2",'Error (Level=2)'),
 ('win-troubleshoot-event-ids','win-tr-01-sec-1',"LogName='System'; ProviderName='Service Control Manager'; Id=7000,7001,7034",'Service Control Manager với ID 7000, 7001 hoặc 7034')]:
    review[lid]=('Event Viewer ghi các sự kiện theo log, provider, thời gian, ID và mức độ. Cùng một ID ở provider khác có thể có ý nghĩa khác. Một sự kiện không đủ để kết luận nguyên nhân gốc: cần đối chiếu thời điểm người dùng gặp lỗi và dịch vụ/ứng dụng liên quan. Không xóa log hoặc tạo lỗi dịch vụ chỉ để có dữ liệu làm bài.',[
      task(sid,'Lọc ngay tại Get-WinEvent bằng FilterHashtable thay vì tải toàn bộ log rồi lọc. Không có bản ghi phù hợp là kết quả hợp lệ; chỉ xử lý riêng NoMatchingEventsFound. Access Denied hoặc log không tồn tại phải báo lỗi thật.',
      'Hiển thị tối đa 5 sự kiện '+scope+', mới nhất trước; hoặc thông báo không có sự kiện phù hợp. Không yêu cầu máy có lỗi để task đạt.',
      'Nếu không có ID 7000/7001/7034, có kết luận mọi service đều khỏe không? Bạn cần thêm bằng chứng nào?',
      'Ghi lại TimeCreated, ProviderName, ID và Message của một bản ghi nếu có. Nếu không có, ghi rõ bộ lọc và thời điểm đã kiểm tra.',eventcmd(filter_text),
      'Truy vấn 5 sự kiện gần nhất thuộc '+scope+'; xử lý riêng trường hợp không có bản ghi.',"$null -ne (Get-WinEvent -ListLog System)",True)])

details={
 'win-server-ad-users-groups': ('AD DS lưu danh tính tập trung; OU tổ chức đối tượng và phạm vi policy/delegation, không phải security group. Dùng security group để cấp quyền theo vai trò. AD phụ thuộc DNS và đồng bộ thời gian. Đây là lab trên domain có sẵn, không cài domain controller hoặc tái cấu hình domain đang hoạt động.',
   [('Kiểm tra module ActiveDirectory trước. Mở dsa.msc trong Desktop, xác định domain thật và tạo OU IT_Department dưới domain đó nếu chưa có. Không mặc định domain phải là corp.local.','Bộ chấm phải thấy OU IT_Department trong AD; mở được cửa sổ hoặc chỉ xem Get-Command chưa đủ.','OU khác security group thế nào? Vì sao không tạo OU trùng tên ở nhánh khác?','Tự xem DistinguishedName của OU bằng Get-ADOrganizationalUnit; chưa thay delegation hoặc di chuyển OU.'),
    ('Tạo user david.miller với GivenName David, Surname Miller trong OU IT_Department. Dùng mật khẩu mạnh riêng trong wizard và chọn đổi mật khẩu ở lần đăng nhập sau. Không gửi mật khẩu vào chat hoặc ghi vào lệnh mẫu. Xem trước user đã tồn tại hay chưa để tránh thay tài khoản khác.','User tồn tại trong đúng OU, đúng họ tên và pwdLastSet=0. Get-Command New-ADUser chỉ chứng minh cmdlet có sẵn, không tạo user.','Khi nào được bật tài khoản và ai có trách nhiệm cấp quyền ban đầu?','Đọc thuộc tính tài khoản qua ADUC; không thử mật khẩu nhiều lần gây lockout.'),
    ('Tạo nhóm Global/Security Sec_IT_Admins trong cùng OU và thêm david.miller. Tên nhóm chỉ là nhãn: không thêm nhóm này vào Domain Admins hoặc local Administrators.','Nhóm đúng scope/category và có thành viên david.miller. Có nhóm nhưng không thêm thành viên sẽ không đạt.','Nhóm Security khác Distribution ra sao? Đặt tên Admins có tự cấp quyền quản trị không?','Tự kiểm tra member và MemberOf; không cấp thêm quyền ngoài bài.')]),
 'win-server-dns-dhcp': ('DNS phân giải tên; DHCP cấp cấu hình mạng như IP/gateway/DNS. Hai dịch vụ khác nhau. Bài nhập môn hiện chỉ quan sát phân giải localhost, chưa triển khai DNS zone hoặc DHCP scope. Không thay DNS/IP của VM Azure hay chạy DHCP server trên mạng đang dùng.',
   [('localhost là tên đặc biệt trên máy, không phải phép thử DNS doanh nghiệp hoặc Internet. Resolve-DnsName localhost giúp đọc Name, Type và IPAddress trước khi thử domain thật.','Có địa chỉ loopback 127.0.0.1 hoặc ::1 tùy cấu hình. Kết quả này không chứng minh DNS nội bộ hay DHCP đã hoạt động.','Nếu localhost phân giải được nhưng tên domain công ty không được, cần kiểm tra gì tiếp?','Tự xem ipconfig /all để phân biệt DNS server, DHCP server, default gateway; không sửa các địa chỉ.')]),
 'win-server-file-storage-share': ('SMB cung cấp chia sẻ qua mạng, NTFS áp dụng trên filesystem. Khi truy cập SMB phải xét cả quyền share lẫn NTFS. Bài này khảo sát các share có sẵn, chưa tạo file server theo phòng ban hoặc phân quyền nghiệp vụ. Share quản trị như C$ không phải thư mục nên cấp cho người dùng thường.',
   [('Get-SmbShare liệt kê Name, Path và Description. Dấu $ làm share ẩn khỏi browse thông thường, không phải cơ chế mã hóa hay bảo mật. Không xóa hoặc đổi quyền các share có sẵn.','Thấy share thực tế của máy; tên/số lượng tùy cấu hình. Chỉ liệt kê được share không chứng minh người dùng khác đọc/ghi được.','Người dùng thấy share nhưng nhận Access Denied: cần kiểm tra những lớp quyền nào?','Tự đọc Get-SmbShareAccess -Name <ten-share-thuc-te> trên một share bạn đã xác định; chỉ quan sát.')]),
 'win-server-group-policy': ('GPO có thiết lập User và Computer, phạm vi domain/site/OU và quy tắc ưu tiên. gpresult là công cụ đọc Resultant Set of Policy, không tạo hoặc liên kết GPO. PowerShell web chạy qua Agent bằng SYSTEM, không đại diện user đang đăng nhập Desktop. Cần chọn /scope computer khi xem policy máy từ web.',
   [('Ở PowerShell web dùng gpresult /scope computer /r; trong Desktop user có thể dùng gpresult /r. Không chạy gpupdate hoặc thay policy bảo mật chỉ để hoàn thành bài. Nếu chưa có RSoP, giữ nguyên lỗi để chuẩn bị môi trường, không kết luận có policy hoặc đánh dấu đạt giả.','Báo cáo hiển thị phạm vi máy và policy đã áp dụng nếu có. GPO rỗng hoặc không có RSoP không phải bằng chứng đã triển khai domain policy.','Vì sao kết quả của SYSTEM có thể khác người dùng Desktop?','Tự xác định user/computer scope và tên policy trong output; chưa tạo hoặc chỉnh GPO.')]),
 'win-server-iis-web': ('Website IIS gồm nội dung, binding, application pool và quyền đọc tệp. Mở IIS Manager hoặc có cổng lắng nghe chưa chứng minh đúng website phục vụ đúng nội dung. Chỉ tạo website PortalCorp trong thư mục riêng của lab. Không chỉnh Default Web Site hay mở NSG/cổng Internet.',
   [('Chuẩn bị thư mục C:\\LabEx\\Labs\\win-server-iis-web\\site và index.html chứa LabEx PortalCorp. Trong IIS Manager tạo website PortalCorp, physical path đúng thư mục này, binding http/*:8080 không host header. Nếu 8080 đang dùng, dừng để xác định chủ sở hữu, không xóa binding/site khác. Đảm bảo website Started và tài khoản application pool đọc được tệp.','Bộ chấm kiểm tra tên site, physical path, binding 8080, trạng thái Started và HTTP trả nội dung LabEx PortalCorp từ loopback. Mở IIS Manager hoặc Get-Command không đủ.','Có listener ở 8080 nhưng trả site khác thì kết luận gì? 403 và connection refused khác nhau ra sao?','Tự mở http://localhost:8080 trong Desktop hoặc Invoke-WebRequest. Chỉ sửa cấu hình thuộc PortalCorp; chưa đổi site có sẵn.')]),
 'win-troubleshoot-failed-services': ('Một dịch vụ Stopped có thể là trạng thái bình thường nếu StartupType Manual/Disabled hoặc trigger-start. Cần xác định yêu cầu vận hành, dependency và log trước khi sửa. Không restart Spooler/Winmgmt tùy tiện trên máy dùng chung.',
   [('Đọc Name, Status, StartType và RequiredServices của Spooler theo lệnh mẫu. Tên thuộc tính là tên service, không nhất thiết giống DisplayName.','Có cấu hình thực tế của Spooler; cả Running và Stopped đều là quan sát hợp lệ trong bài đọc trạng thái. Chưa chứng minh đã sửa service.','Khi nào Stopped là lỗi? Vì sao cần xem dependency trước khi đổi StartupType?','Tự tìm một service khác và đối chiếu Get-Service với Event Viewer, chỉ đọc.')]),
 'win-troubleshoot-network-connectivity': ('Chẩn đoán kết nối cần tách tên → IP → route → TCP → ứng dụng. Ping thành công không đảm bảo TCP mở; TCP mở không đảm bảo ứng dụng trả đúng nội dung. Bài này kiểm tra kết nối và đọc kết quả, không tự mở firewall hoặc sửa mạng Azure.',
   [('Test-NetConnection localhost -Port 80 chỉ kiểm tra dịch vụ local ở cổng 80; không phải Internet hoặc toàn bộ đường mạng client/server. Đọc RemoteAddress, RemotePort và TcpTestSucceeded.','True khi có listener phù hợp; False có thể hoàn toàn đúng nếu máy chưa có web server. Task không yêu cầu bật IIS để biến False thành True.','Nếu TCP mở nhưng website trả 500, lỗi đang ở lớp nào?', 'Tự so sánh một cổng đã biết với cổng không có listener bằng Get-NetTCPConnection -State Listen; không mở hoặc tắt firewall.')]),
 'win-troubleshoot-registry-recovery': ('Registry là cơ sở dữ liệu cấu hình phân cấp; HKLM chứa cấu hình máy, HKCU phụ thuộc tài khoản đang thực thi. Bài hiện chỉ đọc CurrentVersion, chưa phải bài khôi phục Registry. Không xóa khóa hoặc Import .reg vào máy thật để thử.',
   [('Get-ItemProperty đọc giá trị, không đổi Registry. PowerShell web chạy SYSTEM nên HKCU không phải profile Desktop của bạn; bài này cố ý dùng HKLM.','Có ProductName, CurrentBuild; ReleaseId có thể cũ/trống và không đủ xác định bản Windows hiện tại. Đối chiếu thêm DisplayVersion nếu có và Get-CimInstance Win32_OperatingSystem.','Export một khóa Registry khác gì full backup hoặc system state?', 'Tự đọc thêm DisplayVersion trong cùng khóa. Khi học phục hồi sau này phải có bản sao và phạm vi thử nghiệm riêng.')]),
 'win-performance-monitoring-bottlenecks': ('Bottleneck cần chuỗi số đo theo thời gian và triệu chứng, không chẩn đoán từ một ảnh chụp. CPU cao ngắn hạn có thể bình thường. Counter path có thể đổi theo ngôn ngữ Windows, khác với thuộc tính CIM. Không tạo tải CPU hoặc dừng process để có số đo đẹp.',
   [('Get-Counter lấy mẫu counter, khác CPU(s) tích lũy của Get-Process. CounterSamples.CookedValue là phần trăm của mẫu đã xử lý. Nếu counter path tiếng Anh không có trên OS ngôn ngữ khác, dùng CIM theo gợi ý.','Một giá trị CPU _Total trong khoảng 0..100. Không đặt điều kiện phải lớn hơn một ngưỡng mới đạt.','Vì sao CPU 95% một lần chưa đủ kết luận máy thiếu vCPU?', 'Tự lấy 3 mẫu cách nhau một giây và ghi thời điểm; không tự tạo workload gây ảnh hưởng dịch vụ.')])
}
for lid,(intro,items) in details.items():
    lab=json.loads((LABS/f'{lid}.json').read_text(encoding='utf-8'))
    review[lid]=(intro,[task(step['id'],*item) for step,item in zip(lab['steps'],items)])

ad=review['win-server-ad-users-groups'][1]
ad[0].update(goal='Tạo OU IT_Department ngay dưới domain hiện có; kiểm tra OU thực sự tồn tại, không chỉ mở công cụ.',
    probe="$root=(Get-ADDomain).DistinguishedName; $null -ne (Get-ADOrganizationalUnit -Identity ('OU=IT_Department,'+$root))",
    example='1. Trong Desktop, Win+R → `dsa.msc`. Nếu không có công cụ/module AD, dừng để chuẩn bị role trước.\n2. Xác định tên domain thật, nhấp phải domain → New → Organizational Unit.\n3. Tạo OU `IT_Department` ngay dưới domain, giữ bảo vệ chống xóa nhầm.\n4. Mở lại cây AD để xác nhận OU đã xuất hiện. Không tạo forest/domain mới.',
    hint='Trong Desktop mở dsa.msc, tạo OU IT_Department ngay dưới domain hiện có rồi kiểm tra kết quả.')
ad[1]['goal']='Tạo user david.miller (David Miller) trong OU IT_Department và bắt buộc đổi mật khẩu lần đăng nhập sau.'
ad[1]['example']='1. Trong ADUC chọn OU `IT_Department` → New → User.\n2. First name `David`, Last name `Miller`, logon name `david.miller`.\n3. Đặt mật khẩu riêng tuân thủ policy của domain trong wizard; chọn **User must change password at next logon**.\n4. Finish rồi mở Properties kiểm tra DN/họ tên. Nếu tài khoản đã tồn tại, kiểm tra đúng tài khoản lab trước khi sửa, không xóa tạo lại tùy tiện.'
ad[1]['hint']='Dùng wizard New User trong OU IT_Department; tên đăng nhập david.miller, David Miller, đổi mật khẩu ở lần đăng nhập sau.'
ad[2]['example']='1. Trong OU `IT_Department` chọn New → Group.\n2. Name `Sec_IT_Admins`, scope **Global**, type **Security**.\n3. Mở Properties → Members → Add → thêm `david.miller`.\n4. Kiểm tra thành viên. Không thêm nhóm này vào Domain Admins và không cấp quyền khác ngoài bài.'
ad[2]['hint']='Tạo nhóm Global/Security Sec_IT_Admins trong OU IT_Department, thêm david.miller làm thành viên.'
iis=review['win-server-iis-web'][1][0]
iis.update(goal='Tạo website PortalCorp tại thư mục riêng của bài, binding *:8080:, Started và phục vụ nội dung LabEx PortalCorp.',
    example='1. Mở PowerShell web, tạo nội dung riêng của bài:\n\n```powershell\nNew-Item -ItemType Directory -Path ./site -Force | Out-Null\nSet-Content -LiteralPath ./site/index.html -Value \'<html><body>LabEx PortalCorp</body></html>\' -Encoding UTF8\n```\n\n2. Trong Desktop mở IIS Manager (`inetmgr`). Nếu role/module IIS chưa có, cần chuẩn bị môi trường trước, không đánh dấu bài đã xong.\n3. Sites → Add Website: tên `PortalCorp`, physical path `C:\\LabEx\\Labs\\win-server-iis-web\\site`, protocol http, IP All Unassigned, port 8080, host name để trống.\n4. Nếu tên hoặc cổng đã có, kiểm tra chủ sở hữu trước, không thay site khác. Khởi động site, đảm bảo IIS đọc được index.html.\n5. Mở `http://localhost:8080` trong VM; phải thấy LabEx PortalCorp.',
    hint='Tạo ./site/index.html, rồi tạo site PortalCorp trong IIS Manager: đúng thư mục bài, All Unassigned:8080, không host header, trạng thái Started.',
    probe="Import-Module WebAdministration; $s=Get-Website -Name PortalCorp; if($s.State -ne 'Started' -or $s.PhysicalPath -ne 'C:\\LabEx\\Labs\\win-server-iis-web\\site' -or @($s.Bindings.Collection | Where-Object { $_.protocol -eq 'http' -and $_.bindingInformation -eq '*:8080:' }).Count -lt 1){return $false}; $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8080' -TimeoutSec 10; $r.StatusCode -eq 200 -and $r.Content.Contains('LabEx PortalCorp')")
# This task is observational. Use computer scope on the SYSTEM web console;
# missing RSoP remains an environment prerequisite, never fabricated success.
review['win-server-group-policy'][1][0]['command']='gpresult /scope computer /r'
cpu=review['win-performance-monitoring-bottlenecks'][1][0]
cpu.update(command='Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name=\'_Total\'" | Select-Object Name, PercentProcessorTime',
    goal='Đọc phần trăm CPU tổng thể tại thời điểm lấy mẫu bằng lớp hiệu năng CIM.',
    theory='Lớp Win32_PerfFormattedData_PerfOS_Processor cung cấp số liệu hiệu năng đã xử lý; chọn Name _Total để xem CPU toàn máy. PercentProcessorTime khác CPU(s) tích lũy của Get-Process. Dùng tên thuộc tính CIM tránh phụ thuộc counter path đã bản địa hóa của Get-Counter.',
    expected='Một dòng _Total với PercentProcessorTime trong khoảng 0..100. Không yêu cầu CPU cao mới đạt; chưa kết luận bottleneck từ một mẫu.',
    probe="$s=Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter \"Name='_Total'\"; $null -ne $s -and $null -ne $s.PercentProcessorTime -and [double]$s.PercentProcessorTime -ge 0 -and [double]$s.PercentProcessorTime -le 100",
    history=True)

for lid,(_,tasks) in review.items():
    if lid in details:
        for item in tasks:item['id']=item['id'].removesuffix('-v4')

refs=[dict(title='Microsoft Learn: PowerShell',url='https://learn.microsoft.com/en-us/powershell/'),dict(title='Microsoft Learn: Windows Server',url='https://learn.microsoft.com/en-us/windows-server/')]
newrules={}
for lid,(intro,tasks) in review.items():
    path=LABS/f'{lid}.json';lab=json.loads(path.read_text(encoding='utf-8'))
    lab.update(curriculum_version=4,curriculum_origin='locally-authored-microsoft-references',reviewed_at='2026-10-22',references=refs)
    for section in lab['sections']:
        if section.get('kind')!='task':
            section['content_vi']=intro+'\n\n### Môi trường thực hành\nDùng Windows VM của bài. PowerShell web chạy qua Azure Agent, quyền SYSTEM; mỗi lần gửi là process mới, nhưng tệp trong thư mục bài vẫn giữ lại. Không dựa vào biến của lần gửi trước. Dùng đường dẫn C:\\LabEx\\Labs\\'+lid+' khi thao tác từ Desktop.\n\n### Phạm vi thay đổi\nChỉ tạo/sửa dữ liệu của bài; các task quan sát không yêu cầu sửa cấu hình máy. Bản ghi lệnh web chứng minh đã chạy lệnh thành công, bộ chấm không đánh giá thay cho việc hiểu kết quả.'
            section['content']=section['content_vi']
    for item in tasks:
        step=next(s for s in lab['steps'] if s['id'].removesuffix('-v4')==item['id'].removesuffix('-v4'))
        section=next(s for s in lab['sections'] if s['id'].removesuffix('-v4')==item['id'].removesuffix('-v4'))
        original=section.get('content_vi') or section.get('content','')
        if '### Hướng dẫn\n' in original:original=original.split('### Hướng dẫn\n',1)[1].split('### Kết quả và cách tự kiểm tra',1)[0]
        if item.get('example'):example=item['example']
        elif item['command']:example='```powershell\n'+item['command']+'\n```'
        else:example=original.split('### Kết quả và cách tự kiểm tra')[0]
        body='### Bản chất và tình huống thực tế\n'+item['theory']+'\n\n### Hướng dẫn\n'+example+'\n\n### Kết quả và cách tự kiểm tra\n'+item['expected']+'\n\n### Câu hỏi tự giải thích\n'+item['question']+'\n\n### Bài tự làm thêm (không chấm tự động)\n'+item['practice']
        for obj in (step,section):
            obj['content']=body;obj['content_vi']=body;obj['translation_needs_review']=False
            if item['goal']:obj['task']=item['goal'];obj['task_vi']=item['goal']
            if item['command']:obj['hint']=item['command'];obj['hint_vi']=item['command']
            elif item.get('hint'):obj['hint']=item['hint'];obj['hint_vi']=item['hint']
            else:
                import re
                first=re.search(r'```powershell\s*\n(.*?)```',example,re.S)
                if first:obj['hint']=first.group(1).strip();obj['hint_vi']=obj['hint']
        if item['probe']:
            sid=item['id'].removesuffix('-v4')+'-v4'
            for obj in (step,section):obj['id']=sid;obj['verification']={'kind':'windows-remote'};obj.pop('verify_command',None)
            command=item['command']
            if lid=='win-file-system-ntfs':command=aclcmd
            alternatives=[command]
            if lid=='win-file-system-ntfs':alternatives += ['Get-Acl ./FinanceDocs',item['command']]
            newrules[sid]=dict(lab_id=lid,probe=item['probe'],**({'commands':[alternatives]} if item['history'] else {}))
    # Rename misleading titles rather than promising deployment/recovery not taught.
    if lid=='win-troubleshoot-registry-recovery':lab['title_vi']='Đọc Registry và nguyên tắc chuẩn bị khôi phục'
    if lid=='win-server-dns-dhcp':lab['title_vi']='Nhập môn DNS/DHCP và kiểm tra tên localhost'
    if lid=='win-server-file-storage-share':lab['title_vi']='Khảo sát SMB Share và các lớp quyền truy cập'
    if lid=='win-file-system-ntfs':lab['overview']='Tạo thư mục lab, đọc Owner, DACL, ACE và inheritance; phân biệt quyền NTFS với quyền SMB. Chưa thay ACL diện rộng.'
    path.write_text(json.dumps(lab,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
RULES.write_text(json.dumps(newrules,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
catalog_path=ROOT/'server/data/courses.json'
catalog=json.loads(catalog_path.read_text(encoding='utf-8'))
descriptions={
 'windows-powershell-for-sysadmins':'5 bài nhập môn PowerShell: cmdlet, đối tượng/pipeline, quan sát dịch vụ và tiến trình, đọc ACL/log và xuất báo cáo CSV. Có giải thích kết quả và câu hỏi tự làm; chưa thay thế khóa scripting và tự động hóa nâng cao.',
 'windows-server-administration-essentials':'5 bài nhập môn Windows Server: tạo OU/user/group trong domain có sẵn, khảo sát DNS localhost, SMB và kết quả GPO, tạo website IIS trong thư mục lab. Phần DNS/DHCP, SMB và GPO chưa phải bài triển khai doanh nghiệp hoàn chỉnh.',
 'windows-troubleshooting-and-incident-response':'5 bài chẩn đoán ban đầu: lọc Event ID, đọc cấu hình service, kiểm tra TCP, đọc Registry và CPU. Tập giải thích bằng chứng; không tự nạp lỗi, sửa Registry hoặc thay đổi mạng chỉ để hoàn thành task.'}
for course in catalog:
    if course['id'] in descriptions:
        course['description']=descriptions[course['id']]
        course['curriculum_origin']='locally-authored-microsoft-references'
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Reviewed {len(review)} existing Windows lessons; updated {len(newrules)} task IDs and criteria; no VM changes.')
import runpy
runpy.run_path(str(ROOT/'scripts/upgrade-windows-professional.py'),run_name='__main__')
