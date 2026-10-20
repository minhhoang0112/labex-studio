# Kiểm tra Azure và cấu hình máy Windows thực hành

> Cập nhật theo phản hồi người dùng: **phương án bổ sung $30/tháng dưới đây đã bị từ chối**, không được dùng làm lệnh triển khai. Hướng hiện hành: B-series tiết kiệm, chỉ bật khi học, tắt bằng Deallocate trên web; xem [bàn giao Antigravity](../ANTIGRAVITY_WINDOWS_CLOUD_HANDOVER.md). Các giá bên dưới được giữ làm số liệu tham khảo.

Ngày kiểm tra: 20/10/2026. Phạm vi đã thực hiện: đọc Azure và mã backend, lấy giá công khai, chuẩn bị cấu hình để duyệt. Chưa tạo/bật máy, snapshot hoặc nạp lỗi. Đây chưa phải hệ thống nạp lỗi đã chạy được.

## Kết quả thực tế

- Azure CLI hiện đăng nhập được; subscription **Azure for Students**, trạng thái Enabled.
- Máy hiện có: **LabEx-WinServer**, Windows Server 2022 Gen2, Central India, **Deallocated**. SKU **Standard_B2ats_v2: 2 vCPU, 1 GiB RAM**, không phải 4 GiB. Số RAM đã được đối chiếu bằng Azure list-sizes và bảng Basv2 của Microsoft. Không thay đổi kích thước máy trong lượt này.
- OS disk hiện có: **127 GiB Premium_LRS**. Resource group hiện tại chưa có snapshot. Vì vậy chưa có bằng chứng một baseline phục hồi đã sẵn sàng.
- Regional vCPU quota: đang dùng **2/6**; Basv2 quota: **2/10**. Thêm máy 2 vCPU sẽ thành 4/6 theo số liệu lúc kiểm tra. Quota không bảo đảm còn capacity triển khai.
- Azure trả danh mục Windows 11 tại Central India và image **win11-25h2-ent**, bản **26200.9711.261011**, x64, Gen2, hỗ trợ Trusted Launch.
- Azure list-sizes trả **Standard_B2as_v2: 2 vCPU/8192 MiB RAM**. Lệnh list-skus kiểm tra restrictions bị chậm rồi timeout; **chưa chứng minh SKU này được cấp phát cho subscription ở thời điểm triển khai**. Phải kiểm tra lại trước khi tạo; không tự đổi sang máy đắt hơn hoặc vùng khác nếu thất bại.
- NSG hiện có cho phép RDP 3389 từ `*`; một rule khác cho phép 3389/80 từ `*`. Chưa thay NSG đang dùng vì cần xác định đúng nguồn truy cập trước. Máy mới sẽ chỉ cho RDP từ public IP của backend/Guacamole, không mở toàn Internet.

Nguồn dữ liệu đã lọc thông tin tài khoản và mật khẩu: [bản kiểm kê](../.artifacts/azure-lab-plan-2026-10-20.json). Công cụ chạy lại: [audit-azure-lab-plan.py](../scripts/audit-azure-lab-plan.py). Công cụ chỉ có các truy vấn Azure đọc và HTTP GET giá công khai; không có thao tác deploy/start/Run Command.

## Cấu hình đề xuất để duyệt

| Thành phần | Đề xuất |
| --- | --- |
| Resource group mới | LabEx-Support-Lab-RG |
| Máy mới | LabEx-CLIENT01 / computer name CLIENT01 |
| Hệ điều hành | Windows 11 Enterprise 25H2, single-session, dev/test cá nhân |
| CPU/RAM | Standard_B2as_v2, 2 vCPU / 8 GiB, Regular; không Spot |
| Bảo mật boot | Gen2, Trusted Launch, Secure Boot, vTPM |
| OS disk | Standard SSD LRS, dự kiến 128 GiB; kiểm tra dung lượng tối thiểu image trước deploy |
| Mạng | VNet/NSG riêng, chưa peering với Server cũ; một Standard IPv4 để Desktop hiện có kết nối |
| Truy cập | RDP chỉ từ gateway/backend IP /32; không mở WinRM ra Internet |
| Phục hồi | Một snapshot baseline Standard_LRS; ổ phục hồi tạm khi reset |
| Tài khoản | User thực hành và admin cứu hộ riêng, tạo bằng secure input |

Cấu hình máy đọc được ở [windows-support-lab.plan.json](../infra/azure/windows-support-lab.plan.json). Đây là bản kế hoạch, không phải ARM template và không có lệnh triển khai tự động.

Không sao chép nguyên ổ máy cũ: CLIENT01 phải là máy sạch riêng để không trùng tài khoản, dữ liệu hoặc trạng thái các bài đang học. Backend web vẫn chạy trên máy cá nhân, truy cập máy Azure qua các dịch vụ hiện có sau khi bổ sung chọn đúng target.

Microsoft ghi rõ tài khoản Student/Free Trial có thể triển khai Windows 11 cho **development/testing**. Ngoại lệ này phù hợp hướng lab học cá nhân được đề xuất; không suy rộng thành quyền vận hành desktop thương mại. Danh mục image xuất hiện không tự chứng minh mọi quyền license, hạn mức hoặc capacity. [Windows 11 trên Azure — Student/Free Trial](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/windows-desktop-multitenant-hosting-deployment), [Windows client dev/test](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/client-images).

## Chi phí dự trù cho riêng máy mới

Giá USD public retail Central India đọc ngày 20/10/2026, chưa thuế. Không phải hóa đơn, báo giá cam kết hay số credit còn lại của tài khoản.

| Thành phần | Đơn giá thu được | Giả định |
| --- | ---: | --- |
| Compute B2as_v2 base | $0.0492/giờ | Đối chiếu meter cho deployment Windows client hợp lệ trước khi tạo |
| Compute B2as_v2 Windows | $0.0584/giờ | Dùng làm khoản dự phòng khi lập kế hoạch; đây là meter Windows Server, không khẳng định là báo giá Windows 11 |
| OS disk Standard SSD E10 LRS | $10.56/tháng | 128 GiB, giữ cả tháng |
| Standard IPv4 Static | $0.005/giờ | Giữ 730 giờ: $3.65 |
| Snapshot Standard LRS | $0.05/GB/tháng | Ví dụ dùng thực tế 40 GB: $2.00 |

Công thức khoản cơ bản: `giờ chạy × giá compute + 10.56 + 730 × 0.005 + dung lượng snapshot dùng thực tế × 0.05`.

| Mức sử dụng | Khoản cơ bản/tháng |
| --- | ---: |
| 60 giờ | $19.16–$19.71 |
| 120 giờ | $22.11–$23.22 |
| Để chạy 730 giờ | $52.13–$58.84 |

Đề xuất xin duyệt **ngân sách bổ sung $30/tháng**, mục tiêu 60–120 giờ chạy, chỉ một snapshot baseline. Chưa bao gồm disk operations, egress, thuế, ổ phục hồi giữ lâu hoặc license khác nếu có. Snapshot tính theo dữ liệu thực dùng, không cố định 40 GB; nếu dùng 128 GB thì phần snapshot tăng từ $2 lên $6.40. Không giữ vô hạn ổ phục hồi cũ.

Máy Server hiện có có chi phí riêng. Với disk P10 LRS và Standard IPv4 giữ 730 giờ, riêng hai khoản retail khoảng **$19.71 + $3.65 = $23.36/tháng**, chưa compute, hoạt động I/O hay các khoản khác. Không cộng khoản này vào nhãn “máy mới $20–25”. Chưa truy vấn được số credit sinh viên còn lại; cần người dùng kiểm tra trong Azure Education/Cost Management trước khi duyệt tạo.

Deallocated dừng tính compute nhưng disk, IP và snapshot vẫn có thể tính phí. Budget alert là cảnh báo, không phải trần thanh toán tự động. Mục tiêu vận hành cần có tự deallocate sau phiên/thời hạn, báo trạng thái thật từ ARM; tính năng này chưa được thêm trong lượt chuẩn bị. [Trạng thái và tính phí](https://learn.microsoft.com/en-us/azure/virtual-machines/states-billing), [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices).

## Phục hồi và giới hạn nạp lỗi

1. Tạo riêng CLIENT01 sau khi duyệt chi phí và kiểm tra deployment. Chỉ cài công cụ chuẩn, tạo user thực hành, ghi lại cấu hình mạng và kiểm tra chức năng bình thường.
2. Kiểm tra BitLocker/device encryption và liên hệ với vTPM; không mặc định một snapshot OS disk bao gồm toàn bộ trạng thái TPM hoặc đủ tự mở khóa. Chuẩn bị quy trình recovery phù hợp, không xuất recovery key vào log/web/chat.
3. Tắt máy sạch rồi deallocate, chụp baseline managed disk. Ghi cùng image version, OS build, disk generation/security, cấu hình VM/NIC/NSG và các phụ thuộc lab. Không đưa thay đổi Azure NIC/NSG vào bài đầu tiên.
4. Thử reset trên chính máy riêng: tạo ổ từ snapshot tương thích, thay OS disk khi máy đã deallocate theo quy trình dự án, khởi động và kiểm tra RDP, VM Agent, user và chức năng mẫu. Chỉ sau khi thử thành công mới cho phép nạp lỗi. Không tuyên bố tính năng này đã chạy nếu mới có tài liệu.
5. Khoá độc quyền một phiên/VM, ghi journal trạng thái bền vững; baseline → inject → xác minh lỗi → giao bài → chấm chức năng → reset → kiểm tra baseline. Thất bại khi chuẩn bị hoặc phục hồi phải khoá bài và báo lỗi hạ tầng.
6. Lỗi đầu tiên nên giới hạn ở ứng dụng/dịch vụ mẫu hoặc quyền thư mục lab. Không phá Agent, tắt toàn bộ firewall, làm hỏng boot hay đổi DNS của management adapter trong pilot. Run Command phụ thuộc Agent và outbound, chạy SYSTEM, nên không dùng kết quả SYSTEM đọc file để chứng minh quyền của user thực hành.

Snapshot là snapshot ổ đĩa, không tự phục hồi NSG/NIC, dữ liệu ổ khác hoặc quan hệ domain. CLIENT01 ban đầu độc lập; domain lab cần thiết kế baseline nhiều máy riêng trước khi thêm DC01. [Snapshot managed disk](https://learn.microsoft.com/en-us/azure/virtual-machines/snapshot-copy-managed-disk), [Thay OS disk](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/os-disk-swap), [Run Command](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/run-command), [Basv2 CPU/RAM](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/basv2-series).

## Các bước backend sau khi chốt phương án

Hiện `cloudConfig.js`, `azureVmService.js`, `windowsRemoteExecutor.js` gắn một máy qua env toàn cục. Chưa được đổi env sang CLIENT01 vì sẽ làm các bài Server trỏ nhầm máy.

- Thêm danh mục target server/client và ánh xạ theo bài; status/start/desktop/execute/verify phải dùng cùng target. Ticket Desktop phải gắn target và phiên.
- Thêm hàng đợi/lease theo VM, dùng chung cho terminal, verifier và inject/reset. Khóa riêng trong mỗi executor hiện tại chưa đủ điều phối toàn bộ vòng đời.
- Viết scenario chỉ định script đã duyệt, user bị ảnh hưởng, phép thử lỗi/chức năng, thời hạn và reset. Viết giáo trình cơ chế → triệu chứng → bằng chứng → xử lý → xác nhận, với chế độ hướng dẫn và challenge.
- Dùng bài pilot để kiểm chứng: chưa sửa phải trượt, sửa hợp lệ phải đạt bằng GUI hoặc PowerShell, sửa bằng mở quyền quá mức phải trượt, reset trở về baseline. Chưa nhập hàng chục bài với nhãn Ready khi môi trường chưa được thử.

Quyết định cần người dùng: duyệt ngân sách bổ sung $30/tháng cho một CLIENT01, kiểm tra còn đủ credit; sau đó mới hoàn thiện kiểm tra SKU/deployment và tạo tài nguyên. Nếu chưa duyệt, vẫn có thể tiếp tục viết phần backend và nội dung bằng dữ liệu thử, nhưng không bật nạp lỗi vào máy hiện có.
