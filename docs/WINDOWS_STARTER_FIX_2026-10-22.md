# Chỉnh các bài Windows cần thiết để bắt đầu học — 22/10/2026

## Đã triển khai

Nâng chất lượng 15 bài của ba khóa PowerShell, Windows Server nhập môn và chẩn đoán Server. Giữ số bài, ID khóa/lab và dữ liệu học; không thêm khóa giả hoặc nâng trạng thái của 11 khóa chỉ có đề cương.

Mỗi bài bổ sung: nguyên lý/tình huống thực tế, hướng dẫn, kết quả mong đợi/cách đọc, câu hỏi tự giải thích và phần tự luyện ghi rõ không chấm tự động. Phần giới thiệu nêu PowerShell web chạy SYSTEM, mỗi lần gửi là process mới; biến không giữ giữa các request, file trong thư mục bài vẫn giữ. Các bài chỉ quan sát được ghi rõ chưa phải triển khai/sửa lỗi hoàn chỉnh.

## Các lỗi đã sửa

- Dịch vụ: lệnh mẫu và bộ chấm cùng yêu cầu Running → Sort-Object DisplayName → First 10. Không còn yêu cầu sắp xếp nhưng chỉ kiểm tra lệnh lọc.
- NTFS: tạo thư mục chưa đủ. Phải có bằng chứng Get-Acl thành công đúng VM/lab và DACL thực tế. Chấp nhận đọc riêng, đọc bảng Access hoặc cả khối tạo + đọc. Giải thích Owner, ACE, Allow/Deny, inheritance và phân biệt SMB/NTFS; chưa tự đổi quyền diện rộng.
- Báo cáo: thay kiểm tra tệp có vài từ khóa bằng CSV có ComputerName, DeviceID, Size và FreeSpace. Đối chiếu với ổ thật, từ chối sai máy, thiếu/nhân đôi ổ, sai kích thước và dung lượng trống vô lý. FreeSpace không buộc trùng tuyệt đối vì thay đổi theo thời gian.
- Event log: lọc đúng Level=2 hoặc ProviderName + Id=7000,7001,7034. Không có sự kiện là kết quả hợp lệ; chỉ bắt NoMatchingEventsFound, lỗi quyền/log phải được báo thật. Không gây lỗi máy để tạo dữ liệu bài tập.
- AD: task tạo OU phải có OU IT_Department dưới domain root thật. Chỉ mở ADUC/Get-Command chưa đủ. Task user ghi đúng yêu cầu tạo david.miller và đổi mật khẩu lần đầu; không còn nói xem lệnh New-ADUser là đã tạo tài khoản. Nhóm Global/Security có đúng thành viên; không tự cấp Domain Admins.
- IIS: yêu cầu và hướng dẫn cùng nhắm website PortalCorp, thư mục riêng `C:\LabEx\Labs\win-server-iis-web\site`, binding `*:8080:`, Started, HTTP 200 và nội dung LabEx PortalCorp. Không còn cho rằng mở IIS Manager hoặc thấy cổng là hoàn thành. Không chỉnh Default Web Site/mở cổng Internet. Nếu cổng/tên đã có, xác định chủ sở hữu trước.
- GPO: PowerShell web dùng gpresult /scope computer /r; phân biệt RSoP SYSTEM với người dùng Desktop. Không tạo giả policy/kết quả khi môi trường chưa có RSoP.
- CPU: phân biệt CPU(s) tích lũy với % CPU lấy mẫu. Task dùng CIM Win32_PerfFormattedData_PerfOS_Processor, tránh counter path phụ thuộc ngôn ngữ OS. Không yêu cầu CPU cao mới đạt.
- DNS localhost, Get-SmbShare, đọc Registry và kiểm tra TCP được mô tả đúng là quan sát. TCP False khi không có listener không phải tự động lỗi bài; chưa coi đọc Registry là đã thực hành phục hồi Registry.
- Đồng bộ hint với lệnh/hướng dẫn, xóa đường dẫn IIS cũ và các gợi ý chỉ xem cmdlet nhưng không thực hiện yêu cầu. Mô tả ba khóa cũng được thu hẹp đúng phạm vi bài thực tế.

8 task thay đổi tiêu chí có hậu tố `-v4`; điểm cũ của các task đó không tự tính cho yêu cầu mới. Các task khác và 25 bài IT Support giữ nguyên. Không xóa localStorage của người học.

## Kiểm chứng

- Bộ hồi quy 82 test đạt. Nhóm Windows starter được chạy lại sau điều chỉnh cuối; kiểm tra đúng/sai VM, thiếu hoặc lỗi lệnh, trạng thái remote sai, timeout và sai lab.
- PowerShell thật: 39 kiểm tra đạt, gồm parse toàn bộ lệnh/probe mới, thử NTFS trên thư mục scratch trong workspace, các nhánh CSV/AD/IIS với dữ liệu mô phỏng. Không chạy script chỉnh cấu hình trên máy cá nhân.
- Chrome: 7 nhóm bài render đủ lý thuyết/kết quả/câu hỏi; điểm NTFS cũ không hợp lệ, API từ chối task ID cũ, UI gửi ID mới và giữ chưa hoàn thành khi thiếu bằng chứng. VM status và phản hồi chấm trong kiểm tra UI được mô phỏng. Báo cáo `.artifacts/windows-starter-ui.json`.
- Chưa bật Azure VM để chạy lại toàn bộ bài trên máy thật trong lượt này. Vì vậy chưa xác nhận live trạng thái domain/IIS/RSoP; nếu thiếu role hay prerequisite, bài phải báo thiếu môi trường thay vì chấm đạt giả.

## Bắt đầu học ngay

1. Mở `/courses/windows-powershell-for-sysadmins`, bật Windows Server VM từ trong web và học theo thứ tự 5 bài. Đọc câu hỏi tự giải thích trước khi xem lại gợi ý.
2. Xen kẽ `/courses/windows-11-it-support-troubleshooting` trên CLIENT01. Bật/tắt đúng máy; chỉ nạp lỗi qua bài có hỗ trợ chuẩn bị và hoàn nguyên.
3. Sau đó học ba nhóm Server còn lại; AD cần domain/module sẵn có, IIS cần role và cổng lab không xung đột. Không tự thay topology Azure hay cài mới domain chỉ để vượt một bước.
4. Linux học Quick Start → luyện Commands cùng Noobs → Shell. Giữ nguyên các cảnh báo chưa hỗ trợ ở Noobs/Junior; chưa cấp quyền systemd/kernel/đĩa/SSH hoặc đánh dấu task đó đạt. Có thể đọc và chuyển mục khác bằng danh sách mục mà không được ghi nhận đã hoàn thành task thiếu bộ chấm.

Hai khóa nền tảng Windows/mạng còn đề cương và runtime Linux nâng cao cần làm tiếp ở lượt riêng. Đợt này ưu tiên sửa chất lượng/bộ chấm của bài sẵn có để bạn bắt đầu, không mở rộng số lượng trước khi chuẩn bị môi trường.

## Duy trì

`scripts/review-windows-starter.py` sinh nội dung và `server/data/windows-starter-rules.json`. Nếu chỉnh giáo trình tiếp, chỉnh script tương ứng trước khi sinh lại. Quy tắc nhập bổ sung ở windowsRemoteVerifier, không thay bộ chấm 25 bài IT Support. Chạy `node --test tests/windowsStarter.test.js` và `powershell -NoProfile -File scripts/check-windows-starter-probes.ps1` sau khi sửa. Không chạy generator cũ để ghi đè bản đã review mà chưa đối chiếu.

Nguồn đối chiếu: [Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent?view=powershell-5.1), [Get-Acl](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/get-acl), [gpresult](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/gpresult), [Get-Process](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-process).
