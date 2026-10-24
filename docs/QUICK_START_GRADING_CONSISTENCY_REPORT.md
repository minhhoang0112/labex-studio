# Đối chiếu hướng dẫn và bộ chấm Quick Start

Ngày sửa: 2026-10-24.

## Lỗi xác nhận

- `linux-the-manuscript-mystery`: bản dịch yêu cầu `head -n 3`/`tail -n 3`, nhưng yêu cầu tiếng Anh đã lưu từ nguồn là 2 dòng đầu bản v2 và 1 dòng cuối cả hai bản.
- Ví dụ tiếng Việt có câu “The old grandfather clock…” không có trong fixture local.
- `sections` và `steps` giữ hai bản dịch khác nhau: phần đọc và hộp nhiệm vụ/gợi ý vì thế có thể nhắc tên `manuscript_v1.txt` và `manuscript_page_v1.txt` trong cùng một bước.
- Hai script dịch cũ có thể ghi lại dữ liệu lệch nếu chạy lại.
- Kết quả kiểm tra dạng `all` làm mất thông báo lỗi của kiểm tra con được hỗ trợ nhưng không đạt.

## Đã sửa

- Bản dịch, ví dụ, tên tệp, số dòng của bài bản thảo khớp yêu cầu nguồn và fixture đang được khởi tạo. Không sửa dữ liệu trong container học viên.
- Bộ chấm nhận `cat -n`, đọc gộp hai tệp, `head -n2`, `--lines=2`, `tail -n1` và thứ tự hai tệp của tail; vẫn kiểm tra exit status, đúng số dòng, cả hai tệp và nội dung không bị sửa.
- `diff -u`/`--unified` cũng hợp lệ; exit 1 nghĩa là có khác biệt, exit 2 vẫn không đạt.
- Đồng bộ các bản task của cả 10 bài Quick Start trong JSON. Giữ nguyên ID bài/bước.
- Catalog ghép phần giải thích từ `sections` và nhiệm vụ/gợi ý/bộ chấm từ `steps` thành cùng một hợp đồng khi trả cả hai view. Các bộ chấm được nâng cấp trong `steps` không bị thay bằng bản cũ trong `sections`.
- Hai script dịch cũ tự gọi `scripts/repair-quick-start-consistency.py` sau khi chạy. Script sửa chạy lặp lại không thay đổi thêm dữ liệu.
- Thông báo lỗi từ kiểm tra con được giữ lại khi tổng hợp kết quả.

## Kiểm tra tái hiện

```powershell
rtk proxy node --test tests/quickStartConsistency.test.js tests/verification.test.js
rtk npm test
rtk proxy node tests/source-course.smoke.mjs tests/scenarios/source-course.json --provider=docker
```

Kiểm thử mới kiểm tra cả hai view của toàn catalog, fixture/ví dụ, lời giải hợp lệ và các trường hợp sai số dòng, thiếu một tệp tail, lệnh thất bại, lệnh echo giả, fixture bị sửa, diff exit 2. Integration tạo các ID container kiểm thử riêng, không reset bài đang học. Kết quả thực thi nằm ở `.artifacts/source-course-smoke-<run>.json`.

Kết quả lượt sửa này:

- `npm test`: **105/105 đạt**.
- Docker/PTY thật: **10 bài, 47 bước đạt**, cùng **47 kiểm tra trước khi làm bài đều từ chối đạt**. Đây là số bước của scenario, bao gồm bước xác nhận thông tin, không phải 47 bài học.
- Báo cáo: `.artifacts/source-course-smoke-mvm2zg9m.json`, tiến trình kết thúc exit 0; dùng ID môi trường kiểm thử riêng.
- Backend đã khởi động lại. GET `/api/labs/linux-the-manuscript-mystery` trên cổng 5000 xác nhận hướng dẫn/gợi ý/trạng thái chấm ở hai view khớp nhau; không còn tên `manuscript_page_*` hay ví dụ grandfather clock cũ.

## Giới hạn cần hiểu đúng

Đồng nhất hai view không chứng minh mọi giải thích/bộ chấm trong tất cả khóa đều đúng về ngữ nghĩa. Lượt này kiểm tra sâu Quick Start, đặc biệt lỗi người học báo ở bài bản thảo. Các bản nâng cấp bộ chấm ở khóa khác từng chỉ được ghi vào `steps`; catalog nay trả cùng quy tắc ở cả hai view, nhưng vẫn cần đối chiếu riêng tài liệu–fixture–lời giải khi kiểm toán từng khóa.

Toàn bộ byte bản thảo gốc chưa được thu thập: fixture ghi rõ dòng 1 và 3 do local biên soạn; chỉ câu thay đổi ở dòng 2 được xác nhận nguồn. Không được gọi đây là bản sao nội dung 100% của VM LabEx.

Khi cập nhật bài: sửa `sections` và `steps` đồng thời, chạy script sửa sau script dịch cũ, rồi chạy test. Thay số dòng/tên tệp phải cập nhật bản dịch, fixture, bộ chấm và scenario cùng nhau. Không giải quyết lệch dữ liệu bằng cách bỏ kiểm tra hoặc tự cho đạt.
