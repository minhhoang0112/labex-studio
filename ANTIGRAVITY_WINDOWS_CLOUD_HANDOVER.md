# Bàn giao Antigravity: Windows IT Support và System lab trên Azure

> Bản này ghi quyết định trước khi triển khai. Sau đó người dùng đã duyệt tạo client 4 GiB/SSD 128 GiB, auto-shutdown 23:00. Kết quả mới nhất và API đang dùng nằm ở [WINDOWS_11_BACKEND_IMPLEMENTATION_2026-10-20.md](docs/WINDOWS_11_BACKEND_IMPLEMENTATION_2026-10-20.md). Đề xuất 8 GiB/$30 vẫn bị từ chối; không nhầm với CLIENT01 nhỏ đã được tạo sau đó.

Cập nhật: 20/10/2026. Workspace: `D:\Project\LabEx`.

## 1. Yêu cầu và quyết định mới nhất của người dùng

- Web chạy local; máy Windows thực hành là **Azure VM thật**. Máy cá nhân chỉ điều khiển qua trình duyệt.
- Ưu tiên **chi phí thấp, B-series**, học lúc nào bật VM lúc đó; học xong **Deallocate ngay trên web**. Không chạy 24/24.
- Người dùng **đã từ chối** đề xuất bổ sung ngân sách $30/tháng và máy 8 GiB làm mặc định. Không lấy bản kế hoạch cũ làm bằng chứng đồng ý tạo VM/resize/tăng ngân sách.
- Giữ chức năng Desktop thật và PowerShell đang có. Không dựng Desktop giả hoặc báo đã sửa lỗi khi chỉ mô phỏng trạng thái.
- Muốn học từ IT Support thực tập lên System Administrator, cả Windows và Linux; đợt này phát triển nhánh Windows.
- Muốn nạp sự cố có thật lên VM, tự chẩn đoán/sửa; có học hướng dẫn, gợi ý và bài kiểm tra không lời giải. Phải giải thích cơ chế, không chỉ đưa lệnh chép theo.
- Chưa cần tạo đồng thời CLIENT/DC/Server. Viết và thử phần mềm trước, thêm máy khi có bài thật cần dùng và phương án giá được chốt.

Codex **có thể sử dụng Azure CLI để tạo VM**; chưa tạo vì đang chuẩn bị phương án trước khi phát sinh phí, không phải thiếu công cụ. CLI và phiên đăng nhập đã có trong dự án.

## 2. Hệ thống hiện có: giữ lại và phát triển tiếp

| Hạng mục | Hiện trạng đã kiểm tra |
| --- | --- |
| Subscription | Azure for Students, Enabled; CLI đăng nhập được tại thời điểm kiểm tra |
| Resource group | LabEx-India-RG |
| VM | LabEx-WinServer, Central India, Windows Server 2022 Gen2 |
| Kích thước thực tế | **Standard_B2ats_v2, 2 vCPU / 1 GiB RAM**. Không phải B2s, không phải 4 GiB |
| Trạng thái lần kiểm tra | Deallocated; chưa bật hoặc nạp lỗi trong lượt kiểm tra này |
| OS disk | 127 GiB, Premium_LRS |
| Snapshot trong RG | Chưa có; chưa được coi là có baseline phục hồi |
| Quota vùng | 2/6 regional vCPU; Basv2 family 2/10 |
| Web | Express port 5000, React; Desktop qua Guacamole, PowerShell qua Azure Run Command |
| Khóa Windows | 3 khóa / 15 bài / 19 nhiệm vụ; chưa phải giáo trình IT Support hoàn chỉnh |

Đọc cấu hình thật từ env qua backend. Không chép mật khẩu, token, recovery key hay nội dung file handover cũ có credentials vào báo cáo/ảnh/log. Không commit `.env`.

Các điểm mã cần đọc:

- `server/services/cloudConfig.js`: cấu hình Azure/guest/gateway, mặc định một máy.
- `server/services/azureComputeClient.js`: Azure SDK và credential; không cần thay bằng gọi CLI ở từng request.
- `server/services/azureVmService.js`: status ARM, start và deallocate; có xử lý thao tác đang chạy.
- `server/routes/cloudVm.js`: router API Azure.
- `server/services/windowsRemoteExecutor.js`: Run Command SYSTEM, thư mục theo lab; mỗi lệnh tạo PowerShell process mới.
- `server/services/windowsRemoteVerifier.js`: bộ chấm Windows hiện có, cần mở rộng kiểm tra chức năng thật.
- `server/services/desktopGateway.js`: ticket Desktop/gateway.
- `client/src/components/WindowsConsole.jsx`, `WindowsDesktop.jsx`: giao diện máy ảo.
- `tests/cloudVm.test.js`: 5 kiểm thử hiện có, đã chạy đạt 20/10/2026; dùng Azure giả lập, không chứng minh khả năng tạo VM hoặc reset thật.

API hiện có, router được mount dưới `/api`:

| API | Ý nghĩa |
| --- | --- |
| GET /api/cloud-vm/status | Trạng thái Azure thực, có powerStateCode |
| POST /api/cloud-vm/start | Gửi start ARM, trả 202 sau khi nhận thao tác |
| POST /api/cloud-vm/stop | Gửi **deallocate**, không chỉ shutdown guest |
| POST /api/cloud-vm/desktop-session | Tạo ticket Desktop cho lab hợp lệ |
| POST /api/cloud-vm/powershell | Chạy lệnh trên Azure guest |
| GET /api/cloud-vm/connect.rdp | RDP dự phòng, không nhúng password |

Nút **Bật Máy Ảo** đang ở thanh WindowsConsole. Nút **Tắt / Deallocate** nằm trong menu dấu ba chấm. Đừng viết lại một hệ bật/tắt khác làm mất cơ chế hiện có.

## 3. Chi phí: tính theo giờ học và tách khoản còn giữ khi tắt

Giá public retail Central India đã lấy ngày 20/10/2026, USD, chưa thuế. Dữ liệu: `.artifacts/azure-lab-plan-2026-10-20.json`.

| Cấu hình | RAM | Compute Windows Server/giờ | 30 giờ | 60 giờ |
| --- | ---: | ---: | ---: | ---: |
| B2ats_v2 hiện tại | 1 GiB | $0.0154 | $0.46 | $0.92 |
| B2s | 4 GiB | $0.0528 | $1.58 | $3.17 |
| B2as_v2 tham khảo, chưa duyệt | 8 GiB | $0.0584 | $1.75 | $3.50 |

Các số này chỉ là compute Windows Server; không dùng meter này làm báo giá chắc chắn cho Windows 11. B2s không mặc nhiên là rẻ nhất vì tên nghe giống máy cũ. B2ats_v2 rẻ hơn nhưng 1 GiB có thể hạn chế Desktop và nhiều role; phải đo trải nghiệm trước khi đề nghị resize. B-series có CPU credits, không thích hợp bài tải nặng kéo dài nếu không giải thích giới hạn.

**Dự toán $19–24 trước đây không giả định chạy VM 24/24.** Phần lớn là thêm OS disk, IP và snapshot giữ cả tháng. Dù Deallocate, các tài nguyên giữ lại vẫn có thể tính phí. Không hứa “tắt là bằng 0”.

Ví dụ tài nguyên hiện có, nếu giữ cả tháng theo retail: disk Premium P10 LRS khoảng $19.71/tháng và Standard IPv4 khoảng $3.65/730 giờ. Đây là ước tính từ SKU, không phải hóa đơn hay khẳng định credit đã trừ đúng số đó. Không đổi/xóa chúng tự động.

Hướng tối ưu cần khảo sát tiếp:

1. Dùng Server hiện có cho học thông thường và xây backend trước, **chưa thêm chi phí cố định của VM thứ hai**.
2. Kiểm tra phí thực trong Cost Management/Education trước khi đưa ra quyết định; không chỉ nhìn giá compute.
3. Xem Standard SSD/HDD có đáp ứng Desktop không rồi so giá OS disk cùng dung lượng; đổi SKU ổ là thao tác riêng cần kế hoạch dừng máy và kiểm tra. Không tự đổi trong lúc người dùng học.
4. Chỉ một baseline cần thiết; không snapshot sau mỗi lần mở bài, không để nhiều ổ phục hồi tính phí vô hạn.
5. Chỉ cân nhắc máy Windows 11 mới khi bắt đầu bài desktop cần nó; so B2s, B2als_v2 hoặc SKU được phép khác theo giá thật/hiệu năng. Chưa có giá B2als_v2 trong bản kiểm kê, phải tra thêm. **Windows 11 cần tối thiểu 4 GB RAM**, không sao chép cấu hình 1 GB của Server sang client.
6. Không giảm OS disk thấp hơn image tối thiểu hoặc giả định thu nhỏ OS disk có sẵn được hỗ trợ. Không xóa/recreate hàng ngày nếu chưa có quy trình phục hồi đáng tin cậy.

Tài liệu Microsoft ghi Student/Free Trial được triển khai Windows 11 cho dev/test. Khi chọn image cụ thể vẫn kiểm tra điều khoản và validation. Không suy rộng thành quyền phục vụ desktop production.

## 4. Bật/tắt chỉ khi học: hành vi cần hoàn thiện

Giữ nguyên nút thủ công; làm rõ trạng thái: Tắt, Đang bật, Sẵn sàng, Đang tắt, Lỗi. Hiển thị **Tắt VM** dễ thấy hơn menu dấu ba chấm nếu người học hay quên. Chỉ status từ ARM mới quyết định trạng thái cuối; trả 202 không có nghĩa VM đã sẵn sàng.

- Start do người dùng bấm hoặc chấp thuận trong luồng bắt đầu lab. Không tự start khi chỉ xem danh sách khóa, refresh trang, mở chatbot hoặc thăm một route.
- Desktop và terminal cùng target/phiên; VM chưa sẵn sàng thì báo chờ đúng trạng thái, không hiện “đã kết nối”.
- Stop thực hiện Deallocate, có thông báo các phiên trên máy sẽ ngắt; không chỉ gọi `Stop-Computer` hoặc Azure powerOff.
- Nên có thời hạn phiên cấu hình được và nhắc trước khi hết giờ; cho người học gia hạn. Xác định thời gian nhàn rỗi từ tương tác thực, không tính status polling là hoạt động học.
- Đóng tab hoặc trình duyệt crash vẫn phải có đường tắt dự phòng. Không dựa duy nhất vào `beforeunload`, WebSocket disconnect hoặc timer trong Node local: máy cá nhân tắt thì các cơ chế đó ngừng chạy.
- Chọn phương án Azure-side phù hợp sau khi so chi phí: lịch auto-shutdown cố định, hoặc cơ chế deallocate theo thời hạn có xác thực. Lịch shutdown cố định chỉ là dự phòng theo giờ, không tự tương đương idle timeout. Sau khi chạy phải kiểm tra powerState thực sự Deallocated.
- Không reset/xóa ổ khi chỉ Stop; người học có thể muốn tiếp tục bài. Tách rõ “Tắt VM”, “Tiếp tục phiên” và “Làm lại bài”.
- Nếu VM đang inject/reset/verify thì điều phối một hàng đợi theo VM; Stop không được chen ngang và vẫn báo thành công giả.

## 5. Hệ thống nạp lỗi: phải chuẩn bị trước khi đụng guest

Luồng mục tiêu: **baseline tốt → tạo/xác nhận đường khôi phục → inject → chứng minh lỗi tồn tại → giao ticket → học viên sửa → kiểm tra chức năng → reset → xác nhận sạch**.

Mỗi scenario cần metadata: ID/version, OS/role hỗ trợ, user bị ảnh hưởng, tài nguyên do lab sở hữu, baseline check, script inject đã duyệt, fault probe, success probe, negative tests, cách reset và thời hạn phiên. Chỉ nhận scenario ID phía client; không cho chatbot/client gửi tùy ý script phá lỗi vào endpoint inject.

Phân biệt rõ:

- **Nội dung đã nhập**: đọc được bài.
- **Môi trường sẵn sàng**: role/tool/user/resource đã có thật.
- **Sự cố đã nạp và xác minh**: probe cho thấy triệu chứng.
- **Bộ chấm đã kiểm thử**: chưa sửa trượt, sửa đúng đạt, sửa quá quyền trượt.

Không gắn tất cả Ready chỉ vì đủ JSON. Mã routes/courses và readiness từng có nhánh Windows override; phải kiểm tra lại khả năng bắt đầu/chấm/reset giữa API cho nhất quán. Các bài AD/IIS hiện có không chứng minh các role này đã cài trên VM.

**Không nạp lỗi vào Server hiện tại trước khi có baseline và thử khôi phục.** Giai đoạn chưa có máy riêng, có thể xây engine và scenario bằng mock, chuẩn bị script giới hạn vào tài nguyên lab rồi trình phương án baseline; không tự tắt dịch vụ hệ thống, đổi management NIC/DNS hay promote domain controller.

Reset toàn máy trên Azure phải tính managed disk, NIC/NSG, security generation, vTPM/device encryption và tài nguyên phụ thuộc. Snapshot OS disk không tự bao gồm mọi thứ. Script undo không đủ hoàn nguyên mọi thay đổi tự do của học viên. Nếu dùng cùng Server tiết kiệm chi phí, phải có lease độc quyền và chính sách giữ bài cũ; không reset âm thầm làm mất thực hành khác. Bài phá lỗi toàn hệ thống cần VM riêng hoặc VM được người dùng chấp nhận là có thể làm lại toàn bộ.

Run Command chạy SYSTEM, phụ thuộc VM Agent và outbound Azure, thường mất từ khoảng 20 giây. Không nạp lỗi làm mất Agent/outbound trong pilot. Kiểm tra quyền user/HKCU bằng đúng user, không lấy SYSTEM làm đại diện. PowerShell Direct trên máy cá nhân không quản lý Azure VM.

Pilot đầu nên là dịch vụ/ứng dụng và thư mục **do lab tạo**, không làm hỏng dịch vụ quản lý Azure. Các tình huống: dịch vụ mẫu bị disable, sai quyền thư mục dữ liệu của app, sai binding/cổng app, rule firewall giới hạn cổng app, share/NTFS không khớp. Với từng bài chỉ chọn tình huống có môi trường chuẩn bị được trên máy nhỏ; không cài đồng loạt IIS/AD/DNS vào VM 1 GiB.

## 6. Lộ trình nội dung đề xuất

Các số dưới là mục tiêu phát triển, **không phải bài đã hoàn thành**. Nên triển khai theo từng nhóm 3–5 bài có kiểm thử thật.

| Chặng | Chủ đề | Mục tiêu dự kiến |
| --- | --- | ---: |
| Windows nền tảng | User/admin/UAC, NTFS, process/service, Registry, Event Viewer, tools | 10 bài |
| Windows 11 IT Support | Tài khoản/profile, ứng dụng/startup, máy in, dung lượng, update/recovery | 12 bài |
| Mạng và tài nguyên | IP/subnet/gateway/DNS/DHCP/proxy/firewall/SMB, khoanh vùng lỗi | 10 bài |
| PowerShell chẩn đoán | Object/pipeline/help/filter/error/log/report, học xen kẽ từ đầu | 8 bài |
| Windows Server/Domain | AD DS, DNS, OU/user/group, GPO, file server | 12 bài |
| Vận hành và điều tra | Sysinternals, PerfMon, ghép bằng chứng, incident report, phòng ngừa | 8 bài |

Mỗi bài phải có: cơ chế bình thường, thuật ngữ, sơ đồ phù hợp, triệu chứng, giả thuyết, cách thu thập bằng chứng, GUI và PowerShell tương đương, lý do chọn cách sửa, kết quả mong đợi, xác nhận dưới user bị ảnh hưởng, phòng ngừa và câu hỏi hiểu bản chất.

Ba chế độ dùng cùng scenario: **học có hướng dẫn**, **ticket với gợi ý tăng dần**, **challenge không lời giải trong lúc làm**. Ví dụ cùng lỗi truy cập web bằng tên không được có thể do DNS, hosts hoặc proxy; sau nền tảng mới thêm biến thể để tránh học thuộc một lệnh.

Chấm theo chức năng và quyền đúng, chấp nhận nhiều cách sửa bằng GUI/PowerShell. Không chỉ thấy command xuất hiện trong history là đạt. Tắt toàn bộ firewall hay cấp Everyone Full Control không được coi là cách sửa hợp lệ. Kết quả sửa được lỗi và điểm giải thích nguyên nhân là hai tiêu chí riêng; AI chỉ hỗ trợ nhận xét, không tự xác nhận máy đã sửa.

Về ảnh: dùng ảnh chụp Windows thật đúng phiên bản và môi trường bài; ghi nguồn nếu dùng tài liệu tham khảo. Không tạo ảnh AI giả giao diện rồi gọi là bằng chứng thực tế.

## 7. Các việc triển khai theo thứ tự

1. Đọc các file ở mục 2, chạy test hiện có, giữ nguyên Desktop/bật tắt và bài Linux. Không ghi đè thay đổi đang làm của agent khác.
2. Hoàn thiện UX bật/tắt và phương án tắt dự phòng trên Azure; đo compute chỉ phát sinh khi học. Báo chi phí cố định riêng.
3. Xây engine scenario + state machine + durable journal + lease trên mock, chưa inject thật. Chuẩn bị một bài service mẫu có giải thích đầy đủ.
4. Trình phương án baseline/reset cho VM hiện có hoặc VM nhỏ riêng; xác định chi phí, quyền thao tác và dữ liệu sẽ mất khi reset. Thử khôi phục trước khi mở inject.
5. Chạy một pilot đầu-cuối có negative tests, GUI/PowerShell repair và reset. Ghi bằng chứng thật, không dùng mock để tuyên bố cloud end-to-end đạt.
6. Khi cần Windows 11, tra giá và availability B-series, điều kiện image/license rồi chuẩn bị lệnh tạo bằng Azure CLI hoặc ARM. Không mặc định máy 8 GiB hoặc cụm ba máy.
7. Khi thêm client, chuyển cấu hình từ một global VM sang registry server/client: status, start/stop, Desktop ticket, execute, verify, reset phải dùng cùng target. Giữ tương thích các bài Server cũ.
8. Mở rộng khóa theo nhóm có chuẩn bị/verify thật; domain lab nhiều máy làm sau vì chi phí và reset phức tạp hơn.

## 8. Công cụ và kiểm tra bàn giao

Azure CLI cục bộ: `.tools/azure-cli/Scripts/python.exe -m azure.cli`. Đăng nhập qua `scripts/azure-login.ps1` nếu phiên hết hạn. Không in `account get-access-token` hoặc env credentials.

Theo `C:\Users\HP VICTUS\.codex\RTK.md`, lệnh shell phải có tiền tố `rtk`. Ví dụ kiểm tra đọc:

```powershell
rtk proxy .tools/azure-cli/Scripts/python.exe -m azure.cli vm show -g LabEx-India-RG -n LabEx-WinServer -d --query "{size:hardwareProfile.vmSize,state:powerState}" -o json
rtk proxy python scripts/audit-azure-lab-plan.py --keys vm,disks,quota,sizeSpecs
rtk proxy node --test tests/cloudVm.test.js
```

Không cung cấp lệnh create trong tài liệu này như một lệnh “cứ chạy”: người dùng chưa chốt cấu hình mới/chi phí mới và chưa chọn số máy. Khi chuẩn bị deployment cần secure parameter cho mật khẩu, IP nguồn RDP cụ thể, image/version/SKU được phép; không dùng RDP `*`, không tái sử dụng password trong tài liệu cũ.

Tiêu chí nghiệm thu chính: xem khóa không tự bật VM; start/stop đúng ARM; stop đến Deallocated; crash/đóng web có đường tắt dự phòng; không làm mất bài khi chỉ stop; inject lỗi có thật; chưa sửa không đạt; sửa đúng dưới user phù hợp thì đạt; reset về baseline; không lộ credentials; chưa chuẩn bị được thì báo chưa sẵn sàng.

## 9. Tài liệu tham khảo

- [Azure power state và billing](https://learn.microsoft.com/en-us/azure/virtual-machines/states-billing)
- [Basv2 — RAM và CPU credits](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/basv2-series)
- [Azure Windows 11 — ghi chú Student/dev-test](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/windows-desktop-multitenant-hosting-deployment)
- [Yêu cầu Windows 11](https://learn.microsoft.com/en-us/windows/whats-new/windows-11-requirements)
- [Run Command và giới hạn](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/run-command)
- [Snapshot managed disk](https://learn.microsoft.com/en-us/azure/virtual-machines/snapshot-copy-managed-disk)
- [DNS troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshoot-dns-guidance)
- [AD DS learning path](https://learn.microsoft.com/en-us/training/paths/deploy-manage-active-directory-domain-services/)
- [Sysinternals Process Monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon)

Tài liệu liên quan trong repo: `docs/WINDOWS_IT_SUPPORT_SYSTEM_LAB_PROPOSAL_2026-10-20.md`, `docs/AZURE_WINDOWS_LAB_PREFLIGHT_2026-10-20.md`. File `infra/azure/windows-support-lab.plan.json` đã đánh dấu **rejected/reference-only**; không triển khai theo đề xuất đó.

## 10. Prompt người dùng có thể gửi Antigravity

> Đọc ANTIGRAVITY_WINDOWS_CLOUD_HANDOVER.md và các file code được chỉ ra trong đó. Tôi muốn Windows IT Support/System lab chạy trên Azure VM thật, dùng B-series tiết kiệm, bật khi học và Deallocate ngay trên web khi nghỉ; không chạy 24/24, không tạo phương án $30/tháng mà tôi đã từ chối. Giữ Desktop/PowerShell và chức năng bật/tắt hiện có. Trước tiên kiểm tra code, hoàn thiện quản lý phiên và phương án tắt dự phòng, xây bộ nạp lỗi/kiểm tra/reset cùng một bài pilot có hướng dẫn giải thích cơ chế. Chưa phá VM đang dùng khi chưa có baseline và thử phục hồi. Sau đó đề xuất cấu hình Windows 11 nhỏ nhất phù hợp bài học, báo rõ compute theo giờ học và disk/IP/snapshot giữ khi tắt; cho tôi xem phương án trước khi tạo tài nguyên mới. Góp ý thêm về lộ trình IT Support → System, cách học guided/challenge và cách kiểm chứng kỹ năng như thực tế. Báo trung thực những phần đã chạy cloud thật, phần chỉ có mock và phần chưa làm.
