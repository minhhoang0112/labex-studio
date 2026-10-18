# Đã tự xử lý phần bàn giao FE — 17/10/2026

> Cập nhật 18/10: khóa Commands đã triển khai đủ 41 bài/181 nhiệm vụ; xem [báo cáo nhập khóa](COMMANDS_COURSE_IMPORT_2026-10-17.md). Những đoạn mô tả Commands còn reference-only bên dưới là trạng thái trước đợt nhập.

Theo yêu cầu mới, Codex đã sửa trực tiếp các mục chức năng còn lại trong bản bàn giao Anti. Desktop/WebIDE không thuộc phạm vi đợt này; người học tiếp tục thực hành bằng terminal Linux thật.

## Những lỗi đã sửa

- **Roadmap/catalog:** bỏ số local và giờ học ghi cố định; khi API roadmap lỗi hiện lỗi và nút thử lại. Không dùng API legacy để dựng số liệu thay thế. Thẻ khóa Commands nguồn dẫn đúng khóa 41 bài, không đổi sang 4 Local Exercises. Hiện mục tiêu, kỹ năng cần trước và cách học từ API.
- **Course detail:** tách bài local khỏi bài chỉ tham khảo trong danh sách API. Commands không còn bị tính là 41 bài local; Challenges hiện 6 bài local và giáo trình nguồn riêng. Thêm cấu trúc từng bài và liên kết nguồn; không mô tả outline là toàn văn hướng dẫn.
- **Tiến độ:** đếm task ID hiện hành, loại ID cũ/trùng; tính lại hoàn thành khi bỏ dấu đạt. Hàm tổng hợp khóa yêu cầu định nghĩa bài hiện hành, không tin cờ complete cũ. Thiếu availability/readiness không tự bật Start/Ready.
- **Điều hướng:** giữ courseId trên URL và GET bài; bài dùng chung quay về đúng khóa, kể cả tải lại URL. Nút trước/sau chỉ dẫn tới bài local được phép mở.
- **Workspace responsive:** điện thoại chọn Hướng dẫn/Terminal, Intro/Summary dùng toàn bộ vùng đọc. Từ tablet có hai cột; Labby mở dạng panel phủ cho tới khi đủ rộng để có ba cột. Navbar ngoài workspace cũng điều chỉnh để không tràn tablet.
- **Giữ phiên:** terminal chỉ bắt đầu khi runtime và can_start_terminal cho phép. Sau khi mở, đổi section/Intro/Summary, đổi kích thước hoặc đóng/mở Labby giữ cùng WebSocket và shell. Lỗi environment/setup có thông báo và retry.
- **Kéo chia cột:** Pointer Events, giới hạn độ rộng, phím mũi tên/Home/End; dọn listener và khôi phục cursor/userSelect khi thả, mất focus hoặc unmount.
- **Modal reset/tổng kết:** dialog semantics, giữ focus trong hộp, Escape và trả focus về nút mở. Không đóng reset bằng Escape khi đang xử lý; lỗi reset hiển thị trong dialog. Hoàn thành bài cuối không tự khẳng định đã hoàn thành mọi bài của khóa.
- **Chấm bài:** hủy request khi chuyển section/reset/đổi bài; không hiển thị phản hồi lên section khác. Dừng vòng xác nhận nếu request bị hủy/thất bại. Giữ HTTP status/hint từ API thay vì gán mọi lỗi thành backend chưa chạy.
- **Phím terminal:** Ctrl+K trong workspace được giữ cho Bash, không mở tìm kiếm khóa học toàn cục.

## Kiểm chứng

- Build client thành công. Lint không có lỗi, còn 14 cảnh báo React về setState trong effect; chưa thay kiến trúc tải dữ liệu chỉ để dập cảnh báo. Vite còn cảnh báo kích thước bundle.
- Bộ Node test: **26/26 đạt**, gồm ba kiểm tra mới cho tiến độ cũ, gỡ dấu đạt và reset riêng bài.
- Kiểm tra catalog: **81 file bài hợp lệ**, không trùng ID, task/section khớp nhau; không thực thi lệnh trong bước kiểm tra catalog.
- Chrome headless: **15/15 nhóm kiểm tra đạt**. Catalog/roadmap/detail không tràn ngang ở 390/768/1024px; workspace kiểm tra 390/768/1024/1440px, có/không Labby, Intro/task/Summary. Kiểm tra giữ biến shell thật qua đổi panel và số WebSocket không tăng. Kiểm tra focus/Escape, điều hướng bài dùng chung, kéo và cleanup khi rời SPA.
- Các ca reset, phản hồi chấm bị trễ, API lỗi và metadata thiếu dùng HTTP fixture trong hồ sơ trình duyệt mới. Chúng kiểm tra phản ứng FE; **không reset môi trường học thật và không giả làm bằng chứng bộ chấm Linux**. Terminal, nội dung và catalog bình thường dùng backend đang chạy.

Báo cáo: `.artifacts/workspace-ui-regression.json`; ảnh `.artifacts/workspace-ui-{390,768,1024,1440}.png`. Mã kiểm tra: `scripts/test_workspace_ui.mjs`. Dùng Chrome đã cài và playwright-core đã có trong npm cache, không cài thêm phần mềm. Có thể chỉ định module bằng `--playwright=<đường-dẫn-module>`.

## Phần còn thiếu

Các lỗi chức năng trong bảng bàn giao đã được xử lý trong phạm vi trên. Nội dung các khóa Commands/CompTIA/Security chưa được triển khai thành bài local; Challenges chỉ có sáu bài dùng chung. Một số nhiệm vụ Noobs/Junior/Shell vẫn thiếu dịch vụ Linux hoặc WebIDE và được đánh dấu chưa hỗ trợ. Chưa đối chiếu toàn văn mọi bài với nguồn, chưa có bộ chấm kín của LabEx. Các giới hạn này là phần cần phát triển thêm, không phải lỗi responsive/tiến độ vừa sửa.

Không cần cài thêm phần mềm để học các nhiệm vụ terminal đang được hỗ trợ. Đọc [FIDELITY_REPAIRS_2026-10-17.md](FIDELITY_REPAIRS_2026-10-17.md) cho kết quả thực hành từng khóa.
