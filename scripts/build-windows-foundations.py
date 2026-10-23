"""Build six CLIENT01 foundation labs, their trusted probes, and course metadata."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'server/data';COURSE='windows-11-fundamentals'
common=(ROOT/'server/runtime/windows/fundamentals-common.ps1').read_text(encoding='utf-8')
def helper(name):
    return re.search(r'(?ms)^function '+re.escape(name)+r'.*?(?=^function |\Z)',common).group(0).strip()
def packed(body):return body.strip()
lessons=[]
def add(slug,title,module,theory,gui,tasks,refs):
    lessons.append(dict(id='win-fnd-'+slug,title=title,module=module,theory=theory,gui=gui,tasks=tasks,refs=refs))
def t(title,why,code,probe,expected,question,extra='',helpers=()):
    return dict(title=title,why=why,code=packed(code),probe=packed(probe),expected=expected,question=question,extra=extra,helpers=helpers)

add('system-tools','Khảo sát Windows 11 và công cụ quản trị',1,
 'Hệ điều hành quản lý CPU, RAM, thiết bị, process và quyền truy cập. Tên VM trên Azure khác tên máy bên trong Windows. Trước khi sửa một ticket, cần ghi nhận cấu hình và tác động; “máy chậm” chưa đủ để kết luận thiếu RAM. Caption là tên phiên bản/edition, BuildNumber giúp phân biệt bản phát hành; ProductType=1 là Windows Client. Không ghi product key, mật khẩu hoặc dữ liệu người dùng vào báo cáo.',
 'Trong Desktop mở Settings → System → About, rồi dùng nút Win+R của web mở msinfo32. Đối chiếu tên thiết bị, build và RAM; RAM được cấp cho VM không đại diện cho cấu hình của máy văn phòng khác.',[
 t('Lập hồ sơ hệ điều hành và phần cứng','CIM trả đối tượng có thuộc tính. Chọn đúng trường rồi xuất JSON để bộ chấm đọc lại; Format-Table chỉ dùng khi hiển thị, không đưa vào trước ConvertTo-Json.',
 "$osInfo=Get-CimInstance Win32_OperatingSystem; $machine=Get-CimInstance Win32_ComputerSystem\n$data=[pscustomobject]@{Caption=$osInfo.Caption;Build=$osInfo.BuildNumber;ProductType=[int]$osInfo.ProductType;RAM=[int64]$machine.TotalPhysicalMemory}",
 "$d=Read-FndReport 'step1.json'; $o=Get-CimInstance Win32_OperatingSystem; $c=Get-CimInstance Win32_ComputerSystem; $d.Caption -eq $o.Caption -and $d.Build -eq $o.BuildNumber -and [int]$d.ProductType -eq 1 -and [int]$o.BuildNumber -ge 22000 -and [int64]$d.RAM -eq [int64]$c.TotalPhysicalMemory",
 'step1.json có Caption, Build, ProductType và RAM đúng CLIENT01; số RAM tính bằng byte, không yêu cầu RAM tối thiểu giả định.',
 'Vì sao build và edition quan trọng khi tìm hướng dẫn hoặc driver phù hợp?'),
 t('Xác định engine và tài khoản thực thi','Windows PowerShell 5.1 và PowerShell 7 là hai engine khác nhau. PowerShell web qua Azure Agent chạy SYSTEM; kết quả whoami của Desktop có thể khác. Không dùng HKCU của SYSTEM để suy ra cấu hình user Desktop.',
 "$identity=[Security.Principal.WindowsIdentity]::GetCurrent()\n$data=[pscustomobject]@{Version=$PSVersionTable.PSVersion.ToString();Edition=[string]$PSVersionTable.PSEdition;IdentitySid=$identity.User.Value;IsSystem=$identity.IsSystem;Architecture=[Environment]::Is64BitProcess}",
 "$d=Read-FndReport 'step2.json'; $i=[Security.Principal.WindowsIdentity]::GetCurrent(); $d.Version -eq $PSVersionTable.PSVersion.ToString() -and $d.Edition -eq $PSVersionTable.PSEdition -and $d.IdentitySid -eq $i.User.Value -and $d.IsSystem -eq $i.IsSystem -and $d.Architecture -eq [Environment]::Is64BitProcess",
 'Báo cáo khớp phiên PowerShell web 64-bit; không chép tên tài khoản Desktop vào trường IdentitySid.',
 'SYSTEM có phải tài khoản người đang mở Desktop không? Khi báo lỗi cần nói rõ phiên nào?')],
 ['https://learn.microsoft.com/en-us/powershell/module/cimcmdlets/get-ciminstance','https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-computerinfo'])

add('process-services-startup','Tiến trình, dịch vụ và ứng dụng khởi động',1,
 'Process là một phiên chương trình đang chạy; service do Service Control Manager quản lý và có thể dùng chung process. Startup app thường chạy khi logon, không đồng nghĩa service. Không đóng process hoặc disable service chỉ vì tên lạ. CPU(s) trong Get-Process là thời gian CPU tích lũy, không phải phần trăm CPU tức thời. Bài chỉ quan sát, không stop/restart/disable thành phần nào.',
 'Mở Task Manager bằng nút Ctrl+Shift+Esc của web hoặc Win+R → taskmgr; xem Processes/Details/Startup apps. Mở services.msc và đối chiếu Name, Status, Startup type. Startup apps của user Desktop không phải toàn bộ mục cấp máy được khảo sát trong task 2.',[
 t('Phân biệt process hệ thống và service','Quan sát wininit là process hệ thống tồn tại trong phiên khởi động Windows; Spooler là tên một service. Spooler có thể Running hoặc Stopped, tùy máy. Bộ chấm không bắt bạn bật một dịch vụ đang tắt.',
 "$process=Get-Process -Name wininit | Select-Object -First 1; $service=Get-Service Spooler\n$data=[pscustomobject]@{ProcessId=$process.Id;ProcessName=$process.ProcessName;ServiceName=$service.Name;ServiceStatus=$service.Status.ToString()}",
 "$d=Read-FndReport 'step1.json'; $p=Get-Process -Name wininit | Select-Object -First 1; $s=Get-Service Spooler; [int]$d.ProcessId -eq $p.Id -and $d.ProcessName -eq $p.ProcessName -and $d.ServiceName -eq $s.Name -and $d.ServiceStatus -in @('Running','Stopped','Paused','StartPending','StopPending','ContinuePending','PausePending')",
 'Có PID/tên wininit thực và service Spooler; trạng thái service phải là giá trị hợp lệ, không cần Running. Nếu VM vừa reboot, thu lại báo cáo vì PID có thể đổi.',
 'Vì sao không dùng Stop-Process để thay cho Stop-Service khi chẩn đoán service?'),
 t('Khảo sát startup cấp máy','Chỉ đọc hai khóa HKLM Run (64/32-bit) và Common Startup. Đây là một phần các nguồn startup, không phải danh sách đầy đủ Scheduled Tasks/service/user startup. Không xuất command line của ứng dụng để hạn chế lộ tham số riêng.',
 "$data=[pscustomobject]@{Scope='MachineRunAndCommonStartup';Items=@(Get-FndStartup)}",
 "$d=Read-FndReport 'step2.json'; $d.Scope -eq 'MachineRunAndCommonStartup' -and (Same-FndItems @($d.Items) @(Get-FndStartup))",
 'Items khớp tên mục startup trong phạm vi đã nêu; mảng rỗng là hợp lệ nếu máy không có mục tại các vị trí đó.',
 'Tắt một mục Startup apps có nhất thiết làm service cùng hãng ngừng chạy không?',helpers=('Get-FndStartup',))],
 ['https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-process','https://learn.microsoft.com/en-us/windows/win32/setupapi/run-and-runonce-registry-keys'])

add('accounts-uac','Tài khoản local, SID và UAC',2,
 'User có SID ổn định để Windows gắn quyền; tên hiển thị có thể thay đổi. Thành viên Administrators không có nghĩa mọi process luôn được nâng quyền. UAC điều khiển quy trình elevation; quyền và danh tính còn phụ thuộc token của process. Bài này không tạo user, đổi mật khẩu, thêm admin hay tắt UAC. Module LocalAccounts cần Windows PowerShell 64-bit trên Windows 11.',
 'Mở Computer Management → Local Users and Groups để quan sát. Mở Change User Account Control settings để đọc vị trí thanh trượt, rồi Cancel. Không bấm lưu hoặc thay cấu hình. Domain/Entra account là chủ đề khác, không suy ra chúng từ danh sách local.',[
 t('Ghi nhận danh tính local bằng SID','Đọc Get-LocalUser ở PowerShell web; không xuất mật khẩu hoặc key. Disabled không đồng nghĩa có thể xóa tài khoản: built-in account có vai trò riêng.',
 "$data=[pscustomobject]@{Users=@(Get-LocalUser | Sort-Object SID | ForEach-Object {[pscustomobject]@{Name=$_.Name;Sid=$_.SID.Value;Enabled=[bool]$_.Enabled}})}",
 "$d=Read-FndReport 'step1.json'; $actual=@(Get-LocalUser | ForEach-Object { $_.Name+'|'+$_.SID.Value+'|'+[string][bool]$_.Enabled }); $saved=@($d.Users | ForEach-Object {$_.Name+'|'+$_.Sid+'|'+[string][bool]$_.Enabled}); $actual.Count -gt 0 -and (Same-FndItems $saved $actual)",
 'Tất cả user local, SID và Enabled khớp máy thật; không tạo thêm admin để có dữ liệu.',
 'Một tài khoản đổi tên có cần mất mọi quyền cũ không? SID giúp giải thích thế nào?'),
 t('Đọc UAC và token của phiên hiện tại','EnableLUA nằm trong HKLM, nhưng không mô tả mọi thiết lập UAC. Chỉ ghi nhận giá trị hiện tại, không thay đổi nó để khớp ví dụ. Token SYSTEM của web không đại diện mức elevation của ứng dụng Desktop.',
 "$identity=[Security.Principal.WindowsIdentity]::GetCurrent(); $policy=Get-ItemProperty -LiteralPath 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System'\n$data=[pscustomobject]@{EnableLUA=[int]$policy.EnableLUA;IdentitySid=$identity.User.Value;IsSystem=[bool]$identity.IsSystem}",
 "$d=Read-FndReport 'step2.json'; $p=Get-ItemProperty -LiteralPath 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System'; $i=[Security.Principal.WindowsIdentity]::GetCurrent(); $null -ne $d.EnableLUA -and [int]$d.EnableLUA -eq [int]$p.EnableLUA -and $d.IdentitySid -eq $i.User.Value -and $d.IsSystem -eq $i.IsSystem",
 'Báo cáo khớp cấu hình và danh tính thật. Nếu EnableLUA=0, ghi nhận/rà soát cấu hình với người quản trị, không tự đổi Registry trong bài.',
 'Vì sao “tôi thuộc nhóm Administrators” chưa đủ giải thích quyền của một process?')],
 ['https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.localaccounts/get-localuser','https://learn.microsoft.com/en-us/windows/security/application-security/application-control/user-account-control/settings-and-configuration'])

add('files-profile-ntfs','Đường dẫn, profile, tệp và quyền NTFS',2,
 'Đường dẫn tuyệt đối xác định tệp từ ổ đĩa; đường dẫn tương đối phụ thuộc thư mục hiện tại. Profile của SYSTEM khác profile người dùng Desktop. DACL gồm các ACE Allow/Deny; Owner, quyền hiệu lực và quyền kế thừa là các khái niệm khác nhau. Khi đi qua SMB còn có share permissions. Chỉ thao tác tệp của bài, không Set-Acl diện rộng.',
 'Trong Explorer bật View → Show → File name extensions, rồi mở thư mục của bài. Có thể dùng Properties → Security để xem quyền và Cancel khi xong. Không sửa C:\\Windows, Program Files hay thư mục của tài khoản khác.',[
 t('Tạo dữ liệu trong workspace riêng','Dùng Join-Path để không nhầm profile/thư mục. Các đoạn lệnh đã chọn workspace cố định C:\\LabEx\\Labs\\<labId>; chạy lại chỉ ghi đè tệp mẫu của bài này.',
 "New-Item -ItemType Directory -Path (Join-Path $labRoot 'Documents') -Force | Out-Null\n$file=Join-Path $labRoot 'Documents\\LearningNote.txt'; Set-Content -LiteralPath $file -Value 'Windows fundamentals' -Encoding UTF8\n$data=[pscustomobject]@{File=$file;Profile=$env:USERPROFILE;IdentitySid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value}",
 "$d=Read-FndReport 'step1.json'; $file=Join-Path $labRoot 'Documents\\LearningNote.txt'; $d.File -eq $file -and (Test-Path -LiteralPath $file -PathType Leaf) -and (Get-Content -LiteralPath $file -Raw).Trim() -eq 'Windows fundamentals' -and $d.Profile -eq $env:USERPROFILE -and $d.IdentitySid -eq [Security.Principal.WindowsIdentity]::GetCurrent().User.Value",
 'Có Documents\\LearningNote.txt chứa đúng nội dung và báo cáo chỉ đúng đường dẫn/profile của phiên web.',
 'Nếu lệnh tạo tệp đúng tên nhưng xuất hiện ở Desktop của SYSTEM thì bạn đã giả định sai điều gì?'),
 t('Sao chép có đối chiếu và đọc ACL','Sao chép dữ liệu không chứng minh quyền đã giống bản gốc. Hash kiểm tra bytes; ACL mô tả bảo mật. Bài kiểm tra hai điều riêng, không thay ACL để làm chúng bằng nhau.',
 "$source=Join-Path $labRoot 'Documents\\LearningNote.txt'; $backup=Join-Path $labRoot 'LearningNote.copy.txt'\nCopy-Item -LiteralPath $source -Destination $backup -Force\n$acl=Get-Acl -LiteralPath $backup\n$data=[pscustomobject]@{SourceHash=(Get-FileHash -LiteralPath $source).Hash;CopyHash=(Get-FileHash -LiteralPath $backup).Hash;Owner=$acl.Owner;Sddl=$acl.Sddl}",
 "$d=Read-FndReport 'step2.json'; $source=Join-Path $labRoot 'Documents\\LearningNote.txt'; $copy=Join-Path $labRoot 'LearningNote.copy.txt'; $acl=Get-Acl -LiteralPath $copy; (Get-Content -LiteralPath $source -Raw).Trim() -eq 'Windows fundamentals' -and $d.SourceHash -eq (Get-FileHash -LiteralPath $source).Hash -and $d.CopyHash -eq $d.SourceHash -and $d.CopyHash -eq (Get-FileHash -LiteralPath $copy).Hash -and $d.Owner -eq $acl.Owner -and $d.Sddl -eq $acl.Sddl",
 'Hai tệp có bytes giống nhau, Owner/SDDL báo cáo khớp bản copy thực tế. Tệp rỗng hoặc chỉ có một chuỗi hash tự viết không đạt.',
 'Hash giống nhau có chứng minh hai user có cùng quyền đọc tệp không?')],
 ['https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/get-acl','https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash'])

add('software-drivers-updates','Phần mềm, driver và cập nhật: chuẩn bị bảo trì an toàn',3,
 'Trước cài/gỡ, ghi rõ phần mềm, phiên bản, publisher, nguồn tải, quyền và cách hoàn nguyên. Driver kết nối Windows với thiết bị; chọn đúng hardware ID và bản OS, không chỉ chọn “bản mới nhất”. Windows Update, driver update và Store app update là các luồng khác nhau. Khóa nền tảng này thực hành khảo sát và chuẩn bị bảo trì; không ép cài driver/reboot trên VM đang dùng. Thực hành cài/gỡ và sửa lỗi sâu hơn nằm ở khóa IT Support.',
 'Xem Settings → Apps → Installed apps, Device Manager (devmgmt.msc) → một thiết bị → Driver; chỉ xem và Cancel. Mở Windows Update để đọc update history, không bấm Check/Install/Restart chỉ để hoàn thành bài. Không tải trình “driver updater” không rõ nguồn.',[
 t('Khảo sát phần mềm cấp máy có phạm vi rõ','Đọc registry Uninstall cấp máy để lấy tối đa 5 mẫu. Đây không phải danh sách đầy đủ Store/per-user apps. Không truy vấn Win32_Product vì có thể kích hoạt kiểm tra/sửa MSI. Không xuất uninstall command line hay license key.',
 "$data=[pscustomobject]@{Scope='MachineUninstallSample';Software=@(Get-FndSoftware)}",
 "$d=Read-FndReport 'step1.json'; $actual=@(Get-FndSoftware | ForEach-Object {$_.Key+'|'+$_.Name+'|'+$_.Version+'|'+$_.Publisher}); $saved=@($d.Software | ForEach-Object {$_.Key+'|'+$_.Name+'|'+$_.Version+'|'+$_.Publisher}); $d.Scope -eq 'MachineUninstallSample' -and (Same-FndItems $saved $actual)",
 'Scope đúng, mẫu tối đa 5 mục khớp Name/Version/Publisher/key thật; mảng rỗng hợp lệ nếu không có phần mềm trong phạm vi này.',
 'Không thấy một app trong HKLM Uninstall có chứng minh app chưa cài không?',helpers=('Get-FndSoftware',)),
 t('Ghi nhận driver và hotfix trước bảo trì','Đọc mẫu 5 driver theo DeviceID và danh sách hotfix do Win32_QuickFixEngineering cung cấp. IsSigned không đủ chứng minh driver phù hợp hoặc không lỗi. Hotfix query không bao gồm mọi loại update. Dịch vụ wuauserv có thể Stopped theo trigger, không bắt buộc Running.',
 "$update=Get-Service wuauserv\n$data=[pscustomobject]@{Drivers=@(Get-FndDrivers);Hotfixes=@(Get-CimInstance Win32_QuickFixEngineering | ForEach-Object {[string]$_.HotFixID} | Sort-Object);UpdateService=$update.Name;ObservedServiceStatus=$update.Status.ToString()}",
 "$d=Read-FndReport 'step2.json'; $actual=@(Get-FndDrivers | ForEach-Object {$_.DeviceID+'|'+$_.DeviceName+'|'+$_.Version+'|'+[string][bool]$_.Signed}); $saved=@($d.Drivers | ForEach-Object {$_.DeviceID+'|'+$_.DeviceName+'|'+$_.Version+'|'+[string][bool]$_.Signed}); $d.UpdateService -eq (Get-Service wuauserv).Name -and $d.ObservedServiceStatus -in @('Running','Stopped','StartPending','StopPending','Paused','PausePending','ContinuePending') -and (Same-FndItems $saved $actual) -and (Same-FndItems @($d.Hotfixes) @(Get-CimInstance Win32_QuickFixEngineering | ForEach-Object {[string]$_.HotFixID}))",
 'Mẫu driver và hotfix khớp máy; không yêu cầu phải có driver lỗi hoặc pending update. Nếu cấu hình vừa thay đổi tự động, thu lại báo cáo rồi kiểm tra.',
 'Trước rollback driver, bạn cần ghi nhận điều gì và chuẩn bị đường truy cập nào?',helpers=('Get-FndDrivers',))],
 ['https://learn.microsoft.com/en-us/previous-versions/windows/desktop/whqlprov/win32-pnpsigneddriver','https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-quickfixengineering'])

add('baseline-change-rollback','Kiểm kê, thay đổi có kiểm chứng và hoàn nguyên',3,
 'Một thay đổi cần trạng thái ban đầu, mục tiêu, phạm vi ảnh hưởng, tiêu chí thành công và cách hoàn nguyên. Backup có giá trị khi đã kiểm tra restore. Ở đây chỉ thay config mẫu trong workspace, không đổi Registry/service/mạng thật. Đây là diễn tập quy trình, không phải system restore hay backup toàn bộ Windows. Dữ liệu minh chứng và giải thích nguyên nhân khác nhau; bộ chấm xác nhận trạng thái, không tự chứng nhận bạn đã hiểu nghiệp vụ.',
 'Mở thư mục bài trong Explorer. Quan sát config.json, baseline.json và báo cáo trước/sau. Có thể đọc JSON bằng Notepad. Chỉ sử dụng dữ liệu do hai task tạo, không dùng bản backup của người khác.',[
 t('Tạo baseline và bản sao đối chiếu','Tạo cấu hình mẫu Version=1, Mode=Training; lưu bản sao riêng và hash. Lặp lại task này đặt lại riêng config/baseline của bài; không xóa dữ liệu người dùng.',
 "$file=Join-Path $labRoot 'config.json'; $backup=Join-Path $labRoot 'baseline.json'\n[pscustomobject]@{Version=1;Mode='Training'} | ConvertTo-Json | Set-Content -LiteralPath $file -Encoding UTF8\nCopy-Item -LiteralPath $file -Destination $backup -Force\n$data=[pscustomobject]@{BaselineHash=(Get-FileHash -LiteralPath $backup).Hash;ConfigHash=(Get-FileHash -LiteralPath $file).Hash}",
 "$d=Read-FndReport 'step1.json'; $file=Join-Path $labRoot 'config.json'; $backup=Join-Path $labRoot 'baseline.json'; $c=Get-Content -LiteralPath $backup -Raw | ConvertFrom-Json; $c.Version -eq 1 -and $c.Mode -eq 'Training' -and $d.BaselineHash -eq (Get-FileHash -LiteralPath $backup).Hash -and $d.ConfigHash -eq $d.BaselineHash -and $d.ConfigHash -eq (Get-FileHash -LiteralPath $file).Hash",
 'Hai tệp cùng nội dung baseline Version=1 và hash báo cáo khớp file thật.',
 'Vì sao “copy xong không báo lỗi” chưa đủ để xác nhận backup khôi phục được?'),
 t('Thay đổi mẫu rồi phục hồi có nhật ký','Lưu bằng chứng hash trước, sau thay đổi Version=2 và sau restore. Dùng bản baseline từ task trước để hoàn nguyên. Không chỉ viết một câu “restored” vào báo cáo.',
 "$file=Join-Path $labRoot 'config.json'; $backup=Join-Path $labRoot 'baseline.json'\n$before=(Get-FileHash -LiteralPath $backup).Hash\n[pscustomobject]@{Version=2;Mode='Training'} | ConvertTo-Json | Set-Content -LiteralPath $file -Encoding UTF8\n$changed=(Get-FileHash -LiteralPath $file).Hash\nCopy-Item -LiteralPath $file -Destination (Join-Path $labRoot 'changed.json') -Force\nCopy-Item -LiteralPath $backup -Destination $file -Force\n$data=[pscustomobject]@{BeforeHash=$before;ChangedHash=$changed;AfterHash=(Get-FileHash -LiteralPath $file).Hash;Result='Restored';ChangeReason='Practice scoped configuration rollback'}",
 "$baseline=Read-FndReport 'step1.json'; $d=Read-FndReport 'step2.json'; $file=Join-Path $labRoot 'config.json'; $backup=Join-Path $labRoot 'baseline.json'; $changed=Join-Path $labRoot 'changed.json'; $c=Get-Content -LiteralPath $file -Raw | ConvertFrom-Json; $v=Get-Content -LiteralPath $changed -Raw | ConvertFrom-Json; $hash=(Get-FileHash -LiteralPath $file).Hash; $c.Version -eq 1 -and $c.Mode -eq 'Training' -and $hash -eq (Get-FileHash -LiteralPath $backup).Hash -and $d.BeforeHash -eq $baseline.BaselineHash -and $d.BeforeHash -eq $hash -and $d.AfterHash -eq $hash -and $d.ChangedHash -eq (Get-FileHash -LiteralPath $changed).Hash -and $v.Version -eq 2 -and $v.Mode -eq 'Training' -and $d.ChangedHash -ne $d.BeforeHash -and $d.Result -eq 'Restored' -and -not [string]::IsNullOrWhiteSpace($d.ChangeReason)",
 'Config trở lại Version=1, khớp backup và BeforeHash/AfterHash; có hash khác tại bước thay đổi và lý do được ghi lại. Chỉ tạo file rỗng hoặc chữ Restored không đạt.',
 'Trong hệ thống thật, ngoài hash tệp còn cần phép thử chức năng nào để xác nhận dịch vụ phục hồi?')],
 ['https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/copy-item','https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash'])

rules={}
for order,l in enumerate(lessons,1):
    lid=l['id']; sections=[];steps=[]
    intro=f"## {l['title']}\n\n### Mục tiêu và bản chất\n{l['theory']}\n\n### Quan sát trong Desktop\n{l['gui']}\n\n### Môi trường và cách làm\nChỉ bật CLIENT01, Windows 11 client; không cần Windows Server. Hoàn nguyên kịch bản sự cố cũ trước khi học. PowerShell web chạy SYSTEM, mỗi lần gửi là process mới; biến không giữ sang request sau. Chạy nguyên khối lệnh của từng task, tệp nằm tại `C:\\LabEx\\Labs\\{lid}`. Khi mở PowerShell trong Desktop, danh tính/quyền có thể khác; báo cáo đối chiếu danh tính phải chạy bằng PowerShell web.\n\n### Cách đọc lệnh\nGet-* đọc dữ liệu; `[pscustomobject]` chọn trường báo cáo; `@(...)` tạo danh sách kể cả rỗng; ConvertTo-Json chuyển đối tượng thành dữ liệu; Set-Content ghi tệp mẫu. Đây là lệnh hỗ trợ thu bằng chứng, chưa yêu cầu học thuộc cú pháp PowerShell. Đọc kết quả và giải thích lại bằng lời trước khi xem gợi ý. Không đưa mật khẩu/token vào báo cáo.\n\n### Dữ liệu và làm lại\nCác bài chỉ đọc cấu hình máy, tạo hoặc ghi đè tệp mẫu trong workspace riêng. Báo cáo có phiên bản, lab ID, tên máy, thời điểm UTC; thu lại nếu quá 24 giờ hoặc VM/cấu hình thay đổi. Không có nút nạp lỗi cho khóa này. Không đổi UAC, tài khoản, service, driver, Registry hoặc mạng để làm bài đạt.\n"
    sections.append(dict(id=lid+'-intro',title='Giới thiệu, mục tiêu và môi trường',title_vi='Giới thiệu, mục tiêu và môi trường',kind='introduction',position=0,need_verify=False,content=intro,content_vi=intro))
    for number,item in enumerate(l['tasks'],1):
        sid=f'{lid}-task-{number}-v1';filename=f'step{number}.json'
        prefix=f"$labId='{lid}'; $labRoot='C:\\LabEx\\Labs\\{lid}'\n"+helper('Assert-FndWorkspace')+'\nAssert-FndWorkspace\nNew-Item -ItemType Directory -Path $labRoot -Force | Out-Null\n'
        prefix+='\n'.join(helper(h) for h in item['helpers'])+'\n'
        command=prefix+item['code']+f"\n[pscustomobject]@{{Schema=1;LabId=$labId;Computer=$env:COMPUTERNAME;CollectedAtUtc=[DateTimeOffset]::UtcNow.ToString('o');Data=$data}} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $labRoot '{filename}') -Encoding UTF8\nWrite-Output 'Da ghi {filename}; mo tep trong thu muc bai de doi chieu.'"
        body=f"## {item['title']}\n\n### Vì sao làm bước này?\n{item['why']}\n\n### Thực hành\n{l['gui']}\n\nSau khi quan sát, chạy nguyên khối sau ở PowerShell web của bài để ghi bằng chứng:\n\n```powershell\n{command}\n```\n\n### Kết quả và cách tự kiểm tra\n{item['expected']} Mở `{filename}` trong thư mục bài để đối chiếu Data, rồi bấm Kiểm tra kết quả. File đúng tên nhưng sai nội dung, sai máy, sai lab hoặc quá hạn sẽ không đạt. Không chỉnh số liệu để ép kết quả.\n\n### Câu hỏi tự giải thích\n{item['question']}\n\n### Tự luyện thêm (không chấm tự động)\nGhi câu trả lời theo mẫu: quan sát → phép kiểm tra → bằng chứng → kết luận có giới hạn → bước tiếp theo. So sánh công cụ GUI với PowerShell, không tự thay cấu hình ngoài phạm vi bài.\n\n### Khi chưa đạt và làm lại\nChạy task trước nếu task này dùng tệp của bước trước; kiểm tra đúng CLIENT01 và workspace. Thu lại báo cáo sau khi VM reboot hoặc dữ liệu thay đổi. Có thể chạy lại khối lệnh để cập nhật file mẫu; không xóa thư mục hệ thống. {item['extra']}"
        step=dict(id=sid,title=item['title'],title_vi=item['title'],kind='task',position=number,need_verify=True,content=body,content_vi=body,task=item['expected'],task_vi=item['expected'],hint=command,hint_vi=command,verification={'kind':'windows-remote'})
        sections.append(step.copy());steps.append(step)
        rules[sid]=dict(lab_id=lid,target_vm='client',report_file=filename,probe=item['probe'])
    summary='## Tổng kết và tự đánh giá\n\n'+l['theory']+'\n\nTự giải thích hai câu hỏi trong bài trước khi chuyển tiếp. Điểm task xác nhận dữ liệu/trạng thái được kiểm tra, không tự chứng nhận hiểu bản chất. Giữ các file mẫu để ôn; không cần khôi phục cấu hình Windows vì bài không thay cấu hình máy.'
    sections.append(dict(id=lid+'-summary',title='Tổng kết và tự đánh giá',title_vi='Tổng kết và tự đánh giá',kind='summary',position=3,need_verify=False,content=summary,content_vi=summary))
    lab=dict(id=lid,course_id=COURSE,order=order,title=l['title'],title_vi=l['title'],type='lab',difficulty='Beginner',estimated_time='30–40 mins',target_vm='client',curriculum_version=1,curriculum_origin='locally-authored-microsoft-references',curriculum_module=f'{COURSE}-module-{l["module"]}',overview=l['theory'],practice_mode='configuration-diagnostics',preparation=dict(mode='self-contained',requires_vm_start=True,target='client',fault_injection=False),references=[dict(title='Microsoft Learn',url=url,publisher='Microsoft',accessed_at='2026-10-22') for url in l['refs']],sections=sections,steps=steps)
    (DATA/'labs'/f'{lid}.json').write_text(json.dumps(lab,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(DATA/'windows-foundations-rules.json').write_text(json.dumps(rules,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
plan=json.loads((DATA/'windows-roadmap.json').read_text(encoding='utf-8')); c=next(c for c in plan['courses'] if c['id']==COURSE)
c['practice_strategy']='Học 6 bài theo thứ tự: quan sát GUI, chạy khối thu bằng chứng, đọc kết quả và tự giải thích; chỉ bật CLIENT01.'
c['environment_plan']='CLIENT01 hiện có; 6 bài tự chuẩn bị file mẫu trong workspace riêng, không nạp lỗi hoặc sửa cấu hình Windows.'
c['references']=[dict(title='Microsoft Learn: Windows security',url='https://learn.microsoft.com/en-us/windows/security/'),dict(title='Microsoft Learn: PowerShell',url='https://learn.microsoft.com/en-us/powershell/')]
for i,module in enumerate(c['syllabus_modules'],1):
    module['lab_ids']=[l['id'] for l in lessons if l['module']==i]
    module['planned_lessons']=[l['title'] for l in lessons if l['module']==i]
plan['available_start_course_id']=COURSE
plan['guidance']='Bắt đầu bằng 6 bài nền tảng Windows 11 trên CLIENT01; tiếp tục PowerShell và IT Support theo kỹ năng cần luyện. Khóa mạng và các khóa đề cương còn lại chưa có đủ bài; không coi đề cương là đã triển khai. Thứ tự là khuyến nghị, không khóa bài đã có.'
if len(list((DATA/'labs').glob('win-nwf-*.json')))==6:
    plan['guidance']='Bắt đầu bằng Windows 11 nền tảng, sau đó mạng Windows và PowerShell trước khi luyện IT Support; các khóa đề cương còn lại chưa triển khai đủ bài. Thứ tự khuyến nghị, không khóa bài đã có.'
plan['updated_at']='2026-10-22';(DATA/'windows-roadmap.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
catalog=json.loads((DATA/'courses.json').read_text(encoding='utf-8'));c=next(c for c in catalog if c['id']==COURSE)
c.update(curriculum_status='implemented',curriculum_origin='locally-authored-microsoft-references',description='6 bài nền tảng trên Windows 11 CLIENT01: khảo sát hệ điều hành/công cụ, process/service/startup, user/SID/UAC, tệp/profile/NTFS, chuẩn bị bảo trì phần mềm/driver/update và diễn tập thay đổi–hoàn nguyên trên tệp mẫu. Có 12 nhiệm vụ kiểm tra dữ liệu thực tế; không đổi cấu hình hệ thống để làm bài.',skills=['Windows 11','IT Support','Tài khoản và UAC','NTFS','Bảo trì','Baseline và rollback'])
(DATA/'courses.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Built 6 Windows 11 foundation lessons / 12 tasks. No VM started or modified.')
