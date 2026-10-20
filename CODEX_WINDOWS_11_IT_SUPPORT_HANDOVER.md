# Tài Liệu Bàn Giao Kỹ Thuật Codex: Triển Khai Windows 11 IT Support & Helpdesk Lab

**Người lập:** Antigravity (Frontend & Curriculum Agent)  
**Người nhận:** Codex (Backend & Infrastructure Agent)  
**Ngày cập nhật:** 20/10/2026  
**Thư mục làm việc:** `D:\Project\LabEx`  

---

## 1. Bối Cảnh & Quyết Định Mới Nhất Từ Người Dùng

1. **Chuyển trọng tâm sang máy trạm nhân viên (Windows 11 Desktop):**
   - Người dùng phản hồi: Tại Việt Nam, thực tập sinh / Junior IT Support mới vào nghề **gần như 100% làm việc trên máy tính người dùng (Windows 11/10 Desktop, PC/Laptop)**. Các hệ thống Windows Server hay AD DS chỉ dành cho Senior/SysAdmin ở công ty lớn.
   - Nhu cầu cấp thiết: Học quy trình setup máy mới (Onboarding), sửa lỗi thường gặp (kẹt máy in, mất mạng, lỗi DNS/hosts, đầy ổ C, lỗi Outlook, lỗi gõ tiếng Việt Unikey), sao lưu dữ liệu nhân viên, phân quyền user/admin.
2. **Chi phí tiết kiệm tối đa, không phát sinh $30/tháng:**
   - Dùng B-series giá rẻ, tắt Deallocate ngay khi học xong.
   - Cài đặt lịch **Auto-Shutdown lúc 23:00 hằng ngày** trên Azure để bảo hiểm chi phí.
3. **Phân công phối hợp:**
   - **Antigravity:** Xây dựng toàn bộ giao diện Frontend, giao diện phiếu Ticket IT Support, chương trình học 20 bài lab, hướng dẫn từng bước (GUI + PowerShell tương đương) và prompt AI Tutor.
   - **Codex:** Triển khai hạ tầng máy ảo Windows 11 (`LabEx-CLIENT01`), cập nhật backend quản lý đa VM (Multi-target Registry), và viết script nạp lỗi (Fault Injection) + bộ chấm (Verifier).

---

## 2. Lệnh Azure CLI Tạo Máy Ảo Windows 11 Tiết Kiệm (Dành Cho Codex Hoặc Người Dùng Chạy)

### A. Kiểm tra Quota hiện tại (Central India):
- Hiện tại Subscription `Azure for Students` đang dùng **2/6 regional vCPUs** (máy `LabEx-WinServer`).
- Tạo thêm 1 máy 2 vCPU sẽ đạt **4/6 vCPUs** $\to$ **Hoàn toàn nằm trong hạn mức cho phép**.

### B. Cấu hình VM Đề xuất:
- **VM Name:** `LabEx-CLIENT01` (ComputerName: `CLIENT01`)
- **Resource Group:** `LabEx-India-RG` (dùng chung RG với Server hiện tại để tiết kiệm)
- **Region:** `centralindia`
- **SKU:** `Standard_B2s` (2 vCPU / 4 GiB RAM) — Compute: **~$0.0528/giờ**.
- **OS Disk:** `StandardSSD_LRS` 64 GiB — Giá lưu trữ: **~$4.80/tháng** (tiết kiệm hơn 70% so với Premium SSD P10).
- **Image:** `MicrosoftWindowsDesktop:windows-11:win11-24h2-ent:latest` (hỗ trợ single-session dev/test theo chính sách Azure for Students).

### C. Lệnh Tạo Máy Chi Tiết (PowerShell):
```powershell
$RG = "LabEx-India-RG"
$LOCATION = "centralindia"
$VM_NAME = "LabEx-CLIENT01"
$VM_SIZE = "Standard_B2s"
$OS_DISK_TYPE = "StandardSSD_LRS"
$ADMIN_USER = "adminlab"
# Lấy mật khẩu an toàn từ file .env hiện có: $env:WINDOWS_ADMIN_PASSWORD
$ADMIN_PASS = $env:WINDOWS_ADMIN_PASSWORD

# 1. Tạo VM Windows 11 Client với ổ Standard SSD 64GB
az vm create `
  --resource-group $RG `
  --name $VM_NAME `
  --location $LOCATION `
  --image "MicrosoftWindowsDesktop:windows-11:win11-24h2-ent:latest" `
  --size $VM_SIZE `
  --storage-sku $OS_DISK_TYPE `
  --os-disk-size-gb 64 `
  --admin-username $ADMIN_USER `
  --admin-password $ADMIN_PASS `
  --public-ip-sku Standard `
  --nsg-rule RDP

# 2. Bật chế độ tự động tắt máy (Auto-Shutdown) lúc 23:00 (16:00 UTC) để bảo hiểm chống quên
az vm auto-shutdown `
  --resource-group $RG `
  --name $VM_NAME `
  --time "1600"

# 3. Tạo 1 bản Snapshot Baseline chuẩn duy nhất ngay sau khi máy tạo xong sạch sẽ
$OS_DISK_ID = (az vm show -g $RG -n $VM_NAME --query "storageProfile.osDisk.managedDisk.id" -o tsv)
az snapshot create `
  --resource-group $RG `
  --name "LabEx-CLIENT01-Baseline-Snap" `
  --source $OS_DISK_ID `
  --sku Standard_LRS
```

---

## 3. Kiến Trúc Backend Cần Nâng Cấp (Codex Triển Khai)

### A. Quản lý Đa VM Target (`server/services/cloudConfig.js`):
Hiện tại `cloudConfig.js` chỉ định nghĩa cứng 1 VM duy nhất (`LabEx-WinServer`).  
Cần hỗ trợ tra cứu theo Target:
```javascript
export function getVmTargetConfig(targetName = 'client', env = process.env) {
  const isServer = targetName === 'server';
  return {
    subscriptionId: env.AZURE_SUBSCRIPTION_ID || '',
    resourceGroup: env.AZURE_VM_RG || 'LabEx-India-RG',
    vmName: isServer ? (env.AZURE_SERVER_VM_NAME || 'LabEx-WinServer') : (env.AZURE_CLIENT_VM_NAME || 'LabEx-CLIENT01'),
    publicIp: isServer ? (env.AZURE_SERVER_VM_IP || '20.40.49.168') : (env.AZURE_CLIENT_VM_IP || ''),
    adminUsername: env.WINDOWS_ADMIN_USERNAME || 'adminlab',
    password: env.WINDOWS_ADMIN_PASSWORD || '',
    rdpPort: Number(env.WINDOWS_RDP_PORT || 3389),
    guacdHost: env.GUACD_HOST || '127.0.0.1',
    guacdPort: Number(env.GUACD_PORT || 4822),
  };
}
```

### B. Điều hướng Run Command & Verifier theo bài Lab:
- Các bài lab thuộc khóa `win11-it-support-helpdesk` sẽ có trường `"target_vm": "client"`.
- Các bài lab cũ (`win-server-*`) tiếp tục dùng `"target_vm": "server"`.
- Trong [`server/routes/cloudVm.js`](file:///d:/Project/LabEx/server/routes/cloudVm.js) và [`server/services/windowsRemoteExecutor.js`](file:///d:/Project/LabEx/server/services/windowsRemoteExecutor.js), đọc tham số `target` hoặc suy từ `labId` để gửi lệnh tới đúng máy ảo tương ứng.

---

## 4. Đặc Tả Kịch Bản Nạp Lỗi & Bộ Chấm (Fault Injection & Grader Rules)

Codex hãy tham khảo và đăng ký các quy tắc sau vào [`server/services/windowsRemoteVerifier.js`](file:///d:/Project/LabEx/server/services/windowsRemoteVerifier.js):

### Ticket 1: Sự Cố Kẹt Hàng Đợi In (Print Spooler Error)
- **Lab ID:** `win11-printer-spooler-fix` — Step ID: `win11-pr-01-sec-1`
- **Inject script:**
  Tạo 2 file giả lập lệnh in bị kẹt trong `C:\Windows\System32\spool\PRINTERS\00012.SHD` và `00012.SPL`, chuyển trạng thái `Spooler` sang Stopped.
- **Learner task:** Sửa lỗi kẹt lệnh in và đưa dịch vụ Spooler hoạt động bình thường trở lại.
- **Verifier probe:**
  ```powershell
  $service = Get-Service Spooler
  $queueFiles = @(Get-ChildItem -Path "C:\Windows\System32\spool\PRINTERS" -Filter "*.*" -ErrorAction SilentlyContinue)
  $service.Status -eq 'Running' -and $queueFiles.Count -eq 0
  ```

### Ticket 2: Sửa Lỗi File Hosts Bị Chặn Web Nội Bộ
- **Lab ID:** `win11-network-dns-troubleshooting` — Step ID: `win11-net-02-sec-1`
- **Inject script:**
  Thêm dòng `127.0.0.1 portal.company.local` vào `C:\Windows\System32\drivers\etc\hosts`.
- **Learner task:** Chẩn đoán tại sao không vào được portal và khắc phục triệt để.
- **Verifier probe:**
  ```powershell
  $hostsContent = Get-Content "C:\Windows\System32\drivers\etc\hosts" -ErrorAction SilentlyContinue
  $blocked = @($hostsContent | Where-Object { $_ -match '127\.0\.0\.1\s+portal\.company\.local' })
  $blocked.Count -eq 0
  ```

### Ticket 3: Cứu Hộ Đầy Ổ C (Disk Full Cleanup)
- **Lab ID:** `win11-disk-cleanup-recovery` — Step ID: `win11-disk-01-sec-1`
- **Inject script:**
  Tạo thư mục rác giả lập `C:\Windows\Temp\DummyLogs` chứa các tệp dung lượng lớn.
- **Learner task:** Thực hiện quy trình dọn dẹp an toàn của IT Helpdesk.
- **Verifier probe:**
  ```powershell
  -not (Test-Path "C:\Windows\Temp\DummyLogs")
  ```

---

## 5. Tiến Độ Phía Antigravity Đã Hoàn Thành

1. **Khóa học & Bài học mới:**
   - Đã thêm khóa học `win11-it-support-helpdesk` vào `server/data/courses.json`.
   - Đã tạo các bài lab JSON mẫu cho Module 1 (Setup máy mới, Phân quyền) và Module 2 (Mạng, Máy in) trong `server/data/labs/`.
2. **Giao diện Web:**
   - Đã đưa nút **Tắt VM (Deallocate)** ra ngoài thanh công cụ máy ảo để tránh quên tắt phát sinh phí.
   - Đã hoàn thiện giao diện **Phiếu Yêu Cầu Hỗ Trợ IT (Helpdesk Ticket)** hiển thị trực quan thông tin người dùng báo lỗi, phòng ban, và các bước hướng dẫn.
3. **Chất lượng mã nguồn:**
   - Toàn bộ 46/46 unit tests (`npm test`) đều Passed 100%.
   - Frontend build thành công 0 lỗi.
