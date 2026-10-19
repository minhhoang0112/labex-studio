# Kiểm tra hệ thống ngày 19/10/2026

Đã kiểm tra mã hiện tại, dữ liệu 199 lab, test backend, build và giao diện Chrome với terminal Docker thật. Đây là kiểm tra lỗi local; không phải chứng nhận nội dung giống LabEx 100% hoặc đã thực hiện toàn bộ 199 lab.

## Lỗi đã xử lý

- `readiness.js` từng gán sẵn APT, cron, firewall, network và Docker cho namespace. Nay chỉ bật khả năng cơ bản; Docker bổ sung từ hồ sơ capability riêng. Không công bố Docker lồng trong container khi chưa có bằng chứng.
- Khôi phục metadata chấm bài đã kiểm chứng ở 58 lab, giữ nguyên nội dung hướng dẫn/bản dịch, fixture hiện tại và tiến độ người học. Các bản trước sửa lưu ở `.artifacts/grading-before-repair-2026-10-19/`.
- Noobs từng chấp nhận `uname` thay cho đọc kernel log, `mkdir` thay cho mount, hoặc SSH thất bại thay cho kết nối thành công. Các bước này trở lại bộ chấm đã review hoặc trạng thái chưa hỗ trợ, không báo đạt giả.
- Chặn 210 nhiệm vụ placeholder trong 62 lab mới (33 CompTIA, 29 Practice Challenges). Bộ chấm cũ chấp nhận gần như mọi lệnh, kể cả `pwd` cho bài RAID/LVM. Giữ lại tài liệu nhưng hiển thị chưa có bộ kiểm tra thực hành được kiểm chứng. Cần viết fixture, yêu cầu môi trường và bộ chấm riêng trước khi bật chấm điểm.
- Backend và trình kiểm tra dữ liệu đều từ chối hai dạng regex placeholder được phát hiện. Worker nhập bài không còn sinh các regex này hoặc tự push Git. Script chép bộ chấm Docker sang namespace được chuyển thành thông báo không sửa dữ liệu; script Noobs cũ gọi lại generator đã review.
- 15 bài Windows yêu cầu capability `windows`; môi trường Linux hiện tại không đáp ứng. Panel Windows được ghi rõ là mô phỏng, không phải Windows VM/PowerShell thật. Chưa có bộ chấm Windows thực tế.
- Chuyển bài Windows sang Linux trong SPA từng giữ tab Windows và ẩn terminal: nay chọn lại tab theo bài. Trạng thái mô phỏng cũng được tạo lại khi đổi bài.
- Trong mô phỏng, Start-Service/Stop-Service đặt trạng thái tương ứng thay vì đảo trạng thái sau mỗi lần gọi; dừng dịch vụ không còn đánh dấu sự cố đã được sửa.

## Xác minh

- `npm test`: 31/31 qua sau các sửa backend/placeholder.
- `npm run test:docker`: 31/31 qua trước sửa placeholder cuối; đây là test backend với cấu hình Docker, không phải thực hiện mọi bài trong container.
- `python -X utf8 server/data/generate_labs.py`: 199 lab hợp lệ sau migration; kiểm tra này không thực thi lệnh trong tài liệu.
- `npm run build:client`: thành công. Vẫn có cảnh báo bundle lớn khoảng 883 kB trước gzip.
- `node scripts/test_workspace_ui.mjs`: 16/16 nhóm qua. Bao gồm viewport 390/768/1024/1440, retry môi trường, reset fixture, giữ phiên shell, course context và chuyển Windows sang Linux. Báo cáo `.artifacts/workspace-ui-regression.json` phân biệt rõ HTTP fixture với terminal thật.
- Docker thật, container test riêng, bài `linux-basic-file-operations-in-linux-18001`: 6 nhiệm vụ đạt sau khi thực hiện, cả 6 đều không đạt trước khi làm; 1 nhiệm vụ phím tắt được báo chưa hỗ trợ. Báo cáo `.artifacts/source-course-smoke-mves6834.json`.
- `/api/environment` trả available=true, rootless Docker, Ubuntu 22.04.5 LTS. Web local tại http://127.0.0.1:5000/learn.
- `node scripts/check-system.mjs`: kiểm tra web/health/catalog và xác nhận API từ chối yêu cầu báo đạt giả cho Windows/RAID bằng HTTP 422; báo cáo `.artifacts/system-api-audit.json`.
- Lint không có lỗi làm thất bại lệnh; vẫn còn cảnh báo React effect và import không sử dụng cần dọn riêng.

## Công việc còn thiếu

210 nhiệm vụ mới cần review và triển khai grader/fixture theo từng bài, không được thay bằng lệnh bất kỳ. Các bài yêu cầu RAID/LVM, bootloader, kernel module, SELinux hoặc Windows cần kiểm tra khả năng môi trường riêng; rootless container Linux không tự cung cấp một VM quản trị đầy đủ. Không dùng kết quả test UI/backend để tuyên bố toàn bộ các khóa này đã hoạt động hoặc nội dung khớp nguồn 100%.

Không reset container/bài học người dùng trong lần kiểm tra này. Không xóa tiến độ đã lưu trên trình duyệt. Tiến độ cũ từng được báo đạt bởi placeholder chưa được tự động chứng nhận lại; các nhiệm vụ đó hiện không thể tiếp tục được chấm đạt giả.
