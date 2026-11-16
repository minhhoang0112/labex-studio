# Ticket Windows Client: điều tra tiến trình gây tải CPU

Triển khai 28/10/2026. ID `win-it-cpu-process-diagnosis`, khóa `windows-11-it-support-troubleshooting`.

## Năng lực và phạm vi

Người học nhận báo cáo máy phản hồi kém sau khi chạy công cụ lập chỉ mục; dùng Task Manager để phân biệt CPU/Memory/Disk, đối chiếu tên/PID/đường dẫn, xử lý đúng tiến trình được phép và đo lại. End task là phục hồi trước mắt có điều kiện, không được dạy như cách giải quyết mọi lỗi hiệu năng.

GUI trước, không bắt nộp JSON hay chép script. Câu hỏi tự giải thích không giả vờ được chấm tự động. Không hứa Desktop sẽ chậm rõ hoặc CPU toàn VM đạt 100%: tải giới hạn nhằm giữ kết nối và khả năng quan sát. Tỷ lệ CPU toàn máy phụ thuộc vCPU, tải nền và cách Task Manager báo cáo.

## Runtime

- Workspace: `C:\LabEx\PracticeFaults\cpuincident`; chỉ admin/SYSTEM có quyền theo ACL fixture.
- `LabExIndexWorker.exe`: một luồng, khoảng 60 ms busy / 40 ms nghỉ, BelowNormal, tự thoát mã 70 sau 30 phút; không cấp phát bộ nhớ tăng dần, không tạo tiến trình con, không truy cập mạng, không làm đầy đĩa.
- `LabExNotesHelper.exe`: xử lý yêu cầu ngẫu nhiên mới bằng tệp trong cùng workspace, nghỉ giữa các lần đọc; thời hạn riêng 45 phút.
- Hai task Scheduler không có trigger định kỳ, chạy các binary cố định. Chúng tồn tại để giữ fixture độc lập với phiên Run Command, không phải cấu hình ứng dụng doanh nghiệp mẫu.
- Baseline xác nhận helper hoạt động trước; Inject chạy worker; Faulted đo delta TotalProcessorTime theo thời gian thực. Đơn vị nội bộ core-seconds/second, không gọi đó là phần trăm Task Manager.
- Nếu không tái hiện đủ tải CPU, chuẩn bị phải thất bại thay vì gắn nhãn sự cố đã có.

## Hợp đồng chấm

Healthy cần worker không còn qua một khoảng quan sát, helper **ban đầu** còn xử lý nonce mới, notes.txt nguyên vẹn, binary/task không bị thay, cùng phiên boot và trước deadline. Không chấp nhận chờ tự hết tải hoặc reboot. PID luôn đối chiếu với StartTime và đường dẫn để tránh nhầm PID tái sử dụng.

Người học có thể dùng GUI hoặc thao tác tương đương; không chấm chuỗi lệnh. Không thể từ phép kiểm tra trạng thái suy ra người học đã đọc Task Manager hay hiểu nguyên nhân: phần này cần tự giải thích/đánh giá thêm.

Nếu tắt nhầm helper, khởi động lại helper không giữ được phiên công việc cũ; bài yêu cầu reset và làm lại. Đây là ràng buộc cố ý nhằm dạy tránh làm gián đoạn công việc khác, không phải quy định mọi sự cố ngoài đời đều cấm restart ứng dụng.

Reset xác minh ownership task, executable path và PID/start time; dừng task riêng, đợi tiến trình dừng, gỡ task, kiểm tra đường dẫn tuyệt đối rồi dọn workspace. Không dừng process theo tên chung, không sửa firewall, NIC, dịch vụ bảo vệ hay tài khoản Windows.

## Kiểm thử

Kết quả 28/10/2026: kiểm thử trực tiếp CLIENT01 đạt các trường hợp nêu dưới; 143 test tự động đạt và giao diện kiểm tra qua Chrome. Lượt reset đầu bị timeout nhưng kiểm tra đọc trực tiếp xác nhận workspace, task, process đều không còn. Gọi lại Reset thành công, journal trở về `reset`. Báo cáo ban đầu được giữ ở `.artifacts/it-support-cpu-live-initial.json`; báo cáo cuối gồm thông tin recovery ở `.artifacts/it-support-cpu-live.json`. Không che lượt timeout hoặc xem timeout là bằng chứng dọn thành công.

- `tests/windowsPerformanceIncident.test.js`: data/API contract, gate baseline→lỗi, false/timeout không đạt, gói lệnh không vượt giới hạn executor.
- `scripts/check-performance-worker-compile.ps1`: biên dịch .NET Framework, không chạy tải trên máy chính.
- `scripts/check-windows-fault-syntax.ps1`: phân tích cú pháp runtime.
- `scripts/check-it-support-cpu-live.mjs`: chỉ chạy khi VM đã bật, không có phiên học dang dở; chuẩn bị tải thật, chưa sửa không đạt, dừng worker với deadline giả lập đã qua không đạt, còn hạn đạt, tắt helper không đạt, reset. Deadline giả lập chỉ trong kiểm thử để không đốt CPU 30 phút chờ timeout.
- Báo cáo live: `.artifacts/it-support-cpu-live.json`. Nhãn `validation_status` trong bài phản ánh kiểm thử đã thực hiện, không tự cập nhật chỉ vì có script.

Chưa kiểm thử việc reboot VM thật hoặc đợi đủ 30 phút tự hết tải. Chưa có buổi người mới hoàn thành toàn bài bằng GUI; kiểm thử runtime dùng lệnh tương đương thao tác GUI. Không coi bài này là bài xử lý thiếu RAM, lỗi ổ đĩa, malware hay sửa phần mềm thương mại.

## Nguồn

- [Microsoft: Tips to improve PC performance in Windows](https://support.microsoft.com/en-gb/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows).
- [Microsoft: Scheduling Priorities](https://learn.microsoft.com/en-us/windows/win32/procthread/scheduling-priorities).
- [Microsoft: Process.PriorityClass](https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process.priorityclass).
