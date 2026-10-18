# Linux Commands Practice Online — triển khai local

Trước đợt này, khóa chỉ có metadata và outline của 41 bài; chưa có hướng dẫn, fixture và bộ chấm local. Bốn Local Exercises là nhóm tự biên soạn khác, không phải phiên bản đã nhập của khóa này.

## Phần đã triển khai

- Đủ **41 bài / 263 section / 181 nhiệm vụ** theo snapshot cấu trúc REA: 31 guided lab, 10 challenge, đúng thứ tự và tiêu đề nguồn.
- Hướng dẫn Anh/Việt cho toàn bộ 263 section; guided lab có ví dụ lệnh, challenge trình bày yêu cầu và giữ lời giải kiểm thử ngoài phần người học đọc.
- Dữ liệu riêng theo bài và các bộ kiểm tra kết quả tệp/thư mục/quyền/hành vi hoặc lệnh đã thực sự hoàn tất. Không dùng xác nhận đã đọc để thay thế thực hành.
- Course detail, roadmap, nút mở bài và cấu trúc nguồn dùng dữ liệu thật từ API; số local không còn là 0 và không dẫn sang nhóm bốn bài khác.

Nguồn chính: [trang khóa học](https://labex.io/courses/linux-basic-commands-practice-online). Đã đối chiếu 41 trang bài công khai; liên kết và giới hạn từng nhóm nằm trong [file system](COMMANDS_FILES_SOURCE_REVIEW.md), [đọc/tìm tệp](COMMANDS_CONTENT_SOURCE_REVIEW.md), [text/system](COMMANDS_TEXT_SOURCE_REVIEW_2026-10-17.md).

Phiên REA mới gặp Cloudflare và endpoint Chrome cũ không kết nối được. Evidence `ev_165e4edc56c503e3400e89bbd970a4bd9cf655cfc0fb4bb81cda9e0cd4d6853c` chỉ chứng minh trạng thái xác minh đó, không phải toàn văn khóa học. Cấu trúc được đối chiếu snapshot REA đã lưu tại `server/data/reference/linux-section-outlines.json`; yêu cầu thực hành bổ sung từ các trang công khai đọc được. Không mở thêm VM, xoay tài khoản hay vượt xác minh.

**Đây là bản triển khai yêu cầu chức năng bằng hướng dẫn và grader local**, không phải toàn văn sao chép hoặc bộ chấm kín của LabEx. Nội dung starter chưa công khai được dựng lại theo đường dẫn và yêu cầu bài; vì vậy số dòng log, ngày giờ, dung lượng và kết quả ví dụ có thể khác hình nguồn. Các thông số phụ thuộc môi trường dùng số liệu thật, không dựng đầu ra giả.

## Runtime

Khóa dùng image riêng `labex-local/commands-ubuntu22:1`, dẫn xuất từ base Ubuntu 22.04 hiện có. Đã cài thật cowsay, tree, gcc, libc6-dev, alias python và tài liệu SSH. Base image không thêm các package này, để không phá trạng thái đầu bài APT của Noobs. Dữ liệu/container đang học không bị reset.

Manifest chỉ được chọn image bổ sung đã cho phép; không nhận tên image từ trình duyệt. Fixture có symlink rõ ràng và script `/usr/local/bin/prioritydemo` trong container riêng. Namespace giữ giới hạn ghi cũ; khóa này được khai báo cần runtime Docker đã kiểm tra.

Bằng chứng chuẩn bị image: `.artifacts/commands-runtime-build-proof.json`. Script C thật biên dịch/chạy được; cowsay/tree và trang man SSH là package thật. Kiểm tra từ chối image lạ và giữ nguyên base layers có trong proof runtime.

Nếu cần dựng lại image trên máy này, chạy bằng tài khoản WSL thường sở hữu engine: `python3 /mnt/d/Project/LabEx/scripts/build-commands-image.py`. Script build base rồi variant từ Dockerfile, không xóa/reset container hiện có. Máy này đã build xong; không cần chạy lại để học.

## Sửa bộ chấm chung

Các bài mở lại cùng lệnh pager cần một lần thao tác mới cho từng bước. Bộ chấm hiện xét cả các nhóm lịch sử nằm trong rule kết hợp, khớp nhiều nhóm trên các lệnh hoàn tất riêng và giữ ngữ cảnh bước khi đi vào rule lồng nhau. Một lần kiểm tra dùng một snapshot lịch sử nhất quán. Không bắt người học hoàn thành mọi bước trước mới được làm bước sau.

Test runner đã được chỉnh để truyền cùng stepIndex/allSteps như API thật. Các lượt cũ thiếu ngữ cảnh được giữ như kết quả từng phần, không dùng thay bằng chứng cuối của khóa mới.

Lịch sử hoàn tất chứng minh đã mở/thoát pager hoặc top và dùng tùy chọn yêu cầu; chưa ghi riêng mọi phím bấm bên trong các chương trình đó. Những điều chỉnh tương thích như top -o %MEM thay M, sắp xếp trước join và Bash thay Zsh được ghi trong tài liệu đối chiếu.

## Kiểm chứng

Chốt kết quả ngày **18/10/2026**:

- **41/41 bài, 181/181 nhiệm vụ đạt** sau thao tác PTY thực; cả 181 đều chưa đạt trước khi làm, không có bước bị chặn trong khóa này. Báo cáo: `.artifacts/docker-commands-coverage.json`.
- Báo cáo tổng hợp chỉ nhận những bài có đủ mọi nhiệm vụ từ từng lượt chạy. Đây không phải một lượt liên tục: hai lượt dừng ở challenge tìm /etc và time/find vì test runner chưa cho phép mã thoát 1 do thiếu quyền; các bài trước đã thực hành trọn vẹn được giữ, còn hai bài đó có lượt chạy mới đầy đủ. Hai lượt dừng không được nhận là đã có kiểm tra tài khoản host cuối lượt.
- Các báo cáo API-context cuối dùng: files `mvcjgry0` (45), cat/more `mvcjj861` (10), phần đọc/tìm `mvcjd14h` (38 nhiệm vụ thuộc chín bài hoàn chỉnh), challenge cuối `mvcjpfqj` (1), text/system `mvcjgo2y` (84 thuộc 18 bài hoàn chỉnh; hai task của bài time dở dang không được lấy), time `mvcju886` (3).
- **29/29 test Node đạt** trong cấu hình Docker; khớp 41 outline, 263 mục dịch và 181 task ID; cú pháp Bash toàn bộ catalog đạt.
- **15/15 nhóm kiểm tra Chrome đạt**, gồm 41 nút mở bài local, outline, điều hướng, responsive và giữ shell. Ảnh: `.artifacts/commands-course-imported-ui.png`; báo cáo: `.artifacts/workspace-ui-regression.json`. Các ca lỗi/reset FE dùng HTTP fixture riêng như mô tả trong mã kiểm thử.
- Hồi quy hai khóa cũ: Quick Start bài đầu **5/5**, Noobs APT **5/5**, đều có kiểm tra trước khi làm; dữ liệu package đầu bài Noobs không bị image Commands làm thay đổi.

Tái tạo dữ liệu: `python scripts/generate_commands_course.py`. Kịch bản đầy đủ: `tests/scenarios/linux-commands-course.json`, ba nhóm files/content/text. Các bài thử dùng ID `source-smoke-...` và container riêng; không dùng công việc của người học làm bằng chứng.
