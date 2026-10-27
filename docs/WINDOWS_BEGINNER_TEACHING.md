# Hai khóa Windows nhập môn: học lệnh trước, ghi bằng chứng sau

Áp dụng cho `windows-11-fundamentals` và `windows-networking-fundamentals`: 12 bài, 24 task.

Mỗi task bắt đầu bằng quan sát GUI và các khối lệnh tối đa ba dòng, giải thích cú pháp, cách đọc kết quả và câu hỏi tự luyện. Người học chạy các lệnh này trong PowerShell Desktop. Bài tạo tệp chỉ thao tác dữ liệu mẫu của bài; bài mạng không đổi NIC/DNS/firewall hoặc dừng RDP. Các phép thử Internet là tùy chọn.

Script dài cũ được giữ nguyên trong `hint` để các kiểm thử tích hợp vẫn chạy được. Giao diện hiển thị riêng trong mục thu gọn “Ghi bằng chứng để chấm”, có nút sao chép và mở đúng PowerShell web. Collector chạy qua Azure Agent/SYSTEM, không phải tài khoản Desktop. Ô nhập web dùng textarea để giữ newline khi dán script; Ctrl+Enter hoặc nút Chạy mới gửi.

Collector có thể chuẩn bị/thực hiện lại thao tác trên dữ liệu mẫu trước khi xuất báo cáo. Điểm xác nhận bằng chứng/trạng thái, không chứng nhận người học đã tự gõ lệnh hoặc hiểu bản chất. Tự luyện trong thư mục `practice` tách khỏi các tệp JSON mà bộ chấm dùng.

Nguồn nội dung mới: `scripts/windows_beginner_learning.py`. Hai generator gốc import `improve_lab`, nên dựng lại khóa vẫn giữ cấu trúc học mới. Chạy riêng overlay sẽ giữ nguyên task ID, collector, verification; không đổi tiến độ hoặc VM.

Kiểm tra: `tests/windowsBeginnerLearning.test.js`, các test foundations/networking hiện có và `scripts/check-windows-beginner-learning-ui.mjs`. Browser smoke dùng VM giả lập, không gửi lệnh thật. Script parser trong `.artifacts` kiểm tra cú pháp PowerShell mà không thực thi lệnh.
