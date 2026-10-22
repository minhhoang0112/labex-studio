# Bàn giao Windows 11 Fundamentals — 2026-10-22

## Phạm vi đã triển khai

Khóa `windows-11-fundamentals` có 6 bài thật / 12 nhiệm vụ có bộ chấm backend. Nội dung tiếng Việt tự biên soạn theo tài liệu Microsoft được dẫn ngay trong mỗi bài; không gắn nhãn bản sao LabEx hoặc chứng chỉ Microsoft. Không triển khai khóa mạng Windows trong đợt này.

| Thứ tự | Lab ID | Nội dung / tiêu chí chấm |
|---|---|---|
| 1 | `win-fnd-system-tools` | Caption/build/ProductType/RAM đối chiếu máy; engine PowerShell, SID và danh tính SYSTEM |
| 2 | `win-fnd-process-services-startup` | PID/tên wininit, service Spooler; danh sách HKLM Run 32/64-bit + CommonStartup |
| 3 | `win-fnd-accounts-uac` | User local/SID/Enabled đối chiếu thực tế; EnableLUA và danh tính hiện tại |
| 4 | `win-fnd-files-profile-ntfs` | Nội dung tệp và profile; bản copy khớp SHA256, Owner và SDDL thực tế |
| 5 | `win-fnd-software-drivers-updates` | Mẫu tối đa 5 app HKLM Uninstall; mẫu driver ký số, hotfix và quan sát wuauserv |
| 6 | `win-fnd-baseline-change-rollback` | Config mẫu và baseline; thay đổi rồi restore, đối chiếu dữ liệu/hash trước–sau |

Mỗi lab có `sections`: introduction, task 1, task 2, summary. `steps` chỉ chứa 2 task cần chấm. Task ID là `<labId>-task-1-v1` và `<labId>-task-2-v1`. Ba module roadmap lần lượt liên kết bài 1–2, 3–4, 5–6 qua `syllabus_modules[].lab_ids`.

## API và FE

Không sửa mã nguồn FE trong đợt này. FE hiện tại tự nhận 6 bài qua API và mở bài bằng luồng chung; không cần tạo màn hình riêng.

- `GET /api/courses/windows-11-fundamentals`: `{course, labs, ...}`; `course.curriculum_status = "implemented"`, `course.steps_count = 12`, 6 lab đã sắp thứ tự. Mỗi lab trả `target_vm: "client"`, `curriculum_module`, `preparation`.
- `GET /api/labs/<labId>`: `sections`, `steps`, nội dung VI, hint PowerShell, references, availability. Rule/probe chấm riêng không trả cho trình duyệt.
- `GET /api/roadmaps/windows-system-administrator`: lộ trình và mapping module. Toàn lộ trình hiện có **46 bài thật, 5 khóa có bài, 10 khóa đề cương; 60 bài còn dự kiến**. Đọc số từ API, không hardcode.
- `GET /api/cloud-vm/status?labId=<labId>`: xem powerState, trạng thái thao tác, desktop, faultSession.
- `POST /api/cloud-vm/start` và `/stop`: JSON `{ "labId": "win-fnd-system-tools" }`. Backend suy ra target client. HTTP 202 là đã nhận thao tác, cần poll status; không tự coi là máy sẵn sàng.
- `POST /api/cloud-vm/desktop-session`: `{labId,width,height,dpi}`; dùng ticket và desktop component hiện có.
- `POST /api/cloud-vm/powershell`: `{ "labId": "win-fnd-system-tools", "command": "<nguyên khối hint của task>" }`. Trả `exitCode`, `stdout`, `stderr`, `timedOut`, target/computerName. Output bị giới hạn; báo cáo đầy đủ lưu trên VM.
- `POST /api/verify`: `{ "labId": "win-fnd-system-tools", "stepId": "win-fnd-system-tools-task-1-v1" }`. Trả `{passed,message,hint,verification_method}`. Chỉ cập nhật hoàn thành khi backend trả `passed:true`. Gửi thêm `passed:true`, output hay command từ FE không giúp đạt.

Các trường preparation:

```json
{"mode":"self-contained","requires_vm_start":true,"target":"client","fault_injection":false}
```

Không hiện nút nạp lỗi cho khóa này. Không bật VM khi chỉ xem khóa/bài. Khi có faultSession cũ chưa reset, dùng luồng hoàn nguyên của chính bài sự cố đó trước khi học; không tự reset thay người học. Không chuyển sang Windows Server khi client chưa bật.

### Prompt dành cho Anti nếu cần cải thiện FE

> Đọc tài liệu bàn giao này, chỉ cải thiện trình bày khóa windows-11-fundamentals, không sửa backend/rules/nội dung chấm. Dùng API làm nguồn số liệu. Hiện đủ introduction/task/summary, code block PowerShell có nút sao chép nguyên khối và cuộn ngang. Hiện rõ thao tác GUI để quan sát, khối thu bằng chứng, kết quả mong đợi, câu hỏi tự giải thích. Dùng syllabus_modules[].lab_ids để link bài thật, không ghi “chưa triển khai” cho 6 bài này. Giữ CLIENT01 và start/stop hiện có, không nạp lỗi, không auto-start VM. Mọi nút hoàn thành dựa trên POST /api/verify; hiển thị lỗi/quá thời gian/máy chưa bật trung thực. Không thay đổi 25 bài IT Support hay các khóa Linux.

## Cách học và giới hạn

- Dùng CLIENT01 Windows 11 hiện có, không cần VM, ổ đĩa hoặc snapshot mới.
- PowerShell web chạy qua Azure Agent bằng SYSTEM, mỗi request là process mới; chạy nguyên khối, không giả định biến tồn tại từ lần trước. GUI Desktop chạy bằng user khác. Task đối chiếu identity/profile phải thu báo cáo ở PowerShell web.
- Tệp mẫu/báo cáo ở `C:\LabEx\Labs\<labId>`. Task tự chuẩn bị dữ liệu. Bài chỉ đọc cấu hình và sửa tệp mẫu; không đổi account, UAC, mạng, service, driver hoặc Registry của máy.
- JSON cần Schema=1, đúng lab/máy, thời điểm trong 24h (không quá 5 phút tương lai). Thu lại sau reboot/thay cấu hình. Bộ chấm chặn reparse path và không thực thi script do học viên lưu.
- Bài 5 thực hành **khảo sát và chuẩn bị bảo trì**, chưa bắt cài/gỡ driver, app hoặc update/reboot; không giả định biết cài đặt thực tế chỉ vì qua nhiệm vụ inventory. Thực hành xử lý sự cố tiếp ở khóa IT Support.
- Câu hỏi giải thích/GUI là tự đánh giá, không có chấm điểm hiểu biết bằng AI. Điểm task xác nhận dữ liệu/trạng thái, không chứng minh người học hiểu bản chất hoặc đã thao tác GUI.
- Inventory startup, app và hotfix đều có phạm vi cụ thể, không được quảng bá là toàn bộ cấu hình máy.

## Bảo trì và kiểm thử

- `scripts/build-windows-foundations.py`: sinh lại 6 JSON bài, 12 rule và metadata khóa/lộ trình từ nội dung nguồn trong script.
- `server/runtime/windows/fundamentals-common.ps1`: helper tin cậy dùng chung cho thu dữ liệu/chấm; khi sửa phải chạy lại generator.
- `server/data/windows-foundations-rules.json`, `server/services/windowsRemoteVerifier.js`: rule server, chấm đúng client/Windows 11, không tin flags từ browser.
- `scripts/seed-windows-roadmap.py` giữ metadata/module mapping đã có bài khi seed lại đề cương.
- `npm test`: 85 kiểm thử đã qua sau khi thêm khóa.
- `scripts/check-windows-roadmap-ui.mjs`: kiểm tra FE hiện có tự hiện 6 nút mở bài; 25 bài IT Support còn nguyên; không gọi thao tác Azure; desktop/mobile và chuyển Linux/Windows đã qua.
- `scripts/check-windows-foundations-live.mjs`: chạy collector và probe trên CLIENT01 bằng workspace scratch riêng, thử dữ liệu sai Computer; từ chối chạy khi có sự cố đang học, và deallocate nếu công cụ tự bật máy. Kết quả thật lưu `.artifacts/windows-foundations-live.json`; không mặc định coi thành công khi report `passed:false`.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tests/windowsFoundations.ps1`: 24 đoạn collector/probe hợp lệ cú pháp, 8 điều kiện báo cáo, so sánh inventory và workspace guard; 4 cặp collector/probe tệp/NTFS/rollback chạy thật trong fixture local, sửa sai tệp đều bị từ chối. Kiểm thử này không sử dụng hoặc mô phỏng cấu hình CLIENT01.

### Điều chưa xác nhận trên Azure

Ngày 2026-10-22: lần kiểm thử Azure đầu nhận output rỗng, chưa xác định nguyên nhân; lần bật lại bị Azure từ chối `AllocationFailed` vì thiếu capacity của cỡ VM hiện tại trong region. Vì vậy **chưa có kết quả end-to-end đạt cho 12 nhiệm vụ trên CLIENT01**. CLIENT01 đã deallocate sau hai lần; không đổi SKU/region hoặc tạo tài nguyên mới. Không dùng các kiểm thử local/API để quảng bá rằng kiểm thử Azure đã đạt.

Khi Azure cấp được máy, chạy lại `node scripts/check-windows-foundations-live.mjs` từ thư mục gốc (cần đăng nhập Azure và cấu hình hiện có). Nếu output rỗng, công cụ sẽ ghi thông tin exit/stdout/stderr/timeout vào lỗi thay vì coi là đạt; kiểm tra cả lỗi và kết quả chi tiết trên VM trước khi kết luận. Mỗi lần tự bật sẽ tự deallocate trong finally; nếu người học đã bật sẵn, công cụ giữ máy chạy. Không chạy khi người dùng đang có lab sự cố chưa hoàn nguyên.

Tài liệu tham khảo chính có sẵn trong `references` của từng bài, ví dụ [Get-Acl](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/get-acl), [UAC](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/user-account-control/how-it-works), [Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash).
