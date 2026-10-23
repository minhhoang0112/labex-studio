# DNS/DHCP — trạng thái triển khai 2026-10-23

Đã tạo **6 bài/18 nhiệm vụ** trong `windows-dns-dhcp-network-services`, có nội dung VI, thao tác, tiêu chí, phần tự giải thích và reset. Chưa nghiệm thu live: Server đang không cấp phát được. Không đổi trạng thái khóa sang Ready bằng số lượng file.

| Bài | Lab ID | Trạng thái backend |
|---|---|---|
| Forward/reverse/A/CNAME/PTR | `win-dnsdhcp-zones-records` | 3 task Server, kiểm RRset/TTL và query DNS thật |
| Resolver/cache/forwarder | `win-dnsdhcp-resolver-cache` | 1 task inventory forwarder Server, 2 task cần client/path/domain |
| Scope/options | `win-dnsdhcp-scope-options` | 3 task cấu hình DHCP thật nhưng luôn Inactive; reservation mẫu được ghi rõ chưa phải lease |
| Authorization/lease/audit | `win-dnsdhcp-lease-audit` | 1 task Server read-only, 2 task unsupported-runtime |
| DNS incident | `win-dnsdhcp-dns-incident` | 2 task Server RRset sai→đúng, 1 task cần client |
| DHCP incident | `win-dnsdhcp-dhcp-incident` | 3 task unsupported-runtime; có quy trình thủ công chi tiết, không có grader giả |

Tổng: 10 đường chấm Server, 3 task domain/client bị chặn tới khi inspect hợp lệ, **5 task DHCP chưa có provider cô lập**. Các task DHCP unsupported có `probe:null` và definition unsupported; dù ai đặt boolean proof=true cũng không được mở chúng. Muốn thực hành/chấm thật phải xây provider và kiểm hai phía; không phải sửa một cờ.

## Thiết kế đã làm

- DNS zone riêng `lx-<run>.test`, primary/file-backed, DynamicUpdate=None; ZoneFile run riêng. Reverse zone dùng file khác forward zone; nếu đã có zone của người khác thì từ chối. Không sửa zone AD/_msdcs, global forwarder hoặc hosts để che kết quả.
- Probe A/CNAME/PTR có query tới DNS Server bằng `Resolve-DnsName -Server 127.0.0.1 -DnsOnly -NoHostsFile`, không chỉ có dòng cấu hình. TTL có phạm vi đúng, client cache kiểm khoảng thay vì giây tuyệt đối.
- Incident chỉ đổi RRset app của zone bài từ .99 sang .10 trong dải tài liệu. Không gọi đây là sửa kết nối ứng dụng hoặc Internet. Report trước sửa phải đúng run/host/time.
- Scope bài3 `192.0.2.0/24`, range .20–.100, lease8h, exclusion .20–.24, reservation .25/MAC mẫu, options003/006/015 ở cấp scope. Tất cả đều giữ Inactive; không đổi NIC/gateway/DHCP Azure hoặc authorize server tự động. Đây là quản trị cấu hình có thật, không phải chứng minh client nhận lease.
- Reset kiểm exact manifest/type/namespace/ZoneFile/scopeName/Inactive, không xóa scope lạ hoặc scope đã active. Report có schema/context/freshness, chặn reparse và file quá lớn.

## Vì sao còn5 task DHCP không thể gọi hoàn thành

Hạ tầng hiện có chưa có mạng DHCP broadcast/relay cô lập với client thật. Microsoft mô tả broadcast trực tiếp không hoạt động trong Azure VNet; DHCP server Azure phục vụ qua relay phù hợp là mô hình khác. Nguồn: [DHCP on Azure](https://learn.microsoft.com/en-us/azure/virtual-network/how-to-dhcp-azure).

Giáo trình của5 task đã có quy trình: preflight/baseline, scope/client NIC thật, activate đúng scope cô lập, đối chiếu ServerIdentifier/ClientId/lease/time/options ở hai phía, đọc audit/DORA/renew T1/T2, sửa option006, renew đúng NIC, query DNS và kiểm reset. Hint web dừng thay vì chạy tác vụ gây lỗi trên NIC Azure. Không có Add-DhcpServerv4Lease, lease mẫu, log mẫu hoặc ô “tôi đã làm” để lấy điểm.

Để hoàn tất cần người dùng chọn môi trường: lab cô lập đã có/relay phù hợp, hoặc hạ tầng khác có chi phí được duyệt và provider thật. Không tự tạo VM/nested virtualization/adapter/peering hoặc resize theo ví dụ hãng. Không bridge DHCP thử vào LAN nhà. Sau chọn môi trường, cần adapter backend, manifest/lease/baseline và grader actual-client;5 task không được mở chỉ bằng sửa readiness.

## Kiểm thử và bước tiếp

Xem `AD_GPO_IMPLEMENTATION_REPORT.md` cho API/lifecycle, lệnh test và file nguồn chung. Cả hai khóa hiện có unit/API/PowerShell syntax/guard tests và browser smoke; không có AD/DNS/DHCP live-pass mới vì `ZonalAllocationFailed`. Server vẫn deallocated, không có zone/scope/role hoặc VM mới được tạo.

Khi Server hoạt động: khảo sát roles/domain/quyền thật trước, chạy script live scratch, xác minh cleanup và tác động ngoài namespace không có. Nếu thiếu DNS/DHCP role, chốt baseline/recovery và quyền rồi cài có kiểm soát; chưa tự cài trong lần triển khai này. Tiếp theo private path/DNS client và inspect cho3 task client; riêng5 task DHCP cần provider/mạng riêng như trên.

Roadmap hiện có64 bài nội dung,8 khóa có bài,7 khóa còn đề cương,42 bài còn dự kiến. Số bài có nội dung không đồng nghĩa64 bài đều thực hành/chấm đủ; hai khóa này giữ trạng thái partial tương ứng môi trường.
