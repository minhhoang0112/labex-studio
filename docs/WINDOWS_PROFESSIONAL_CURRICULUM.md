# Windows: nâng cấp giáo trình trọng tâm, 26/10/2026

## Phạm vi đã làm và điều chưa được nhận là hoàn thành

Không đổi tiến độ người học, không reset container Linux, không tạo/resize VM. Hai khóa Windows 11 nền tảng và networking nền tảng được để lại, không chỉnh tiếp trong đợt này.

Đã rà cách dạy 52 bài hiện có: IT Support, AD/GPO, DNS/DHCP, chẩn đoán vận hành và các bài quản trị liên quan. Hướng dẫn bổ sung GUI, bản chất, bài tập độc lập, giới hạn kết luận và điều kiện chuyển nhóm. Khối helper dài được chuyển khỏi luồng đọc chính sang gợi ý. Giữ task ID và bộ chấm cũ; **đây là rà cách dạy, không phải tuyên bố 52 bài đã trở thành diễn tập doanh nghiệp hoàn chỉnh**. Những bài cũ kiểm kê/báo cáo vẫn chỉ chứng minh tiêu chí kiểm kê/báo cáo.

Các khóa File Server, Automation nâng cao, Security, Hybrid và Capstone chưa được lấp bằng bài giả. Chúng vẫn giữ đề cương. Backup và IIS mới được triển khai một phần, giữ nguyên các mục nâng cao chưa làm trong syllabus để trạng thái khóa không thành Ready giả.

## Các thực hành bổ sung

| Bài | Máy | Công việc phải làm | Bộ chấm thực sự kiểm |
|---|---|---|---|
| `win-it-file-in-use` / HD-P02 | CLIENT01 | Tìm Associated Handles/PID/command line, kết thúc đúng tác vụ giữ file | Windows sharing violation thật trước sửa; mở ReadWrite độc quyền mới sau sửa, dữ liệu CSV gốc, ownership/action task; quá hạn tự thoát không được tính sửa |
| `win-bkr-complete-restore` | CLIENT01 | Chọn dữ liệu nghiệp vụ, backup thư mục con, bỏ cache, restore file đã xóa ra chỗ riêng | Nội dung nguồn/backup, hợp đồng lồng, cache bị loại, source invoice đã xóa, restore đúng SHA256; không chấp nhận chỉ có report |
| `win-bkr-version-rollback` | CLIENT01 | Giữ V1/V2, rollback riêng cấu hình, bảo toàn đơn hàng mới | Cấu hình JSON đúng phiên bản, byte khớp V1, V2 và orders giữ nguyên |
| `win-bkr-archive-validation` | CLIENT01 | Phân biệt ZIP đọc được/ZIP cắt cụt, giải nén vào thư mục mới | Mở ZIP thật, entry/nội dung/kích thước hợp lệ, restore khớp hash và bản hỏng còn nguyên; bộ chấm không giải nén archive tùy ý |
| `win-web-isolated-site` | Server | Tạo site/pool/binding riêng, identity ít quyền, xuất bản và sửa URL 404 | Physical path, loopback binding duy nhất, pool identity, anonymous identity, ACL chỉ đọc của pool, không broad-write, HTTP 200 đúng nội dung index/handbook |

Ticket HD-P01 `win-it-scheduled-backup-permissions` từ đợt trước vẫn giữ: Task Scheduler chạy LOCAL SERVICE, lỗi NTFS thật, không đổi sang SYSTEM để qua; chấm bằng dữ liệu mới và task thật.

HD-P02 đã nghiệm thu thực trên CLIENT01 ngày 26/10/2026: tạo baseline tốt → nạp khóa file và xác nhận sharing violation → chấm chưa sửa trượt → dừng đúng task → chấm mở độc quyền và dữ liệu gốc đạt → reset sạch. Xem `.artifacts/it-support-filelock-live.json`. Không bật/tắt VM cho phép thử.

Không diễn giải quá mức: backup cùng ổ không chống mất VM/đĩa; restore text không chứng minh database/system-state; IIS loopback không chứng minh CLIENT01/DNS/HTTPS; file lock mẫu không phải mô phỏng Office đã cài.

## Hợp đồng backend

Không cần API mới. Course/lab mới đi qua API hiện có:

- `GET /api/courses/windows-backup-disaster-recovery`
- `GET /api/courses/windows-iis-web-services`
- `GET /api/labs/:id`
- `POST /api/verify` với `{ "labId": "...", "stepId": "..." }`
- Riêng HD-P02: `POST /api/cloud-vm/fault/prepare` và `/reset`, body `{ "labId": "win-it-file-in-use", "confirm": true }`.

Tiêu chí riêng ở `server/data/windows-professional-rules.json`, helper ở `server/runtime/windows/professional-common.ps1`. Browser không gửi probe hoặc tự khai điểm. Quy tắc ràng buộc lab/target; sai VM/module, timeout hoặc trạng thái không đúng không đạt. Nút chấm không cài IIS hoặc đổi NIC/firewall. Probe chặn junction/reparse và workspace sai; không chạy script của người học.

HD-P02 dùng lifecycle hiện có Baseline → Healthy → Inject → Faulted; mọi bước phải đạt trước khi state active. Task không có trigger lặp; tự hết hạn 30 phút là failed repair. Reset đối chiếu description/run, identity/action/script, dừng đúng task, xác nhận file dùng được, rồi xóa đúng task/thư mục. Không kill theo tên PowerShell hoặc PID đoán. Recovery baseline và khóa phiên lỗi cũ vẫn được giữ.

## Nguồn sinh dữ liệu — tránh lỗi quay lại ngày hôm sau

Chạy `rtk proxy python -X utf8 scripts/upgrade-windows-professional.py` để cập nhật lại phần mới. Script chỉ viết dữ liệu giáo trình và rules, không gọi Azure. Ba generator cũ `expand-windows-support.py`, `build-windows-enterprise.py`, `review-windows-starter.py` chạy bước nâng cấp này cuối cùng; không chỉ sửa JSON sinh ra rồi để generator ghi đè.

Không đổi task ID chỉ vì sửa văn phong. Thay đổi tiêu chí chứng nhận phải có kế hoạch version/invalidate tiến độ riêng, không tự nhận điểm cũ chứng minh năng lực mới.

## Kiểm thử và nghiệm thu

1. `rtk npm test`: toàn bộ regression, gồm ràng buộc lab/VM, phủ định sai dữ liệu/timeout/missing module và lifecycle fault.
2. `rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-windows-professional-probes.ps1`: chạy lệnh bài backup thật trên fixture tách biệt trong `.artifacts`, kiểm đúng/sai/hỏng, parse cả IIS. Không gọi Azure hoặc sửa IIS máy chính. Dọn đúng thư mục test theo GUID.
3. `rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-windows-fault-syntax.ps1`: parse runtime, không chạy trên VM.
4. HD-P02 live: `rtk proxy node scripts/check-it-support-filelock-live.mjs`. Chỉ chạy khi CLIENT01 đã bật và không có phiên lỗi học viên. Kiểm baseline, lỗi native thật, chưa sửa phải fail, sửa đúng phải pass, reset phải sạch. Kết quả `.artifacts/it-support-filelock-live.json`.
5. IIS live còn phải thực hiện trên Windows Server: không module phải unsupported; đúng site trả 200; pool dừng/identity sai/binding sai/broad-write/nội dung giả phải fail; sửa đúng pass. Sau đó dọn đúng site/pool riêng, kiểm site cũ còn nguyên. Không dùng kết quả mock hoặc syntax để ghi “đã live”.
6. Backup local đã chạy nội dung thật; còn phải nghiệm thu cùng các API trên CLIENT01 trước khi coi là kiểm thử đầu-cuối Azure. Không reset/xóa thư mục bài nếu người học đã dùng; dùng instance test có ownership hoặc hỏi trước khi đụng dữ liệu hiện có.

## Tiếp theo cần làm có chiều sâu

Ưu tiên IT Support: cài đặt MSI có nguồn/chữ ký/log thật, lỗi standard-user ghi dữ liệu, service/config/dependency trong namespace riêng, đo performance có baseline và tải giới hạn, printer queue/port trên thiết bị lab thực. Không tạo event/CBS giả hoặc tắt bảo vệ toàn máy để có lỗi.

File Server cần chuỗi hai máy: tạo nhóm vai trò và nhóm tài nguyên → share/NTFS → thử user được phép và user không được phép từ CLIENT01 → sửa lỗi → revoke/offboard và thử lại. Chấm dưới SYSTEM trên Server không thay được token của người dùng. Chưa có phiên đăng nhập/credential handling an toàn và negative probe hai identity thì giữ khóa tương ứng chưa sẵn sàng.

AD/GPO/DNS giữ gate private path/domain SID/client evidence đã có. DHCP thực tiếp tục cần provider mạng cô lập, không phục vụ DHCP trên NIC Azure quản trị. Disaster recovery AD cần bản sao lab và runbook kiểm thử riêng; không restore snapshot DC đang dùng.

Nguồn tham khảo trực tiếp: [Robocopy](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy), [IIS pool identities](https://learn.microsoft.com/en-us/iis/manage/configuring-security/application-pool-identities), [IIS HTTP 404](https://learn.microsoft.com/en-us/troubleshoot/developer/webapps/iis/site-behavior-performance/troubleshoot-404-file-not-found-error), [Windows file handles](https://learn.microsoft.com/en-us/windows/win32/fileio/creating-and-opening-files).
