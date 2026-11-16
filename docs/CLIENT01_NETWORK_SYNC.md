# Tự đồng bộ IP khi kết nối Desktop CLIENT01

Bật trong cấu hình local bằng `WINDOWS_CLIENT_NETWORK_SYNC=true`. Chỉ áp dụng CLIENT01 với Azure CLI đã đăng nhập, không sửa rule của Windows Server.

Khi mở/kết nối lại Desktop, backend đọc primary NIC của VM được cấu hình, kiểm tra NIC gắn đúng NSG `LabEx-CLIENT01-NSG`, đọc public IPv4 hiện tại từ resource Azure. Backend cập nhật IP đích trong bộ nhớ cho gateway; lần khởi động sau lại đọc từ Azure.

IP nguồn của mạng chạy backend được lấy từ HTTPS api.ipify.org. Nếu thay đổi, cập nhật duy nhất rule `RDP-from-lab-gateway` thành một địa chỉ `/32`. Chỉ chấp nhận rule Allow/Inbound/TCP đúng cổng RDP cấu hình; không tạo rule mới, không mở `*`, không mở thêm cổng. IP không hợp lệ hoặc NSG khác dự kiến làm bước đồng bộ thất bại rõ ràng.

Kết quả thành công được giữ 30 giây để tránh gọi Azure liên tục; yêu cầu đồng thời dùng chung một lượt kiểm tra. Không chạy nền mỗi lần polling trạng thái VM. Khi đổi mạng hoặc mất phiên Desktop, bấm **Kết nối lại**; có thể phải chờ cache ngắn hết hạn nếu vừa đổi IP. Lần đầu có thể chậm thêm do các lệnh Azure CLI.

Phụ thuộc: Internet, Azure CLI trong `.tools/azure-cli`, tài khoản đang đăng nhập có quyền đọc VM/NIC/public IP và sửa rule NSG. Không hỗ trợ tự động cho auth service-principal/managed-identity trong bản này. Backend và guacd cần đi ra Internet cùng một IP; nếu đặt guacd ở máy khác hoặc dùng VPN chia tuyến, phải cấu hình lại thiết kế egress trước.

Đã kiểm tra bằng test giả lập thay IP/địa chỉ sai/NSG sai/cache và chạy đọc thật CLIENT01. Rule hiện tại được cập nhật theo yêu cầu người dùng. Không hoàn nguyên sự cố lab hoặc bật/tắt VM trong thao tác này.
