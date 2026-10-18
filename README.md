# LabEx Local — học Linux với Docker và WSL

Ứng dụng học Linux chạy local, gồm React/Vite, Express, terminal xterm.js + node-pty và bộ chấm bài thực hành. Mã hiện tại được phát triển từ bản dựng Antigravity. Giáo trình gồm tài liệu Anti đã nhập trong workspace và phần hướng dẫn/tóm tắt do dự án biên soạn; tiếng Việt chỉ có ở các trường đã được dịch. Chưa phục hồi toàn bộ tài liệu, image hoặc mã bộ chấm riêng của LabEx.

## Chạy trên Windows

Máy cần Node.js 24 và WSL với Ubuntu. Dự án đã được kiểm thử với Ubuntu đang cài trên máy này.

Mở **run.bat** tại thư mục dự án. Tệp này cài dependency nếu chưa có, build giao diện hiện tại, khởi động server, rồi mở trình duyệt khi server sẵn sàng:

**http://127.0.0.1:5000/learn**

Dùng cùng địa chỉ này giữa các buổi học để giữ tiến độ trong trình duyệt. `run.bat` khởi động engine Docker riêng nếu được chọn, rồi thay đúng server cũ của dự án; không dừng Vite của Anti. Server chạy nền, log ở `.artifacts/server.*`.

Chạy thủ công:

```powershell
npm ci
npm ci --prefix client
npm run build:client
npm start
```

Phát triển giao diện và backend đồng thời:

```powershell
npm run dev
```

Mở http://localhost:5173; Vite chuyển tiếp /api và /ws sang backend. Dev và bản build có vùng lưu tiến độ riêng do khác origin.

## Nội dung hiện có

- **Quick Start with Linux:** 5 lab + 5 challenge, 67 sections và 47 nhiệm vụ; đã chạy đạt 47/47 trên Docker Ubuntu 22.04.
- **Become a Junior System Administrator:** 10 challenge, 68 sections/48 nhiệm vụ; Docker đã chạy đạt 47 nhiệm vụ, còn 1 bước kernel log bị chặn rõ ràng. Namespace cũ hỗ trợ 33/48.
- **Linux for Noobs:** 37 bài/208 sections/134 nhiệm vụ; Docker đã kiểm tra 100 nhiệm vụ đạt sau khi làm thật, 34 bước chưa hỗ trợ bị chặn rõ. Đã đồng bộ tiếng Việt đủ 208 sections.
- **Shell for Beginners:** 18 bài/74 nhiệm vụ; đã sửa theo yêu cầu công khai và kiểm tra 73 nhiệm vụ đạt trên Docker, còn 1 bước WebIDE chưa có dịch vụ. Hướng dẫn Anh/Việt và bộ chấm do dự án biên soạn lại; chưa khôi phục bộ chấm riêng của nguồn.
- **Linux Commands Practice Online:** đủ 41 bài/263 sections/181 nhiệm vụ, có Anh/Việt và dữ liệu riêng; Docker đã kiểm thử 181/181 nhiệm vụ đạt sau khi làm thật. Dùng image Commands riêng có cowsay/tree/gcc; hướng dẫn và bộ chấm local được biên soạn theo yêu cầu công khai. [Chi tiết triển khai](docs/COMMANDS_COURSE_IMPORT_2026-10-17.md).
- **Lộ trình Linux:** snapshot nguồn gồm 8 khóa/325 mục, 319 bài duy nhất. Hiện có 116 bài nguồn duy nhất thuộc 5 khóa trên; 6 bài còn dùng lại trong Linux Practice Challenges nên roadmap có 122 mục đã nhập. CompTIA và Security còn metadata/outline. API `/api/roadmaps/linux-system-administrator` tách số nguồn, số đã nhập và số chấm đủ; kèm mục tiêu, kỹ năng đầu vào và cách học từng khóa.
- **Local Exercises:** 4 bài tự biên soạn, 12 bước — log, kiểm kê tệp, backup/checksum và tự động hóa. Đây là nhóm riêng, không thay thế khóa nguồn Linux Commands Practice Online 41 bài.
- Docker và Git: mỗi khóa 1 bài từ bản dựng trước; chưa kiểm chứng trong đợt này.
- AWS và Cybersecurity: mới có thẻ khóa học, chưa có bài thực hành.

Chi tiết sửa và bằng chứng từng khóa: [FIDELITY_REPAIRS_2026-10-17.md](docs/FIDELITY_REPAIRS_2026-10-17.md). Báo cáo khóa học tổng hợp bằng chứng từ nhiều lượt chạy, chỉ nhận bài có đủ mọi nhiệm vụ; không coi đó là một lượt chạy liên tục.

Đã sửa phần FE từng bàn giao Anti: responsive, tiến độ, modal reset, điều hướng bài dùng chung, readiness và giữ phiên shell. Kết quả: [WORKSPACE_REPAIRS_2026-10-17.md](docs/WORKSPACE_REPAIRS_2026-10-17.md).

Các bài có hướng dẫn Markdown, sao chép lệnh, nhiệm vụ, kiểm tra kết quả thật và gợi ý. Chỉ bước được server chấm đạt mới được ghi nhận hoàn thành. Bạn vẫn có thể đọc bước khác trước khi làm bài. Hoàn thành mọi bước sẽ có nút mở bài kế tiếp.

Tiến độ, vị trí đang học và giao diện tối được lưu trong localStorage của trình duyệt. Không có tài khoản, đồng bộ nhiều thiết bị hay cấp chứng chỉ LabEx.

## Terminal và dữ liệu thực hành

Máy này đã cài và chọn **Docker rootless 29.9.1**, image Ubuntu **22.04.5**. Mỗi bài có container, tài khoản và dữ liệu riêng; terminal và bộ chấm thấy cùng tiến trình, package database và cron. Người học dùng `labex`, sudo thật, HOME `/home/labex`, cwd `/home/labex/project`. Không mount ổ host hoặc Docker socket vào bài học.

Engine, socket và dữ liệu container nằm dưới tài khoản WSL thường:

```text
<home-tài-khoản-WSL>/.local/share/labex-local/docker-rootless/
```

Tệp thực hành vẫn còn khi đóng/mở bài. Đổi tab Terminal/AI giữ nguyên shell và hội thoại; tải lại trang hay kết nối lại mở shell mới nhưng giữ tệp. Các bài độc lập, không cần chép tệp từ bài trước.

Đã kiểm chứng quản lý tài khoản, quyền, tiến trình, APT, cron và UFW bằng thao tác thật. Chưa cung cấp kernel log riêng, systemd, SSH authentication, XFCE/noVNC, WebIDE hoặc Web 8080. `network:true` không có nghĩa đã có các dịch vụ/giao diện này. Đọc capability thật qua `GET /api/environment`.

Reset bằng `POST /api/labs/<id>/reset` với JSON `{"confirmReset":true}`. Server ngắt terminal bài đó, dừng/đổi tên container cũ thành bản lưu rồi tạo lại. Manifest thay đổi chỉ báo `reset_required`, không tự ghi đè tệp. Nhật ký lệnh phục vụ tự học, không phải cơ chế chống gian lận.

Provider namespace cũ vẫn có thể chọn bằng `npm run runtime:namespace` rồi chạy lại `run.bat`; dữ liệu ở `~/.local/share/labex-local/environments/<lab-id>`. Nó dùng Ubuntu 26.04.1 của WSL, `/usr` chỉ đọc và không cung cấp package/network/cron scheduler như Docker. Hai provider không tự di chuyển công việc qua nhau. Chi tiết cài đặt, khởi động và giới hạn: [ROOTLESS_RUNTIME.md](docs/ROOTLESS_RUNTIME.md).

Server mặc định chỉ lắng nghe 127.0.0.1. Không triển khai backend terminal này lên hosting công khai.

## Trợ giảng

Không cần API key: trợ giảng offline giải thích các lỗi thường gặp, một số lệnh Linux và gợi ý theo nhiệm vụ hiện tại. Đây là bộ quy tắc, không phải mô hình AI.

Muốn dùng AI online, chép .env.example thành .env và cấu hình **cả key lẫn model** của nhà cung cấp bạn sử dụng:

```dotenv
PORT=5000
WSL_DISTRO=Ubuntu

# Chọn một nhà cung cấp; model phải có quyền truy cập trên tài khoản.
GEMINI_API_KEY=
GEMINI_MODEL=

OPENAI_API_KEY=
OPENAI_MODEL=
```

Key được giữ ở server. Khi được cấu hình, câu hỏi, lịch sử gần đây, nhiệm vụ và output terminal gần đây được gửi đến nhà cung cấp tương ứng. Giao diện hiển thị offline/Gemini/OpenAI; nếu gọi API lỗi, tự trở về offline và hiện thông báo. Chưa thử gọi dịch vụ thật bằng key của bạn.

Implementation tham chiếu [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text) và [Gemini generateContent](https://ai.google.dev/api/generate-content).

## Kiểm chứng

```powershell
npm test
npm run check:labs
```

Chạy smoke khóa Quick Start bằng terminal Linux cách ly:

```powershell
node tests/source-course.smoke.mjs --provider=docker
node tests/source-course.smoke.mjs tests/scenarios/junior-docker-course.json --provider=docker
node tests/source-course.smoke.mjs tests/scenarios/linux-for-noobs-docker.json --provider=docker
```

Các kiểm tra tích hợp bổ sung, yêu cầu WSL/Linux và có tạo tệp trong HOME thực hành riêng:

```powershell
node tests/runtime.wsl-smoke.js
node tests/runtime.terminal-smoke.js
```

`npm run test:docker` chạy unit test với cấu hình Docker. `server/data/generate_labs.py` chỉ kiểm dữ liệu/cú pháp, không chạy lệnh bài học trên host. Mode `--smoke-linux` cũ đã bị vô hiệu hóa. Những script check_e2e\*.py cũ chỉ đọc capture Antigravity theo đường dẫn tuyệt đối; chúng không phải bộ E2E hiện tại. Báo cáo Docker tổng hợp các bài đã chạy đầy đủ qua nhiều lượt; không gọi lượt bị gián đoạn là một lần chạy hoàn tất.

Anti phụ trách tích hợp frontend theo [hợp đồng backend](docs/ANTIGRAVITY_BACKEND_CONTRACT.md): sections Introduction/Summary, nút Continue, tiến độ mới và capability môi trường. Backend cập nhật không tự làm giao diện giống nguồn.

Phần FE sections/progress v2/reset của Anti đã có. Việc tiếp theo dùng [prompt roadmap mới](docs/ANTIGRAVITY_LINUX_ROADMAP_PROMPT.md), tránh làm lại phần đã xong. Xem [trạng thái backend và bằng chứng](docs/LINUX_BACKEND_STATUS.md). Nếu đã mở Junior trước đợt sửa fixture, kiểm tra trạng thái môi trường và chủ động Reset bài để nạp fixture mới; dữ liệu cũ được lưu bản sao.

Xem [bản đồ mã nguồn, bằng chứng REA và phần chưa làm](docs/REIMPLEMENTATION.md).
