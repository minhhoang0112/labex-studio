# Lộ trình Windows: IT Support → System Administrator

Cập nhật 2026-10-20. Mở `/paths/windows` trên web local hoặc bấm **Lộ trình Windows & IT Support** ở trang chủ. Đây là lộ trình tự biên soạn có tham khảo Microsoft Learn, không phải bản sao một khóa LabEx/Microsoft hay chương trình cấp chứng chỉ.

## Phạm vi hiện tại

15 khóa / 6 chặng. Giữ nguyên 4 khóa đã có 40 bài local: PowerShell 5 bài, Windows Server 5 bài, troubleshooting Server 5 bài và IT Support Windows 11 25 bài. Tạo thêm 11 khóa dạng khung, mỗi khóa 3 mô-đun / 6 bài dự kiến, tổng 66 bài dự kiến. Các bài dự kiến chưa có hướng dẫn, dữ liệu thực hành, máy lab hay bộ chấm; không tính vào số bài đã triển khai. Khả năng mở môi trường/chấm điểm vẫn lấy từ readiness thực tế, không mặc định bằng số bài có nội dung.

## Thứ tự học

| Chặng | Thứ tự khóa | Hiện trạng |
| --- | --- | --- |
| 1. Nền tảng | Windows 11 căn bản → Mạng trên Windows → PowerShell cơ bản | Hai khóa đầu có đề cương; PowerShell có 5 bài |
| 2. IT Support | IT Support Windows 11: tiếp nhận ticket, cấu hình, chẩn đoán, sửa lỗi, backup | 25 bài đã có, 7 kịch bản nạp lỗi |
| 3. Junior SysAdmin | Windows Server nền tảng → AD/GPO chuyên sâu → DNS/DHCP → File Server/lưu trữ → IIS | Windows Server có 5 bài; bốn khóa chuyên sâu có đề cương |
| 4. Vận hành | PowerShell tự động hóa → troubleshooting Server → backup/DR → hardening | Troubleshooting có 5 bài; ba khóa còn lại có đề cương |
| 5. Mở rộng tùy chọn | Windows Server và Azure hybrid | Có đề cương; không bắt buộc trước dự án tổng hợp |
| 6. Đi làm | Dự án hạ tầng doanh nghiệp nhỏ, xử lý ticket, diễn tập khôi phục và bàn giao | Có đề cương |

Quan hệ học trước là gợi ý, không khóa các bài đang có. Có thể thực hành khóa IT Support hiện tại trong khi chờ bổ sung nền tảng. Không đặt thời hạn hoàn thành hoặc số giờ chưa được kiểm chứng cho các khóa dự kiến.

## Ưu tiên bổ sung nội dung

1. Windows 11 căn bản và mạng: làm rõ bản chất, cách thu thập bằng chứng, quyền quản trị, tiến trình/dịch vụ, IP/subnet/gateway, DNS/DHCP và kiểm tra TCP. Tận dụng CLIENT01, chưa cần VM mới.
2. Kiểm tra độ sâu của ba khóa 5 bài đang có, rồi bổ sung AD/GPO, File Server và PowerShell tự động hóa. Tách kiến thức nâng cao khỏi bài giới thiệu để tránh trùng lặp.
3. DNS/DHCP và IIS thực chiến: DNS có thể dùng hạ tầng sẵn có; DHCP cần topology lab phù hợp, không giả định máy Azure cấp DHCP cho VNet như mạng LAN thông thường.
4. Backup/DR và hardening: mọi thực hành phục hồi/phân quyền phải có baseline, phạm vi cô lập, đường truy cập dự phòng và kiểm tra hoàn nguyên trước khi cho nạp lỗi.
5. Azure hybrid và capstone: khảo sát mạng/domain/tenant, giấy phép và ngân sách trước. Không tự thêm tài nguyên Azure chỉ vì có tên trong lộ trình.

Mỗi bài mới cần: giải thích nguyên lý và tình huống thực tế; yêu cầu/môi trường; hướng dẫn có lý do cho từng bước; phần người học tự làm; kiểm tra trạng thái/chức năng thực tế; khôi phục; tài liệu gốc. Bài chỉ đọc phải ghi rõ loại và không có bộ chấm thành công giả. Chỉ đánh dấu triển khai khi nội dung và cơ chế kiểm tra đã có; không tạo JSON lab rỗng để tăng số lượng.

## Môi trường và chi phí

Chỉ thêm dữ liệu đề cương và giao diện. Không tạo/bật máy ảo, đĩa, snapshot, tenant hoặc dịch vụ Azure. Ưu tiên dùng CLIENT01 và Windows Server hiện có khi triển khai tiếp. Domain join, DHCP, disk/volume, AD restore và hybrid cần khảo sát riêng theo ghi chú từng khóa. Các khả năng đó chưa được xác nhận là dùng được chỉ vì xuất hiện trong đề cương.

## Dữ liệu và API

- `server/data/windows-roadmap.json`: nguồn đề cương, mục tiêu, prerequisites, môi trường dự kiến, references và thứ tự 15 khóa.
- `server/data/courses.json`: 11 khóa mới có `curriculum_status: planned`; giữ nguyên ID/nội dung của 4 khóa cũ.
- `server/data/paths.json`: metadata Windows sạch, không còn số người theo dõi/giờ/chứng chỉ giả. Các path khác giữ nguyên.
- `server/services/windowsRoadmap.js`: tổng hợp số lượng từ catalog/lab thực tế.
- `GET /api/roadmaps/windows-system-administrator`, `GET /api/paths/windows`, `GET /api/paths`: cùng thống kê Windows. Catalog và detail dùng `/api/courses` và `/api/courses/:id` như trước.
- Khóa chưa có bài trả `readiness: planned`, `available: false`, `labs: []`; đề cương nằm trong `course.syllabus_modules`. Các tên bài dự kiến không có ID lab thật hoặc nút Start Lab.
- `scripts/seed-windows-roadmap.py` là nguồn biên soạn để tạo lại đề cương ban đầu và thêm khóa thiếu. Chạy lại không tạo lab/VM, không trùng ID khóa; sẽ ghi lại đề cương Windows và metadata path, vì vậy cần sửa script tương ứng trước nếu đã chỉnh JSON đề cương bằng tay.

## Kiểm chứng

- Toàn bộ `npm test`: 80/80 đạt, gồm prerequisite graph không chu trình/tham chiếu thiếu, thống kê và API planned không tạo bài thực hành giả.
- Build client đạt; lint không lỗi, còn các cảnh báo cũ.
- `scripts/check-windows-roadmap-ui.mjs`: Chrome desktop/mobile 390 px; vào lộ trình từ trang chủ; mở khóa mới và đề cương; mở đủ 25 nút bài IT Support cũ; đổi qua Linux và thứ tự nguồn; không gọi API Azure. Báo cáo `.artifacts/windows-roadmap-ui.json`, ảnh `.artifacts/windows-roadmap.png`.

## Nguồn định hướng

Các nguồn này dùng để định hướng chủ đề và điều kiện trước khi học, không có nghĩa mọi mục đã được triển khai local:

- [Get started with Windows PowerShell](https://learn.microsoft.com/en-us/training/paths/get-started-windows-powershell/).
- [Maintain system administration tasks in Windows PowerShell](https://learn.microsoft.com/en-us/training/paths/maintain-system-administration-tasks-windows-powershell/).
- [Deploy and manage Active Directory Domain Services](https://learn.microsoft.com/en-us/training/paths/deploy-manage-active-directory-domain-services/).
- [Manage storage and file services](https://learn.microsoft.com/en-us/training/paths/manage-storage-file-services/).
- [Monitor and troubleshoot Windows Server environments](https://learn.microsoft.com/en-us/training/paths/monitor-troubleshoot-windows-server-environments/).
- [Windows security](https://learn.microsoft.com/en-us/windows/security/), [Windows Server networking](https://learn.microsoft.com/en-us/windows-server/networking/), [Windows Client networking troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/networking-overview), [IIS](https://learn.microsoft.com/en-us/iis/).
