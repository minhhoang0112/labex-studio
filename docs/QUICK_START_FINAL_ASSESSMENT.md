# Bài 11 — Kiểm tra cuối khóa Quick Start with Linux

Bài bổ sung local, không phải đề thi hay một bài thứ 11 của nguồn LabEx. Giữ nguyên 10 bài nguồn và tiến độ terminal. Mở ở `/assessments/quick-start-linux-final`, hoặc nút **Vào bài 11** cuối trang khóa học. Khi hoàn thành bài thực hành cuối cũng có nút sang bài kiểm tra.

## Nội dung và chấm điểm

80 câu chọn một đáp án, kiểm tra cả kiến thức, đọc kết quả, chọn lệnh và chẩn đoán lỗi cơ bản. Phân bổ theo thứ tự 10 bài: **6, 6, 12, 6, 10, 6, 10, 6, 10, 8** câu. Mỗi câu liên kết `lab_id` và `source_step_ids`; test kiểm tra cả 47 bước của khóa đều có câu hỏi liên quan (kể cả bước đọc phương pháp học).

- Mỗi câu đúng có trọng số bằng nhau; sai hoặc bỏ trống bằng 0.
- Điểm phần trăm = số đúng / 80 × 100; đạt từ 80% (64 câu).
- Điểm /10 làm tròn một chữ số; xét đạt theo số đúng thực, không theo điểm hiển thị đã làm tròn.
- Có tổng điểm, số câu trống, điểm theo từng lab và lời giải từng câu.
- Backend giữ đáp án; trước khi nộp chỉ trả câu hỏi và lựa chọn. Đảo thứ tự lựa chọn khi tạo lượt; giữ thứ tự này khi tải lại.
- Lượt đã nộp bất biến: gửi lại chỉ trả kết quả cũ, không chấm lại theo đáp án mới. Muốn làm lại phải tạo lượt mới.
- Không giới hạn thời gian; không yêu cầu bật môi trường lab hoặc chứng minh hoàn thành terminal trước khi làm đề.

## Lưu dữ liệu và API

Lượt làm lưu ở `server/runtime/state/assessments/<random-id>.json`. Draft lưu qua backend và trình duyệt; trang tự khôi phục lượt gần nhất trên trình duyệt đó. Mã lượt là token ngẫu nhiên, không phải tên người dùng. Đây là công cụ học local, không phải hệ thống giám sát thi hoặc xác thực danh tính.

| API | Chức năng |
| --- | --- |
| GET `/api/assessments/quick-start-linux-final` | Metadata, phạm vi, ngưỡng đạt; không đáp án |
| POST `/api/assessments/quick-start-linux-final/attempts` | Tạo lượt, lấy đề không có lời giải |
| GET `/api/assessments/attempts/:id` | Khôi phục draft/kết quả |
| PUT `/api/assessments/attempts/:id/answers` | Lưu `{answers: {questionId: optionId}}` |
| POST `/api/assessments/attempts/:id/submit` | Chấm cùng dạng body; không tin score/pass do client gửi |

Mọi response assessment đặt `Cache-Control: no-store`. Bộ câu hỏi có hash phiên bản trong lượt làm; thay bộ câu hỏi khiến lượt cũ trả 409 yêu cầu làm lượt mới, tránh chấm âm thầm bằng đáp án phiên bản khác. Không sửa thủ công file lượt làm để nâng điểm.

## Thoại Labby

Sau khi nộp, từng câu có nút **Vấn đáp với Labby về câu này**, tái sử dụng thoại trực tiếp và đưa câu hỏi/căn cứ giải thích vào ngữ cảnh. Người học có thể giải thích lại cách hiểu hoặc nhờ hỏi sâu thêm. Cuộc thoại cần cấu hình AI Live và quyền micro đang có của hệ thống; không có dịch vụ AI thì bài trắc nghiệm vẫn hoạt động.

Điểm chính thức của bài 11 là điểm trắc nghiệm do backend tính. Thoại hỗ trợ ôn tập, không tự thay đổi điểm và chưa phải một kỳ thi vấn đáp độc lập có bộ chấm ngữ nghĩa.

## Bảo trì và kiểm tra

- Nguồn câu hỏi: `scripts/build-quick-start-exam.py`; sinh `server/data/assessments/quick-start-linux-final.json`.
- Ngân hàng nằm ngoài thư mục labs/public/dist, không được expose bằng static middleware.
- Backend: `server/services/courseAssessment.js`, `server/routes/assessments.js`.
- Giao diện: `client/src/views/CourseAssessment.jsx` và liên kết từ CourseDetail/LabWorkspace.
- Test: `tests/courseAssessment.test.js` kiểm tra coverage, draft qua restart, ngưỡng 63/64 câu, câu sai/trống, chặn payload lạ, không lộ đáp án trước nộp, không tin điểm client, kết quả bất biến và phiên bản thay đổi.
- Smoke UI: `scripts/check-course-assessment-ui.mjs` làm 80 câu qua UI, tải lại, kiểm tra kết quả 100%, xem 80 lời giải, lượt mới trống đạt 0%, kiểm tra mobile. Không gọi Azure hay AI provider. Báo cáo `.artifacts/course-assessment-ui.json`.

```powershell
rtk proxy python -X utf8 scripts/build-quick-start-exam.py
rtk npm test
rtk npm run build:client
rtk proxy node scripts/check-course-assessment-ui.mjs
```
