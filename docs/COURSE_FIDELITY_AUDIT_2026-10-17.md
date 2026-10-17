# Đối chiếu giáo trình sau cập nhật Anti — 17/10/2026

> Đây là snapshot **trước khi sửa**. Các lỗi Shell, bản dịch và cấu hình provider bên dưới đã được xử lý trong đợt tiếp theo. Đọc [kết quả sửa và bằng chứng hiện tại](FIDELITY_REPAIRS_2026-10-17.md); không dùng trạng thái namespace/Shell sai ở snapshot này làm trạng thái hiện tại.

**Kết luận: chưa giống LabEx 100%.** Danh mục và thứ tự phần lớn đã khớp, nhưng nội dung bài Shell có thay đổi yêu cầu, bản dịch còn thiếu, bộ chấm có báo đạt trước khi làm và môi trường chưa đủ chức năng nguồn. Không có cơ sở đưa ra một phần trăm tương đồng tổng quát.

Đợt này đọc lại JSON hiện tại, generator Shell, readiness và các báo cáo kiểm thử; đối chiếu trang công khai của LabEx với snapshot outline ngày 16/10. Chỉ bổ sung báo cáo, không ghi đè nội dung Anti đang sửa.

## Phạm vi đã có

| Khóa | Bài local | Sections / task | Đối chiếu outline |
| --- | ---: | ---: | --- |
| Quick Start with Linux | 10 | 67 / 47 | 10/10 khớp tiêu đề, vị trí và cờ task |
| Become a Junior System Administrator | 10 | 68 / 48 | 10/10 khớp cấu trúc snapshot |
| Linux for Noobs | 37 | 208 / 134 | 37/37 khớp cấu trúc snapshot |
| Shell for Beginners | 18 | 110 / 74 | 17/18 khớp chuỗi chính xác; một tiêu đề chỉ khác escape dấu `*` |

Đó là **75 bài duy nhất** thuộc bốn khóa. Sáu bài dùng chung còn được hiển thị trong Linux Practice Challenges, nên roadmap có **81 mục đã nhập**. Snapshot nguồn có 325 mục / 319 bài duy nhất. Linux Commands Practice nguồn 41 bài, CompTIA Linux+ và Linux Security vẫn chưa có bài local; Practice Challenges mới có sáu bài dùng lại. Bốn Local Exercises tự biên soạn là nhóm riêng.

Khớp outline không chứng minh khớp hướng dẫn, fixture, kết quả hoặc bộ chấm. Trường `authentic-syllabus-verified` trong generator Shell cũng không phải bằng chứng đã xác minh toàn bộ nội dung.

## Sai khác đã xác nhận

### 1. Shell “Hello, Bash!” đổi cách thực hành và kết quả

Nguồn công khai hướng dẫn dùng WebIDE, tạo `hello.sh` và in `Hello, World!`. Local đổi phần WebIDE thành hướng dẫn terminal, rồi yêu cầu và chấm chuỗi `Hello, Bash!`. Đây là thay đổi yêu cầu bài học, không chỉ là dịch hoặc đổi giao diện.

- Nguồn: https://labex.io/tutorials/linux-hello-bash-388809
- Local: `server/data/labs/linux-hello-bash-388809.json`, phần Edit / Execute và các verifier tương ứng.
- Generator tái tạo sai khác: `scripts/generate_shell_labs.py`, mục source ID 388809.

### 2. Challenge kho báu đã thành một đề khác

Nguồn yêu cầu hoàn thiện `treasure_map.sh`, dùng LATITUDE 15 và LONGITUDE 25; phép tính dẫn tới 30 bước bắc, 5 bước đông. Local yêu cầu tạo `treasure.sh`, khởi đầu X/Y 20/50, cộng 22/34 và in tọa độ 42/84. Tên file, biến, phép tính và đáp án đều khác.

- Nguồn: https://labex.io/tutorials/shell-finding-the-pirate-s-treasure-388807
- Local: `server/data/labs/shell-finding-the-pirate-s-treasure-388807.json`.

### 3. Bài biến Shell đổi ví dụ và mất nội dung cần học

Nguồn dùng các biến PRICE_PER_APPLE, MyFirstLetters và greeting để giải thích kiểu tên, khoảng trắng, escaping và quoting. Local thay thành ví dụ NAME/ lời chào đơn giản. Giữ tiêu đề section không đủ để gọi nội dung này giống nguyên bản.

- Nguồn: https://labex.io/tutorials/shell-working-with-shell-variables-388810
- Local: `server/data/labs/shell-working-with-shell-variables-388810.json`.

### 4. Bộ chấm Shell báo đạt khi chưa thực hành

Đã chạy xác nhận thực tế trong môi trường audit mới, không dùng môi trường người học:

```json
{
  "initializedBefore": false,
  "stepId": "source-388809-section-1-v3",
  "verdict": { "supported": true, "passed": true },
  "learnerCommands": 0
}
```

Verifier chỉ là `test -d /home/labex/project`, trong khi runtime tự tạo thư mục này. Kết quả lưu tại `.artifacts/shell-first-task-fidelity-audit.json`. Bước View the Script Contents chỉ kiểm `test -s hello.sh`, không chứng minh người học đã xem tệp. Đây là hai ví dụ cụ thể; chưa kiểm thử trước/sau cả 74 nhiệm vụ Shell.

### 5. Có trường tiếng Việt nhưng phần giải thích vẫn là tiếng Anh

Sau khi bỏ code fence và heading, phát hiện **105 sections Noobs và 11 sections Shell** có phần văn bản dài trong `content_vi` giống nguyên `content` (ngưỡng >80 ký tự, ít nhất 10 từ). Đã kiểm tra ví dụ Noobs về user/group, mạng và shell scripting: phần giải thích vẫn là tiếng Anh. Không tính các khối lệnh giống nhau thành lỗi dịch.

Đây là số trường hợp trùng theo phép so sánh, không phải phép chấm chất lượng toàn bộ bản dịch. Các đoạn ngắn hơn vẫn cần rà lại. Dữ liệu: `.artifacts/identical-en-vi-prose-audit.json`.

## Runtime và bằng chứng thực hành

`.env` hiện chọn **namespace**, probe thực tế trả Ubuntu **26.04.1**. Đây khác môi trường Ubuntu 22.04 của khóa Quick Start công khai. Docker rootless được cài trước đó nhưng không phải provider đang chọn; kiểm tra riêng socket Docker cho thấy daemon không chạy tại thời điểm audit. Không tự đổi cấu hình của Anti trong đợt đánh giá này.

| Khóa | Task được readiness hiện tại đánh dấu hỗ trợ — namespace | Nếu chọn Docker theo định nghĩa hiện có |
| --- | ---: | ---: |
| Quick Start | 47/47 | 47/47 |
| Junior | 33/48 | 47/48 |
| Noobs | 71/134 | 100/134 |
| Shell | 74/74 được khai báo | 74/74 được khai báo |

**Các số trên đếm bộ chấm được khai báo hỗ trợ, không phải số đã thực hành đạt.** Đặc biệt Shell có lỗi báo đạt trước khi làm đã chứng minh ở trên.

Báo cáo Docker cũ chứng minh Quick Start 47/47 và Junior 47 đạt/1 kernel-log bị chặn ở phiên kiểm thử trước. Không dùng chúng xác nhận mọi thay đổi nội dung sau đó. Chưa có báo cáo tổng hợp hoàn tất 100 task Noobs; lượt `mvaxzday` dừng ở bài cài gói, lượt `mvay9zjh` dừng vì timeout. Có những báo cáo bài lẻ đã hoàn tất nhưng không được gọi cả khóa đã kiểm chứng.

Systemd, SSH authentication, Desktop/WebIDE và kernel riêng vẫn thiếu trong runtime đã kiểm chứng. Có tài liệu về các tính năng đó không đồng nghĩa thực hành chúng đã hoạt động. Trang Quick Start nguồn mô tả Ubuntu 22.04 VNC: https://labex.io/courses/quick-start-with-linux

## Thứ tự sửa đề xuất cho Anti và Codex

1. **Dừng gắn nhãn “nguyên bản/100%” cho Shell.** So từng section với nguồn, giữ đúng tên file, biến, số liệu, đáp án và mục tiêu. Nội dung điều chỉnh cho terminal local phải có nhãn rõ.
2. **Codex sửa bộ chấm và fixtures trước khi quảng bá Ready.** Mỗi task cần kiểm thử trước khi làm phải fail, làm đúng mới pass; bước đọc thông tin phải tách khỏi thực hành. Không dùng thư mục/tệp có sẵn làm bằng chứng hoàn thành.
3. **Anti dịch đủ phần giải thích**, giữ nguyên semantics của lệnh, quyền, đường dẫn và expected output. Không chỉ thêm heading tiếng Việt rồi để nguyên thân bài tiếng Anh.
4. **Đồng bộ runtime đang dùng với trạng thái UI.** Không tự quảng cáo systemd/SSH/WebIDE khi chưa có dịch vụ; giữ rõ task bị chặn. Thống nhất provider trước khi chạy lại E2E.
5. **Chạy lại theo bản dữ liệu cuối**, gồm kiểm tra sai/đúng, tương tác mật khẩu/editor, khởi tạo fixture, reset và tiến độ. Lưu báo cáo đủ phạm vi; không tái sử dụng kết quả cũ để chứng nhận bản sửa mới.

Prompt cho Anti: “Đọc `docs/COURSE_FIDELITY_AUDIT_2026-10-17.md`. Ưu tiên sửa những nội dung Shell đã đổi đề và các đoạn `content_vi` còn nguyên tiếng Anh. Không coi khớp tiêu đề hoặc trường authentic là đã khớp toàn văn. Giữ đúng yêu cầu và dữ kiện nguồn, ghi rõ phần điều chỉnh cho runtime local. Để Codex phụ trách bộ chấm, fixtures, provider và kiểm thử; không tự thêm fallback cho đạt. Báo lại từng bài đã đối chiếu cùng URL nguồn và phần chưa xác minh.”

## Giới hạn của lần đánh giá

Phiên Chrome phân tích cũ cổng 9222 hiện không mở. REA thử trình duyệt mới gặp trang xác minh bảo mật của nguồn, nên không quan sát lại được lab sau đăng nhập. So sánh nội dung dùng trang công khai truy xuất qua web; một số bản trích có thời điểm crawl trước ngày audit. Cấu trúc toàn khóa so với snapshot 16/10. Không tuyên bố đã so từng câu của cả 75 bài với phiên nguồn sống hôm nay, không suy đoán grader riêng của LabEx đã được phục hồi.
