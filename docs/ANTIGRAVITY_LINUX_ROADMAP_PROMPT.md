# Bàn giao Anti: frontend lộ trình Linux và workspace

> **Đã tự thực hiện theo yêu cầu mới:** Codex đã sửa các mục FE còn lại và kiểm tra trình duyệt; xem [WORKSPACE_REPAIRS_2026-10-17.md](WORKSPACE_REPAIRS_2026-10-17.md). Bảng và prompt cũ bên dưới là lịch sử, không phải danh sách còn chờ Anti làm.

> **Cập nhật sau sửa 17/10:** đọc [FIDELITY_REPAIRS_2026-10-17.md](FIDELITY_REPAIRS_2026-10-17.md) và prompt ở cuối file đó trước. Docker đã được chọn lại; Shell đã sửa 18 bài và kiểm thử 73 nhiệm vụ, Noobs đã kiểm thử 100 nhiệm vụ và dịch đủ 208 sections. Codex đã sửa reset/verify generation, readiness và Web8080 trong hai file FE. Danh sách audit bên dưới là lịch sử, cần đối chiếu mã hiện tại trước khi áp dụng.

> Audit giáo trình mới ngày 17/10: [COURSE_FIDELITY_AUDIT_2026-10-17.md](COURSE_FIDELITY_AUDIT_2026-10-17.md). Shell đã thêm 18 bài nhưng có các yêu cầu khác nguồn và một bộ chấm báo đạt trước khi làm; `.env` hiện chọn namespace. Các mô tả Docker đang chạy và số bài trong snapshot 16/10 bên dưới cần đọc theo audit mới.

Cập nhật từ mã nguồn ngày 16/10/2026. Codex phụ trách backend, dữ liệu, runtime và kiểm thử backend; Anti phụ trách `client/**`. Các nhận xét dưới đây dựa trên đọc mã hiện tại, chưa phải kết quả kiểm thử trình duyệt. Đọc lại file trước khi sửa vì hai bên đang làm song song.

## Phần Anti đã tích hợp

- `LearningPath.jsx` gọi API roadmap, có chế độ thứ tự nguồn/lộ trình đề xuất và các chặng học.
- CourseCard/CourseDetail dùng readiness và số bài local/nguồn; phần lớn claim chứng chỉ và số liệu nguồn cũ đã bỏ.
- Workspace có VI/EN, sections/steps ghép theo ID, Intro/Summary theo doc-fullscreen, cảnh báo fixture cần reset và modal reset riêng lab.
- Terminal giữ mounted khi đổi section; Labby giữ mounted khi đóng/mở. Terminal có WebSocket cùng origin, ResizeObserver, reconnect.
- Progress v2 lọc task ID khi ghi; CourseDetail tính lại hoàn thành theo step_ids. Navbar đã có unavailable/retry.

Giữ các phần này, không dựng lại từ đầu. Chuyển ngôn ngữ giao diện không có nghĩa toàn bộ giáo trình đã được dịch; chỉ dùng content_vi/title_vi khi API có.

## Các lỗi còn thấy trong mã

| File / vị trí để tìm | Vấn đề và kết quả cần đạt |
| --- | --- |
| LearningPath, totals fallback | Hard-code imported 57/runnable 52 khi roadmap lỗi. Hiện lỗi và retry; không hiển thị số local giả định. |
| LearningPath, isPracticeOnline / handleClick | Khóa nguồn linux-basic-commands-practice-online bị đổi link sang 4 bài tự biên soạn linux-commands-practice-online. Giữ khóa nguồn 41 bài và outline riêng; Local Exercises chỉ là liên kết bổ sung có nhãn. |
| CourseCatalog, featured Linux / onlyReady | Hard-code “61 bài local”, 65h; bộ lọc còn fallback available && labs_count>0. Dùng API và phân biệt chấm đủ/thực hành một phần. |
| CourseCard, level | API trả level số và level_label; đang hiển thị trực tiếp số. Dùng nhãn. Thiếu readiness không được suy thành Ready. |
| CourseDetail, passedCount / availability fallback | Task đạt lấy progress.passed.length, chưa lọc ID cũ. Giao với step_ids; không fallback thiếu availability thành ready/can_open=true. |
| LabWorkspace, activeGeneration; LabGuide, verifyStep | Generation tăng khi reset/load nhưng không được truyền/đọc tại callback verify: guard hiện chưa có hiệu lực. Bỏ response cũ sau reset/đổi lab, abort request, dùng labId/stepId/generation của request. Chặn verify mới lúc reset. |
| LabGuide, grading / unpassedAckSteps / handleCompleteSummary | Thiếu grading mặc định ready; ack còn suy từ action continue; Summary bulk ack không kiểm tra readiness từng task. Chỉ xác nhận thông tin khi metadata ack hợp lệ do BE công khai và grading.ready===true. |
| LabWorkspace, environment fetch / caps | Nuốt lỗi API, fallback terminal=true; luôn mount terminal kể cả bài không cho mở. Tôn trọng availability.can_start_terminal, loading/unavailable/retry. Sau khi mở hợp lệ thì giữ phiên qua đổi section/layout. |
| LabWorkspace, Web8080 | Đang dùng caps.network để bật tab. Docker có network thật nhưng chưa có Web8080 proxy. Khóa tab tới khi có capability và endpoint web riêng. Desktop/WebIDE cũng cần dịch vụ thật. |
| LabWorkspace, pane styles | Mobile vẫn có inline width phần trăm; ba panel cùng h-1/2 có thể vượt viewport; doc-fullscreen mobile chỉ cao nửa vùng. 768px bị min-width guide280 + terminal320 + AI360 vượt ngang. Dùng panel/tab/drawer phù hợp. |
| LabWorkspace, drag / reset modal | Drag chỉ dọn listener lúc mouseup, chưa cleanup khi unmount; chưa có pointer/keyboard resize. Modal thiếu dialog semantics, focus trap/restore và Escape. |
| lib/progress.js, courseProgress | Hàm này vẫn tin entry.complete cũ. Nếu dùng lại, tính từ task ID hiện hành; không ghép theo index/title. |

## Nguồn và giới hạn

[Trang Linux chính thức](https://labex.io/learn/linux) được đối chiếu ngày 16/10/2026: 8 khóa, **325 mục bài theo khóa**, **319 bài duy nhất** do dùng lại một số bài. Đã lấy outline 319 bài với 1.563 section/925 task; không phải mọi section đều đọc được phần thân.

| Thứ tự nguồn | Khóa | Mục nguồn |
| --- | --- | ---: |
| 1 | Quick Start with Linux | 10 |
| 2 | Become a Junior System Administrator | 10 |
| 3 | Linux for Noobs | 37 |
| 4 | Linux Commands Practice Online | 41 |
| 5 | Shell for Beginners | 18 |
| 6 | CompTIA Linux+ Certification Training Labs | 33 |
| 7 | Linux Security for DevSecOps | 20 |
| 8 | Linux Practice Challenges | 156 |

Có file local cho Quick Start, Junior và Noobs; **số file không chứng minh đã chấm được**. Codex đang rà các task Noobs bị gán acknowledgement để thay bằng kiểm tra thật hoặc đánh dấu chưa hỗ trợ. Không hard-code runnable. Bốn bài Local Exercises nằm ngoài khóa nguồn 41 bài; nhóm 24 project nguồn không phải 24 project local đã chạy.

Lộ trình sysadmin đề xuất local: Quick Start → Noobs → luyện lệnh song song → Shell → Junior → CompTIA Linux+ → Security; Challenges để ôn xuyên suốt. API có prerequisites_advisory:true, không khóa cứng người đã biết căn bản. Giữ riêng thứ tự nguồn.

Phần thân bài có provenance hỗn hợp: hướng dẫn local được biên soạn, file tham chiếu người dùng/Anti đã nhập, và outline nguồn. Có phần chưa đối chiếu toàn văn. Không gắn “giống hệt 100%”, “grader gốc” hoặc “toàn văn gốc” cho mọi bài.

Docker rootless Ubuntu 22.04 đã được cài và chọn cho server cổng 5000, có bằng chứng mạng/firewall/package/cron/tiến trình tồn tại qua exec. Quick Start đã thử đạt 47/47; Junior 47 đạt/1 kernel-log block. FE đọc môi trường đang dùng từ API, không đoán theo máy có Docker. Namespace/Docker có khả năng khác nhau. Chưa có Desktop, WebIDE, Web8080 proxy, xác thực SSH, systemd hoặc kernel log riêng.

## Contract tích hợp

- GET /api/roadmaps/linux-system-administrator: source_order, courses[], stages[], totals, order_kind:'recommended-local', prerequisites_advisory. Course có source_labs_count, imported_labs_count, runnable_labs_count, practice_labs_count, supported_tasks_count, status, reason, prerequisites, order; thêm prerequisite_skills, learning_outcomes, practice_strategy để hướng dẫn cách học từng khóa.
- Catalog/detail course có readiness và các số trên. labs_count là số đã nhập; runnable_labs_count là bài chấm đủ theo luật BE; practice_labs_count là bài có thể mở terminal. supported_tasks_count không phải tiến độ hoặc số bài đã kiểm thử E2E.
- Course detail có stages và danh sách bài nguồn; bài chưa local có availability reference-only. Không dùng labs.length làm số bài chạy được.
- Lab availability: **state, can_open, can_start_terminal, can_grade, supported_steps_count, total_steps_count, missing_capabilities, reasons**. State có ready/partial/blocked/reference-only. **Không có availability.implemented hoặc availability.grading_ready.**
- Task grading: ready, missing_capabilities, reasons. Chỉ verify khi ready===true. Lab partial vẫn đọc/làm task được hỗ trợ; task blocked không nhận pass thay thế.
- Sections là trang đọc, steps là task, ghép theo ID. Layout doc-fullscreen/doc-workbench-split. BE chuẩn hóa legacy shape; FE báo lỗi nếu response sai, không sửa JSON backend để né.
- GET /api/environment: runtime/capabilities/available hiện hành. Availability giáo trình khác health runtime. Network không đồng nghĩa có web proxy.
- GET /api/labs/:id/environment: initialized/setup_current/reset_required/reason. Khi cần reset, cảnh báo để người học chủ động chọn; không tự ghi đè bài làm.
- POST /api/labs/:id/reset với {confirmReset:true}: reset riêng lab, BE lưu môi trường cũ; FE xóa progress riêng lab và reconnect sau thành công.
- POST /api/verify chỉ gửi {labId,stepId}; thêm acknowledge:true cho task thông tin hợp lệ. BE không nhận lệnh chấm/provider/output/pass từ trình duyệt. HTTP422 là chưa hỗ trợ, 503 là môi trường lỗi. Giữ message/hint, không quy mọi lỗi thành backend chưa chạy.
- GET /api/labs/:id/reference và /api/courses/:id/reference cung cấp outline. Bài chỉ có outline trả HTTP409 ở /api/labs/:id; dùng action outline/nguồn thay cho Start.
- Progress chỉ local theo origin, không account sync. Lọc pass theo task ID mới, tính lại complete; Junior có một số ID đổi hậu tố -v2.

Đọc response thật trước khi sửa. Nếu thiếu field, báo Codex endpoint/ví dụ cụ thể; không dùng mock che lỗi hoặc sửa BE.

## Prompt chép sang Antigravity

```text
Bạn phụ trách FRONTEND LabEx Local tại D:\Project\LabEx. Chỉ sửa client/**. Codex phụ trách server, data, runtime và test backend; không sửa các phần đó. Đọc AGENTS/RTK, docs/ANTIGRAVITY_LINUX_ROADMAP_PROMPT.md và contract backend; shell luôn qua rtk.

Đọc lại mã mới. Giữ roadmap hai chế độ/chặng học, VI/EN, sections ghép task bằng ID, doc-fullscreen, progressv2, fixture/reset, terminal/chat giữ mounted. Sửa các lỗi còn tồn tại trong bảng audit, không dựng lại từ đầu.

1. Bỏ hard-code imported/runnable/local count và fallback Ready khi API thiếu/lỗi. Số local, readiness, lý do giới hạn lấy từ API thật; lỗi phải có retry. Dùng level_label. Tách nguồn/đã nhập/mở terminal/chấm đủ/tiến độ.
2. Bỏ ánh xạ khóa nguồn linux-basic-commands-practice-online (41 bài) sang 4 bài linux-commands-practice-online. Khóa nguồn giữ URL/detail/outline riêng; Local Exercises là liên kết bổ sung có nhãn.
3. Dùng lab.availability đúng field state/can_open/can_start_terminal/can_grade/supported_steps_count/total_steps_count/missing_capabilities/reasons. Task verify chỉ khi grading.ready===true. Không fallback metadata thiếu thành ready. HTTP422 hiển thị chưa hỗ trợ, không fake pass.
4. Ack chỉ cho task thông tin do BE công khai xác định; không coi action continue đơn lẻ là bằng chứng đã làm Linux. Summary không bulk ack task blocked. Hủy/bỏ response theo generation+labId+stepId khi reset/đổi lab; generation hiện có chưa nối tới LabGuide. Chặn verify mới lúc reset. Ghi tiến độ bằng ID của request.
5. Lọc passed ở course rows theo step_ids, tính lại completion mọi cấp. Reset chỉ xóa lab hiện tại sau BE thành công và reconnect thật; không để verify cũ ghi pass sau reset. Không tự reset khi fixture đổi.
6. Environment lỗi có notice/retry; chỉ mở terminal khi availability cho phép. Khi mở hợp lệ, giữ shell qua đổi section/layout và chat qua đóng/mở. Desktop/WebIDE/Web8080 cần capability+endpoint riêng; caps.network=true không bật Web8080.
7. Sửa pane: mobile không inline width phần trăm, doc-fullscreen dùng hết vùng đọc; guide/terminal/AI không vượt viewport. 768/1024px không ép ba cột quá rộng. Modal có dialog/focus trap/Escape/restore; drag cleanup khi unmount và hỗ trợ pointer/keyboard.

Acceptance với backend thật:
- /paths/linux có 8 khóa nguồn và track đề xuất riêng; reload/back chạy; không đổi khóa nguồn 41 bài thành Local Exercises.
- Không hard-code 57/52/61 hoặc suy Ready từ số file. API lỗi không hiện số local tưởng tượng. 325 là mục nguồn, 319 là bài duy nhất, không phải local chạy đủ.
- Quick Start giữ 67 sections/47 task actions; ack thông tin tách khỏi kiểm tra lệnh. Junior/Noobs dùng grading hiện hành; không ép task chưa hỗ trợ thành xác nhận đọc.
- Reference-only có outline/nguồn, không terminal giả. Partial đọc được, chỉ chấm task ready.
- Verify sai fail/đúng pass; delayed verify rồi reset/đổi lab không ghi pass muộn. Reset một lab không mất lab khác. ID cũ không tính vào task count/completion.
- Đóng/mở Labby giữ chat; đổi section giữ shell; đổi lab không trộn output/chat ngữ cảnh; environment lỗi có retry. Network=true vẫn không bật Web8080 khi thiếu dịch vụ.
- 390x844, 768px, 1024px và desktop, có/không AI, Intro/task/Summary: không clipping/mất nút; modal dùng được bằng bàn phím.
- Chạy build/lint và kiểm tra trình duyệt các luồng trên. Không sửa BE/data để làm xanh test. Báo file sửa, bằng chứng kiểm tra và phụ thuộc BE. Không claim đã phục hồi đầy đủ grader/toàn văn nguồn.
```

Tài liệu này chỉ cập nhật bàn giao; không sửa client/**.
