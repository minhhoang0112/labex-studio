# Sửa bộ chấm Linux for Noobs — 2026-10-24

## Lỗi được tái hiện

- Bài 1/ngày và lịch: bộ chấm dò `today.txt` ở home hoặc project, trong khi hướng dẫn lưu ở `project/first-commands`; đồng thời bỏ qua nội dung lịch và chỉ tìm một từ khóa lệnh.
- Image không có `cal`, Zsh, SSH hoặc fdisk theo các bài yêu cầu. `man` có tên lệnh nhưng thực ra là stub của Ubuntu minimized, không phải trình xem tài liệu.
- Một số bộ chấm chỉ dò `systemctl`, `ssh`, `curl`, `passwd` hoặc `PROJECT_DIR`, thậm chí chấp nhận exit code lỗi. Đây không phải bằng chứng hoàn thành nhiệm vụ.
- Bài 3/phím tắt: chưa có chứng cứ từ terminal nên chưa hỗ trợ chấm; chỉ tạo tệp đánh dấu không đủ.
- Cron yêu cầu một dòng chú thích do editor của script kiểm thử chèn vào, không có trong hướng dẫn. Khoảng trắng/chú thích không nên quyết định đúng sai lịch cron.
- Bộ chạy integration tự chèn printf giữa các lệnh, làm thay đổi `$?` trong bài tiến trình. Đã sửa công cụ kiểm thử giữ lại trạng thái thoát; không nới bộ chấm để chấp nhận `failure=0`.

## Đã triển khai

1. Sửa hợp đồng hướng dẫn–fixture–bộ chấm, giữ ID task và dữ liệu học viên. Bài 1 kiểm tra cả ISO date hợp lệ (cho phép lệch một ngày khi qua nửa đêm) và lịch đúng tháng tương ứng. Gợi ý báo cụ thể đường dẫn/tệp cần lưu.
2. Image riêng `labex-local/noobs-ubuntu22:1`: bổ sung ncal/Zsh/OpenSSH/fdisk và khôi phục man thật cùng man pages. Không thay image hoặc cấu hình của các khóa khác.
3. Bộ chấm Zsh chạy một phiên Zsh mới không thừa hưởng PROJECT_DIR; kiểm tra giá trị và kết quả được yêu cầu, không chỉ grep tên biến.
4. Mật khẩu khóa/mở, newgrp, tiến trình, cổng HTTP và chuyển tệp được kiểm tra bằng trạng thái thật và lịch sử hoàn tất khi cần.
5. Ghi nhận các phím Up/Tab/Ctrl+C/Ctrl+L/Ctrl+Z thực sự được chuyển tới server PTY; chỉ lưu tên phím và thời điểm, không lưu nội dung gõ hoặc mật khẩu. Kiểm tra kết hợp trạng thái tệp và lệnh hoàn tất. Chứng cứ phím ở RAM, cần thực hành lại phím sau khi backend khởi động lại; reset chỉ xóa chứng cứ của đúng bài.
6. SSH dùng sshd thật, host key tạo riêng cho mỗi container, chỉ lắng nghe loopback. Tài khoản remoteuser/opsuser, xác thực mật khẩu/public key và SCP được dựng đúng nội dung bài. Không mở cổng host, không chạm SSH của Windows/WSL host.
7. Cron bỏ qua chú thích và chuẩn hóa khoảng trắng; vẫn kiểm tra lịch đã cài bằng crontab thật. APT nhận cả apt/apt-get và tùy chọn -y có thể bỏ nếu học viên trả lời prompt.
8. Script sinh cũ `audit_noobs_labs.py` gọi bản sửa sau khi sinh để tránh ghi lại grader cũ.

## Phạm vi còn thiếu

134 nhiệm vụ, **122 định nghĩa chấm hỗ trợ Docker**, **12 nhiệm vụ còn cần môi trường phù hợp**. Số này là định nghĩa/khả năng runtime; bằng chứng chạy thực tế phải xem báo cáo integration bên dưới, không suy ra từ nhãn Ready.

| Bài | Bước chưa hỗ trợ | Lý do |
| --- | --- | --- |
| 14 — File System and Disk Management | 4, 6 | Mount ext4/loop và mount từ fstab cần VM/thiết bị riêng; không đưa thiết bị host vào container |
| 24 — System Information and Process Management | 7 | Không cấp đọc kernel log của host bằng CAP_SYSLOG |
| 28 — Managing Services and System Logs | 1–7 | Runtime có PID 1 tối giản, không có systemd/journal thật |
| 29 — Recover a Failed Service | 1 | Cần dịch vụ systemd lỗi thật rồi phục hồi |
| 31 — Correct a Service Bind Address | 1 | Bài yêu cầu sửa cấu hình và restart unit thật |

Các mục này không còn bị chấm đạt giả khi chỉ gõ một lệnh có từ khóa. Cần bổ sung Ubuntu Server VM biệt lập hoặc provider tương đương để hoàn thiện; lượt sửa này không tạo tài nguyên cloud tính phí và không đổi tài khoản hệ điều hành host.

## Môi trường đang học

`scripts/upgrade-noobs-environments.py` mặc định chỉ inventory; `--apply` cài công cụ thiếu vào container có cả label sở hữu và đúng lab ID/tên container. Không áp dụng lại fixture, không reset hay đổi tài khoản đang học. Chỉ xác nhận setup mới khi khác biệt đơn thuần là image/tool; các fixture thay đổi khác vẫn báo cần chuẩn bị lại rõ ràng.

Đã áp dụng cho 3 container hiện có của bài 1, 2 và 3; các tệp và tài khoản được giữ nguyên. SSH dùng fixture mới nên nếu từng mở bài đó trước đây thì cần reset có xác nhận (runtime lưu container cũ thành archive); không tự ghi đè tài khoản hay khóa người học.

## File và lệnh bảo trì

- Generator: `scripts/repair-noobs-grading.py`.
- Image: `server/runtime/docker/Noobs.Dockerfile`, `scripts/build-noobs-image.py` (chạy bằng user WSL sở hữu Docker rootless).
- Fixtures riêng: `server/data/environment-setups/docker/<lab-id>.json`.
- Evidence phím: `server/services/terminalEvidence.js`.
- Unit/regression: `tests/noobsGrading.test.js`.
- Integration: `tests/scenarios/linux-for-noobs-docker.json`; chạy `node tests/source-course.smoke.mjs tests/scenarios/linux-for-noobs-docker.json --provider=docker` hoặc chọn --from/--through/--only.
- Chỉ dùng ID `source-smoke-<run>-<n>` khi kiểm thử; không thực hiện lời giải/reset trên ID bài học viên.

Báo cáo kiểm thử thực tế lưu ở `.artifacts/source-course-smoke-*.json`. Chỉ tổng hợp bài có đủ kết quả mọi task (đạt hoặc blocked đúng dự kiến); không lấy vài dòng PASS rồi kết luận cả khóa đã xong. Thông tin tập hợp các lượt chạy cuối sẽ nằm ở `.artifacts/noobs-repair-coverage.json`.

## Kết quả thực thi cuối lượt sửa

- **37/37 bài đã được chạy kiểm tra**: 122 nhiệm vụ đạt sau thực hành, 122 kiểm tra trước thực hành đều từ chối đạt; 12 nhiệm vụ còn lại bị chặn đúng giới hạn môi trường.
- Đây là tổng hợp **các lượt chạy độc lập**, có bài được sửa rồi chạy lại; không mô tả thành một lượt chạy liên tục từ đầu đến cuối. Chỉ lấy bài có đủ kết quả mọi bước, bỏ phần bài còn dở trong báo cáo lỗi trước đó.
- Nguồn tập hợp: các run `mvmlvtis`, `mvmmca37`, `mvmm3owe`, `mvmmca74`, `mvmm8xm5`, `mvmmmx9f`; kiểm tra bằng `node scripts/summarize-noobs-repair.mjs --require-complete`.
- `npm test`: **119/119 đạt**, gồm các hồi quy trạng thái, chấm phím, chặn tự cho đạt, Zsh, cron và SSH.
- API đang chạy đã xác nhận bài 1 và bài 3 có đủ bộ chấm; khóa báo 122 nhiệm vụ được hỗ trợ. Backend đã khởi động lại, PID 29436 tại thời điểm kiểm tra.
- Các container thử được dừng sau khi chạy; hai container mở lại để chẩn đoán cũng đã được dừng. Không reset hoặc xóa container học viên.
