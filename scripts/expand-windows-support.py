"""Author 21 additional CLIENT01 lessons and trusted state probes. Never runs VM commands."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE = 'windows-11-it-support-troubleshooting'
LEARN = 'https://learn.microsoft.com/en-us/'
PS = LEARN + 'powershell/module/'
CMD = LEARN + 'windows-server/administration/windows-commands/'
LESSONS = []
ORDER = [
    'pc-onboarding-setup', 'asset-inventory', 'file-extension-fix', 'software-deployment',
    'app-config-repair', 'environment-path', 'local-accounts-audit', 'ntfs-permissions',
    'ip-route-diagnostics', 'dns-resolver-diagnostics', 'network-dns-troubleshoot',
    'tcp-port-diagnostics', 'firewall-audit', 'printer-spooler-fix', 'performance-triage',
    'disk-cleanup-recovery', 'backup-robocopy', 'deleted-file-restore', 'archive-restore-drill',
    'scheduled-backup-fix', 'event-log-triage', 'drivers-device-audit', 'windows-update-triage',
    'startup-audit', 'capstone-handover',
]


def stage(title, theory, command, expected, probe, question):
    return dict(title=title, theory=theory, command=command.strip(), expected=expected, probe=probe, question=question)


def lesson(slug, title, group, ticket, overview, gui, pitfalls, sources, stages, scenario=None):
    LESSONS.append(dict(slug=slug, title=title, group=group, ticket=ticket, overview=overview,
                        gui=gui, pitfalls=pitfalls, sources=sources, stages=stages, scenario=scenario))


lesson('asset-inventory', 'Tiếp nhận ticket và kiểm kê phần cứng, hệ điều hành', 'Nền tảng Helpdesk',
       'Máy nhân viên bị chậm; cần biết cấu hình và phạm vi ảnh hưởng trước khi sửa.',
       'Tách triệu chứng khỏi nguyên nhân. Thu thập tên thiết bị, thời điểm bắt đầu, thay đổi gần nhất và tác động kinh doanh. Dữ liệu cấu hình là mốc đối chiếu cho lần xử lý sau.',
       'Win+R trên thanh Desktop → msinfo32; xem System Summary. Mở Settings → System → About để đối chiếu thông tin.',
       'Không đưa mật khẩu, license key, email cá nhân hoặc file người dùng vào ticket. Dung lượng RAM của VM không đại diện cho mọi máy văn phòng.',
       [PS+'microsoft.powershell.management/get-computerinfo', PS+'cimcmdlets/get-ciminstance'], [
    stage('Ghi nhận cấu hình máy thật', 'CIM trả về đối tượng có trường dữ liệu; Format-Table chỉ phục vụ hiển thị. Xuất JSON trước khi định dạng để báo cáo còn truy vấn được.',
          r"""$p='C:\LabEx\Labs\win-it-asset-inventory'; New-Item -ItemType Directory -Path $p -Force | Out-Null
$os=Get-CimInstance Win32_OperatingSystem; $cs=Get-CimInstance Win32_ComputerSystem
[pscustomobject]@{ Computer=$env:COMPUTERNAME; OS=$os.Caption; Build=$os.BuildNumber; RAM=[int64]$cs.TotalPhysicalMemory } | ConvertTo-Json | Set-Content "$p\inventory.json" -Encoding UTF8
Get-Content "$p\inventory.json"
""".replace('$os', '$osInfo'),
          'inventory.json có tên CLIENT01, tên Windows, build và RAM lớn hơn 0.',
          "$r=Get-Content (Join-Path $labRoot 'inventory.json') -Raw | ConvertFrom-Json; $r.Computer -eq $env:COMPUTERNAME -and $r.Build -eq (Get-CimInstance Win32_OperatingSystem).BuildNumber -and [int64]$r.RAM -eq [int64](Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory",
          'Tại sao ghi “máy chậm” chưa đủ để quyết định nâng RAM?'),
    stage('Tạo phiếu tiếp nhận có thể bàn giao', 'Một ticket hữu ích ghi rõ triệu chứng, phạm vi, bằng chứng và bước tiếp theo. Chưa có bằng chứng thì ghi giả thuyết, không ghi là kết luận.',
          r"""$p='C:\LabEx\Labs\win-it-asset-inventory'
[pscustomobject]@{ Ticket='HD-201'; Computer=$env:COMPUTERNAME; Symptom='Slow application startup'; Scope='One workstation'; Evidence='inventory.json'; NextAction='Collect process and event evidence'; UserConfirmed=$false } | ConvertTo-Json | Set-Content "$p\ticket.json" -Encoding UTF8
Get-Content "$p\ticket.json"
""",
          'Phiếu có phạm vi một máy và chưa tự nhận đã được người dùng xác nhận.',
          "$r=Get-Content (Join-Path $labRoot 'ticket.json') -Raw | ConvertFrom-Json; $r.Ticket -eq 'HD-201' -and $r.Computer -eq $env:COMPUTERNAME -and $r.Scope -eq 'One workstation' -and $r.UserConfirmed -eq $false -and $r.NextAction.Length -gt 15",
          'Khi nào cần nâng mức ưu tiên và chuyển ticket cho System Administrator?')])

lesson('file-extension-fix', 'Tệp CSV không mở đúng: phần mở rộng kép và dữ liệu', 'Nền tảng Helpdesk',
       'Kế toán nhận invoice.csv nhưng Windows nhận là Text Document.',
       'Tên hiển thị, phần mở rộng và nội dung là ba thứ khác nhau. Đổi tên không chuyển đổi định dạng. Lab nạp một tệp CSV hợp lệ nhưng mang đuôi .csv.txt.',
       'File Explorer → View → Show → File name extensions. Mở C:\\LabEx\\PracticeFaults\\extension, xem Properties và mở bằng Notepad trước khi đổi tên.',
       'Không thử mở tệp lạ bằng cách tắt kiểm tra bảo mật. Không đổi hàng loạt phần mở rộng chỉ để làm biểu tượng đẹp hơn.',
       [CMD+'ren', PS+'microsoft.powershell.utility/import-csv'], [
    stage('Nhìn tên đầy đủ và đọc nội dung', 'Sau khi bấm Chuẩn bị sự cố và kết nối lại Desktop, tệp mẫu phải tồn tại với đuôi .csv.txt. Việc ẩn phần mở rộng có thể làm người dùng không nhận ra tên kép.',
          r"Get-ChildItem 'C:\LabEx\PracticeFaults\extension' -File | Select-Object Name,Extension,Length; Get-Content 'C:\LabEx\PracticeFaults\extension\invoice.csv.txt'",
          'Tên thật invoice.csv.txt; nội dung có cột Item,Quantity và hai dòng hàng hóa.',
          "$f='C:\\LabEx\\PracticeFaults\\extension\\invoice.csv.txt'; (Test-Path $f) -and (Get-Content $f -Raw).Contains('Keyboard,2')",
          'Vì sao invoice.csv.exe nguy hiểm dù File Explorer hiển thị thiếu đuôi?'),
    stage('Sửa tên rồi kiểm tra dữ liệu thật', 'Chỉ bỏ đuôi .txt vì nội dung đã là CSV. Sau thao tác phải đọc được hai bản ghi, không chỉ nhìn biểu tượng. Bấm Kiểm tra kết quả khi tên và nội dung đã đúng.',
          r"Rename-Item -LiteralPath 'C:\LabEx\PracticeFaults\extension\invoice.csv.txt' -NewName 'invoice.csv'; Import-Csv 'C:\LabEx\PracticeFaults\extension\invoice.csv' | Format-Table",
          'Hai bản ghi Keyboard/2 và Mouse/3. Hoàn nguyên kịch bản khi xong để chuyển bài.', None,
          'Nếu nội dung thật là XLSX, đổi đuôi sang CSV có tạo ra CSV hợp lệ không?')], 'extension')

lesson('software-deployment', 'Cài đặt, nâng phiên bản và gỡ ứng dụng portable nội bộ', 'Ứng dụng và cấu hình',
       'Cần triển khai công cụ nội bộ có phiên bản và kiểm tra sau cài đặt.',
       'Cài đặt là một thay đổi cần biết nguồn gốc, phiên bản, phạm vi và cách quay lui. Lab dùng script portable tự tạo, không tải EXE lạ và không giả là đang cài Microsoft Office.',
       'Mở File Explorer tới thư mục bài. So sánh mô hình portable với Settings → Apps → Installed apps: portable không nhất thiết có mục Uninstall.',
       'Không chạy mọi installer bằng quyền admin. Không dùng Win32_Product để kiểm kê MSI vì truy vấn có thể kích hoạt hành vi sửa chữa sản phẩm.',
       [PS+'microsoft.powershell.utility/get-filehash', 'https://support.microsoft.com/en-us/windows/uninstall-or-remove-apps-and-programs-in-windows-4b55f974-2cc6-2d2b-d092-5905080eaf98'], [
    stage('Triển khai bản 1.0 và ghi mã kiểm tra', 'Bản portable được cài bằng cách đặt file vào đúng thư mục. SHA256 dùng kiểm tra file có đổi; hash tự tính chưa chứng minh nhà phát hành đáng tin.',
          r"""$p='C:\LabEx\Labs\win-it-software-deployment'; New-Item -ItemType Directory -Path "$p\App" -Force | Out-Null
"Write-Output 'LabEx Tool 1.0'" | Set-Content "$p\App\tool.ps1" -Encoding UTF8
Get-FileHash "$p\App\tool.ps1" | Export-Csv "$p\install-manifest.csv" -NoTypeInformation
& "$p\App\tool.ps1"
""",
          'Công cụ in LabEx Tool 1.0; manifest chứa SHA256 khớp file đã triển khai.',
          "$f=Join-Path $labRoot 'App\\tool.ps1'; $m=Import-Csv (Join-Path $labRoot 'install-manifest.csv'); (Get-Content $f -Raw).Contains('LabEx Tool 1.0') -and $m.Hash -eq (Get-FileHash $f).Hash",
          'Hash từ chính website bị xâm nhập có đủ xác minh nguồn cài đặt không?'),
    stage('Nâng cấp có bản quay lui', 'Sao lưu bản đang chạy trước khi thay file. Trong thực tế cần xác minh chữ ký publisher, điều kiện license và thử trên nhóm nhỏ trước khi triển khai rộng.',
          r"""$p='C:\LabEx\Labs\win-it-software-deployment'; Copy-Item "$p\App\tool.ps1" "$p\tool-v1.rollback.ps1"
"Write-Output 'LabEx Tool 2.0'" | Set-Content "$p\App\tool.ps1" -Encoding UTF8
& "$p\App\tool.ps1"; Get-Content "$p\tool-v1.rollback.ps1"
""",
          'Bản đang triển khai 2.0, bản quay lui vẫn là 1.0. Khi gỡ portable, chỉ xóa thư mục App của bài sau khi lưu cấu hình cần giữ.',
          "(Get-Content (Join-Path $labRoot 'App\\tool.ps1') -Raw).Contains('LabEx Tool 2.0') -and (Get-Content (Join-Path $labRoot 'tool-v1.rollback.ps1') -Raw).Contains('LabEx Tool 1.0')",
          'Nếu bản mới lỗi, bạn khôi phục file và kiểm tra những gì trước khi đóng ticket?')])

lesson('app-config-repair', 'Ứng dụng không chạy do đường dẫn cấu hình sai', 'Ứng dụng và cấu hình',
       'Công cụ nội bộ báo không tìm thấy dữ liệu sau khi thay cấu hình.',
       'Lỗi ứng dụng không luôn do thiếu phần mềm hay Windows hỏng. Tái hiện thông báo, đối chiếu cấu hình với file thật và sửa thay đổi nhỏ nhất.',
       'Bấm Chuẩn bị sự cố; kết nối lại. File Explorer → C:\\LabEx\\PracticeFaults\\appconfig. Mở settings.json bằng Notepad; giữ bản sao trước khi sửa.',
       'Không sửa Registry toàn máy hoặc cài lại Windows cho lỗi đường dẫn cục bộ. Script run.ps1 của lab không phải ứng dụng của bên thứ ba.',
       [PS+'microsoft.powershell.utility/convertfrom-json', PS+'microsoft.powershell.management/test-path'], [
    stage('Tái hiện và cô lập nguyên nhân', 'Ứng dụng đọc DataFile từ JSON. File cấu hình hợp lệ về cú pháp vẫn có thể chứa đường dẫn không tồn tại. Đọc lỗi và kiểm tra từng đường dẫn.',
          r"Get-Content 'C:\LabEx\PracticeFaults\appconfig\settings.json'; Get-ChildItem 'C:\LabEx\PracticeFaults\appconfig'; & 'C:\LabEx\PracticeFaults\appconfig\run.ps1'",
          'Lệnh chạy ứng dụng báo lỗi DataFile; settings.json trỏ missing.txt trong khi dữ liệu thật là data.txt. Lỗi tái hiện ở bước này là có chủ đích.',
          "$p='C:\\LabEx\\PracticeFaults\\appconfig'; $c=Get-Content \"$p\\settings.json\" -Raw | ConvertFrom-Json; $c.DataFile -eq \"$p\\missing.txt\" -and (Test-Path \"$p\\data.txt\")",
          'Bạn phân biệt lỗi cấu hình và lỗi không đủ quyền đọc file bằng bằng chứng nào?'),
    stage('Sửa cấu hình và chạy lại nghiệp vụ', 'Giữ bản before để có thể so sánh và quay lui. Không chỉ tạo file missing.txt cho hết lỗi; cấu hình phải trỏ đúng dữ liệu được yêu cầu.',
          r"""$p='C:\LabEx\PracticeFaults\appconfig'; Copy-Item "$p\settings.json" "$p\settings.before.json"
@{ DataFile="$p\data.txt" } | ConvertTo-Json | Set-Content "$p\settings.json" -Encoding UTF8
& "$p\run.ps1"; Get-Content "$p\result.txt"
""",
          'Ứng dụng sinh LABEX APP OK: CLIENT01. Bộ chấm chạy lại phép kiểm tra chức năng. Hoàn nguyên kịch bản khi xong.', None,
          'Tại sao chỉ ghi “đã sửa file” chưa đủ để xác nhận ứng dụng hoạt động?')], 'appconfig')

lesson('environment-path', 'Command not found: PATH và phạm vi biến môi trường', 'Ứng dụng và cấu hình',
       'Công cụ tồn tại nhưng gọi tên lệnh không chạy được.',
       'PATH là danh sách thư mục shell tìm lệnh. Biến của process hiện tại khác biến User và Machine; PowerShell web tạo process mới cho mỗi lần gửi.',
       'Win+R → sysdm.cpl → Advanced → Environment Variables để quan sát. Bài này chỉ đổi PATH của process thử nghiệm, không sửa PATH hệ thống.',
       'Không ghi đè PATH máy bằng setx PATH. Không đặt thư mục Downloads hoặc thư mục mọi người có quyền ghi lên đầu PATH hệ thống.',
       [CMD+'setx', LEARN+'powershell/module/microsoft.powershell.core/about/about_environment_variables'], [
    stage('Tạo công cụ và thử bằng đường dẫn đầy đủ', 'Gọi đường dẫn đầy đủ giúp tách vấn đề tìm lệnh khỏi vấn đề nội dung lệnh. Dùng thư mục của lab, không thay công cụ Windows.',
          r"""$p='C:\LabEx\Labs\win-it-environment-path'; New-Item -ItemType Directory -Path "$p\Tools" -Force | Out-Null
'@echo LABEX-PATH-OK' | Set-Content "$p\Tools\labexhello.cmd" -Encoding ASCII
& "$p\Tools\labexhello.cmd"
""",
          'In LABEX-PATH-OK khi gọi file bằng đường dẫn đầy đủ.',
          "(Get-Content (Join-Path $labRoot 'Tools\\labexhello.cmd') -Raw).Trim() -eq '@echo LABEX-PATH-OK'",
          'Nếu gọi đường dẫn đầy đủ vẫn lỗi thì còn có thể quy cho PATH không?'),
    stage('Thử PATH trong một process rồi lưu bằng chứng', 'Gộp thay PATH và gọi lệnh trong cùng khối vì lần gửi sau là process khác. Bằng chứng phải ghi đường dẫn lệnh đã phân giải, không chỉ một dòng báo thành công.',
          r"""$p='C:\LabEx\Labs\win-it-environment-path'; $env:PATH="$p\Tools;$env:PATH"
$c=Get-Command labexhello.cmd; & $c.Source
[pscustomobject]@{ Command=$c.Source; Scope='Process'; Output=(& $c.Source | Out-String).Trim() } | ConvertTo-Json | Set-Content "$p\path-test.json" -Encoding UTF8""",
          'Command trỏ đúng Tools của bài; Scope là Process; kết quả LABEX-PATH-OK.',
          "$r=Get-Content (Join-Path $labRoot 'path-test.json') -Raw | ConvertFrom-Json; $r.Command -eq (Join-Path $labRoot 'Tools\\labexhello.cmd') -and $r.Scope -eq 'Process' -and $r.Output -eq 'LABEX-PATH-OK'",
          'Vì sao một cửa sổ terminal đang mở chưa nhìn thấy biến User vừa đổi?')])

lesson('local-accounts-audit', 'Tài khoản local, nhóm và nguyên tắc tối thiểu quyền', 'Tài khoản và quyền',
       'Nhân viên xin quyền admin để mở một thư mục dùng chung.',
       'Xác định quyền thực sự cần trước khi cấp. SID định danh tài khoản; tên hiển thị có thể thay đổi. Thực hành kiểm kê và tạo nhóm lab, không sửa tài khoản đăng nhập/RDP.',
       'Win+R → lusrmgr.msc → Users/Groups. Chỉ quan sát nhóm Administrators và Remote Desktop Users; không đổi thành viên của chúng.',
       'Không đặt lại mật khẩu tài khoản quản trị Azure, không vô hiệu hóa user đang đăng nhập và không thêm Everyone vào Administrators.',
       [CMD+'net-user', PS+'microsoft.powershell.localaccounts/get-localgroup'], [
    stage('Kiểm kê tài khoản mà không lộ bí mật', 'Không thể đọc mật khẩu local dạng rõ qua Get-LocalUser. Báo cáo cần trạng thái Enabled và SID để xác minh danh tính.',
          r"""$p='C:\LabEx\Labs\win-it-local-accounts-audit'; New-Item -ItemType Directory -Path $p -Force | Out-Null
Get-LocalUser | Select-Object Name,Enabled,@{n='SID';e={$_.SID.Value}} | Export-Csv "$p\users.csv" -NoTypeInformation -Encoding UTF8
Import-Csv "$p\users.csv" | Format-Table""",
          'CSV có tài khoản thật và SID dạng S-1-5-21-...',
          "$rows=@(Import-Csv (Join-Path $labRoot 'users.csv')); $rows.Count -gt 0 -and @($rows | Where-Object { $sid=$_.SID; @(Get-LocalUser | Where-Object { $_.SID.Value -eq $sid }).Count -eq 1 }).Count -eq $rows.Count",
          'Vì sao đổi tên một tài khoản không tự làm mất quyền NTFS đã cấp cho SID của nó?'),
    stage('Tạo nhóm chức năng riêng cho bài lab', 'Nhóm giúp cấp quyền theo vai trò thay vì theo từng người. Tạo nhóm riêng và mô tả rõ; bài không tạo user có mật khẩu yếu hoặc cấp quyền quản trị.',
          r"""if (-not (Get-LocalGroup -Name LabEx_DocReaders -ErrorAction SilentlyContinue)) { New-LocalGroup -Name LabEx_DocReaders -Description 'LabEx training document readers' }
Get-LocalGroup -Name LabEx_DocReaders | Select-Object Name,Description,SID""",
          'Nhóm LabEx_DocReaders tồn tại, mô tả đúng; chưa có quyền admin. Khi không học tiếp quyền NTFS, có thể Remove-LocalGroup riêng nhóm này sau khi chấm.',
          "$g=Get-LocalGroup -Name LabEx_DocReaders; $g.Description -eq 'LabEx training document readers' -and $g.SID.Value -like 'S-1-5-21-*'",
          'Nếu nhân viên chỉ cần đọc file, tại sao cấp admin không phải cách giải quyết phù hợp?')])

lesson('ntfs-permissions', 'Access denied: đọc ACL và cấp quyền đọc đúng nhóm', 'Tài khoản và quyền',
       'Nhóm Helpdesk cần đọc tài liệu nhưng không được quyền sửa.',
       'ACL gồm các ACE, quyền kế thừa và quyền trực tiếp. Quyền truy cập hiệu lực phụ thuộc token người dùng, nhóm và các ACE. SYSTEM có thể đọc được không có nghĩa user thường cũng đọc được.',
       'File Explorer → Properties thư mục bài → Security → Advanced. Đối chiếu principal, Applies to và quyền kế thừa.',
       'Chỉ thay ACL thư mục bài. Không dùng takeown/icacls /reset trên C:\\Windows hoặc cả ổ C. Bài kiểm tra ACE nhóm đọc, không giả lập một lần đăng nhập user thường.',
       [CMD+'icacls', PS+'microsoft.powershell.security/get-acl'], [
    stage('Tạo tài liệu và lưu ACL trước thay đổi', 'Bản ACL trước thay đổi giúp rollback có kiểm soát. Dùng SDDL để lưu cả cấu trúc quyền thay vì ảnh chụp một phần hộp thoại.',
          r"""$p='C:\LabEx\Labs\win-it-ntfs-permissions'; New-Item -ItemType Directory -Path "$p\Docs" -Force | Out-Null
'Read-only training document' | Set-Content "$p\Docs\guide.txt" -Encoding UTF8
(Get-Acl "$p\Docs").Sddl | Set-Content "$p\before.sddl" -Encoding ASCII
Get-Acl "$p\Docs" | Format-List""",
          'guide.txt tồn tại và before.sddl là mô tả ACL hợp lệ.',
          "$s=Get-Content (Join-Path $labRoot 'before.sddl') -Raw; $a=New-Object Security.AccessControl.DirectorySecurity; $a.SetSecurityDescriptorSddlForm($s.Trim()); (Test-Path (Join-Path $labRoot 'Docs\\guide.txt')) -and $s.Contains('D:')",
          'Deny và Allow có được xử lý chỉ bằng cách cộng tất cả quyền lại không?'),
    stage('Cấp ReadAndExecute cho nhóm lab', 'Không tắt inheritance hay thay owner. Thêm ACE Allow có phạm vi container và file con; giữ nguyên quyền quản trị sẵn có.',
          r"""$p='C:\LabEx\Labs\win-it-ntfs-permissions'; if (-not (Get-LocalGroup LabEx_DocReaders -ErrorAction SilentlyContinue)) { New-LocalGroup LabEx_DocReaders -Description 'LabEx training document readers' | Out-Null }
$acl=Get-Acl "$p\Docs"; $sid=(Get-LocalGroup LabEx_DocReaders).SID
$rule=New-Object Security.AccessControl.FileSystemAccessRule($sid,'ReadAndExecute','ContainerInherit,ObjectInherit','None','Allow')
$acl.SetAccessRule($rule); Set-Acl "$p\Docs" $acl
icacls "$p\Docs"
""",
          'ACE của LabEx_DocReaders là Allow ReadAndExecute có kế thừa (Windows có thể tự thêm cờ Synchronize); không FullControl/Modify. Muốn quay lui, đọc before.sddl vào DirectorySecurity rồi Set-Acl đúng Docs.',
          "$sid=(Get-LocalGroup LabEx_DocReaders).SID.Value; $a=Get-Acl (Join-Path $labRoot 'Docs'); @($a.Access | Where-Object { $_.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -eq $sid -and $_.AccessControlType -eq 'Allow' -and ([int]$_.FileSystemRights -band (-bnot [int][Security.AccessControl.FileSystemRights]::Synchronize)) -eq [int][Security.AccessControl.FileSystemRights]::ReadAndExecute -and $_.InheritanceFlags -eq [Security.AccessControl.InheritanceFlags]'ContainerInherit,ObjectInherit' -and -not $_.IsInherited }).Count -eq 1 -and -not $a.AreAccessRulesProtected",
          'Quyền Share và NTFS cùng áp dụng thế nào khi file được truy cập qua SMB?')])

lesson('backup-robocopy', 'Sao lưu thư mục bằng Robocopy và kiểm chứng SHA256', 'Sao lưu và khôi phục',
       'Trước khi sửa máy phải sao lưu tài liệu và chứng minh dữ liệu còn nguyên.',
       'Backup cần có phạm vi, tần suất, điểm lưu và thử phục hồi. Sao chép cùng ổ chỉ là bài tập; không chống mất cả VM, ransomware hoặc xóa nhầm cả hai bản.',
       'Mở Source và Backup trong thư mục bài bằng File Explorer. Xem dữ liệu trước và sau, nhưng dùng hash để xác minh thay vì chỉ nhìn tên file.',
       'Không dùng /MIR ở bài này: mirror có thể lan truyền thao tác xóa. Robocopy có mã 0–7 không phải thất bại sao chép; mã từ 8 cần xử lý.',
       [CMD+'robocopy', PS+'microsoft.powershell.utility/get-filehash'], [
    stage('Tạo tập dữ liệu và manifest trước backup', 'Đo dữ liệu trước khi sao lưu. SHA256 so sánh nội dung từng file; thời gian sửa đổi và kích thước giống nhau chưa đủ xác nhận trùng nội dung.',
          r"""$p='C:\LabEx\Labs\win-it-backup-robocopy'; New-Item -ItemType Directory -Path "$p\Source" -Force | Out-Null
'Quarterly plan HD-207' | Set-Content "$p\Source\plan.txt" -Encoding UTF8
'Budget=2000000' | Set-Content "$p\Source\budget.txt" -Encoding UTF8
Get-ChildItem "$p\Source" -File | Get-FileHash | Export-Csv "$p\manifest.csv" -NoTypeInformation""",
          'Hai file nguồn và manifest hai SHA256.',
          "$m=@(Import-Csv (Join-Path $labRoot 'manifest.csv')); $m.Count -eq 2 -and @($m | Where-Object { (Get-FileHash $_.Path).Hash -eq $_.Hash }).Count -eq 2",
          'Vì sao không nên bắt đầu bằng xóa file gốc rồi mới kiểm tra bản backup?'),
    stage('Backup có log và xác minh từng file', 'Dùng retry hữu hạn để không treo ticket hàng giờ. Mã thoát được chuẩn hóa sau khi kiểm tra vì executor web thường coi mã khác 0 là thất bại.',
          r"""$p='C:\LabEx\Labs\win-it-backup-robocopy'
robocopy "$p\Source" "$p\Backup" /E /COPY:DAT /R:1 /W:1 /LOG:"$p\robocopy.log"
$code=$LASTEXITCODE; if ($code -ge 8) { throw "Robocopy failed: $code" }
Get-ChildItem "$p\Backup" -File | Get-FileHash
$global:LASTEXITCODE=0""",
          'Hai file Backup có hash khớp manifest nguồn, log tồn tại. Trong thực tế cần thêm bản ngoài máy và bản offline/immutable theo chính sách.',
          "$m=@(Import-Csv (Join-Path $labRoot 'manifest.csv')); (Test-Path (Join-Path $labRoot 'robocopy.log')) -and $m.Count -eq 2 -and @($m | Where-Object { $b=Join-Path (Join-Path $labRoot 'Backup') (Split-Path $_.Path -Leaf); (Get-FileHash $b).Hash -eq $_.Hash -and (Get-FileHash $_.Path).Hash -eq $_.Hash }).Count -eq 2",
          'Bạn chọn RPO/RTO thế nào cho thư mục kế toán thay đổi mỗi giờ?')])

lesson('deleted-file-restore', 'Khôi phục tài liệu bị xóa từ bản backup đã xác minh', 'Sao lưu và khôi phục',
       'Nhân viên xóa nhầm hóa đơn; cần phục hồi đúng nội dung chứ không chỉ tạo file trùng tên.',
       'Lab chuẩn bị bản gốc, bản backup rồi xóa riêng file làm việc. Bạn phải xác định bản có thể phục hồi, tránh ghi đè dữ liệu mới và xác minh nội dung.',
       'Bấm Chuẩn bị sự cố → kết nối lại → C:\\LabEx\\PracticeFaults\\restorefile. Xem Backup, copy invoice.txt về thư mục cha bằng File Explorer hoặc PowerShell.',
       'Không ghi dữ liệu vào ổ thật đang cần cứu file đã xóa. Bài dùng backup có sẵn, không mô phỏng forensic undelete hay phục hồi sector.',
       ['https://support.microsoft.com/en-us/windows/experience/backup-recovery/backup-restore-and-recovery-in-windows', PS+'microsoft.powershell.management/copy-item'], [
    stage('Xác định điểm phục hồi và file còn giữ', 'File mất khỏi thư mục làm việc không đồng nghĩa backup cũng mất. Đọc bản backup trước, ghi lại nội dung cần trả lại và kiểm tra không có file mới cần bảo vệ.',
          r"Get-ChildItem 'C:\LabEx\PracticeFaults\restorefile' -Force; Get-Content 'C:\LabEx\PracticeFaults\restorefile\Backup\invoice.txt'; Get-FileHash 'C:\LabEx\PracticeFaults\restorefile\Backup\invoice.txt'",
          'invoice.txt gốc không tồn tại; Backup\\invoice.txt còn nguyên với mã HD-208.',
          "$p='C:\\LabEx\\PracticeFaults\\restorefile'; -not (Test-Path \"$p\\invoice.txt\") -and (Get-Content \"$p\\Backup\\invoice.txt\" -Raw).Contains('HD-208')",
          'Nếu người dùng đã tạo hóa đơn mới cùng tên, bạn phục hồi thế nào để không mất bản mới?'),
    stage('Phục hồi và kiểm tra toàn vẹn', 'Copy dữ liệu từ bản đã xác minh; không viết lại hóa đơn bằng trí nhớ. Bộ chấm so sánh SHA256 hai file nên một file rỗng cùng tên không đạt.',
          r"Copy-Item -LiteralPath 'C:\LabEx\PracticeFaults\restorefile\Backup\invoice.txt' -Destination 'C:\LabEx\PracticeFaults\restorefile\invoice.txt'; Get-FileHash 'C:\LabEx\PracticeFaults\restorefile\invoice.txt','C:\LabEx\PracticeFaults\restorefile\Backup\invoice.txt'",
          'Hai hash giống nhau. Cho người dùng xác nhận tài liệu; hoàn nguyên kịch bản sau khi chấm để chuyển bài.', None,
          'Backup thành công hàng ngày nhưng chưa từng thử restore có rủi ro gì?')], 'restorefile')

lesson('scheduled-backup-fix', 'Backup không chạy vì Scheduled Task bị vô hiệu hóa', 'Sao lưu và khôi phục',
       'Thư mục backup không có bản mới dù đã cấu hình lịch hàng ngày.',
       'Task Scheduler gồm trigger, action, principal và điều kiện chạy. Task tồn tại không có nghĩa đã chạy; LastTaskResult phải được đối chiếu với dữ liệu đầu ra.',
       'Bấm Chuẩn bị sự cố. Win+R → taskschd.msc → Task Scheduler Library → LabExSupportBackup. Xem trạng thái Disabled và action trước khi bật.',
       'Chỉ thay task LabExSupportBackup. Không sửa task của Azure Agent, Windows Update, Defender hoặc task portal DNS của bài khác.',
       [PS+'scheduledtasks/get-scheduledtask', PS+'scheduledtasks/get-scheduledtaskinfo'], [
    stage('Đọc trạng thái, action và lần chạy gần nhất', 'Phân biệt Disabled, Ready, Running. Action sai đường dẫn và thiếu quyền cũng gây lỗi dù task Enabled; không kết luận dựa một cột.',
          r"Get-ScheduledTask -TaskName LabExSupportBackup | Format-List TaskName,State,Actions,Principal; Get-ScheduledTaskInfo -TaskName LabExSupportBackup",
          'Task Disabled; action chạy backup.ps1 trong thư mục taskbackup.',
          "$t=Get-ScheduledTask -TaskName LabExSupportBackup; $t.State -eq 'Disabled' -and $t.Actions.Arguments -like '*C:\\LabEx\\PracticeFaults\\taskbackup\\backup.ps1*'",
          'LastTaskResult=0 từ lần chạy cũ có chứng minh backup hôm nay đã được tạo không?'),
    stage('Bật lịch và kiểm tra bản sao thật', 'Chạy thủ công giúp thử action ngay thay vì chờ tới ngày mai. Kiểm tra file mới và hash; sau đó mới tin lịch đã sửa.',
          r"Enable-ScheduledTask -TaskName LabExSupportBackup; Start-ScheduledTask -TaskName LabExSupportBackup; Start-Sleep -Seconds 3; Get-ScheduledTaskInfo -TaskName LabExSupportBackup; Get-FileHash 'C:\LabEx\PracticeFaults\taskbackup\Source\invoice.txt','C:\LabEx\PracticeFaults\taskbackup\Backup\invoice.txt'",
          'Task không Disabled, lần chạy trả 0, hai file khớp SHA256. Bộ chấm thử chạy lại task; hoàn nguyên khi xong.', None,
          'Vì sao task chạy dưới SYSTEM thấy thư mục mạng khác với user vừa đăng nhập?')], 'taskbackup')

lesson('archive-restore-drill', 'Backup ZIP và diễn tập khôi phục vào thư mục mới', 'Sao lưu và khôi phục',
       'Cần mang hồ sơ sang máy mới và thử bản nén có phục hồi được không.',
       'Một file ZIP tạo xong chưa là backup đã kiểm chứng. Phục hồi vào thư mục mới tránh ghi đè bản đang dùng; hash giúp xác minh nội dung.',
       'File Explorer → thư mục bài → mở archive.zip để xem cấu trúc. Extract All vào Restore để so sánh với Source.',
       'Compress-Archive bỏ qua một số file ẩn; không dùng bài ZIP để kết luận đã backup toàn bộ profile, ACL, EFS hay dữ liệu ứng dụng đang mở.',
       [PS+'microsoft.powershell.archive/compress-archive?view=powershell-5.1', PS+'microsoft.powershell.archive/expand-archive'], [
    stage('Tạo archive từ tài liệu mẫu', 'Chọn nội dung trong Source thay vì nén nhầm cả cây thư mục cha. Ghi manifest nguồn để lần phục hồi có chuẩn so sánh.',
          r"""$p='C:\LabEx\Labs\win-it-archive-restore-drill'; New-Item -ItemType Directory -Path "$p\Source" -Force | Out-Null
'Archive recovery HD-210' | Set-Content "$p\Source\notes.txt" -Encoding UTF8
Get-FileHash "$p\Source\notes.txt" | Export-Csv "$p\manifest.csv" -NoTypeInformation
Compress-Archive -Path "$p\Source\*" -DestinationPath "$p\archive.zip" -Force""",
          'ZIP hợp lệ có entry notes.txt; nguồn và manifest còn giữ.',
          "Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead((Join-Path $labRoot 'archive.zip')); try { @($z.Entries | Where-Object FullName -eq 'notes.txt').Count -eq 1 } finally { $z.Dispose() }",
          'Vì sao không nên kiểm tra backup chỉ bằng kích thước file ZIP?'),
    stage('Restore và so hash', 'Giải nén vào Restore, không giải đè Source. Việc thử phục hồi xác nhận cả định dạng archive và khả năng lấy dữ liệu ra.',
          r"""$p='C:\LabEx\Labs\win-it-archive-restore-drill'; Expand-Archive -LiteralPath "$p\archive.zip" -DestinationPath "$p\Restore" -Force
Get-FileHash "$p\Source\notes.txt","$p\Restore\notes.txt"
""",
          'Hai hash khớp với manifest, nội dung có mã HD-210.',
          "$m=Import-Csv (Join-Path $labRoot 'manifest.csv'); $a=Join-Path $labRoot 'Source\\notes.txt'; $b=Join-Path $labRoot 'Restore\\notes.txt'; (Get-FileHash $a).Hash -eq $m.Hash -and (Get-FileHash $b).Hash -eq $m.Hash -and (Get-Content $b -Raw).Contains('HD-210')",
          'Bạn cần thêm thử nghiệm gì trước khi dùng cùng quy trình cho dữ liệu đang được phần mềm kế toán ghi?')])

lesson('ip-route-diagnostics', 'Mất mạng: đọc IP, gateway, DHCP và bảng định tuyến', 'Mạng máy trạm',
       'Người dùng nói mất mạng; cần xác định lỗi IP, tuyến đi hay dịch vụ đích.',
       'Đi từ link → địa chỉ IP → tuyến đi → DNS → cổng ứng dụng. Azure quản lý IP riêng qua DHCP; cấu hình IP tĩnh bên trong guest sai có thể làm mất RDP.',
       'Settings → Network & internet → Ethernet để đọc cấu hình. Win+R → ncpa.cpl để xem adapter; không disable adapter Azure.',
       'Không chạy ipconfig /release, netsh reset, Disable-NetAdapter hoặc đổi gateway của NIC đang dùng RDP. APIPA 169.254/16 là dấu hiệu cần điều tra DHCP, không tự nó chứng minh dây mạng hỏng.',
       [LEARN+'troubleshoot/windows-server/networking/troubleshoot-tcp-ip-communication-guidance', PS+'nettcpip/get-netipconfiguration'], [
    stage('Chụp thông tin IPv4 của adapter thật', 'Lưu các trường cấu hình để có thể đối chiếu trước/sau. Không nhầm IP public của Azure với địa chỉ private trên NIC của Windows.',
          r"""$p='C:\LabEx\Labs\win-it-ip-route-diagnostics'; New-Item -ItemType Directory -Path $p -Force | Out-Null
Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceIndex,InterfaceAlias,IPAddress,PrefixLength | Export-Csv "$p\ipv4.csv" -NoTypeInformation
ipconfig /all; Import-Csv "$p\ipv4.csv" | Format-Table""",
          'CSV có ít nhất một IPv4 không phải loopback và thông tin adapter.',
          "$rows=@(Import-Csv (Join-Path $labRoot 'ipv4.csv')); @($rows | Where-Object { $_.IPAddress -ne '127.0.0.1' -and @(Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -eq $_.IPAddress).Count -gt 0 }).Count -gt 0".replace("Where-Object IPAddress -eq $_.IPAddress", "Where-Object { $false }"),
          'Vì sao máy có IP hợp lệ vẫn có thể không truy cập được website?'),
    stage('Đọc default route và ghi giả thuyết', 'Default route chọn đường cho đích không khớp tuyến cụ thể hơn. Gateway không trả ping không đồng nghĩa mất mạng vì ICMP có thể bị lọc.',
          r"""$p='C:\LabEx\Labs\win-it-ip-route-diagnostics'; Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' | Select-Object DestinationPrefix,NextHop,InterfaceIndex,RouteMetric | Export-Csv "$p\routes.csv" -NoTypeInformation
Get-NetIPConfiguration | Format-List InterfaceAlias,IPv4Address,IPv4DefaultGateway,DNSServer
Import-Csv "$p\routes.csv" | Format-Table""",
          'routes.csv có default route khớp trạng thái NIC hiện tại. Đây là bài chẩn đoán cấu hình, chưa nạp lỗi DHCP thật.',
          "$rows=@(Import-Csv (Join-Path $labRoot 'routes.csv')); @($rows | Where-Object { $hop=$_.NextHop; $_.DestinationPrefix -eq '0.0.0.0/0' -and @(Get-NetRoute -DestinationPrefix '0.0.0.0/0' -AddressFamily IPv4 | Where-Object NextHop -eq $hop).Count -gt 0 }).Count -gt 0",
          'Máy chỉ vào được cùng subnet nhưng không ra subnet khác: bạn kiểm tra trường nào trước?')])
# Explicitly scoped variable avoids the nested $_ trap in a PowerShell pipeline.
LESSONS[-1]['stages'][0]['probe'] = "$rows=@(Import-Csv (Join-Path $labRoot 'ipv4.csv')); @($rows | Where-Object { $ip=$_.IPAddress; $ip -ne '127.0.0.1' -and @(Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -eq $ip).Count -gt 0 }).Count -gt 0"

lesson('dns-resolver-diagnostics', 'DNS, hosts và cache: phân biệt các đường phân giải', 'Mạng máy trạm',
       'Một tên truy cập được trên máy này nhưng không được trên máy khác.',
       'Resolver có thể dùng hosts, cache và DNS. Công cụ truy vấn DNS trực tiếp không luôn phản ánh kết quả ứng dụng nhìn thấy. Quan sát trước khi xóa cache.',
       'Win+R → notepad để đọc hosts; chỉ mở đọc. Dùng PowerShell quan sát DNS server của adapter và cache hiện tại.',
       'Không thay DNS server Azure bằng địa chỉ ngẫu nhiên. Không đưa toàn bộ cache DNS thật của người dùng lên diễn đàn công khai.',
       [LEARN+'windows-server/networking/dns/troubleshoot/troubleshoot-dns-data-collection', CMD+'ipconfig'], [
    stage('Ghi DNS server đang cấu hình', 'DNS server là nơi hỏi tên; gateway là next hop. Hai vai trò khác nhau dù trong một số mạng nhỏ chúng cùng địa chỉ.',
          r"""$p='C:\LabEx\Labs\win-it-dns-resolver-diagnostics'; New-Item -ItemType Directory -Path $p -Force | Out-Null
Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses.Count -gt 0 } | Select-Object InterfaceAlias,@{n='Servers';e={$_.ServerAddresses -join ';'}} | Export-Csv "$p\dns-servers.csv" -NoTypeInformation
Import-Csv "$p\dns-servers.csv" | Format-Table""",
          'Báo cáo chứa ít nhất một DNS server đang cấu hình thật.',
          "$rows=@(Import-Csv (Join-Path $labRoot 'dns-servers.csv')); $actual=@(Get-DnsClientServerAddress -AddressFamily IPv4 | ForEach-Object ServerAddresses); @($rows | Where-Object { $servers=$_.Servers -split ';'; @($servers | Where-Object { $actual -contains $_ }).Count -gt 0 }).Count -gt 0",
          'Vì sao ping IP được nhưng truy cập bằng tên không được thường khiến bạn nghĩ tới resolver?'),
    stage('Thử resolver mà không phụ thuộc Internet', 'localhost là trường hợp cục bộ phù hợp cho kiểm tra offline. So sánh với bài portal.company.local đã học để hiểu vai trò hosts.',
          r"""$p='C:\LabEx\Labs\win-it-dns-resolver-diagnostics'; $a=@([Net.Dns]::GetHostAddresses('localhost') | ForEach-Object IPAddressToString)
[pscustomobject]@{ Name='localhost'; Addresses=$a; Note='Local resolver, not proof of public DNS health' } | ConvertTo-Json | Set-Content "$p\resolver.json" -Encoding UTF8
Get-Content "$p\resolver.json"
""",
          'Có 127.0.0.1 hoặc ::1; không coi đây là bằng chứng Internet hay DNS công ty hoạt động.',
          "$r=Get-Content (Join-Path $labRoot 'resolver.json') -Raw | ConvertFrom-Json; $r.Name -eq 'localhost' -and (@($r.Addresses) -contains '127.0.0.1' -or @($r.Addresses) -contains '::1') -and $r.Note -like '*not proof*'",
          'Vì sao nslookup có thể báo khác ứng dụng sau khi bạn sửa hosts?')])

lesson('tcp-port-diagnostics', 'Website không mở: kiểm tra TCP listener và cổng dịch vụ', 'Mạng máy trạm',
       'Máy có mạng nhưng một ứng dụng vẫn không kết nối được.',
       'Kết nối IP không xác nhận dịch vụ ứng dụng. Phải có process đang listen đúng địa chỉ/cổng, đường đi thông và giao thức ứng dụng phù hợp.',
       'Mở Resource Monitor bằng resmon → Network → Listening Ports. Quan sát process và địa chỉ bind; dùng listener loopback của riêng bài.',
       'Listener chỉ bind 127.0.0.1 nên không mở dịch vụ ra Internet. Không đổi RDP 3389 hoặc NSG của VM.',
       [PS+'nettcpip/get-nettcpconnection', PS+'nettcpip/test-netconnection'], [
    stage('Thực nghiệm một cổng đang mở', 'Listener tồn tại trong một process rồi được đóng trong finally. Cả tạo listener và thử kết nối phải ở cùng khối lệnh để không bị mất process giữa hai lần gửi.',
          r"""$p='C:\LabEx\Labs\win-it-tcp-port-diagnostics'; New-Item -ItemType Directory -Path $p -Force | Out-Null
$listener=New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback,18081)
try { $listener.Start(); $c=New-Object Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1',18081); [pscustomobject]@{ Address='127.0.0.1'; Port=18081; Connected=$c.Connected } | ConvertTo-Json | Set-Content "$p\open.json" -Encoding UTF8 } finally { $c.Dispose() } } finally { $listener.Stop() }""",
          'open.json ghi Connected=true khi listener tồn tại.',
          "$r=Get-Content (Join-Path $labRoot 'open.json') -Raw | ConvertFrom-Json; $r.Address -eq '127.0.0.1' -and $r.Port -eq 18081 -and $r.Connected -eq $true",
          'Listen trên 127.0.0.1 khác listen trên 0.0.0.0 như thế nào?'),
    stage('Thử lại khi dịch vụ đã dừng', 'Cùng một địa chỉ có thể truy cập IP bình thường nhưng bị từ chối TCP khi không có listener. Đo kết quả thật, không ghi tay giá trị False.',
          r"""$p='C:\LabEx\Labs\win-it-tcp-port-diagnostics'; $c=New-Object Net.Sockets.TcpClient
try { $ok=$false; try { $t=$c.ConnectAsync('127.0.0.1',18081); if ($t.Wait(1500)) { $ok=$c.Connected } } catch { $ok=$false }; [pscustomobject]@{ Address='127.0.0.1'; Port=18081; Connected=$ok; Conclusion='No listener is different from DNS failure' } | ConvertTo-Json | Set-Content "$p\closed.json" -Encoding UTF8 } finally { $c.Dispose() }""",
          'closed.json Connected=false; không còn listener trên port 18081.',
          "$r=Get-Content (Join-Path $labRoot 'closed.json') -Raw | ConvertFrom-Json; $r.Port -eq 18081 -and $r.Connected -eq $false -and @(Get-NetTCPConnection -State Listen -LocalPort 18081 -ErrorAction SilentlyContinue).Count -eq 0",
          'TCP 443 mở có đảm bảo chứng chỉ TLS hoặc đăng nhập ứng dụng hợp lệ không?')])

lesson('firewall-audit', 'Chẩn đoán Windows Firewall mà không tắt bảo vệ', 'Mạng máy trạm',
       'Ứng dụng không kết nối; người dùng đề nghị tắt Firewall toàn máy.',
       'Đọc profile và rule theo chiều Inbound/Outbound, protocol, port và phạm vi địa chỉ. Không suy luận chỉ từ tên rule.',
       'Win+R → wf.msc → Windows Defender Firewall Properties rồi Inbound/Outbound Rules. Chỉ quan sát rule Remote Desktop, không disable.',
       'Bài này kiểm kê, không nạp lỗi Firewall. Tắt toàn bộ Firewall có thể mở dịch vụ không liên quan và không xác định được rule gây lỗi.',
       [PS+'netsecurity/get-netfirewallrule', PS+'netsecurity/get-netfirewallprofile'], [
    stage('Ghi trạng thái từng profile', 'Domain, Private và Public có cấu hình khác nhau. Trạng thái profile không trực tiếp cho biết NIC đang dùng profile nào; cần đọc thêm Get-NetConnectionProfile.',
          r"""$p='C:\LabEx\Labs\win-it-firewall-audit'; New-Item -ItemType Directory -Path $p -Force | Out-Null
Get-NetFirewallProfile | Select-Object Name,Enabled,DefaultInboundAction,DefaultOutboundAction | Export-Csv "$p\profiles.csv" -NoTypeInformation
Get-NetConnectionProfile | Format-Table; Import-Csv "$p\profiles.csv" | Format-Table""",
          'Báo cáo ba profile; trường Enabled khớp máy hiện tại. Không cần tắt profile nào để đạt bài.',
          "$r=@(Import-Csv (Join-Path $labRoot 'profiles.csv')); $r.Count -eq 3 -and @($r | Where-Object { $n=$_.Name; $e=$_.Enabled; @(Get-NetFirewallProfile | Where-Object { $_.Name -eq $n -and [string]$_.Enabled -eq $e }).Count -eq 1 }).Count -eq 3",
          'Vì sao rule chỉ bật cho Private có thể không áp dụng trên mạng Public?'),
    stage('Tách rule và bộ lọc port', 'Cmdlet Get-NetFirewallRule không hiển thị tất cả điều kiện port trực tiếp. Kết hợp PortFilter để điều tra, không sửa rule dựa vào DisplayName được dịch.',
          r"""$p='C:\LabEx\Labs\win-it-firewall-audit'
Get-NetFirewallRule -Name 'RemoteDesktop-UserMode-In-TCP' | ForEach-Object { $r=$_; $f=$r | Get-NetFirewallPortFilter; [pscustomobject]@{ Name=$r.Name; Direction=[string]$r.Direction; Action=[string]$r.Action; Protocol=[string]$f.Protocol; LocalPort=[string]$f.LocalPort } } | Export-Csv "$p\rdp-rule.csv" -NoTypeInformation
Import-Csv "$p\rdp-rule.csv" | Format-List""",
          'Rule RDP inbound có protocol TCP và local port 3389; đây chỉ là quan sát một rule, không kết luận toàn bộ effective policy.',
          "$r=Import-Csv (Join-Path $labRoot 'rdp-rule.csv'); $f=Get-NetFirewallRule -Name 'RemoteDesktop-UserMode-In-TCP' | Get-NetFirewallPortFilter; $r.Name -eq 'RemoteDesktop-UserMode-In-TCP' -and $r.LocalPort -eq [string]$f.LocalPort -and $r.Protocol -eq [string]$f.Protocol",
          'Ngoài Windows Firewall, Azure còn lớp nào có thể chặn kết nối từ Internet?')])

lesson('event-log-triage', 'Event Viewer: thu thập log và dựng dòng thời gian sự cố', 'Chẩn đoán hệ thống',
       'Ứng dụng báo lỗi lúc sáng; cần bằng chứng để chuyển đúng đội hỗ trợ.',
       'Event ID chỉ có ý nghĩa cùng Provider, thời gian, channel và nội dung. Một lỗi xuất hiện gần thời điểm không tự chứng minh nó là nguyên nhân.',
       'Win+R → eventvwr.msc → Windows Logs → System; Filter Current Log theo thời gian sự cố; mở General và Details.',
       'Không Clear Log để “sửa lỗi”. Log có thể chứa tên máy, đường dẫn và tài khoản; chỉ chia sẻ phần cần thiết.',
       [PS+'microsoft.powershell.diagnostics/get-winevent', CMD+'wevtutil'], [
    stage('Xuất sự kiện thật có cấu trúc', 'Get-WinEvent là đối tượng có thể lọc. Lưu XML hoặc EVTX khi cần điều tra sâu; CSV là bản tóm tắt để xử lý ticket.',
          r"""$p='C:\LabEx\Labs\win-it-event-log-triage'; New-Item -ItemType Directory -Path $p -Force | Out-Null
Get-WinEvent -LogName System -MaxEvents 20 | Select-Object RecordId,Id,ProviderName,TimeCreated,LevelDisplayName,Message | Export-Csv "$p\system-events.csv" -NoTypeInformation -Encoding UTF8
Import-Csv "$p\system-events.csv" | Select-Object -First 5 RecordId,Id,ProviderName,TimeCreated""",
          'Có sự kiện thật; RecordId dùng đối chiếu lại với System channel.',
          "$r=@(Import-Csv (Join-Path $labRoot 'system-events.csv')); $r.Count -gt 0 -and @($r | Select-Object -First 3 | Where-Object { $id=[long]$_.RecordId; @(Get-WinEvent -LogName System -FilterXPath \"*[System[EventRecordID=$id]]\" -MaxEvents 1).Count -eq 1 }).Count -gt 0",
          'Event ID 1000 của provider A có chắc cùng ý nghĩa với provider B không?'),
    stage('Lưu bản log gốc để bàn giao', 'EVTX giữ cấu trúc gốc và có thể mở lại bằng Event Viewer. Xuất không làm xóa hay tắt log đang ghi.',
          r"""$p='C:\LabEx\Labs\win-it-event-log-triage'; wevtutil epl System "$p\system.evtx" /ow:true
Get-WinEvent -Path "$p\system.evtx" -MaxEvents 3 | Select-Object Id,ProviderName,TimeCreated""",
          'system.evtx mở đọc được và có sự kiện. Trước khi chia sẻ thật cần xét dữ liệu nhạy cảm và giới hạn thời gian/phạm vi.',
          "@(Get-WinEvent -Path (Join-Path $labRoot 'system.evtx') -MaxEvents 1).Count -eq 1",
          'Nếu lỗi xảy ra 10:00 nhưng giờ máy lệch 7 tiếng, dòng thời gian có thể sai ra sao?')])

lesson('performance-triage', 'Máy chậm: phân biệt CPU, RAM, tiến trình và đĩa', 'Chẩn đoán hệ thống',
       'Ứng dụng mở chậm; người dùng cho rằng máy nhiễm virus.',
       'Đo trước khi kết luận. CPU là tốc độ công việc, RAM là dung lượng sử dụng, IO là hoạt động đĩa; một lần đo không đại diện cho cả ngày.',
       'Ctrl+Shift+Esc trong VM hoặc Win+R → taskmgr. Xem Processes và Performance; Resource Monitor giúp xem chi tiết bộ nhớ/đĩa.',
       'Không End task Azure Agent, RDP, LSASS hoặc process hệ thống. CPU trong Get-Process là thời gian CPU tích lũy, không phải phần trăm tức thời.',
       [PS+'microsoft.powershell.management/get-process', PS+'cimcmdlets/get-ciminstance'], [
    stage('Lấy mẫu tiến trình', 'WorkingSet64 là bộ nhớ resident của process, không phải toàn bộ commit hệ thống. Ghi tên và PID để có thể đối chiếu tại thời điểm đo.',
          r"""$p='C:\LabEx\Labs\win-it-performance-triage'; New-Item -ItemType Directory -Path $p -Force | Out-Null
Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 ProcessName,Id,CPU,WorkingSet64 | Export-Csv "$p\processes.csv" -NoTypeInformation
Import-Csv "$p\processes.csv" | Format-Table""",
          'Tối đa 10 process có PID, tên và WorkingSet64; dữ liệu thay đổi theo thời điểm.',
          "$r=@(Import-Csv (Join-Path $labRoot 'processes.csv')); $r.Count -ge 1 -and $r.Count -le 10 -and @($r | Where-Object { $_.ProcessName.Length -gt 0 -and [long]$_.WorkingSet64 -gt 0 }).Count -eq $r.Count",
          'Một process có CPU tích lũy cao nhưng đã chạy 20 ngày có chắc đang gây chậm ngay bây giờ?'),
    stage('Đọc RAM và dung lượng đĩa trước khi đề xuất', 'FreePhysicalMemory của Win32_OperatingSystem dùng KiB. Phân biệt cạn dung lượng đĩa với đĩa IO cao; đó là hai phép đo khác nhau.',
          r"""$p='C:\LabEx\Labs\win-it-performance-triage'; $o=Get-CimInstance Win32_OperatingSystem; $d=Get-PSDrive C
[pscustomobject]@{ Computer=$env:COMPUTERNAME; TotalRAMKiB=[long]$o.TotalVisibleMemorySize; FreeRAMKiB=[long]$o.FreePhysicalMemory; DiskFreeBytes=[long]$d.Free; SampleTime=(Get-Date).ToString('o') } | ConvertTo-Json | Set-Content "$p\capacity.json" -Encoding UTF8
Get-Content "$p\capacity.json"
""",
          'Free RAM nằm trong 0..Total; DiskFreeBytes không âm; chưa kết luận malware chỉ từ mẫu này.',
          "$r=Get-Content (Join-Path $labRoot 'capacity.json') -Raw | ConvertFrom-Json; $r.Computer -eq $env:COMPUTERNAME -and [long]$r.TotalRAMKiB -eq [long](Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize -and [long]$r.FreeRAMKiB -ge 0 -and [long]$r.FreeRAMKiB -le [long]$r.TotalRAMKiB -and [long]$r.DiskFreeBytes -ge 0",
          'Khi nào nên thu thập chuỗi đo dài thay vì nâng RAM ngay?')])

lesson('drivers-device-audit', 'Device Manager: chẩn đoán driver và thiết bị ngoại vi', 'Chẩn đoán hệ thống',
       'Chuột, âm thanh hoặc thiết bị ngoại vi không hoạt động sau cập nhật.',
       'Device Manager liên kết thiết bị với driver và mã lỗi. VM có phần cứng ảo nên không thay thế kiểm thử cáp USB, máy in vật lý hay Wi-Fi trên laptop.',
       'Win+R → devmgmt.msc; mở Properties thiết bị → General, Driver, Details → Hardware Ids. Ghi mã lỗi thay vì chỉ ghi “tam giác vàng”.',
       'Không uninstall NIC, controller ổ đĩa hoặc display adapter của VM đang học. Không tải driver từ website tổng hợp không rõ publisher.',
       [LEARN+'windows-hardware/drivers/install/using-device-manager', LEARN+'troubleshoot/windows-client/setup-upgrade-and-drivers/windows-device-and-driver-management-overview'], [
    stage('Kiểm kê PnP và mã lỗi', 'ConfigManagerErrorCode=0 nghĩa không có lỗi cấu hình được báo tại thời điểm đọc, không bảo đảm thiết bị vật lý hoạt động hoàn hảo.',
          r"""$p='C:\LabEx\Labs\win-it-drivers-device-audit'; New-Item -ItemType Directory -Path $p -Force | Out-Null
Get-CimInstance Win32_PnPEntity | Select-Object Name,PNPDeviceID,ConfigManagerErrorCode | Export-Csv "$p\devices.csv" -NoTypeInformation -Encoding UTF8
Import-Csv "$p\devices.csv" | Select-Object -First 10""",
          'devices.csv có PNPDeviceID thật và mã trạng thái; không cần tạo lỗi driver để đạt bài.',
          "$r=@(Import-Csv (Join-Path $labRoot 'devices.csv')); $actual=@(Get-CimInstance Win32_PnPEntity | ForEach-Object PNPDeviceID); @($r | Where-Object { $actual -contains $_.PNPDeviceID }).Count -gt 0",
          'Bạn kiểm tra gì trước khi rollback driver thiết bị đang dùng cho kết nối từ xa?'),
    stage('Ghi publisher và phiên bản driver', 'Mốc driver version, signer và DeviceID giúp so sánh trước/sau update. Chỉ số IsSigned không thay cho việc kiểm tra nguồn tải và mức phù hợp thiết bị.',
          r"""$p='C:\LabEx\Labs\win-it-drivers-device-audit'; Get-CimInstance Win32_PnPSignedDriver | Select-Object -First 30 DeviceID,DeviceName,DriverVersion,DriverProviderName,IsSigned | Export-Csv "$p\drivers.csv" -NoTypeInformation -Encoding UTF8
Import-Csv "$p\drivers.csv" | Select-Object -First 5""",
          'Báo cáo có driver version và DeviceID đối chiếu được trên VM.',
          "$r=@(Import-Csv (Join-Path $labRoot 'drivers.csv')); $actual=@(Get-CimInstance Win32_PnPSignedDriver | ForEach-Object DeviceID); @($r | Where-Object { $_.DriverVersion.Length -gt 0 -and $actual -contains $_.DeviceID }).Count -gt 0",
          'Nếu VM không có Wi-Fi hardware, tại sao bạn không thể thực nghiệm lỗi sóng Wi-Fi thật trong bài này?')])

lesson('windows-update-triage', 'Windows Update và hệ thống: kiểm tra trước khi repair', 'Chẩn đoán hệ thống',
       'Update báo lỗi; cần ghi build, bản vá và trạng thái component store.',
       'Sửa lỗi update phải đọc mã lỗi, dung lượng trống, lịch sử và khả năng reboot. Không xóa cache update hoặc chạy repair nặng trước khi thu thập bằng chứng.',
       'Settings → Windows Update → Update history. Win+R → winver để xem build. Chỉ quan sát; chưa bấm cài bản cập nhật hay Restart.',
       'Không tự reboot phiên Azure. DISM CheckHealth đọc cờ hỏng đã ghi nhận, không quét toàn bộ như ScanHealth; kết quả healthy không bảo đảm mọi file hệ thống tốt.',
       ['https://support.microsoft.com/en-gb/windows/deployment/updates-lifecycle/troubleshoot-problems-updating-windows', LEARN+'windows-hardware/manufacture/desktop/repair-a-windows-image?view=windows-11'], [
    stage('Ghi build và bản vá đang có', 'Get-HotFix chỉ liệt kê một số dạng bản vá, không phải toàn bộ mọi update trong Settings. Ghi giới hạn này khi bàn giao.',
          r"""$p='C:\LabEx\Labs\win-it-windows-update-triage'; New-Item -ItemType Directory -Path $p -Force | Out-Null
$o=Get-CimInstance Win32_OperatingSystem; [pscustomobject]@{ Computer=$env:COMPUTERNAME; Build=$o.BuildNumber; Caption=$o.Caption } | ConvertTo-Json | Set-Content "$p\build.json" -Encoding UTF8
Get-HotFix | Select-Object HotFixID,Description,InstalledOn | Export-Csv "$p\hotfixes.csv" -NoTypeInformation
Get-Content "$p\build.json"
""",
          'Build khớp Win32_OperatingSystem; hotfixes.csv là dữ liệu thu thập, không tuyên bố đã đủ mọi patch.',
          "$r=Get-Content (Join-Path $labRoot 'build.json') -Raw | ConvertFrom-Json; $r.Build -eq (Get-CimInstance Win32_OperatingSystem).BuildNumber -and (Test-Path (Join-Path $labRoot 'hotfixes.csv'))",
          'Làm sao phân biệt một máy đang chờ reboot với một máy thật sự thiếu bản vá?'),
    stage('Chạy DISM CheckHealth không thay đổi hệ thống', 'Repair-WindowsImage -CheckHealth là cách PowerShell đọc trạng thái component store. ScanHealth, RestoreHealth và sfc /scannow có phạm vi/thời gian khác; chỉ dùng sau khi đã chuẩn bị maintenance và rollback.',
          r"""$p='C:\LabEx\Labs\win-it-windows-update-triage'; $r=Repair-WindowsImage -Online -CheckHealth
[pscustomobject]@{ ImageHealthState=[string]$r.ImageHealthState; RestartNeeded=[bool]$r.RestartNeeded; Mode='CheckHealth' } | ConvertTo-Json | Set-Content "$p\health.json" -Encoding UTF8
Get-Content "$p\health.json"
""",
          'Lưu trạng thái Healthy/Repairable/NonRepairable thực tế. Không yêu cầu máy phải Healthy để đạt bước chẩn đoán.',
          "$r=Get-Content (Join-Path $labRoot 'health.json') -Raw | ConvertFrom-Json; $r.Mode -eq 'CheckHealth' -and @('Healthy','Repairable','NonRepairable') -contains $r.ImageHealthState",
          'CheckHealth không thấy corruption thì bạn có thể khẳng định không cần đọc mã lỗi Windows Update nữa không?')])

lesson('startup-audit', 'Khởi động chậm: phân biệt Startup app, service và scheduled task', 'Chẩn đoán hệ thống',
       'Sau đăng nhập mở nhiều chương trình; muốn tìm mục khởi động không cần thiết.',
       'Startup Apps chỉ là một nhóm trong nhiều cơ chế tự chạy. Phải phân biệt ngữ cảnh user và machine, publisher và tác động trước khi disable.',
       'Settings → Apps → Startup và Task Manager → Startup apps. Chỉ quan sát. Với task, dùng taskschd.msc; với service dùng services.msc.',
       'Không dùng msconfig Diagnostic startup trên VM từ xa: có thể tắt networking. Không tắt Azure Agent/RDP/Defender để tăng tốc.',
       ['https://support.microsoft.com/en-us/windows/experience/startup-boot/configure-startup-applications-in-windows', 'https://support.microsoft.com/en-us/windows/experience/startup-boot/how-to-perform-a-clean-boot-in-windows'], [
    stage('Đọc startup theo ngữ cảnh thực thi', 'PowerShell web chạy SYSTEM nên HKCU không phải user đang mở Desktop. Win32_StartupCommand giúp quan sát nhiều vị trí cùng User; không coi đây là toàn bộ persistence trên máy.',
          r"""$p='C:\LabEx\Labs\win-it-startup-audit'; New-Item -ItemType Directory -Path $p -Force | Out-Null
$r=@(Get-CimInstance Win32_StartupCommand | Select-Object Name,Command,Location,User)
ConvertTo-Json -InputObject @{ Items=$r } -Depth 4 | Set-Content "$p\startup.json" -Encoding UTF8
[pscustomobject]@{ Computer=$env:COMPUTERNAME; Context=[Security.Principal.WindowsIdentity]::GetCurrent().Name; Count=$r.Count } | ConvertTo-Json | Set-Content "$p\context.json" -Encoding UTF8""",
          'Báo cáo có context SYSTEM và startup.json hợp lệ; 0 mục là kết quả có thể hợp lệ.',
          "$r=Get-Content (Join-Path $labRoot 'context.json') -Raw | ConvertFrom-Json; $items=(Get-Content (Join-Path $labRoot 'startup.json') -Raw | ConvertFrom-Json).Items; $r.Computer -eq $env:COMPUTERNAME -and $r.Context -like '*SYSTEM' -and [int]$r.Count -eq @($items).Count",
          'Vì sao xem HKCU Run từ SYSTEM có thể bỏ sót app tự chạy của nhân viên?'),
    stage('Kiểm kê dịch vụ tự chạy mà không tắt', 'Automatic không đồng nghĩa service đang chạy. Ghi cả StartMode, State và đường dẫn để điều tra publisher, không xóa theo tên trông lạ.',
          r"""$p='C:\LabEx\Labs\win-it-startup-audit'; Get-CimInstance Win32_Service | Where-Object StartMode -eq Auto | Select-Object Name,State,StartMode,PathName | Export-Csv "$p\auto-services.csv" -NoTypeInformation -Encoding UTF8
Import-Csv "$p\auto-services.csv" | Select-Object -First 10""",
          'Có dịch vụ StartMode Auto thật; trạng thái có thể Running hoặc Stopped.',
          "$r=@(Import-Csv (Join-Path $labRoot 'auto-services.csv')); @($r | Where-Object { $n=$_.Name; $_.StartMode -eq 'Auto' -and @(Get-CimInstance Win32_Service | Where-Object { $_.Name -eq $n -and $_.StartMode -eq 'Auto' }).Count -eq 1 }).Count -gt 0",
          'Bạn cần những bằng chứng nào trước khi tắt một dịch vụ có tên không quen thuộc?')])

lesson('capstone-handover', 'Bài tổng hợp: backup, thay đổi có rollback và bàn giao ticket', 'Bàn giao thực tế',
       'Nhân viên yêu cầu đổi cấu hình ứng dụng nhưng phải giữ dữ liệu và có khả năng quay lui.',
       'Tập xử lý như một change nhỏ: ghi trạng thái ban đầu, sao lưu, đổi cấu hình, thử, rollback khi không đạt rồi bàn giao bằng chứng. Đây là bài tự luyện; thử giải trước khi xem khối lệnh.',
       'Mở thư mục bài trong File Explorer. Dùng Notepad so sánh cấu hình hiện tại với bản backup; không cần cài Outlook hay license Microsoft 365.',
       'Chưa có Exchange/Outlook thật nên không gắn nhãn đã thực hành lỗi OST, profile mail hay đồng bộ tenant. Ticket xác nhận người dùng cần được người thật kiểm tra ngoài bài.',
       [CMD+'robocopy', PS+'microsoft.powershell.utility/get-filehash'], [
    stage('Tạo baseline và thay đổi có lưu bản trước', 'Mục tiêu tự luyện: tạo settings.json có Theme=Light, backup, đổi Theme=Dark; giữ dữ liệu employee.txt. Việc có bản trước là điều kiện để rollback có nghĩa.',
          r"""$p='C:\LabEx\Labs\win-it-capstone-handover'; New-Item -ItemType Directory -Path "$p\Backup" -Force | Out-Null
@{ Theme='Light'; Version=1 } | ConvertTo-Json | Set-Content "$p\settings.json" -Encoding UTF8
'Employee data must survive' | Set-Content "$p\employee.txt" -Encoding UTF8
Copy-Item "$p\settings.json" "$p\Backup\settings.json"; Copy-Item "$p\employee.txt" "$p\Backup\employee.txt"
@{ Theme='Dark'; Version=2 } | ConvertTo-Json | Set-Content "$p\settings.json" -Encoding UTF8""",
          'Bản hiện tại Dark/2, backup Light/1, file nhân viên không thay đổi.',
          "$a=Get-Content (Join-Path $labRoot 'settings.json') -Raw | ConvertFrom-Json; $b=Get-Content (Join-Path $labRoot 'Backup\\settings.json') -Raw | ConvertFrom-Json; $a.Theme -eq 'Dark' -and $a.Version -eq 2 -and $b.Theme -eq 'Light' -and $b.Version -eq 1 -and (Get-FileHash (Join-Path $labRoot 'employee.txt')).Hash -eq (Get-FileHash (Join-Path $labRoot 'Backup\\employee.txt')).Hash",
          'Nếu người dùng yêu cầu quay lại, bạn khôi phục cấu hình hay xóa cả thư mục dữ liệu?'),
    stage('Rollback và viết phiếu bàn giao có bằng chứng', 'Tình huống: bản mới không được chấp nhận. Khôi phục cấu hình cũ, giữ dữ liệu, ghi rõ rollback và bước xác nhận còn chờ; không đánh dấu đã được user xác nhận tự động.',
          r"""$p='C:\LabEx\Labs\win-it-capstone-handover'; Copy-Item "$p\Backup\settings.json" "$p\settings.json" -Force
[pscustomobject]@{ Ticket='HD-221'; Outcome='Rolled back'; ConfigHash=(Get-FileHash "$p\settings.json").Hash; DataHash=(Get-FileHash "$p\employee.txt").Hash; UserAcceptance='Pending real user confirmation'; Prevention='Keep versioned configuration backups' } | ConvertTo-Json | Set-Content "$p\handover.json" -Encoding UTF8
Get-Content "$p\handover.json"
""",
          'Cấu hình khớp backup, dữ liệu nhân viên nguyên vẹn, phiếu handover có hash thực tế và không nhận xác nhận thay người dùng.',
          "$r=Get-Content (Join-Path $labRoot 'handover.json') -Raw | ConvertFrom-Json; $a=(Get-FileHash (Join-Path $labRoot 'settings.json')).Hash; $d=(Get-FileHash (Join-Path $labRoot 'employee.txt')).Hash; $r.Ticket -eq 'HD-221' -and $r.Outcome -eq 'Rolled back' -and $r.ConfigHash -eq $a -and $r.DataHash -eq $d -and $a -eq (Get-FileHash (Join-Path $labRoot 'Backup\\settings.json')).Hash -and $d -eq (Get-FileHash (Join-Path $labRoot 'Backup\\employee.txt')).Hash -and $r.UserAcceptance -eq 'Pending real user confirmation'",
          'Bạn sẽ đính kèm bằng chứng nào để ca sau tiếp nhận ticket mà không phải hỏi lại từ đầu?')])


def main():
    assert len(LESSONS) == 21
    rules = {}
    existing = ['win-it-pc-onboarding-setup', 'win-it-printer-spooler-fix',
                'win-it-network-dns-troubleshoot', 'win-it-disk-cleanup-recovery']
    # Preserve IDs and learner progress while placing prerequisites before repairs.
    for number, item in enumerate(LESSONS, 5):
        lab_id = 'win-it-' + item['slug']
        sources = '\n'.join(f'- [Microsoft: {url.rsplit("/", 1)[-1].split("?")[0]}]({url})' for url in item['sources'])
        mode = ('Bài có **nạp lỗi thật trong vùng riêng của lab**. Bấm Chuẩn bị sự cố, chờ thành công rồi Kết nối lại Desktop. '
                'Làm bước chẩn đoán trước khi sửa. Sau khi chấm, bấm Hoàn nguyên kịch bản trước khi sang bài khác.' if item['scenario'] else
                'Bài **cấu hình/chẩn đoán trên VM thật**, không có nút nạp lỗi. Hoàn nguyên phiên sự cố trước đó trước khi làm bài. '
                'Các file bài này nằm riêng trong C:\\LabEx\\Labs\\' + lab_id + '.')
        intro = f"""## Ticket HD-{196+number}: {item['ticket']}

### Mục tiêu và bản chất
{item['overview']}

### Cách làm trên CLIENT01
{mode}

{item['gui']}

### Phạm vi và lưu ý
{item['pitfalls']}

Desktop dùng tài khoản tương tác; PowerShell web chạy **SYSTEM** qua Azure Agent và mỗi lần gửi là process mới. Không dùng HKCU hoặc Desktop của SYSTEM để suy luận cấu hình user đang đăng nhập. Chạy nguyên khối lệnh; biến không giữ sang lần gửi sau. Dùng nút Win+R của web để gửi phím vào VM. Không cần bật thêm Windows Server cho khóa này.

### Tự luyện
Đọc ticket, dự đoán nguyên nhân và tự đề xuất phép kiểm tra trước khi mở lời giải. Bộ chấm xác nhận trạng thái/kết quả có cấu trúc; câu hỏi giải thích dành cho tự đánh giá, không được tự động chứng nhận đã hiểu nghiệp vụ.

### Tài liệu gốc
Giáo trình tiếng Việt tự biên soạn, tham khảo Microsoft; không phải bản sao khóa LabEx hay chứng chỉ của Microsoft. Đối chiếu tài liệu ngày 2026-10-20.

{sources}
"""
        sections = [dict(id=f'{lab_id}-sec-0', title='Tiếp nhận ticket, nguyên lý và phạm vi thực hành',
                         title_vi='Tiếp nhận ticket, nguyên lý và phạm vi thực hành', position=0,
                         kind='introduction', layout='doc-fullscreen', need_verify=False,
                         content=intro, content_vi=intro)]
        steps = []
        for position, task in enumerate(item['stages'], 1):
            step_id = f'{lab_id}-sec-{position}'
            content = f"""## {task['title']}

### Vì sao làm bước này?
{task['theory']}

### Thao tác
{item['gui']}

Khối dưới là hướng dẫn PowerShell tương đương trong phạm vi bài. Có thể mở PowerShell ngay trong Desktop bằng Win+R → powershell; riêng báo cáo đọc toàn máy nên dùng PowerShell web để nhất quán với bộ chấm. Nếu chạy trong Desktop thì dùng quyền quản trị khi thao tác cần quyền đó.

```powershell
{task['command']}
```

### Kết quả và cách tự kiểm tra
{task['expected']}

Thực hiện xong mới bấm **Kiểm tra kết quả**. Nếu chưa đạt, xem lại đường dẫn, tên cột, nội dung và quyền thực thi; không chỉ tạo một file rỗng trùng tên. Bộ chấm đọc lại dữ liệu trên CLIENT01.

### Sai lầm cần tránh
{item['pitfalls']}

### Câu hỏi tự giải thích
{task['question']}
Viết câu trả lời theo mẫu: dấu hiệu → phép kiểm tra → kết quả → kết luận có giới hạn → bước tiếp theo. Trong môi trường thật cần người dùng xác nhận thao tác nghiệp vụ sau khi sửa.
"""
            step = dict(id=step_id, title=task['title'], title_vi=task['title'], position=position,
                        content=content, content_vi=content, task=task['expected'], task_vi=task['expected'],
                        hint=task['command'], hint_vi=task['command'],
                        verification=dict(kind='windows-remote', rule_id=step_id), required_capabilities=['windows-remote'])
            steps.append(step)
            sections.append({**step, 'kind': 'task', 'layout': 'doc-workbench-split', 'need_verify': True})
            if task['probe']:
                rules[step_id] = dict(lab_id=lab_id, probe=task['probe'])
        lab = dict(id=lab_id, course_id=COURSE, order=ORDER.index(item['slug'])+1, title=item['title'], title_vi=item['title'],
                   type='lab', difficulty='Beginner', estimated_time='35 mins', target_vm='client',
                   curriculum_version=3, curriculum_group=item['group'], overview=item['overview'],
                   ticket=dict(ticket_id=f'HD-{196+number}', requester='Nhân viên văn phòng', department='IT Helpdesk', priority='Normal', title=item['ticket']),
                   references=[dict(url=url, publisher='Microsoft', accessed_at='2026-10-20') for url in item['sources']],
                   practice_mode='fault-injection' if item['scenario'] else 'configuration-diagnostics',
                   sections=sections, steps=steps)
        if item['scenario']:
            lab['fault_scenario'] = item['scenario']
        target = ROOT / 'server/data/labs' / (lab_id + '.json')
        target.write_text(json.dumps(lab, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (ROOT / 'server/data/windows-support-rules.json').write_text(json.dumps(rules, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    courses_file = ROOT / 'server/data/courses.json'
    courses = json.loads(courses_file.read_text(encoding='utf-8-sig'))
    course = next(c for c in courses if c['id'] == COURSE)
    course.update(estimated_time='15 hours', labs_count=25, has_cert=False,
                  curriculum_origin='locally-authored-microsoft-references',
                  description='25 bài IT Support Windows 11 trên CLIENT01: tiếp nhận ticket, cài ứng dụng portable, cấu hình, tài khoản/quyền NTFS, IP/DNS/TCP/Firewall, máy in, backup/restore, Task Scheduler, log, hiệu năng, driver và Windows Update. 7 bài có kịch bản nạp lỗi; bài còn lại cấu hình/chẩn đoán có bộ kiểm tra trạng thái. Không cần thêm VM.',
                  skills=['Windows 11', 'IT Support', 'Helpdesk', 'PowerShell', 'Networking', 'NTFS', 'Backup and Restore', 'Task Scheduler', 'Troubleshooting'])
    courses_file.write_text(json.dumps(courses, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    assert all((ROOT / 'server/data/labs' / (lab_id+'.json')).is_file() for lab_id in existing)
    for lab_id in existing:
        file = ROOT / 'server/data/labs' / (lab_id+'.json')
        original = file.read_bytes()
        backup = ROOT / '.artifacts/windows-support-before-expansion' / file.name
        backup.parent.mkdir(parents=True, exist_ok=True)
        if not backup.exists():
            backup.write_bytes(original)
        lab = json.loads(original.decode('utf-8-sig'))
        lab['order'] = ORDER.index(lab_id.removeprefix('win-it-'))+1
        lab['practice_mode'] = 'configuration-diagnostics' if lab_id == 'win-it-pc-onboarding-setup' else 'fault-injection'
        lab['curriculum_group'] = {
            'win-it-pc-onboarding-setup': 'Nền tảng Helpdesk',
            'win-it-printer-spooler-fix': 'Máy in và dịch vụ',
            'win-it-network-dns-troubleshoot': 'Mạng máy trạm',
            'win-it-disk-cleanup-recovery': 'Chẩn đoán hệ thống',
        }[lab_id]
        file.write_text(json.dumps(lab, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f'Wrote {len(LESSONS)} lessons, {len(rules)} state rules and 4 functional fault repair steps; course total 25 labs / 50 tasks.')


if __name__ == '__main__':
    main()
