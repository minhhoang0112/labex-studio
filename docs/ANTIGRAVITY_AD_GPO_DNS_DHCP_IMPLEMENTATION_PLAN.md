# Playbook cho Anti: hoàn thiện hai khóa AD/GPO và DNS/DHCP

Ngày bàn giao: 2026-10-22. Đây là **kế hoạch triển khai và nghiệm thu**, chưa phải hai khóa đã được viết hoặc kiểm thử. Đọc toàn bộ trước khi tạo bài hay thay cấu hình VM.

## 1. Mục tiêu và kết quả phải bàn giao

Hoàn thiện đúng hai course ID đang có, không tạo khóa trùng:

1. `windows-active-directory-group-policy` — Active Directory và Group Policy chuyên sâu.
2. `windows-dns-dhcp-network-services` — DNS, DHCP và dịch vụ mạng Windows Server.

Mỗi khóa giữ **6 bài**, đề xuất **3 task/bài = 18 task/khóa** vì phần thực hành gồm chuẩn bị, thực hiện và xác minh. Tổng cộng 12 bài/36 task mới. Mỗi task phải có tiêu chí kiểm tra trạng thái thật, không chấm bằng việc đã gõ đúng câu lệnh, tạo file đúng tên hoặc nhấn “tôi đã làm”. Những câu hỏi lý thuyết không chấm được phải ghi rõ tự đánh giá.

Ưu tiên backend, bài giảng và kiểm thử. Tận dụng FE chung; chỉ sửa FE khi luồng mới thực sự cần. Không bỏ bớt thực hành hoặc đổi nhãn Ready để làm đủ số. Nếu môi trường chưa cho phép bài nào, bàn giao phần đã chạy và ghi chính xác phần bị chặn.

Mục tiêu học: hiểu bản chất, biết xác định phạm vi, đọc bằng chứng, sửa tối thiểu, kiểm tra chức năng, hoàn nguyên. Không chỉ đưa lệnh để sao chép.

## 2. Điểm xuất phát đã xác nhận

- Có hai target backend cố định `server` và `client`; VM hiện có mang tên `LabEx-WinServer` và `LabEx-CLIENT01`. CLIENT01 là Windows 11. **Chưa được mặc định tên domain, hostname DC, IP riêng, subnet, domain join hay quyền AD hiện tại.**
- Windows roadmap hiện có 15 khóa/6 chặng: 52 bài thật, 6 khóa có bài, 9 khóa đề cương, 54 bài còn dự kiến. Hai khóa trong tài liệu này nằm trong nhóm đề cương.
- Khóa Windows 11 nền tảng: 6 bài/12 task. Khóa mạng Windows: 6 bài/12 task. IT Support cũ có 25 bài. Không ghi đè các lab/đối tượng của các khóa đó.
- Lần kiểm cuối khóa mạng: 89/89 Node tests đạt; 12/12 task chạy trên CLIENT01 thật, báo cáo sai Computer bị từ chối; VM đã deallocate. Đây không phải bằng chứng hai khóa mới đã hoạt động.
- Có thể còn thay đổi chưa commit của Codex. Kiểm tra git status/diff trước; không reset/clean, không ghi đè thay đổi người khác. Mọi shell command theo RTK.md phải bắt đầu bằng `rtk`.

### Đọc các mẫu này trước, không cần quét lại toàn repo

| Cần hiểu | Mẫu hiện có |
|---|---|
| Cấu trúc bài, generator, lời giải và metadata | `scripts/build-windows-networking.py`, `scripts/build-windows-foundations.py` |
| JSON task và sections thực tế | `server/data/labs/win-nwf-helpdesk-endpoint.json` |
| Rule tin cậy phía server | `server/data/windows-networking-rules.json`, `server/services/windowsRemoteVerifier.js` |
| PowerShell helper / chặn đường dẫn / báo cáo | `server/runtime/windows/networking-common.ps1`, `fundamentals-common.ps1` |
| Thực thi VM và chống báo đạt nhầm | `server/services/windowsRemoteExecutor.js` |
| Routing/khóa thao tác | `server/services/vmTargets.js`, `vmOperationLock.js`, `windowsFaults.js` |
| API course/lab/verify/VM | `server/routes/courses.js` (gồm lab routes), `server/routes/verify.js`, `server/routes/cloudVm.js` |
| Kiểm thử tĩnh/API/PowerShell thật | `tests/windowsNetworking.test.js`, `tests/windowsNetworking.ps1`, `tests/windowsRemoteProcess.test.js` |
| Kiểm thử Azure và tự tắt máy | `scripts/check-windows-networking-live.mjs` |
| Bàn giao chức năng đã có | `docs/ANTIGRAVITY_WINDOWS_NETWORKING_HANDOVER.md` |
| Đề cương và cơ chế seed | `server/data/windows-roadmap.json`, `scripts/seed-windows-roadmap.py` |

## 3. Khảo sát bắt buộc trước thiết kế môi trường

Chỉ đọc cấu hình ở bước này, xuất `docs/AD_DNS_ENVIRONMENT_REPORT.md` có thời điểm và dữ kiện đã đo. Không in `.env`, password, token hoặc subscription secret. Private IP/domain cần cho vận hành có thể lưu tài liệu local, không đưa vào log công khai.

1. Đọc target registry/config hiện tại, Azure power state, SKU, NIC/private IP, VNet/subnet, NSG hiệu lực; không đổi SKU/region hoặc bật cả hai máy nếu chỉ đọc ARM là đủ.
2. Khi cần vào guest, ghi trạng thái đầu; chỉ bật VM cần dùng. Cuối kiểm thử deallocate VM do công cụ bật, giữ nguyên VM người dùng đã bật sẵn.
3. Server: hostname, OS/ProductType, domain membership, AD DS/DNS/DHCP/GPMC roles/modules, dịch vụ và AD/SYSVOL/NETLOGON health. Đọc domain thực bằng Get-ADDomain nếu khả dụng; không mặc định `corp.local` hay tạo forest mới để cho khớp ví dụ.
4. Client: Windows edition hỗ trợ domain join, PartOfDomain/domain hiện tại, NIC/DNS/time source, local account dự phòng và RDP/Azure Agent. Đo TCP/UDP/DNS cần thiết giữa hai private IP, không suy ra kết nối chỉ vì cùng VNet.
5. Đọc `[WindowsIdentity]::GetCurrent()` của từng đường thực thi. Azure Run Command chạy SYSTEM; **SYSTEM không mặc nhiên là Domain Admin**, client SYSTEM cũng không phải phiên domain user đang mở Desktop. Kiểm tra quyền đọc/ghi thật trước khi chọn cách chuẩn bị/chấm.
6. Liệt kê đối tượng hiện có có thể xung đột: OU/user/group/GPO, DNS zone/record, DHCP scope/authorization/binding. Không tái sử dụng/xóa đối tượng không chứng minh được thuộc bài.
7. Kiểm tra đường phục hồi: Azure Agent còn hoạt động khi thay DNS/join/reboot? Có local admin/RDP dự phòng? Baseline nào, restore đã thử chưa? Snapshot tên đẹp hoặc provisioning Succeeded không đồng nghĩa restore đã kiểm thử.

Kết quả phải ghi rõ từng capability: AD đọc/ghi phạm vi lab, GPO tạo/đọc/link, DNS authoritative query, client join/apply computer policy, DHCP quản trị cấu hình, DHCP cấp lease thật. Thiếu capability thì API readiness phải phản ánh; không điền `true` vì module tồn tại.

## 4. Kiến trúc và phạm vi thay đổi

### Namespace và manifest sở hữu

- Dùng root OU riêng, ví dụ `OU=LabExTraining,<domainDN thực>`, rồi OU riêng cho mỗi lab/run. Nếu tên đã có mà chưa có manifest sở hữu thì dừng, không chiếm đối tượng.
- User/group/GPO có prefix riêng và ID/GUID ghi manifest; tên hiển thị không đủ chứng minh sở hữu. Ví dụ nhóm `LX_<run>_GG_Helpdesk`, GPO `LabExTraining-<run>-Marker`.
- DNS dùng zone lab riêng như `lx-<run>.test`; địa chỉ 192.0.2.x chỉ là dữ liệu DNS tài liệu, không phải IP thật để gán NIC hay yêu cầu truy cập dịch vụ. Không sửa zone domain, `_msdcs`, forwarder toàn server hoặc SRV của AD.
- DHCP scope ID/range phải nằm trong mạng lab đã khảo sát, không đụng subnet quản trị Azure. Lưu scope ID, binding/interface, trạng thái và option ban đầu.
- Manifest private phía server lưu runId, labId, target, GUID/SID/zone/scope, baseline và tài nguyên do bài tạo. Trạng thái học viên nằm trong workspace riêng; không tin báo cáo học viên để quyết định đối tượng nào được xóa.

### Chu trình chuẩn bị và hoàn nguyên

`preflight → baseline → prepare → learner action → verify → reset → verify reset`.

Prepare phải idempotent trong cùng phiên, có lease/khóa thao tác và nhận diện owner; không chạy đồng thời với reset/verify gây đua trạng thái. Reset chỉ sửa/xóa đối tượng có manifest và đúng GUID/SID/phạm vi, phục hồi link/ACL/option đã lưu. Nếu một giá trị đã bị bên khác thay kể từ baseline thì báo xung đột thay vì ghi đè mù. Với OU, kiểm tra con còn lại trước khi xóa; không recursive delete cả cây dựa vào prefix tên.

Không tự restore snapshot DC như reset thông thường; AD restore cần quy trình chuyên biệt. Ưu tiên hoàn nguyên đối tượng lab, giữ tài khoản dự phòng. Không reset mật khẩu machine account, phá secure channel, tắt DNS/DC service, đổi giờ hệ thống hoặc unjoin CLIENT01 để tạo lỗi.

### Hai VM: backend hiện tại chưa có orchestration domain chung

`labVmTarget(lab)` hiện chỉ chọn một target cho lab; `resolveVmTarget` chặn target không khớp. Giữ chặn này. Không cho FE truyền hostname/VM/subscription/script chấm tùy ý để vòng qua routing.

- AD bài 1–4 target chính `server`; bài 5–6 target chính `client` nhưng có phép kiểm tra phụ trên server.
- DNS/DHCP target chính `server`; kiểm tra từ client hoặc client DHCP cô lập là dependency riêng đã được định nghĩa tin cậy.
- Nếu cần multi-VM, thêm orchestrator private với allowlist từ curriculum/rule; xác thực cả hai OS/host/domain dự kiến, khóa theo thứ tự cố định để tránh deadlock. Có thể tái dùng cơ chế scratch nội bộ `workspaceOnly` nhưng **không forward cờ đó từ HTTP** và không bỏ kiểm tra quyền truy cập/fault session.
- Thêm capability readiness và metadata dependencies; chỉ gắn `required_vm_targets` hoặc trường tương tự khi đã có backend/FE sử dụng thật. Không tự suy luận API đã hỗ trợ từ một trường JSON mới.
- Fault service hiện dành cho các kịch bản CLIENT01 được allowlist, không phải engine AD/DC. Không nhét tên scenario mới vào đó nếu chưa triển khai ownership/baseline/reset riêng.

## 5. Khung chuẩn của từng bài

Mỗi bài có introduction, 3 task, summary. Phần introduction không tính vào số task cần chấm. Task ID đề xuất `<labId>-task-1-v1` … `-task-3-v1`, sections và steps phải khớp. Tăng version khi thay ý nghĩa task/tiêu chí để không dùng lại điểm cũ.

Mỗi bài cần đủ:

1. Bối cảnh ticket, mục tiêu đo được, kiến thức cần có và lý thuyết giải thích vì sao.
2. Sơ đồ/đường đi và phạm vi môi trường thực; phân biệt dữ liệu ví dụ với cấu hình thật. Ảnh GUI nếu có phải ảnh chụp thực, không dựng ảnh giả như bằng chứng đã chạy.
3. Chuẩn bị/baseline, target, quyền, tài nguyên thuộc bài, đường phục hồi và cách bắt đầu lại.
4. Các thao tác GUI đúng màn hình và PowerShell tương ứng; biến dùng domain/IP/GUID khám phá thật. Không có mật khẩu mẫu cố định hay secret trong code block/command history.
5. Dự đoán kết quả và tự làm trước; hint/lời giải nguyên khối, tự chứa biến vì mỗi request PowerShell web là process mới. Giải thích các lệnh quan trọng, không bắt người mới đoán script dài.
6. Đầu ra mong đợi: thuộc tính/trạng thái và định dạng, không ép IP/PID/thời gian cố định nếu vốn động.
7. Lỗi hay gặp, phép kiểm tra phân biệt các nguyên nhân và cách xử lý khi không đạt.
8. Câu hỏi tự giải thích, bài biến thể, hướng dẫn reset và tiêu chí reset thành công.
9. Ít nhất hai nguồn Microsoft sát chủ đề, link đã kiểm tra. Tự viết lại tiếng Việt, không chép dài nguyên trang.

Tách câu hỏi tự đánh giá khỏi task chấm tự động. Không nói hệ thống “đã xác minh hiểu kiến thức” khi chỉ xác minh trạng thái máy.

## 6. Kế hoạch khóa AD và Group Policy — 6 bài / 18 task

### A1 — `win-adg-ou-groups` (module 1, server)

**Bản chất:** OU dùng tổ chức/delegation/GPO, security group dùng cấp quyền; OU không phải security group. Global/DomainLocal, membership và AGDLP trong phạm vi một domain.

- T1: tạo OU con Users, Groups, Workstations dưới OU riêng của run. Chấm DN/GUID, đúng parent, loại đối tượng, protection flag theo thiết kế; OU cùng tên ở nơi khác không đạt.
- T2: tạo nhóm Global role và DomainLocal resource. Chấm GroupCategory=Security, GroupScope đúng, đúng OU; Distribution hoặc sai scope phải fail.
- T3: user thử thuộc GG, GG thuộc DL; kiểm tra chuỗi membership bằng truy vấn server, không chỉ tên file. Giải thích membership lồng không tự tạo ACL trên một tài nguyên. Chưa gọi đây là thử quyền NTFS nếu chưa có phép thử truy cập thật.
- Reset: gỡ membership và đối tượng đúng GUID của run theo thứ tự con → cha, không đụng nhóm quản trị/domain.

### A2 — `win-adg-account-delegation` (module 1, server)

**Bản chất:** onboarding/offboarding, SID, disable khác delete; delegation theo nhiệm vụ và phạm vi, không cấp Domain Admin để làm helpdesk.

- T1: tạo user thử theo thuộc tính dự kiến, OU đúng và membership chỉ nhóm lab. Mật khẩu sinh/nhập an toàn, không xuất report; chấm trạng thái Enabled và thuộc tính cần thiết, không đọc secret.
- T2: delegate quyền Reset Password cho nhóm helpdesk **chỉ** trên user trong OU lab. Chấm ACE đúng SID, extended right/object type/inheritance/phạm vi; resolve identifier từ AD/schema hoặc nguồn chính thức, không đoán GUID.
- T3: thử thao tác bằng identity được delegate trên disposable user trong phạm vi, và kiểm tra không có quyền tương đương ở OU sibling đối chứng. Đường thực thi thực sự phải impersonate identity ít quyền; chạy bằng admin rồi tuyên bố delegation đạt là sai. Offboard user thử bằng disable và gỡ riêng role membership của bài, giữ SID/đối tượng để audit.
- OU/user đối chứng cũng phải do run tạo và có manifest; không thử reset password của user thật ngoài lab. Nếu quyền vô tình quá rộng khiến negative test thay đổi được user đối chứng, đánh dấu fail rồi phục hồi chính đối tượng thử đó.
- Reset: baseline DACL/membership/account state và kiểm tra khôi phục. Nếu chưa thực thi được dưới identity ít quyền thì T3 chưa hoàn chỉnh, không thay bằng “ACE có vẻ đúng”.

### A3 — `win-adg-gpo-scope` (module 2, server)

**Bản chất:** GPO gồm AD container và SYSVOL template; link, OU scope, Computer/User configuration và security filtering là các yếu tố khác nhau.

- T1: tạo GPO riêng có manifest GUID, lưu baseline/backup cần thiết. Không sửa Default Domain Policy/Default Domain Controllers Policy.
- T2: cấu hình computer marker an toàn: `HKLM\Software\Policies\LabExTraining`, String `CourseMarker`, giá trị gồm runId. Chấm registry policy thật qua GPO cmdlet/report, không tạo trực tiếp khóa registry client để giả policy.
- T3: link GPO vào OU Workstations của run, link enabled và inheritance/security filtering đúng thiết kế. Chấm link GUID/target OU và phần policy enabled. Không link domain root, không dùng Enforced/Block Inheritance để “cho chắc”.
- Reset: restore link/security đã lưu, xóa đúng GPO do run tạo khi không còn link ngoài phạm vi; chưa cần chứng minh client đã áp dụng ở bài này.

### A4 — `win-adg-policy-diagnostics` (module 2, server + client dependency)

**Bản chất:** cấu hình GPO tồn tại không đồng nghĩa được áp dụng; precedence, scope và RSoP giúp giải thích trạng thái hiệu lực.

- T1: nếu cần client, xác nhận client domain joined/đúng OU; chưa đủ môi trường thì báo prerequisite, không chạy gpresult trên DC thay cho máy trạm.
- T2: tạo xung đột có kiểm soát giữa **hai GPO marker riêng trong cùng OU lab**, khác link order; dự đoán bên thắng rồi kiểm tra effective value trên client và gpresult/RSoP computer scope có đúng GUID liên quan.
- T3: bỏ/sửa riêng cấu hình xung đột của bài, refresh computer policy với thời hạn chờ và kiểm tra lại effective value + kết quả policy. Không chỉ chấm gpupdate exit0 hoặc file HTML không rỗng.
- Để không phụ thuộc vòng: A4 có thể đọc trước; thực hành áp dụng policy làm sau A5 nếu client chưa join. FE ghi dependency thực hành rõ, không tạo vòng khóa prerequisite giữa hai course.
- Reset: hoàn nguyên cả hai GPO/link order; kiểm tra marker hiệu lực trở về baseline sau refresh. Không mặc định unlink sẽ tự xóa mọi registry value: kiểm tra hành vi đã đo và restore giá trị riêng nếu cần.

### A5 — `win-adg-domain-join` (module 3, client + server dependency)

**Bản chất:** AD DNS/SRV, thời gian, account computer, domain join và quyền join; domain join không chỉ là thêm một computer object.

- T1: preflight domain/DC/SRV/time/private connectivity; backup DNS/membership/OU computer hiện có, xác nhận local admin và Azure Agent dự phòng. Không chấm bằng ping DC duy nhất.
- T2: nếu CLIENT01 đã join đúng domain thì xác minh và chuyển đúng computer object vào OU lab có baseline; không unjoin chỉ để diễn. Nếu chưa join, dùng quy trình credential an toàn, join bằng identity có quyền phù hợp rồi reboot có điều phối. Không gửi password qua command/plain JSON/log; không đổi IP quản trị để “khớp hướng dẫn”.
- T3: sau reboot kiểm PartOfDomain/domain trên client, computer object tương ứng trên server, đúng OU, DC discovery và `Test-ComputerSecureChannel` trên **member client**. Không dùng cmdlet đó trên DC để kết luận secure channel DC tốt.
- Reset mặc định chỉ hoàn nguyên OU/DNS/thay đổi thuộc bài có thể khôi phục an toàn. Không tự unjoin hoặc reboot hàng loạt khi bấm reset. Nếu muốn đảo ngược domain join cần runbook riêng và cửa sổ thao tác rõ.

### A6 — `win-adg-auth-runbook` (module 3, client + server dependency)

**Bản chất:** phân biệt lỗi tên/DC discovery, secure channel, credentials, user disabled và quyền đăng nhập; account Enabled không chứng minh đăng nhập thành công.

- T1: chẩn đoán identity hiện tại, domain discovery, thời gian, secure channel và tình trạng user thử; báo rõ web SYSTEM khác interactive domain user.
- T2: kịch bản dùng **chỉ user lab**, như account bị disable. Có bằng chứng thất bại đăng nhập của đúng user, sửa đúng trạng thái và thử lại bằng phiên/identity thật; không khóa admin, không reset machine password, không phá trust. Nếu account logon method không có backend an toàn thì cung cấp GUI có bằng chứng OS và ghi phần nào chưa tự chấm được, không giả logon bằng Get-ADUser.
- T3: ticket có trước/sau, identity/user SID, phép thử thành công và phạm vi; bộ chấm đối chiếu trạng thái/logon result tin cậy chứ không tin chuỗi “đã sửa” người học nhập.
- Reset: user test về baseline, giữ đường đăng nhập dự phòng và xác minh computer policy/core AD không bị tác động.

## 7. Kế hoạch khóa DNS/DHCP — 6 bài / 18 task

### D1 — `win-dnsdhcp-zones-records` (module 1, server)

**Bản chất:** authoritative zone, forward/reverse, A/CNAME/PTR, FQDN và TTL. PTR không tự sinh chỉ vì có A record.

- T1: tạo forward zone riêng có manifest; chấm type/storage/update policy thực, không đụng zone AD.
- T2: tạo A `app` và CNAME `portal` trỏ đúng FQDN trong zone, TTL xác định. Query **đúng private DNS server** bằng Resolve-DnsName với loại record và kiểm đúng kết quả, không chỉ Get-DnsServerResourceRecord.
- T3: reverse zone riêng cho dải tài liệu 192.0.2.0/24 và PTR tương ứng mẫu .10, nếu chưa có zone xung đột. Query PTR đúng server và đối chiếu FQDN. Nếu zone đã có của bên khác, chọn namespace/range thử khác được ghi manifest, không chiếm/xóa.
- Reset: chỉ record/zone được tạo bởi run; không recursive xóa zone theo tên khi GUID/manifest không khớp.

### D2 — `win-dnsdhcp-resolver-cache` (module 1, server + client dependency)

**Bản chất:** authoritative answer khác OS resolver/cache; conditional forwarder khác forwarder toàn server. Không đổi DNS NIC DC sang public DNS.

- T1: so sánh query chỉ định server và resolver mặc định từ client; lưu server/path thật, phân biệt cache/hosts và truy vấn ngoài máy. Không dùng localhost làm bằng chứng DNS domain.
- T2: đọc cache Windows cho tên riêng của bài sau lookup thực nếu môi trường cho phép. TTL kiểm theo khoảng và thời điểm thu, không so cứng giây; cache hết hạn thì yêu cầu thu lại. Không giả cache bằng file JSON; không clear toàn server/cache chỉ để làm bài đạt.
- T3: khảo sát forwarder hiện tại và giải thích một tình huống nội bộ/ngoài domain. Nếu tạo conditional forwarder để thực hành, chỉ dùng subzone lab và upstream DNS thử có thể kiểm soát; phải query thực và chứng minh upstream liên quan. Không có upstream thì đánh dấu task cấu hình đó chưa hỗ trợ, không điền DNS public ngẫu nhiên hoặc sửa global forwarder.
- Reset: conditional forwarder riêng nếu có, trả DNS client về baseline nếu bài đã thay có kiểm soát; không xóa cache/zone domain.

### D3 — `win-dnsdhcp-scope-options` (module 2, server)

**Bản chất:** scope network/range, exclusions, reservation ClientId/MAC, lease duration, option003 router/006 DNS/015 suffix; reservation không phải lease đang hoạt động.

- T1: lập worksheet subnet/gateway/DNS và tạo scope riêng **Inactive**. Chấm subnet mask, range, duration; reject range không thuộc mạng đã phê duyệt hoặc chạm mạng quản trị Azure.
- T2: thêm exclusion và reservation cho NIC client lab xác định thật, trong range hợp lệ và không xung đột. Chấm scope ID, ClientId chuẩn hóa và địa chỉ; không dùng MAC mẫu làm thiết bị thật.
- T3: scope options003/006/015 đúng kế hoạch, không sửa server-wide options. Chấm giá trị và cấp áp dụng, giải thích scope options có thể khác server options. Chưa gọi là client đã nhận option.
- Không tự activate scope chỉ vì task3 xong. Môi trường chưa có đường DHCP thật thì D3 chỉ đạt phần quản trị cấu hình, không làm toàn khóa Ready.

### D4 — `win-dnsdhcp-lease-audit` (module 2, server + isolated DHCP client)

**Bản chất:** AD authorization khác scope activation; DORA, lease/renew, ClientId và nhật ký. DNS record, reservation và lease là ba đối tượng khác nhau.

- T1: kiểm role/service, AD authorization và binding của server. Nếu cần authorization, dùng quyền đã xác minh và manifest; không deauthorize DHCP server sẵn có. Server đã authorized bởi hệ thống không được reset thành unauthorized.
- T2: trong mạng cô lập đã kiểm chứng, activate scope riêng và để client thật nhận lease. Chấm trên **cả server lẫn client**: IP/prefix, ServerIdentifier hoặc bằng chứng server cấp, ClientId, thời điểm/trạng thái lease và option thực nhận. Không dùng Add-DhcpServerv4Lease để giả một giao dịch cấp lease.
- T3: đối chiếu lease/renew và audit/packet evidence, phân biệt reservation với cấp phát. Tạo/tắt client thử trong mạng cô lập; không chạy release/renew NIC Azure quản trị. Log có thể không có hoặc format khác; hiển thị thiếu evidence thay vì ghi file log mẫu.
- Reset: scope trạng thái ban đầu, thu hồi đúng lease/disposable client nếu quy trình cho phép, không release toàn bộ client hoặc stop toàn DHCP service.

### D5 — `win-dnsdhcp-dns-incident` (module 3, server + client dependency)

**Bản chất:** sai record khác NXDOMAIN/timeout; sửa authoritative record không lập tức xóa cache mọi client.

- T1: baseline record trong zone riêng; prepare đổi **record của bài** sang địa chỉ tài liệu sai. Query thực chứng minh sai trước khi sửa, không stop DNS service trên DC.
- T2: người học tìm đúng zone/name/type và sửa về baseline; backend kiểm exact RRset, TTL theo phạm vi và authoritative query. Chỉ sửa file báo cáo hoặc tạo record cùng tên ở zone khác không đạt.
- T3: kiểm từ client, giải thích cache nếu còn giá trị cũ, thu kết quả cuối và ticket. Không tự tuyên bố lỗi mạng/HTTPS đã sửa khi mới chứng minh phân giải tên.
- Reset: đúng RRset/baseline; đồng thời xác minh zone AD và SRV còn nguyên bằng kiểm tra đọc.

### D6 — `win-dnsdhcp-dhcp-incident` (module 3, server + isolated DHCP client)

**Bản chất:** có IP nhưng DNS/suffix sai khác hết address pool; phải dựa vào lease/option/đường đi thật.

- T1: baseline mạng cô lập và lease tốt; inject sai option006 **scope lab riêng**, không sửa VNet DNS/global options. Client disposable nhận cấu hình lỗi thật và ghi trước sửa.
- T2: sửa scope option, thực hiện renew chỉ trên NIC cô lập, đối chiếu client thực nhận và truy vấn tên tới DNS lab. Việc option server đúng nhưng client vẫn giữ lease/option cũ chưa đạt.
- T3: ticket trước/sau + scope/client ID + chức năng DNS đã kiểm, rồi reset và verify reset. Tình huống pool exhaustion có thể làm bài biến thể sau; không làm cạn scope dùng chung để minh họa.
- Nếu không có mạng DHCP phù hợp thì D4/D6 là blocked-runtime, không chuyển sang quiz hoặc loopback giả rồi gọi là thực hành DHCP thật.

## 8. Quyết định môi trường DHCP — không bỏ qua

Microsoft xác nhận Azure VNet không chuyển broadcast trực tiếp từ client tới DHCP server như LAN. Có mô hình DHCP server trên Azure phục vụ client qua relay phù hợp; đó không có nghĩa thêm Windows DHCP role vào hai VM cùng VNet là CLIENT01 sẽ nhận lease từ server đó. Tài liệu còn nêu hạn chế renew trực tiếp UDP68→67 và khác biệt T1/T2. Nguồn: [Azure DHCP deployment](https://learn.microsoft.com/en-us/azure/virtual-network/how-to-dhcp-azure), [VNet FAQ](https://learn.microsoft.com/en-gb/azure/virtual-network/virtual-networks-faq).

Thứ tự chọn phương án:

1. Tận dụng mạng lab cô lập đã có và kiểm được end-to-end. Nếu dùng on-prem/local lab + relay tới Azure, phải thực sự có đường kết nối, relay và binding đúng; không tạo VPN/tunnel bằng giả định.
2. Local Hyper-V/VirtualBox với virtual switch **Internal/Private**, NIC quản trị tách biệt, hai VM lab/licensing phù hợp là một lựa chọn nếu máy người dùng đáp ứng và người dùng chọn. Không bridge DHCP lab vào Wi-Fi/LAN nhà. Môi trường này cần executor/target mới được thiết kế thật, backend hiện không tự điều khiển VirtualBox chỉ vì tài liệu nhắc tới.
3. Nested virtualization trên Azure chỉ khảo sát khả năng SKU/region/license/RAM/cost; không mặc định B-series hiện tại hỗ trợ, không tự resize hoặc tạo VM. Trình phương án chi phí cụ thể nếu thật sự cần người dùng chọn.
4. Nếu chưa có phương án: làm đầy đủ AD/GPO, DNS và cấu hình scope inactive; giữ readiness riêng cho các task DHCP cần lease. Nêu chính xác còn thiếu gì và chi phí/điều kiện để hoàn tất, không che bằng nhãn xanh.

Không mua/tạo snapshot, disk, VM, Bastion, VPN hoặc resize chỉ để theo ví dụ Microsoft. Ví dụ deployment trong tài liệu hãng không phải lệnh phải chạy nguyên xi cho dự án này.

## 9. Rule, API và cách xuất bản

Tạo generator riêng cho mỗi khóa, helper/rule riêng; tên đề xuất `build-windows-ad-gpo.py`, `build-windows-dns-dhcp.py`, `windows-ad-gpo-rules.json`, `windows-dns-dhcp-rules.json`. Đừng làm một file PS khổng lồ nạp toàn bộ chức năng vào mọi task; chèn đúng helper cần dùng để không vượt giới hạn command line.

- Rule thuộc server: xác định labId/taskId, target(s), capability, predicate đọc trạng thái, timeout và lý do fail. Browser không được gửi probe/identity/host tùy ý.
- Guard đối tượng domain phải dựa trên manifest và domain thật; helper filesystem của khóa trước chưa đủ bảo vệ OU/GPO/DNS/DHCP.
- Báo cáo JSON tối thiểu schema/version, labId/runId, host/identity, UTC, data; kiểm freshness/context và đối chiếu trạng thái trực tiếp. File đúng tên hoặc vài từ khóa không đủ đạt. Không thực thi script learner lưu trên đĩa để chấm.
- Giữ xác nhận `executionConfirmed` của executor. Exit0/stdout rỗng thiếu marker là lỗi protocol, không được bỏ guard để làm test qua. Input tối đa 16000 ký tự còn phải qua giới hạn encoded argument thực tế; script lớn chia thành các phase có journal/khóa.
- Tái dùng GET courses/labs/roadmap, POST verify và VM start/stop. Nếu thêm prepare/reset đa VM, dùng route server đã allowlist, confirm thao tác thay đổi, owner/session/runId và trạng thái cụ thể; không công bố API giả chỉ trong tài liệu.
- Nội dung cần môi trường mới phải có readiness reason/capability rõ. Chỉ cho tiếp tục task phụ thuộc khi bằng chứng task trước còn hợp lệ.
- Viết/generate bản nháp ngoài thư mục lab catalog trước. `courses.js`/roadmap có tính trạng thái từ số bài, nên đổ đủ 6 stub vào `server/data/labs` có thể làm sai trạng thái. Chỉ publish bài thật với rule/test tương ứng; partial-runtime phải hiện partial, không Ready toàn khóa.
- Cập nhật `syllabus_modules[].lab_ids`, metadata nguồn tự biên soạn, cách học/môi trường và hướng dẫn roadmap; seed/generator không được đưa khóa đã làm trở về planned.

Nếu cả hai khóa thật sự xong: roadmap vẫn 15 khóa/6 chặng, **64 bài thật, 8 khóa có bài, 7 khóa đề cương, 42 bài còn dự kiến**. Đây là số dự kiến sau khi xong cả hai, không được hardcode trước. Cập nhật test/UI theo số tính từ API. Nếu chỉ xong một phần thì tính đúng thực tế.

## 10. Ma trận kiểm thử bắt buộc

### Tầng 1 — nội dung và liên kết

Mỗi khóa 6 bài đúng thứ tự/module, 18 task ID duy nhất, sections/steps khớp, references truy cập được, target đúng; không lộ secret/probe trong API, không gán chứng chỉ giả. Các lệnh/hướng dẫn phải dùng object ID/domain/IP đã xác minh, không còn placeholder gây người học chạy nhầm.

### Tầng 2 — unit/API

- Route từ course → lab, task unknown/wrong lab, target mismatch, thiếu capability; không gọi ARM nếu request sai.
- Client gửi passed=true/command/acknowledge/output giả vẫn không đạt.
- Wrong VM/domain/OU/GUID/SID, thiếu role/quyền, exit1, timeout, protocol rỗng đều không đạt; module tồn tại không thay thế role khỏe/permission đúng.
- Prepare/reset lặp lại, concurrency, journal stale, baseline lỗi, lỗi nửa chừng và reset thất bại trả đúng trạng thái; không ghi completed/healthy khi chưa chứng minh.
- Không mở credentials qua ticket/Desktop/API/log. Không dùng test mock trả exit0 để quảng bá VM thật đã chạy.

### Tầng 3 — PowerShell/native

Parse tất cả collector/probe/helper bằng Windows PowerShell đúng phiên bản. Test các hàm thuần/fixtures local an toàn. AD/GPO/DNS/DHCP cmdlet cần môi trường role thật; mock tốt cho failure path, không phải bằng chứng AD hoạt động.

### Tầng 4 — live VM, mỗi task phải có positive + negative

| Nhóm | Positive | Negative bắt buộc |
|---|---|---|
| OU/group/user | đúng domain/OU/GUID, scope và membership | cùng tên ở OU khác, Distribution, sai scope/member |
| Delegation | identity ít quyền làm được đúng việc trong OU lab | ACE sai SID/quyền quá rộng, thử ngoài phạm vi không được |
| GPO | config + link + effective value + RSoP đúng client | GPO chưa link, sai OU, registry ghi tay không có policy đúng |
| Domain/auth | client membership + AD computer + secure channel/logon thật | computer object tồn tại nhưng client chưa join, user sai/disabled |
| DNS | RRset đúng và query authoritative/client phù hợp | record sai, zone khác, CNAME/PTR sai, report cũ/hosts giả |
| DHCP | scope/options + lease server + IP/options thực nhận client | chỉ reservation, lease thêm bằng cmdlet, sai ClientId/option/lease cũ |
| Incident | lỗi được tái hiện → learner sửa → chức năng tốt | baseline không khỏe, inject không có lỗi, sửa ngoài đối tượng bài |
| Reset | baseline trở lại, object không thuộc bài nguyên vẹn | chỉ in “reset ok”, xóa theo tên/prefix, baseline thiếu |

Mỗi test run dùng namespace/GUID riêng, không canonical learner OU/zone/scope. Negative test không được tạo tác động ra domain root hoặc NIC quản trị. Luôn finally hoàn nguyên tài nguyên và deallocate VM do công cụ bật; đọc lại ARM power state. Nếu tool bị hủy giữa chừng, journal phải cho phép kiểm tra/khôi phục phiên, không để reset mù.

### Tầng 5 — hồi quy và UI

Chạy `rtk proxy npm test`, test native mới, live mới, `rtk git diff --check`, kiểm course/path/verify API và browser smoke. Giữ 25 bài IT Support, 2 khóa nền tảng vừa làm, Linux, AI, Desktop và target routing hoạt động. Xem khóa không được tự bật VM. UI desktop/mobile mở đúng bài, không đếm intro thành task, trạng thái partial nói thật, không hiện nạp lỗi CLIENT01 cho task domain nếu backend chưa hỗ trợ.

CTA roadmap đã có vấn đề nhãn “Mở 25 bài IT Support” trong khi target dựa vào available_start_course_id. Nếu sửa FE, chỉnh nhãn/target khớp API, không làm sai metadata backend để né lỗi.

## 11. Thứ tự triển khai tiết kiệm token

1. Chỉ đọc các file mẫu và hai đề cương ở mục 2; ghi environment report và quyết định DHCP. Không bắt đầu bằng quét lại hàng trăm lab Linux.
2. Chốt manifest/namespace/guard/readiness trước. Làm một vertical slice **A1** đủ content → prepare → action → verify → negative → reset → verify reset trên server thật.
3. Hoàn thiện A2, A3; làm A5 để có client dependency rồi thực hành A4, A6. Thứ tự hiển thị vẫn A1–A6, tài liệu chỉ rõ thực hành A4 cần A5 nếu client chưa join.
4. Làm D1, D2; tiếp D3 cấu hình inactive. Chỉ làm D4/D6 end-to-end sau khi gate môi trường DHCP đã qua. D5 dùng zone riêng có thể triển khai độc lập lease DHCP.
5. Sau mỗi slice chạy test sát phần thay đổi, không chạy toàn bộ suite sau mỗi sửa câu chữ. Chạy full suite và UI cuối mỗi khóa hoặc khi sửa code dùng chung. Nếu thay executor/routing/fault engine thì chạy hồi quy tương ứng ngay.
6. Cập nhật report kết quả thật và danh sách còn thiếu liên tục; gần giới hạn token thì bàn giao trạng thái file/task/test cụ thể, không để tài liệu nói tất cả đã xong.

## 12. Checklist nghiệm thu và hồ sơ cuối

Chỉ ghi hoàn thành một khóa khi:

- [ ] 6 bài/18 task có lý thuyết, GUI/lệnh, kết quả, lỗi hay gặp, tự giải thích và reset đúng môi trường.
- [ ] API trả đúng course/sections/steps, target/dependencies và readiness; không lộ probe/secret.
- [ ] Mọi task thực hành đã có ít nhất một live positive và một live negative phù hợp; không thay bài DHCP thật bằng dữ liệu mô phỏng.
- [ ] Thử prepare/reset và kiểm object ngoài phạm vi không bị đổi; đường đăng nhập/quản trị dự phòng còn hoạt động.
- [ ] Các kiểm thử tự động/hồi quy qua; không giấu skipped/blocked, không giảm assertion để đổi badge.
- [ ] VM do công cụ bật đã deallocate; phát sinh tài nguyên/chi phí nếu có đã được ghi rõ và người dùng đã chọn phương án trước khi tạo.
- [ ] Bàn giao `docs/AD_GPO_IMPLEMENTATION_REPORT.md`, `docs/DNS_DHCP_IMPLEMENTATION_REPORT.md` cùng script tái lập, kết quả test/live, reset journal/manifest policy, giới hạn và prompt tiếp theo nếu còn việc.

Report cần ghi: đã thay file nào; từng lab/task done/partial/blocked; lệnh test và thời điểm/kết quả; target/identity đã chạy; lý do skipped; tài nguyên tạo/thay và trạng thái cuối; bước còn thiếu có thể tiếp tục ngay. Không ghi mật khẩu, private key hoặc raw env.

## 13. Nguồn chính cần đối chiếu khi viết bài

- [AD DS deployment/management learning path](https://learn.microsoft.com/en-us/training/paths/deploy-manage-active-directory-domain-services/)
- [Delegation of control](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/delegation-control-wizard)
- [Group Policy overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy/group-policy-overview)
- [Join computer to domain](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/join-computer-to-domain)
- [Test-ComputerSecureChannel và giới hạn DC](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/test-computersecurechannel?view=powershell-5.1)
- [DNS Server quickstart](https://learn.microsoft.com/en-us/windows-server/networking/dns/quickstart-install-configure-dns-server)
- [DHCP Server quickstart](https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/quickstart-install-configure-dhcp-server)
- [DHCP trên Azure và relay](https://learn.microsoft.com/en-us/azure/virtual-network/how-to-dhcp-azure)

Kiểm tra thêm docs cmdlet thực tế khi triển khai; tên GUI/phiên bản có thể khác. Không copy cả cấu hình mẫu của hãng, nhất là tạo tài nguyên Azure/đổi DNS IP, vào máy hiện có.

## 14. Prompt gửi Anti

> Đọc `docs/ANTIGRAVITY_AD_GPO_DNS_DHCP_IMPLEMENTATION_PLAN.md` và các file mẫu được chỉ ra trong mục 2. Hãy triển khai đúng hai course ID trong tài liệu, ưu tiên backend, giáo trình và kiểm thử. Bắt đầu bằng environment report chỉ đọc và chốt khả năng AD/GPO/DNS/DHCP; không mặc định domain/IP hay DHCP broadcast trên Azure. Làm từng vertical slice có prepare, thao tác thật, grader, negative, reset và kiểm reset. Giữ nguyên các thay đổi Codex chưa commit, xác nhận thực thi PowerShell, target routing, khóa đã có và ngân sách VM. Không đánh dấu Ready khi chỉ có stub, report mẫu, mock hoặc lease DHCP giả. Không tự tạo/resize tài nguyên tốn tiền. Nếu chưa có mạng DHCP phù hợp, hoàn thiện phần làm được rồi trình phương án cụ thể cho người dùng; ghi rõ các task còn bị chặn. Sau mỗi khóa báo kết quả thực đo, file/test/live và trạng thái VM cuối, không chỉ nói “đã hoàn thành”.
