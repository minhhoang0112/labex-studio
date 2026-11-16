# Linux Upskill Challenge trên web local

## Bắt đầu học

Tên khóa: **Linux Upskill Challenge — Quản trị Ubuntu Server**.

Vào Lộ trình Linux → Ubuntu Server thực tế → khóa trên. Có Ngày 0 chuẩn bị, 20 ngày thực hành và Ngày 21 tổng kết. Đọc hướng dẫn VI; dùng nút EN để đối chiếu toàn văn nguồn. Hướng dẫn VI là bản biên soạn theo nguồn với bài tập local, không tuyên bố là dịch nguyên văn mọi đoạn/Extension.

Trong bài, bấm **Bật Ubuntu lab** rồi chờ khoảng 30–60 giây; web tự thử kết nối trong tối đa 2 phút. Không cần mở cửa sổ VMware. Khi thấy `luc@luc-lab:~$`, bấm vào terminal và gõ lệnh. Nếu hết thời gian vẫn chưa có terminal, bấm **Kiểm tra kết nối**. Terminal web SSH vào cùng một VM cho mọi ngày. Xong buổi học bấm **Tắt Ubuntu lab** sau khi lưu công việc; dữ liệu đĩa được giữ.

Không dùng nút reset từng bài. Apache, user, cron và tệp hôm trước cần còn ở hôm sau. Không tự khôi phục baseline giữa chừng nếu chưa sao lưu phần muốn giữ.

## Tách biệt với dự án CV

VM mới nằm tại `server/runtime/vms/linux-upskill-lab/linux-upskill-lab.vmx`, tên VMware **LabEx Linux Upskill LAB - separate from CV**, 2 vCPU, 2 GB RAM, 20 GB đĩa sparse, NAT. Ubuntu Server 24.04 LTS cloud image chính thức được kiểm tra SHA256; thông tin tải nằm trong `.artifacts/upskill-vm-download/manifest.json`.

VM, ổ đĩa, key và snapshot riêng. Script chỉ điều khiển đường dẫn VM lab được cố định và có owner marker, không tìm VM theo từ “Ubuntu”. Nó không cấu hình hoặc dừng VM CV. Các VM vẫn chia sẻ RAM/CPU vật lý nên nên tắt VM không dùng khi máy thiếu tài nguyên.

Terminal và grader kiểm tra `/etc/labex-upskill-vm` đúng marker trước khi chạy. SSH dùng key riêng, StrictHostKeyChecking và known_hosts đã pin bằng host key tạo trước lúc boot. Không fallback sang container, WSL hoặc VM khác khi SSH lỗi.

## User và khóa

User `luc` là user thường có sudo không hỏi mật khẩu trên **VM học riêng** để tự động kiểm tra trạng thái hệ thống. Đây không phải cấu hình sudo khuyến nghị cho server dùng chung/production.

- Key client: `server/runtime/keys/luc-client`.
- Known hosts: `server/runtime/keys/luc-known-hosts`.
- Mật khẩu console khẩn cấp: `server/runtime/keys/luc-console.txt` (chỉ đọc trên máy chính khi cần, không dán vào AI).
- SSH qua mạng yêu cầu key; password console không bật password authentication của SSH.

Các tệp này và thư mục VM bị loại khỏi Git, có ACL riêng. ISO seed chứa cấu hình nhạy cảm của đúng VM, không chia sẻ nó. Giữ key nếu muốn giữ truy cập lâu dài; không xóa thư mục runtime khi “dọn file tạm”.

Mở VMware console nếu lỡ khóa SSH bằng UFW. Dùng user/mật khẩu console riêng, allow lại SSH trên VM lab rồi kết nối lại. Không sửa firewall trên VM CV để chữa nhầm.

## Truy cập ngoài web để học SFTP

Xem `LUC_SSH_HOST`, `LUC_SSH_USER` trong `.env` trên máy chính. Không gửi toàn bộ `.env` vì có cấu hình nhạy cảm khác. Ví dụ PowerShell:

```powershell
ssh -i D:/Project/LabEx/server/runtime/keys/luc-client -o UserKnownHostsFile=D:/Project/LabEx/server/runtime/keys/luc-known-hosts luc@IP_VM_LAB
sftp -i D:/Project/LabEx/server/runtime/keys/luc-client -o UserKnownHostsFile=D:/Project/LabEx/server/runtime/keys/luc-known-hosts luc@IP_VM_LAB
```

Dùng IP thực thay IP_VM_LAB; không dùng địa chỉ IP của VM CV. SFTP dùng terminal Windows riêng là chủ ý để học truyền tệp hai phía. Bộ chấm ngày 12 chỉ kiểm tra tệp nhận, không tự chứng nhận bạn đã tải xuống Windows; cần so hash theo bài.

## Cài lại / kết nối lại

Các script thiết lập phục vụ VM mới và không tự ghi đè tài nguyên cũ:

1. `scripts/download-upskill-vm.mjs`: tải cloud disk Ubuntu chính thức và đối chiếu SHA256.
2. `scripts/setup-upskill-local-vm.py`: tạo riêng đĩa sparse, key và NoCloud ISO; cần pycdlib trong `.tools/luc-vm-python` và VMware có sẵn. Không cài lại hypervisor.
3. Bật đúng `.vmx` bằng VMware hoặc vmrun.
4. `scripts/connect-upskill-local-vm.py`: tìm lease DHCP theo MAC của đúng VM lab, pin host key đã tạo và cập nhật các biến `LUC_SSH_*` trong `.env`. Nếu IP NAT thay đổi, chạy lại script này và khởi động lại backend. Không dùng ssh-keyscan chưa xác minh để ghi đè fingerprint.

Snapshot sạch: **LUC-clean-baseline**. Chỉ revert qua VMware khi bạn muốn xóa toàn bộ tiến độ trên VM học, đã sao lưu công việc và VM đang tắt. Không dùng snapshot này cho VM khác.

Các thư mục đĩa/khóa là dữ liệu học quan trọng. `.artifacts/upskill-vm-download` là cache image tải về; `.artifacts/upskill-course-live.json` là bằng chứng kiểm thử. Không xóa các tệp này trong tác vụ dọn dẹp chung mà chưa kiểm tra.

## Phạm vi chấm và nguồn

Có 21 bài kiểm tra kết quả trọng tâm, còn Ngày 21 chỉ xác nhận kế hoạch tổng kết. Không chấm mọi Extension hoặc tự đánh giá phần giải thích bằng AI. Xem mô tả từng bài: việc dùng Vim/nano, đường truyền SFTP và thử kết nối trình duyệt từ Windows có phần tự kiểm tra rõ ràng.

Toàn văn EN được nhập từ Linux Upskill Challenge, Steve Brorens (@snori74), Livia Lima và contributors, giấy phép **CC BY 4.0**. Revision và hash từng tệp nằm trong `server/data/reference/linux-upskill-challenge/manifest.json`; LICENSE đi kèm. Bản VI và bộ chấm là phần chuyển thể local; thay ví dụ build Nmap cũ bằng GNU Hello cài vào home, dùng VM local NAT thay yêu cầu public VPS, sửa ghi chú codename và không đọc/lưu hash mật khẩu vào báo cáo.

## Kết quả kiểm thử 03/11/2026

- 149 test tự động đạt; client build thành công.
- 21 bài trọng tâm Ngày 0–20 được chạy trên VM lab thật qua SSH và kiểm tra trạng thái sau thao tác. Báo cáo `.artifacts/upskill-course-live.json` gộp các lượt thử, không tuyên bố một lượt liên tục: định dạng UFW có tên profile được sửa sau lần đầu rồi chạy tiếp từ Ngày 9.
- Các đáp án sai bị từ chối: thiếu rule HTTP, thư mục chia sẻ 777, bản restore sai nội dung, script hardcode mẫu. Báo cáo `.artifacts/upskill-negative-live.json`.
- Khóa 22 bài và terminal SSH trên web được kiểm tra bằng WebSocket thật và Chrome; reset riêng bài bị tắt. Ảnh `.artifacts/upskill-course-ui.png`.
- Baseline sạch đã được phục hồi; xác nhận không còn cây bài giải hoặc user thử. Nút bật/tắt VM qua web đã thử. Báo cáo `.artifacts/upskill-vm-lifecycle.json`.
- Chưa chứng nhận thao tác editor của người học, truyền/tải xuống Windows bằng SFTP, kết nối HTTP từ trình duyệt Windows, mọi Extension hoặc khả năng giải thích. Các giới hạn được ghi trong từng bài; Ngày 21 chỉ là tiếp tục thông tin.

- [Khóa gốc](https://linuxupskillchallenge.org/).
- [Ubuntu 24.04 cloud images chính thức](https://cloud-images.ubuntu.com/releases/noble/release/).
- [Ubuntu OpenSSH](https://ubuntu.com/server/docs/how-to/security/openssh-server/).
- [cloud-init NoCloud](https://docs.cloud-init.io/en/latest/reference/datasources/nocloud.html).
