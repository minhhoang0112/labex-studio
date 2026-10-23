# AD/GPO — trạng thái triển khai 2026-10-23

Đã tạo **6 bài/18 nhiệm vụ** trong `windows-active-directory-group-policy`. Có lời giải PowerShell tự chứa, hướng dẫn GUI, kết quả mong đợi, câu hỏi tự đánh giá và reset có phạm vi. **Chưa nghiệm thu chạy thực tế trên Server**, không ghi Ready toàn khóa.

| Bài | Lab ID | Bộ chấm hiện có |
|---|---|---|
| OU/security group/AGDLP | `win-adg-ou-groups` | 3 task đọc trạng thái AD/GUID/membership phía Server |
| Account/delegation | `win-adg-account-delegation` | 3 task; task cuối cần Security4724 thành công đúng delegate SID/target SID, không chấm bằng chạy dưới SYSTEM |
| GPO/marker/link | `win-adg-gpo-scope` | 3 task Server: GUID, registry policy, link OU/flags |
| GPO diagnostics | `win-adg-policy-diagnostics` | 1 task Server, 2 task cần CLIENT01 domain/GPO/RSoP |
| Domain join | `win-adg-domain-join` | 3 task hai phía, chặn khi chưa có môi trường domain/client xác minh |
| Logon/runbook | `win-adg-auth-runbook` | 3 task hai phía; cần event4625 account-disabled và4624 interactive đúng user/time/SID |

Tổng: 10 task có đường chấm Server; 8 task cần domain client hiện chưa xác minh. Đây là số triển khai rule, không phải số task đã live-test đạt. Task delegation cuối cần audit/identity thật; không có audit không được dùng file giả để thay.

## Namespace, ownership và reset

- Helper `server/runtime/windows/enterprise-common.ps1` tạo manifest private tại `C:\ProgramData\LabEx\EnterpriseLabs`; ACL chỉ SYSTEM/Administrators. Secret password không nằm trong manifest/report; user mẫu có password ngẫu nhiên, đặt password dùng thử qua GUI khi cần.
- OU gốc từng bài/run có tên và GUID riêng, mô tả `LabEx:<run>`. Không sửa OU/GPO/nhóm của các khóa cũ. Chỉ user/group/OU có tag đúng và nằm trong root bài mới được đăng ký reset; **computer account bị cấm đăng ký/xóa**.
- GPO có GUID manifest và tên run. Reset kiểm link ngoài subtree, object lạ/đã move, tag/identity thay đổi; không recursive delete AD. Nếu CLIENT01 đã move vào OU bài, phải restore OU baseline trước; reset từ chối xóa computer.
- Prepare có intent trước tạo OU; khi retry chỉ phục hồi intent đúng host/lab/domain/run/DN và Description, không chiếm OU người khác.
- GUI trong giáo trình chủ yếu giúp quan sát/đối chiếu. Lời giải helper đăng ký ownership tự động. Nếu tự tạo bằng GUI, không chạy reset mù; đối tượng chưa đăng ký sẽ bị từ chối. Không đăng ký computer account để vượt chặn.

## API dùng chung cho hai khóa

- `GET /api/courses/<courseId>`, `GET /api/labs/<labId>`, `POST /api/verify {labId,stepId}` giữ luồng hiện có.
- `POST /api/windows-enterprise/prepare {labId,confirm:true}`: chuẩn bị namespace trên Server; không cài role/forest và không bật VM.
- `POST /api/windows-enterprise/reset {labId,confirm:true}`: reset riêng bài, cần `RESET_OK` chính xác; lỗi hoặc thiếu xác nhận không trở thành thành công.
- Response lifecycle ghi `scope=server-namespace`, `clientRecoveryVerified=false`: xóa namespace Server không tự chứng minh client policy/OU/DNS đã về baseline, không có nghĩa đã unjoin/restore toàn VM. Kiểm và hoàn nguyên phần client theo bài riêng trước/sau thao tác.
- `POST /api/windows-enterprise/inspect {labId}`: **chỉ đọc**, cần hai VM đang chạy. Kiểm domain/DC/SID Server và membership/DNS SRV/domain SID/secure channel CLIENT01. Không đổi peering/NIC/DNS, không join domain và không nhận password.
- Inspect ghi proof private `server/runtime/state/enterprise-environment.json`; phải đúng hai VM cấu hình, schema, timestamp không quá24h. Chỉ proof hợp lệ mới mở 11 task domain/client của hai khóa. Đổi registry hoặc proof hết hạn thì chặn lại. Grader vẫn kiểm trạng thái hai máy trực tiếp, không chỉ tin proof.
- Grader dùng rule allowlist, không nhận target/script/hostname tùy ý từ browser; client probe dùng scratch nội bộ cố định. Chặn fault session client không tương thích, giữ routing mismatch guard.
- FE chung đã hiển thị 6 bài; không sửa source FE. Lời giải task1 có prepare và phần cuối bài có khối reset nên vẫn thực hiện được bằng PowerShell web khi Server sẵn sàng. Anti có thể thêm nút gọi ba endpoint trên; không auto-start hai VM hoặc tự inspect bằng ARM liên tục khi xem catalog.

## File chính và tái lập

`scripts/build-windows-enterprise.py` là nguồn nội dung/rule cho cả hai khóa. Generator sinh 12 JSON lab, `server/data/windows-enterprise-rules.json`, course/roadmap metadata. Khi sửa nội dung/tiêu chí, sửa generator rồi chạy lại; giữ task/version nhất quán.

Backend: `enterpriseCurriculum.js` chọn helper theo dependency; `windowsEnterpriseVerifier.js` kiểm Server và CLIENT01; `windowsRemoteVerifier.js` tích hợp readiness; `routes/windowsEnterprise.js` quản lý prepare/reset/inspect. Đã giữ xác nhận thực thi PowerShell, không bỏ nonce guard khi output rỗng.

Kiểm thử:

```text
rtk proxy node --test tests/windowsEnterprise.test.js
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File tests/windowsEnterprise.ps1
rtk proxy npm test
rtk proxy node scripts/check-windows-roadmap-ui.mjs
rtk git diff --check
```

Native test parse 91 script, kiểm valid context và11 trường hợp sai host/lab/schema/run/domain/OU/OS/tag/ownership bằng virtual store. **Không dùng kết quả này thay AD live.** Unit/API kiểm fail/timeout/module thiếu, client fail khi Server đúng, SID domain, thiếu proof, confirm/target/script injection và phản hồi reset rỗng. Browser smoke mở đúng6 bài/khóa, giữ Linux/nền tảng/ITSupport25 và không gọi Azure.

Kết quả kiểm thử ngày23/10: full suite **97/97 đạt**; sau siết điều kiện AGDLP/link GPO,8 kiểm thử enterprise và native91 script/11 ca sai được chạy lại và đạt. `git diff --check` qua. Đây là kiểm thử code/API/guard, không phải97 giao dịch AD thật.

## Bị chặn và bước tiếp theo

Ngày23/10, hai lần cấp phát Server đều bị `ZonalAllocationFailed`. Target hiện tại `Standard_B2ats_v2`, Central India, zone1; Azure gợi ý `Standard_B2ts_v2` nhưng chưa thay vì chưa xác minh giá/free allowance và lựa chọn chi phí của người dùng. Không tạo/resize tài nguyên, hai lần đều deallocate. Chưa có lệnh nào của bài mới chạy vào AD guest.

Khi Server cấp phát được, chạy `rtk proxy node scripts/check-domain-server.mjs` để đo role/domain thật, rồi `rtk proxy node scripts/check-windows-enterprise-live.mjs`. Script live dùng namespace scratch, tối đa19 task Server tự động (không giả thao tác delegation interactive), thử context sai và cleanup. Report `.artifacts/windows-enterprise-live.json`; chỉ coi đạt nếu passed=true và cleanup thành công. Các task deferred ghi riêng, không cộng thành đã nghiệm thu.

Sau đó mới chốt private path hai VNet, baseline/recovery, DNS/join CLIENT01 và quyền thật; không tự promote forest, đổi DNS DC hay truyền password qua web để ép bài chạy. Sau setup hợp lệ, gọi inspect rồi làm/test các task client, event logon và delegation bằng identity thật. Các điều kiện này **chưa hoàn thành**, dù bài đã có trên web.
