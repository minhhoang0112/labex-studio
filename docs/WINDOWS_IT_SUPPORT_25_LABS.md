# Windows 11 IT Support — 25 bài, 50 nhiệm vụ

Ngày cập nhật: 2026-10-20. Khóa: `windows-11-it-support-troubleshooting`.

Giáo trình tiếng Việt tự biên soạn theo tài liệu Microsoft, chạy trên CLIENT01 hiện có. Mỗi bài mới có ticket, nguyên lý, hướng dẫn GUI/PowerShell, kết quả mong đợi, lỗi cần tránh, câu hỏi tự giải thích và hai liên kết Microsoft. Đây không phải khóa sao chép từ LabEx hay chứng chỉ Microsoft.

## Thứ tự học

| Bài | Nội dung | Cách thực hành |
|---|---|---|
| 1 | Onboarding và múi giờ | Cấu hình |
| 2 | Tiếp nhận ticket, kiểm kê máy | Chẩn đoán và ghi nhận |
| 3 | Phần mở rộng kép CSV/TXT | Nạp lỗi |
| 4 | Triển khai, nâng cấp ứng dụng portable | Cài đặt mẫu có rollback |
| 5 | Ứng dụng không chạy vì đường dẫn cấu hình | Nạp lỗi |
| 6 | PATH và biến môi trường | Thử nghiệm trong process riêng |
| 7 | Tài khoản local, SID và nhóm | Kiểm kê, tạo nhóm chức năng |
| 8 | ACL và quyền NTFS | Cấp quyền nhóm vào thư mục lab |
| 9 | IPv4, DHCP, gateway và route | Đọc cấu hình NIC thật |
| 10 | DNS server, resolver, hosts và cache | Chẩn đoán |
| 11 | Sai hosts khiến portal không truy cập được | Nạp lỗi |
| 12 | TCP listener và cổng ứng dụng | Thử loopback có/không listener |
| 13 | Firewall profile, rule và port filter | Kiểm kê, giữ nguyên RDP |
| 14 | Print Spooler dừng và tệp orphan | Nạp lỗi |
| 15 | Máy chậm: tiến trình, RAM và đĩa | Thu thập bằng chứng |
| 16 | Tìm và dọn log mẫu | Nạp lỗi có giới hạn dung lượng |
| 17 | Robocopy, mã thoát, log và SHA256 | Backup hai tài liệu mẫu |
| 18 | Tài liệu bị xóa nhầm | Nạp lỗi, restore từ backup |
| 19 | ZIP và diễn tập restore | Nén, giải vào thư mục mới, so hash |
| 20 | Scheduled backup bị disable | Nạp lỗi, chạy task và so file |
| 21 | Event Viewer, CSV và EVTX | Thu thập log thật |
| 22 | Device Manager và driver | Kiểm kê PnP, mã lỗi, publisher |
| 23 | Windows Update và DISM CheckHealth | Chẩn đoán, không tự reboot |
| 24 | Startup app, service và ngữ cảnh SYSTEM | Kiểm kê |
| 25 | Capstone: backup, change, rollback, handover | Tự luyện có lời giải và chấm trạng thái |

Các ID và task ID của bốn bài cũ được giữ nguyên. Chỉ đổi vị trí để học theo nền tảng trước, khôi phục sau. Bài mới có `curriculum_version: 3`.

## Cơ chế thực hành và chấm

- 7 bài có kịch bản: 3 bài cũ và 4 bài mới (extension, appconfig, restorefile, taskbackup).
- Kịch bản dùng khóa CLIENT01, journal bền vững, xác minh snapshot baseline và bằng chứng đã thử khôi phục. Chỉ nhận scenario/operation trong whitelist.
- Quy trình: Baseline → Healthy → Inject → Faulted → học viên sửa → Healthy → Reset. Chưa nạp lỗi không được chấm repair thành công. Không chạy hai bài nạp lỗi cùng lúc.
- Bốn tình huống mới chỉ tác động `C:\LabEx\PracticeFaults\<scenario>` và task riêng `LabExSupportBackup`. Không đổi DNS, NIC, tài khoản RDP hoặc dịch vụ Azure Agent.
- Các bài chẩn đoán/cấu hình có 38 bộ kiểm tra trạng thái mới: đọc JSON/CSV/EVTX, đối chiếu cấu hình thật, ACL hoặc hash. Bốn bước repair mới dùng functional probe của dịch vụ nạp lỗi. Không tự cho đạt vì bấm nút.
- Hoàn nguyên kịch bản chỉ dọn dữ liệu kịch bản. File bài cấu hình/chẩn đoán nằm riêng ở `C:\LabEx\Labs\<labId>` và giữ lại để học viên xem. Nhóm lab `LabEx_DocReaders` được giữ để học tiếp NTFS.
- Desktop và PowerShell web khác ngữ cảnh: Desktop là user tương tác; Azure Run Command chạy SYSTEM. Không dùng kết quả HKCU của SYSTEM để giả là cấu hình user Desktop. Mỗi lần gửi PowerShell là process mới.

## Phạm vi chưa được mô phỏng

Không cố gây BSOD, phá boot, gỡ NIC/driver lưu trữ, làm đầy ổ hệ điều hành hoặc vô hiệu hóa bảo vệ để tạo lỗi. Driver/Update/Firewall là bài chẩn đoán trên trạng thái thật. Không có Outlook/Exchange, Office license, máy in vật lý, Wi-Fi/USB thật; nội dung không nhận đã thực hành những hệ thống đó.

Ứng dụng cài đặt là công cụ portable nội bộ mẫu. Backup/ZIP trên cùng VM là bài tập, chưa chống được mất VM/ransomware và không thay thế chính sách backup ngoài máy. DISM CheckHealth đọc trạng thái đã ghi nhận, không tương đương quét và sửa toàn bộ Windows. Câu hỏi hiểu bản chất và xác nhận của người dùng chưa được tự động chấm.

## Bảo trì và kiểm tra

- Nguồn biên soạn: `scripts/expand-windows-support.py`; chạy lại chỉ tái tạo 21 bài mới, rule manifest và thứ tự/metadata khóa; không chạy lệnh trên VM.
- Rule đáng tin nằm trong `server/data/windows-support-rules.json`, được backend đọc; không lấy biểu thức chấm từ trình duyệt.
- Kịch bản mới: `server/runtime/windows/practice-faults.ps1`.
- Kiểm tra cú pháp không thực thi: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-windows-fault-syntax.ps1`.
- Kiểm tra catalog: `python -X utf8 server/data/generate_labs.py`.
- Unit/integration: `npm test`; build: `npm run build:client`.
- Kiểm tra Azure thật chỉ khi chủ động gọi `node scripts/windows-support-expanded-smoke.mjs --live`. Script yêu cầu CLIENT01 ban đầu deallocated và không có fault session chưa hoàn nguyên; không lấy phiên của học viên đang dùng. Khởi động để test rồi deallocate khi kết thúc. Báo cáo `.artifacts/windows-support-expanded-live.json` ghi kết quả thực tế; không đồng nhất unit test với kiểm thử VM thật.
- Khi toàn bộ bài mới đạt, script chuyển riêng đầu ra của 21 bài thử sang `C:\LabEx\SmokeEvidence\expanded-support-20261020`, có kiểm tra đường dẫn/reparse point và không ghi đè đích có sẵn. Điều này giữ bằng chứng nhưng tránh để sẵn file làm các bước được chấm đạt trước khi học viên thực hành. Không chuyển thư mục của bốn bài gốc.

Hai khác biệt đã phát hiện khi chạy VM thật: ACL Allow có thể tự thêm cờ `Synchronize`, nên bộ chấm chỉ bỏ cờ tự động đó trước khi so quyền đọc và vẫn kiểm tra scope kế thừa; JSON Startup dùng object chứa `Items` để tránh khác biệt cách PowerShell 5.1 đưa mảng qua pipeline.

## Kết quả nghiệm thu ngày 2026-10-20

- Backend: 57/57 kiểm thử đạt. Catalog: 231 bài toàn dự án, trong đó khóa này 25 bài/50 nhiệm vụ.
- PowerShell: hai script kịch bản, 38 biểu thức chấm và 42 khối lệnh của bài mới đã qua parser.
- VM thật: 17 bài cấu hình/chẩn đoán mới chạy đủ hai bước và probe tương ứng; bốn bài nạp lỗi mới đều chứng minh trạng thái lỗi, chấm trượt trước sửa, chấm đạt sau sửa và hoàn nguyên thành công.
- Báo cáo `.artifacts/windows-support-expanded-live.json`: `passed: true`, `smokeEvidenceArchived: true`, `deallocated: true`, hoàn tất lúc 2026-10-20 11:08:50 UTC.
- Đầu ra thử đã chuyển sang thư mục SmokeEvidence trên CLIENT01, không để sẵn file hoàn thành bài ở workspace học viên. Journal cuối ở trạng thái `reset`.

Giữ `server/runtime/state/` vì chứa journal và bằng chứng baseline. Không chạy generator cũ của Antigravity đè lại toàn bộ khóa. Script `align-windows-support-curriculum.py` đã được giới hạn đúng bốn bài gốc để tránh hạ phiên bản những bài mới.

Nguồn nền tảng: [Microsoft Robocopy](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy), [NTFS icacls](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/icacls), [Windows recovery](https://support.microsoft.com/en-us/windows/experience/backup-recovery/backup-restore-and-recovery-in-windows), [DISM](https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image?view=windows-11). Mỗi bài có nguồn chi tiết riêng.
