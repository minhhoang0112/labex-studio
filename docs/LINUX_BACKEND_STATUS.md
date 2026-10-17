# Linux backend — 16/10/2026

> Snapshot 16/10. Trạng thái mới ngày 17/10 nằm ở [FIDELITY_REPAIRS_2026-10-17.md](FIDELITY_REPAIRS_2026-10-17.md): 75 bài nguồn duy nhất thuộc 4 khóa; Shell 73 đạt/1 bị chặn, Noobs 100 đạt/34 bị chặn trên Docker. Những đoạn “năm khóa còn lại” hoặc “đang kiểm chứng Noobs” bên dưới là trạng thái lịch sử.

Đã quét lại mã sau thay đổi của Anti, gồm 37 bài Noobs mới. Các phần FE sections, progress v2, VI/EN, roadmap và reset đã có; không thay lại bố cục của Anti trong đợt này. Server tại http://127.0.0.1:5000/learn đã chuyển sang Docker rootless Ubuntu 22.04.5; `run.bat` giữ server chạy nền và khởi động engine riêng khi cần.

## Phạm vi đối chiếu nguồn

Nguồn: https://labex.io/learn/linux và API GET giáo trình của từng khóa. Tám khóa có **325 mục**, tương ứng **319 bài duy nhất** do có bài dùng lại. Đã đọc được cấu trúc của cả 319 bài: **1.563 sections, 925 task sections**. Phép đếm này tính bài duy nhất, không tính lặp theo từng khóa. Snapshot: `server/data/reference/linux-course-index.json` và `linux-section-outlines.json`.

Snapshot chỉ lưu tiêu đề, thứ tự, layout, cờ task và độ dài text. Tài khoản hiện tại nhận được text ở 786 sections; những phần còn lại không trả nội dung. Vì vậy đối chiếu cấu trúc không đồng nghĩa đã lấy đủ tài liệu, fixture, lời giải hay mã bộ chấm. Không mở thêm VM hoặc đổi tài khoản để thực hiện việc đọc này. Evidence ID của từng batch nằm trong snapshot.

Junior có 68 sections/48 tasks. Cả 10 outline khớp nguồn sống. Text của năm bài đầu phần lớn khớp bản Anti cung cấp sau chuẩn hóa heading/fence; bài log có một khác biệt dấu # trong ví dụ diff. Năm bài cuối chỉ trả Introduction cho phiên hiện tại; phần task dùng tài liệu đã có trong workspace, chưa xác minh lại đầy đủ qua phiên này. Kết quả chi tiết: `junior-live-comparison.json`.

## Backend hiện có

- Quick Start: 10 bài, 67 sections/47 task; Docker đã chạy đạt đủ **47/47**. Bằng chứng `.artifacts/docker-quick-start-coverage.json`.
- Junior: 10 bài, 68 sections/48 task; Docker đã chạy đạt **47**, còn **1 bước dmesg bị chặn**. Bằng chứng `.artifacts/docker-junior-coverage.json`. Đã kiểm chứng cron tạo archive qua phút hẹn thật, APT cài/gỡ package, tiến trình tồn tại qua nhiều lần exec và UFW chặn/mở lưu lượng giữa hai peer riêng.
- Hai báo cáo trên tổng hợp các bài đã thực hành trọn vẹn từ nhiều lượt chạy. Trường `singleUninterruptedRun:false` được giữ rõ; không nhận lượt gián đoạn đã hoàn thành hoặc có kiểm tra host cuối lượt khi lượt đó chưa tới bước này.
- Linux for Noobs: 37 bài/208 sections/134 task do Anti nhập, outline khớp snapshot nguồn. Phát hiện 25 practical acknowledgement và 38 bộ chấm dựa vào điều hướng; đã thay bằng kiểm tra thực hoặc explicit unsupported. Task ID mới có hậu tố `-v3` để dấu đạt giả trước đây không được tính lại. Tài liệu song ngữ gốc trong workspace được giữ nguyên; fixture là bản dựng lại từ yêu cầu, không phải byte gốc của VM. Chi tiết và bằng chứng đang cập nhật trong `NOOBS_BACKEND_AUDIT.md`.
- Năm khóa còn lại: đủ danh mục và outline nguồn; chưa có hướng dẫn thực hành local hoặc bộ kiểm tra. Trạng thái `reference-only`.
- Bốn bài tự biên soạn cũ là khóa riêng `linux-commands-practice-online`; không thay thế 41 bài nguồn trong `linux-basic-commands-practice-online`.

Docker hiện có tiến trình bền, package image ghi được, ifconfig, mạng/firewall và cron scheduler thật. Kernel log riêng, systemd, SSH authentication, Desktop/WebIDE/Web8080 vẫn chưa cung cấp. Provider namespace cũ giữ bằng chứng Quick Start 47/47 (`source-course-smoke-mvamixgn.json`), Junior 33 đạt/15 bị chặn (`source-course-smoke-mvamooig.json`); không áp số này cho Docker. Cài đặt và giới hạn: [ROOTLESS_RUNTIME.md](ROOTLESS_RUNTIME.md).

`POST /api/verify` không nhận command, history, provider hay cờ success từ trình duyệt làm bằng chứng chấm. Xác nhận đã đọc chỉ hợp lệ cho `action:continue` có verifier `scope:informational`, hiện dùng ở Learn By Doing. Không dùng nó làm fallback khi scraper không tìm được lệnh đơn. Generator Noobs đã bỏ cách suy đoán bộ chấm từ code block đầu tiên.

Đã build FE mới và kiểm tra qua REA trên Chrome headless: bài Display User and Group Information mở đủ 4 sections, terminal Ubuntu 22.04 sẵn sàng, kiểm tra trước khi làm bị từ chối, chạy whoami/id rồi đạt 2/2 và tới Summary. Evidence `ev_8094e009e2c927f8e7c853270e6af5800260109dbe0abaa16282544a5e7e5b0d`, không có page error trong capture. Đây là một luồng đã thử, không phải kết luận mọi màn hình FE đã hoàn thiện.

## API bàn giao

- `GET /api/roadmaps/linux-system-administrator`: thứ tự học đề xuất riêng, thứ tự nguồn riêng, prerequisites chỉ là gợi ý, số bài nguồn/nhập/chạy được và trạng thái từng khóa.
- `GET /api/courses/:id`: danh sách bài nguồn có stages. Bài local có availability; bài chưa triển khai có `reference-only`.
- `GET /api/courses/:id/reference`, `GET /api/labs/:id/reference`: cấu trúc nguồn và provenance; không trả lời giải riêng của LabEx.
- `GET /api/labs/:id`: nội dung local; task có grading.ready và lý do thiếu. Bài chỉ có reference trả HTTP409.
- `POST /api/verify`: trả HTTP422 cho task thiếu capability hoặc bộ kiểm tra, không cho đạt bằng fallback khớp mọi lệnh.
- `GET /api/labs/:id/environment`: trạng thái setup, `reset_required` nếu manifest đã thay đổi; không ghi đè tệp người học.
- `POST /api/labs/:id/reset`, body `{"confirmReset":true}`: lưu môi trường cũ rồi khởi tạo lại; reconnect terminal sau đó.

Phân biệt readiness giáo trình với `/api/environment` là sức khỏe runtime tại thời điểm hiện tại. `supported_tasks_count` không phải tiến độ người học hoặc số test đã chạy. Roadmap còn có `prerequisite_skills`, `learning_outcomes`, `practice_strategy`; đây là hướng dẫn học do bản local biên soạn, không đổi thứ tự nguồn.

## Chạy và bàn giao FE

`scripts/start-local.ps1` khởi động Node thông qua process broker của Windows để server không phụ thuộc terminal công cụ. Không đăng ký scheduled task hoặc service khởi động cùng máy. `-Restart` chỉ dừng đúng Node có entry file tuyệt đối của dự án trên cổng 5000. Log/PID nằm trong `.artifacts`.

Prompt cho Anti: [ANTIGRAVITY_LINUX_ROADMAP_PROMPT.md](ANTIGRAVITY_LINUX_ROADMAP_PROMPT.md). Giữ Anti ở `client/**`, dùng dữ liệu/API thật; không khôi phục các generator suy đoán hoặc số lượng hard-code.
