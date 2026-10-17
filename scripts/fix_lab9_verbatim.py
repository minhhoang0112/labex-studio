import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def update_lab9():
    path = 'server/data/labs/linux-user-account-management.json'
    with open(path, 'r', encoding='utf-8') as f:
        lab = json.load(f)

    # Section 0: Introduction
    lab['sections'][0]['title_vi'] = "Giới thiệu"
    lab['sections'][0]['content_vi'] = (
        "Bài thực hành này sẽ hướng dẫn bạn các thao tác quản lý tài khoản người dùng cơ bản trong các hệ thống Linux. "
        "Bạn sẽ học cách tạo mới, sửa đổi và xóa các tài khoản người dùng, cũng như cách thiết lập và thay đổi mật khẩu. "
        "Đây là những kỹ năng nền tảng sống còn đối với quản trị viên hệ thống Linux. "
        "Đừng lo lắng nếu bạn là người mới làm quen với Linux - chúng tôi sẽ giải thích chi tiết từng bước một!"
    )

    # Section 1: Creating a New User
    lab['sections'][1]['title_vi'] = "Tạo một Người Dùng Mới"
    lab['sections'][1]['task_vi'] = "Tạo người dùng joker bằng lệnh sudo useradd joker và kiểm tra trong /etc/passwd."
    lab['sections'][1]['hint_vi'] = "Chạy sudo useradd joker rồi sudo grep -w 'joker' /etc/passwd."
    lab['sections'][1]['content_vi'] = (
        "Hãy bắt đầu bằng việc tạo một tài khoản người dùng mới có tên \"joker\".\n\n"
        "1. Mở cửa sổ terminal. Trong Linux, terminal là giao diện dòng lệnh bằng văn bản nơi bạn có thể nhập các câu lệnh.\n"
        "2. Nhập câu lệnh sau và nhấn Enter:\n\n"
        "```bash\n"
        "sudo useradd joker\n"
        "```\n\n"
        "Hãy cùng phân tích câu lệnh này:\n\n"
        "- `sudo`: Câu lệnh cấp cho bạn quyền siêu người dùng (quản trị viên - administrator) tạm thời. Chúng ta sử dụng `sudo` vì việc tạo người dùng mới yêu cầu các quyền hạn cấp cao này.\n"
        "- `useradd`: Lệnh dùng để tạo một người dùng mới trên hệ thống.\n"
        "- `joker`: Tên đăng nhập (username) của tài khoản mà chúng ta đang tạo.\n\n"
        "Lưu ý: Nếu bạn thử chạy lệnh này mà không có `sudo`, bạn sẽ nhận được thông báo lỗi \"permission denied\". "
        "Điều này là do người dùng thông thường không được phép tạo tài khoản người dùng mới - đây là nhiệm vụ được bảo lưu riêng cho quản trị viên hệ thống.\n\n"
        "Điều này làm nổi bật sự khác biệt giữa siêu người dùng (superuser) và người dùng thông thường (common user). "
        "Với tư cách người dùng thông thường, bạn không thể tự ý tạo tài khoản mới, nhưng bằng cách sử dụng `sudo`, bạn có thể nâng cao đặc quyền của mình một cách tạm thời để thực thi tác vụ quản trị này.\n\n"
        "3. Để xác minh người dùng đã được tạo thành công, chúng ta sẽ kiểm tra tệp `/etc/passwd`:\n\n"
        "```bash\n"
        "sudo grep -w 'joker' /etc/passwd\n"
        "```\n\n"
        "Tệp `/etc/passwd` giống như một danh bạ lưu trữ thông tin các tài khoản người dùng. "
        "Mỗi dòng đại diện cho một tài khoản, với các trường thông tin khác nhau được phân tách bằng dấu hai chấm (`:`).\n\n"
        "Bạn sẽ thấy kết quả tương tự như sau:\n\n"
        "```plaintext\n"
        "joker:x:5001:5001::/home/joker:/bin/sh\n"
        "```\n\n"
        "Dòng này hiển thị:\n\n"
        "- **Tên đăng nhập (Username)**: `joker`\n"
        "- **Mật khẩu (Password)**: `x` (mật khẩu mã hóa thực tế được lưu trữ an toàn ở một nơi khác)\n"
        "- **Mã định danh người dùng (User ID - UID)**: `5001`\n"
        "- **Mã định danh nhóm (Group ID - GID)**: `5001`\n"
        "- **Thư mục cá nhân (Home Directory)**: `/home/joker`, nhưng thư mục này chưa được tạo ra trên đĩa\n"
        "- **Shell mặc định (Default Shell)**: `/bin/sh`"
    )

    # Section 2: Creating a User with a Home Directory
    lab['sections'][2]['title_vi'] = "Tạo Người Dùng Kèm Thư Mục Cá Nhân"
    lab['sections'][2]['task_vi'] = "Tạo người dùng bob có thư mục cá nhân bằng lệnh sudo useradd -m bob."
    lab['sections'][2]['hint_vi'] = "Chạy sudo useradd -m bob rồi kiểm tra bằng sudo ls -ld /home/bob."
    lab['sections'][2]['content_vi'] = (
        "Bây giờ, hãy tạo một người dùng khác có tên \"bob\" và tự động cấp cho người này một thư mục cá nhân (home directory).\n\n"
        "1. Chạy câu lệnh sau:\n\n"
        "```bash\n"
        "sudo useradd -m bob\n"
        "```\n\n"
        "Tùy chọn `-m` yêu cầu hệ thống tự động khởi tạo một thư mục cá nhân cho người dùng. "
        "Thư mục cá nhân giống như một thư mục riêng biệt nơi người dùng có thể lưu trữ các tệp tin và cài đặt cá nhân của mình.\n\n"
        "2. Hãy xác minh rằng thư mục cá nhân đã được tạo thành công:\n\n"
        "```bash\n"
        "sudo ls -ld /home/bob\n"
        "```\n\n"
        "Bạn sẽ thấy kết quả tương tự như sau:\n\n"
        "```plaintext\n"
        "drwxr-x--- 2 bob bob 57 Jan 19 13:33 /home/bob\n"
        "```\n\n"
        "Kết quả này hiển thị:\n\n"
        "- Ký tự `d` ở đầu dòng biểu thị đây là một thư mục (directory).\n"
        "- `rwxr-x---`: Quyền hạn cho biết ai có thể đọc, ghi hoặc thực thi bên trong thư mục này.\n"
        "- Hai mục `bob bob`: Cho biết cả người dùng sở hữu lẫn nhóm sở hữu của thư mục này đều là `bob`.\n"
        "- `57`: Kích thước của thư mục tính bằng byte.\n"
        "- `Jan 19 13:33`: Thời điểm thư mục được tạo ra.\n"
        "- `/home/bob`: Đường dẫn vị trí của thư mục trên hệ thống."
    )

    # Section 3: Setting a User Password
    lab['sections'][3]['title_vi'] = "Thiết Lập Mật Khẩu Người Dùng"
    lab['sections'][3]['task_vi'] = "Đặt mật khẩu cho người dùng joker bằng lệnh sudo passwd joker."
    lab['sections'][3]['hint_vi'] = "Chạy sudo passwd joker và nhập mật khẩu (ví dụ: password123)."
    lab['sections'][3]['content_vi'] = (
        "Bây giờ chúng ta cần thiết lập mật khẩu cho người dùng mới. Hãy đặt mật khẩu cho \"joker\".\n\n"
        "1. Chạy câu lệnh sau:\n\n"
        "```bash\n"
        "sudo passwd joker\n"
        "```\n\n"
        "2. Bạn sẽ được yêu cầu nhập mật khẩu mới hai lần để xác nhận. Đối với bài thực hành này, hãy sử dụng một mật khẩu đơn giản như `password123`.\n\n"
        "> **Quan trọng**: Mật khẩu sẽ **không hiển thị bất kỳ ký tự nào** trên màn hình khi bạn gõ. "
        "Đây là một tính năng bảo mật chuẩn trong Linux để ngăn người khác nhìn lén mật khẩu của bạn khi bạn đang gõ. "
        "Nếu bạn vô tình nhập sai mật khẩu, bạn hoàn toàn có thể thử nhập lại.\n\n"
        "> **Quan trọng**: Hãy ghi nhớ mật khẩu này! Bạn sẽ cần sử dụng nó ở các bước tiếp theo trong bài lab.\n\n"
        "3. Nếu thiết lập thành công, bạn sẽ thấy thông báo: `passwd: password updated successfully`.\n\n"
        "Lưu ý: Trong các môi trường thực tế, hãy luôn sử dụng mật khẩu mạnh và độc nhất!\n\n"
        "Về mặt vận hành hệ thống, Linux lưu trữ các mật khẩu đã được mã hóa trong một tệp bảo mật đặc biệt có tên `/etc/shadow`. "
        "Điều này an toàn hơn rất nhiều so với việc lưu trữ trong tệp `/etc/passwd` nơi bất kỳ ai cũng có thể đọc được."
    )

    # Section 4: Modifying User Properties
    lab['sections'][4]['title_vi'] = "Sửa Đổi Thuộc Tính Người Dùng"
    lab['sections'][4]['task_vi'] = "Đổi thư mục cá nhân của joker thành /home/wayne bằng lệnh sudo usermod -d /home/wayne joker."
    lab['sections'][4]['hint_vi'] = "Chạy sudo usermod -d /home/wayne joker."
    lab['sections'][4]['content_vi'] = (
        "Linux cho phép chúng ta thay đổi các thiết lập khác nhau của tài khoản người dùng sau khi tài khoản đã được tạo. "
        "Hãy đổi thư mục cá nhân của joker làm ví dụ.\n\n"
        "1. Chạy câu lệnh sau:\n\n"
        "```bash\n"
        "sudo usermod -d /home/wayne joker\n"
        "```\n\n"
        "Ý nghĩa của câu lệnh này:\n\n"
        "- `usermod`: Câu lệnh dùng để sửa đổi (modify) các thiết lập tài khoản người dùng.\n"
        "- `-d /home/wayne`: Chỉ định đường dẫn thư mục cá nhân mới (`/home/wayne`).\n"
        "- `joker`: Tên người dùng mà chúng ta đang sửa đổi.\n\n"
        "2. Hãy xác minh sự thay đổi:\n\n"
        "```bash\n"
        "sudo grep -w 'joker' /etc/passwd\n"
        "```\n\n"
        "Tùy chọn `-w` được dùng để khớp chính xác toàn bộ từ cần tìm, và `grep` dùng để tìm kiếm từ khóa đó trong tệp. "
        "Bạn sẽ thấy trong kết quả xuất ra rằng thư mục cá nhân của joker đã được cập nhật thành `/home/wayne`."
    )

    # Section 5: Changing User Shell
    lab['sections'][5]['title_vi'] = "Thay Đổi Shell Mặc Định Của Người Dùng"
    lab['sections'][5]['task_vi'] = "Đổi shell mặc định của joker thành /bin/bash bằng sudo usermod -s /bin/bash joker."
    lab['sections'][5]['hint_vi'] = "Chạy sudo usermod -s /bin/bash joker."
    lab['sections'][5]['content_vi'] = (
        "Một thiết lập quan trọng khác mà chúng ta có thể sửa đổi là shell mặc định của người dùng. "
        "Shell là chương trình thông dịch và thực thi các câu lệnh mà bạn nhập vào trong terminal.\n\n"
        "Theo mặc định, người dùng 'joker' đang sử dụng `/bin/sh` làm shell của mình. "
        "Trong khi `sh` (Bourne Shell) là một shell cơ bản có mặt trên hầu hết các hệ thống dạng Unix, "
        "thì `bash` (Bourne Again Shell) lại cung cấp nhiều tính năng hiện đại hơn và thân thiện hơn với người dùng.\n\n"
        "Thay đổi shell của joker sang bash mang lại nhiều lợi ích:\n\n"
        "- Giao diện dòng lệnh trực quan và tiện dụng hơn (hỗ trợ phím mũi tên, auto-complete bằng phím Tab).\n"
        "- Khả năng viết kịch bản (scripting) nâng cao.\n"
        "- Khả năng tùy biến môi trường làm việc tốt hơn cho người dùng.\n\n"
        "Dưới đây là cách thực hiện thay đổi:\n\n"
        "1. Đổi shell mặc định của joker sang bash:\n\n"
        "```bash\n"
        "sudo usermod -s /bin/bash joker\n"
        "```\n\n"
        "2. Xác minh sự thay đổi:\n\n"
        "```bash\n"
        "sudo grep -w 'joker' /etc/passwd\n"
        "```\n\n"
        "Bạn sẽ thấy đường dẫn `/bin/bash` xuất hiện ở cuối dòng thông tin của joker. "
        "Điều này có nghĩa là bash hiện đã là shell mặc định của tài khoản joker.\n\n"
        "Sau khi thực hiện thay đổi này, joker sẽ được tiếp cận môi trường bash phong phú tính năng bất cứ khi nào họ đăng nhập hoặc mở một phiên terminal mới."
    )

    # Section 6: Adding a User to a Group
    lab['sections'][6]['title_vi'] = "Thêm Người Dùng Vào Nhóm"
    lab['sections'][6]['task_vi'] = "Thêm joker vào nhóm sudo bằng lệnh sudo usermod -aG sudo joker và kiểm tra quyền."
    lab['sections'][6]['hint_vi'] = "Chạy sudo usermod -aG sudo joker rồi su - joker kiểm tra sudo cat /etc/shadow."
    lab['sections'][6]['content_vi'] = (
        "Trong Linux, chúng ta sử dụng nhóm (Group) để tổ chức người dùng và quản lý quyền hạn tập trung. "
        "Một nhóm đặc biệt quan trọng là nhóm `sudo`, cấp cho người dùng các đặc quyền quản trị viên hệ thống. "
        "Hãy thêm joker vào nhóm `sudo` làm ví dụ thực tế.\n\n"
        "### Tại sao chúng ta lại thêm một người dùng vào nhóm sudo?\n\n"
        "1. **Quản trị hệ thống (System administration)**: Người dùng trong nhóm sudo có thể thực thi các tác vụ quản trị trên toàn hệ thống.\n"
        "2. **Cài đặt phần mềm (Software installation)**: Thành viên nhóm sudo có thể cài đặt và cập nhật các gói phần mềm.\n"
        "3. **Thay đổi cấu hình (Configuration changes)**: Họ có thể chỉnh sửa các tệp cấu hình hệ thống cốt lõi.\n"
        "4. **Quản lý người dùng (User management)**: Họ có thể tạo, sửa đổi hoặc xóa các tài khoản người dùng khác.\n\n"
        "Bạn có thể tự hỏi: *\"Tại sao phải thêm ai đó vào nhóm sudo khi chúng ta luôn có thể dùng lệnh 'sudo'?\"* Dưới đây là lý do:\n\n"
        "- **Sự tiện lợi**: Người dùng trong nhóm sudo có thể sử dụng sudo mà không cần biết mật khẩu của tài khoản `root`. Họ chỉ cần sử dụng mật khẩu của chính họ.\n"
        "- **Kiểm soát chi tiết (Granular control)**: Quản trị viên hệ thống có thể cấu hình sudo để chỉ cho phép những người dùng cụ thể chạy một số lệnh nhất định với quyền siêu người dùng.\n"
        "- **Trách nhiệm giải trình (Accountability)**: Khác với việc chia sẻ mật khẩu root cho nhiều người, `sudo` ghi lại nhật ký (log) rõ ràng ai đã chạy câu lệnh nào, nâng cao tính bảo mật và khả năng truy vết.\n"
        "- **Bảo mật**: Có các tài khoản định danh riêng biệt được cấp quyền sudo luôn an toàn hơn nhiều so với việc chia sẻ mật khẩu root dùng chung.\n\n"
        "Trong kịch bản thực tế, thông thường bạn sẽ thêm người dùng vào nhóm sudo nếu:\n\n"
        "- Họ là quản trị viên hệ thống hoặc nhân viên CNTT cần thực hiện các công việc bảo trì định kỳ.\n"
        "- Họ là nhà phát triển cần cài đặt phần mềm chuyên biệt hoặc thay đổi cài đặt hệ thống phục vụ công việc.\n"
        "- Họ là người dùng nâng cao cần quyền hạn đặc biệt cho một số tác vụ nhất định, nhưng bạn không muốn trao cho họ mật khẩu root.\n\n"
        "Hãy nhớ rằng việc thêm người dùng vào nhóm sudo trao cho họ quyền lực rất lớn đối với hệ thống, vì vậy thao tác này phải được thực hiện một cách thận trọng và chỉ khi thực sự cần thiết.\n\n"
        "Bây giờ, hãy thêm joker vào nhóm sudo:\n\n"
        "1. Chạy câu lệnh sau:\n\n"
        "```bash\n"
        "sudo usermod -aG sudo joker\n"
        "```\n\n"
        "Ý nghĩa của câu lệnh này:\n\n"
        "- `usermod`: Lệnh sửa đổi tài khoản người dùng.\n"
        "- `-aG`: Có nghĩa là **\"append to Group\"** (thêm người dùng vào nhóm phụ mới mà không xóa bỏ họ khỏi các nhóm hiện có). Hãy luôn nhớ cờ `-a` khi thêm nhóm phụ!\n"
        "- `sudo`: Tên nhóm mà chúng ta đang thêm người dùng vào.\n"
        "- `joker`: Tên người dùng đang được sửa đổi.\n\n"
        "2. Xác minh sự thay đổi:\n\n"
        "```bash\n"
        "groups joker\n"
        "```\n\n"
        "Bạn sẽ thấy `sudo` được liệt kê trong danh sách các nhóm của joker.\n\n"
        "3. Để xem hiệu lực thực tế của thay đổi này, chúng ta cần chuyển sang tài khoản người dùng joker và thử chạy một lệnh yêu cầu quyền sudo:\n\n"
        "```bash\n"
        "su - joker\n"
        "```\n\n"
        "Câu lệnh này chuyển từ người dùng hiện tại (`labex`) sang người dùng `joker`. "
        "Bạn sẽ được nhắc nhập mật khẩu của joker. Hãy nhớ lại, đây là mật khẩu bạn đã đặt ở bước trước (`password123`). "
        "Khi bạn gõ mật khẩu, bạn sẽ không thấy ký tự nào trên màn hình - đây là cơ chế bảo mật.\n\n"
        "4. Sau khi đã đăng nhập với tư cách joker, hãy thử xem nội dung một tệp tin bình thường chỉ dành riêng cho quyền root:\n\n"
        "```bash\n"
        "sudo cat /etc/shadow\n"
        "```\n\n"
        "Nhập lại mật khẩu của joker khi được nhắc. Bạn sẽ thấy nội dung của tệp `/etc/shadow`, tệp thường chỉ có root mới truy cập được. "
        "Điều này xác nhận rằng joker hiện đã có đầy đủ quyền hạn sudo.\n\n"
        "5. Sau khi hoàn thành kiểm tra, hãy gõ `exit` để quay trở lại tài khoản ban đầu của bạn (`labex`).\n\n"
        "Lưu ý: Trong môi trường sản xuất (production), hãy hết sức cẩn trọng về việc bạn trao quyền sudo cho ai. Quyền lực càng lớn thì trách nhiệm càng cao!"
    )

    # Section 7: Locking and Unlocking User Accounts
    lab['sections'][7]['title_vi'] = "Khóa và Mở Khóa Tài Khoản Người Dùng"
    lab['sections'][7]['task_vi'] = "Khóa tài khoản joker bằng sudo passwd -l joker, thử su - joker, sau đó mở khóa bằng sudo passwd -u joker."
    lab['sections'][7]['hint_vi'] = "Chạy sudo passwd -l joker rồi thử su - joker, sau đó mở lại bằng sudo passwd -u joker."
    lab['sections'][7]['content_vi'] = (
        "Đôi khi, bạn có thể cần tạm thời vô hiệu hóa quyền truy cập của một tài khoản người dùng mà không muốn xóa tài khoản đó khỏi hệ thống.\n\n"
        "1. Khóa tài khoản joker:\n\n"
        "```bash\n"
        "sudo passwd -l joker\n"
        "```\n\n"
        "Tùy chọn `-l` (lock) sẽ khóa mật khẩu của tài khoản.\n\n"
        "2. Thử chuyển sang người dùng joker:\n\n"
        "```bash\n"
        "su - joker\n"
        "```\n\n"
        "Hệ thống sẽ yêu cầu bạn nhập mật khẩu. Hãy nhập mật khẩu bạn đã đặt cho joker trước đó (\"password123\" nếu bạn làm theo gợi ý của chúng tôi).\n\n"
        "Bạn sẽ thấy thông báo lỗi **\"authentication failure\"** (xác thực thất bại). Điều này chứng minh tài khoản đã được khóa thành công.\n\n"
        "3. Bây giờ, hãy mở khóa tài khoản:\n\n"
        "```bash\n"
        "sudo passwd -u joker\n"
        "```\n\n"
        "Tùy chọn `-u` (unlock) sẽ mở khóa mật khẩu của người dùng.\n\n"
        "4. Thử chuyển sang tài khoản người dùng joker một lần nữa:\n\n"
        "```bash\n"
        "su - joker\n"
        "```\n\n"
        "Nhập mật khẩu khi được nhắc. Lần này, bạn sẽ chuyển sang tài khoản joker thành công.\n\n"
        "**Hãy gõ `exit` để quay trở lại tài khoản người dùng ban đầu (labex) trước khi tiếp tục bước tiếp theo.**"
    )

    # Section 8: Deleting a User
    lab['sections'][8]['title_vi'] = "Xóa Tài Khoản Người Dùng"
    lab['sections'][8]['task_vi'] = "Xóa người dùng bob cùng thư mục cá nhân bằng lệnh sudo userdel -r bob."
    lab['sections'][8]['hint_vi'] = "Chạy sudo userdel -r bob rồi kiểm tra bằng grep và ls."
    lab['sections'][8]['content_vi'] = (
        "Cuối cùng, hãy học cách xóa một người dùng. Chúng ta sẽ xóa người dùng \"bob\" mà chúng ta đã tạo trước đó.\n\n"
        "1. Xóa bob cùng thư mục cá nhân của người này:\n\n"
        "```bash\n"
        "sudo userdel -r bob\n"
        "```\n\n"
        "Lệnh `userdel` dùng để xóa các tài khoản người dùng khỏi hệ thống. Tùy chọn `-r` loại bỏ cả thư mục cá nhân (home directory) và hàng đợi thư (mail spool) của người dùng đó.\n\n"
        "2. Xác minh rằng người dùng đã bị xóa hoàn toàn:\n\n"
        "```bash\n"
        "sudo grep -w 'bob' /etc/passwd\n"
        "sudo ls -ld /home/bob\n"
        "```\n\n"
        "Cả hai câu lệnh đều không được trả về kết quả nào (tệp không tồn tại). "
        "Điều này khẳng định rằng cả người dùng lẫn thư mục cá nhân của họ đã được xóa bỏ thành công khỏi hệ thống."
    )

    # Section 9: Summary
    lab['sections'][9]['title_vi'] = "Tổng Kết Bài Học"
    lab['sections'][9]['content_vi'] = (
        "Xin chúc mừng! Bạn đã hoàn thành toàn diện bài thực hành Quản Lý Tài Khoản Người Dùng Linux (User Account Management). Bạn đã học được cách:\n\n"
        "1. Tạo các tài khoản người dùng mới (`useradd` và `useradd -m`).\n"
        "2. Thiết lập mật khẩu cho người dùng (`passwd`).\n"
        "3. Sửa đổi các thuộc tính người dùng như thư mục cá nhân và shell mặc định (`usermod -d`, `usermod -s`).\n"
        "4. Thêm người dùng vào nhóm để cấp quyền quản trị (`usermod -aG sudo`).\n"
        "5. Khóa và mở khóa tài khoản người dùng (`passwd -l`, `passwd -u`).\n"
        "6. Xóa tài khoản người dùng cùng thư mục cá nhân (`userdel -r`).\n\n"
        "Bạn cũng đã được làm quen với các khái niệm cốt lõi trong Linux như tệp danh bạ `/etc/passwd`, thư mục cá nhân (home directory), các trình thông dịch lệnh (shell), và các nhóm người dùng (groups). "
        "Đây là những kỹ năng thiết yếu đối với bất kỳ quản trị viên hệ thống Linux nào. "
        "Hãy nhớ rằng, trong các kịch bản thực tế, hãy luôn tuân thủ các chính sách bảo mật nghiêm ngặt của tổ chức khi quản lý tài khoản người dùng."
    )

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(lab, f, indent=2, ensure_ascii=False)
    print("Updated Lab 9 successfully!")

update_lab9()

