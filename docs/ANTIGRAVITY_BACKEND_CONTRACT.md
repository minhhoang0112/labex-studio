# Bàn giao backend cho Antigravity: Quick Start with Linux

Cập nhật 16/10/2026. Mục tiêu là bám đúng cấu trúc và nhiệm vụ của khóa gốc, không chỉ dùng lại tên bài. Đã lấy outline có xác thực của cả 10 bài: **67 sections, 47 task steps có `need_verify:true`**. Provider Linux riêng đã được nối vào backend; FE vẫn cần chuyển sang `sections` theo contract dưới đây. Nội dung/luật chấm local không phải bản sao toàn bộ giáo trình hoặc grader gốc.

## Phân công

| Phạm vi | Chủ sở hữu |
| --- | --- |
| `client/**`: bố cục, điều hướng, sections, tiến độ, Labby, trạng thái khả năng môi trường | Antigravity |
| `server/**`, `server/data/**`: API, dữ liệu giáo trình, fixture, bộ chấm, runtime | Codex |
| Test backend/runtime và script tạo dữ liệu | Codex |
| Kiểm thử giao diện và tích hợp FE với API | Antigravity, đối chiếu với test backend của Codex |

Không sửa chéo các file trên trong khi bên kia đang làm. Báo thay đổi contract trước khi đổi tên field, ID hoặc payload. Giữ ID lab/step do backend cấp; không tự tạo bài thay thế hoặc sửa JSON từ FE.

## Phạm vi nguồn và bằng chứng

- Khóa [Quick Start with Linux](https://labex.io/courses/quick-start-with-linux) có đúng **5 guided labs + 5 challenges**, xen kẽ theo bảng dưới. Số mục giáo trình là 10; số sections không bằng số nhiệm vụ được chấm.
- REA phiên nguồn đã xác thực, quan sát thụ động: `ev_c247edb278f83b915b336b14ea4efdf31bf6fe86be216a24159ae844a1b0aaff`. Có Desktop/WebIDE/Terminal thật và summary bài thứ hai. Không ghi danh tính tài khoản đăng nhập vào repo.
- REA đối chiếu catalog có kiểm soát: `ev_4300bbd2dec0e48ed643518749bac76086ad46ff3aec17850a4a93d2fa6b4517`. Xác nhận 10 mục giáo trình. Sau điều hướng tới bài đã hoàn thành, màn hình có summary/cover; Terminal chưa xuất hiện trước khi môi trường được khởi động. Không suy ra chức năng đã chạy chỉ từ tên tab.
- REA lấy outline **cả 10 bài qua GET API có xác thực**, không khởi động VM: `ev_2987a1f8d0e50c98e0c112111e84a87c469f7fc4362016b74a1e84a167e9adcc`. Nguồn `/api/v2/lab/:numericId/steps?lang=en` trả `{steps:[{position,title,layout,text,need_verify,has_solution}]}`. Manifest factual được lưu ở `server/data/reference/quick-start-live-outline.json`: tổng **67 sections / 47 task steps**, chỉ giữ outline/provenance và độ dài text, không chứa toàn văn nguồn hay solution.
- Quota VM nguồn miễn phí **3 lần khởi động/ngày** đã chặn các probe VM/grader tiếp theo; hạn chế này không ngăn lấy outline của 10 bài. Không tuyên bố đã khôi phục toàn bộ grader gốc, solution, fixture bytes hoặc image gốc.
- Bản chụp `/learn` lịch sử: `C:/Users/HP VICTUS/.gemini/antigravity/brain/58c2ac8b-3865-4dbe-81f4-725a716efe04/labex_learn_screenshot.png`. Chỉ dùng làm tham chiếu lịch sử; workspace cần theo bằng chứng mới.
- Chưa thu được mã backend/bộ chấm gốc, toàn bộ byte fixture hoặc giấy phép cho phép tái phân phối toàn văn bài học. Nội dung local dùng tóm tắt sự kiện/mục tiêu, ví dụ tự biên soạn và URL nguồn; giữ tên bài/thuật ngữ cần thiết để đối chiếu. Không bulk-copy đoạn văn dài hay gọi verifier local là verifier gốc.

| Thứ tự | Loại | Bài nguồn / local ID |
| --- | --- | --- |
| 1 | `lab` | [Your First Linux Lab](https://labex.io/tutorials/linux-your-first-linux-lab-270253) · `linux-your-first-linux-lab` |
| 2 | `challenge` | [Display User and Group Information](https://labex.io/tutorials/linux-display-user-and-group-information-8718) · `linux-display-user-and-group-information` |
| 3 | `lab` | [Basic Files Operations](https://labex.io/tutorials/linux-basic-files-operations-270248) · `linux-basic-files-operations` |
| 4 | `challenge` | [Files and Directories](https://labex.io/tutorials/linux-files-and-directories-270246) · `linux-files-and-directories` |
| 5 | `lab` | [File Contents and Comparing](https://labex.io/tutorials/linux-file-contents-and-comparing-270251) · `linux-file-contents-and-comparing` |
| 6 | `challenge` | [The Manuscript Mystery](https://labex.io/tutorials/linux-the-manuscript-mystery-384742) · `linux-the-manuscript-mystery` |
| 7 | `lab` | [Permissions of Files](https://labex.io/tutorials/linux-permissions-of-files-270252) · `linux-permissions-of-files` |
| 8 | `challenge` | [Change File Ownership](https://labex.io/tutorials/shell-change-file-ownership-270254) · `shell-change-file-ownership` |
| 9 | `lab` | [User Account Management](https://labex.io/tutorials/linux-user-account-management-49) · `linux-user-account-management` |
| 10 | `challenge` | [The Joker's Trick](https://labex.io/tutorials/linux-the-joker-s-trick-270247) · `linux-the-jokers-trick` |

## Schema bài học chuẩn cho FE

`GET /api/labs/:id` giữ `id`, `course_id`, `title`, `order`, `difficulty`, `estimated_time`, `overview`. Phần mở rộng:

| Field | Ý nghĩa FE phải tuân theo |
| --- | --- |
| `type` | `lab` hoặc `challenge`; dùng cho nhãn/nhóm, không suy ra từ tên file hoặc thứ tự lẻ/chẵn |
| `source` | Metadata provenance, gồm `url`, `lab_id`, `fidelity` và thông tin bổ sung nếu có. Dùng URL nguồn; không tự quảng cáo fidelity cao hơn dữ liệu |
| `sections[]` | Toàn bộ nội dung để đọc theo thứ tự, gồm Introduction, task sections và Summary |
| `sections[].kind` | `introduction`, `task`, hoặc `summary` |
| `sections[].id`, `title`, `content` | ID ổn định và Markdown để điều hướng/hiển thị |
| `steps[]` | Chỉ các task cần kiểm tra/xác nhận; tổng đích 47, gồm một hoạt động onboarding `acknowledgement`. Không dùng độ dài mảng này làm số trang nội dung |
| `steps[].id` | Bằng `id` của section `kind: 'task'` tương ứng. Join bằng ID, không bằng index/title |
| `verification_kind` | Loại kiểm tra công khai: `commands`, `state`, `all`, hoặc `acknowledgement`; không phải lệnh để browser chạy |

Backend giữ riêng `verification`/`verify_command`, kể cả các điều kiện chấm bên trong; API không trả chi tiết đó. FE không cần biết regex, hash fixture hoặc lệnh kiểm tra. **Anti triển khai `sections` ngay theo contract này**; `steps` chỉ là danh sách task và tương thích client cũ, không còn là mô hình trang đọc. JSON giáo trình đang được chốt theo manifest nguồn; không tự bịa Introduction/Summary hay sao chép toàn bộ `text` của nguồn để bù dữ liệu.

Trong outline nguồn, Introduction/Summary dùng `layout:'doc-fullscreen'`; task dùng `layout:'doc-workbench-split'`. FE tách trang đọc toàn chiều rộng và trang có môi trường thực hành tương ứng; chuyển layout không được hủy phiên terminal đang giữ. Nội dung hiện gồm bản Anti đã nhập trong workspace và hướng dẫn/tóm tắt local. Không gọi toàn bộ nội dung là toàn văn đã xác minh; dịch VI chỉ dùng khi có trường tương ứng.

Ví dụ bắt buộc cho **bài thứ hai**: đúng 4 sections theo thứ tự `Introduction` → `Display Your Current User Identity` → `Display User and Group Information` → `Summary`. Chỉ hai mục giữa là task được chấm. Yêu cầu là hiển thị danh tính bằng lệnh thật; **không có nhiệm vụ tạo `user_info.txt` hay output file**. Backend đang thay bài cũ sai mục tiêu.

`GET /api/courses/:id` trả `{course, labs}` đã sắp `order` rồi `id`. Mỗi item có `type`, `source`, `sections_count`, `steps_count`, `step_ids` cùng metadata hiển thị. `sections_count` tính cả Introduction/Summary; `steps_count` tính task cần kiểm tra/xác nhận, bao gồm hoạt động onboarding nói dưới. Catalog `/api/courses` có `labs_count`, `steps_count`, `lab_ids`, `available` tính từ dữ liệu thật; không dùng số quảng cáo cũ trong JSON làm nguồn đếm. `GET /api/courses/quick-start-with-linux/reference` trả manifest factual 67/47 để đối chiếu.

## API tương tác hiện có

| Giao tiếp | Contract |
| --- | --- |
| `GET /api/health` | `{status, environment:{available,shell,label,error?}}`; báo lỗi thật khi Linux chưa sẵn sàng |
| `GET /api/environment` | Trả trực tiếp object `environment` như trong health, gồm capabilities và lifecycle; không có wrapper `{environment:...}` |
| `WS /ws/terminal?labId=<id>` | Same-origin `ws`/`wss`; không gắn cứng host/port. Chờ packet `ready` trước khi gửi input |
| Server → WS | `ready` gồm `labId`, `shell`, `environment`; `output` gồm `data`; `error` gồm `message`; `exit` gồm `exitCode`, `signal` |
| FE → WS | `{type:'input',data}` hoặc `{type:'resize',cols,rows}`; terminal/PTY phải giữ mounted khi đổi tab |
| `POST /api/verify` | Với task Linux: `{labId,stepId}`. Server chọn luật từ dữ liệu tin cậy và đọc trạng thái/lịch sử shell thật; không nhận command/output giả để chấm |
| Verify response | `{passed,message,hint?,verification_method?}`. HTTP 400/404 cho ID sai; 422 nếu chưa hỗ trợ chấm; 503 khi môi trường chưa sẵn sàng. Không có command thì không tự pass |
| `POST /api/labs/:id/reset` | Body `{confirmReset:true}` bắt buộc. Server đóng **chỉ WebSocket của lab đó**, lưu trữ trạng thái cũ thành backup và tạo trạng thái thực hành mới. Response `{reset:true,labId,backupCreated,reconnectRequired:true}`; FE phải reconnect terminal, không chỉ clear xterm |
| `POST /api/ai/chat` | `{message,history,context}`. `history` tối đa 8 tin trước câu hiện tại; `context` gồm `labTitle,stepTitle,task,hint,terminalOutput` |
| AI response | `{reply,mode:'offline'|'gemini'|'openai',notice?}`. Hiển thị mode/notice thật; Labby không tự xác nhận đạt bài |

API HTTP dùng đường dẫn tương đối `/api/...`; Vite đã proxy `/api` và `/ws` về backend 5000. Backend phục vụ SPA deep links `/learn`, `/courses/:id`, `/labs/:id`. Chưa có account/progress API: tiến độ hiện là localStorage trên browser/origin này.

Ngoại lệ có chủ đích: hoạt động **Learn By Doing** dùng `verification_kind:'acknowledgement'`. FE hiển thị **Tiếp tục/Đã hiểu**, gửi `/api/verify` với `{labId,stepId,acknowledge:true}`. Response dùng `verification_method:'learner-acknowledgement'`. Đây là ghi nhận hành động đọc onboarding, **không phải chấm kỹ năng Linux**, không gọi là “lệnh đúng” và không giả Deep Inspection gốc. Chỉ gửi `acknowledge:true` cho loại này; các task khác vẫn cần bộ chấm thật. 47 task steps của nguồn vì thế không đồng nghĩa 47 bài chấm Linux local.

Reset không sửa localStorage browser. FE cần thông báo đúng tác dụng reset và đồng bộ/xóa kết quả task của lab hiện tại khi người học chọn bắt đầu lại; không xóa tiến độ lab khác. Sau reset thành công, xóa feedback cũ rồi reconnect để nhận `ready` mới.

## Runtime đích và giới hạn giao diện

Máy này đã chọn **Docker rootless**, Ubuntu **22.04.5**. Terminal/verifier dùng chung container theo bài, có dữ liệu, tài khoản, sudo, tiến trình, APT, mạng/UFW và cron thật. HOME `/home/labex`, cwd `/home/labex/project`; không mount host drive/socket hoặc dùng privileged/host network. Provider **unshare + chroot** cũ vẫn chọn được, dùng Ubuntu 26.04.1 của WSL với `/usr` chỉ đọc, không có mạng hoặc cron scheduler. Không suy khả năng từ tên khóa học; đọc runtime API. Chi tiết [ROOTLESS_RUNTIME.md](ROOTLESS_RUNTIME.md).

FE đọc đường dẫn/ví dụ từ dữ liệu bài và trạng thái server; không thay mọi `~` thành project, không yêu cầu người học quản trị tài khoản trên WSL chủ. Nhiệm vụ hiển thị chỉ có thể đạt qua lịch sử thực thi đã hoàn tất; FE không gửi output hay lịch sử giả để chấm.

Workspace gốc có hướng dẫn bên trái, khu môi trường bên phải, các tab **Desktop / WebIDE / Terminal / Web 8080**; Labby nổi bên phải thay vì chiếm cố định nửa môi trường. Đây là mục tiêu bố cục để Anti đối chiếu ảnh/capture, **không phải danh sách endpoint hiện đã có**.

Backend hiện có terminal và lifecycle reset thật. Docker có `capabilities.network:true`, namespace cũ là false. Cả hai chưa có Desktop/WebIDE/Web8080, systemd, SSH authentication hoặc kernel log riêng. `network:true` không phải capability Web8080. Không bật tab dịch vụ từ cờ mạng; phải có capability và endpoint đúng. Khi môi trường không sẵn sàng hoặc thiếu capability, hiển thị lỗi/thử lại hoặc chưa hỗ trợ.

## Những việc FE còn phải làm

Danh sách bên dưới là yêu cầu gốc của đợt chuyển schema; Anti đã hoàn thành nhiều phần. **Prompt và audit hiện tại** nằm ở [ANTIGRAVITY_LINUX_ROADMAP_PROMPT.md](ANTIGRAVITY_LINUX_ROADMAP_PROMPT.md). Tiếp tục theo tài liệu đó, không dựng lại các tính năng sections/VI-EN/progress/reset/roadmap đã có.

1. Thay `LabGuide`/`LabWorkspace` đang điều hướng bằng `steps[index]` sang `sections`, join task theo ID. Introduction/Summary chỉ có điều hướng đọc; task mới có nút chấm.
2. Tách `currentSectionId`/tiến độ đọc khỏi tập `passedStepIds`. Qua Summary hoặc đọc đủ trang không đồng nghĩa đạt nhiệm vụ. Hoàn thành bài khi mọi ID trong `step_ids` đã được server xác nhận, với onboarding hiển thị riêng là đã đọc/tiếp tục; dùng thứ tự course API cho bài kế tiếp. Hỗ trợ riêng nút acknowledgement và reset/reconnect.
3. **Dùng ID ổn định mới của giáo trình nguồn để loại các pass sai của bản cũ**; không tự ghép `step-1` cũ sang task mới theo vị trí/title. Không chuyển bài cũ tạo file thành pass cho nhiệm vụ hiển thị. Khi đọc localStorage, lọc lại `passed` bằng `step_ids` hiện tại và tính lại `complete`, không tin cờ `complete` cũ. Lưu vị trí section riêng; có thể đổi version khóa progress để migration rõ ràng.
4. Khôi phục bố cục nguồn và Labby nổi, giữ kết nối terminal/hội thoại khi đóng/mở panel. Chờ capability thật cho Desktop/WebIDE/Web 8080. Giữ xử lý loading, lỗi, reconnect và resize hiện có.
5. Hiển thị 5 lab + 5 challenge đúng loại/thứ tự, tổng **67 sections / 47 task steps** theo API; phân biệt task chấm Linux và onboarding. Không khôi phục certificate, số học viên hoặc rating giả cho bản local.
6. Kiểm thử bài thứ hai: 4 sections/2 task; verify sai phải fail, lệnh thật đúng mới pass; chuyển Introduction/Summary không tự pass; đổi panel giữ phiên; reload giữ vị trí đọc và progress mới; course tính đủ 10 mục. Kiểm thêm Learn By Doing bằng acknowledgement, reset chỉ tác động lab hiện tại, caps không hiển thị Desktop/WebIDE/mạng giả. Các bài tài khoản kiểm thử trong runtime riêng đang sẵn sàng theo health.

Các test/E2E trước ngày chuyển schema chỉ chứng minh luồng của giáo trình local cũ. Cần chạy lại sau khi dữ liệu, runtime và FE mới được tích hợp; không dùng kết quả 3/3 hoặc 1/10 cũ để tuyên bố tái hiện khóa gốc hoàn chỉnh.
