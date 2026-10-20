# Rà soát logic Labby AI — 2026-10-20

## Lỗi đã sửa

1. Mỗi gói âm thanh AI đặt lại cờ bắt đầu phụ đề người dùng, khiến các mảnh lời nói chen bị mất phần đầu khi xen kẽ với âm thanh AI. Chỉ mở cửa sổ phụ đề mới tại đầu lượt trả lời; `turnComplete` của lượt bị ngắt không xóa câu người dùng đang nói.
2. Gói chứa đồng thời phụ đề cuối và `interrupted` có thể thay cả câu AI bằng vài chữ cuối. Ghép phần cuối vào câu cũ trước khi mở cửa sổ phụ đề câu mới.
3. Nút nghe có thể chuyển trạng thái lỗi thành “đang lắng nghe” dù mic/socket đã đóng. Khóa thao tác khi chưa sẵn sàng và hiển thị cuộc gọi đã ngắt khi có lỗi; xóa thông báo “mic luôn nghe” khi phiên lỗi.
4. Mic ngắt trong lúc đợi AudioContext/AudioWorklet có thể cho luồng async mở socket muộn hoặc ghi đè nguyên nhân lỗi. Kiểm tra cả disposed/stopped sau await; bảo toàn lỗi đầu tiên.
5. Chưa bắt callback lỗi AudioWorklet, có thể để giao diện chờ trong khi bộ xử lý âm thanh đã dừng. Hiện báo lỗi, đóng socket/context và dừng mic.
6. Thay bước/bài trong cuộc gọi vẫn giữ ngữ cảnh bước cũ ở provider. Hiện đổi lessonId/stepId sẽ đóng phiên cũ và tạo phiên với ngữ cảnh mới. Việc này bắt đầu hội thoại mới, không giữ lịch sử âm thanh của bước trước. Không tự nối lại vô hạn khi mất mạng.
7. WebSocket nhận JSON hợp lệ nhưng có giá trị null/mảng/số có thể gây exception ngoài parser. Hiện từ chối bằng lỗi rõ, đóng phiên và không để callback throw. Bắt cả lỗi khởi tạo upstream đồng bộ.
8. Khi chuyển từ chat chữ sang Voice, phản hồi chat toàn cục vừa bị hủy vẫn có thể cập nhật giao diện/đọc theo thiết lập cũ. Thêm kiểm tra abort trước khi nhận kết quả và chỉ giải phóng đúng request đang giữ.
9. Mute/unmute chưa đặt lại các mẫu tạm của bộ resample. Hiện xóa bộ đệm mẫu còn dang dở cùng với bộ đếm mic.

## Kiểm chứng

- `npm test`: 78/78 đạt, gồm WebSocket thật cục bộ, dữ liệu không hợp lệ, quota/cleanup và xử lý âm thanh.
- `npm run build:client`: đạt. Lint không có lỗi; còn cảnh báo cũ ở component khác.
- `scripts/check-native-voice-ui.mjs`: Chrome với getUserMedia + AudioWorklet thật, mic giả, provider mô phỏng. Tái hiện gói phụ đề/âm thanh xen kẽ, interruption + turnComplete, đổi courseId/context, mic ngắt trong lúc AudioContext.resume đang chờ, đóng trước khi quyền mic hoàn tất, quota, callback lỗi audio processor, retry, mute và tốc độ. Toàn bộ đạt. Lỗi processor được kích qua callback để kiểm tra cleanup; không cố tình làm audio thread thật bị crash. Báo cáo `.artifacts/native-voice-ui.json`.
- `scripts/check-native-voice-live.mjs`: Gemini Live thật, âm thanh tổng hợp cố định. AI nghe đúng câu hỏi DNS và câu nói chen; dừng giải thích DNS rồi đáp “Bảy.”. Lượt đo mới: phản hồi đầu 905 ms tính từ cuối clip câu hỏi, interrupted sau 306 ms từ đầu clip nói chen. Không phải cam kết độ trễ mọi cuộc gọi. Báo cáo `.artifacts/native-voice-live.json`.
- Quy tắc tiếng Việt đã được kiểm tra với ngữ cảnh tiếng Anh ở cả vai gia sư và phỏng vấn, mỗi vai bốn lượt cố định; có một lượt yêu cầu tiếng Anh rõ ràng và lượt sau trở lại tiếng Việt. Cả hai kịch bản đạt; báo cáo `.artifacts/native-voice-language.json` và `.artifacts/native-voice-language-interviewer.json`. Các phép thử ngôn ngữ gửi câu chữ mẫu tới model native audio, không phải bản thu mic người dùng.

## Giới hạn thực tế

- Chưa kiểm chứng microphone/loa vật lý của người dùng; echo cancellation còn phụ thuộc thiết bị. Nên dùng tai nghe.
- Ngôn ngữ do hướng dẫn model điều khiển; kiểm thử mẫu không bảo đảm model tuyệt đối không lệch ngôn ngữ.
- Nội dung terminal truyền cho cuộc gọi là ảnh chụp tại lúc kết nối, không đồng bộ từng ký tự đầu ra terminal trong phiên đang diễn ra. Kết nối lại để lấy đầu ra mới nhất. Đổi bước/bài đã tự tạo phiên mới.
- Thay tốc độ phát bằng resampling cũng thay đổi cao độ. Chưa triển khai time-stretch giữ nguyên cao độ.
- Retry/đổi vai/đổi bước tạo phiên mới, không khôi phục lịch sử cuộc gọi cũ. Giới hạn 30 phút/phiên và quota nhà cung cấp vẫn áp dụng.

Giao thức tham khảo: https://ai.google.dev/api/live . Đặc biệt, input transcription không đảm bảo thứ tự với các gói âm thanh khác; output transcription cuối có thể đi kèm tín hiệu ngắt lượt.
