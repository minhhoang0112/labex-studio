# Azure VM, Desktop trong web và chấm Windows từ xa

Ngày triển khai: 19/10/2026. Phạm vi: ba nhiệm vụ trong `CODEX_BACKEND_HANDOVER.md`.

## Cách dùng

1. Mở `http://127.0.0.1:5000/labs/win-powershell-basics`, chọn một bước thực hành.
2. Bấm **Bật Máy Ảo**, đợi trạng thái từ Azure ARM chuyển sang `VM running`.
3. Trong **Windows Console**, bấm **Kết nối Desktop**. Desktop thật xuất hiện trong trang; chuột và bàn phím gửi qua Guacamole/RDP. Click vào màn hình để đưa focus vào VM.
4. Tab **PowerShell trên Azure VM** chạy lệnh trên VM, không thực thi trên Windows host.
5. Nút **Kiểm tra kết quả** dùng bộ chấm Windows từ xa. Nút **Tắt / Deallocate** gửi lệnh deallocate thật tới Azure; trạng thái cuối cùng phải đọc lại từ ARM.

`Tải RDP dự phòng` vẫn có, nhưng không còn là luồng Desktop chính. File không chứa mật khẩu.

## Điều khiển Azure

- `server/services/azureComputeClient.js`: Azure SDK, hỗ trợ `cli`, `service-principal`, `managed-identity`.
- `server/services/azureVmService.js`: đọc Instance View, Start và Deallocate; khóa thao tác chồng chéo. TCP 3389 đóng không còn bị diễn giải thành VM đã deallocate.
- `POST /api/cloud-vm/start`, `POST /api/cloud-vm/stop`: HTTP 202 khi ARM chấp nhận. Đó chưa phải xác nhận VM đã đạt trạng thái cuối.
- `GET /api/cloud-vm/status`: power state từ ARM, trạng thái thao tác, tình trạng cấu hình Desktop/guacd. Không trả mật khẩu/token Azure.
- CLI được cài riêng tại `.tools/azure-cli`, không đưa vào Git. Chạy `powershell -ExecutionPolicy Bypass -File scripts/azure-login.ps1` khi cần đăng nhập lại; script lưu subscription đã chọn vào `.env`.
- Service Principal cần `Virtual Machine Contributor` trên resource group chứa VM, cùng các biến trong `.env.example`; dùng `AZURE_AUTH_MODE=service-principal`.

SDK đã cài dùng API `virtualMachines.start/deallocate/runCommand(...).pollUntilDone()`. Không sao chép nguyên tên phương thức SDK phiên bản cũ trong tài liệu bàn giao.

## Desktop

- `scripts/setup-guacd.py`: chạy trong WSL; tải image `guacamole/guacd:1.6.0`, container `labex-guacd`, chỉ bind `127.0.0.1:4822`, không mount ổ host, không đặc quyền. Có label sở hữu và kiểm tra binding trước khi dùng lại container.
- Container dùng `unless-stopped`; daemon rootless hiện tại phải chạy. Có thể chạy lại helper sau khi Docker hoạt động.
- `server/services/desktopGateway.js`: ticket ngẫu nhiên, dùng một lần, hết hạn sau 30 giây. Browser không được chọn hostname/protocol hoặc truyền mật khẩu RDP. Guacamole token có thông tin kết nối chỉ được tạo nội bộ ở backend.
- `POST /api/cloud-vm/desktop-session`: nhận `{labId,width,height}`, trả `{path,ticket,expiresIn}`.
- `/ws/desktop`: dùng chung HTTP server, kiểm tra Origin trước upgrade, tiêu thụ ticket rồi chuyển giao cho guacamole-lite. Không mở WebSocket server công khai khác.
- `client/src/components/WindowsDesktop.jsx`: canvas, chuột/bàn phím, co màn hình, reconnect, giải phóng phiên khi rời bài. Đổi tab PowerShell giữ Desktop đã mount.
- Mật khẩu đọc từ `.env`; frontend không còn nhúng mật khẩu từ bản bàn giao. `WINDOWS_RDP_IGNORE_CERT=true` được cấu hình riêng cho chứng chỉ tự ký của VM lab hiện có. Với chứng chỉ được tin cậy, giữ `false`.

## PowerShell và remote verifier

Transport hiện triển khai là **Azure Run Command qua VM Agent**, thay cho mở thêm WinRM/SSH. Microsoft mô tả cơ chế và giới hạn tại [Run Command Windows](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/run-command). Chưa triển khai transport WinRM/SSH riêng.

- `windowsRemoteExecutor.js`: chạy PowerShell trên Windows VM thật, bằng quyền SYSTEM. Lệnh bắt đầu ở `C:\LabEx\Labs\<labId>`; mỗi lệnh là process mới nên biến shell không giữ giữa các lần gọi.
- Có timeout bên trong VM 90 giây và timeout chờ Azure 240 giây; Azure Run Command không có API hủy tức thì. Sau lỗi/mất mạng cần kiểm tra trạng thái trước khi gửi lại thao tác có tác dụng thay đổi dữ liệu.
- Mỗi VM Agent chỉ chạy một lệnh tại một thời điểm, thường mất tối thiểu khoảng 20 giây. API trả 409 khi executor local đang bận. Output rút gọn tối đa 600 ký tự stdout/250 ký tự stderr để nằm trong giới hạn 4 KiB của Agent; `outputTruncated` cho biết kết quả bị rút gọn.
- `POST /api/cloud-vm/powershell`: kiểm tra lab Windows, chạy remote, ghi journal chỉ sau khi có kết quả thật từ VM. Không gọi `powershell.exe` trên host bằng nội dung lệnh người học.
- `windowsRemoteVerifier.js`: 19 tiêu chí task ID đã review cho các lab Windows hiện có. AD kiểm tra OU/user/group/membership thật; IIS kiểm tra site PortalCorp, physical path và binding 8080; bài tạo tệp kiểm tra artifact/ACL thật.
- Bài quan sát dùng journal lệnh thành công gắn với VM đích, cộng probe remote. Không dùng journal giả local hoặc chỉ kiểm tra cmdlet có tồn tại để kết luận người học đã làm bài.
- Tiêu chí lệnh quan sát hiện khớp các lệnh mẫu đã liệt kê; chưa hỗ trợ mọi cách viết PowerShell tương đương. Bài GUI ADUC có kiểm tra process MMC thật. Thiếu module/đối tượng sẽ không được chấm đạt.
- Nút Reset Linux bị vô hiệu hóa với bài Windows. VM Windows dùng chung giữa các bài; chưa có snapshot/reset riêng hoặc cách ly nhiều học viên.

## Bằng chứng kiểm tra

- Azure CLI đã đăng nhập subscription Azure for Students; ARM xác nhận VM ban đầu `PowerState/deallocated`. API mới đã gửi Start thật và ARM chuyển sang `PowerState/running`.
- API Stop cũng đã được thử thật: `.artifacts/cloud-deallocate-smoke.json` ghi ARM xác nhận `PowerState/deallocated`. VM được đưa về trạng thái tắt ban đầu sau kiểm thử; web/backend local vẫn chạy. Người học dùng nút Bật Máy Ảo để bắt đầu phiên mới.
- Chrome headless kết nối RDP thật; ảnh `.artifacts/cloud-desktop.png` hiển thị Server Manager trong canvas ngay trên trang học. Báo cáo `.artifacts/cloud-desktop-smoke.json`.
- `.artifacts/cloud-powershell-web-smoke.json`: Chrome chạy `Get-Command *-Service` và `$PSVersionTable.PSVersion` qua API thực, sau đó nút Verify trả đạt với `verification_method=windows-remote`; localStorage của profile thử tách riêng trình duyệt người học.
- `.artifacts/cloud-remote-smoke.json`: VM trả computer `LabEx-WinServer`, PowerShell 5.1, identity SYSTEM; kiểm tra NTFS không đạt trước khi có FinanceDocs, đạt sau khi tạo đúng, rồi xóa artifact trong thư mục test riêng `win-cloud-smoke`. Không dùng thư mục bài học để thử xóa.
- `node --test tests/cloudVm.test.js tests/desktopGateway.test.js tests/environment.test.js`: 8/8 qua. Gồm ARM Start/Deallocate, lỗi xác thực, chống thao tác chồng chéo, kiểm tra envelope remote, từ chối journal local, kiểm tra lab ID/lỗi remote, ticket Desktop không chứa credential, hết hạn và chống replay.
- Build frontend thành công; vẫn có cảnh báo bundle lớn.
- Bộ test toàn dự án hiện còn ba lỗi liên quan Linux/readiness/placeholder đã có trong mã lúc bắt đầu lượt triển khai này. Giữ nguyên để xử lý sau theo ưu tiên của người dùng; không công bố toàn bộ test đều xanh.

## Phần chuẩn bị VM chưa làm tự động

Probe VM thật hiện cho thấy chưa có module ActiveDirectory/WebAdministration. Desktop và PowerShell hoạt động, nhưng bài AD/IIS chưa thể hoàn thành khi thiếu role/domain/site. Không tự promote máy thành domain controller, tự đặt domain hoặc tạo sẵn đáp án bài học. Cần chuẩn bị role/domain và fixture lab riêng trước khi kiểm chứng toàn bộ các bài AD/IIS.

Nguồn giao thức Desktop: [Apache Guacamole Docker](https://guacamole.apache.org/doc/gug/guacamole-docker.html), [guacamole-lite](https://github.com/vadimpronin/guacamole-lite). Tài liệu này không chứa mật khẩu hoặc Azure token.

## Cập nhật hiển thị Desktop

- Gom thanh điều khiển Windows, đưa RDP dự phòng/Deallocate vào menu thao tác, ẩn các tab Linux không liên quan. Thanh workspace Windows cao 48px trong kiểm tra 1440px.
- Nút **Mở rộng** ẩn hướng dẫn, **Hiện hướng dẫn** khôi phục bố cục; nút **Toàn màn hình Desktop** dùng Fullscreen API và có thể thoát bằng Esc.
- RDP dùng PNG, `force-lossless`, 32-bit màu và font smoothing. Khi kéo vách ngăn hoặc đổi fullscreen, client gửi `sendSize` với độ phân giải mới, không phóng to bitmap cũ. Debounce 250ms; bỏ qua khung đang ẩn để đổi tab không làm VM nhận kích thước 0.
- Giữ kích thước pixel theo vùng CSS và DPI 96 của phiên Windows đang có. Không nhân kích thước với `devicePixelRatio`, vì thực nghiệm ở phiên Windows này làm chữ quá nhỏ và gây lỗi RDP khi đổi kích thước. Đây không phải cam kết render Retina 2x; ưu tiên chữ dễ đọc, không thu nhỏ giao diện và không nén JPEG.
- `node scripts/test-cloud-desktop.mjs --layout --hidpi` qua trên VM thật, Chrome DPR 2: chia đôi 840×846 → mở rộng 1422×846 → fullscreen 1440×960 → khôi phục 840×846, chỉ **một** WebSocket Desktop, không có lỗi JavaScript. Báo cáo `.artifacts/desktop-layout-regression.json`; ảnh `.artifacts/desktop-expanded.png`, `.artifacts/desktop-fullscreen.png`.
- 8 test backend/gateway liên quan vẫn qua; build thành công. VM được giữ nguyên trạng thái chạy trong lần chỉnh giao diện này.
