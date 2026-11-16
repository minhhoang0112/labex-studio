# Ticket Client: nhân viên đọc được nhưng không lưu được tài liệu

Ngày triển khai: 28/10/2026. ID: `win-it-user-folder-permissions`.

## Vị trí học

Lộ trình Windows → IT Support → nhóm Ticket thực hành GUI → **Nhân viên đọc được nhưng không lưu được tài liệu**. Bài được thêm sau bài tệp đang dùng trong thứ tự hiện tại, không thay ID hoặc tiến độ bài cũ.

Đây là NTFS local trên CLIENT01, không phải phân quyền AD/SMB. Một VM là đủ. Ứng dụng soạn thảo nhỏ dùng File I/O của Windows để tạo triệu chứng thật; không cần Office và không tuyên bố mô phỏng mọi lỗi Office.

## Luồng người học

1. Bật VM, kết nối Desktop, chuẩn bị sự cố.
2. Xem mật khẩu tạm trong `C:\LabEx\PracticeFaults\useracl\Private\credentials.txt` bằng admin, không gửi vào chat.
3. Chạy `LabExWriterV2.cmd`, nhập mật khẩu lab vào runas. Thanh tiêu đề editor phải hiện user nhân viên.
4. Open reference → sửa bản sao → Save as trong Documents: tái hiện từ chối lưu.
5. Điều tra và chỉnh quyền bằng Explorer → Properties → Security → Advanced. Các gợi ý tăng dần có sẵn trong bài.
6. Thử lại nhân viên và `LabExVisitorV2.cmd`, sau đó bấm Kiểm tra kết quả.
7. Đóng ứng dụng của hai user trước khi hoàn nguyên; dữ liệu trong workspace bị xóa. Không tự kết thúc tiến trình của người dùng.

## Hợp đồng chấm

- Chuẩn bị tạo hai local user không phải admin, có mật khẩu ngẫu nhiên và thời hạn hai ngày. Nếu hết hạn: reset và chuẩn bị lại, không thay policy thật.
- Mật khẩu lưu DPAPI trong journal riêng; tệp hướng dẫn mật khẩu chỉ admin/SYSTEM đọc được. Không trả mật khẩu qua API hoặc output kiểm thử.
- Dùng LogonUser và WindowsIdentity.Impersonate lấy token thực cho từng user. Lỗi đăng nhập không được coi là “bị chặn đúng”.
- Nhân viên phải đọc tài liệu gốc, mở ghi tệp có sẵn mà không sửa nội dung gốc, tạo/sửa/đọc/đổi tên/xóa tệp ngẫu nhiên mới.
- Người đối chứng phải bị UnauthorizedAccessException khi liệt kê, đọc, mở ghi và tạo tệp. Các lỗi tệp thiếu/khóa/chia sẻ không tính là quyền bị từ chối.
- Bảo toàn reference.txt, kiểm tra ACL của Documents và các tệp con; không chấp nhận quyền cho Everyone/Users hay Full Control của nhân viên.
- Không dùng lịch sử lệnh, tên bản sao người học hoặc kết quả cũ làm bằng chứng đạt.

## Tài nguyên và hoàn nguyên

- Workspace duy nhất: `C:\LabEx\PracticeFaults\useracl`.
- Hai user: `LabExWriterV2`, `LabExVisitorV2`; kiểm tra SID và Description chứa mã phiên trước khi dọn.
- Lưu journal trước khi tạo user để có thể dọn trường hợp thiết lập dở dang. Từ chối ghi đè tài nguyên tồn tại ngoài phiên.
- Không sửa mạng, RDP, firewall, service Windows hoặc user thật.
- Reset kiểm tra reparse point, xác minh đường dẫn tuyệt đối, dọn workspace và tài khoản lab. Không xóa profile bên ngoài workspace. Nếu ứng dụng còn chạy dưới user lab, yêu cầu đóng trước, không kill tự động.
- Đây không phải sandbox chống một quản trị viên cố ý phá hệ thống. Người học có admin để học chỉnh ACL; ownership checks nhằm ngăn thay đổi nhầm phạm vi.

## Kiểm thử và giới hạn

Kết quả ngày 28/10/2026: chạy trực tiếp CLIENT01 đạt baseline → nạp lỗi → chấm không đạt → sửa Modify đạt → thu hồi quyền ghi không đạt → FullControl không đạt → Everyone Read không đạt → sửa lại đạt → reset thành công. Báo cáo máy đọc được: `.artifacts/it-support-useracl-live.json`. Thay đổi ACL trong kiểm thử dùng PowerShell tương đương thao tác GUI; chưa tuyên bố đã làm trọn buổi học bằng GUI với người mới. Giao diện web đã kiểm tra bằng Chrome tự động.

- `tests/windowsUserAclIncident.test.js`: kết nối dữ liệu/API, chuẩn bị phải qua baseline tốt rồi trạng thái lỗi, lỗi/timeout không đạt; kiểm tra gói lệnh nằm trong giới hạn executor.
- `scripts/check-ntfs-probe-compile.ps1`: biên dịch C# trên .NET Framework, không tạo user trên máy chính.
- `scripts/check-windows-fault-syntax.ps1`: phân tích cú pháp PowerShell, không thực thi fixture trên máy chính.
- `scripts/check-it-support-useracl-live.mjs`: chỉ chạy khi CLIENT01 đã bật và không có phiên học dang dở. Thử baseline, nạp lỗi, sửa Modify, bỏ quyền ghi lại, FullControl, Everyone, sửa lại và reset. Báo cáo ở `.artifacts/it-support-useracl-live.json`.
- Kiểm tra live bằng API/lệnh tương đương thao tác GUI không thay thế buổi người mới tự học bằng GUI. Phải ghi rõ phần nào thực sự đã thử.
- Nhãn `validation_status` trong dữ liệu bài là nguồn trạng thái nghiệm thu; không tự coi có script test là đã test thành công.

## Nguồn kỹ thuật

- [Microsoft: File Security and Access Rights](https://learn.microsoft.com/en-us/windows/win32/fileio/file-security-and-access-rights).
- [Microsoft: LogonUserW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonuserw).
- [Microsoft: WindowsIdentity.Impersonate](https://learn.microsoft.com/dotnet/api/system.security.principal.windowsidentity.impersonate).
