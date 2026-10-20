# Kiểm tra tổng thể dự án — 20/10/2026

## Kết luận

Web local, API đọc dữ liệu, build và các kiểm thử backend đang chạy được. Tuy nhiên hệ thống **chưa thể coi là hoàn chỉnh hoặc chấm điểm chính xác cho mọi bài**. Có lỗi chấm đạt thiếu bằng chứng trong Junior, trạng thái Windows không thống nhất và 210 nhiệm vụ còn dùng bộ chấm placeholder bị backend từ chối.

Lượt này chỉ kiểm tra và tạo báo cáo/ảnh bằng chứng; không sửa logic sản phẩm, không xóa file, không reset bài học, không bật/tắt Azure VM và không gửi nội dung bài học tới dịch vụ AI.

## Các lỗi cần xử lý theo ưu tiên

### 1. Cao: Junior có thể chấm đạt khi chưa đọc kernel log

- Lab: `linux-day-3-the-log-investigator-596202`.
- Bước: `source-596202-section-2-v2`.
- Tài liệu yêu cầu dùng `dmesg`, lọc không phân biệt hoa thường theo `fail/error`, ghi kết quả vào `~/project/boot_issues.txt`.
- Bộ chấm chỉ kiểm tra file tồn tại và một lệnh thành công có chứa chuỗi `boot_issues.txt`. Không xác nhận lệnh dmesg, phép lọc hay nguồn dữ liệu.
- Tái hiện bằng **mô phỏng thuần hàm**: filesystem predicate trả file tồn tại, lịch sử chỉ có `touch boot_issues.txt` → `passed: true`. Không thực thi touch trong môi trường thật.
- Capability Docker hiện khai báo `kernel_logs: false`, nhưng bước vẫn được metadata đánh dấu ready vì không yêu cầu capability tương ứng.
- Bằng chứng: `.artifacts/grader-semantic-audit-2026-10-20.json`.
- Hướng xử lý: khôi phục trạng thái chưa hỗ trợ khi chưa có kernel log riêng, hoặc cung cấp đúng môi trường rồi viết lại tiêu chí theo yêu cầu. Không dùng file rỗng hoặc đầu ra giả thay cho kernel log. Cần review tương tự các bộ chấm chỉ dựa vào tên file/lệnh; test generic hiện tại không chứng minh đúng ngữ nghĩa từng bài.

### 2. Cao: Windows bị ép trạng thái ready và mâu thuẫn với API chấm điểm

- `server/routes/courses.js:41`–`44` coi mọi khóa Windows có lab là ready và tự gán số bài chạy được bằng số bài nhập.
- Cả API danh sách lab và chi tiết lab đều ghi đè availability thành ready, `can_start_terminal: true`, `can_grade: true` (khoảng dòng 109 và 188).
- Trong khi đó `getStepReadiness`/`getLabReadiness` mới là bộ kiểm tra thực sự mà `/api/verify` sử dụng. Linux terminal không phải đường thực thi Windows; Windows dùng PowerShell/Azure riêng.
- Cụ thể `win-powershell-basics` còn `required_capabilities: ["windows"]`. Readiness chung kiểm tra capability này trong bộ Linux nên báo thiếu windows, trước khi chạy bộ chấm Windows từ xa.
- Tái hiện thật trên API đang chạy: GET lab trả ready, POST verify bước đầu trả **HTTP 422**, `passed: false`, `Môi trường hiện tại thiếu: windows.` Không có PowerShell/VM command nào được thực thi trong phép thử này.
- 15 lab Windows có ít nhất một trường availability khác giữa giá trị API đã ghi đè và readiness gốc; không phải cả 15 đều bị cùng lỗi chấm như PowerShell Basics.
- Hướng xử lý: thống nhất nguồn readiness theo provider; phân biệt khả năng mở tài liệu, PowerShell, Desktop, chấm điểm và trạng thái/prerequisite thật của VM. Bỏ việc ép toàn bộ Windows thành ready.

### 3. Cao: Validator dữ liệu thất bại do placeholder trong 62 lab

- 44 mục khóa học, **199 file lab, 729 nhiệm vụ** trong dữ liệu gốc. Các khóa có dùng chung lab có thể có tổng hiển thị khác khi cộng theo syllabus.
- **210 nhiệm vụ khác nhau trong 62 lab** chứa mẫu lịch sử lệnh quá rộng đang được chọn ở provider cấu hình Docker.
- CompTIA: 33 lab, 157 nhiệm vụ.
- Practice Challenges: 29 lab có file riêng, 53 nhiệm vụ; syllabus còn tái sử dụng 4 lab đã có, nên danh sách khóa có thể hiển thị 33 lab.
- `rtk proxy python -X utf8 server/data/generate_labs.py` thoát mã 1, báo **298 lỗi**: 157 CompTIA + 141 Practice Challenges. 298 là số định nghĩa lỗi, tính cả các biến thể provider, không phải 298 nhiệm vụ khác nhau.
- Các mẫu này đang bị `isUnboundedCommandPattern` và readiness từ chối. Chưa có bằng chứng chúng làm đạt giả qua API hiện tại; tác động đã xác nhận là bài bị chặn chấm.
- Tái hiện API bài RAID/LVM: HTTP 422, `passed: false`, lý do quy tắc kiểm tra lệnh quá rộng hoặc thiếu; giá trị `passed: true` và `command: pwd` gửi từ client không được tin cậy.
- Các script nhập bài mới đã có nhánh tạo `unsupported`, nhưng file dữ liệu hiện có vẫn chứa mẫu cũ. Sửa importer không tự sửa các JSON đã được nhập trước đó.
- Hướng xử lý: thay placeholder bằng unsupported rõ ràng trong khi chờ fixture/grader thực tế; triển khai riêng theo bài và capability. Không sửa validator để bỏ qua lỗi hoặc mở rộng quyền chấm.

### 4. Trung bình: Một số kiểm tra/tài liệu vận hành đã lỗi thời

- `scripts/check-system.mjs:21`–`24` giả định Windows lab luôn không thể chạy/chấm. API hiện tại ép trạng thái Windows thành ready, còn hệ thống đã có Azure executor. Script không còn phản ánh đúng kiến trúc và sẽ thất bại tại assertion trước khi kiểm tra phần còn lại. Không chạy script này trong lượt audit; kết luận dựa trên đối chiếu assertion với API thật.
- `scripts/run-docker-checks.mjs` vẫn dùng `node --test` không chỉ định `tests/*.test.js`, khác script `npm test` đã được thu hẹp. Thư mục tests còn nhiều chương trình smoke có lệnh chạy/reset môi trường ở top level; cần tách rõ test đơn vị và tích hợp, không dùng launcher này như bằng chứng test thuần an toàn. Chưa chạy launcher Docker trong lượt này.
- `SYSTEM_AUDIT_2026-10-19.md` ghi Windows chỉ là mô phỏng và các bộ chấm placeholder đã được sửa; các nhận định đó không còn mô tả đầy đủ mã/dữ liệu hiện tại. Giữ lại như hồ sơ lịch sử, dùng báo cáo mới khi đánh giá hiện trạng.

### 5. Thấp: Cảnh báo chất lượng frontend và dung lượng bundle

- Lint thoát mã 0 nhưng còn cảnh báo effect gọi setState, dependency của effect Labby và import không dùng ở Footer. Cảnh báo gọi handler trước declaration trong effect không được coi là bằng chứng runtime crash: kiểm tra Labby hiện đã qua, nhưng nên sửa cấu trúc hook cho rõ ràng.
- Production JS khoảng **940,05 kB**, gzip **263,57 kB**, Vite cảnh báo chunk lớn. Chưa thấy lỗi tải trong lượt kiểm tra; có thể tách tải LabWorkspace/terminal/RDP theo route để giảm tải ban đầu.

## Phần đã kiểm tra và đạt

| Kiểm tra | Kết quả |
| --- | --- |
| `rtk proxy npm test` | 41/41 qua; unit/router tests, Azure và executor được mô phỏng |
| Cú pháp Python | 70 file parse AST thành công; không thực thi mã |
| Cú pháp JS backend/script/test | 83 file `node --check` thành công |
| `rtk proxy npm run build` tại client | Thành công; có cảnh báo bundle lớn |
| `rtk proxy npm run lint` tại client | Mã 0; còn cảnh báo như trên |
| API GET toàn bộ 199 lab | 199/199 HTTP 200; đây là đọc metadata, không phải thực hiện lab |
| Web `/learn`, health, environment, courses, Linux path/roadmap | HTTP 200 |
| Môi trường Linux | API báo available=true, Docker rootless / Ubuntu 22.04.5 LTS |
| Azure control/status | API status truy vấn được, VM deallocated; không bật VM |
| AI status | Cấu hình Gemini `gemini-3.5-flash`; không gọi nhà cung cấp trong lượt audit |
| Giao diện catalog/path/4 khóa × 390/768/1440px | 18/18 trường hợp không tràn ngang, không pageerror hoặc HTTP lỗi local |
| Nút về đầu trang | Ẩn ở đầu, hiện khi cuộn, bấm về đầu và tự ẩn |
| `check-guide-illustrations.mjs` | 18/18 kiểm tra ảnh và modal, không lỗi JS/tràn ngang |
| `check-labby-ai-ui.mjs` | Qua; dùng HTTP fixtures cho toàn bộ chat, kiểm tra same-origin, offline, history, lỗi HTTP, hỏi theo bước |
| Ảnh `/guides/...` được tham chiếu trong JSON lab | Không phát hiện file thiếu trong `client/public` |

## Bằng chứng và giới hạn

- `.artifacts/project-audit-2026-10-20.json`: thống kê, toàn bộ lỗi validator, dữ liệu readiness, kết quả API và yêu cầu verify bị từ chối.
- `.artifacts/syntax-audit-2026-10-20.json`: kiểm tra cú pháp.
- `.artifacts/ui-audit-2026-10-20.json`: 18 trường hợp responsive và nút về đầu trang.
- `.artifacts/grader-semantic-audit-2026-10-20.json`: phản ví dụ của bộ chấm Junior.
- `.artifacts/labby-ai-ui-check.json`, `.artifacts/windows-guide-illustrations-check.json`: được chạy lại trong lượt này.

Đây là kiểm tra tổng thể local, **không phải chứng nhận nội dung giống LabEx 100%**. Không truy cập lại LabEx, không so từng đoạn dịch với nguồn, không chạy toàn bộ 729 nhiệm vụ, không xác nhận lại mọi capability Linux bằng thao tác thực tế, không kiểm tra AD/IIS/RDP trực tiếp khi VM đang tắt và không kiểm tra AI online bằng ngữ cảnh thật. API metadata trả ready chỉ là điều kiện cấu hình; phản ví dụ Junior cho thấy không thể dùng số ready làm chứng nhận chất lượng bộ chấm.

Ưu tiên xử lý tiếp: **bộ chấm Junior → readiness Windows → placeholder CompTIA/Challenges → đồng bộ công cụ audit → lint/bundle**.
