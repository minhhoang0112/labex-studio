# Mạng máy tính căn bản trên Windows — bàn giao 2026-10-22

## Khóa học và phạm vi

`windows-networking-fundamentals`: **6 bài thật, 12 task có bộ chấm backend**, tiếng Việt tự biên soạn theo Microsoft Learn. Khuyến nghị học `windows-11-fundamentals` trước, không khóa cưỡng bức bài đã có. Không phải bản sao giáo trình LabEx hoặc chứng nhận Microsoft.

| Thứ tự | Lab ID | Task 1 | Task 2 |
|---|---|---|---|
| 1 | `win-nwf-ipv4-routing` | Địa chỉ/prefix/nguồn/trạng thái IPv4 thực | Route thực + bài tính 10.20.30.45/26 |
| 2 | `win-nwf-dhcp-apipa` | DHCP/ConnectionState từng interface | Phân loại APIPA/loopback/private và bước điều tra |
| 3 | `win-nwf-dns-resolution` | DNS server cấu hình + resolver localhost | Tình huống NXDOMAIN nhưng kết nối IP/TCP tốt |
| 4 | `win-nwf-tcp-http` | Socket loopback mở/đóng thật | HTTP200 và HTTP404 trên hai path, TCP đều tốt |
| 5 | `win-nwf-helpdesk-endpoint` | client.json sai path → HTTP404 thật | Sửa path → HTTP200/body đúng, đối chiếu hash trước/sau |
| 6 | `win-nwf-evidence-runbook` | Snapshot IPv4/route/DNS, vai trò DNS trong sơ đồ | Ticket có bằng chứng HTTP trước/sau và giới hạn phép thử |

Task ID: `<labId>-task-1-v1`, `<labId>-task-2-v1`. Mỗi lab có introduction, 2 task, summary; câu hỏi tự giải thích nằm trong nội dung, không tự chấm bằng AI. Các module roadmap liên kết bài 1–2, 3–4, 5–6 qua `syllabus_modules[].lab_ids`.

## Thực hành và cách chấm

- Chỉ CLIENT01 Windows 11 hiện có. Không cần máy mới, thêm disk, phần mềm hay Internet để qua bài. Không đổi IP, DNS, DHCP lease, route, Windows Firewall hoặc Azure NSG của VM.
- Inventory thực: IPv4, route, DHCP và DNS được đọc lại để đối chiếu. Thu lại báo cáo nếu NIC/VPN/route thay đổi. Không hardcode IP thật của CLIENT01.
- Socket thử nghiệm bind **127.0.0.1**, cổng OS tự chọn; có giới hạn chờ kết nối/đọc/ghi, luôn đóng listener/client trong finally. Không mở dịch vụ ra mạng; listener không tồn tại sang request tiếp theo.
- Bài 5 lỗi nằm trong `client.json` của riêng lab. Task 1 tạo lại cấu hình `/missing`, lưu `before-config.json`, chứng minh TCP tốt/HTTP404. Task 2 sửa `/health`, chứng minh HTTP200 và `NETLAB_OK`; bộ chấm đọc file thật, hash và thực hiện lại request. Làm/chấm task 1 trước task 2; sau khi sửa, chấm lại task 1 không còn đúng trạng thái. Khôi phục riêng config bằng bản before hoặc chạy task 1 để diễn tập lại.
- Bài subnet và các tình huống DHCP/DNS là bài tập có đáp án cấu trúc; không quảng bá là đã nạp lỗi DHCP/DNS thật vào NIC. Resolver localhost không chứng minh DNS Internet hoạt động. HTTP loopback không chứng minh LAN/WAN/NSG/firewall doanh nghiệp hoạt động.
- PowerShell web chạy SYSTEM, một process mỗi request; chạy nguyên khối hint. Hints chỉ chứa helper cần dùng, có mã đọc được. Các lệnh quan sát ban đầu và câu hỏi giúp học hiểu trước khi xem lời giải; việc sao chép lời giải không tự chứng minh hiểu biết.
- Tệp tại `C:\LabEx\Labs\<labId>`. JSON schema1, đúng lab/máy, thời gian không quá 24h và không quá 5 phút tương lai. Chặn reparse path, file quá lớn; không thực thi file script do người học ghi.
- Chấm chỉ tin rule phía server; trình duyệt gửi `passed`, `command`, output hoặc acknowledge không giúp vượt task. Lỗi/quá thời gian/sai máy không được báo đạt.

## API / FE

Không sửa source FE. Luồng chung đang dùng được cho khóa này:

1. `GET /api/courses/windows-networking-fundamentals`: 6 labs, `course.steps_count=12`, `curriculum_status=implemented`, prerequisite là khóa Windows 11 nền tảng.
2. `GET /api/labs/<labId>`: sections/steps/VI/hints/references/availability. Rule/probe server không trả cho FE.
3. `GET /api/roadmaps/windows-system-administrator`: toàn lộ trình hiện có **52 bài thật, 6 khóa có bài, 9 khóa đề cương, 54 bài dự kiến còn lại**. Đọc số động qua API.
4. `GET /api/cloud-vm/status?labId=<labId>`; `POST /api/cloud-vm/start` hoặc `/stop` với `{labId}`. HTTP202 chưa có nghĩa VM sẵn sàng, cần poll trạng thái. Không auto-start khi xem bài.
5. `POST /api/cloud-vm/powershell` với `{labId,command}`; dùng component hiện có. Backend trả mã thoát/output/timeout; không tự đánh dấu hoàn thành.
6. `POST /api/verify` với `{labId,stepId}`; chỉ ghi tiến độ khi `passed:true`.

`target_vm=client`, preparation là `{mode:"self-contained",requires_vm_start:true,target:"client",fault_injection:false}`. **Không hiển thị nút nạp lỗi toàn máy**. Nếu có faultSession cũ chưa hoàn nguyên thì dừng, dùng luồng reset đúng bài đó trước.

### Việc FE có thể giao Anti

> Khóa windows-networking-fundamentals đã có API/nội dung/bộ chấm. Chỉ chỉnh trình bày theo dữ liệu API, không sửa rule/backend. Hiện đủ 6 bài và mapping module; code block có copy nguyên khối, cuộn ngang; phân biệt quan sát, bài tình huống và thực nghiệm loopback. Giữ start/stop CLIENT01, không auto-start hoặc hiện fault injection. Kiểm tra CTA trên roadmap: nút đang ghi “Mở 25 bài IT Support đã có” nhưng target dùng available_start_course_id nay là khóa nền tảng. Đổi nhãn theo đúng target từ API hoặc cho nút IT Support trỏ cố định đúng khóa IT Support. Không đổi metadata để che sự lệch nhãn này. Không báo hoàn thành khi chỉ sao chép lệnh.

## Mã nguồn / bảo trì

- `scripts/build-windows-networking.py`: nguồn giáo trình sinh 6 lab JSON, 12 rule, course/roadmap metadata. Không bật hoặc sửa VM. Khi sửa bài, chỉnh generator rồi sinh lại.
- `server/runtime/windows/networking-common.ps1`: helper đọc cấu hình, tính subnet và phép thử TCP/HTTP.
- `server/data/windows-networking-rules.json`: rule riêng, đưa vào `windowsRemoteVerifier.js`, chỉ đúng CLIENT01/Windows11.
- `scripts/build-windows-foundations.py`: đã tránh đưa hướng dẫn “khóa mạng chưa có bài” trở lại khi sinh lại khóa trước.
- `scripts/seed-windows-roadmap.py`: cơ chế giữ metadata/module mapping đã triển khai vẫn dùng cho khóa mạng.

### Sửa đường thực thi PowerShell chung

Trong lúc kiểm thử Azure phát hiện tiến trình con có thể trả exit0 với stdout/stderr rỗng. Đây chưa đủ bằng chứng đoạn lệnh được thực thi. `windowsRemoteExecutor.js` nay gắn nonce xác nhận bên trong `finally` của payload; parent đọc/loại marker khỏi output và chỉ công nhận exit0 khi có `executionConfirmed:true`. Thiếu marker trả `CLOUD_REMOTE_PROTOCOL`, không chấm đạt nhầm. Giữ nguyên nonzero exit và timeout; thêm giới hạn encoded argument để không vượt dòng lệnh Windows. Không thay VM, firewall hay cấu hình bảo mật để ép thực thi.

## Kiểm thử

- `npm test`: **89/89 kiểm thử đạt**, gồm API, routing, bộ chấm riêng, toàn hệ thống và tiến trình PowerShell thật.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tests/windowsNetworking.ps1`: **12 cặp collector/probe thật chạy đạt trên Windows local; 50 trường hợp sai bị từ chối; 24 đoạn script parse được**. Dùng API mạng/socket thật và fixture riêng trong dự án; không giả lập dữ liệu mạng, không dùng thư mục học CLIENT01. Có kiểm subnet /0,/26,/31,/32 và prefix sai.
- `tests/windowsRemoteProcess.test.js`: chạy wrapper bằng PowerShell Windows thật, xác minh output và explicit exit7, exit0 không output hợp lệ, throw; marker xác nhận phải tồn tại dù explicit exit.
- `scripts/check-windows-roadmap-ui.mjs`: xem các khóa và chuyển Linux/Windows không có thao tác Azure; kiểm số nút mở bài. CTA lệch nhãn nêu trên không nằm trong kiểm thử pass.
- `scripts/check-windows-networking-live.mjs`: kiểm CLIENT01 thật, dùng lab scratch riêng, canary exit7 rồi nhóm nhỏ 12 nhiệm vụ, thử sai Computer. Tự deallocate nếu công cụ bật máy; giữ nguyên máy đang chạy do người dùng bật. Từ chối chạy nếu có fault session đang học. Kết quả `.artifacts/windows-networking-live.json`; **chỉ kết luận Azure đạt khi report.passed=true**.

### Kết quả Azure cuối cùng

Ngày 2026-10-22: **12/12 nhiệm vụ chạy đạt trên CLIENT01 thật**, đồng thời cả 12 phép thử báo cáo sai Computer bị từ chối. Canary xác nhận output và explicit exit7 được giữ đúng. Report cuối `passed:true`, `realAzure:true`, `deallocated:true`; đọc trạng thái ARM sau đó cũng xác nhận `VM deallocated`. Không đổi cấu hình NIC/firewall, không tạo tài nguyên mới, không đụng workspace học chính.

Lần kiểm thử đầu dùng payload nén trả exit0/output rỗng, chưa kết luận nguyên nhân. Kiểm thử cuối dùng các khối PowerShell trực tiếp, nhỏ hơn giới hạn dòng lệnh, cùng xác nhận thực thi mới; không gỡ hoặc tắt thành phần bảo vệ Windows để thử vượt lỗi.

Nguồn chính: [ipconfig](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig), [route](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/route_ws2008), [Resolve-DnsName](https://learn.microsoft.com/en-us/powershell/module/dnsclient/resolve-dnsname), [Test-NetConnection](https://learn.microsoft.com/en-us/powershell/module/nettcpip/test-netconnection), [TcpListener](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.tcplistener). Mỗi bài có references tương ứng; lý thuyết được viết lại bằng tiếng Việt, không chép nguyên trang.
