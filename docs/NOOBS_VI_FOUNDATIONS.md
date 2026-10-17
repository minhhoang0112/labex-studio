# Bản dịch Linux for Noobs — bài 1–19

Ngày rà soát: 17/10/2026.

Phạm vi gồm 19 bài, 105 phần trong `server/data/labs` có `course_id: linux-for-noobs`, `order: 1..19`. Đã dịch đầy đủ 26 phần còn nguyên tiếng Anh ở bài 6, 16, 17 và 18; giữ các bản dịch đầy đủ hiện có của 79 phần còn lại. Bổ sung `task_vi` và `hint_vi` ở phần nhiệm vụ, đồng bộ các trường tiếng Việt giữa `sections` và `steps` theo ID.

Bản ghi để áp dụng lại nằm tại `server/data/translations/noobs-foundations.vi.json`, được khóa theo ID bài và `sections[].position`. Nó chỉ chứa `title_vi`, `content_vi`, `task_vi`, `hint_vi`; không chứa bản sao bộ chấm hay thiết lập môi trường.

Đã kiểm tra các khối Markdown có hàng rào mã được giữ nguyên từng ký tự giữa `content` và `content_vi`; chỉ thay đổi các trường có hậu tố `_vi`. ID, nội dung tiếng Anh, lệnh, đường dẫn, đầu ra ví dụ, bộ kiểm tra và môi trường giữ nguyên. Các tên công cụ, toán tử, trường kết quả và thông báo lỗi trong nội dung tiếng Việt được giữ ở dạng kỹ thuật khi cần đối chiếu terminal.

Đây là bản dịch nội dung tiếng Anh hiện có trong workspace, không phải chứng nhận rằng nội dung đó trùng hoàn toàn với LabEx. Có một điểm cần đối chiếu nguồn riêng: phần “Reset a Busy Terminal” của bài đầu nhắc `calculations.txt`, trong khi phần trước tạo `calculation.txt`; bản dịch giữ nguyên tên trong bản tiếng Anh để tránh tự ý đổi đề.
