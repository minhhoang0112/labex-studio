# Sửa giáo trình và chức năng — 17/10/2026

> Phần FE từng bàn giao ở cuối file đã được Codex thực hiện trực tiếp theo yêu cầu tiếp theo. Xem [kết quả sửa workspace và 15 nhóm kiểm tra trình duyệt](WORKSPACE_REPAIRS_2026-10-17.md).

Đã xử lý các lỗi được nêu trong audit trước khi sửa. Bản local **chưa giống LabEx 100%**: chưa có Desktop/XFCE, WebIDE, Web 8080 proxy, systemd và SSH authentication riêng. Chưa khôi phục image, toàn văn mọi bài hoặc bộ chấm kín của LabEx. Hướng dẫn Shell Anh/Việt được biên soạn lại theo yêu cầu công khai; không phải bản sao nguyên văn.

## Kết quả đã kiểm tra

| Khóa | Bài local | Nhiệm vụ đạt trên Docker | Nhiệm vụ bị chặn rõ |
| --- | ---: | ---: | ---: |
| Quick Start with Linux | 10 | 47 | 0 |
| Become a Junior System Administrator | 10 | 47 | 1 |
| Linux for Noobs | 37 | 100 | 34 |
| Shell for Beginners | 18 | 73 | 1 |

Báo cáo: `.artifacts/docker-quick-start-coverage.json`, `docker-junior-coverage.json`, `docker-noobs-coverage.json`, `docker-shell-coverage.json`. Đây là bằng chứng thực hành local, không chứng minh bộ chấm giống bộ chấm kín của nguồn. Báo cáo tổng hợp chỉ nhận bài có đủ mọi nhiệm vụ từ từng lượt chạy; không gọi đó là một lượt chạy liên tục. Noobs dùng một lượt gián đoạn để chứng minh các bài đã chạy xong; lượt đó không có kiểm tra tài khoản host cuối lượt, và báo cáo giữ rõ giới hạn này.

Trong đợt sửa này, 73 nhiệm vụ Shell và 100 nhiệm vụ Noobs đều có kiểm tra chưa làm phải thất bại, rồi thao tác thực qua PTY và kiểm tra kết quả. Các bài thử dùng ID và container riêng; không reset bài đang học. Namespace không được suy ra có cùng khả năng với Docker.

## Nội dung và bộ chấm đã sửa

- Toàn bộ 18 bài Shell: sửa tên tệp, dữ kiện, đầu vào/đầu ra và hành vi theo các trang bài công khai. Ví dụ Hello dùng `Hello, World!`; kho báu dùng `treasure_map.sh`, tọa độ 15/25, kết quả 30 bước bắc và 5 bước đông. Weather/calculator dùng stdin; explorer kiểm tra loại và quyền đọc; trap nhận tín hiệu thật.
- Bỏ kiểm tra WebIDE dựa vào thư mục project vốn có sẵn. WebIDE là bước chưa hỗ trợ, không tự đạt và không chuyển thành xác nhận đã đọc.
- Task Shell chuyển sang ID `-v4`; dấu đạt theo bộ chấm cũ không hoàn thành nhiệm vụ mới.
- Hoàn thiện tiếng Việt cho 208 section Noobs, đồng bộ nội dung giữa phần đọc và nhiệm vụ; giữ nguyên code và kết quả mẫu. Bản dịch lưu riêng ở `server/data/translations/*.vi.json`.
- Generator Shell chỉ sử dụng hai module đã rà soát; bỏ các định nghĩa cũ sai yêu cầu. Generator Noobs đọc nội dung hiện tại, giữ bản dịch và các bộ chấm namespace đã có. Kiểm tra tái sinh trong thư mục tạm xác nhận cả 37 bài Noobs giữ nội dung Anh/Việt và 18 bài Shell không thay đổi.

Nguồn đối chiếu tiêu biểu: [Hello, Bash!](https://labex.io/tutorials/linux-hello-bash-388809), [Finding the Pirate's Treasure](https://labex.io/tutorials/shell-finding-the-pirate-s-treasure-388807), [Shell for Beginners](https://labex.io/courses/shell-for-beginners). URL từng bài lưu trong JSON; chi tiết bài 8–18 ở [SHELL_LATER_FIDELITY_REPAIR.md](SHELL_LATER_FIDELITY_REPAIR.md). Phần văn bản Noobs có sẵn trong workspace chưa được xác minh lại toàn văn qua phiên đăng nhập nguồn.

## Runtime và giao diện

Đã chọn lại Docker rootless, Ubuntu 22.04.5, khởi động engine và server tại **http://127.0.0.1:5000/learn**. Chạy `run.bat` cho những lần sau. Không thay khóa AI trong cấu hình.

Hai file FE sửa chức năng: `client/src/components/LabGuide.jsx` và `client/src/views/LabWorkspace.jsx`:

- Abort và bỏ phản hồi chấm cũ sau reset/đổi bài; chặn chấm khi reset.
- Thiếu metadata grading không được coi là sẵn sàng. Xác nhận thông tin chỉ dùng loại xác nhận do backend công khai, có readiness hợp lệ.
- Hoàn thành bài dựa trên đủ task ID hiện tại.
- Web 8080 yêu cầu capability riêng cùng endpoint dịch vụ; không dùng network capability để mở nhầm cổng host.

Đã build client thành công, bộ test Node 23/23 đạt và kiểm tra cú pháp Bash các predicate. REA đã mở Chrome tạm và thực hiện thao tác trên local: bài Hello hiện 0/6, bước WebIDE có nút chấm bị khóa, Desktop/WebIDE/Web8080 hiện N/A; không có page-error trong capture. Bằng chứng: `.artifacts/shell-webide-ui-repair-evidence.json`. Đây không phải kiểm thử toàn bộ giao diện hoặc tương đồng hình ảnh.

## Prompt gửi Anti

> Đọc docs/FIDELITY_REPAIRS_2026-10-17.md trước khi sửa. Giữ các sửa chức năng mới trong LabGuide.jsx và LabWorkspace.jsx, task IDs Shell -v4 và Noobs -v3. Dùng readiness/capabilities và số liệu API, không tự hard-code hoặc đổi unsupported thành ack. Nâng tiếp FE theo giao diện LabEx: bố cục responsive, điều hướng section, modal reset có focus/Escape, cleanup resize listener. Kiểm tra các mục trong docs/ANTIGRAVITY_LINUX_ROADMAP_PROMPT.md với mã hiện tại trước khi sửa vì danh sách đó là snapshot cũ; mục reset/verify/Web8080 đã được Codex xử lý. Không sửa server/data/labs hoặc generator để làm giao diện trông đã hoàn thành. Desktop/WebIDE/Web8080 chỉ bật khi backend đã có dịch vụ thật. Bốn khóa nguồn đã có nội dung local là Quick Start, Junior, Noobs, Shell; Commands 41, CompTIA và Security còn reference-only, Challenges chỉ dùng lại 6 bài. Không quảng cáo toàn bộ 319 bài đã thực hành được.
