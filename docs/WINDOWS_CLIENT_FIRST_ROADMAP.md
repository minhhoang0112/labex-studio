# Làm lại hướng học Windows: Client trước

Ngày rà soát: 27/10/2026. Cơ sở: yêu cầu của người học, hội thoại góp ý được cung cấp và mã nguồn hiện tại. Đây là kế hoạch triển khai có giới hạn, không phải xác nhận toàn bộ khóa Windows đã hoàn thiện.

## 1. Vấn đề cần sửa

Các khóa cũ quá thiên về đọc và chạy script thu thập bằng chứng. Bộ chấm hoạt động không đồng nghĩa người học hiểu triệu chứng, biết chọn công cụ và tự xử lý tình huống khác. Tăng số bài hoặc chỉ thay giao diện đề bài không giải quyết được việc này.

Mục tiêu trước mắt: người mới làm IT Support biết tiếp nhận một ticket, tái hiện, thu thập bằng chứng, sửa đúng phạm vi, kiểm tra chức năng và bàn giao. Ưu tiên Windows Client; Server/domain học sau khi có nền tảng này. Linux tiếp tục học song song, không sửa lại Linux trong đợt này.

Không mặc định các kinh nghiệm, cấu hình laptop hoặc phần mềm mà AI trong hội thoại nhắc tới là thông tin đã xác minh của người học.

## 2. Phạm vi và trạng thái thật

- Web có VM Windows Client trên Azure, Desktop và PowerShell; bật/tắt theo buổi học.
- Cập nhật 28/10/2026: có năm bài theo dạng ticket GUI: lỗi tác vụ sao lưu do quyền, tệp bị giữ, dịch vụ lỗi cấu hình, nhân viên thiếu quyền lưu tài liệu và điều tra tiến trình gây tải CPU. Chúng là các tình huống hẹp, chưa phải một khóa IT Support đầy đủ.
- Bài dịch vụ đã có kiểm thử trực tiếp chu trình lỗi → sửa → thử sai → hoàn nguyên trên CLIENT01. Không suy rộng kết quả đó sang các bài khác hoặc thao tác GUI chưa được kiểm tra trực tiếp.
- Các khóa và bài cũ vẫn còn. Bản kế hoạch dài hạn 64 bài không phải phạm vi cần hoàn thành ngay và không được dùng làm số bài sẵn sàng học.
- Đợt này bổ sung kiến thức ngắn, câu hỏi điều tra và tự giải thích cho ba ticket; không tạo thêm ticket và không thay điều kiện chấm.

## 3. Mười ticket cốt lõi trên Client

Thứ tự dưới đây là lộ trình đề xuất mới; thứ tự ba bài đang hiển thị trên web chưa được coi là toàn bộ lộ trình này. Bài nền tảng cũ dùng làm tài liệu tra cứu khi thiếu kiến thức, không buộc học hết trước.

| Thứ tự | Ticket và kiến thức | Thực hành/chứng minh hoàn thành | Trạng thái |
|---|---|---|---|
| 1 | Không đổi tên/lưu được tệp đang dùng: handle, ứng dụng và quyền | Tìm đúng ứng dụng giữ tệp; đóng có kiểm soát; thao tác thành công và dữ liệu nguyên vẹn | Có `win-it-file-in-use`, cần tiếp tục kiểm tra trải nghiệm người mới |
| 2 | Nhân viên không lưu được tài liệu vào thư mục làm việc: NTFS, nhóm và kế thừa | Dưới user thực hành, đọc/sửa/lưu được đúng phạm vi; user đối chứng vẫn bị từ chối | Đã thêm `win-it-user-folder-permissions` ngày 28/10/2026; kiểm thử runtime trực tiếp đạt, xem báo cáo riêng |
| 3 | Ứng dụng nền không hoạt động: service, cấu hình, log | Tìm lỗi cấu hình; sửa tối thiểu; service xử lý yêu cầu mới; dữ liệu cũ không bị sửa | Có `win-it-service-config-recovery`, đã kiểm thử runtime trên CLIENT01 |
| 4 | Máy chậm sau khi mở ứng dụng: CPU, RAM, tiến trình | Xác định tải do tiến trình lab tạo ra; xử lý đúng tiến trình; đo lại; phân biệt tải CPU với thiếu bộ nhớ | Đã thêm `win-it-cpu-process-diagnosis` ngày 28/10/2026; runtime trực tiếp đạt, phạm vi thực hành CPU, chưa gây lỗi RAM/Disk |
| 5 | Cài/cập nhật ứng dụng thất bại: phiên bản, installer log, rollback | Dùng gói ứng dụng lab có nguồn và giấy phép phù hợp; đọc lỗi, xử lý nguyên nhân, mở chức năng thực; giữ dữ liệu người dùng | Chưa xây dựng; cần chọn gói tái hiện ổn định |
| 6 | Ứng dụng không ghi được vì vùng lưu trữ hết dung lượng | Quan sát dung lượng vùng dữ liệu lab, phân biệt với lỗi ACL; dọn đúng dữ liệu được phép; ghi tệp mới thành công | Chưa xây dựng; chỉ dùng vùng/đĩa lab giới hạn, không làm đầy ổ hệ điều hành |
| 7 | Sao lưu thủ công được nhưng tác vụ nền thất bại | Xác định danh tính tác vụ, nguồn/đích và quyền; tạo bản sao mới đúng nội dung; không mở rộng quyền cho người ngoài | Có `win-it-scheduled-backup-permissions`; cần nghiệm thu lại theo bộ tiêu chí chung |
| 8 | Người dùng sửa nhầm/xóa tài liệu: phục hồi | Từ bản sao được tạo trước sự cố, phục hồi đúng phiên bản vào nơi an toàn; đối chiếu nội dung; không ghi đè bản hiện tại trước khi xác nhận | Chưa xây dựng |
| 9 | Không truy cập được ứng dụng nội bộ: tên, TCP, dịch vụ | Dùng dịch vụ thử nghiệm trong phạm vi lab; phân biệt lỗi tên với cổng và ứng dụng; sửa cấu hình giới hạn; thử truy cập chức năng thật | Chưa xây dựng; một VM chỉ minh họa từng lớp, không được gọi là mô hình mạng doanh nghiệp |
| 10 | Ticket tổng hợp không chỉ trước nguyên nhân | Chọn biến thể từ các tình huống đã học; lập giả thuyết từ bằng chứng, sửa tối thiểu, kiểm tra người dùng và ghi bàn giao | Chưa xây dựng; chỉ làm sau khi các tình huống thành phần ổn định |

Không cần tạo thêm VM để viết kế hoạch và nội dung. Việc chạy thử bài mới trên cloud cần theo dõi thời gian, lưu trạng thái và tắt/deallocate sau buổi thử được cho phép.

## 4. Bài số 2 cần triển khai thế nào

Đây là phân quyền thư mục **local trên Client**, không phải AD hoặc chia sẻ SMB. Client cũng có user local và NTFS; bài Server sau mới mở rộng sang tài khoản domain, quyền share và nhóm phòng ban.

Tình huống: người dùng đọc được tài liệu phòng làm việc nhưng không lưu bản chỉnh sửa. Có hai tài khoản thực hành không có quyền quản trị: người được phép và người đối chứng. Dữ liệu chỉ nằm trong workspace của lab.

1. Baseline: tài khoản được phép tạo, sửa và đọc lại tệp; tài khoản đối chứng không truy cập được vùng hạn chế. Ghi ACL và nội dung mẫu để hoàn nguyên.
2. Nạp lỗi: thay đổi một quyền có kiểm soát trong đúng workspace, khiến người được phép mất quyền ghi. Không sửa ACL của Windows, hồ sơ người dùng thật hoặc tài khoản quản trị.
3. Đề bài: thông báo người dùng, đường dẫn, thao tác thất bại và yêu cầu giữ bảo mật. Không đưa ngay câu lệnh sửa hoặc gọi tên chính xác ACE bị lỗi.
4. Quan sát GUI: đăng nhập bằng user lab để tái hiện; Properties → Security → Advanced để kiểm tra principal, quyền và kế thừa. Giải thích ngắn quyền Modify khác Full Control.
5. Chấm: thực hiện I/O thật dưới danh tính hai user; xác nhận nội dung sau ghi; không chỉ đọc ACL bằng SYSTEM. Nếu chưa có cơ chế thực thi đúng danh tính, bài chưa đủ điều kiện phát hành.
6. Thử sai: cấp Everyone quyền rộng phải không đạt; admin tự tạo tệp không thay thế bằng chứng user; tệp kết quả cũ không đủ; cấp quyền sai thư mục không đạt.
7. Reset: phục hồi ACL và tệp fixture đã ghi nhận; chỉ dọn tài khoản/nhóm do lab tạo; xử lý được cả trạng thái lỗi dở dang. Không xóa hồ sơ hoặc dữ liệu ngoài phạm vi.

Điểm học được phải là xác định danh tính và quyền hiệu lực, không phải thuộc tên user/thư mục mẫu.

## 5. Mẫu một bài học

1. **Ticket:** ai gặp lỗi, thao tác gì, ảnh hưởng gì, việc gì không được làm.
2. **Hiểu trước khi sửa:** 2–3 khái niệm ngắn, công cụ GUI cần dùng, dấu hiệu cần phân biệt. Lệnh chỉ dùng khi giúp quan sát rõ hơn; giải thích đầu vào và kết quả.
3. **Điều tra:** người học tự ghi triệu chứng, bằng chứng và giả thuyết trước khi thay đổi. Không bắt chép script dài để tạo JSON làm nội dung chính.
4. **Thực hành:** đề bài và tiêu chí trước; gợi ý tăng dần đóng mặc định; hướng dẫn thao tác đầy đủ chỉ mở khi cần.
5. **Chấm kỹ thuật:** trạng thái thực, chức năng mới và giới hạn bảo mật; không dựa vào lịch sử gõ đúng lệnh mẫu. Tên tùy chọn không bị bắt giống mẫu nếu không phải hợp đồng của ứng dụng.
6. **Tự giải thích:** nguyên nhân là gì, vì sao chọn bước sửa, chứng minh đã hết lỗi ra sao, nếu tái phát thì làm gì. Đây là tự ôn cho tới khi có rubric riêng; không giả vờ đã được chấm bởi AI.
7. **Luyện lại:** một biến thể thay đường dẫn/ngữ cảnh hoặc triệu chứng phụ, dùng cùng năng lực cốt lõi. Độ khó đến từ chẩn đoán và ràng buộc, không phải script dài.

## 6. Cổng nghiệm thu trước khi gắn nhãn sẵn sàng

- Dữ liệu, hướng dẫn, gợi ý và bộ chấm cùng một tình huống/đường dẫn/danh tính.
- Baseline thật chạy được; sau nạp lỗi thao tác người dùng thực sự thất bại.
- Một cách sửa hợp lệ bằng GUI đạt; cách sửa tương đương bằng lệnh cũng đạt nếu không vi phạm phạm vi.
- Chưa sửa, sửa sai, dùng kết quả cũ, hoặc giảm bảo mật quá mức không đạt.
- Reset trả về baseline; chạy nạp/reset lần hai ổn định; lỗi giữa chừng không để UI kẹt vô hạn.
- Không ảnh hưởng RDP, firewall quản trị, NIC Azure, dữ liệu ngoài workspace hay tài khoản thật.
- Kiểm tra riêng dưới user lab khi bài có quyền truy cập; SYSTEM không được đại diện người dùng thường.
- Người mới làm thử chỉ từ đề bài và gợi ý; ghi lại chỗ họ không hiểu. Test backend không thay thế kiểm tra khả năng học.
- Báo cáo mỗi bài tách rõ: kiểm tra tĩnh, test tự động, chạy trực tiếp VM, thao tác GUI, giới hạn chưa thử. Không gắn “chuẩn 100%” chung.

## 7. Để sau giai đoạn Client

- DNS nội bộ, domain join, tài khoản AD, GPO, SMB: dùng Server và Client riêng, luồng công việc liên kết. Trước đó phải kiểm tra topology và quyền, không phá kết nối quản trị Azure.
- Máy in: chỉ xây khi có thiết bị hoặc môi trường in thử đủ để gửi job, gây lỗi và xác nhận phục hồi. Không gọi khởi động lại Spooler đơn lẻ là sửa máy in toàn diện.
- Wi-Fi, cáp, lỗi RAM/SSD vật lý, kẹt giấy: cần thiết bị thực hoặc tình huống phân tích bằng chứng; phải ghi rõ không được thực hành phần cứng trên VM cloud.
- Office/email: cần môi trường và giấy phép phù hợp; không dùng ứng dụng giả rồi tuyên bố đã học sửa Outlook/Excel.
- Linux duy trì song song theo kỹ năng tương ứng, nhưng NTFS không tương đương hoàn toàn chmod và container không thay mọi lab service/kernel.

## 8. Nguồn tham khảo cho phần kiến thức đã bổ sung

- Microsoft, [Tasks](https://learn.microsoft.com/en-us/windows/win32/taskschd/tasks): thành phần tác vụ.
- Microsoft, [Security Contexts for Tasks](https://learn.microsoft.com/en-us/windows/win32/taskschd/security-contexts-for-running-tasks): danh tính thực thi.
- Microsoft, [Creating and Opening Files](https://learn.microsoft.com/en-us/windows/desktop/FileIO/creating-and-opening-files): handle và chế độ chia sẻ.
- Microsoft, [About Services](https://learn.microsoft.com/en-us/windows/win32/services/about-services): vai trò service.

Các nguồn này hỗ trợ kiến thức của ba ticket ban đầu. Hai ticket NTFS và CPU có nguồn, báo cáo riêng trong `WINDOWS_CLIENT_NTFS_TICKET.md` và `WINDOWS_CLIENT_CPU_TICKET.md`; năm ticket khác trong kế hoạch chưa triển khai. Khi làm mỗi bài mới phải bổ sung tài liệu nguồn đúng chủ đề và bằng chứng kiểm thử riêng.
