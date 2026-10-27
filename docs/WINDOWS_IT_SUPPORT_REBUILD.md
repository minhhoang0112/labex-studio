# Làm lại Windows theo công việc IT Support và System

Ngày: 2026-10-26. Ưu tiên người học đã chọn: **IT Support máy trạm trước**, sau đó mới triển khai chuỗi Server + CLIENT01. Đây là kế hoạch thay đổi chất lượng; không phải xác nhận các bài trong kế hoạch đã chạy được.

## Những gì rà soát được

- Hai khóa nền tảng đã đổi sang lệnh ngắn nhưng phần chấm vẫn dựa nhiều vào collector. Việc đổi cách trình bày không tự biến chúng thành thực hành nghề nghiệp.
- Khóa IT Support cũ có 25 bài, 7 kịch bản nạp lỗi. Các bài kiểm kê, đổi đuôi tệp và dữ liệu mô phỏng chỉ nên là bài khởi động/bổ trợ, không đại diện năng lực xử lý ticket.
- File Server và IIS chuyên biệt chưa có bài. Trong 36 nhiệm vụ enterprise hiện có: 20 nhánh server, 11 nhánh cần domain-client, 5 nhánh DHCP cách ly. Chưa thấy environment proof cho domain-client; không được quảng cáo đã kiểm thử cả chuỗi hai máy.
- Các bài đang tồn tại và tiến độ được giữ. Không đổi số lượng badge sang “đạt chuẩn thực tế” chỉ vì có JSON/đáp án.

## Phân vai đúng

**Máy trạm:** tài khoản local/UAC, phần mềm, process/service, thiết bị, quyền NTFS cục bộ, sự cố người dùng, backup/restore. Tài khoản và quyền không phải chỉ có trên Server; chỉ dạy lượng nền tảng cần dùng trong ticket.

**Windows Server:** AD DS, OU, user/group domain, DNS, GPO, file share, dịch vụ nội bộ, giám sát/khôi phục máy chủ.

**Hai máy:** đăng nhập domain; kiểm tra SMB bằng tài khoản nhân viên; áp GPO và đọc kết quả trên CLIENT01; xử lý DNS/domain join/secure channel; quyền share kết hợp NTFS. Tạo OU/GPO trên server chưa đủ để chấm chức năng từ client.

Hai VM hiện có dùng cho lab tiết kiệm; không tự tạo/nâng cỡ máy. Việc đồng đặt nhiều role trên một server để học không phải mẫu triển khai production. DHCP server phát lease thật cần môi trường L2/cách ly phù hợp; không giả vờ scope Azure VNet là lab DHCP thật.

## Tiêu chuẩn một bài được coi là thực hành nghề nghiệp

1. Ticket cụ thể: ai bị ảnh hưởng, công việc nào không làm được, dấu hiệu ban đầu; chưa lộ nguyên nhân ngay ở đoạn đầu.
2. Đường chẩn đoán: GUI để quan sát và lệnh ngắn cho phép kiểm tra tương ứng; giải thích vì sao kiểm tra chỗ đó và kết quả loại trừ được gì.
3. Chuẩn bị tạo dữ liệu/điều kiện trước sửa; không tạo sẵn kết quả học viên cần đạt hoặc “báo cáo đã sửa”.
4. Nạp lỗi phải chứng minh chức năng tốt trước đó, làm hỏng thật trong phạm vi riêng, chứng minh lỗi tái hiện. Không giả sự cố bằng một biến JSON hoặc log gõ sẵn.
5. Sửa tối thiểu, giữ đường quản trị/hoàn nguyên. Không chấp nhận chạy hết bằng Administrator, tắt UAC/firewall hay cấp Everyone Full control để vượt chấm.
6. Chấm bằng phép thử nghiệp vụ mới dưới đúng identity: tạo/đọc/ghi, chạy job, kết nối dịch vụ, lấy đúng dữ liệu. Có ca âm: chưa sửa, sửa nhầm account, output cũ, file chép tay, quyền quá rộng.
7. Chuẩn bị/thu bằng chứng không được tự giải bài rồi chấm đạt. Quan sát/read-only không tự được điểm chỉ vì máy có cấu hình sẵn.
8. Hoàn nguyên theo ownership và xác minh xong. Nếu trạng thái/nguồn lực đã bị đổi ngoài phạm vi, từ chối thao tác thay vì xóa nhầm.
9. Bàn giao ticket và câu hỏi “vì sao”. Điểm tự động xác nhận phần chức năng; giải thích tự do/khả năng xử lý ngoài đời phải được đánh giá riêng.
10. Chỉ gọi là dùng được sau kiểm thử trên VM thật, gồm ít nhất một ca chưa sửa bị chấm trượt và một ca sửa đúng đạt.

## Trình tự ưu tiên máy trạm

| Nhóm | Ticket cần dựng | Kết quả kiểm chứng | Điều kiện còn cần làm |
|---|---|---|---|
| HD-P01 | Backup vẫn Enabled nhưng Access denied dưới account thực thi | Task LOCAL SERVICE tự sao chép nội dung mới; hash đúng; không dùng admin/Everyone | Đã có source/runtime/lesson; xem báo cáo live bên dưới |
| Ứng dụng | Cài phần mềm đúng kiến trúc/phạm vi user-machine; sửa lỗi cài đặt từ log | Cài/khởi chạy ứng dụng thật và kiểm phiên bản/phạm vi | Chọn installer nguồn chính thức, kiểm chữ ký/hash, kiểm thử install/uninstall |
| Tệp đang dùng | Xóa/đổi tên thất bại do process giữ handle | Tìm đúng process và giải phóng đúng handle, giữ dữ liệu | Native file-lock fixture + GUI process/handle; không gắn nhãn lỗi Excel khi chưa có Office |
| Quyền người dùng | Admin mở được nhưng user thường không lưu được tài liệu | Standard-user process đọc/ghi đúng phạm vi; không mở quyền rộng | Identity test riêng và hoàn nguyên ACL; không chấm bằng SYSTEM đọc hộ |
| Dịch vụ ứng dụng | App không khởi động vì dependency/config/path/quyền chạy sai | Dịch vụ thật khởi động và thao tác ứng dụng thành công | Service riêng của lab; không phá Azure Agent/RDP hoặc tắt một service rồi coi là toàn bộ bài |
| Backup | Job “thành công” nhưng bỏ sót dữ liệu; restore nhầm bản/nhầm đích | Fresh files + so sánh hash + restore vào nơi kiểm chứng | Thêm freshness/version và kiểm thử dữ liệu ngoài phạm vi còn nguyên |
| Dung lượng | Ứng dụng không lưu được do volume/quota đầy | Ghi tệp mới được sau sửa tối thiểu | Volume/VHD nhỏ cách ly; không lấp đầy C: hoặc xóa Temp chung |
| Máy in | Sai queue/port, job kẹt, quyền in hoặc lỗi driver | Job được xử lý đúng đích và có kết quả xác minh | Chốt printer/virtual printer và giới hạn: không giả máy in vật lý khi không có |
| Hiệu năng | Process CPU cao, memory pressure, storage bottleneck | Bằng chứng phân biệt nguyên nhân và thay đổi đo lại được | Workload bounded, tự dừng, không làm B2s mất điều khiển; không chỉ đọc Get-Process |
| Update | Update thật thất bại vì nguyên nhân tái hiện được | Mã lỗi/log thật, sửa nguyên nhân và kiểm tra lại | Chọn fault an toàn và đường recovery; chưa có thì giữ planned, không giả CBS/WindowsUpdate event |
| Profile/logon | App lỗi riêng một profile; profile tạm | So sánh user lỗi/user chuẩn và xác minh sau sửa | User/profile riêng, bảo toàn dữ liệu và local admin quản trị; không phá profile đang dùng |
| Remote support | RDP kết nối lỗi do mạng/rule/quyền/dịch vụ | Kết nối đầu-cuối thật sau sửa và rollback rule đúng | Kênh cứu hộ Azure Agent, timeout tự phục hồi; tránh khóa chính người học ngoài VM |

Không đưa toàn bộ bảng thành khóa “Ready” bằng cách sinh thêm 12 JSON. Mỗi ticket phải qua acceptance trước khi đưa vào chuỗi học chính.

## HD-P01 hiện thực đầu tiên

- URL: `/labs/win-it-scheduled-backup-permissions` (bài bổ sung cuối khóa IT Support).
- Source: `scripts/build-it-support-practical.py`.
- Runtime: `server/runtime/windows/backup-permission-fault.ps1`.
- Task: `LabExSupportBackupAcl`; chỉ thư mục `C:\LabEx\PracticeFaults\taskacl`.
- Principal: LOCAL SERVICE / SID S-1-5-19; giữ action và script gốc. RunLevel không nâng Local Service thành Administrator; identity/ACL mới quyết định khả năng ghi.
- Lỗi thật: script backup Copy-Item vào destination không có quyền ghi, log exception thật và exit 5. Task vẫn Enabled.
- Sửa: Modify trên đúng Backup, giữ nguyên SYSTEM/Administrators, không mở quyền ghi cho nhóm rộng.
- Phép thử: file nguồn ngẫu nhiên mới → chính scheduled task → so sánh hash. Bản invoice chép tay cũ không được chứng nhận.
- Reset: kiểm task/action/namespace trước, gỡ task riêng và thư mục riêng rồi kiểm đã sạch.
- Kiểm thử live: `scripts/check-it-support-backup-live.mjs`, báo cáo `.artifacts/it-support-backup-live.json`. Chỉ kết luận đã đạt khi `passed` và `reset` đều true. Script chỉ dùng CLIENT01 đang bật, không bật máy hoặc đổi mạng.

## Sau nhánh máy trạm

Tiếp tục chuỗi hai máy: domain join và DNS → onboarding/offboarding user → phòng ban và nhóm theo vai trò → share/NTFS với phép thử allow/deny từ client → GPO có hiệu lực thật → ticket DNS/GPO/SMB/authentication. Yêu cầu tạo private-network/domain proof và quyền thử bằng user thường trước, không chỉ chạy Get-ADUser bằng SYSTEM rồi chấm đạt.

## Nguồn kỹ thuật để đối chiếu

- Microsoft: Task security contexts — https://learn.microsoft.com/en-us/windows/win32/taskschd/security-contexts-for-running-tasks
- Microsoft: icacls — https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/icacls
- Microsoft: domain join troubleshooting — https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/active-directory-domain-join-troubleshooting-guidance
- Microsoft: Group Policy troubleshooting — https://learn.microsoft.com/en-us/troubleshoot/windows-server/group-policy/applying-group-policy-troubleshooting-guidance
- Microsoft: printer problems — https://support.microsoft.com/en-us/windows/hardware/printer/fix-printer-connection-and-printing-problems-in-windows

Các tài liệu này hỗ trợ nội dung kỹ thuật; không phải bằng chứng rằng toàn bộ khóa local đã tương đương đào tạo/chứng chỉ Microsoft.
