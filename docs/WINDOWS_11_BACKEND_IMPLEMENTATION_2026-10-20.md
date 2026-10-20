# Windows 11 IT Support — triển khai backend và Azure

> Cập nhật giáo trình tiếp theo: khóa đã được mở rộng thành **25 bài / 50 nhiệm vụ**, gồm 7 kịch bản nạp lỗi. Xem [WINDOWS_IT_SUPPORT_25_LABS.md](WINDOWS_IT_SUPPORT_25_LABS.md) để dùng giáo trình và danh sách kiểm tra hiện tại. Các mục nói về 4 bài/3 kịch bản bên dưới mô tả mốc triển khai hạ tầng ban đầu.

Ngày: 20/10/2026. Đầu vào: `CODEX_WINDOWS_11_IT_SUPPORT_HANDOVER.md` của Antigravity và phản hồi người dùng cho phép OS disk Standard SSD 128 GiB, tự tắt 23:00 giờ Việt Nam.

## 1. Hạ tầng đã tạo và các khác biệt bắt buộc với bàn giao

- **LabEx-CLIENT01**, computer name CLIENT01, Central India, cùng RG LabEx-India-RG. Không thay đổi VM Server cũ.
- Image Windows 11 Enterprise 24H2, version **26100.9711.261011**, Gen2, Trusted Launch, Secure Boot, vTPM.
- **Standard_B2als_v2, 2 vCPU / 4 GiB**: Azure từ chối B2s vì Capacity Restrictions. Cấu hình B2als_v2 cùng CPU/RAM đã qua ARM validation, giá retail thấp hơn B2s; không chuyển sang máy lớn hơn.
- **OS disk StandardSSD_LRS 128 GiB**: Azure image API trả minimum 127 GiB, nên đề xuất 64 GiB không dùng được với image đó. Người dùng đã xác nhận cho phép 128 GiB trước khi tạo.
- VNet/NIC/NSG riêng cho CLIENT01, không peering với Server. RDP chỉ mở từ IP public /32 của gateway tại thời điểm tạo; không mở toàn Internet. Nếu đổi mạng Internet, cần cập nhật đúng nguồn NSG trước khi kết nối lại.
- Lịch Azure **Enabled**, daily `2300`, timezone **SE Asia Standard Time**, task ComputeVmShutdownTask; đúng 23:00 Việt Nam, không nhầm sang 23:00 UTC. Đã đọc lại từ ARM.
- Password client được tạo mới, lưu riêng trong `.env`, không đưa vào trình duyệt, tài liệu hay output. Client không dùng ngầm IP/password Server.
- Một snapshot **LabEx-CLIENT01-Baseline-Snap / Standard_LRS**. Ổ hoạt động sau thử khôi phục là **LabEx-CLIENT01-OS-Proven**; hai ổ tạm của phép thử đã xóa sau khi xác minh Unattached, đúng tên/ID và không phải ổ hiện dùng. Không xóa đĩa Server.

Các resource group không có phí riêng chỉ vì tạo thêm group. Dùng chung group là lựa chọn tổ chức, không phải cơ chế giảm giá compute/disk.

Giá retail đọc 20/10: B2als_v2 base **$0.0246/giờ**, Windows Server meter **$0.0338/giờ**. Không gán Windows Server meter thành hóa đơn Windows 11; cần theo dõi usage thực theo offer Windows client dev/test. OS disk 128 GiB E10 LRS khoảng **$10.56/tháng**, Standard IPv4 **$0.005/giờ giữ IP**, snapshot Standard LRS **$0.05/GB thực dùng/tháng**, chưa thuế/IO/egress. Bật khi học, Deallocate khi nghỉ vẫn là hướng chính; disk/IP/snapshot giữ lại vẫn có thể tính phí.

## 2. Baseline và phép thử khôi phục thật

Đã kiểm tra trên guest thật: computer CLIENT01, Microsoft Windows 11 Enterprise, OS volume **FullyDecrypted**, BitLocker protection Off. Không tắt BitLocker trên máy đang có dữ liệu của người dùng.

Quy trình đã thử trên riêng VM mới:

1. Clean shutdown/deallocate rồi tạo snapshot baseline.
2. Bật VM, tạo marker sau thời điểm snapshot.
3. Tạo managed disk từ snapshot và đổi OS disk của CLIENT01.
4. Khởi động lại, dùng Azure Agent kiểm tra guest thật và marker phải vắng mặt.
5. Chỉ sau khi đạt mới ghi `recoveryTested=true` và cho phép nạp lỗi; dọn các ổ thử đã detach.

Hai điểm cần giữ khi phát triển tiếp:

- Patch đổi OS disk **không đổi createOption sang Attach** cho VM đã tồn tại; Azure từ chối thay thuộc tính immutable. Chỉ đổi managedDisk.id/name cần thiết.
- Lần khôi phục đầu, marker xuất hiện trở lại. Sau khi thay lệnh Run Command cuối bằng lệnh chỉ đọc và khôi phục lại một ổ mới từ cùng snapshot, marker đã vắng mặt. Điều này phù hợp khả năng Agent áp dụng lại goal state sau restore; khi thiết kế reset phải kiểm chứng kết quả, không chỉ thấy ARM swap thành công là báo máy sạch. Chưa khẳng định đây là quy tắc cho mọi loại Azure extension.

Bằng chứng local (không chứa mật khẩu): `server/runtime/state/client-baseline.json`. File này chứa snapshot ID, original disk ID, active disk ID và kết quả guest proof; **là trạng thái vận hành, không phải cache để xóa**. Folder đã gitignore.

Backend chỉ chấp nhận baseline khi env recovery flag, bằng chứng local và thông tin VM/snapshot/disk thực từ ARM khớp nhau. Tự bật một cờ boolean phía FE không mở được nạp lỗi.

## 3. Multi-target đã gắn xuyên suốt

`getVmTargetConfig('server'|'client')` trong cloudConfig.js giữ default **server** cho tương thích API cũ. Các request có labId được resolve theo metadata backend `target_vm`. Target browser gửi không khớp bài thì HTTP 400; không nhận hostname, resource group hoặc tên VM tùy ý.

Ánh xạ hiện tại:

| Nhóm | Target |
| --- | --- |
| Các bài Windows Server/PowerShell cũ | server → LabEx-WinServer |
| win-it-pc-onboarding-setup | client → LabEx-CLIENT01 |
| win-it-printer-spooler-fix | client → LabEx-CLIENT01 |
| win-it-network-dns-troubleshoot | client → LabEx-CLIENT01 |
| win-it-disk-cleanup-recovery | client → LabEx-CLIENT01 |

Status, start, stop, RDP download, Desktop ticket, Run Command và verifier đều dùng cùng target. Ticket một lần chứa target phía server nên không chuyển sang Server do một query khác khi WebSocket upgrade. Power state/cache/pending operation tách theo target.

Một khóa theo VM điều phối power operation, PowerShell, prepare/verify/reset trong backend process. Journal bền vững ngăn mở bài sự cố khác khi phiên cũ chưa reset, và khóa thao tác khi đang preparing/resetting. Thiết kế hiện tại dành cho **một backend process**; chưa phải distributed lock cho nhiều backend replicas.

Không còn nhánh ép mọi bài Windows thành Ready/can_grade trong courses API. Grader Windows dùng khả năng remote của Windows, không phụ thuộc capabilities của Linux Docker. Windows không được mở nhầm Linux terminal hoặc reset môi trường Linux. Bài đọc vẫn mở được khi chưa có môi trường/chấm bài sẵn sàng.

## 4. API để Antigravity dùng

Các API có sẵn được giữ tương thích; FE mới phải luôn gửi labId:

```text
GET  /api/cloud-vm/status?labId=win-it-printer-spooler-fix
POST /api/cloud-vm/start        {"labId":"win-it-printer-spooler-fix"}
POST /api/cloud-vm/stop         {"labId":"win-it-printer-spooler-fix"}
GET  /api/cloud-vm/connect.rdp?labId=win-it-printer-spooler-fix
POST /api/cloud-vm/desktop-session {"labId":"...","width":1280,"height":800,"dpi":96}
POST /api/cloud-vm/powershell   {"labId":"...","command":"Get-Service Spooler"}
POST /api/cloud-vm/fault/prepare {"labId":"win-it-printer-spooler-fix","confirm":true}
POST /api/cloud-vm/fault/reset   {"labId":"win-it-printer-spooler-fix","confirm":true}
POST /api/verify                {"labId":"...","stepId":"..."}
```

Start/stop trả 202 nghĩa là đã nhận thao tác, không phải đã xong; poll status ARM. Stop dùng **deallocate**. Prepare/reset chạy đồng bộ đến khi probe kết thúc, có thể mất vài phút do mỗi Azure Run Command thường từ khoảng 20 giây. Chỉ GET khóa/bài/status không tự bật VM.

Status thêm `target` và `faultSession` cho client. Session có labId, id, target, state; các state là preparing, active, repaired, resetting, reset hoặc failed. Không gửi script inject, password hoặc kết quả chấm do browser tự cung cấp.

Lỗi baseline chưa đủ trả 409 CLOUD_BASELINE_REQUIRED; bài khác đang chiếm client trả 409 CLOUD_SESSION_CONFLICT; thao tác đang chạy trả 409 CLOUD_BUSY. Chuẩn bị/hoàn nguyên thất bại là lỗi hạ tầng, không tự ghi bài đạt. Sau crash ở preparing/resetting phải kiểm tra trạng thái thực và phục hồi, không tự xóa journal để cho bài tiếp theo chạy.

## 5. Ba kịch bản và phạm vi chấm thật

Các ID trong bàn giao ban đầu (`win11-...`) không trùng JSON thực tế. Backend đã dùng đúng ID đang có:

| Lab thực tế | Step sửa lỗi | Điều kiện |
| --- | --- | --- |
| win-it-printer-spooler-fix | win-it-pr-sec-2 | Spooler Running và queue sạch |
| win-it-network-dns-troubleshoot | win-it-net-sec-2 | portal.company.local phân giải về 127.0.0.1, portal TCP/HTTP thật 18080 trả nội dung mong đợi |
| win-it-disk-cleanup-recovery | win-it-dsk-sec-2 | DummyLogs xuống tối đa 1 MiB, employee-note.txt vẫn còn nguyên nội dung |

Prepare luôn kiểm tra baseline tốt, inject và chứng minh fault tồn tại trước khi giao bài. Chưa có session đã inject thì bước sửa lỗi không được pass chỉ vì máy vốn đang khỏe.

- **Spooler:** dừng dịch vụ thật, tạo hai tệp orphan riêng LabEx-orphan.SHD/SPL khi queue ban đầu rỗng. Tệp này không phải cấu trúc print job Windows hợp lệ; không tuyên bố đã tái hiện driver crash/locked job hoặc in thành công trên máy in vật lý.
- **Hosts:** portal riêng được chạy trên loopback, hosts bị trỏ sang TEST-NET sai. Không sửa management DNS, IP/DHCP, RDP hoặc VM Agent. Xóa dòng sai chưa đủ nếu không có phân giải đúng; probe kiểm tra resolver và dịch vụ, không chỉ tìm regex trong hosts. Reset trả hosts theo checksum bản gốc, dừng task portal do lab tạo.
- **Disk:** tạo tối đa 256 MiB log thật trong C:\Windows\Temp\DummyLogs khi còn ít nhất 5 GiB. Không làm đầy ổ C; bảo vệ tệp nhân viên mẫu ở C:\LabEx\Keep. Chấp nhận thư mục còn tồn tại nhưng đã sạch. Reset chỉ dọn phạm vi fixture chính xác và từ chối reparse point khi xóa cây.

Reset API là **hoàn nguyên thay đổi của kịch bản**, trả `fullVmReset:false`. Nó không xóa mọi thay đổi tự do của học viên và không thay OS disk trên mỗi lần bấm. Full OS recovery đã được thử bằng công cụ hạ tầng; chưa cung cấp nút full-VM reset trên web cho mọi loại hỏng hệ điều hành. Nếu học viên làm hỏng ngoài phạm vi fixture, phải báo cần phục hồi baseline.

Năm bước còn lại của bốn bài dùng timezone state hoặc lịch sử lệnh thành công trên đúng Azure VM và probe từ guest; không dùng lịch sử Linux. Khóa mới hiện có **4 bài/8 task**, không phải 20 bài đã hoàn thành. Unikey mới là phần đọc tham khảo; không chứng nhận đã sửa Unikey khi chỉ chạy hostname.

## 6. Nội dung và FE đã chỉnh để khớp backend

WindowsConsole gửi labId cho status/start/stop/RDP; giữ nút Tắt VM ngoài thanh chính. Bổ sung nút Chuẩn bị sự cố và Hoàn nguyên kịch bản cho ba lab, xác nhận thao tác, hiển thị state/lỗi và khóa input khi đang xử lý. Không tự inject khi mở bài.

Bốn JSON đã đồng bộ sections/steps, đủ content/task/hint, có verification metadata Windows remote tham chiếu đúng step ID. Có backup bản trước ở `.artifacts/windows-support-before-backend-alignment`. Script migration có thể chạy lại, không đổi IDs hoặc course membership.

Đã bỏ hướng dẫn release IP trên card Azure giữ RDP/Agent, giải thích giới hạn APIPA/DHCP trong bài hiện tại. Hướng dẫn Unikey không còn khuyên mọi trường hợp luôn chạy Administrator. Tên task đã thu hẹp theo điều thực sự được kiểm tra; không gắn nhãn khóa sửa đầy ổ C khi fixture chỉ là bài dọn log giới hạn.

## 7. Kiểm thử và bằng chứng

- Unit tests: **54/54 đạt** tại lượt kiểm tra cuối, gồm trường hợp lệnh trên Server không được chấm thành bài client và ticket Desktop phải kiểm tra lại quyền khi upgrade.
- Catalog validator: **210 bài hợp lệ**, không chạy lệnh bài học trên host.
- Frontend build thành công; lint 0 lỗi, còn warnings đã có ở các thành phần ngoài thay đổi Windows.
- PowerShell AST parser đạt; bước này chỉ là kiểm tra cú pháp.
- UI fixture check đạt: không auto-start, labId đúng cho start/stop/RDP, lỗi baseline được hiển thị, không gọi Azure thật. `.artifacts/windows-target-ui.json`.
- Baseline full OS recovery thật: đã đạt, report trong `server/runtime/state/client-baseline.json`.
- **Ba kịch bản cloud thật đều đạt**: inject được xác minh, chưa sửa trượt, sửa đúng đạt, reset thành công; job kết thúc đã deallocate CLIENT01.
- **Browser → API → Azure/RDP thật đạt**: bật đúng CLIENT01, render màn hình Windows 11, hostname chạy trên CLIENT01, chấm qua HTTP đạt và nút tắt gửi deallocate. Sau job đã xác nhận deallocated. Ảnh RDP đầu tiên hiển thị màn Choose privacy settings của Windows ở lần đăng nhập đầu; hướng dẫn onboarding đã bổ sung cách hoàn tất wizard trước khi mở Settings. Đây là bằng chứng kết nối Windows thật, không được mô tả là ảnh desktop taskbar sau khi hoàn tất OOBE.

```text
.artifacts/windows-support-cloud-smoke.json
.artifacts/windows-client-live.json
.artifacts/windows-client-live-desktop.png
```

## 8. Công cụ vận hành và việc tiếp theo

```powershell
# Validation mặc định, chưa deploy; không chạy lại --deploy khi VM đã có.
rtk proxy node scripts/provision-windows-client.mjs --disk-gib=128 --size=Standard_B2als_v2
# Chỉ dành cho VM mới chưa có report baseline; không dùng để reset máy đang học.
rtk proxy node scripts/initialize-windows-client.mjs
# Kiểm tra cú pháp, không chạy các script nạp lỗi trên máy cá nhân.
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-windows-fault-syntax.ps1
rtk proxy python -X utf8 server/data/generate_labs.py
rtk proxy npm test
```

`windows-support-cloud-smoke.mjs` và `check-windows-client-live.mjs` **có bật VM và thay đổi fixture trên CLIENT01 thật**, chỉ chạy khi không có phiên học đang dùng, cuối job deallocate. Không chạy như unit tests thông thường. `complete-client-recovery.mjs` và cleanup script là công cụ phục hồi phép thử khởi tạo bị gián đoạn, không phải API reset chung.

Antigravity tiếp tục xây 20 bài theo từng nhóm có môi trường và grader thật: onboarding/user/admin → mạng cơ bản/hosts → in ấn → dữ liệu/dung lượng → startup/app → ticket tổng hợp. Outlook/M365 cần phần mềm/license/tenant phù hợp, không gắn Ready khi chưa chuẩn bị. Bài vật lý RAM/cáp/SSD không được gọi là đã tái hiện đầy đủ trên Azure VM.

Khi thêm task mới, gửi đúng labId/stepId và tiêu chí kết quả; đăng ký backend rồi kiểm tra negative/positive/reset trước khi công bố sẵn sàng. Không sửa các ID để giống bản bàn giao cũ hoặc ép tất cả Windows Ready. Server/AD/DNS/GPO là nhánh tiếp theo, không cài đồng loạt lên CLIENT01 hoặc VM 1 GiB hiện có.
