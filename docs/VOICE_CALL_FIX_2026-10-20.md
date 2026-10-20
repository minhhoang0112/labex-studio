# Sửa đàm thoại Labby Voice — 2026-10-20

> Bản ghi lịch sử cho luồng đổi lượt trước đây. Voice Mode hiện đã thay bằng Gemini Live hai chiều, xem [NATIVE_VOICE_2026-10-20.md](NATIVE_VOICE_2026-10-20.md). Hướng dẫn bấm Ngắt lời và kết quả kiểm thử SpeechRecognition bên dưới không mô tả cuộc gọi hiện tại. TTS vẫn dùng cho đọc tin nhắn ở khung chat chữ.

## Kết quả và nguyên nhân

Luồng cũ giữ các callback của SpeechRecognition từ một render React cũ. Sau khi đổi trạng thái nghe/nói, những callback vẫn đọc `callState`, `isMuted`, `history` và `transcript` cũ. Kết thúc một lượt có thể không mở lại mic; bật lại mic và fullscreen còn đi qua các nhánh xử lý khác nhau. Timer gửi lời nói và sự kiện kết thúc chưa dùng chung chốt chống gửi trùng.

Audio chào dài chạy trước khi mở mic; câu AI bị cắt 300–320 ký tự; proxy TTS không có deadline. Ngoài ra, lỗi HTTP AI bị phát thành câu “chưa nghe rõ”, khiến người dùng tưởng mic hỏng. Chat hiện tại cũng được chép vào history rồi backend lại thêm lần nữa. Mic nhập chữ và mic cuộc gọi có thể cùng hoạt động.

## Thay đổi

- `client/src/lib/voiceSession.js` quản lý riêng vòng đời cuộc gọi, giữ trạng thái hiện tại và lịch sử user/assistant. Final result hoặc onend gửi câu một lần; kết quả tạm dùng cửa sổ im lặng 650 ms. Chấp nhận câu ngắn một ký tự.
- Hủy nhận dạng khi gửi/trả lời để tránh thu lại giọng AI. “Ngắt lời” hủy AI request/phát âm hiện tại rồi nghe lại; phản hồi cũ không được cập nhật cuộc gọi mới. Đây là luồng đổi lượt, không phải streaming audio hai chiều của một dịch vụ Realtime.
- `useVoiceCall` xin quyền mic trước, hiển thị thiết bị mặc định và mức âm bằng AudioContext. Mic không bị giữ sau khi đóng/retry/đổi persona, kể cả khi lời hứa xin quyền mic hoàn tất muộn.
- Tắt/bật mic dùng cùng một logic ở dock, fullscreen và minimized. Mic nhập chữ/auto-read của khung chat được tạm khóa khi gọi để tránh hai recognizer hoặc giọng đọc cạnh tranh.
- Lỗi mic, quyền thiết bị, mạng nhận dạng, backend AI và phát âm thanh được phân biệt. Lỗi quyền không tự lặp xin quyền; lỗi mạng chỉ thử tự động một lần. Cảnh báo còn hiển thị khi mic đã nghe lại, cho đến lượt mới hoặc retry.
- `speechPlayer` đọc toàn bộ câu trả lời theo các đoạn tối đa 170 ký tự, tải trước đoạn kế tiếp, có timeout tải và watchdog phát. Chỉ dùng giọng tiếng Việt nếu phải dự phòng sang speechSynthesis. Cancel dọn cả audio tải trước lẫn giọng native.
- Tốc độ 0,75×/1×/1,25×/1,5×/1,75×/2×; mặc định 1,25×, lưu `labex.voice.rate`. Audio đang phát đổi tốc độ ngay. Với speechSynthesis dự phòng, tốc độ mới áp dụng từ đoạn tiếp theo.
- `server/services/textToSpeech.js`: giới hạn 200 ký tự mỗi request, timeout 5,5 giây, kiểm tra MIME/kích thước, cache RAM hữu hạn 5 phút. Browser cache là private; không còn cắt chuỗi âm thầm hoặc public-cache nội dung lời nói.
- Backend voice dùng ngữ cảnh ngắn hơn và giới hạn output Gemini; loại câu hỏi hiện tại bị lặp trong history. Hủy request phía client cũng hủy fetch provider. Phỏng vấn offline trong Voice Mode không trả điểm 8/10 giả định.

## Kiểm tra

- 72/72 Node tests đạt, bao gồm 15 ca mới về gửi một lần, history, mic resume/mute, quyền, timeout, phản hồi muộn, chunk/rate, ngắt giọng native và TTS validation.
- `scripts/check-voice-ui.mjs`: Chrome dùng thiết bị âm thanh giả lập thật cho getUserMedia/AudioContext; SpeechRecognition, Audio và chat được mô phỏng có kiểm soát. Đã kiểm tra đủ lượt nói liên tiếp, tốc độ, nội dung dài, retry/quyền, cleanup và các chế độ cửa sổ. Không ghi âm mic vật lý.
- `scripts/check-voice-audio-live.mjs`: endpoint TTS thật và HTMLAudioElement thật, câu chào cố định. MP3 dài 3,192 giây, phát 1,5× đo khoảng 2,252 giây kể từ playing. Không truy cập microphone.
- `scripts/check-voice-services.mjs`: một lượt Gemini `gemini-3.5-flash-lite` khoảng 1060 ms, TTS khoảng 364 ms. Chỉ gửi câu chào cố định, không gửi context bài/history/mic của người dùng. Đây là một phép đo, không phải cam kết độ trễ cho mọi câu.
- Build client đạt; lint không có lỗi, còn các cảnh báo có sẵn ở thành phần khác.

## Cách dùng và giới hạn cần phân biệt

Tải mới trang bằng Ctrl+F5, mở Voice Mode, cho phép Microphone. Nói khi thấy “Đang lắng nghe”; phụ đề cho biết đã nhận được chữ hay chưa. Nếu đang nghe AI, bấm “Ngắt lời” trước khi nói. Dùng bộ chọn tốc độ; 1,5× phù hợp nếu 1,25× vẫn chậm.

Nhận dạng vẫn dùng dịch vụ Web Speech của trình duyệt, cần Chrome/Edge phù hợp, quyền mic và mạng của dịch vụ đó. Mức âm chỉ xác nhận có tín hiệu capture, không chứng minh dịch vụ nhận dạng đã chuyển được thành chữ. Chưa có backend STT dự phòng hoặc kết nối Gemini Live. Chưa kiểm chứng giọng nói thực của chủ máy; các phép thử mic dùng thiết bị giả lập. TTS proxy tiếp tục dùng dịch vụ Google Translate sẵn có của dự án, không có bảo đảm SLA; lỗi sẽ được hiển thị và nội dung chữ vẫn giữ lại.

Nguồn kỹ thuật: [SpeechRecognition end](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/end_event), [lỗi nhận dạng](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionErrorEvent/error), [quyền getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [playbackRate](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate), [speechSynthesis rate](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/rate).
