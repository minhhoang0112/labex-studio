# Labby AI: kiểm tra và sửa ngày 19/10/2026

## Nguyên nhân và thay đổi

- Giao diện gọi cứng `http://localhost:5000/api/ai/chat`, gây yêu cầu khác origin khi trang mở bằng `127.0.0.1`. Đã dùng API helper với URL tương đối `/api/ai/chat`.
- Nút hỏi AI từ bước học truyền `{ text, id }` nhưng API chỉ nhận chuỗi. Đã lấy trường `text` trước khi gửi.
- Đã xử lý HTTP lỗi, timeout và phản hồi trống; hiển thị nguyên nhân an toàn thay vì luôn báo backend port 5000.
- Nhãn trạng thái dựa trên phản hồi thực tế: chưa gửi, đang trả lời, Gemini/OpenAI, Offline hoặc lỗi. Không hiển thị Online cố định.
- Đã gửi lịch sử hội thoại, ngữ cảnh bước học và đầu ra PowerShell của Windows Console. Hướng dẫn hệ thống phân biệt môi trường Linux với Azure Windows VM.
- Backend trả về model thực tế và thông báo offline khi key/quota/model/kết nối gặp lỗi. Không ghi key hoặc nội dung lỗi thô của nhà cung cấp vào log.
- `GET /api/ai/status` chỉ phản ánh cấu hình, không khẳng định dịch vụ đang online và không trả key.

## Bằng chứng kiểm tra

- Kiểm tra riêng API Google với câu chào thử nghiệm: danh sách model HTTP 200; `gemini-3.5-flash` có trong danh sách; generateContent HTTP 200, có câu trả lời. Báo cáo `.artifacts/ai-provider-check.json` không chứa key.
- `rtk proxy node --test tests/ai.test.js`: 6/6 đạt, gồm Gemini thành công/lỗi, fallback, key mẫu, Windows và OpenAI bằng fetch mô phỏng.
- `rtk proxy node scripts/check-labby-ai-ui.mjs`: đạt trên Chrome cho URL cùng origin ở cả `127.0.0.1` và `localhost`, phản hồi, offline/notice, lỗi HTTP, lịch sử và nút hỏi theo bước.
- Kiểm thử giao diện chặn toàn bộ yêu cầu chat và trả HTTP fixture ngay trong trình duyệt; không gửi nội dung bài học tới Google. Báo cáo `.artifacts/labby-ai-ui-check.json`, ảnh `.artifacts/labby-ai-ui-fixture.png`. Ảnh là phản hồi mô phỏng, không phải bằng chứng gọi model thật.
- Lượt thử giao diện với model thật và ngữ cảnh bài học đã bị kiểm duyệt tự động từ chối vì có thể chứa dữ liệu riêng; đã thay bằng cách kiểm tra riêng provider với câu chào và giao diện với fixtures. Chưa kiểm thử đầu cuối gửi ngữ cảnh bài học thực tế tới model.
- Client đã build và backend đã khởi động lại để phục vụ bản sửa. Không cần thay API key hoặc model cho lỗi này.

Khi người dùng gửi câu hỏi trong ứng dụng, backend vẫn gọi nhà cung cấp đã cấu hình với câu hỏi, lịch sử và ngữ cảnh bước học để trợ giảng trả lời theo bài.
