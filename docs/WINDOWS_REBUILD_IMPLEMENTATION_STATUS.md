# Trạng thái triển khai Windows v2

Cập nhật: 27/10/2026. Kế hoạch gốc: `WINDOWS_REBUILD_MASTER_PLAN.md`.

## Đã triển khai trong đợt đầu

- Điều hướng lưu nguồn xuất phát và vị trí cuộn trong từng history entry. Lab → khóa → lộ trình quay lại đúng ngữ cảnh; chuyển bài liên tiếp vẫn quay về khóa. Deep link Windows không có nguồn xuất phát quay về `/paths/windows`.
- Giữ bộ lọc, trang danh mục, chế độ lộ trình và lựa chọn danh sách bài khi quay lại. Chờ dữ liệu trang tải xong trước khi khôi phục cuộn.
- Mẫu bài mới: đề bài, máy/tài khoản, việc cần làm, kết quả bàn giao; 3 gợi ý mở dần và hướng dẫn GUI chi tiết đóng mặc định. Gợi ý đóng lại khi đổi mục.
- Hai bài có runtime thực tế sẵn có đã chuyển sang mẫu này: `win-it-scheduled-backup-permissions`, `win-it-file-in-use`. Đây là **chuyển đổi hai bài đã có**, không tính thành hai lab mới.
- Khóa IT Support mở mặc định danh sách ticket GUI, có nút xem toàn bộ bài cũ. API và thứ tự chuyển bài đều ưu tiên ticket mới; giữ `order`, ID nhiệm vụ, bộ chấm và tiến độ cũ.
- Lớp nội dung v2 nằm riêng trong `server/data/windows-practical-v2.json`, được ghép tại catalog. Script tạo giáo trình cũ không ghi đè lớp này.

## Kiểm chứng

- `npm test`: 137/137 đạt.
- Build frontend đạt; còn cảnh báo bundle lớn đã có trước.
- `scripts/check-windows-practical-navigation-ui.mjs`: đạt với Chrome headless, API khóa học thật và UI build thật; kiểm tra danh sách 2 ticket, gợi ý đóng, chuyển mục, quay lại khóa/lộ trình, scroll, reload, browser Back/Forward và deep link.
- Kiểm tra UI cô lập tất cả API VM/AI, không chạy lệnh hoặc bật/tắt VM. Không dùng kết quả UI để tuyên bố đã kiểm lại Windows guest.
- Kiểm tra contract đảm bảo lớp trình bày không sửa verification, ID nhiệm vụ hoặc bản hướng dẫn gốc.

## Còn phải làm — chưa coi là hoàn thành giáo trình

### Đợt tiếp theo: Windows Service (27/10/2026)

- Đã thêm bài mới `win-it-service-config-recovery`, thứ tự ưu tiên GUI số 3. Tổng khóa có 28 bài; 3 bài dùng mẫu ticket GUI, không phải toàn bộ 28 bài đã được xây dựng lại.
- Có chương trình C# Windows Service riêng `LabExDocumentAgentV2` do SCM quản lý, chạy LOCAL SERVICE. Không dùng dịch vụ hệ thống để tạo lỗi. Bài yêu cầu Services → Event Viewer/log → sửa XML trong Notepad → Start → tạo yêu cầu Inbox → xem phiếu Outbox.
- Backend chuẩn bị service tốt và thử chức năng trước khi nạp cấu hình sai; kiểm tra lỗi khởi động và sự kiện ứng dụng thật. Bộ chấm gửi yêu cầu mới ngẫu nhiên, đối chiếu kết quả, danh tính, binary, cấu hình và dữ liệu. Reset chỉ gỡ service, nguồn sự kiện và thư mục thuộc bài.
- Đã biên dịch đúng dạng WindowsApplication và thử 10 điều kiện xử lý tệp/đường dẫn/XML trên local; không cài service trên máy chính. Có test lifecycle, timeout, contract và script nghiệm thu `scripts/check-it-support-service-live.mjs`.
- **Đã nghiệm thu chức năng trên CLIENT01 ngày 27/10/2026**, sau khi người dùng cho phép bật để thử rồi tắt. Bằng chứng: `.artifacts/it-support-service-live.json`, `passed: true`, `reset: true`. Chuỗi thật: baseline SCM xử lý yêu cầu → cấu hình sai gây lỗi khởi động và ghi Application event → chưa sửa bị chấm sai → sửa cấu hình xử lý được yêu cầu ngẫu nhiên mới → dừng service dù còn phiếu cũ bị chấm sai → service Running nhưng nguồn bị sửa bị chấm sai → khôi phục dữ liệu được chấm đạt → gỡ sạch fixture. Thao tác sửa trong kiểm thử dùng PowerShell tương đương GUI; chưa phải thử người học thao tác toàn bộ bằng chuột.
- Đã sửa lỗi tích hợp phát hiện trên VM: payload service vượt giới hạn EncodedCommand. Chỉ nén kịch bản nội bộ do server quản lý, giữ nguyên giới hạn lệnh người dùng; regression test kiểm kích thước và giải nén. Reset hỗ trợ phiên chưa tạo được tài nguyên, chỉ coi sạch khi không tồn tại cả thư mục, service và event source.
- Bộ test Node: **139/139 đạt**. Nhãn bài đã chuyển thành `live-client-verified-2026-10-27`; không còn cảnh báo chờ nghiệm thu. Điều này chỉ xác nhận bài service, không xác nhận toàn bộ giáo trình Windows đã làm xong.
- Tham khảo Microsoft: [kiến trúc Windows Service](https://learn.microsoft.com/en-us/dotnet/framework/windows-services/service-application-programming-architecture), [LocalService](https://learn.microsoft.com/en-us/windows/win32/services/localservice-account). Chương trình mẫu là phần tự xây dựng cho lab, không phải dịch vụ Microsoft có sẵn.

1. W01/W02: biên soạn và triển khai các bài còn lại theo đề cương, có fixture thực tế, thử lỗi trước/sau, danh tính đúng, dữ liệu được bảo toàn và hoàn nguyên. Hai bài pilot không thay thế 12 bài W02.
2. W03–W05: kiểm kê domain/private network/ổ dữ liệu hiện có; triển khai chuỗi Server + CLIENT01, kiểm tra truy cập được và bị từ chối bằng đúng user. Không sửa/demote DC hiện tại để làm bài tạo domain.
3. W06–W08: DNS/IIS, backup/phục hồi và dự án tích hợp. DHCP cần provider cô lập, không giả lập Azure DHCP rồi chấm đạt.
4. Chưa phát hành thang điểm 100/phiên mới: hai bài đang dùng bộ chấm đạt/chưa đạt hiện hữu. Không coi việc đổi giao diện là triển khai scoring contract mới.
5. Bài cũ chưa được rà lại toàn bộ hoặc chứng nhận chất lượng. Giữ để tham khảo và bảo toàn tiến độ; không đổi tất cả nhãn sang Ready.

## Đường dẫn xem thay đổi

`/paths/windows` → **Mở ticket IT Support thực hành** → tab **Ticket GUI** → chọn bài. Có thể mở trực tiếp `/courses/windows-11-it-support-troubleshooting`.

## Quy tắc cho lần triển khai tiếp

Không chỉ thêm `practice_brief` cho các bài chỉ kiểm kê rồi gọi là ticket thực tế. Bài mới phải có hành động làm thay đổi kết quả sử dụng và bộ chấm kiểm được hành động đó qua trạng thái/chức năng. Không triển khai bằng cách tạo thêm file báo cáo để người học chép script; không bỏ ownership/reset để rút ngắn thời gian. Chỉ thay revision chấm và tiến độ khi tiêu chí kỹ thuật thay đổi, không vì thay cách trình bày.
