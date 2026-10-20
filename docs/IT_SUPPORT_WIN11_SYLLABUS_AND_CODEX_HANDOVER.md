# Kế Hoạch Đào Tạo IT Support Thực Chiến & Bàn Giao Kỹ Thuật Codex (Windows 11 Desktop)

**Cập nhật:** 20/10/2026  
**Dự án:** LabEx Studio (`D:\Project\LabEx`)  
**Mục tiêu:** Xây dựng chương trình đào tạo Chuyên viên IT Support / Helpdesk thực tế tại doanh nghiệp Việt Nam, tập trung vào máy trạm người dùng (Windows 11 Desktop), quy trình Setup máy mới, xử lý sự cố thường gặp (mạng, máy in, phần mềm, ổ đĩa, backup dữ liệu).

---

## 1. Định Hướng Thực Tế Thị Trường IT Support Việt Nam

Theo phản hồi từ người học và khảo sát thực tế tại các doanh nghiệp tại Việt Nam:
1. **Thực tập sinh & Junior IT Support** khi mới vào doanh nghiệp gần như **100% làm việc với máy tính của nhân viên** (Windows 11 / Windows 10), máy in văn phòng, thiết bị mạng cục bộ (LAN/Wi-Fi), và phần mềm văn phòng.
2. Các hệ thống máy chủ lớn (Windows Server, Active Directory Domain Controller, Azure Cloud) thường do Senior System Administrator hoặc IT Lead quản lý, thực tập sinh chưa được cấp quyền thao tác trực tiếp.
3. **Nhu cầu cấp thiết nhất của người học:** Có kỹ năng thực chiến để đi làm được ngay:
   - Biết cách tiếp nhận ticket từ người dùng.
   - Biết quy trình setup, cài đặt máy mới chuẩn công ty (Onboarding).
   - Biết chẩn đoán và sửa các lỗi thường gặp: kẹt máy in, không vào được mạng, lỗi DNS/hosts, đầy ổ C, lỗi Outlook/Office, lỗi font gõ tiếng Việt Unikey/EVKey, máy đơ giật lag, màn hình xanh (BSOD).
   - Biết cách sao lưu (Backup) và cứu hộ dữ liệu nhân viên an toàn trước khi cài lại máy.
   - Biết cách phân quyền người dùng, reset mật khẩu, xử lý mã hóa BitLocker.

---

## 2. Giáo Trình Chi Tiết: IT Support & Windows 11 Desktop Troubleshooting (20 Bài Lab Thực Chiến)

Khóa học: **`win11-it-support-helpdesk`** — **Chuyên Viên IT Support & Xử Lý Sự Cố Windows 11 Thực Tế**

### Module 1: Quy Trình Chuẩn Bị & Cài Đặt Máy Cho Nhân Viên Mới (Onboarding & PC Setup)
* **Bài 1: Cấu hình ban đầu Windows 11 theo chuẩn doanh nghiệp**
  - *Tình huống:* Nhận máy mới từ kho, cần thiết lập tên máy theo quy ước (`VN-HCM-MKT-01`), cấu hình múi giờ Việt Nam (UTC+7), thiết lập định dạng ngày tháng (dd/MM/yyyy).
  - *Kỹ năng:* GUI System Settings, PowerShell (`Rename-Computer`, `Set-TimeZone`, `Set-Culture`).
* **Bài 2: Quản lý tài khoản nhân viên & Nguyên tắc phân quyền an toàn**
  - *Tình huống:* Bàn giao máy cho nhân viên phòng Kế toán. Tạo tài khoản cục bộ `Standard User` (không cấp Admin tùy tiện để tránh cài phần mềm độc hại), tạo tài khoản IT Support Admin riêng, cấu hình mức độ cảnh báo UAC (User Account Control).
  - *Kỹ năng:* `net user`, `Get-LocalUser`, `New-LocalUser`, `Add-LocalGroupMember`.
* **Bài 3: Cài đặt & Chuẩn hóa bộ phần mềm văn phòng chuẩn (Golden Workplace Stack)**
  - *Tình huống:* Cài đặt Microsoft 365, Google Chrome, PDF Reader, 7-Zip, Zalo PC, UltraViewer/AnyDesk. Xử lý lỗi bộ gõ tiếng Việt Unikey/EVKey không gõ được trong trình duyệt hoặc app Windows.
  - *Kỹ năng:* Cấu hình startup apps, Run as Administrator, tương thích encoding UTF-8.
* **Bài 4: Khởi tạo điểm khôi phục (Restore Point) & Sao lưu Profile trước khi bàn giao**
  - *Tình huống:* Tạo System Restore Point và kích hoạt tính năng bảo vệ hệ thống trước khi đưa máy cho người dùng sử dụng.
  - *Kỹ năng:* `Checkpoint-Computer`, `wmic`, GUI System Properties.

---

### Module 2: Mạng Văn Phòng & Xử Lý Sự Cố Kết Nối (Network Troubleshooting)
* **Bài 5: Chẩn đoán lỗi "No Internet Access" & Dải IP APIPA (`169.254.x.x`)**
  - *Tình huống:* Nhân viên cắm dây mạng nhưng máy báo chấm than vàng, không có Internet.
  - *Nguyên nhân:* Mất kết nối tới DHCP Server, cáp lỏng, hoặc card mạng bị treo.
  - *Kỹ năng:* `ipconfig /all`, `ipconfig /release`, `ipconfig /renew`, kiểm tra card mạng (`ncpa.cpl`).
* **Bài 6: Sửa lỗi không vào được Website nội bộ hoặc cổng thông tin công ty**
  - *Tình huống:* Nhân viên vào được YouTube nhưng không vào được trang nội bộ `portal.company.local`.
  - *Nguyên nhân:* Lỗi DNS Cache, DNS Server cấu hình sai, hoặc file `hosts` (`C:\Windows\System32\drivers\etc\hosts`) bị chỉnh sửa.
  - *Kỹ năng:* `ipconfig /flushdns`, `nslookup`, sửa file `hosts` với quyền Admin, `Test-NetConnection`.
* **Bài 7: Xử lý sự cố chia sẻ dữ liệu qua mạng LAN (File Sharing & Map Network Drive)**
  - *Tình huống:* Nhân viên không truy cập được ổ đĩa mạng `\\FILESERVER\Shared` hoặc bị báo lỗi Access Denied.
  - *Nguyên nhân:* Lỗi lưu cache mật khẩu cũ trong Windows Credential Manager, hoặc sai quyền Share vs NTFS.
  - *Kỹ năng:* Quản lý `control keymgr.dll`, lệnh `net use`, kiểm tra quyền đọc ghi.
* **Bài 8: Cấu hình & Xử lý lỗi VPN làm việc từ xa (Work From Home)**
  - *Tình huống:* Nhân viên ở nhà bật VPN công ty bị báo lỗi hoặc mất toàn bộ mạng Internet gia đình (Split Tunneling issue).
  - *Kỹ năng:* Cấu hình VPN Adapter, tắt tùy chọn "Use default gateway on remote network" để giữ mạng song song.

---

### Module 3: Máy In Văn Phòng & Thiết Bị Ngoại Vi (Printers & Peripherals)
* **Bài 9: Cài đặt máy in văn phòng qua địa chỉ IP mạng LAN**
  - *Tình huống:* Thêm máy in đa năng phòng Họp qua Standard TCP/IP Port, cấu hình khổ giấy mặc định A4 (thay cho Letter để không bị lỗi khay giấy).
  - *Kỹ năng:* GUI `printmanagement.msc`, cài driver PCL6/PostScript, in trang Test Page.
* **Bài 10: Xử lý triệt để lỗi "Kẹt hàng đợi in" (Print Spooler Stuck Error)**
  - *Tình huống:* Nhân viên in tài liệu 100 trang bị lỗi, các lệnh in sau bị kẹt cứng, bấm Cancel không xóa được.
  - *Cách sửa:* Dừng dịch vụ `Spooler` (`net stop spooler`), xóa sạch tệp tạm trong `C:\Windows\System32\spool\PRINTERS`, khởi động lại dịch vụ (`net start spooler`).
* **Bài 11: Sự cố thiết bị họp trực tuyến (Microphone, Camera, Tai nghe & Màn hình phụ)**
  - *Tình huống:* Nhân viên họp Teams/Zoom nhưng đồng nghiệp không nghe thấy tiếng, hoặc cắm màn hình rời qua HDMI không hiển thị.
  - *Kỹ năng:* Windows Privacy & Security (Microphone/Camera access), Windows Sound Settings, Device Manager cập nhật driver hiển thị.

---

### Module 4: Tối Ưu Ổ Đĩa, Hiệu Năng & Sự Cố Ứng Dụng (Disk, Performance & Apps)
* **Bài 12: Cứu hộ ổ C bị báo đỏ (Disk Space 100% Full)**
  - *Tình huống:* Ổ C đầy chỉ còn vài trăm MB, máy báo lỗi không mở được tệp.
  - *Quy trình dọn an toàn:* Dọn dẹp `%temp%`, `C:\Windows\Temp`, dọn dẹp thư mục tải về của Windows Update (`SoftwareDistribution\Download`), dọn dẹp `Windows.old`, kích hoạt Storage Sense.
* **Bài 13: Xử lý máy tính bị đơ, giật lag, Disk 100% hoặc CPU 100%**
  - *Tình huống:* Máy khởi động mất 10 phút, mở ứng dụng bị Not Responding.
  - *Kỹ năng:* Dùng Task Manager, Resource Monitor để định danh tiến trình ngốn tài nguyên; tắt các ứng dụng khởi động ngầm không cần thiết (Clean Boot qua `msconfig`); sửa lỗi file hệ thống bằng `SFC /scannow` và `DISM`.
* **Bài 14: Xử lý lỗi hỏng dữ liệu Microsoft Outlook (.OST / .PST)**
  - *Tình huống:* Outlook báo lỗi "Cannot open your default e-mail folders", hoặc bị treo ở "Loading Profile...".
  - *Kỹ năng:* Mở Outlook Safe Mode (`outlook.exe /safe`), sử dụng công cụ sửa lỗi hòm thư `SCANPST.EXE`, tạo Outlook Profile mới trong Control Panel Mail.

---

### Module 5: Sao Lưu Dữ Liệu & Cứu Hộ Hệ Thống (Backup & Disaster Recovery)
* **Bài 15: Quy trình sao lưu dữ liệu toàn diện trước khi cài đặt lại máy**
  - *Tình huống:* Máy nhân viên bị lỗi nặng cần cài lại Windows, yêu cầu không được làm mất bất kỳ dữ liệu công việc nào.
  - *Checklist IT chuyên nghiệp:* Sao lưu Desktop, Documents, Downloads, Favorites/Bookmarks trình duyệt (Chrome/Edge), xuất mật khẩu lưu trữ, xuất chữ ký email Outlook, ghi lại danh sách phần mềm bản quyền chuyên dụng.
* **Bài 16: Cứu hộ máy tính không khởi động được vào Windows (Startup Repair)**
  - *Tình huống:* Máy bật lên báo "Automatic Repair couldn't repair your PC".
  - *Kỹ năng:* Truy cập môi trường WinRE, sử dụng Command Prompt để sửa boot (`bootrec /fixmbr`, `bootrec /rebuildbcd`), khôi phục từ System Restore Point.
* **Bài 17: Phân tích & Xử lý Màn hình xanh chết chóc (BSOD - Blue Screen of Death)**
  - *Tình huống:* Máy đột ngột sập màn hình xanh xuất hiện mã lỗi `CRITICAL_PROCESS_DIED` hoặc `DRIVER_IRQL_NOT_LESS_OR_EQUAL`.
  - *Kỹ năng:* Tra cứu Event Viewer (System Log, Event ID 41, Bugcheck), gỡ bản cập nhật Windows Update lỗi vừa cài (`wusa /uninstall`), Rollback driver card màn hình trong Device Manager.

---

### Module 6: Bảo Mật Đầu Cuối & Quản Trị Tài Khoản (Security & Operations)
* **Bài 18: Reset mật khẩu Windows & Xử lý tài khoản bị khóa (Account Lockout)**
  - *Tình huống:* Nhân viên đi nghỉ phép về quên mật khẩu máy tính, hoặc gõ sai quá số lần quy định bị khóa tài khoản.
  - *Kỹ năng:* Quản trị tài khoản bằng lệnh `net user <username> *`, mở khóa tài khoản `net user <username> /active:yes`.
* **Bài 19: Quản lý mã hóa ổ cứng BitLocker & Khóa khôi phục (Recovery Key)**
  - *Tình huống:* Máy nhân viên sau khi cập nhật BIOS bị dừng ở màn hình xanh yêu cầu nhập mã BitLocker Recovery Key 48 số.
  - *Kỹ năng:* Hiểu cơ chế mã hóa TPM + BitLocker, tra cứu và nhập mã Recovery Key an toàn, bật/tắt BitLocker qua lệnh `manage-bde`.
* **Bài 20: Xử lý mã độc, phần mềm quảng cáo rác & Lập biên bản sự cố (Incident Report)**
  - *Tình huống:* Trình duyệt nhân viên liên tục nhảy tab quảng cáo độc hại, trang chủ bị đổi sang trang web lạ.
  - *Kỹ năng:* Sử dụng Microsoft Defender Offline Scan, kiểm tra Task Scheduler, xóa bỏ tiện ích mở rộng (extensions) độc hại, lập biên bản sự cố IT Helpdesk bàn giao cho người dùng.

---

## 3. Phân Công Trách Nhiệm Kỹ Thuật (Antigravity & Codex)

### A. Nhiệm vụ của Antigravity (Frontend + Syllabus + AI Tutor):
1. **Quản lý nội dung & Giao diện:**
   - Đưa khóa học `win11-it-support-helpdesk` vào `server/data/courses.json` và liên kết với `paths.json` (Lộ trình IT Support $\to$ System Administrator).
   - Thiết kế giao diện bài học thực tế: Mô phỏng phiếu yêu cầu hỗ trợ người dùng (**Helpdesk Ticket UI**): Tên người dùng, phòng ban, mô tả lỗi, mức độ ưu tiên (Priority), các bước chẩn đoán và tiêu chí nghiệm thu.
   - Bổ sung ảnh minh họa chụp từ môi trường Windows 11 thật và biểu đồ luồng troubleshooting.
2. **AI Tutor Context:**
   - Cung cấp prompt hướng dẫn đặc thù cho vai trò IT Support: Đóng vai Senior Helpdesk hướng dẫn học viên chẩn đoán từng bước, phân tích lỗi terminal/PowerShell, giải thích cặn kẽ cơ chế thay vì chỉ đưa lệnh chép theo.

### B. Nhiệm vụ của Codex (Backend + Azure Automation + Fault Injection):
1. **Thiết lập Máy ảo Windows 11 (CLIENT01) trên Azure:**
   - Cấu hình đề xuất siêu tiết kiệm:
     - Kích thước VM: **`Standard_B2s` (2 vCPU / 4 GiB RAM)** — giá compute chỉ **$0.0528/giờ** (học 20 giờ/tháng chỉ tốn ~$1.05).
     - Ổ cứng: **Standard SSD LRS 64 GiB hoặc 128 GiB** (~$4.80 - $9.60/tháng, tiết kiệm hơn 70% so với Premium SSD).
     - Hệ điều hành: Windows 11 Enterprise Gen2 (hỗ trợ single-session dev/test theo chính sách Azure for Students).
     - Thiết lập lịch **Auto-Shutdown lúc 23:00 hằng ngày** trực tiếp trên Azure để bảo hiểm chi phí phòng trường hợp người học quên tắt.
2. **Bổ sung Hỗ trợ Đa Máy Ảo trong Backend (`cloudConfig.js` & `cloudVm.js`):**
   - Hỗ trợ chuyển đổi linh hoạt target giữa máy Server (`LabEx-WinServer`) và máy Client (`LabEx-CLIENT01`).
   - Cung cấp API nạp lỗi (Fault Injection Runner) và bộ chấm (Verifier) bám sát các kịch bản thực tế của 20 bài lab trên.
   - Xây dựng cơ chế Snapshot Baseline 1 lần duy nhất cho máy Client để khôi phục nhanh chóng khi cần.

---

## 4. Hướng Dẫn Lệnh Azure CLI Tạo Máy Windows 11 (Khi Người Dùng Phê Duyệt)

Khi người học phê duyệt triển khai máy Windows 11 mới, Codex hoặc người dùng có thể thực thi lệnh Azure CLI chuẩn hóa sau (sử dụng tài nguyên tiết kiệm, không vượt quota `2/6` regional vCPU còn lại):

```powershell
# Tạo Resource Group riêng biệt hoặc dùng chung LabEx-India-RG
$RG = "LabEx-India-RG"
$LOCATION = "centralindia"
$VM_NAME = "LabEx-CLIENT01"
$VM_SIZE = "Standard_B2s"   # 2 vCPU, 4 GiB RAM (~$0.0528/giờ)
$OS_DISK_TYPE = "StandardSSD_LRS"

# Lệnh tạo VM Windows 11 tiết kiệm tối đa
az vm create `
  --resource-group $RG `
  --name $VM_NAME `
  --image "MicrosoftWindowsDesktop:windows-11:win11-24h2-ent:latest" `
  --size $VM_SIZE `
  --storage-sku $OS_DISK_TYPE `
  --os-disk-size-gb 64 `
  --admin-username "adminlab" `
  --admin-password "<SECURE_PASSWORD>" `
  --public-ip-sku Standard `
  --nsg-rule RDP

# Cấu hình tự động tắt máy lúc 23:00 UTC+7 để bảo hiểm chi phí
az vm auto-shutdown `
  --resource-group $RG `
  --name $VM_NAME `
  --time "1600"   # 16:00 UTC = 23:00 GMT+7
```

---

## 5. Kết Luận & Hành Động Tiếp Theo
- Phương án này giải quyết 100% đúng trọng tâm mong muốn của người học: **Tập trung vào sửa lỗi máy tính thực tế của nhân viên (Windows 11 Desktop), giải quyết đúng các bài toán thường gặp nhất khi đi thực tập IT Support tại Việt Nam**.
- Chi phí kiểm soát chặt chẽ: Dùng B-series giá rẻ, ổ Standard SSD, deallocate ngay trên web và có lịch auto-shutdown bảo hiểm.
- Toàn bộ nội dung khóa học và cơ chế kiểm tra chức năng được chuẩn bị kỹ lưỡng trước khi phát sinh chi phí hạ tầng.
