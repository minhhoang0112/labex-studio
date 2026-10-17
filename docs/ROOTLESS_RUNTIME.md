# Runtime Ubuntu 22.04 — 16/10/2026

Đã cài Docker Engine rootless **29.9.1** trong WSL Ubuntu hiện có, theo yêu cầu cho phép cài công cụ của người dùng. Image ứng dụng là `labex-local/ubuntu22:1`, userspace thực tế Ubuntu **22.04.5**. Không cần Docker Desktop hoặc một distro WSL mới. Container vẫn dùng kernel WSL; đây chưa phải VM desktop của LabEx.

## Những gì đã cài

- 12 gói Ubuntu làm prerequisite: `uidmap`, `rootlesskit`, `slirp4netns`, `fuse-overlayfs`, `libslirp0`, `libsubid5`, `iptables`, `libip4tc2`, `libip6tc2`, `libnetfilter-conntrack3`, `libnfnetlink0`, `libnftnl11`; 0 gói nâng cấp hoặc gỡ bỏ trong lần cài này.
- Engine và rootless extras lấy từ [phân phối static chính thức của Docker](https://download.docker.com/linux/static/stable/x86_64/), ghim bản 29.9.1. Installer kiểm tra thành viên tar và ghi SHA256 của bản tải; không gọi đây là chữ ký nhà phát hành đã xác minh.
- Thư mục ứng dụng: `~/.local/share/labex-local/docker-rootless/` của **tài khoản WSL thường**, gồm `versions/29.9.1/bin`, `run/docker.sock`, `data` và log. Backend không chạy daemon này bằng WSL root.
- Dockerfile và bootstrap: `server/runtime/docker/`. Build context có allowlist `.dockerignore`, không gửi profile Chrome, secret hoặc node_modules vào image.

Các helper `newuidmap/newgidmap` do gói Ubuntu cài ở đường dẫn root sở hữu. Cấu hình subordinate UID/GID sẵn có được giữ nguyên. Daemon dùng overlay2 và mạng rootless slirp4netns; mỗi bài là container riêng với HOME `/home/labex`, cwd `/home/labex/project`, tài khoản `labex` và sudo thật.

Không có bind mount ổ đĩa host, mount Docker socket, `--privileged`, host PID hoặc host network trong môi trường học. `NET_ADMIN` chỉ thuộc network namespace của container rootless để làm bài UFW. Không sửa firewall hoặc sysctl của WSL host.

## Chọn và khởi động

```powershell
npm run runtime:docker
```

Sau đó mở `run.bat`. Script khởi động engine riêng nếu cần, build FE và khởi động server. Không tạo service/scheduled task hoặc sửa shell startup. Khi đã build FE, có thể chỉ chạy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Restart
```

Script kiểm tra runtime **trước** khi dừng server cũ. `-Restart` chỉ dừng Node có entry file tuyệt đối của dự án trên cổng 5000. Không dừng Vite/tiến trình Anti. Server tồn tại độc lập với terminal đã khởi chạy; log và PID ở `.artifacts/server.*`.

Quay về provider cũ bằng `npm run runtime:namespace` rồi khởi động lại server. Hai provider có dữ liệu riêng, không tự di chuyển hay ghi đè công việc cũ. `.env` được cập nhật riêng khóa provider và giữ nguyên key AI hiện có.

Nếu cần dựng lại trên máy tương tự, đọc prerequisite của [Docker rootless](https://docs.docker.com/engine/security/rootless/) trước; sau khi cài đủ helper, chạy bằng tài khoản WSL thường:

```powershell
wsl --distribution Ubuntu --exec /usr/bin/python3 /mnt/d/Project/LabEx/scripts/bootstrap-rootless-docker.py install
wsl --distribution Ubuntu --exec /usr/bin/python3 /mnt/d/Project/LabEx/scripts/bootstrap-rootless-docker.py start
```

Installer cài engine; image cần build theo Dockerfile và allowlist của dự án. Đây là binary static ghim phiên bản, không được Windows/Ubuntu tự cập nhật như Docker Desktop.

## Hành vi và giới hạn

Terminal và bộ chấm dùng cùng container, nên thấy cùng tiến trình nền, package database và cron. Tệp vẫn còn sau reconnect hoặc khởi động lại container. Manifest thay đổi chỉ làm API báo `reset_required`; không tự reseed. Reset người học xác nhận sẽ dừng và đổi tên container cũ thành bản lưu trước khi tạo lại. Các bản lưu chiếm dung lượng cho tới khi được người dùng chủ động dọn.

Đã kiểm thử cài/gỡ package thật, tiến trình tồn tại qua nhiều lần exec, cron thực sự chạy qua phút hẹn, ping nguồn yêu cầu và UFW chặn/mở lưu lượng giữa hai peer riêng. Kiểm chứng chi tiết và lệnh chạy: [VALIDATION.md](../server/runtime/docker/VALIDATION.md).

`dmesg` cần kernel log riêng nên vẫn bị chặn. Chưa cung cấp systemd, SSH authentication, XFCE/noVNC, WebIDE hoặc dịch vụ Web 8080. `network:true` chỉ xác nhận mạng Linux, không bật các giao diện/dịch vụ này. Không hứa CPU/RAM/PID quotas khi cgroup controller chưa được kiểm chứng. Kết nối ra ngoài còn phụ thuộc mạng thực tế.

Backend chấm quy tắc local theo tài liệu; mã bộ chấm và image riêng của LabEx chưa được phục hồi. Nhật ký lệnh phục vụ tự học và có thể bị người học sửa; không dùng nó làm cơ chế thi có giám sát.
