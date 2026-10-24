import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# ==============================================================================
# LAB 6: linux-the-manuscript-mystery
# ==============================================================================
def update_lab6():
    path = 'server/data/labs/linux-the-manuscript-mystery.json'
    with open(path, 'r', encoding='utf-8') as f:
        lab = json.load(f)

    # Section 0
    lab['sections'][0]['title_vi'] = "Giới thiệu"
    lab['sections'][0]['content_vi'] = (
        "Với tư cách là một biên tập viên tập sự tại một nhà xuất bản, bạn vừa phát hiện ra hai phiên bản của một trang tài liệu tối quan trọng "
        "từ cuốn tiểu thuyết trinh thám sắp ra mắt. Tác giả khẳng định chỉ có một vài câu chữ bị thay đổi giữa các bản thảo, "
        "nhưng bạn cần kiểm tra chính xác từng chi tiết trước khi cuốn sách được đưa vào in ấn!\n\n"
        "Nhiệm vụ của bạn là sử dụng các công cụ kiểm tra tệp tin dòng lệnh trong Linux để so sánh hai tệp bản thảo và xác định các điểm khác biệt.\n\n"
        "### Thành tựu đạt được\n\n"
        "Khi hoàn thành thử thách này, bạn sẽ chứng minh được năng lực thành thạo trong việc:\n\n"
        "- Sử dụng `cat`, `head`, và `tail` để kiểm tra nội dung tệp tin\n"
        "- Sử dụng lệnh `diff` để so sánh các tệp tin và tìm ra sự khác biệt"
    )

    # Section 1
    lab['sections'][1]['title_vi'] = "Kiểm Tra Nội Dung Tệp Tin"
    lab['sections'][1]['task_vi'] = "Dùng cat, head, tail để kiểm tra hai tệp manuscript_v1.txt và manuscript_v2.txt trong ~/project."
    lab['sections'][1]['hint_vi'] = "Chạy cat ~/project/manuscript_v1.txt, head -n 3 và tail -n 3 trên cả 2 tệp."
    lab['sections'][1]['content_vi'] = (
        "Trong bước này, bạn sẽ sử dụng các lệnh `cat`, `head`, và `tail` để kiểm tra hai tệp tin bí ẩn.\n\n"
        "### Nhiệm vụ (Tasks)\n\n"
        "1. Sử dụng `cat` để xem toàn bộ nội dung của cả hai tệp: `/home/labex/project/manuscript_v1.txt` và `/home/labex/project/manuscript_v2.txt`.\n"
        "2. Sử dụng `head` để xem 3 dòng đầu tiên của mỗi tệp.\n"
        "3. Sử dụng `tail` để xem 3 dòng cuối cùng của mỗi tệp.\n\n"
        "### Yêu cầu (Requirements)\n\n"
        "- Thực hiện tất cả các lệnh từ thư mục làm việc hiện tại của bạn hoặc sử dụng đường dẫn tuyệt đối.\n"
        "- Quan sát nội dung cẩn thận để tìm bất kỳ sự khác biệt nào mà mắt thường có thể nhận thấy.\n\n"
        "### Ví dụ (Example)\n\n"
        "Sau khi hoàn thành nhiệm vụ, việc chạy lệnh `head`:\n\n"
        "```bash\n"
        "head -n 3 /home/labex/project/manuscript_v1.txt\n"
        "```\n\n"
        "Sẽ cho kết quả tương tự như sau:\n\n"
        "```plaintext\n"
        "The old grandfather clock struck midnight.\n"
        "A shadow moved across the room.\n"
        "Detective Vance held his breath.\n"
        "```"
    )

    # Section 2
    lab['sections'][2]['title_vi'] = "So Sánh Các Tệp Tin"
    lab['sections'][2]['task_vi'] = "Dùng lệnh diff để so sánh hai tệp manuscript_v1.txt và manuscript_v2.txt."
    lab['sections'][2]['hint_vi'] = "Chạy diff /home/labex/project/manuscript_v1.txt /home/labex/project/manuscript_v2.txt."
    lab['sections'][2]['content_vi'] = (
        "Bây giờ bạn đã kiểm tra các tệp tin một cách riêng lẻ, đã đến lúc so sánh trực tiếp hai tệp này với nhau bằng công cụ chuyên dụng.\n\n"
        "### Nhiệm vụ (Tasks)\n\n"
        "1. Sử dụng lệnh `diff` để so sánh giữa `/home/labex/project/manuscript_v1.txt` và `/home/labex/project/manuscript_v2.txt`.\n\n"
        "### Yêu cầu (Requirements)\n\n"
        "- Sử dụng lệnh `diff` như đã được hướng dẫn trong bài thực hành File Contents and Comparing.\n"
        "- Phân tích kết quả đầu ra để hiểu chính xác những điểm khác biệt giữa hai tệp.\n\n"
        "### Ví dụ (Example)\n\n"
        "Sau khi hoàn thành nhiệm vụ, bạn sẽ thấy kết quả tương tự như sau:\n\n"
        "```bash\n"
        "2c2\n"
        "< A shadow moved across the room.\n"
        "---\n"
        "> A figure darted behind the curtains.\n"
        "```\n\n"
        "Kết quả này chỉ ra rằng dòng thứ hai có sự khác biệt giữa hai phiên bản bản thảo."
    )

    # Section 3
    lab['sections'][3]['title_vi'] = "Tổng Kết Thử Thách"
    lab['sections'][3]['content_vi'] = (
        "Xin chúc mừng, biên tập viên tập sự! Bạn đã áp dụng thành công các kỹ năng kiểm tra tệp tin Linux mới học được để khám phá ra sự khác biệt giữa hai phiên bản trang bản thảo. "
        "Khả năng sử dụng thành thạo `cat`, `head`, `tail`, và `diff` của bạn đã chứng tỏ giá trị vô giá trong việc giải mã bí ẩn biên tập này.\n\n"
        "Bằng cách xem toàn bộ nội dung tệp bằng `cat`, kiểm tra các phần cụ thể bằng `head` và `tail`, và so sánh tệp bằng `diff`, "
        "bạn đã chứng minh được sự nắm bắt vững chắc về các thao tác xử lý tệp cơ bản trong Linux. "
        "Những kỹ năng này sẽ hỗ trợ bạn đắc lực khi bạn tiếp tục hành trình trong thế giới xuất bản cũng như trong các cuộc phiêu lưu với Linux.\n\n"
        "Hãy nhớ rằng: sự chú ý đến từng chi tiết nhỏ kết hợp với các công cụ phù hợp có thể làm sáng tỏ mọi bí ẩn - dù là trong tiểu thuyết hay trong các dòng mã nguồn!"
    )

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(lab, f, indent=2, ensure_ascii=False)
    print("Updated Lab 6 successfully!")

# ==============================================================================
# LAB 8: shell-change-file-ownership
# ==============================================================================
def update_lab8():
    path = 'server/data/labs/shell-change-file-ownership.json'
    with open(path, 'r', encoding='utf-8') as f:
        lab = json.load(f)

    # Section 0
    lab['sections'][0]['title_vi'] = "Giới thiệu"
    lab['sections'][0]['content_vi'] = (
        "Thử thách này sẽ kiểm tra sự hiểu biết của bạn về quản lý quyền sở hữu và phân quyền tệp tin trong Linux. "
        "Bạn sẽ vận dụng kiến thức về việc kiểm tra và sửa đổi quyền hạn cũng như quyền sở hữu tệp, chứng minh sự thành thạo của bạn đối với các câu lệnh Linux cốt lõi.\n\n"
        "### Thành tựu đạt được\n\n"
        "Khi hoàn thành thử thách này, bạn sẽ chứng minh được năng lực trong việc:\n\n"
        "- Sử dụng `chown` để thay đổi quyền sở hữu tệp\n"
        "- Sử dụng `chmod` để sửa đổi quyền truy cập tệp\n"
        "- Sử dụng `touch` để tạo tệp mới\n"
        "- Sử dụng `ls` để xem thông tin chi tiết của tệp"
    )

    # Section 1
    lab['sections'][1]['title_vi'] = "Tạo một Tệp Tin"
    lab['sections'][1]['task_vi'] = "Tạo tệp target_file trong thư mục ~/project bằng lệnh touch."
    lab['sections'][1]['hint_vi'] = "Chạy touch ~/project/target_file."
    lab['sections'][1]['content_vi'] = (
        "Nhiệm vụ đầu tiên của bạn là tạo một tệp mới trong thư mục `~/project`.\n\n"
        "### Nhiệm vụ (Tasks)\n\n"
        "- Tạo một tệp có tên `target_file` trong thư mục `~/project`.\n\n"
        "### Yêu cầu (Requirements)\n\n"
        "- Sử dụng lệnh `touch` để tạo tệp.\n"
        "- Đảm bảo tệp được tạo đúng vị trí trong thư mục `~/project`.\n\n"
        "### Ví dụ (Example)\n\n"
        "Sau khi hoàn thành nhiệm vụ, chạy câu lệnh sau:\n\n"
        "```bash\n"
        "cd ~/project && ls\n"
        "```\n\n"
        "Sẽ hiển thị kết quả tương tự như:\n\n"
        "```plaintext\n"
        "target_file\n"
        "```"
    )

    # Section 2
    lab['sections'][2]['title_vi'] = "Thay Đổi Chủ Sở Hữu và Nhóm Sở Hữu Tệp"
    lab['sections'][2]['task_vi'] = "Đổi owner thành user1 và group thành group1 cho target_file bằng lệnh chown."
    lab['sections'][2]['hint_vi'] = "Chạy sudo chown user1:group1 ~/project/target_file."
    lab['sections'][2]['content_vi'] = (
        "Trong bước này, bạn sẽ sửa đổi quyền sở hữu của `target_file` mà bạn vừa tạo.\n\n"
        "### Nhiệm vụ (Tasks)\n\n"
        "- Đổi người dùng sở hữu (owner) của `target_file` thành `user1`.\n"
        "- Đổi nhóm sở hữu (group) của `target_file` thành `group1`.\n\n"
        "### Yêu cầu (Requirements)\n\n"
        "- Sử dụng lệnh `chown` để thay đổi cả người sở hữu lẫn nhóm sở hữu.\n"
        "- Chủ sở hữu của tệp phải được đặt thành `user1`.\n"
        "- Nhóm sở hữu của tệp phải được đặt thành `group1`.\n\n"
        "### Mẹo (Tips)\n\n"
        "- Bạn có thể cần sử dụng `sudo` trước một số câu lệnh nhất định trong thử thách này. `sudo` cho phép bạn thực thi các câu lệnh với đặc quyền của siêu người dùng (root).\n\n"
        "### Ví dụ (Example)\n\n"
        "Sau khi hoàn thành nhiệm vụ, chạy lệnh:\n\n"
        "```bash\n"
        "ls -l ~/project/target_file\n"
        "```\n\n"
        "Sẽ hiển thị kết quả tương tự như sau:\n\n"
        "```plaintext\n"
        "-rw-rw-r-- 1 user1 group1 0 Jul 29 10:59 target_file\n"
        "```"
    )

    # Section 3
    lab['sections'][3]['title_vi'] = "Thiết Lập Quyền Truy Cập Tệp"
    lab['sections'][3]['task_vi'] = "Thiết lập quyền truy cập của target_file thành -rwxrw---- (chmod 760)."
    lab['sections'][3]['hint_vi'] = "Chạy sudo chmod 760 ~/project/target_file hoặc chmod u=rwx,g=rw,o= ~/project/target_file."
    lab['sections'][3]['content_vi'] = (
        "Trong bước cuối cùng này, bạn sẽ sửa đổi quyền truy cập của `target_file`.\n\n"
        "### Nhiệm vụ (Tasks)\n\n"
        "- Thiết lập quyền hạn của `target_file` thành `-rwxrw----`.\n\n"
        "### Yêu cầu (Requirements)\n\n"
        "- Sử dụng lệnh `chmod` để thay đổi quyền truy cập tệp.\n"
        "- Quyền truy cập cuối cùng bắt buộc phải là `-rwxrw----`.\n\n"
        "### Ví dụ (Example)\n\n"
        "Sau khi hoàn thành nhiệm vụ, chạy lệnh:\n\n"
        "```bash\n"
        "ls -l ~/project/target_file\n"
        "```\n\n"
        "Sẽ hiển thị kết quả tương tự như sau:\n\n"
        "```plaintext\n"
        "-rwxrw---- 1 user1 group1 0 Jul 29 10:59 target_file\n"
        "```"
    )

    # Section 4
    lab['sections'][4]['title_vi'] = "Tổng Kết Thử Thách"
    lab['sections'][4]['content_vi'] = (
        "Xin chúc mừng bạn đã hoàn thành xuất sắc thử thách phân quyền tệp tin! Bạn đã chứng minh thành công năng lực của mình trong việc:\n\n"
        "1. Tạo tệp tin bằng lệnh `touch`\n"
        "2. Thay đổi quyền sở hữu tệp tin bằng lệnh `chown`\n"
        "3. Sửa đổi quyền truy cập tệp tin bằng lệnh `chmod`\n"
        "4. Xem thông tin chi tiết thuộc tính tệp bằng lệnh `ls`\n\n"
        "Các lệnh này là nền tảng sống còn trong việc quản lý tệp tin Linux và được sử dụng liên tục trong các tác vụ quản trị hệ thống hàng ngày. "
        "Hãy tiếp tục luyện tập và khám phá thêm để củng cố vững chắc kỹ năng của bạn về quyền sở hữu và phân quyền tệp tin Linux."
    )

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(lab, f, indent=2, ensure_ascii=False)
    print("Updated Lab 8 successfully!")

# ==============================================================================
# LAB 10: linux-the-jokers-trick
# ==============================================================================
def update_lab10():
    path = 'server/data/labs/linux-the-jokers-trick.json'
    with open(path, 'r', encoding='utf-8') as f:
        lab = json.load(f)

    # Section 0
    lab['sections'][0]['title_vi'] = "Giới thiệu"
    lab['sections'][0]['content_vi'] = (
        "Trong thử thách này, bạn sẽ vận dụng toàn bộ kiến thức về quản lý tài khoản người dùng Linux. "
        "Bạn sẽ tạo các tài khoản người dùng mới, sửa đổi các tài khoản hiện có, và xóa người dùng. "
        "Thử thách này sẽ kiểm tra sự hiểu biết sâu sắc của bạn về các khái niệm đã học trong bài lab \"User Account Management\".\n\n"
        "### Thành tựu đạt được\n\n"
        "Bạn sẽ thể hiện năng lực sử dụng các lệnh:\n\n"
        "- `useradd` - dùng để tạo tài khoản người dùng mới\n"
        "- `passwd` - dùng để thay đổi mật khẩu người dùng\n"
        "- `usermod` - dùng để sửa đổi thuộc tính tài khoản người dùng\n"
        "- `userdel` - dùng để xóa tài khoản người dùng"
    )

    # Section 1
    lab['sections'][1]['title_vi'] = "Tạo Các Tài Khoản Người Dùng"
    lab['sections'][1]['task_vi'] = "Tạo người dùng joker và người dùng batman (thư mục /home/gotham) bằng useradd."
    lab['sections'][1]['hint_vi'] = "Chạy sudo useradd -m joker và sudo useradd -m -d /home/gotham batman."
    lab['sections'][1]['content_vi'] = (
        "Trong bước này, bạn sẽ tạo một số tài khoản người dùng với các thông số kỹ thuật khác nhau.\n\n"
        "### Nhiệm vụ (Tasks)\n\n"
        "Hoàn thành các nhiệm vụ sau theo thứ tự:\n\n"
        "1. Tạo một người dùng có tên `joker`.\n"
        "2. Tạo một người dùng có tên `batman` với thư mục cá nhân tại `/home/gotham`.\n\n"
        "### Yêu cầu (Requirements)\n\n"
        "- Sử dụng lệnh `useradd` cho tất cả các thao tác tạo người dùng.\n"
        "- Đảm bảo cả hai người dùng đều được tự động tạo thư mục cá nhân trong quá trình tạo tài khoản.\n"
        "- Người dùng `batman` có thư mục cá nhân khác với vị trí mặc định (`/home/gotham`).\n\n"
        "### Ví dụ (Example)\n\n"
        "Sau khi hoàn thành các nhiệm vụ này, bạn có thể xác minh thông tin người dùng như sau:\n\n"
        "```bash\n"
        "grep -w joker /etc/passwd\n"
        "grep -w batman /etc/passwd\n"
        "```\n\n"
        "Kết quả mẫu:\n\n"
        "```plaintext\n"
        "joker:x:5001:5001::/home/joker:/bin/sh\n"
        "batman:x:5002:5002::/home/gotham:/bin/sh\n"
        "```"
    )

    # Section 2
    lab['sections'][2]['title_vi'] = "Quản Lý Mật Khẩu Người Dùng"
    lab['sections'][2]['task_vi'] = "Thiết lập mật khẩu cho người dùng joker và batman bằng lệnh passwd."
    lab['sections'][2]['hint_vi'] = "Chạy sudo passwd joker và sudo passwd batman (ví dụ đặt password123)."
    lab['sections'][2]['content_vi'] = (
        "Trong bước này, bạn sẽ thiết lập và thay đổi mật khẩu cho các tài khoản người dùng.\n\n"
        "### Nhiệm vụ (Tasks)\n\n"
        "Hoàn thành các nhiệm vụ sau:\n\n"
        "1. Đặt mật khẩu cho người dùng `joker`.\n"
        "2. Đặt mật khẩu cho người dùng `batman`.\n\n"
        "### Yêu cầu (Requirements)\n\n"
        "- Sử dụng lệnh `passwd` cho tất cả các thao tác xử lý mật khẩu.\n"
        "- Đối với thử thách này, hãy sử dụng các mật khẩu đơn giản như `password123`.\n\n"
        "### Ví dụ (Example)\n\n"
        "Sau khi thiết lập mật khẩu, bạn có thể kiểm tra trạng thái mật khẩu bằng lệnh:\n\n"
        "```bash\n"
        "sudo passwd -S joker\n"
        "sudo passwd -S batman\n"
        "```\n\n"
        "Kết quả mẫu:\n\n"
        "```plaintext\n"
        "joker P 01/19/2024 0 99999 7 -1\n"
        "batman P 01/19/2024 0 99999 7 -1\n"
        "```\n\n"
        "Trong kết quả này, chữ `P` có nghĩa là tài khoản đã có một mật khẩu hợp lệ (Usable Password)."
    )

    # Section 3
    lab['sections'][3]['title_vi'] = "Sửa Đổi Tài Khoản Người Dùng"
    lab['sections'][3]['task_vi'] = "Đổi thư mục home của joker thành /home/arkham và shell của batman thành /bin/bash bằng usermod."
    lab['sections'][3]['hint_vi'] = "Chạy sudo usermod -d /home/arkham joker và sudo usermod -s /bin/bash batman."
    lab['sections'][3]['content_vi'] = (
        "Trong bước này, bạn sẽ sửa đổi các tài khoản người dùng hiện có.\n\n"
        "### Nhiệm vụ (Tasks)\n\n"
        "Hoàn thành các nhiệm vụ sau:\n\n"
        "1. Đổi thư mục cá nhân của người dùng `joker` thành `/home/arkham`.\n"
        "2. Đổi shell mặc định của người dùng `batman` thành `/bin/bash`.\n\n"
        "### Yêu cầu (Requirements)\n\n"
        "- Sử dụng lệnh `usermod` cho tất cả các thao tác sửa đổi thuộc tính.\n\n"
        "### Ví dụ (Example)\n\n"
        "Sau khi thực hiện các thay đổi này, bạn có thể xác minh lại bằng lệnh:\n\n"
        "```bash\n"
        "grep -w joker /etc/passwd\n"
        "grep -w batman /etc/passwd\n"
        "```\n\n"
        "Kết quả mẫu:\n\n"
        "```plaintext\n"
        "joker:x:5001:5001::/home/arkham:/bin/sh\n"
        "batman:x:5002:5002::/home/gotham:/bin/bash\n"
        "```"
    )

    # Section 4
    lab['sections'][4]['title_vi'] = "Xóa Tài Khoản Người Dùng"
    lab['sections'][4]['task_vi'] = "Xóa joker (giữ nguyên thư mục home), và xóa batman cùng thư mục /home/gotham (userdel -r)."
    lab['sections'][4]['hint_vi'] = "Chạy sudo userdel joker rồi sudo userdel -r batman."
    lab['sections'][4]['content_vi'] = (
        "Trong bước cuối cùng này, bạn sẽ tiến hành xóa các tài khoản người dùng.\n\n"
        "### Nhiệm vụ (Tasks)\n\n"
        "Hoàn thành các nhiệm vụ sau:\n\n"
        "1. Xóa người dùng `joker` nhưng **không xóa** thư mục cá nhân của người này.\n"
        "2. Xóa người dùng `batman` **cùng toàn bộ** thư mục cá nhân `/home/gotham` của người này.\n\n"
        "### Yêu cầu (Requirements)\n\n"
        "- Sử dụng lệnh `userdel` cho tất cả các thao tác xóa tài khoản.\n\n"
        "### Ví dụ (Example)\n\n"
        "Sau khi xóa các người dùng này, bạn có thể kiểm tra xác minh:\n\n"
        "```bash\n"
        "grep -w joker /etc/passwd\n"
        "grep -w batman /etc/passwd\n"
        "ls -ld /home/gotham\n"
        "```\n\n"
        "Hai câu lệnh `grep` đều không được trả về kết quả nào. Đối với lệnh `ls -ld /home/gotham`, "
        "thông báo \"No such file or directory\" xác nhận rằng thư mục này đã được loại bỏ thành công."
    )

    # Section 5
    lab['sections'][5]['title_vi'] = "Tổng Kết Thử Thách"
    lab['sections'][5]['content_vi'] = (
        "Xin chúc mừng! Bạn đã hoàn thành xuất sắc thử thách quản lý tài khoản người dùng \"Joker's Trick\". Bạn đã chứng minh được năng lực của mình trong việc:\n\n"
        "1. Tạo tài khoản người dùng với các thông số cấu hình đa dạng\n"
        "2. Thiết lập và thay đổi mật khẩu người dùng\n"
        "3. Sửa đổi các thuộc tính tài khoản người dùng (thư mục cá nhân, shell mặc định)\n"
        "4. Xóa tài khoản người dùng có hoặc không kèm theo việc xóa thư mục cá nhân\n\n"
        "Những kỹ năng này là nền tảng cốt lõi cho công việc quản trị hệ thống Linux chuyên nghiệp. "
        "Hãy tiếp tục luyện tập và khám phá để trở thành một chuyên gia quản trị người dùng Linux thực thụ!"
    )

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(lab, f, indent=2, ensure_ascii=False)
    print("Updated Lab 10 successfully!")

update_lab6()
update_lab8()
update_lab10()

# Legacy edits must not leave translations out of sync with task grading.
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('repair-quick-start-consistency.py')), run_name='__main__')

