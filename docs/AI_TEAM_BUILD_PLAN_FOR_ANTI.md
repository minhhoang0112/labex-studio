# Kế hoạch dựng đội AI theo nhiệm vụ — gửi Antigravity phản biện

Ngày: 16/11/2026. Trạng thái: bản đề xuất để review, chưa cài công cụ hoặc thay đổi cấu hình tài khoản.

Cập nhật theo lựa chọn mới: ưu tiên một cửa sổ VS Code, một khung chat giao việc; worker CLI chạy song song hoặc tuần tự theo phụ thuộc. Orca chỉ là phương án thay thế.

## 1. Mục tiêu của chủ dự án

Chủ dự án giao một công việc cho LabEx hoặc OpenQuiz. Trưởng nhóm đọc hiện trạng, lập kế hoạch, giao việc, theo dõi, yêu cầu sửa, review và tích hợp đến khi đạt tiêu chí hoàn thành. Xong việc thì kết thúc phiên; không cần lịch chạy, dịch vụ hoạt động 24/7 hoặc tự tìm việc mới.

Nguồn lực: Antigravity (Anti) và hai tài khoản Codex. Hạn mức/gói tài khoản chưa được kiểm tra. Không mua thêm tài khoản trong giai đoạn thử nghiệm.

Đích đến là giảm việc chủ dự án phải chuyển thông tin giữa các agent. Không hứa xử lý được mọi nhiệm vụ mà không có can thiệp: thiếu yêu cầu quan trọng, hết hạn mức hoặc thiếu quyền bên ngoài có thể cần chủ dự án giải quyết.

## 2. Hiện trạng đã kiểm tra và phần chưa biết

- LabEx ở `D:\Project\LabEx`, có Git và nhiều thay đổi staged, unstaged, untracked. Chưa tạo checkpoint hoặc sửa trạng thái Git.
- `CODEX_BACKEND_HANDOVER.md` đã phân công Anti làm frontend/nội dung; Codex làm backend/cloud/runtime. Đây là lịch sử bàn giao, không phải bằng chứng các hạng mục vẫn còn thiếu.
- Root package có lệnh test Node, build client, dev và kiểm tra Docker. Client dùng React/Vite và có lệnh lint.
- LabEx liên quan WSL, Docker, Windows VM và tài nguyên cloud. Worktree chỉ tách mã nguồn; không tự tách VM, container, port, database hoặc dữ liệu runtime.
- Chưa khảo sát mã nguồn, đường dẫn hoặc cách chạy OpenQuiz; mọi phân công cho OpenQuiz dưới đây là khung đề xuất.
- Đã tìm thấy `codex.exe`, `code.cmd`, Node.js và Git trong PATH. `codex exec --help` xác nhận có chế độ không tương tác, output JSON, chọn thư mục làm việc và tiếp tục phiên. Chưa thử gọi model hoặc đăng nhập tài khoản thứ hai.
- Chưa tìm thấy `agy` hoặc `antigravity` qua Get-Command trong PATH; chưa kết luận ứng dụng Anti chưa cài. Cần kiểm tra/cài CLI riêng nếu muốn tự giao việc cho Anti.
- Không sao chép thông tin đăng nhập, token hoặc mật khẩu từ tài liệu bàn giao vào hồ sơ đội.

## 3. Kiến trúc đề xuất

Một trưởng nhóm chịu trách nhiệm xuyên suốt một nhiệm vụ. Worker thực hiện phần việc được giao; reviewer kiểm tra độc lập. Không để nhiều trưởng nhóm cùng quyết định tích hợp trên một nhiệm vụ.

| Vai trò | Bố trí ban đầu | Trách nhiệm |
|---|---|---|
| Chủ dự án | Người dùng | Giao mục tiêu, ưu tiên và quyết định sản phẩm chưa thể suy ra |
| Trưởng nhóm/tích hợp | Codex tài khoản A | Khảo sát, chia việc, quản lý phụ thuộc, điều phối review và tích hợp |
| Frontend/nội dung | Anti | UI, UX, nội dung và kiểm tra luồng giao diện theo task |
| Backend/runtime | Worker thuộc phiên Codex A, hoặc trưởng nhóm trực tiếp | API, runtime, xử lý dữ liệu và kiểm tra liên quan |
| Reviewer/QA | Codex tài khoản B | Review diff độc lập, tái hiện lỗi và xác nhận tiêu chí hoàn thành |

Đây là phân công theo dự án hiện tại, không phải kết luận công cụ nào luôn giỏi hơn. Reviewer không tự sửa đồng thời cùng file với người triển khai; gửi finding để người phụ trách sửa. Khi reviewer nhận task triển khai riêng, cần một người khác review phần đó.

Hai tài khoản không tự chia sẻ hội thoại, task hay hạn mức. Cần đăng nhập tách biệt và cơ chế bàn giao. Subagent thuộc phiên tài khoản nào thì sử dụng tài nguyên phiên đó; không giả định tự chuyển sang tài khoản còn lại.

## 4. Chọn môi trường chạy

Phương án chính: một cửa sổ VS Code. Một phiên Codex tương tác trong terminal tích hợp làm trưởng nhóm và nơi người dùng giao việc. Có thể dùng chat extension làm đầu vào sau khi xác minh nó gọi/đợi worker được với quyền đang có; MVP dùng terminal tích hợp để giảm phụ thuộc extension.

```text
VS Code: một chat Codex A làm trưởng nhóm
  → bộ điều phối Node.js cục bộ theo nhiệm vụ
      → Codex CLI A: backend (khi cần)
      → Codex CLI B: triển khai độc lập hoặc review
      → Anti CLI: frontend/nội dung
  ← trạng thái, session ID, diff, kết quả kiểm tra
  → giao sửa → review → tích hợp → báo cáo
```

Bộ điều phối là phần cần xây, không phải tính năng tự có khi mở nhiều terminal. Dùng `codex exec` và chế độ headless của `agy` để gửi prompt và nhận sự kiện/kết quả. Bộ điều phối quản lý tiến trình, log, timeout, session ID và trạng thái task; trưởng nhóm đưa quyết định kỹ thuật. Cần lệnh khởi chạy, xem trạng thái, nhận kết quả, tiếp tục phiên và hủy task; chỉ chạy trong thời gian thực hiện nhiệm vụ.

Tài liệu Google có headless `agy -p`, JSON/stream-json và tiếp tục bằng conversation ID. Trên máy chưa kiểm chứng đăng nhập, quyền, model hoặc khả năng sửa/chạy kiểm tra của Anti CLI. Không mặc định CLI dùng cùng lịch sử và cấu hình với cửa sổ Anti đang mở.

Tách hai tài khoản bằng hai thư mục trạng thái/đăng nhập ngoài repo; mỗi tiến trình con nhận `CODEX_HOME` riêng. Không đổi biến toàn hệ thống hoặc ghi đè vùng đăng nhập hiện tại. Kiểm tra credential store để tránh vô tình dùng chung đăng nhập. Profile chọn model/quy tắc không thay thế việc tách xác thực.

Các bước bắt buộc chứng minh trên máy:

1. Mỗi worker dùng đúng tài khoản A/B; đăng nhập lại B không đổi phiên A. Không in nội dung credentials ra log.
2. Trưởng nhóm tự khởi chạy hai worker cùng lúc, nhận kết quả và gửi yêu cầu sửa; người dùng không phải chuyển prompt giữa các cửa sổ.
3. Task có phụ thuộc chỉ chạy khi đầu vào đủ; giới hạn tổng số worker đồng thời, ban đầu là 2.
4. Worker ở đúng worktree và báo đúng nhánh/commit. Không sinh worker không giới hạn.
5. Coordinator giữ và tiếp tục đúng session, phát hiện worker lỗi/đợi quyền/hết hạn mức; không xem exit code 0 đơn lẻ là bằng chứng hoàn thành.
6. Xác minh quyền đọc/ghi trong sandbox đủ cho worktree và cấu hình từng worker. Không tắt toàn bộ sandbox để né lỗi quyền.

Nếu CLI không đáp ứng, đánh giá Orca làm phương án thay thế; phần orchestration của Orca vẫn thử nghiệm. Bàn giao Markdown thủ công chỉ là dự phòng và không được tính đã đạt mục tiêu tự điều phối.

Chưa cần extension tự viết, DeepSeek Harness, CrewAI hoặc LangGraph ở bước đầu. Giữ bộ điều phối dùng chung và adapter theo công cụ, còn context/test/runtime cấu hình riêng từng dự án.

## 5. Những gì cần thiết lập

### A. Giữ trạng thái dự án và tách nơi làm việc

- Kiểm kê thay đổi hiện tại; cùng chủ dự án xác định phần nào là nền làm việc. Không reset, clean, stash hoặc commit toàn bộ thay đổi không rõ nguồn gốc.
- Tạo bản lưu/checkpoint được thống nhất trước khi tách nhánh. Worktree mới chỉ thấy nội dung đã commit, nên phải chọn rõ base commit chứa phần nền cần thiết.
- Mỗi task có nhánh/worktree riêng nếu sửa code song song. Trưởng nhóm quản lý thứ tự tích hợp.
- Mỗi worktree có dependencies và cấu hình local cần thiết. Không commit secrets; chỉ cấp cấu hình cần dùng cho task.
- Phân cổng, namespace dữ liệu và tài nguyên thử nghiệm. Nếu chưa tách được tài nguyên dùng chung, xếp các task tác động tài nguyên đó chạy tuần tự.
- Tích hợp lần lượt, kiểm tra trên trạng thái tổng hợp. Worktree không loại bỏ xung đột khi merge.

### B. Hồ sơ dự án và hướng dẫn đội

Đề xuất các file sau, chỉ tạo khi triển khai sau review:

```text
<project>/
  AGENTS.md
  docs/ai-team/
    PROJECT_CONTEXT.md
    WORKFLOW.md
    DECISIONS.md
    tasks/<task-id>/
      TASK.md
      STATUS.md
      HANDOFF.md
      REVIEW.md
      RESULT.md
```

- `AGENTS.md`: hướng dẫn ngắn, dẫn đến hồ sơ chi tiết; giữ hướng dẫn RTK hiện có. Cung cấp entry point phù hợp cho Anti theo bản công cụ thực tế và dẫn về cùng nguồn quy tắc, tránh hai bản chỉ dẫn mâu thuẫn.
- `PROJECT_CONTEXT.md`: kiến trúc đã kiểm tra, đường dẫn chính, lệnh chạy/test, các hạn chế hiện tại.
- `WORKFLOW.md`: cách nhận task, tách việc, giao tiếp, review và tích hợp.
- `DECISIONS.md`: quyết định kỹ thuật cần dùng lại, không chép toàn bộ hội thoại.
- Worker ghi handoff; reviewer ghi findings; trưởng nhóm sở hữu trạng thái tổng. Tránh nhiều agent ghi đè cùng file trạng thái.

Các file lưu bằng chứng và ngữ cảnh, không tự tạo ra cơ chế gửi task hoặc đánh thức agent. Việc đó phải do coordinator/runtime thực hiện và được kiểm tra riêng.

Đội dùng chung bộ mẫu, nhưng LabEx và OpenQuiz có hồ sơ/task riêng. Không trộn quyết định hay dữ liệu giữa hai dự án.

### C. Quy trình/skill

- Bắt đầu với một quy trình chính. Có thể thử Superpowers nếu các bước thiết kế, triển khai và review phù hợp.
- Chọn lọc nguyên tắc Karpathy: nêu giả định, sửa đúng phạm vi, giữ đơn giản và kiểm chứng kết quả.
- Chỉ thêm Spec Kit cho công việc cần đặc tả sâu. Không bật đồng thời nhiều bộ điều phối có trách nhiệm chồng nhau.
- Định nghĩa vai trò dưới dạng cấu hình agent theo công cụ đang dùng; file Markdown mô tả vai trò không có nghĩa agent đã được đăng ký.

## 6. Hợp đồng cho mỗi task

```text
ID / dự án:
Mục tiêu và tình huống người dùng:
Tiêu chí hoàn thành quan sát được:
Phạm vi được sửa / phần ngoài phạm vi:
Phụ thuộc và giao kèo API/dữ liệu:
Base commit / nhánh / worktree:
Người triển khai / reviewer:
Tài nguyên thử nghiệm và giới hạn:
Kiểm tra cần chạy:
Kết quả bàn giao: commit hoặc diff, bằng chứng, hạn chế còn lại.
```

Với công việc FE/BE, trưởng nhóm chốt request/response và trạng thái lỗi trước khi chạy hai phần song song. Những file dễ tranh chấp như dữ liệu khóa học, package lock hoặc cấu hình chung cần một người sở hữu tại một thời điểm.

## 7. Vòng điều phối từ lúc giao việc đến khi xong

```text
Nhận yêu cầu → Khảo sát → Chốt tiêu chí → Chia task và phụ thuộc
    → Giao worker → Nhận tiến độ/kết quả → Review
    → Nếu có lỗi: giao lại đúng người → Kiểm tra lại phần liên quan
    → Tích hợp lần lượt → Kiểm tra toàn luồng → Báo cáo → Kết thúc
```

Trạng thái: `queued → ready → running → review → integrating → done`; có thể chuyển sang `blocked` hoặc `failed` kèm lý do. Worker nói “xong” chỉ đưa task đến review.

Coordinator theo dõi các task đang chạy trong phiên làm việc, xử lý câu hỏi và gửi yêu cầu sửa. Nếu worker im lặng/lỗi, kiểm tra trạng thái trước khi khởi động lại để tránh chạy trùng. Gặp cùng lỗi ba lần liên tiếp thì đánh giá lại cách làm; không lặp vô hạn.

Nếu hết hạn mức hoặc thiếu quyền, lưu checkpoint và báo chính xác phần bị chặn. Không ghi hoàn thành giả. Tiếp tục được từ hồ sơ và commit sau khi điều kiện được giải quyết.

Khi xong: dừng worker và tiến trình thử nghiệm do đội tạo, giữ bằng chứng và các nhánh cần xem. Không dừng server/VM người dùng đang sử dụng và không tự xóa worktree còn thay đổi.

## 8. Kiểm chứng riêng cho LabEx

Lệnh dưới đây đã thấy trong package scripts; chưa chạy trong lượt lập kế hoạch này:

```powershell
rtk npm test
rtk npm run build:client
rtk npm run lint --prefix client
```

Chọn kiểm tra theo phạm vi thay đổi. Ghi baseline trước khi triển khai; nếu có lỗi sẵn, ghi cụ thể thay vì nhận toàn bộ bộ kiểm tra là xanh.

- API/runtime: kiểm tra liên quan trong `tests/`, rồi kiểm tra tích hợp phù hợp.
- UI: build/lint theo phạm vi và kiểm tra hành vi trong trình duyệt; build thành công không chứng minh UI đúng.
- Linux/Windows lab: cần bằng chứng hành vi thật trên runtime liên quan nếu tuyên bố đã hoạt động; mock không thay thế kiểm chứng đó.
- Chỉ chạy `test:docker` hoặc script live phù hợp sau khi đọc phạm vi tác động và chuẩn bị tài nguyên thử nghiệm.
- Không reset môi trường học đang dùng hoặc tạo/dừng cloud VM chỉ để kiểm tra đội nếu chưa thuộc phạm vi được giao.

OpenQuiz cần bổ sung bộ lệnh và luồng nghiệm thu từ repo thực tế; không sao chép nguyên cách kiểm tra LabEx.

## 9. Lộ trình triển khai sau khi Anti review

| Bước | Công việc | Đầu ra/điều kiện qua bước |
|---|---|---|
| 1. Khảo sát | Xác định bản CLI, hai vùng đăng nhập, Git và tài nguyên hiện tại | Biết rõ cách chạy từng agent, không thay đổi code sản phẩm |
| 2. Chuẩn bị nền | Giữ thay đổi hiện tại, chọn base commit, tạo hồ sơ và mẫu task | Có thể dựng lại môi trường và giao việc không mất ngữ cảnh |
| 3. Kiểm tra điều phối | Thử coordinator → worker → handoff → reviewer → yêu cầu sửa | Có bằng chứng trao đổi hoạt động, xác định phần còn thủ công |
| 4. Pilot LabEx | Một thay đổi nhỏ được chọn từ backlog hiện tại, không tác động cloud/VM dùng chung | Chạy trọn vòng đến kết quả đã kiểm tra |
| 5. Áp dụng OpenQuiz | Khảo sát repo, thêm hồ sơ và chạy một task nhỏ | Dùng lại quy trình, cấu hình riêng đúng dự án |
| 6. Chuẩn hóa mẫu | Rút bộ mẫu dùng chung và hướng dẫn khởi tạo dự án mới | Dự án sau chỉ cần thêm context, lệnh kiểm tra và backlog |

Không gán tự động các hạng mục trong handover cũ làm pilot. Cần kiểm tra code hiện tại để tránh làm lại phần đã xong.

## 10. Tiêu chí nghiệm thu đội AI

1. Chủ dự án giao một mục tiêu; trưởng nhóm chuyển thành task và tiêu chí rõ.
2. Có ít nhất một lượt phối hợp Anti và Codex, cùng một lượt review độc lập từ Codex B.
3. Task được gửi/nhận qua cơ chế điều phối đã thử; không chỉ có các cửa sổ agent mở cạnh nhau.
4. Không ghi đè thay đổi có sẵn; biết nhánh, worktree và tài nguyên mỗi worker sử dụng.
5. Finding của reviewer được gửi lại, sửa và kiểm tra lại thành công ít nhất một lần trong thử nghiệm.
6. Kết quả tổng hợp được kiểm tra sau tích hợp; báo cáo phân biệt phần đạt, chưa kiểm tra và bị chặn.
7. Hết nhiệm vụ thì kết thúc hoạt động; không cần dịch vụ chạy thường trực.
8. Nếu phải bàn giao thủ công, công khai bước đó và tiếp tục coi tự điều phối là hạng mục chưa đạt.

## 11. Đề nghị Anti phản biện

Đọc kế hoạch này và đối chiếu với LabEx hiện tại. Chưa triển khai hoặc thay đổi tài khoản trong lượt review. Vui lòng trả lời:

1. Vai trò frontend/nội dung của Anti và backend/runtime của Codex còn đúng ở những phần nào?
2. Bản Anti đang dùng có cách nhận task, trả kết quả và nhận yêu cầu sửa từ bên ngoài nào đã kiểm chứng?
3. Có trở ngại thực tế khi chạy Anti CLI và hai tài khoản Codex qua bộ điều phối trong VS Code không? Chỉ đề xuất Orca nếu có lý do cụ thể.
4. Những file và tài nguyên dùng chung nào phải khóa quyền sở hữu hoặc chạy tuần tự?
5. Đề xuất một pilot nhỏ từ backlog hiện tại, với tiêu chí nghiệm thu cụ thể.
6. Phần nào trong kế hoạch cần bỏ, sửa hoặc bổ sung? Nêu bằng chứng từ code/tài liệu, tránh chỉ đồng ý chung chung.

Nếu đã có đường dẫn OpenQuiz trong môi trường của Anti, bổ sung đường dẫn và kiến trúc đã xác minh; nếu không thì ghi chưa khảo sát.

## 12. Nguồn để kiểm tra lại khi triển khai

- OpenAI Docs về CODEX_HOME và phạm vi trạng thái: https://learn.chatgpt.com/docs/config-file/environment-variables
- OpenAI Docs về đăng nhập và credential store: https://learn.chatgpt.com/docs/auth
- Codex CLI: https://learn.chatgpt.com/docs/cli/reference
- Anti CLI headless, JSON và tiếp tục conversation: https://antigravity.google/docs/cli/headless/
- Orca orchestration, gồm worker Antigravity và trạng thái thử nghiệm: https://orca.dev/docs/cli/orchestration
- Orca tách tài khoản Codex và hành vi phiên khi chuyển tài khoản: https://orca.dev/docs/agents/codex-hot-swap
- OpenAI Docs về subagents: https://learn.chatgpt.com/docs/agent-configuration/subagents
- Superpowers: https://github.com/obra/superpowers
- Spec Kit: https://github.com/github/spec-kit
- Hướng dẫn lấy cảm hứng Karpathy: https://github.com/multica-ai/andrej-karpathy-skills

Tài liệu có thể đổi theo phiên bản. Khả năng nêu trong kế hoạch phải được chạy thử trước khi ghi là đã thiết lập.
