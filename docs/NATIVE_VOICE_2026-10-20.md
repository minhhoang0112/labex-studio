# Labby Voice hai chiều — 2026-10-20

## Hành vi hiện tại

Voice Mode truyền âm thanh trực tiếp tới Gemini Live thay cho SpeechRecognition → API chat → TTS. Microphone vẫn truyền trong khi AI nói hoặc đang tạo trả lời. Người học chỉ cần nói chen; provider phát hiện giọng nói, hủy lượt trả lời cũ và gửi `interrupted`. Trình duyệt xóa toàn bộ âm thanh đang chờ và dừng phát ngay khi nhận tín hiệu này. Nút Ngắt lời chỉ là tùy chọn tắt tiếng câu hiện tại; không cần bấm để nói.

Model hiện tại `gemini-3.8-live`; có thể đổi bằng `GEMINI_LIVE_MODEL`. Không dùng biến model chat chữ cho cuộc gọi. Đã xác nhận API key sẵn có hỗ trợ model và chấp nhận cấu hình thực tế. Không cần cài phần mềm hay tạo máy ảo mới. Hạn mức/chi phí API Live phụ thuộc tài khoản Gemini; tắt cuộc gọi khi không dùng. Mỗi cuộc gọi tối đa 30 phút, tối đa hai kết nối đồng thời.

## Kiến trúc

- `server/services/liveVoiceGateway.js`: WebSocket `/ws/ai/live`, key ở backend, cấu hình model/hướng dẫn ở server, giới hạn payload/tần suất/bộ đệm/thời gian. Lỗi quota, thiếu key và mất mạng được báo rõ, không giả vờ đang gọi Live rồi dùng luồng cũ.
- `client/src/hooks/useVoiceCall.js`: quản lý microphone, WebSocket, AudioContext, phụ đề và vòng đời. Đóng/retry/lỗi sẽ giải phóng mic, loa, socket và timers. Không phụ thuộc Web Speech Recognition cho cuộc gọi.
- `client/public/audio/live-voice-worklet.js`: thu và phát đồng thời trên audio thread; mic PCM16 mono 16 kHz, gói 32 ms; âm thanh trả về PCM16 24 kHz. Không chờ toàn bộ câu trả lời mới phát. Clear xóa cả phần đang phát và phần xếp hàng.
- Tự nhận kết thúc câu sau khoảng 500 ms im lặng để hạn chế cắt câu tại khoảng nghỉ ngắn. Native audio tránh gọi TTS từng câu và không cần chờ phụ đề hoàn tất. Hướng dẫn model ưu tiên trả lời 1–3 câu, giải thích dài khi được yêu cầu.
- Tốc độ 0,75–2× áp dụng ngay trên luồng phát, lưu cùng thiết lập trước. Đổi tốc độ bằng resampling cũng đổi cao độ; chưa có time-stretch giữ nguyên cao độ.
- Chat chữ và chức năng đọc tin nhắn vẫn dùng pipeline riêng. Không sửa các chức năng máy ảo/Azure hoặc nội dung khóa học.

## Kiểm chứng

`scripts/check-native-voice-live.mjs` gửi hai câu tiếng Việt tổng hợp cố định qua backend thật tới Gemini Live thật. Không ghi microphone vật lý, không gửi lịch sử hoặc nội dung riêng của người dùng. Model nhận đúng cả câu hỏi DNS và câu nói chen “Dừng lại. Chỉ trả lời số bảy thôi.”; hủy giải thích DNS và đáp “Bảy.”.

Một lượt đo: kết nối 785 ms; kết thúc âm thanh câu hỏi → gói âm thanh trả lời đầu tiên 697 ms; bắt đầu câu nói chen → tín hiệu interrupted 341 ms. Đây là độ trễ của lượt thử tổng hợp, không phải cam kết mọi cuộc gọi hay đo trên mic vật lý. Báo cáo `.artifacts/native-voice-live.json`.

`scripts/check-native-voice-ui.mjs` dùng Chrome với thiết bị mic giả và AudioWorklet thật; WebSocket provider mô phỏng. Xác nhận mic vẫn gửi khi đang phát, tín hiệu ngắt lời xóa bộ đệm không bấm nút, đổi tốc độ, mute/unmute, retry, thu hồi mic khi lỗi/quota/đóng. Không có request tới chat/TTS trong cuộc gọi. Báo cáo `.artifacts/native-voice-ui.json`.

`tests/liveVoice.test.js` kiểm tra cấu hình, gateway với socket thật cục bộ, giữ key ở server, quota/cleanup, capture trong lúc phát và xóa âm thanh, mute/tốc độ trên audio processor. Các test voice cũ chỉ còn bao phủ bộ đọc chat/luồng cũ; không được dùng để tuyên bố Live đã hoạt động.

Kết quả sau rà soát: toàn bộ `npm test` đạt 78/78; build client thành công; kiểm tra Chrome mở rộng cho bản build cuối đạt. Lint không có lỗi, còn các cảnh báo đã có ở những component khác. Entrypoint `scripts/check-voice-ui.mjs` chuyển sang kiểm tra native voice mới. Chi tiết: [AI_LOGIC_REVIEW_2026-10-20.md](AI_LOGIC_REVIEW_2026-10-20.md).

## Dùng thử

Cập nhật ngôn ngữ: bổ sung chính sách mặc định tiếng Việt cho mọi lượt và ngắt lời; tên bài/thuật ngữ/câu chào tiếng Anh không tự đổi ngôn ngữ. Chỉ đổi khi được yêu cầu rõ; yêu cầu cho riêng một câu không đổi cả cuộc gọi. Native audio tự chọn ngôn ngữ, không hỗ trợ ép language code theo tài liệu Google, nên chính sách nằm ở system instruction. `scripts/check-native-voice-language.mjs` đã thử Gemini Live thật với ngữ cảnh bài tiếng Anh và bốn lượt: chào Hello + DNS, Windows Backup, yêu cầu tiếng Anh riêng một câu, câu DHCP tiếp theo. Cả bốn đạt ngôn ngữ mong đợi; báo cáo `.artifacts/native-voice-language.json`. Đây là thử nghiệm mẫu, không bảo đảm tuyệt đối mọi phát ngôn. Cuộc gọi cũ phải kết nối lại để nhận chính sách mới.

Ctrl+F5 trang local, mở Voice Mode, cấp quyền microphone. Nói khi thấy kết nối xong. Khi Labby đang nói, nói “Đợi đã…” rồi đặt câu khác; không cần đợi đọc hết hoặc bấm gửi. Nên dùng tai nghe để giảm tiếng loa lọt vào mic; echo cancellation/noise suppression đã bật nhưng còn phụ thuộc thiết bị và trình duyệt. Nếu lỗi quota, kiểm tra hạn mức Gemini API. Nếu mic không lên mức âm, kiểm tra thiết bị mặc định/quyền trang rồi bấm Kết nối lại.

Tài liệu giao thức: https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket ; VAD/ngắt lời: https://ai.google.dev/gemini-api/docs/live-api/capabilities .
