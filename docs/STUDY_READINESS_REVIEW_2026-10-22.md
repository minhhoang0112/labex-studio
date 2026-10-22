# Kiểm tra khả năng bắt đầu học Linux và Windows — 22/10/2026

## Kết luận

Có thể bắt đầu học nền tảng, chưa thể coi hai lộ trình là giáo trình SysAdmin hoàn chỉnh. Việc chạy được web, có tài liệu và có bộ chấm là ba điều khác nhau. Số bài có bộ chấm dưới đây là số kiểm tra được cấu hình cho môi trường hiện tại, không phải chứng nhận mọi bài đã được thực hành lại và đạt trên máy thật hôm nay.

## Hệ thống

- Web ban đầu chưa chạy; đã khởi động local tại http://127.0.0.1:5000/learn.
- Linux: health báo rootless Docker / Ubuntu 22.04.5 LTS sẵn sàng. Kiểm tra terminal thật trong container thử riêng `runtime-terminal-smoke` đạt: Bash, đầu vào không hợp lệ, file dùng chung giữa terminal và bộ kiểm tra, lịch sử lệnh/mã thoát/tài khoản. Không reset lab của người học.
- Windows Server và CLIENT01: Azure API trả `VM deallocated`; cấu hình Desktop và guacd đều sẵn sàng. Không bật VM, không nạp lỗi hay chạy lại các bài trên VM hôm nay. Cần bật đúng VM trong web trước khi học. Trạng thái này không phải lỗi hệ thống.
- `npm test`: 80/80 đạt. Build client đạt. Chrome kiểm tra đường đi hai lộ trình, trang đề cương, 25 nút bài IT Support, Linux và màn hình 390 px đều đạt; không có gọi API điều khiển Azure trong kiểm tra UI.
- Kiểm tra cấu trúc task ID/section không phát hiện ID trùng hoặc task mất section; không có section rỗng trong các bài đã nhập. Điều này không chứng minh mọi giải thích đều đầy đủ hoặc chính xác về sư phạm.

## Linux

| Khóa | Bài trong giáo trình nguồn | Bài local | Bài có đủ bộ chấm theo cấu hình |
| --- | ---: | ---: | ---: |
| Quick Start with Linux | 10 | 10 | 10 |
| Linux for Noobs | 37 | 37 | 32 |
| Linux Commands Practice Online | 41 | 41 | 41 |
| Shell for Beginners | 18 | 18 | 18 |
| Become a Junior System Administrator | 10 | 10 | 9 |
| CompTIA Linux+ | 33 | 33 | 2 |
| Linux Security for DevSecOps | 20 | 7 | 0 |
| Linux Practice Challenges | 156 | 33 | 4 |

Tổng theo danh sách khóa: 325 mục nguồn, 189 mục đã nhập, 116 mục có đủ bộ chấm. Có bài dùng lại giữa các khóa, nên 189 mục tương ứng 185 bài local duy nhất. Thiếu 136 mục nội dung so với giáo trình nguồn; nhiều nhất ở Security và Challenges. Không được đọc con số “đã có nội dung” thành “đã đủ bài thực hành/chấm điểm”.

Các chỗ có thể làm bạn mắc tiến độ:

- Noobs — `linux-basic-file-operations-in-linux-18001`: một task phím Up/Tab/Ctrl+C/Ctrl+L chưa có cách kiểm chứng đáng tin; có thể thực hành nhưng không đủ bộ chấm.
- Noobs — `linux-file-system-and-disk-management-17999`: thiếu block/loop device và filesystem/mount riêng cho các bài đĩa.
- Noobs — `linux-system-information-and-process-management-725419`: một task chưa có fixture kiểm chứng và một task cần kernel log/CAP_SYSLOG.
- Noobs — `linux-managing-services-and-system-logs-725415`: cần systemd PID 1 và journal thật; container hiện dùng supervisor tối giản.
- Noobs — `linux-remote-access-and-file-transfer-with-ssh-725416`: chưa dựng/kiểm chứng sshd, remote account và key transfer theo bài.
- Junior — `linux-day-3-the-log-investigator-596202`: task dmesg/kernel log chưa được hỗ trợ trong container. Không chấm đạt chỉ nhờ tạo tệp kết quả.
- CompTIA có 147 task chưa được hỗ trợ; Challenges có 53; Security có 7 trong các bài đã nhập. Đây là thiếu triển khai bộ chấm, không phải kết luận tất cả thao tác trong bài đều không chạy được.

Ngôn ngữ: nhiều section có `translation_needs_review`, kể cả Quick Start/Shell. Theo logic hiện tại giao diện dùng bản gốc Anh ở các section đó. Nội dung Anh đã đối chiếu và bản Việt đã duyệt là hai trạng thái khác nhau; chưa thể hứa toàn bộ giáo trình Việt hoàn chỉnh. Không thay bản dịch chưa duyệt thành “đã chuẩn” chỉ để đổi nhãn.

## Windows

| Khóa | Bài đã có | Đánh giá khả năng học |
| --- | ---: | --- |
| IT Support Windows 11 | 25, 50 task | Có thể bắt đầu thực hành sau khi bật CLIENT01; 7 kịch bản nạp lỗi, các bài còn lại cấu hình/chẩn đoán. Chưa kiểm thử lại trực tiếp trên VM hôm nay. |
| PowerShell | 5, 7 task | Có bài giới thiệu; chưa đủ độ sâu cho PowerShell quản trị hoàn chỉnh. |
| Windows Server/AD | 5, 7 task | Mức nhập môn các công cụ/dịch vụ; chưa thay thế đào tạo chuyên sâu AD/GPO/DNS/DHCP/SMB. |
| Troubleshooting Server | 5, 5 task | Chủ yếu các thao tác chẩn đoán ban đầu; chưa đủ tình huống vận hành doanh nghiệp. |
| 11 khóa còn lại | 0 bài thật; 66 bài dự kiến | Chỉ có đề cương. Chưa thể học liên tục toàn lộ trình từ khóa đầu đến cuối. |

40 bài hiện có đều khai báo đủ cơ chế chấm theo cấu hình Azure hiện tại. Bộ chấm Windows sử dụng tiêu chí ở `windowsRemoteVerifier.js`, kiểm tra qua VM và có thể kết hợp lịch sử lệnh; không phải cứ thấy `verification.kind: commands` trong JSON gốc là chỉ kiểm tra một chuỗi từ trình duyệt.

Điểm cần cải thiện về nội dung và độ chặt: một số section của ba khóa 5 bài rất ngắn, thiên về chạy lệnh mẫu. Ví dụ `win-file-system-ntfs` yêu cầu tạo thư mục rồi đọc ACL bằng Get-Acl nhưng probe hiện chỉ xác nhận thư mục tồn tại và đọc được owner; chưa chứng minh người học đã xem/hiểu bảng quyền. `Get-SmbShare` chỉ luyện truy vấn danh sách, `gpresult /r` chỉ luyện xem policy; không nên gọi các task đó là đã thực hành triển khai SMB hay GPO hoàn chỉnh. Đây là giới hạn đào tạo/bằng chứng, không phải báo cáo đã tái hiện lỗi VM.

Hai khóa nền tảng Windows 11/mạng đầu lộ trình hiện vẫn chưa có nội dung. Vì vậy người mới hoàn toàn chưa có chuỗi bài tự học Windows đầy đủ trước khi vào IT Support.

## Thứ tự học có thể bắt đầu ngay

1. Linux: Quick Start → thực hành Commands song song với Noobs → Shell. Khi tới các bài Noobs liệt kê phía trên, đọc lý thuyết/thực hành phần hỗ trợ, không coi task chưa chấm là đã hoàn thành. Junior học tiếp với lưu ý task kernel log.
2. Windows: dùng 25 bài IT Support và 5 bài PowerShell hiện có, coi các khóa Server còn lại là nhập môn. Các khóa chỉ đề cương chưa có bài để học.
3. Chưa nên dùng CompTIA/Security/Challenges làm lộ trình chính cần chấm đầy đủ, hoặc dùng kết quả local để tự kết luận đã đủ năng lực/chứng chỉ SysAdmin.

## Việc cần làm trước khi gọi lộ trình hoàn chỉnh

Ưu tiên 1: triển khai hai khóa nền tảng Windows; bổ sung giải thích nguyên lý, kết quả mong đợi, bài tự làm và kiểm chứng cho ba khóa Windows ngắn. Sau đó bổ sung AD/GPO, DNS/DHCP, File Server, backup và hardening.

Ưu tiên 2: giải quyết runtime Linux cho systemd/journal, kernel log, đĩa và SSH; dùng môi trường lab riêng thích hợp, không cấp quyền đụng thiết bị/log máy chủ chỉ để làm task hiện màu xanh. Chưa tạo VM hay thay đổi hạ tầng trong đợt kiểm tra này.

Ưu tiên 3: hoàn thiện bộ chấm CompTIA, Security và Challenges; bổ sung nội dung còn thiếu và duyệt bản Việt theo từng bài. Bài challenge cần bằng chứng giải đúng nhiệm vụ, không chỉ xác nhận đã đọc hoặc chạy lệnh bất kỳ.

## Bằng chứng và giới hạn kiểm tra

`.artifacts/study-readiness-audit.json` lưu toàn bộ thống kê, task thiếu bộ chấm, lý do và section cần rà thủ công. Chạy lại bằng `node scripts/audit-study-readiness.mjs` sau khi web hoạt động. Phép đo độ ngắn của section chỉ là tín hiệu chọn chỗ đọc sâu, không dùng làm kết luận tự động bài sai.

Đây là rà soát toàn bộ cấu trúc/nội dung có mặt bằng công cụ, đọc sâu mẫu trọng yếu và chạy kiểm tra hệ thống chọn lọc; chưa thực hành lại mọi bài hoặc thẩm định từng câu hướng dẫn. Chưa gọi lại nhà cung cấp AI trả phí; không thay đổi bài, điểm hoặc dữ liệu học, không xóa file dự án, không bật/tạo tài nguyên Azure.
