# Danh sách dọn dẹp chờ duyệt — 19/10/2026

Chỉ kiểm tra và lập danh sách; chưa xóa, di chuyển, nén hay thay cấu hình. Dung lượng là kích thước file quy đổi MiB, không phải dung lượng cấp phát thực tế trên ổ đĩa. Các số có thể thay đổi khi Chrome/dev server ghi cache. Chưa quét hoặc dọn ổ đĩa WSL/Docker bên ngoài thư mục dự án.

## Dung lượng hiện tại

| Mục | MiB | Nhận xét |
| --- | ---: | --- |
| `.tools/azure-cli` | 636,26 | CLI đang được cấu hình cho xác thực Azure; giữ |
| `.artifacts` | 387,50 | Chứa cache nhưng cũng có phiên đăng nhập, dữ liệu sửa bộ chấm, PID và log |
| `client` | 135,35 | Trong đó `node_modules` 132,52; `dist` 1,73 |
| `node_modules` ở gốc | 116,14 | Phụ thuộc backend, terminal, Azure, RDP; giữ |
| `server` | 10,27 | Nội dung lab, môi trường thực hành và backend; giữ |
| `.git` | 7,03 | Lịch sử mã nguồn; giữ |
| `scripts` | 1,47 | Công cụ tạo nội dung, khởi động và kiểm tra; giữ mã script |
| `tests` | 0,43 | Giữ |
| `docs` | 0,15 | Giữ |

Tổng khoảng **1.294,7 MiB (~1,26 GiB)** trước khi thêm báo cáo nhỏ này.

## A. File đầu ra không được giao diện/backend sử dụng — khoảng 2,53 MiB

### Ảnh kiểm tra: khoảng 2,47 MiB

Các ảnh này là kết quả chụp kiểm tra; không phải ảnh hướng dẫn trong bài học. Xóa sẽ mất bằng chứng kiểm tra cũ. Script chụp ảnh còn được giữ để có thể chụp lại.

- 8 ảnh trong `scripts`: `lab2_failed_when_not_done.png`, `lab2_vietnamese_rendered.png`, `lab4_authentic_vietnamese.png`, `lab5_rendered_cat_tmp_hello.png`, `lab7_rendered.png`, `lab7_sec1_1440.png`, `lab7_sec1_rendered.png`, `lab9_rendered.png`.
- Các file `.png` nằm **trực tiếp** trong `.artifacts` (không bao gồm thư mục con): ảnh cloud desktop, desktop expanded/fullscreen, ảnh Labby, ảnh workspace theo kích thước, ảnh khóa commands và ảnh kiểm tra hướng dẫn Windows.
- **Giữ toàn bộ `client/public/guides` và ảnh trong `client/dist/guides`**: đây là ảnh bài học đang được phục vụ.

### Ba kết quả trích xuất thử: khoảng 0,055 MiB

- `scripts/last_tutorial_raw.txt`: 10,61 KiB.
- `scripts/parsed_sections.json`: 33,45 KiB.
- `scripts/test_converted_sections.json`: 12,02 KiB.

Tìm kiếm trong `scripts`, `tests`, `server` chỉ thấy script ghi các file này, chưa thấy nơi đọc. Không coi đây là bằng chứng tuyệt đối rằng mọi quy trình bên ngoài đều không cần chúng; giữ nếu còn muốn đối chiếu mẫu trích xuất cũ.

## B. Cache có thể tạo lại — khoảng 92,72 MiB

Không thay mã hoặc dữ liệu bài học, nhưng lần chạy kế tiếp có thể chậm hơn do tạo lại cache. Chỉ dọn khi tiến trình liên quan đã đóng; lần kiểm tra này chưa xác nhận trạng thái Chrome vì truy vấn process bị giới hạn quyền.

| Đường dẫn tương đối | MiB | Điều kiện |
| --- | ---: | --- |
| `client/node_modules/.vite` | 10,37 | Dừng Vite dev server trước; Vite tạo lại cache khi chạy |
| `scripts/__pycache__` | ~0,381 | Không chạy script Python liên quan khi dọn |
| `server/pty/__pycache__` | ~0,097 | Không dọn giữa lúc mở terminal lab |
| `server/runtime/docker/__pycache__` | ~0,007 | Không chạy bootstrap Docker khi dọn |
| `.artifacts/reference-browser-profile/Default/Cache` | 38,67 | Đóng Chrome dùng profile phân tích trước |
| `.artifacts/reference-browser-profile/Default/Code Cache` | 34,88 | Như trên |
| `.artifacts/reference-browser-profile/Default/GPUCache` | 1,57 | Như trên |
| `.artifacts/reference-browser-profile/GrShaderCache` | 5,15 | Như trên |
| `.artifacts/reference-browser-profile/ShaderCache` | 0,53 | Như trên |
| `.artifacts/reference-browser-profile/Default/DawnGraphiteCache` | 0,53 | Như trên |
| `.artifacts/reference-browser-profile/Default/DawnWebGPUCache` | 0,53 | Như trên |

Không đụng cookie, IndexedDB, Local Storage, Service Worker, extensions, dữ liệu đăng nhập, lịch sử hoặc toàn bộ Chrome profile. Cache Chrome có thể tự tăng trở lại sau khi sử dụng.

## C. Cần giữ, không đưa vào đợt dọn này

- **Không xóa toàn bộ `.artifacts`**: `scripts/server-daemon.mjs` đang dùng `server.pid`, `server.stdout.log`, `server.stderr.log`. Log hiện chỉ khoảng 0,005 MiB, không đáng để can thiệp tiến trình đang chạy.
- **`.artifacts/reviewed-regeneration-stage` (~4,75 MiB)**: `scripts/repair-reviewed-grading.py` đọc dữ liệu baseline trong đây. Đây không chỉ là bản sao lưu dư thừa.
- Các thư mục backup/đối chiếu khoảng **10,55 MiB tổng cộng** (bao gồm stage trên): `grading-before-repair-2026-10-19`, `junior-before-audit`, `noobs-before-backend-audit`, `quick-regeneration-bn3yc2wt`, `quick-start-before-parity`, `reviewed-regeneration-stage`, `shell-before-fidelity-fix`, `windows-before-illustrations`, `windows-before-real-screenshots`. Giữ để phục hồi/đối chiếu nội dung và bộ chấm; không cộng lại dung lượng các thư mục này vào nhóm A/B.
- **`.tools/azure-cli`**: `server/services/cloudConfig.js` thêm thư mục Scripts vào PATH; `azureComputeClient.js` dùng `AzureCliCredential`; `scripts/azure-login.ps1` gọi Python tại đây. Xóa CLI có thể làm máy ảo mất khả năng xác thực/quản lý.
- **Khoảng 297 MiB `__pycache__` bên trong Azure CLI** là bytecode Python có thể tạo lại, nhưng không đề xuất đụng vào bộ công cụ đang phục vụ Azure trong đợt cần giữ nguyên trải nghiệm này. Dọn có thể làm CLI chậm lần đầu và cache sẽ phát sinh lại.
- **Hai `node_modules`** phục vụ hai ứng dụng khác nhau, không phải hai bản sao thừa. Không xóa thư viện, binary, sourcemap hoặc prebuild riêng lẻ chỉ vì lớn.
- **`client/dist`**: `server/server.js` trực tiếp phục vụ bản build này. Xóa có thể khiến web không truy cập được.
- **`.env`, `.git`, các file package/lock, `run.bat`, cấu hình, mã nguồn, tests, docs, toàn bộ dữ liệu khóa/lab và ảnh hướng dẫn**: giữ.
- Những script cũ `check_*`, `inspect_*`, `translate_*`, `generate_*` không được kết luận là vô dụng chỉ từ tên hoặc tuổi file; dung lượng nhỏ và vẫn có giá trị kiểm tra/tạo lại dữ liệu.

## Đề xuất quyết định

- Nếu muốn tránh thay đổi cả thời gian tải/tạo cache: chỉ xem xét nhóm A, chấp nhận mất ảnh/bản trích xuất thử cũ; tiết kiệm khoảng **2,53 MiB**.
- Nếu chấp nhận tạo lại cache và đóng tiến trình liên quan: nhóm A+B tiết kiệm khoảng **95 MiB**. Không cần thay cấu hình ứng dụng hoặc cài lại dependency.
- Phần lớn dung lượng thuộc công cụ và thư viện đang dùng; không thể giảm mạnh mà vẫn cam kết không ảnh hưởng bất kỳ trải nghiệm nào.

Trước khi xóa sau khi được duyệt cần đo lại, xác nhận từng đường dẫn tuyệt đối vẫn nằm trong `D:\Project\LabEx`, kiểm tra tiến trình liên quan và chỉ tác động đúng danh sách được duyệt.
