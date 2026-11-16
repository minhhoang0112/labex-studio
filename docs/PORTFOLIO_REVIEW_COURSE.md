# Khóa ôn lab CV — thiết kế lại 2026-11-05

URL: `/courses/portfolio-infrastructure-review`.

## Cách học mới

1. Giới thiệu tôi: hồ sơ Hoàng Công Minh theo thông tin người dùng; bản nói ngắn và đầy đủ, 4 ý nhớ, che mẫu, bấm giờ và viết bản riêng.
2. Kể dự án: một nhu cầu nhân viên cụ thể, sơ đồ vai trò AD/DHCP/DNS/GPO/SMB, câu kể ngắn và giới hạn lab.
3. Hiểu từng phần: 9 chủ đề theo thứ tự tài khoản → thư mục → GPO → DNS → DHCP → VLAN → ACL/NAT → Ubuntu network → Linux permissions/service. Mỗi chủ đề có mục tiêu, nhu cầu, từ dễ hiểu, luồng hoạt động, ví dụ đã giải, câu nhớ lại. Lệnh và tài liệu dài được mở khi cần.
4. Tập trả lời: từng câu gắn chủ đề vừa học; người học thử nói/viết trước khi xem mẫu. Tình huống có hướng dẫn hỏi–kiểm tra–sửa–xác minh và 3 mức gợi ý. Có tùy chọn mở toàn bộ ngân hàng.
5. Ôn & luyện AI: quiz từng câu có giải thích, hoặc xuất bộ luyện gồm hồ sơ, lời giới thiệu và sự thật dự án.

12 tài liệu gốc, 60 câu hỏi, 16 ticket và 24 câu quiz được giữ làm ngân hàng/đọc sâu. Không biến việc đọc, bấm giờ hoặc tự đánh dấu thành chứng nhận đã thực hành.

## Tiến độ

Dùng `labex.portfolio-review.v2` trong localStorage. Khi chưa có v2, giữ notes/read/lastQuiz từ v1, bắt đầu phần giới thiệu; không tự đánh dấu các bước mới đã hoàn thành. Có tải ghi chú và toàn bộ tài liệu. Quiz đang làm là trạng thái phiên; lần hoàn thành gần nhất được lưu.

## Nguồn thiết kế

- IES: https://ies.ed.gov/ncee/wwc/PracticeGuide/1 — ví dụ mẫu, tự nhớ lại, liên hệ cụ thể–trừu tượng, ôn giãn cách.
- MIT CAPD: https://capd.mit.edu/resources/interview-primer/ — giới thiệu bản thân liên quan đến vị trí và kinh nghiệm thật.
- NN/g: https://www.nngroup.com/articles/progressive-disclosure/ — đưa việc chính ra trước, thông tin nâng cao mở sau.

Đây là ứng dụng nguyên tắc thiết kế vào khóa local, chưa phải nghiên cứu đánh giá hiệu quả riêng trên người học này. Các nguồn kỹ thuật của phiên bản trước vẫn ở trong khóa.

## Phạm vi

Không gọi VM, không reset lab, không chấm thao tác thật. Thông tin cá nhân do người dùng cung cấp, không suy thêm cơ sở trường, GPA, chứng chỉ, kinh nghiệm công ty hay lịch thực tập. Ngày sinh không dùng để tính tuổi cứng trong lời nói. Phân biệt Packet Tracer và VMware; chưa tuyên bố AD join Ubuntu/backup/monitoring.

## Kiểm tra triển khai

- `node --test tests/portfolioReview.test.js tests/portfolioReviewLearning.test.js tests/windowsRoadmap.test.js tests/navigation.test.js`: 11 kiểm tra đã qua.
- `npm run build:client`: đã build thành công.
- `node scripts/check-portfolio-review-ui.mjs`: đã kiểm tra Chrome desktop/mobile, giữ ghi chú v1, lưu bản nói, 5 bước, câu hỏi/ticket từng mục, quay lại đúng chủ đề, quiz đúng/sai và xuất bộ luyện AI. Không có request khởi động/reset/chấm VM.

Script UI dùng Chrome tại đường dẫn cài đặt Windows hiện có và Playwright từ môi trường dự án/npm cache. Ảnh và bản xuất kiểm tra lưu tại `.artifacts/portfolio-review-v2` khi chạy từ script trong repo.

## Hiểu toàn bộ dự án — 18 chặng

Bước 2 đổi thành **Hiểu dự án**. Mặc định mở phần học toàn dự án; nút riêng để tập kể ngắn sau khi hiểu. 18 chặng đi từ mục tiêu, phân biệt môi trường/IP, cấu hình mạng, Windows/AD/DNS/DHCP/client/share/GPO, Ubuntu và chuỗi sử dụng đầu–cuối, đến sự cố và phạm vi thành quả.

Mỗi chặng chia 4 mục để đọc lần lượt: vì sao cần → thao tác/địa điểm/tác động → bằng chứng lịch sử → tự giải thích. Có câu nhớ lại, ghi chú, tự đánh giá và gợi ý tự kiểm tra. Ghi chú ở localStorage v2 được giữ, dữ liệu mới đặt trong `projectStudy`; không đổi thành trạng thái Pass của VM.

18 chặng là trình tự học theo phụ thuộc, không phải nhật ký thời gian gốc. Cấu hình/ảnh chỉ là bằng chứng lịch sử; không nhận đã tự làm độc lập hiện tại, không thêm AD join Ubuntu/backup/monitoring/tích hợp Packet Tracer–VMware. Khóa giải thích rõ việc người học đã thực hành với AI hướng dẫn.

Ảnh 01–16 được sao chép từ repo gốc vào `client/public/portfolio-review`. Chặng DHCP chỉ rõ ảnh cũ trước exclusion, bản ghi 2026-10-30 mới bổ sung .30. Cấu hình và excerpt trích từ đúng tệp gốc; có giới hạn diễn giải từng bằng chứng.

Nút tải riêng xuất bản giải thích toàn dự án. Bản tải cả khóa và bộ luyện AI cũng bao gồm nội dung này.

Kiểm tra phần hiểu dự án:

- `node --test tests/projectWalkthrough.test.js tests/portfolioReviewLearning.test.js tests/portfolioReview.test.js`: 8 kiểm tra qua.
- `node scripts/check-project-walkthrough-ui.mjs`: 18 chặng, 20 lượt kiểm tra ảnh, 21 trích đoạn, ghi chú/tự đánh giá sau reload, dữ liệu cũ, liên kết học khái niệm, chuyển sang kể ngắn, bản tải và giao diện mobile đều qua.
- `node scripts/check-portfolio-review-ui.mjs`: hồi quy đủ luồng giới thiệu/chủ đề/phỏng vấn/ticket/quiz/xuất AI qua.
- `npm run build:client`: thành công; không chạy hay thay đổi VM để làm các kiểm tra trên.


## Labby Voice riêng cho khóa CV

Bốn nút trên trang khóa học mở gia sư giải thích dự án, luyện giới thiệu, phỏng vấn CV hoặc tình huống. Chat/Voice toàn cục khi ở khóa này cũng nhận cùng kho kiến thức. `server/services/portfolioCoach.js` đọc nguồn khóa học tại thời điểm yêu cầu, gồm hồ sơ, 18 chặng (bỏ đoạn trích bằng chứng dài nhưng giữ cách đọc và giới hạn), 9 chủ đề, 60 câu hỏi và 16 ticket. Không phụ thuộc đoạn content ngắn do browser gửi; không cắt kho kiến thức ở giới hạn 6000 ký tự của ngữ cảnh lab chung.

Chặng/chủ đề được lấy từ tiến độ lưu trong trình duyệt. Cuộc gọi giữ chặng lúc mở; đóng và mở lại sau khi đổi bài. Mỗi lượt chỉ hỏi một câu, chờ trả lời rồi góp ý ở mức thực tập. Khi AI offline không tạo điểm hoặc nhận xét giả. Kiến thức được gửi tới nhà cung cấp AI đã cấu hình để phục vụ cuộc gọi/chat; không phải huấn luyện mô hình vĩnh viễn. Không gửi ghi chú riêng hay toàn bộ localStorage.

Kiểm tra: tests/portfolioCoach.test.js xác nhận nội dung tới setup thoại và yêu cầu chat (provider giả lập); scripts/check-portfolio-voice-ui.mjs kiểm tra nút, chặng đang mở, lỗi quyền mic và payload chat. Chưa kiểm chứng chất lượng nghe/nói bằng cuộc gọi mic thật.
