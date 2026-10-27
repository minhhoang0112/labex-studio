# Kế hoạch xây dựng lại lộ trình Windows theo công việc thực tế

Ngày lập: 26/10/2026. Trạng thái: **thiết kế để triển khai, chưa phải giáo trình đã hoàn thành**.

Tài liệu này thay định hướng “bổ sung lời giải thích cho các bài cũ” bằng một chương trình mới. Giữ các tài liệu trước để truy vết, nhưng dùng bản này làm kế hoạch chính. Người học ưu tiên IT Support, sau đó System và dự án doanh nghiệp nhỏ để trình bày trong CV. Lượt lập kế hoạch không xóa bài, reset VM, thay mạng hoặc mua tài nguyên.

## 1. Vấn đề phải giải quyết

- Danh mục hiện tại chia theo tên công nghệ nhưng chưa tạo được chuỗi công việc rõ ràng; 70 lab tồn tại không đồng nghĩa 70 tình huống thực hành đạt chất lượng.
- Nhiều task yêu cầu chạy collector dài; người học làm ra báo cáo nhưng chưa tự cấu hình hoặc sửa lỗi.
- Lý thuyết, lời giải và tiêu chí chấm lẫn nhau; có bài nhìn vào không biết phải thao tác ở đâu.
- Phép kiểm quan sát không được diễn giải thành năng lực khắc phục. SYSTEM trên Server đọc được file chưa chứng minh nhân viên dùng CLIENT01 truy cập được.
- Quyền truy cập, dữ liệu mẫu, cách đặt tên và reset phải thống nhất giữa đề, môi trường và bộ chấm.
- Điều hướng mất ngữ cảnh khiến người học liên tục phải tìm lại khóa.

Quyết định: biên soạn lại phần lớn Windows. Tái sử dụng runtime/validator chỉ sau khi kiểm chứng; không lấy số lượng bài cũ làm mục tiêu giữ lại.

## 2. Mục tiêu đầu ra và cách học

Sau chương trình cốt lõi, người học phải tự bàn giao máy trạm, xử lý ticket có bằng chứng, quản lý tài khoản domain và nhóm vai trò, triển khai ổ dữ liệu/share/NTFS, áp GPO trên client, khôi phục dữ liệu và giải thích các giới hạn của hệ thống.

Windows cũng cần hiểu lệnh, nhưng các khóa đầu ưu tiên GUI: Settings, Computer Management, Event Viewer, Task Scheduler, Disk Management, ADUC, GPMC, DNS Manager và Server Manager. PowerShell xuất hiện dưới dạng lệnh ngắn để kiểm chứng hoặc thực hiện thao tác lặp; tự động hóa mở rộng học sau khi đã tự làm được bằng GUI. Tài khoản local và NTFS có cả trên máy trạm; tài khoản domain và quản trị tập trung thuộc nhánh Server.

Mục tiêu thiết kế mỗi buổi: khoảng 70% thời gian thao tác, 20% đọc giải thích/gợi ý theo ngữ cảnh, 10% tự giải thích và bàn giao. Đây là mục tiêu của sản phẩm, không phải tiêu chuẩn Microsoft.

Ba cách học dùng cùng tiêu chí đầu ra:

1. **Học có hướng dẫn:** có đường dẫn GUI và ảnh chụp thật từ phiên bản Windows đang dùng; giải thích ngay tại thao tác.
2. **Tự thực hiện:** chỉ có đề, dữ liệu đầu vào, yêu cầu và tiêu chí; mở gợi ý từng mức nếu cần.
3. **Xử lý ticket:** nạp một lỗi đã kiểm chứng, không lộ nguyên nhân trong tên bài; phải chẩn đoán, sửa và thử lại.

Không tính ba cách học là ba bài mới để tăng số lượng. Kiến thức quan trọng được dùng lại ở bài sau, với dữ liệu và nguyên nhân khác.

## 3. Lộ trình mới: 8 khóa, 64 bài dự kiến

Số lượng là phạm vi thiết kế, không phải số bài sẵn sàng. Mỗi khóa có bài tự làm và ticket tổng hợp. Các điều kiện hạ tầng chưa đáp ứng được ghi ở mục 6.

### W01 — Nhận máy và bàn giao máy trạm (6 bài)

Các kiến thức nền gắn trực tiếp với việc bàn giao; không dựng nhiều bài chỉ đọc thông số.

1. Nhận yêu cầu máy cho nhân viên: xác định user, phần mềm, dữ liệu và tiêu chí bàn giao.
2. Tạo tài khoản local thường, đăng nhập và phân biệt thao tác cần quyền quản trị.
3. Cài một ứng dụng từ nguồn chính thức; kiểm chữ ký, phiên bản, phạm vi cài và chạy dưới user thường.
4. Bố trí dữ liệu người dùng, quyền thư mục và sao lưu trước khi thay đổi.
5. Kết nối tài nguyên công việc, kiểm tên máy/mạng/cổng ứng dụng theo checklist ngắn.
6. Đề bàn giao máy độc lập: người dùng đăng nhập, mở ứng dụng, lưu tài liệu, phục hồi một bản mẫu.

### W02 — IT Support: xử lý sự cố máy trạm (12 bài)

1. Ứng dụng chỉ lỗi với một người dùng: phân biệt profile, cấu hình và phạm vi cài.
2. Cài/nâng phiên bản thất bại: đọc log thật, chọn phương án sửa hoặc rollback.
3. Admin lưu được nhưng nhân viên không lưu được: đúng identity, đúng quyền thư mục.
4. File đang được ứng dụng giữ: tìm handle/process, đóng đúng ứng dụng, giữ dữ liệu.
5. Ứng dụng không chạy vì cấu hình hoặc dependency của dịch vụ riêng.
6. “Máy chậm”: so mẫu trước/trong/sau, phân biệt CPU, RAM và I/O bằng workload giới hạn.
7. Không lưu được vì dung lượng/quota trên volume lab; xử lý đúng nguyên nhân.
8. Không vào được ứng dụng nội bộ: phân lớp DNS, TCP và lỗi ứng dụng; không bắt đầu bằng reset mạng.
9. Máy in/queue/port sai: chỉ xuất bản khi có đích in thực hoặc virtual printer với kết quả kiểm chứng rõ.
10. Backup có lịch nhưng không tạo bản mới: account thực thi, quyền đích và kết quả job.
11. Khôi phục tài liệu bị mất/ghi đè: chọn recovery point, kiểm dữ liệu sau restore.
12. Ca trực tổng hợp: nhiều ticket độc lập, ưu tiên xử lý, giới hạn ảnh hưởng và bàn giao.

MSI/ứng dụng thật phải được chọn và thử vòng cài–gỡ–cài lại trước khi viết bài. Không lấy script in chữ làm ứng dụng thương mại. Driver vật lý, Wi-Fi, lỗi phần cứng và Office chưa có license không được giả thành lab cloud hoàn chỉnh.

### W03 — Domain và vòng đời nhân viên (8 bài)

1. Dựng AD DS/domain trên Server sạch trong môi trường riêng — có gate hạ tầng, không tháo domain đang dùng.
2. Kiểm DNS của domain, tìm DC và chuẩn bị CLIENT01 gia nhập.
3. Join domain, reboot và đăng nhập bằng user domain; phân biệt local/domain login.
4. Tổ chức OU theo mục đích quản lý; tạo user/nhóm cho phòng ban.
5. Onboarding một nhân viên từ phiếu yêu cầu: account, nhóm, quyền và đăng nhập thử.
6. Helpdesk reset/unlock theo quyền được giao; không cấp Domain Admin.
7. Chuyển phòng ban: thêm quyền cần, thu hồi quyền cũ và kiểm bằng token mới.
8. Offboarding: vô hiệu hóa, thu hồi quyền, bảo toàn dữ liệu và kiểm không đăng nhập/truy cập được.

### W04 — Ổ dữ liệu, File Server và phân quyền phòng ban (10 bài)

1. Nhận diện ổ lab theo disk identity, initialize GPT, tạo volume NTFS bằng Disk Management.
2. Chia volume/đặt mount point hoặc drive letter, nhận biết unallocated space.
3. Mở rộng volume dữ liệu và chứng minh file/hash trước đó còn nguyên.
4. Dựng cây thư mục phòng ban và quy định ai được xem/sửa/quản trị.
5. Tạo SMB share, kiểm đường UNC từ CLIENT01.
6. Cấp quyền theo nhóm vai trò và nhóm tài nguyên; tách share permissions và NTFS.
7. Thử user Finance đọc/ghi, user khác bị từ chối, admin phục vụ quản trị.
8. Access-based enumeration và nhóm chéo phòng ban; ẩn tên không thay kiểm quyền.
9. Quota/cảnh báo dung lượng bằng FSRM; tái hiện hết quota trong phạm vi nhỏ.
10. Ticket “được cấp nhóm nhưng vẫn Access denied”: token, inheritance, share/NTFS và phiên SMB cũ.

### W05 — GPO và quản lý máy trạm tập trung (8 bài)

1. Tạo/link GPO vào OU lab; phân biệt User/Computer Configuration.
2. Áp cấu hình máy trạm có thể quan sát được; đối chiếu kết quả trên CLIENT01.
3. Map ổ mạng theo nhóm và kiểm bằng user mục tiêu.
4. Cấu hình một chính sách vận hành thực tế trong OU riêng; kiểm cả đối tượng ngoài scope.
5. Security filtering, kế thừa và thứ tự áp dụng; dự đoán trước khi thử.
6. Ticket GPO không áp: OU, link/filter, refresh, thời điểm logon và RSoP.
7. Rollback một thay đổi GPO, kiểm cấu hình hiệu lực sau quay lui.
8. Đề độc lập: onboarding phòng ban mới với account, share và GPO.

### W06 — DNS và dịch vụ nội bộ (8 bài)

1. Forward/reverse zone và record phục vụ ứng dụng lab.
2. Sai tên/sai IP/cache: query từ client, đối chiếu authoritative và resolver.
3. Triển khai IIS bằng site/pool/identity riêng, truy cập từ CLIENT01 qua mạng riêng.
4. HTTP 404/403/503: kiểm URL, quyền, identity, pool và log theo ticket.
5. Binding/hostname và chứng chỉ HTTPS lab; phân biệt chuỗi tin cậy, tên và thời hạn.
6. Ticket tổng hợp DNS–TCP–HTTP, chỉ sửa lớp gây lỗi.
7. DHCP scope/options/reservation với client nhận lease thật — chỉ mở khi có mạng cô lập/relay được kiểm chứng.
8. DHCP lỗi option/hết pool và renew có kiểm soát — cùng gate như bài 7.

### W07 — Backup, phục hồi và vận hành an toàn (8 bài)

1. Chọn dữ liệu, lịch, retention và mục tiêu phục hồi từ yêu cầu công việc.
2. Backup dữ liệu đầy đủ, xử lý quyền tài khoản chạy job và theo dõi thất bại.
3. Restore một file/phiên bản ra vị trí kiểm chứng; giữ dữ liệu mới ngoài phạm vi.
4. Restore quyền của thư mục/share và kiểm từ hai user trên CLIENT01.
5. Backup/rollback cấu hình IIS hoặc GPO sau thay đổi sai.
6. Nhật ký và audit cho một thay đổi/quyền truy cập; đọc evidence, không tạo log giả.
7. Tự động hóa một việc đã làm bằng GUI: đọc input, kiểm lỗi, ghi log, chạy lại an toàn.
8. Diễn tập phục hồi dịch vụ và bàn giao runbook. System-state/AD restore toàn domain là phần mở rộng cần môi trường bản sao riêng.

### W08 — Dự án doanh nghiệp nhỏ và kiểm tra cuối lộ trình (4 bài lớn)

1. Thiết kế: sơ đồ mạng/identity, phòng ban, ma trận quyền, dữ liệu và kế hoạch backup.
2. Triển khai từ yêu cầu: domain, CLIENT01, user/group, volume/share, GPO và intranet.
3. Ca trực có ticket chưa biết trước nguyên nhân; sửa tối thiểu, kiểm đúng user và kiểm vùng không bị ảnh hưởng.
4. Bàn giao: sơ đồ thực tế, cấu hình chính, bằng chứng allow/deny/restore, runbook và giải thích quyết định.

Dự án này có thể phát triển dự án CV hiện có thành một dự án hoàn chỉnh. Chỉ ghi các phần đã tự triển khai và giải thích được; cần đọc lại CV/tài liệu dự án trước khi gắn tên hoặc mô tả cụ thể.

## 4. Mẫu một bài học mới

Màn hình đầu phải trả lời được trong khoảng 30 giây: **ai cần gì, đang lỗi gì, thao tác trên máy nào, nộp kết quả gì**.

- Ticket: 3–6 dòng, triệu chứng và ảnh hưởng; không đặt tên bài làm lộ ngay nguyên nhân ở chế độ thử thách.
- Mục tiêu: 3–5 kết quả kiểm chứng được.
- Máy/danh tính: CLIENT01, Server hay cả hai; đang dùng account nào, cần quyền nào.
- Dữ liệu có sẵn: tài nguyên nào do hệ thống chuẩn bị, tài nguyên nào học viên phải tạo.
- Bản chất: thường 100–200 từ, giải thích đúng kiến thức đang cần.
- Thực hành: các yêu cầu đánh số; hướng dẫn GUI chỉ mở ở chế độ hướng dẫn/gợi ý.
- Kiểm tra kết quả: theo từng tiêu chí, chỉ ra điều đang thiếu và bằng chứng quan sát được.
- Bàn giao: 3 câu ngắn về nguyên nhân, thay đổi và kết quả; không yêu cầu chép báo cáo JSON.

Ba mức gợi ý: nơi cần kiểm tra → cách đọc kết quả → thao tác cụ thể. Lời giải đầy đủ tách riêng. Đánh dấu đã xem lời giải để người học tự biết mức độc lập, không giả đó là lần thi chưa hỗ trợ.

Ảnh phải là screenshot thật đúng Windows/GUI của lab, có vị trí thao tác và alt text. Không dùng ảnh AI giả giao diện để dạy cấu hình. Quyền click khác nhau giữa phiên bản Windows phải có chú thích ngắn.

## 5. Ví dụ đặc tả hoàn chỉnh: thư mục Finance

**Đề:** Finance cần thư mục dùng chung. Nhân viên Finance được tạo/sửa/xóa tài liệu; Sales không được đọc; người quản trị duy trì được quyền quản trị. Công ty yêu cầu cấp theo nhóm, không cấp trực tiếp từng user. Thực hiện từ Server, kiểm trên CLIENT01.

**Đầu vào:** domain/private path khỏe; volume dữ liệu đã tạo; hai user Finance/Sales có mật khẩu dùng riêng trong phiên lab; tài khoản quản trị học viên; share/nhóm đích chưa được cấu hình. Backend không tạo sẵn lời giải.

**Người học làm:** vẽ ma trận quyền → tạo nhóm và membership → tạo thư mục/share → đặt share/NTFS → đăng nhập Finance thử đọc/ghi → đăng nhập Sales thử truy cập → sửa nếu cần → bàn giao. Gợi ý GUI: ADUC, Explorer Security Advanced, Advanced Sharing, CLIENT01 Explorer. Hệ thống giữ mật khẩu ngoài nội dung chat/log.

**Điểm kỹ thuật 100:**

- 70: tài nguyên đúng, membership đúng, Finance tạo/đọc/sửa/xóa một tệp thăm dò mới qua SMB, Sales bị từ chối đọc.
- 20: không cấp thừa Everyone/Authenticated Users quyền ghi; không thêm user vào nhóm admin; nhóm đúng vai trò.
- 10: kiểm dữ liệu ngoài phạm vi còn nguyên và hoàn nguyên phần thử theo manifest.

Đạt từ 80 nhưng bắt buộc đạt các tiêu chí cốt lõi: Finance hoạt động, Sales bị từ chối và không leo quyền. Không cộng điểm nhiều mục phụ để vượt qua lỗi bảo mật chính.

**Các ca phải bị trượt:** chỉ tạo thư mục chưa share; share đúng nhưng NTFS sai; cấp quyền trực tiếp sai yêu cầu nhóm; cấp Everyone Full control; chấm dưới SYSTEM thay user; token cũ; chỉ có file output cũ; chỉ sửa báo cáo; timeout/mất kết nối.

**Tên tài nguyên:** ví dụ trong hướng dẫn không bắt buộc giống từng ký tự nếu bài cho tự đặt. Học viên chọn tên hợp lệ khi tạo phiên; backend ánh xạ vai trò → tài nguyên/SID/GUID trong manifest. Với đề có tên cố định để hệ thống khác tìm đến, phải ghi rõ ngay trong yêu cầu. Không dùng so khớp mờ để cấp nhầm quyền vào tài nguyên có tên gần giống.

**Câu hỏi hiểu bài:** quyền share và NTFS phối hợp thế nào; vì sao thêm nhóm đôi khi cần đăng nhập/phiên mới; vì sao ẩn share không phải phân quyền. AI hỗ trợ đánh giá riêng, không được tự đổi điểm kỹ thuật khi thiếu evidence.

## 6. Kiến trúc thực hành và điều kiện hạ tầng

### Mức A — một CLIENT01

Dùng cho W01/W02 và các bài file restore. Tài khoản thường disposable, thư mục/VHDX/task/service của lab có ownership. File lock và task ACL hiện có là ứng viên tái sử dụng sau audit; phải viết lại UI/đề theo mẫu mới.

### Mức B — Server + CLIENT01

Dùng cho AD/SMB/GPO/DNS/IIS. Trước triển khai phải đọc inventory thật: private IP, VNet/subnet/peering, domain, DNS, edition, role, disk và khả năng cứu hộ. Không tự đoán domain/IP từ tài liệu cũ.

Tận dụng hai VM B2s hiện có. Chỉ bật máy cần cho bài, shutdown 23:00 như cấu hình đã chốt. Xác minh người dùng cùng lúc trước khi deallocate; tắt đúng VM của phiên. Không tự nâng SKU hoặc thêm managed disk để làm cho đề chạy được.

Lab chia ổ dùng VHDX nhỏ có giới hạn dung lượng hoặc data disk riêng đã duyệt. Backend xác nhận disk unique ID/serial và ownership; không format theo số Disk 0/1 hoặc drive letter cố định. Không dùng ổ OS/Azure temporary disk làm dữ liệu cần bền vững. VHDX trên cùng OS disk chỉ là phương tiện tập Disk Management, không phải dự phòng vật lý.

Nếu Server hiện là DC, việc gộp File Server/IIS vào máy đó chỉ được mô tả là bố trí học tiết kiệm. Kiến trúc production nên tách vai trò phù hợp. Khả năng IIS/FSRM trên edition/role hiện có cần thử trước; không suy từ việc có module trong mã nguồn.

### Mức C — môi trường bổ sung, có gate

- Dựng domain từ đầu cần Server sạch riêng hoặc một chế độ lab cô lập đã có baseline và kiểm thử phục hồi; không demote/reimage DC đang dùng để phục vụ bài.
- DHCP thật cần mạng hỗ trợ giao dịch DHCP với client/relay. Hai VM Azure thông thường không tự thành một LAN broadcast.
- AD recovery, lỗi boot, BitLocker/TPM, disk failure, nhiều DC và hardware/printer thật cần điều kiện riêng. Chưa đủ thì giữ đề cương/đánh dấu ngoại tuyến, không tạo nút nạp lỗi giả.

Mọi hạ tầng bổ sung phải có phương án kỹ thuật, chi phí lúc bật/lúc tắt và nghiệm thu cụ thể trước khi đề nghị người dùng chọn.

## 7. Backend phải thay đổi

1. Contract phiên lab có revision, mode, prerequisites, tài nguyên sở hữu, mục tiêu theo vai trò và trạng thái thao tác. Dữ liệu học tách khỏi journal vận hành.
2. Chuẩn bị tạo đúng đầu vào; nạp lỗi phải thử baseline tốt → inject → chứng minh lỗi. Không tự thực hiện phần cấu hình học viên phải làm.
3. Chấm kết quả hệ thống; GUI hoặc lệnh đều được nếu đạt cùng tiêu chí. Không chấm bằng chuỗi lệnh mẫu hoặc marker do học viên tự ghi.
4. Hai máy cần bộ thử dưới đúng user/token và kiểm cả allow/deny. Secret theo phiên, giới hạn quyền, không trả password vào JSON giáo trình, chat hay log.
5. Fresh probe/nonce ngăn file cũ làm bằng chứng; kiểm cả nội dung, quyền, identity và tài nguyên ngoài phạm vi.
6. Các bài cùng VM dùng khóa thao tác; chấm khi inject/reset đang chạy phải báo đang bận. Retry không tạo trùng hoặc reset nhầm lab.
7. API trả criteria results và trạng thái `passed/failed/blocked/error`, không nhập timeout thành sai kiến thức. Có gợi ý kiểm tra tiếp theo, không in secret hay raw script dài.
8. Chuẩn bị/reset chạy job có operation ID, phase, elapsed time và lỗi phục hồi. UI không chỉ quay vòng “đang xử lý” vài phút. Không bỏ bước kiểm an toàn chỉ để tăng tốc.
9. Progress gắn revision: giữ lịch sử cũ, không tự chuyển điểm collector cũ thành đạt bài thực hành mới.

API đề xuất (chưa triển khai): `POST /api/lab-sessions`, `GET /api/lab-sessions/:id`, `POST .../prepare`, `POST .../verify`, `POST .../reset`, `GET /api/lab-operations/:id`. Schema chỉ định thao tác hợp lệ; không nhận script/probe từ trình duyệt. Phải tương thích các route Windows hiện có trong giai đoạn chuyển đổi.

## 8. Giao diện và điều hướng

### Lỗi đã xác định trong mã

`client/src/App.jsx`: `CourseDetail.onBack` luôn navigate `/learn`; `navigate()` luôn `scrollTo(0,0)`; `pushState` không lưu origin. Navbar Roadmaps luôn đi `/paths/linux`. Đây là nguyên nhân trực tiếp khiến quay về mất lộ trình Windows/vị trí đang xem.

### Hành vi cần có

- Lộ trình Windows → khóa → lab → trở về khóa → trở về đúng lộ trình Windows và đúng thẻ/vị trí cuộn.
- Browser Back/Forward và nút trong ứng dụng nhất quán; không đẩy vòng lặp course/lab vào lịch sử khi quay lại.
- Lưu origin, course ID, anchor và scroll theo history entry; lưu thêm session fallback cho refresh. Khôi phục sau khi dữ liệu/DOM sẵn sàng, không cuộn trước khi trang tải.
- Deep link không có origin: suy lộ trình từ metadata của khóa, không hard-code Linux/learn cho mọi trường hợp.
- Giữ tab, bộ lọc, khóa đang mở và bài đang đọc. Header có breadcrumb rõ Windows → Khóa → Bài.
- “Quay lại bước” khác “Trở về khóa”; rời bài không tự reset hoặc tắt VM.

### Bố cục bài

Trái: đề, yêu cầu, tiêu chí, gợi ý mở dần. Phải nhìn thấy việc cần làm trước một trang lý thuyết dài. Phải: Desktop đủ cao, chọn Server/CLIENT01 theo bài; thể hiện rõ máy và user hiện tại. Thanh điều khiển gọn; AI/voice không che thao tác.

Chấm xong hiển thị “Finance ghi được / Sales vẫn đọc được → cần sửa quyền”, thay vì một thông báo sai chung. Khóa chỉ được gắn sẵn sàng khi các bài trong phạm vi công bố đã nghiệm thu, không dựa vào số JSON.

## 9. Chuyển đổi giáo trình cũ

- Tạo nhánh curriculum v2, giữ v1 để tra cứu trong thời gian chuyển. Không xóa tiến độ hoặc sửa toàn bộ ID hàng loạt.
- Phân loại từng bài cũ: dùng lại runtime; viết lại đề; cần thay bộ chấm; chỉ để tham khảo; loại khỏi chuỗi chính.
- Bài đổi đuôi tệp/kiểm kê đơn giản chuyển thành bài phụ hoặc khởi động ngắn, không chiếm vị trí “ticket thực chiến”.
- Chưa publish hàng loạt thẻ “Ready” cho 64 đề dự kiến. Phân biệt đề cương, đang phát triển, đã kiểm thử VM và sẵn sàng học.
- Generator cũ không được ghi đè v2; cần quy tắc ownership/revision nguồn nội dung. Những hook nâng cấp cũ phải được cô lập khi chuyển sang nguồn v2.

## 10. Thứ tự thực hiện và cổng nghiệm thu

**P0 — nền học tập:** sửa back/scroll/origin; mock giao diện bài mới bằng một đề cụ thể; contract phiên/chấm/phân loại bài cũ. Kiểm browser Back/Forward, refresh, deep link, Windows/Linux không lẫn ngữ cảnh.

**P1 — nhánh IT Support dùng được:** hoàn thành W01 ngắn gọn và W02 theo ticket. Hai bài thử chuẩn đầu là user không lưu được và file bị giữ; chúng dùng để kiểm mô hình, không được báo toàn chương trình đã xong sau hai bài. Sau đó hoàn thành trọn phạm vi W02, mỗi bài có negative test và reset thật.

**P2 — nhánh System phục vụ dự án:** kiểm đường hai máy và identity probe; hoàn thành W03 → W04 → W05. Ưu tiên chuỗi tạo user → nhóm → share → allow/deny → GPO → chuyển phòng ban/offboard. Đây là mốc tạo được dự án có kết quả trình bày.

**P3 — dịch vụ và vận hành:** W06 phần DNS/IIS đủ hạ tầng, W07 và W08. DHCP/AD restore mở rộng chỉ mở sau khi provider tương ứng nghiệm thu.

Mỗi bài bắt buộc: review đề–fixture–grader cùng contract; chưa làm phải fail; GUI đúng phải pass; cách khác hợp lệ phải pass; sai identity/quyền quá rộng/output cũ phải fail; timeout/module thiếu phải blocked/error; reset xong rồi làm lại vẫn đúng. Test thật trên VM và từ client khi có client; unit test không thay nghiệm thu này.

Mỗi khóa chỉ công bố phạm vi đã xong sau khi một lượt học thử từ đầu thực hiện được theo đề, không phải người viết biết sẵn script. Thu phản hồi “tôi biết đang làm gì/chỗ nào không rõ” trước khi mở rộng hàng chục bài.

## 11. Nguồn và cách sử dụng

Tài liệu Microsoft làm căn cứ kỹ thuật; thứ tự khóa, ticket, giao diện và thang điểm ở trên là thiết kế của dự án. Nội dung biên soạn bằng tiếng Việt, không sao chép nguyên khóa. Với mỗi bài lưu URL, ngày đối chiếu, phiên bản Windows/role đã thử và giới hạn.

- [Windows app troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/windows-client/shell-experience/modern-inbox-store-apps-troubleshooting-guidance): kiểm ứng dụng theo user và dữ kiện thực, gắn W01/W02.
- [Windows user profiles](https://learn.microsoft.com/en-us/windows/win32/shell/about-user-profiles): phân biệt dữ liệu/profile theo user, gắn W01/W02.
- [Create and configure GPO](https://learn.microsoft.com/training/modules/create-configure-group-policy-objects-active-directory): scope/inheritance và cấu hình chính sách, gắn W05.
- [Manage Windows Server file servers](https://learn.microsoft.com/en-us/training/modules/manage-windows-server-file-servers/): NTFS, SMB, FSRM/VSS, gắn W04/W07.
- [Initialize new disks](https://learn.microsoft.com/en-us/windows-server/storage/disk-management/initialize-new-disks) và [extend a volume](https://learn.microsoft.com/en-ie/windows-server/storage/disk-management/extend-a-basic-volume): căn cứ thao tác Disk Management, gắn W04; kiểm điều kiện theo volume/file system thực.
- [Windows Server network infrastructure](https://learn.microsoft.com/en-us/training/paths/windows-server-network-infrastructure/): căn cứ DNS/DHCP, gắn W03/W06.
- [DHCP in Azure](https://learn.microsoft.com/en-us/azure/virtual-network/how-to-dhcp-azure): giới hạn broadcast và nhu cầu relay/client phù hợp; không đồng nhất với LAN trực tiếp.
- [IIS application pool identities](https://learn.microsoft.com/en-us/iis/manage/configuring-security/application-pool-identities): identity và quyền tài nguyên, gắn W06.
- [Monitor and troubleshoot Windows Server](https://learn.microsoft.com/en-us/training/paths/monitor-troubleshoot-windows-server-environments/): chủ đề vận hành/phục hồi mở rộng, không mặc định các thao tác recovery đều dùng được trên hạ tầng hiện tại.

Trước khi triển khai từng bài phải mở lại trang kỹ thuật đúng phiên bản và thử lệnh/GUI thực. Tên khóa hoặc số module của Microsoft có thể thay đổi; không gắn nhãn chứng chỉ cho chương trình local.
