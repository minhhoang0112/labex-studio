"""Core-command-first teaching overlay. Never changes collector scripts or probes."""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def unit(command, meaning, observe):
    return (command, meaning, observe)


LESSONS = {
 'win-fnd-system-tools': [
  ('Nhận biết Windows đang dùng và dung lượng RAM; chưa cần biết cách tạo báo cáo JSON.', [
   unit('Get-CimInstance Win32_OperatingSystem', 'Get-CimInstance đọc thông tin từ một lớp quản trị Windows. Win32_OperatingSystem là lớp mô tả hệ điều hành; lệnh này không sửa cấu hình.', 'Tìm Caption và BuildNumber. Caption là tên phiên bản; BuildNumber giúp phân biệt bản phát hành.'),
   unit('Get-CimInstance Win32_OperatingSystem | Select-Object Caption, BuildNumber, ProductType', 'Dấu | chuyển đối tượng của lệnh bên trái sang lệnh bên phải. Select-Object chỉ giữ các thuộc tính được nêu, không thay đổi Windows.', 'Đối chiếu Caption/build với Settings → System → About. ProductType=1 là Windows Client.'),
   unit('Get-CimInstance Win32_ComputerSystem | Select-Object Name, TotalPhysicalMemory', 'Name là tên máy trong Windows, không nhất thiết trùng tên tài nguyên Azure. TotalPhysicalMemory tính bằng byte.', 'So sánh RAM với About; số GB hiển thị có thể được làm tròn. Không kết luận máy chậm chỉ từ dung lượng RAM.')],
   'Tự đọc tên Windows, build, tên máy và RAM rồi giải thích chúng giúp xử lý ticket thế nào.'),
  ('Xác định ai đang chạy lệnh và đang dùng phiên bản PowerShell nào.', [
   unit('whoami', 'whoami in danh tính đang thực thi process hiện tại. Đây là chương trình Windows, không phải một biến PowerShell.', 'Trong Desktop thường là tài khoản đăng nhập; trong PowerShell của web qua Azure Agent là NT AUTHORITY\\SYSTEM. Đây là hai ngữ cảnh khác nhau.'),
   unit('$PSVersionTable', '$PSVersionTable là biến có sẵn chứa thông tin engine PowerShell. Dấu $ đứng trước tên biến.', 'Tìm PSVersion và PSEdition; Windows PowerShell 5.1 thường có PSEdition=Desktop. Không suy ra PowerShell 7 chỉ vì dùng Windows 11.'),
   unit('whoami /user', '/user yêu cầu in tên người dùng và SID của danh tính hiện tại.', 'Đối chiếu SID giữa Desktop và web. Không chép tên tài khoản vào chỗ yêu cầu SID.')],
   'Chạy whoami ở hai nơi rồi giải thích vì sao kết quả khác mà cả hai vẫn đúng.')],
 'win-fnd-process-services-startup': [
  ('Phân biệt một chương trình đang chạy với dịch vụ do Windows quản lý.', [
   unit('Get-Process | Select-Object -First 5 Name, Id, CPU', 'Get-Process đọc các process. -First 5 chỉ lấy năm dòng để dễ quan sát; Id là PID. CPU là số giây CPU tích lũy, không phải phần trăm CPU tức thời.', 'Đối chiếu tên/PID với tab Details trong Task Manager. Danh sách và PID có thể đổi giữa các lần chạy.'),
   unit('Get-Process -Name wininit', '-Name lọc theo tên process, không phải PID. Chỉ xem; không dừng process hệ thống.', 'Ghi nhận Id của wininit. Sau reboot PID có thể khác, không học thuộc một số PID mẫu.'),
   unit('Get-Service -Name Spooler', 'Get-Service đọc dịch vụ. Spooler là tên dịch vụ in; Name và DisplayName là hai thuộc tính khác nhau.', 'Đọc Status. Running hoặc Stopped đều là trạng thái có thể có; không bật/tắt dịch vụ chỉ để khớp hình mẫu.')],
   'Vì sao Stop-Process không phải cách thay thế tùy tiện cho Stop-Service?'),
  ('Nhận biết các nguồn khởi động cùng Windows và giới hạn của từng phép kiểm tra.', [
   unit("Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'", 'Get-ItemProperty đọc thuộc tính tại một đường dẫn Registry. HKLM là cấu hình cấp máy; Run là một nguồn startup, không phải toàn bộ nguồn.', 'Có thể thấy tên giá trị startup hoặc không có mục ứng dụng. Không sửa/xóa Registry trong bài.'),
   unit("Get-ChildItem 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup'", 'Get-ChildItem liệt kê nội dung một thư mục. Đây là Common Startup, không phải Startup riêng của tài khoản Desktop.', 'Thư mục rỗng là kết quả hợp lệ. Đối chiếu Task Manager → Startup apps nhưng không kỳ vọng hai danh sách giống hoàn toàn.')],
   'Một app không xuất hiện trong HKLM Run có chứng minh nó không tự khởi động không? Kể thêm một nguồn khác.')],
 'win-fnd-accounts-uac': [
  ('Hiểu tài khoản local được nhận diện bằng SID, không chỉ bằng tên.', [
   unit('Get-LocalUser', 'Get-LocalUser đọc các tài khoản local trên máy hiện tại. Lệnh không tạo user, đổi mật khẩu hoặc thêm quyền.', 'Đọc Name và Enabled. Enabled=False không có nghĩa tài khoản chắc chắn cần bị xóa.'),
   unit('Get-LocalUser | Select-Object Name, SID, Enabled', 'Select-Object chọn ba thuộc tính để nhìn rõ danh tính và trạng thái. SID là mã định danh dùng khi Windows gắn quyền cho tài khoản.', 'Chọn một user và tự mô tả tên, SID, trạng thái. Không giả định mọi tài khoản đều có cùng SID giữa các máy.'),
   unit('whoami /user', 'Lệnh này đọc danh tính của phiên đang chạy; Get-LocalUser liệt kê các tài khoản local. Hai lệnh trả lời hai câu hỏi khác nhau.', 'Xác định tài khoản Desktop của bạn trong ngữ cảnh hiện tại. Danh sách local không mô tả đầy đủ tài khoản domain hoặc Entra.')],
   'Nếu đổi tên user, SID thường có đổi theo không? Vì sao điều này quan trọng với quyền trên tệp?'),
  ('Phân biệt danh tính, thành viên nhóm Administrators và quyền của process hiện tại.', [
   unit('whoami /groups', '/groups đọc nhóm trong token hiện tại. Nhóm có thể mang thuộc tính như Deny only; chỉ thấy tên Administrators chưa chứng minh process đã nâng quyền.', 'Đọc tên và thuộc tính nhóm. Đối chiếu với việc bạn mở PowerShell thường hay Run as administrator.'),
   unit("Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System' -Name EnableLUA", '-Name chỉ đọc giá trị EnableLUA. Lệnh Get-ItemProperty không ghi Registry. EnableLUA không thể hiện toàn bộ chính sách UAC.', 'Ghi đúng giá trị thực tế, không đổi sang 0 hoặc 1 để khớp ví dụ. Xem thanh trượt UAC rồi Cancel, không lưu thay đổi.')],
   'Vì sao process SYSTEM của web không đại diện cho quyền của chương trình đang chạy trên Desktop?')],
 'win-fnd-files-profile-ntfs': [
  ('Tự tạo và đọc một tệp mẫu, hiểu rõ nó được lưu ở đâu.', [
   unit('Get-Location\n$env:USERPROFILE', 'Get-Location đọc thư mục làm việc; $env:USERPROFILE đọc đường dẫn profile của danh tính hiện tại. Hai đường dẫn không nhất thiết giống nhau.', 'Chạy trên Desktop; so sánh khi dùng web. Không mặc định profile của SYSTEM là profile người học.'),
   unit("New-Item -ItemType Directory -Path 'C:\\LabEx\\Labs\\win-fnd-files-profile-ntfs\\Documents' -Force", 'New-Item tạo thư mục ở đường dẫn tuyệt đối. -Force cho phép dùng lại thư mục đã có; phạm vi chỉ là thư mục bài này.', 'Dùng Explorer mở đúng đường dẫn và thấy Documents.'),
   unit("Set-Content -LiteralPath 'C:\\LabEx\\Labs\\win-fnd-files-profile-ntfs\\Documents\\LearningNote.txt' -Value 'Windows fundamentals' -Encoding UTF8\nGet-Content -LiteralPath 'C:\\LabEx\\Labs\\win-fnd-files-profile-ntfs\\Documents\\LearningNote.txt'", 'Set-Content ghi và thay thế nội dung tệp mẫu; Get-Content đọc lại. -LiteralPath coi đường dẫn là tên chính xác, không dùng ký tự đại diện.', 'Thấy Windows fundamentals và mở cùng tệp bằng Notepad. Chạy lại chỉ ghi đè tệp mẫu của bài.')],
   'Một đường dẫn tương đối có thể đưa tệp sang vị trí nào nếu thư mục hiện tại thay đổi?'),
  ('Tách kiểm tra nội dung sao chép khỏi kiểm tra quyền truy cập.', [
   unit("Copy-Item -LiteralPath 'C:\\LabEx\\Labs\\win-fnd-files-profile-ntfs\\Documents\\LearningNote.txt' -Destination 'C:\\LabEx\\Labs\\win-fnd-files-profile-ntfs\\LearningNote.copy.txt' -Force", 'Copy-Item sao chép tệp; -Force cho phép thay bản sao mẫu đã có. Làm bước tạo tệp trước.', 'Trong Explorer có cả bản gốc và bản sao ở đúng vị trí.'),
   unit("Get-FileHash -LiteralPath 'C:\\LabEx\\Labs\\win-fnd-files-profile-ntfs\\Documents\\LearningNote.txt'\nGet-FileHash -LiteralPath 'C:\\LabEx\\Labs\\win-fnd-files-profile-ntfs\\LearningNote.copy.txt'", 'Get-FileHash tính mã băm từ nội dung bytes, mặc định SHA256. Hai mã giống nhau giúp kiểm tra bản sao; nó không mô tả ACL.', 'Đối chiếu hai Hash. Không tự viết một chuỗi hash vào tệp để thay cho việc sao chép dữ liệu.'),
   unit("Get-Acl -LiteralPath 'C:\\LabEx\\Labs\\win-fnd-files-profile-ntfs\\LearningNote.copy.txt' | Format-List Owner, AccessToString", 'Get-Acl đọc quyền, Format-List chỉ đổi cách hiển thị. Owner và từng quyền Allow/Deny là thông tin khác nhau.', 'Đối chiếu Properties → Security; chưa thay ACL. Hash giống không chứng minh hai user có cùng quyền đọc.')],
   'Bạn sẽ dùng phép kiểm tra nào cho dữ liệu bị đổi, và phép nào cho Access denied?')],
 'win-fnd-software-drivers-updates': [
  ('Đọc phần mềm đã cài trong một phạm vi cụ thể trước khi đề xuất bảo trì.', [
   unit("Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' | Select-Object DisplayName, DisplayVersion, Publisher", '* chọn các khóa con. Ba thuộc tính giúp nhận biết tên, phiên bản, nhà phát hành; có khóa không có DisplayName nên có thể thấy dòng trống.', 'So sánh vài mục với Installed apps. Đây không phải toàn bộ Store app, app 32-bit và app riêng từng user.'),
   unit("Get-ItemProperty 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' | Select-Object DisplayName, DisplayVersion, Publisher", 'Trên Windows 64-bit, phần mềm 32-bit có thể đăng ký tại WOW6432Node. Đọc hai vị trí vẫn không phải kiểm kê mọi loại app.', 'Không có khóa/mục là dữ kiện cần ghi nhận, không phải lý do cài thêm app. Không dùng Win32_Product để kiểm kê vì nó có thể gây kiểm tra/sửa MSI.')],
   'Chưa tìm thấy app trong hai khóa này thì bạn sẽ kiểm tra nguồn nào tiếp theo?'),
  ('Phân biệt driver, hotfix và trạng thái dịch vụ Windows Update.', [
   unit('Get-CimInstance Win32_PnPSignedDriver | Select-Object -First 5 DeviceName, DriverVersion, IsSigned', 'Lấy năm mẫu driver để dễ đọc. IsSigned mô tả chữ ký; nó không tự chứng minh driver phù hợp hoặc không có lỗi.', 'Đối chiếu một thiết bị với Device Manager → Driver. Không cập nhật/rollback driver trong bài quan sát này.'),
   unit('Get-HotFix | Select-Object HotFixID, InstalledOn', 'Get-HotFix đọc các bản vá do lớp QuickFixEngineering cung cấp, không phải mọi loại cập nhật Windows/Store/driver.', 'Danh sách có thể rỗng hoặc thiếu một update bạn thấy ở Settings. Nêu giới hạn nguồn dữ liệu.'),
   unit('Get-Service wuauserv', 'wuauserv là dịch vụ Windows Update. Một dịch vụ được kích hoạt theo trigger có thể đang Stopped khi chưa cần chạy.', 'Chỉ đọc Status; không tự bật service hoặc reboot để khớp mẫu.')],
   'Trước khi sửa driver, bạn cần ghi phiên bản và chuẩn bị cách quay lại cấu hình cũ ra sao?')],
 'win-fnd-baseline-change-rollback': [
  ('Tạo bản gốc mẫu và bản sao trước khi thay đổi, rồi kiểm tra bytes.', [
   unit("New-Item -ItemType Directory -Path 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice' -Force", 'Tạo riêng practice để tự luyện; thư mục này tách khỏi các tệp mà phần ghi bằng chứng sử dụng.', 'Mở đúng thư mục practice trong Explorer. Các bước sau chỉ ghi tệp mẫu tại đây.'),
   unit("Set-Content -LiteralPath 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice\\setting.txt' -Value 'Version=1' -Encoding UTF8\nCopy-Item -LiteralPath 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice\\setting.txt' -Destination 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice\\baseline.txt' -Force", 'Ghi trạng thái mẫu rồi sao chép thành baseline. Đây là backup một tệp học tập, không phải snapshot hay System Restore.', 'Đọc cả hai tệp bằng Get-Content và xác nhận cùng giá trị Version=1.'),
   unit("Get-FileHash 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice\\*.txt'", 'Ký tự * chọn các tệp .txt trong đúng thư mục practice. Hash giúp đối chiếu bytes của bản gốc và bản sao.', 'Hai mã băm phải giống nhau ở giai đoạn chưa thay đổi; ghi lại trạng thái ban đầu.')],
   'Nếu bản sao có sẵn nhưng chưa kiểm tra đọc/khôi phục, bạn đã biết chắc backup dùng được chưa?'),
  ('Thay một giá trị mẫu, kiểm tra thay đổi rồi phục hồi bản cũ.', [
   unit("Set-Content -LiteralPath 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice\\setting.txt' -Value 'Version=2' -Encoding UTF8\nGet-FileHash 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice\\*.txt'", 'Sau bước trước, chỉ ghi lại setting.txt; giữ nguyên baseline.txt. So sánh hash để chứng minh có thay đổi.', 'setting.txt chứa Version=2; hash khác baseline. Không thay tệp hệ thống.'),
   unit("Copy-Item -LiteralPath 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice\\baseline.txt' -Destination 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice\\setting.txt' -Force\nGet-Content 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice\\setting.txt'\nGet-FileHash 'C:\\LabEx\\Labs\\win-fnd-baseline-change-rollback\\practice\\*.txt'", 'Khôi phục từ bản trước sửa rồi kiểm tra nội dung và hash. Không chỉ ghi một câu restored.', 'Version trở về 1 và hai hash lại giống. Trong thực tế còn cần thử chức năng ứng dụng sau restore.')],
   'Ghi ticket ngắn gồm trước sửa, thay đổi, phép xác minh và cách hoàn nguyên. Phần JSON chấm dùng bộ tệp riêng, không chấm setting.txt này.')],
 'win-nwf-ipv4-routing': [
  ('Đọc địa chỉ, subnet và gateway của máy hiện tại trước khi chẩn đoán.', [
   unit('ipconfig', 'Lệnh Windows này hiển thị tóm tắt cấu hình các adapter. Địa chỉ IPv4 và Default Gateway là hai trường khác nhau.', 'Đọc adapter đang dùng, không mặc định adapter đầu tiên là đường đi của mọi kết nối.'),
   unit('Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceIndex, IPAddress, PrefixLength', '-AddressFamily IPv4 lọc IPv4. PrefixLength là số bit mạng; /24 là 24 bit, không phải số máy đang online.', 'Ghép InterfaceIndex với adapter. Một máy có thể có nhiều địa chỉ, gồm loopback.'),
   unit('Get-NetIPConfiguration', 'Lệnh tổng hợp cấu hình IP theo interface, giúp đối chiếu địa chỉ, gateway và DNS.', 'Phân biệt gateway với DNS server. Có IP không chứng minh truy cập Internet được.')],
   'Tự ghi IP/prefix/gateway/DNS của adapter và nêu phần nào chưa được kiểm thử. Không đổi IP của VM Azure.'),
  ('Hiểu route chọn đường đi và cách tính phạm vi một subnet nhỏ.', [
   unit('route print -4', '-4 chọn bảng định tuyến IPv4. Route có mạng đích, netmask, gateway/interface và metric.', 'Tìm default route 0.0.0.0; route cụ thể hơn có thể được chọn trước default route.'),
   unit("Get-NetRoute -AddressFamily IPv4 | Select-Object DestinationPrefix, NextHop, InterfaceIndex, RouteMetric", 'DestinationPrefix là mạng đích, NextHop là bước tiếp theo. Không chọn route chỉ dựa vào metric mà bỏ qua độ dài prefix.', 'Đối chiếu InterfaceIndex với bước trước. Default gateway không phải lúc nào cũng là next-hop của mọi đích.')],
   'Tự tính 192.168.10.70/26: mask 255.255.255.192, các khối tăng 64; mạng .64, broadcast .127, host thông thường .65–.126. Vì sao .70 và .130 khác subnet? Đây là ví dụ tính toán, không cấu hình địa chỉ này lên VM.')],
 'win-nwf-dhcp-apipa': [
  ('Đọc cấu hình DHCP và phân biệt cấu hình đó với trạng thái kết nối.', [
   unit('ipconfig /all', '/all mở rộng thông tin: DHCP Enabled, lease, DNS và các adapter. Không dùng /release hoặc /renew trên phiên quản trị từ xa này.', 'Đọc DHCP Enabled và tình trạng media. Thông tin lease không phải địa chỉ DNS.'),
   unit('Get-NetIPInterface -AddressFamily IPv4 | Select-Object InterfaceIndex, Dhcp, ConnectionState', 'Dhcp nói cách interface lấy cấu hình; ConnectionState nói trạng thái liên kết tại lúc kiểm tra.', 'DHCP Enabled nhưng Disconnected chưa đủ để kết luận server DHCP lỗi.')],
   'Nếu chỉ một máy không nhận lease nhưng máy cạnh bên nhận được, bạn sẽ kiểm tra link/adapter và phạm vi sự cố thế nào?'),
  ('Phân biệt APIPA, loopback và địa chỉ riêng mà không làm VM mất mạng.', [
   unit('Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress, PrefixLength, AddressState', 'Đọc địa chỉ thật và trạng thái; không gán các địa chỉ ví dụ vào adapter.', '169.254.0.0/16 là IPv4 link-local thường liên quan tự cấu hình khi chưa nhận lease. 127.0.0.0/8 là loopback, không phải APIPA.')],
   'Tự phân loại 169.254.12.34, 127.0.0.1, 172.16.5.8, 172.32.5.8. RFC1918 chỉ gồm 10/8, 172.16/12 và 192.168/16; 172.32.5.8 nằm ngoài RFC1918, nhưng chỉ nhìn địa chỉ chưa chứng minh Internet hoạt động. Đây là tình huống suy luận, không phải sự cố DHCP đã nạp lên VM.')],
 'win-nwf-dns-resolution': [
  ('Phân biệt DNS server đã cấu hình với kết quả phân giải tên thực tế.', [
   unit('Get-DnsClientServerAddress -AddressFamily IPv4', 'Đọc các DNS server theo interface, không đổi cấu hình DNS.', 'Interface không có DNS server có thể trả danh sách rỗng; cần đọc đúng adapter và phạm vi.'),
   unit('Resolve-DnsName localhost', 'Truy vấn tên qua resolver Windows; localhost có thể được giải quyết cục bộ, không cần DNS server bên ngoài.', 'Có kết quả cho localhost không chứng minh DNS của công ty hoặc Internet đã tốt.'),
   unit('ipconfig /displaydns', 'Đọc cache resolver. Cache là dữ liệu cục bộ, không phải danh sách bản ghi toàn bộ DNS server.', 'Có thể ít mục hoặc nhiều mục; không flush cache chỉ để hoàn thành bài.')],
   'Nếu có Internet, có thể tự luyện Resolve-DnsName learn.microsoft.com -Type A -DnsOnly. Ghi đúng kết quả hoặc lỗi; phép thử Internet là tùy chọn, không bắt buộc để chấm.'),
  ('Dùng loại lỗi để chọn phép kiểm tra tiếp theo, thay vì đổi DNS theo cảm tính.', [
   unit('Get-Help Resolve-DnsName -Parameter Type', 'Get-Help đọc trợ giúp tham số; Type chọn loại bản ghi như A/AAAA. Nếu máy chưa có trợ giúp chi tiết, dùng Get-Command Resolve-DnsName -Syntax để xem cú pháp.', 'Tên tồn tại nhưng thiếu loại bản ghi cần tìm khác với lỗi timeout khi truy vấn.'),
   unit('Get-DnsClientServerAddress -AddressFamily IPv4', 'Kiểm tra lại DNS server và interface trước khi cho rằng bản ghi bị hỏng.', 'Với tên nội bộ doanh nghiệp, DNS public có thể không biết tên đó; không tự đổi DNS NIC của Azure.')],
   'Tình huống: IP/cổng đúng kết nối được nhưng truy vấn tên trả NXDOMAIN. Hãy chọn kiểm tra spelling, bản ghi và DNS scope. Nếu lỗi là timeout, bổ sung kiểm tra khả năng tới resolver. Không bỏ qua certificate HTTPS để ép kết quả thành công.')],
 'win-nwf-tcp-http': [
  ('Kiểm tra một cổng cụ thể và đọc giới hạn của kết luận TCP.', [
   unit('Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess', '-State Listen lọc socket đang chờ kết nối. OwningProcess là PID; đối chiếu Get-Process -Id với PID thực tế vừa đọc.', '0.0.0.0, :: và 127.0.0.1 có phạm vi bind khác nhau. Danh sách này là của VM, không phải của máy bạn.'),
   unit('Test-NetConnection 127.0.0.1 -Port 3389', '-Port chọn cổng TCP. 3389 là RDP thường dùng trong VM này; 127.0.0.1 chỉ thử từ VM tới chính nó.', 'Đọc TcpTestSucceeded. Thử loopback thành công không chứng minh NSG hoặc đường RDP từ máy bạn đã tốt; ICMP warning không đồng nghĩa TCP thất bại.')],
   'Phần bằng chứng chạy phép thử listener thật: mở cổng tạm, kiểm tra rồi đóng, thay vì dừng RDP của bạn. Hãy dự đoán OpenReachable và ClosedReachable trước khi mở script hỗ trợ.'),
  ('Phân biệt kết nối TCP với kết quả HTTP ở lớp ứng dụng.', [
   unit('Get-Command Invoke-WebRequest -Syntax', 'Invoke-WebRequest là lệnh gửi yêu cầu HTTP. Đọc cú pháp trước: -Uri là địa chỉ đầy đủ, -UseBasicParsing hữu ích trên Windows PowerShell 5.1.', 'Một URL gồm scheme, host, port và path. Path /health khác /missing dù cùng host/cổng.'),
   unit('Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort', 'Cổng đang lắng nghe chỉ nói về transport. Nó không cho biết HTTP trả 200, 404 hay đăng nhập thành công.', 'Bài dùng dịch vụ loopback ngắn hạn trong phần bằng chứng, không tạo web server chạy 24/24.')],
   'Trước phần bằng chứng, dự đoán: /health trả 200 và NETLAB_OK; /missing trả 404 và NETLAB_NOT_FOUND dù TCP đều tốt. Sau đó đọc Healthy/Missing trong step2.json. Tự luyện có Internet (không bắt buộc): Invoke-WebRequest -Uri https://learn.microsoft.com -UseBasicParsing; đọc StatusCode. Lỗi HTTP 4xx/5xx có thể ném exception trong PowerShell 5.1; không kết luận đó là lỗi DNS.')],
 'win-nwf-helpdesk-endpoint': [
  ('Tái hiện một cấu hình sai ở riêng bài học trước khi sửa.', [
   unit("New-Item -ItemType Directory -Path 'C:\\LabEx\\Labs\\win-nwf-helpdesk-endpoint' -Force\nSet-Content -LiteralPath 'C:\\LabEx\\Labs\\win-nwf-helpdesk-endpoint\\client.json' -Value '{\"Path\":\"/missing\"}' -Encoding UTF8", 'Tạo thư mục riêng và cấu hình lỗi mẫu. Set-Content thay nội dung client.json của riêng bài; đây không phải cấu hình mạng của Windows.', 'Chạy lại thao tác này sẽ đặt Path về /missing. Không chạy lại bước chuẩn bị sau khi đã sửa ở bước 2 nếu không muốn diễn tập từ đầu.'),
   unit("Get-Content -LiteralPath 'C:\\LabEx\\Labs\\win-nwf-helpdesk-endpoint\\client.json'", 'Đọc cấu hình sau khi fixture đã được tạo. Path là đường dẫn ứng dụng cần gọi, không phải đường dẫn tệp của Windows.', 'Thấy /missing. Trong before-config.json có bản trước sửa. Không đổi DNS/firewall để chữa một path sai.')],
   'Với TCP thành công nhưng HTTP404, bằng chứng nào hướng bạn sang tầng ứng dụng? Chạy và chấm bước 1 trước khi sửa ở bước 2; làm lại bước 1 sẽ đặt lại cấu hình lỗi của riêng bài.'),
  ('Thực hiện một thay đổi nhỏ rồi kiểm tra cùng tiêu chí trước/sau.', [
   unit("notepad.exe 'C:\\LabEx\\Labs\\win-nwf-helpdesk-endpoint\\client.json'", 'Chạy trên Desktop sau bước 1. Trong Notepad chỉ đổi giá trị Path từ /missing thành /health rồi lưu, giữ cú pháp JSON và bản before-config.json.', 'Đây là chỉnh sửa bằng GUI do bạn thực hiện. Không mở Notepad bằng PowerShell web vì web chạy SYSTEM trong phiên không tương tác.'),
   unit("Get-Content -LiteralPath 'C:\\LabEx\\Labs\\win-nwf-helpdesk-endpoint\\client.json'\nGet-FileHash -LiteralPath 'C:\\LabEx\\Labs\\win-nwf-helpdesk-endpoint\\client.json'\nGet-FileHash -LiteralPath 'C:\\LabEx\\Labs\\win-nwf-helpdesk-endpoint\\before-config.json'", 'Đọc lại sau khi lưu; so sánh hash với bản trước sửa. Hash thay đổi chưa tự chứng minh ứng dụng khỏe: còn phải kiểm tra HTTP200 và body.', 'Phần bằng chứng chạy lại request thật. Nếu tự sửa bằng Notepad, làm theo ghi chú trong script để không cần gõ lại thao tác sửa.')],
   'Giải thích vì sao HTTP200 và đúng body mạnh hơn chỉ nhìn TcpTestSucceeded=True. Muốn hoàn nguyên riêng tình huống, copy before-config.json đè client.json; không đổi hệ thống.')],
 'win-nwf-evidence-runbook': [
  ('Tự ghép thông tin để vẽ đường đi kết nối của CLIENT01.', [
   unit('Get-NetIPConfiguration', 'Nhìn interface, IP, gateway và DNS cạnh nhau, không lấy một địa chỉ mẫu làm cấu hình Azure thật.', 'Vẽ interface → route được chọn → next-hop → đích. DNS giúp phân giải tên trước kết nối, không phải router mọi gói phải đi qua.'),
   unit('Get-NetRoute -AddressFamily IPv4 | Select-Object DestinationPrefix, NextHop, InterfaceIndex', 'Đối chiếu route và interface thay vì chỉ lấy adapter đầu tiên.', 'Nếu NIC/VPN thay đổi thì sơ đồ cần được cập nhật; không khẳng định đường WAN đã được đo bằng loopback.')],
   'Vẽ thêm đường client loopback → TCP127.0.0.1:cổng tạm → HTTP handler và chỉ rõ nó khác đường tới máy ngoài ra sao.'),
  ('Viết ticket từ dữ kiện, không từ phỏng đoán hoặc thông báo thành công chung chung.', [
   unit('Get-Date -Format o\nhostname', 'Ghi thời điểm và máy được kiểm tra để người nhận biết bằng chứng thuộc phiên nào. hostname là tên trong Windows.', 'Không ghi mật khẩu, token hoặc dữ liệu người dùng vào ticket.'),
   unit("Test-Path -LiteralPath 'C:\\LabEx\\Labs\\win-nwf-evidence-runbook\\ticket.md'", 'Kiểm tra ticket của bài đã có chưa. Mẫu báo cáo trong phần bằng chứng là điểm khởi đầu, không thay cho lời giải thích của bạn.', 'Mẫu ticket.md có thể được ghi đè khi chạy lại collector. Đọc mẫu nhưng giữ phần tự giải thích trong tệp riêng.'),
   unit("notepad.exe 'C:\\LabEx\\Labs\\win-nwf-evidence-runbook\\learning-notes.txt'", 'Mở Notepad trên Desktop để tự viết biên bản bằng lời của bạn; tạo thư mục bằng bước 1 trước nếu chưa có. Tệp ghi chú này không bị collector ghi đè.', 'Lưu lý do phân lớp, điều chưa kiểm tra và tiêu chí chuyển nhóm. Đây là phần tự luyện, không được bộ chấm tự động chứng nhận.')],
   'Tự viết trước: phạm vi → triệu chứng → phép thử → dữ kiện → giả thuyết → thay đổi tối thiểu → xác minh → hoàn nguyên → điều chưa đo. Phân biệt lỗi HTTP404 với lỗi DNS và nêu khi nào cần chuyển nhóm mạng/ứng dụng.')],
}


GUI = {
 'win-fnd-system-tools': 'Mở Settings → System → About; dùng Win+R → msinfo32 để đối chiếu thông tin hệ thống.',
 'win-fnd-process-services-startup': 'Win+R → taskmgr để xem Processes/Details/Startup apps; Win+R → services.msc để xem dịch vụ. Chỉ quan sát, không End task hoặc Stop service.',
 'win-fnd-accounts-uac': 'Win+R → lusrmgr.msc để xem tài khoản/nhóm local. Mở Change User Account Control settings để xem UAC rồi Cancel. Không tạo user hoặc lưu thay đổi.',
 'win-fnd-files-profile-ntfs': 'Mở Explorer, bật View → Show → File name extensions. Vào đúng thư mục bài, mở Properties → Security của tệp mẫu để đọc quyền rồi Cancel.',
 'win-fnd-software-drivers-updates': 'Xem Settings → Apps → Installed apps; Win+R → devmgmt.msc để xem Driver của một thiết bị; đọc Update history trong Windows Update. Chưa cài/gỡ, cập nhật hoặc reboot.',
 'win-fnd-baseline-change-rollback': 'Mở thư mục practice của bài trong Explorer. Xem setting.txt và baseline.txt bằng Notepad; không dùng file cấu hình của hệ thống để thử.',
 'win-nwf-ipv4-routing': 'Win+R → ncpa.cpl để nhận biết adapter. Xem Status/Details khi có; không sửa Properties/IP của VM đang truy cập từ xa.',
 'win-nwf-dhcp-apipa': 'Trong ncpa.cpl chỉ xem adapter và trạng thái kết nối. Không Disable adapter hoặc release lease của VM.',
 'win-nwf-dns-resolution': 'Trong Settings → Network & internet, đọc DNS đang cấu hình của adapter; không bấm lưu DNS mới.',
 'win-nwf-tcp-http': 'Đối chiếu đường truy cập của bạn: trình duyệt → backend/guacd → RDP của VM. Thử 127.0.0.1 bên trong VM là đường khác, không chứng minh đường này tốt.',
 'win-nwf-helpdesk-endpoint': 'Mở thư mục bài trong Explorer và xem client.json bằng Notepad sau khi tạo. Chỉ sửa dữ liệu mẫu, không sửa hosts/adapter/firewall.',
 'win-nwf-evidence-runbook': 'Vẽ sơ đồ và viết ghi chú bằng công cụ bạn quen dùng. Đối chiếu dữ kiện thật trên VM, tách riêng đường loopback khỏi LAN/WAN.',
}


def improve_lab(lab):
    definitions = LESSONS.get(lab['id'])
    if not definitions:
        return lab
    assert len(lab['steps']) == len(definitions) == 2
    for step, (goal, units, exercise) in zip(lab['steps'], definitions):
        parts = [f"## {step['title_vi']}\n\n### Vì sao làm bước này?\n{goal}",
          '### Quan sát GUI\n'+GUI[lab['id']],
          '### Nơi chạy và cách học\nMở **Desktop → Windows PowerShell** trên CLIENT01. Tự gõ từng lệnh ngắn dưới đây, đọc kết quả rồi giải thích trước khi chạy lệnh tiếp theo. Các biến được giữ trong cửa sổ PowerShell Desktop đang mở. PowerShell của web chạy SYSTEM và mỗi lần gửi là một process mới; đừng nhầm hai phiên này. Với lệnh đọc bị Access denied, kiểm tra quyền của cửa sổ đang dùng, không thay quyền máy để ép kết quả.',
          'Khi mới gặp cú pháp: `Get-` thường đọc dữ liệu; `Select-Object` chọn thuộc tính; dấu `|` chuyển đối tượng sang lệnh tiếp theo; tham số bắt đầu bằng `-`; dấu nháy giữ nguyên một chuỗi đường dẫn có khoảng trắng. `Format-List`/`Format-Table` dùng để hiển thị, không phải để sửa dữ liệu.']
        for n, (command, meaning, observe) in enumerate(units, 1):
            parts.append(f'### Thao tác {n}\n\n```powershell\n{command}\n```\n\n**Lệnh có nghĩa gì:** {meaning}\n\n**Đọc kết quả:** {observe}')
        parts += [f'### Câu hỏi tự giải thích và thực hành (không chấm tự động)\n{exercise}',
          '### Ghi nhận bằng chứng để chấm — làm sau khi đã hiểu\nPhần **Gợi ý** bên dưới có mục **Ghi bằng chứng để chấm** đang thu gọn. Đây là script hỗ trợ hệ thống, không phải các lệnh cơ bản bạn cần học thuộc. Chạy **nguyên khối ở tab PowerShell của web**, không dán khối này vào PowerShell Desktop: bộ chấm đối chiếu đúng danh tính SYSTEM và báo cáo của phiên web.\n\nScript kiểm tra đường dẫn, chuẩn bị/ghi dữ liệu mẫu của bài khi cần và tạo báo cáo JSON. Với các tình huống có thay đổi mẫu, nó có thể thực hiện lại thao tác tạo/sửa/hoàn nguyên; đọc mô tả trước khi chạy. Nó không thay cho việc bạn tự thực hành và giải thích các lệnh ở trên.',
          f"### Kết quả và cách tự kiểm tra\n{step['task_vi']}\n\nCác báo cáo nằm trong `C:\\LabEx\\Labs\\{lab['id']}`. Sau khi ghi bằng chứng, đọc dữ liệu bằng lệnh sau ở PowerShell Desktop:\n\n```powershell\nGet-Content -LiteralPath 'C:\\LabEx\\Labs\\{lab['id']}\\step{step['position']}.json' -Raw | ConvertFrom-Json | Select-Object -ExpandProperty Data\n```\n\n`-Raw` đọc cả văn bản; `ConvertFrom-Json` chuyển JSON thành đối tượng; `-ExpandProperty Data` lấy phần dữ kiện. Bộ chấm đối chiếu dữ liệu/trạng thái của báo cáo, không tự chứng nhận bạn đã hiểu bài hoặc đã gõ từng lệnh. Tệp thực hành riêng trong `practice` dùng để tự luyện, không tự thay thế báo cáo chấm.",
          '### Khi chưa đạt\nĐọc thông báo kiểm tra; xác nhận đúng CLIENT01, đúng bài và đúng PowerShell web khi ghi bằng chứng. Nếu bước này dùng dữ liệu bước trước, hoàn thành bước trước trước. Thu lại báo cáo sau khi VM/cấu hình thay đổi hoặc báo cáo quá hạn. Không sửa số liệu để ép đạt.']
        step['content'] = step['content_vi'] = '\n\n'.join(parts)+'\n'
        step['learning_flow'] = 'core-commands-first'
    by_id = {s['id']: s for s in lab['steps']}
    for section in lab['sections']:
        if section['id'] in by_id:
            section.update(copy.deepcopy(by_id[section['id']]))
        elif section['kind'] == 'introduction':
            text = f"## {lab['title_vi']}\n\n### Mục tiêu và bản chất\n{lab['overview']}\n\n### Học theo ba nhịp\n1. Tự gõ lệnh cốt lõi trong PowerShell của **Desktop**, quan sát GUI tương ứng và giải thích kết quả.\n2. Làm phần tự luyện, dự đoán và ghi câu trả lời bằng lời của bạn.\n3. Sau cùng mới mở phần script hỗ trợ ghi bằng chứng ở cuối bước; chỉ phần này chạy trong **PowerShell của web** để chấm.\n\nKhông cần học thuộc hàm bảo vệ đường dẫn, vòng lặp kiểm kê hay cách đóng gói JSON để bắt đầu khóa này. Phần học và phần thu báo cáo được tách rõ. Với bài tạo tệp/cấu hình mẫu, chỉ sửa đúng thư mục bài, không chỉnh service, UAC, NIC, DNS hoặc firewall của hệ thống.\n\n### Môi trường\nBật CLIENT01 Windows 11 hiện có. Hoàn nguyên kịch bản sự cố cũ trước khi học nếu VM đang có một sự cố khác. Desktop dùng tài khoản đăng nhập; web chạy SYSTEM và không giữ biến giữa các lần gửi. Không tạo thêm VM, cài thêm phần mềm hoặc mua dịch vụ để làm các bài này. Phần thử tên miền/HTTP trên Internet nếu có là tự luyện tùy chọn, không bắt buộc để chấm.\n"
            section['content'] = section['content_vi'] = text
    return lab


if __name__ == '__main__':
    for lab_id in LESSONS:
        path = ROOT/'server/data/labs'/f'{lab_id}.json'
        lab = json.loads(path.read_text(encoding='utf-8'))
        # Probes, executable collectors and task IDs must remain identical.
        before = [(s['id'], s['hint'], s.get('hint_vi'), s.get('verification')) for s in lab['steps']]
        improve_lab(lab)
        assert before == [(s['id'], s['hint'], s.get('hint_vi'), s.get('verification')) for s in lab['steps']]
        path.write_text(json.dumps(lab, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print('Updated 12 beginner Windows lessons / 24 learning steps; collectors, task IDs and verifiers unchanged.')
