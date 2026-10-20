# Sửa trạng thái khóa học và đối chiếu tài liệu — 20/10/2026

## Vì sao màu vàng quay lại

Lịch sử Git cho thấy `bf2e290` và `c59618d` từng thêm sẵn các capability APT, Docker, cron, firewall, network… vào bộ capability chung để khôi phục nhãn xanh. Thay đổi đó không cung cấp systemd PID 1, block device, SSH fixture hoặc bộ chấm cho từng bài. Bản `88ce018` đưa kiểm tra capability trở lại giới hạn môi trường thực, nên các bài còn thiếu thành partial/blocked.

Đợt kiểm tra tổng thể ngay trước lần sửa này chỉ tạo báo cáo, không đổi mã sản phẩm. Màu vàng là kết quả readiness tính từ mã/dữ liệu đang có, không phải tài liệu tự biến mất sau kiểm tra.

## Đã sửa

1. Tách thông tin **bài đã nhập**, **bản gốc EN đã đối chiếu**, **bài mở terminal** và **bài có đủ bộ chấm**. Card khóa học không còn dùng một nhãn vàng chung để đại diện đồng thời cả bốn việc. Màu xanh xác nhận bản gốc chỉ xuất hiện khi toàn bộ bài của khóa đã có nguồn đối chiếu; không đồng nghĩa mọi bài đã được chấm thực tế.
2. Tách quyền mở terminal Linux khỏi việc đã có grader. Tất cả bài Linux đã nhập có thể mở shell riêng để gõ lệnh, kể cả khi chưa có kiểm tra tự động. Không thêm Docker lồng, systemd, kernel log hay thiết bị host vào container. Nhiệm vụ chưa hỗ trợ vẫn không được báo đạt.
3. Lưu **144 bản gốc tiếng Anh đầy đủ** ở `server/data/reference/source-lessons`. Backend ghép tài liệu gốc vào bài theo source ID và outline, giữ nguyên ID nhiệm vụ, grader, fixture và bản dịch local. Những script sinh lại JSON lab không còn thay thế được nội dung gốc đang phục vụ khi outline còn khớp. Hash kiểm tra file nguồn và test đối chiếu từng section bảo vệ tính nhất quán của snapshot; không tuyên bố file không thể bị người khác sửa.
4. Khôi phục những đoạn giải thích Shell bị rút ngắn, ảnh hướng dẫn và bảng Markdown bị flatten. Có nút **Bản gốc EN / Bản dịch VI**. Nếu bản dịch chưa theo kịp nội dung gốc mới được bổ sung, mặc định đọc EN và báo rõ trạng thái bản dịch. Không gọi bản dịch là giống nguyên văn 100%.
5. Bổ sung 7 bài tài liệu gốc thuộc Linux Security for DevSecOps; giữ grader ở trạng thái chưa hỗ trợ cho đến khi có fixture và kiểm tra thực tế.
6. Triển khai và kiểm chứng bộ chấm Docker cho 10 nhiệm vụ thuộc hai bài CompTIA: `comptia-navigate-the-filesystem-in-linux-590971`, `comptia-search-text-with-grep-in-linux-590841`. Chỉ chấp nhận các lệnh thực hiện thành công đúng yêu cầu, có ranh giới lịch sử giữa các bước và thêm kiểm tra file cho nhiệm vụ tạo file.
7. Thay 210 placeholder bằng trạng thái unsupported rõ ràng, giữ toàn bộ tài liệu. Chặn riêng lỗi Junior cho phép đạt nhiệm vụ kernel log bằng file rỗng. Việc này sửa lỗi chấm sai; không được thay bằng việc ép readiness thành xanh.
8. Sửa URL nguồn của Challenge về `/labs/...`; không phải Challenge nào cũng có trang `/tutorials/...` công khai.

## Mức độ đối chiếu hiện tại

| Khóa học | Bài nguồn | Bài local | Bản gốc EN đầy đủ đã đối chiếu | Mở terminal | Có đủ bộ chấm theo metadata |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quick Start with Linux | 10 | 10 | 10 | 10 | 10 |
| Linux for Noobs | 37 | 37 | 23 | 37 | 32 |
| Linux Commands Practice Online | 41 | 41 | 41 | 41 | 41 |
| Shell for Beginners | 18 | 18 | 15 | 18 | 18 |
| Become a Junior System Administrator | 10 | 10 | 5 | 10 | 9 |
| CompTIA Linux+ | 33 | 33 | 33 | 33 | 2 |
| Linux Security for DevSecOps | 20 | 7 | 7 | 7 | 0 |
| Linux Practice Challenges | 156 | 33 | 13 | 33 | 4 |

Một số bài được tái sử dụng giữa khóa, nên tổng cột EN không bằng số file nguồn duy nhất. Có **319 bài nguồn duy nhất / 325 mục syllabus**. Đã thu được đầy đủ 144 bài; 175 bài chưa có toàn bộ text từ phiên hiện tại. Tổng dữ liệu local hiện có **206 lab** kể cả Windows và các bài local ngoài tám khóa này.

Các con số bộ chấm là khả năng khai báo của từng bài, không chứng nhận đã chạy toàn bộ nhiệm vụ của mọi khóa. Trong lượt này chỉ hai bài CompTIA mới được chạy thực tế từ trạng thái chưa làm tới hoàn thành; các khóa khác được kiểm tra hồi quy ở mức unit/API/UI theo bằng chứng ghi dưới đây.

## Giới hạn truy cập đã xác nhận bằng REA

- Browser public headless gặp Cloudflare: `ev_637f5dc3fb2c3f6b7a20c2f6e081ea7d40f70a815d17b98b62694b6ca0fdbea6`.
- Phiên Chrome đã đăng nhập quan sát được API `/api/v2/lab/17987/steps?lang=en` trên trang Challenge; có tài liệu đầy đủ mà không cần bật VM: `ev_69e58eff9faedb7c53b39c9478c84a93c180d229c01aad512a3ff28a1a1365af`.
- Với ví dụ The Process Overseer, API phiên hiện tại trả Introduction nhưng text các bước sau trống. Một thao tác Continue thông thường, không bấm Start Lab, hiển thị thông báo bài dành riêng cho LabEx Pro. REA xác nhận màn hình đó: `ev_64e48543b78f77d4ad9895c843e4d203279b5cc2816bfe7302911bd2b3ba5b5b`.
- Không xuất cookie/token, không luân phiên tài khoản, không yêu cầu solution/hidden grader và không vượt quyền truy cập. Không khởi chạy VM LabEx hoặc Azure để thu thập tài liệu.
- Do đó **chưa thể cam kết toàn bộ dự án giống LabEx 100%**. 144 snapshot xác nhận nội dung EN theo thời điểm truy cập; các bản dịch, image VM, WebIDE/Desktop và grader riêng không có cùng mức chứng minh.

## Kiểm chứng

- `rtk proxy npm test`: **46/46 qua**, gồm hồi quy bảo vệ nội dung gốc khi generator viết bản rút gọn, giữ nguyên grader/ID, hiển thị alert an toàn và chặn tạo file rỗng để đạt bài kernel.
- `rtk proxy python -X utf8 server/data/generate_labs.py`: **206 lab hợp lệ**, không còn 298 lỗi placeholder trước đó.
- `rtk proxy node tests/source-course.smoke.mjs tests/scenarios/comptia-foundations.json --provider=docker`: **10/10 nhiệm vụ đạt sau khi thực hiện, 10/10 kiểm tra trước khi làm không đạt**, trong hai container ID kiểm thử riêng. Báo cáo `.artifacts/source-course-smoke-mvg9ccmw.json`.
- `rtk proxy node scripts/check-source-content-ui.mjs`: **6 nhóm qua**, 390/1440px không tràn ngang; nhãn nguồn đúng, bảng thật, giải thích đầy đủ, chuyển EN/VI, ảnh nguồn tải/giải mã được và bài mới không bị gắn nhãn bản dịch sai. Báo cáo `.artifacts/source-content-ui-check.json`.
- Client build thành công. Lint mã 0, còn các cảnh báo effect/import cũ không thuộc sửa lần này. Vite vẫn cảnh báo bundle lớn.
- Backend đã khởi động lại để dùng mã mới. Không reset container/bài học người dùng, không xóa tiến độ và không thay trạng thái Azure VM.

## Công cụ cập nhật về sau

- `scripts/check-source-lessons.mjs`: đối chiếu API công khai. `--browser --resume` đọc các bước qua phiên Chrome đã đăng nhập, sử dụng đúng API quan sát được từ trang; không xuất thông tin đăng nhập, không bấm Start Lab. Bước trống không được tính là nội dung đã nhập.
- `scripts/import-reviewed-source-content.mjs`: cài các snapshot đã thu được; tạo bài đọc còn thiếu với grader unsupported, giữ dữ liệu thực hành hiện có; chạy lặp không tạo bản sao lab.
- `scripts/implement-comptia-foundations.mjs`: nguồn bộ chấm hai bài nền tảng đã review. Chỉ mở rộng sau khi đối chiếu yêu cầu và có kiểm tra âm/dương trong môi trường riêng.

Giữ thư mục `server/data/reference/source-lessons`: đây là dữ liệu bài học đang dùng, không phải cache có thể xóa trong lần dọn dự án.
