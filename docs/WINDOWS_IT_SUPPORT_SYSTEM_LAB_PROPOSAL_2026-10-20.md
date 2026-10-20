# Đề xuất phòng lab Windows: IT Support → System Administrator

> Quyết định mới nhất: ưu tiên chi phí thấp và bật/tắt Azure VM ngay trên web khi học, không triển khai phương án máy mới $30/tháng. Xem [bàn giao Antigravity](../ANTIGRAVITY_WINDOWS_CLOUD_HANDOVER.md) để thực hiện đúng hướng đã sửa; các phần CLIENT01/DC01/SRV01 dưới đây là kiến trúc tương lai, không phải yêu cầu tạo ngay cả cụm.

Ngày đối chiếu: 20/10/2026. Đây là bản thiết kế để thống nhất hướng phát triển, chưa phải danh sách chức năng đã triển khai. Lượt khảo sát chỉ đọc mã và cấu hình máy, không cài phần mềm, tạo VM, nạp lỗi hoặc thay đổi máy ảo hiện có.

## 1. Hiện trạng và mục tiêu

Dự án hiện có 3 khóa, 15 bài Windows và 19 nhiệm vụ. Có Azure VM, điều khiển nguồn, Desktop trong trình duyệt và PowerShell qua Azure Run Command. Phần chuẩn bị môi trường, tạo sự cố, kiểm chứng lỗi đã xuất hiện và hoàn nguyên theo từng bài chưa thành một hệ thống hoàn chỉnh.

Một số mô tả đang rộng hơn tiêu chí thực hành. Ví dụ bài DNS/DHCP mới có thao tác Resolve-DnsName localhost; phần GPO mới có gpresult /r. Cần tách thành các bài nhỏ có mục tiêu, điều kiện môi trường và kết quả quan sát được.

Mục tiêu: nhận yêu cầu hỗ trợ, khoanh vùng lỗi, thu thập bằng chứng, giải thích nguyên nhân, sửa trong phạm vi cần thiết, kiểm tra từ góc nhìn người dùng và ghi biên bản xử lý.

## 2. Nền tảng Windows và máy ảo

Chọn Windows 11 làm máy trạm chính. Windows 10 22H2 đã hết hỗ trợ thông thường ngày 14/10/2025; có thể giữ một tuyến bài môi trường cũ riêng khi cần, không dùng làm mặc định cho lộ trình mới. Các chương trình ESU và phiên bản LTSC có vòng đời riêng. [Microsoft Lifecycle](https://learn.microsoft.com/en-us/lifecycle/announcements/windows-10-end-of-support).

Mô hình đích gồm ba vai trò, có thể triển khai dần:

| Vai trò | Công việc |
| --- | --- |
| CLIENT01 — Windows 11 | Người dùng thường, desktop, ứng dụng, proxy, máy in, profile, mạng, domain client |
| DC01 — Windows Server | AD DS, DNS, OU, user/group, GPO; có baseline riêng cho bài domain |
| SRV01 — Windows Server | File share, IIS, dịch vụ và ứng dụng mẫu để client thực sự truy cập |

Bài desktop độc lập chỉ cần CLIENT01. Bài domain cần CLIENT01 + DC01. Thêm SRV01 khi học dịch vụ doanh nghiệp. Không bắt buộc chạy cả ba cho mọi bài.

Hướng đã thống nhất với người học: các máy thực hành chạy trên Azure; máy cá nhân chỉ chạy web và kết nối Desktop. Không cần cài Hyper-V hay nâng RAM máy cá nhân cho cụm Windows này. Giai đoạn đầu ưu tiên một CLIENT01 độc lập, giữ nguyên Server hiện có; chưa tạo đồng thời cả ba máy.

Đối chiếu thêm ngày 20/10/2026: tài liệu triển khai Windows 11 của Microsoft ghi rõ tài khoản Student và Free Trial được phép triển khai Windows 11 cho phát triển/thử nghiệm. Đây là hướng sử dụng học tập được đề xuất cho Azure for Students hiện tại; không suy rộng thành quyền cung cấp desktop thương mại/production. Tài liệu dev/test khác vẫn đề cập Visual Studio subscription, nên cần đọc đúng ngoại lệ Student và xác minh image, điều khoản cùng kết quả kiểm tra triển khai của subscription cụ thể. [Windows 11 trên Azure — ghi chú Student/Free Trial](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/windows-desktop-multitenant-hosting-deployment), [Azure Windows client dev/test](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/client-images).

Chỉ nạp lỗi trên máy lab riêng sau khi đã kiểm tra baseline và đường khôi phục; không nạp lỗi lên LabEx-WinServer đang phục vụ các bài hiện có. Bản kiểm kê và cấu hình/chi phí cụ thể được lập riêng trước khi tạo tài nguyên tính phí.

## 3. Lộ trình giảng dạy dự kiến

Đây là mục tiêu nội dung để phát triển, không phải 60 bài đã có sẵn.

| Chặng | Mục tiêu | Số bài dự kiến |
| --- | --- | ---: |
| 1. Windows nền tảng cho IT Support | Cấu trúc hệ điều hành, user/admin, UAC, service/process, file, Registry, công cụ trợ giúp | 10 |
| 2. Windows 11 Desktop Support | Tài khoản, profile, ứng dụng, startup, máy in, thiết bị, dung lượng, cập nhật và khôi phục | 12 |
| 3. Mạng và tài nguyên doanh nghiệp | IP, subnet, gateway, DNS, DHCP, proxy, firewall, SMB, chia sẻ và xác thực | 10 |
| 4. PowerShell phục vụ chẩn đoán | Object/pipeline, trợ giúp, lọc dữ liệu, lỗi, log, báo cáo, script và kiểm tra kết quả | 8 |
| 5. Windows Server và Domain | AD DS/DNS, user/group/OU, GPO, file server, dịch vụ và quản lý quyền | 12 |
| 6. Điều tra sự cố và vận hành | Event Viewer, Reliability Monitor, Sysinternals, PerfMon, phục hồi và hồ sơ sự cố | 8 |

Học PowerShell xen kẽ từ chặng 1; không yêu cầu học hết scripting mới được thực hành GUI. Sau nền tảng, ghép Windows–Linux bằng SSH, SMB, DNS, HTTP và luồng xác thực. M365/Entra/Intune/VPN doanh nghiệp là nhánh sau, vì cần tenant, license và môi trường riêng.

Kiến thức và phương pháp dựa trên tài liệu Microsoft Learn, Microsoft Troubleshooting và Sysinternals; tình huống, dữ liệu và bộ chấm được viết riêng cho môi trường local. [AD DS learning path](https://learn.microsoft.com/en-us/training/paths/deploy-manage-active-directory-domain-services/), [DNS troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshoot-dns-guidance), [Process Monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon).

## 4. Mỗi bài phải dạy gì

Một bài có: sơ đồ thành phần → cơ chế hoạt động bình thường → triệu chứng → giả thuyết → cách kiểm chứng từng giả thuyết → sửa → xác nhận → cách phòng ngừa. Mỗi bước giải thích lệnh/công cụ đọc thông tin nào, cần quyền gì, kết quả bình thường ra sao và kết quả khác thường dẫn tới bước tiếp theo nào.

Ba chế độ dùng cùng một môi trường:

- Học có hướng dẫn: lý thuyết, thao tác GUI, PowerShell tương đương và giải thích kết quả.
- Xử lý sự cố: chỉ nhận ticket, có gợi ý tăng dần; chưa đưa ngay nguyên nhân và lệnh sửa.
- Kiểm tra: không có lời giải trong lúc làm; sau khi nộp có phân tích bằng chứng và cách xử lý khác phù hợp.

Ví dụ ticket: “Người dùng truy cập website nội bộ bằng IP được nhưng bằng tên không được”. Người học phải xác định ứng dụng, phạm vi ảnh hưởng và đường phân giải tên, kiểm tra DNS client, so sánh truy vấn với DNS đúng, rồi mới sửa. Cần kiểm tra website từ client sau sửa, không chỉ chấp nhận đã chạy ipconfig /flushdns.

Các bài biến thể có thể dùng cùng triệu chứng với nguyên nhân khác: DNS client sai, bản ghi sai, hosts ghi đè hoặc cache cũ. Ban đầu nạp một lỗi; chỉ ghép nhiều lỗi khi người học đã có quy trình khoanh vùng.

## 5. Thiết kế bộ nạp lỗi và vòng đời phiên

Luồng: **kiểm tra máy sạch → tạo mốc khôi phục → nạp lỗi → chứng minh lỗi tồn tại → giao ticket → người học sửa → kiểm tra chức năng → hoàn nguyên → kiểm tra máy sạch**.

Mỗi tình huống cần hợp đồng rõ ràng: nền tảng/role/version được hỗ trợ; tài khoản và quyền của người gặp lỗi; tài nguyên lab; phép kiểm tra trạng thái tốt; script nạp lỗi; bằng chứng lỗi; tiêu chí thành công; cơ chế hoàn nguyên và giới hạn thời gian/tài nguyên.

Chỉ nạp lỗi bằng script đã review và gắn ID tình huống phía backend. Khóa phiên tránh hai tab/người học cùng thay một VM. Nếu nạp lỗi thất bại hoặc trạng thái VM khác baseline thì báo lỗi chuẩn bị, không tính thành bài người học làm sai. AI không tự ý tạo hoặc thực thi script phá lỗi.

Giữ đường quản lý/cứu hộ ngoài các thành phần bài học được phép làm lỗi. Trên Azure, Run Command có thể hỗ trợ khi RDP lỗi nhưng không độc lập với toàn bộ mạng guest. PowerShell Direct của Hyper-V trên máy cá nhân không điều khiển trực tiếp VM Azure và không được dùng làm phương án cứu hộ ở đây. Các lỗi cắt mạng quản lý hoặc làm hỏng boot cần quy trình khôi phục ổ đĩa từ baseline qua Azure control plane đã thử thành công.

Azure Run Command hiện có phụ thuộc VM Agent và kết nối outbound; nó chạy dưới SYSTEM. Vì vậy không nạp lỗi vào VM Agent hoặc cắt toàn bộ kết nối cần để quản lý VM. Các lỗi mạng rộng và lỗi boot cần phương án cứu hộ khác trước khi đưa vào bài. [Giới hạn Run Command](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/run-command).

Baseline trên Azure dùng snapshot managed disk và ổ phục hồi tương thích, không gọi là checkpoint Hyper-V. Script undo chỉ thích hợp với thay đổi nhỏ đã biết, không đủ khôi phục mọi thao tác tự do của học viên. Snapshot ổ đĩa không bao gồm mọi thiết lập NSG, NIC, VM hoặc dữ liệu trên ổ khác; quy trình reset phải quản lý cả các thành phần đó. Khôi phục cụm AD cần tính nhất quán giữa DC và client; không xem snapshot DC như bản sao lưu AD đầy đủ. [Azure managed disk snapshot](https://learn.microsoft.com/en-us/azure/virtual-machines/snapshot-copy-managed-disk), [AD DS virtualization safeguards](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/introduction-to-active-directory-domain-services-ad-ds-virtualization-level-100).

## 6. Chấm kết quả như môi trường thật

Chấm quyền truy cập và chức năng bằng đúng user bị ảnh hưởng, ví dụ mở được tệp chia sẻ và đọc được nội dung chuẩn. Script SYSTEM đọc được file không chứng minh user thường đọc được. Chấp nhận cả GUI và PowerShell nếu đạt trạng thái yêu cầu.

Ngoài chức năng chính, kiểm tra người học không sửa bằng cách mở quyền quá rộng, tắt toàn bộ firewall hoặc phá dịch vụ khác của lab. Cho phép nhiều cách sửa hợp lệ; không bắt chép đúng một câu lệnh. Lịch sử thao tác dùng làm bằng chứng bổ sung, không thay thế kiểm tra chức năng.

Tách rõ “dịch vụ đã phục hồi” với “hiểu nguyên nhân”. Phần hiểu biết có câu hỏi và rubric về bằng chứng/nguyên nhân/ảnh hưởng; nhận xét AI chỉ hỗ trợ, không tự chứng nhận bài đạt. Có mẫu ticket và biên bản để người học lưu thành portfolio sau khi bỏ thông tin nhạy cảm.

## 7. Pilot trước khi mở rộng số lượng

Đợt A: sáu tình huống trên Server lab đã chuẩn bị, chưa cần domain hoặc Windows 11 mới:

1. Dịch vụ ứng dụng lab bị Disabled.
2. Dịch vụ lab không khởi động do tài khoản chạy hoặc quyền truy cập tài nguyên sai.
3. User lab mất quyền NTFS trên một thư mục dữ liệu.
4. Quyền Share và NTFS không khớp trên tài nguyên SMB lab.
5. Ứng dụng/web lab lắng nghe sai cổng hoặc binding.
6. Một rule firewall cụ thể chặn luồng tới ứng dụng lab.

Đợt B: thêm sáu tình huống Windows 11 sau khi chốt hạ tầng: DNS sai ở adapter thực hành; hosts ghi đè tên nội bộ; proxy sai theo user; tài khoản thực hành bị khóa; Print Spooler bị dừng; startup task thử nghiệm gây tải CPU có giới hạn.

Mỗi tình huống chỉ xuất bản sau khi kiểm tra: baseline thực sự tốt, nạp lỗi gây ra đúng triệu chứng, chưa sửa thì không đạt, sửa đúng thì đạt, sửa sai/mở quyền quá mức không đạt, reset trả về baseline và không ảnh hưởng bài khác. Theo dõi riêng độ ổn định của chuẩn bị/hoàn nguyên.

Lỗi boot, corruption hệ điều hành, BitLocker, driver kernel và bài nhiều máy đưa vào giai đoạn nâng cao sau khi có cứu hộ/khôi phục phù hợp. Các hỏng hóc vật lý như cáp, nguồn, RAM hoặc SSD cần phần hướng dẫn kiểm tra thiết bị và giới hạn mô phỏng, không giả vờ đã tái hiện đầy đủ bằng VM.

Event ID 41 chỉ là bằng chứng hệ thống tắt/khởi động lại không bình thường; không đủ kết luận nguồn hỏng hay một nguyên nhân cụ thể. Bài học cần dạy ghép nhiều bằng chứng. [Microsoft Event ID 41](https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/event-id-41-restart).

## 8. Thứ tự phát triển đề xuất

1. Chuẩn hóa chất lượng 15 bài hiện tại và định nghĩa sáu ticket pilot.
2. Xây hợp đồng baseline/inject/probe/verify/reset, khóa phiên và quyền thực thi theo user.
3. Chứng minh vòng đời đầu-cuối bằng một lỗi dịch vụ có thể hoàn nguyên, rồi hoàn thiện đủ sáu tình huống Server.
4. Triển khai Windows 11 trên Azure sau khi chốt cấu hình và ngân sách; kiểm chứng khôi phục rồi triển khai sáu tình huống Desktop.
5. Mở cụm domain nhiều máy và mở rộng lộ trình sau khi pilot có bằng chứng hoạt động ổn định.

Không gắn nhãn toàn bộ lộ trình đã sẵn sàng chỉ từ việc nhập đủ nội dung. Phải phân biệt có giáo trình, đã chuẩn bị VM, đã nạp được lỗi và đã kiểm chứng vòng đời thực hành.
