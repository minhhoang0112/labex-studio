"""Full authentic translation script for Labs 6, 7, 8, 9, 10.
Preserves 100% of authentic English explanations, commands, notes, requirements, and examples.
"""
import json
from pathlib import Path

LABS_DIR = Path(__file__).resolve().parents[1] / "server" / "data" / "labs"

# Lab 6: linux-the-manuscript-mystery
LAB6_TRANSLATIONS = {
    "source-384742-section-0": {
        "title_vi": "Giới thiệu",
        "content_vi": """Là một biên tập viên tập sự tại một nhà xuất bản, bạn vừa phát hiện ra hai bản thảo khác nhau của một trang sách quan trọng từ một cuốn tiểu thuyết trinh thám sắp ra mắt. Tác giả nổi tiếng là người bí ẩn và thường xuyên để lại những manh mối ẩn giấu trong các bản sửa đổi của mình.

Nhiệm vụ của bạn là kiểm tra hai tệp bản thảo này, khám phá những điểm khác biệt và tìm ra manh mối ẩn chứa trong câu chuyện!

### Mục tiêu kỹ năng

Sau khi hoàn thành thử thách này, bạn sẽ làm chủ:
- `cat`: Đọc toàn bộ nội dung tệp bản thảo.
- `head`: Đọc các đoạn văn mở đầu.
- `tail`: Đọc các manh mối ở phần kết trang.
- `diff`: So sánh chính xác từng điểm dị biệt giữa hai bản thảo."""
    },
    "source-384742-section-1": {
        "title_vi": "Khám Phá Nội Dung Bản Thảo",
        "task_vi": "Sử dụng cat, head và tail để kiểm tra nội dung hai tệp bản thảo.",
        "hint_vi": "Chạy cat manuscript_page_v1.txt, head -n 3 và tail -n 3.",
        "content_vi": """Trong bước này, bạn sẽ sử dụng các lệnh `cat`, `head`, và `tail` để kiểm tra hai tệp văn bản bí ẩn.

### Nhiệm vụ

1. Sử dụng lệnh `cat` để xem toàn bộ nội dung của tệp `manuscript_page_v1.txt`.
2. Sử dụng lệnh `head` để chỉ đọc 3 dòng đầu tiên của `manuscript_page_v2.txt`.
3. Sử dụng lệnh `tail` để đọc 3 dòng cuối cùng của `manuscript_page_v1.txt`.

### Hướng dẫn thực hiện

```bash
cat manuscript_page_v1.txt
head -n 3 manuscript_page_v2.txt
tail -n 3 manuscript_page_v1.txt
```

Hãy quan sát kỹ các chi tiết văn bản xuất hiện trên màn hình terminal để nắm bắt cốt truyện và phát hiện các manh mối."""
    },
    "source-384742-section-2": {
        "title_vi": "So Sánh Hai Bản Thảo",
        "task_vi": "Chạy lệnh diff -u manuscript_page_v1.txt manuscript_page_v2.txt để tìm điểm dị biệt.",
        "hint_vi": "Sử dụng lệnh diff -u giữa 2 tệp bản thảo.",
        "content_vi": """Bây giờ bạn đã xem qua từng tệp riêng lẻ, đã đến lúc so sánh trực tiếp hai bản thảo để tìm ra sự khác biệt mấu chốt.

### Nhiệm vụ

1. Sử dụng câu lệnh `diff` ở định dạng hợp nhất (`-u`) để so sánh `manuscript_page_v1.txt` và `manuscript_page_v2.txt`.

```bash
diff -u manuscript_page_v1.txt manuscript_page_v2.txt
```

### Phân tích kết quả

Hãy chú ý các dòng bắt đầu bằng dấu `-` (nội dung có trong bản v1 nhưng bị loại bỏ ở bản v2) và các dòng bắt đầu bằng dấu `+` (nội dung mới được tác giả đưa vào bản v2). Những thay đổi này chứa đựng lời giải cho bí ẩn của bản thảo!"""
    },
    "source-384742-section-3": {
        "title_vi": "Tổng kết thử thách",
        "content_vi": """Xin chúc mừng, biên tập viên tập sự! Bạn đã áp dụng thành công các kỹ năng phân tích tệp tin Linux vừa học để làm sáng tỏ bí ẩn trong bản thảo.

Thông qua thử thách này, bạn đã:
- Sử dụng `cat` để đọc tài liệu đầy đủ.
- Sử dụng `head` và `tail` để trích xuất các đoạn văn bản quan trọng ở đầu và cuối tệp.
- Sử dụng `diff -u` để phát hiện chính xác các chi tiết bị thay đổi giữa các phiên bản.

Đây là những kỹ năng cốt lõi được ứng dụng hàng ngày trong quản trị hệ thống, lập trình và xử lý dữ liệu trên Linux!"""
    }
}

# Lab 7: linux-permissions-of-files
LAB7_TRANSLATIONS = {
    "source-270252-section-0": {
        "title_vi": "Giới thiệu",
        "content_vi": """Trong bài thực hành này, chúng ta sẽ đi sâu vào thế giới phân quyền tệp tin trong Linux (File Permissions). Chúng ta sẽ khám phá ba câu lệnh quản trị thiết yếu:

- `touch`: Dùng để tạo tệp tin mới.
- `chown`: Dùng để thay đổi quyền sở hữu tệp và thư mục (Owner & Group).
- `chmod`: Dùng để thay đổi quyền truy cập (Đọc, Ghi, Thực thi).

Hiểu rõ cách hoạt động của hệ thống phân quyền là một trong những nền tảng quan trọng nhất để bảo mật và vận hành hệ thống Linux chuyên nghiệp."""
    },
    "source-270252-section-1": {
        "title_vi": "Tạo Tệp Tin Mới",
        "task_vi": "Chạy touch sample_file.txt và kiểm tra quyền bằng ls -l.",
        "hint_vi": "Dùng touch sample_file.txt sau đó ls -l sample_file.txt.",
        "content_vi": """Hãy bắt đầu bằng việc tạo một tệp tin mới sử dụng câu lệnh `touch`. Câu lệnh đa năng này vừa có thể tạo tệp rỗng mới, vừa có thể cập nhật dấu thời gian truy cập của tệp hiện có.

1. Mở cửa sổ terminal và tạo tệp tin mẫu:
```bash
touch sample_file.txt
```

2. Kiểm tra thông tin chi tiết và quyền mặc định của tệp vừa tạo:
```bash
ls -l sample_file.txt
```

Kết quả sẽ có dạng tương tự như sau:
```plaintext
-rw-rw-r-- 1 labex labex 0 Jan 15 10:30 sample_file.txt
```

### Giải mã các trường thông tin:
- Ký tự đầu tiên `-`: Biểu thị đây là một tệp thông thường (regular file). Nếu là thư mục sẽ bắt đầu bằng chữ `d`.
- 9 ký tự tiếp theo `rw-rw-r--`: Chuỗi phân quyền (3 ký tự cho Chủ sở hữu User, 3 cho Nhóm Group, 3 cho Người khác Others).
- `1`: Số lượng liên kết cứng (hard links).
- `labex`: Tên tài khoản người dùng sở hữu tệp (Owner).
- `labex`: Tên nhóm sở hữu tệp (Group).
- `0`: Kích thước tệp tính bằng byte.
- `sample_file.txt`: Tên tệp tin."""
    },
    "source-270252-section-2": {
        "title_vi": "Thay Đổi Quyền Sở Hữu Của Tệp (chown)",
        "task_vi": "Thay đổi quyền sở hữu của sample_file.txt cho user và group khác bằng lệnh chown.",
        "hint_vi": "Sử dụng sudo chown root:root sample_file.txt rồi đổi lại sudo chown labex:labex sample_file.txt.",
        "content_vi": """Bây giờ chúng ta đã có tệp tin, hãy học cách thay đổi quyền sở hữu của nó. Câu lệnh `chown` (change owner) cho phép chúng ta thay đổi người dùng sở hữu (User Owner) và nhóm sở hữu (Group Owner) của tệp.

Lưu ý: Thay đổi quyền sở hữu thường yêu cầu đặc quyền quản trị viên (root), do đó chúng ta cần dùng thêm tiền tố `sudo`.

1. Thay đổi người sở hữu tệp thành `root`:
```bash
sudo chown root sample_file.txt
ls -l sample_file.txt
```

Bạn sẽ thấy cột người sở hữu đã chuyển từ `labex` sang `root`.

2. Thay đổi cả người sở hữu lẫn nhóm sở hữu cùng lúc:
```bash
sudo chown root:root sample_file.txt
ls -l sample_file.txt
```

3. Chuyển quyền sở hữu trở lại cho người dùng `labex`:
```bash
sudo chown labex:labex sample_file.txt
ls -l sample_file.txt
```

Cú pháp tổng quát: `chown [người_dùng]:[nhóm] [tên_tệp]`."""
    },
    "source-270252-section-3": {
        "title_vi": "Thay Đổi Quyền Sở Hữu Của Thư Mục",
        "task_vi": "Tạo thư mục sample_dir và đổi quyền sở hữu đệ quy bằng sudo chown -R.",
        "hint_vi": "Sử dụng sudo chown -R root:root sample_dir.",
        "content_vi": """Câu lệnh `chown` cũng có thể thay đổi quyền sở hữu của toàn bộ thư mục cùng tất cả các tệp con bên trong thông qua cờ đệ quy `-R`.

1. Tạo thư mục mẫu và tệp con bên trong:
```bash
mkdir sample_dir
touch sample_dir/file1.txt sample_dir/file2.txt
```

2. Kiểm tra quyền sở hữu hiện tại:
```bash
ls -ld sample_dir
ls -l sample_dir
```

3. Thay đổi quyền sở hữu toàn bộ thư mục và tệp con sang `root`:
```bash
sudo chown -R root:root sample_dir
ls -ld sample_dir
ls -l sample_dir
```

Tùy chọn `-R` (recursive - đệ quy) đảm bảo áp dụng thay đổi từ thư mục cha xuống mọi tệp và thư mục con.

4. Chuyển quyền sở hữu trở lại cho tài khoản `labex`:
```bash
sudo chown -R labex:labex sample_dir
ls -ld sample_dir
```"""
    },
    "source-270252-section-4": {
        "title_vi": "Thay Đổi Quyền Truy Cập Tệp (chmod dạng Số)",
        "task_vi": "Thực hành đổi quyền tệp bằng lệnh chmod dạng số như 755, 644, 400.",
        "hint_vi": "Chạy chmod 755 sample_file.txt rồi kiểm tra bằng ls -l.",
        "content_vi": """Trong Linux, quyền truy cập tệp được biểu diễn bằng các ký tự hoặc hệ số Bát phân (Octal notation):

- `r` (Read - Đọc) = **4**
- `w` (Write - Ghi/Sửa) = **2**
- `x` (Execute - Thực thi) = **1**
- `-` (Không có quyền) = **0**

Tổng của các giá trị tạo nên quyền cho từng nhóm đối tượng:
- `7` = 4 + 2 + 1 = Đọc, Ghi và Thực thi (`rwx`)
- `6` = 4 + 2 + 0 = Đọc và Ghi (`rw-`)
- `5` = 4 + 0 + 1 = Đọc và Thực thi (`r-x`)
- `4` = 4 + 0 + 0 = Chỉ Đọc (`r--`)

### Thực hành thay đổi quyền tệp bằng lệnh `chmod`:

1. Gán quyền `755` (Chủ sở hữu toàn quyền, Nhóm và Người khác chỉ được đọc và chạy):
```bash
chmod 755 sample_file.txt
ls -l sample_file.txt
```
Kết quả: `-rwxr-xr-x`

2. Gán quyền chuẩn cho tài liệu `644` (Chủ sở hữu đọc/ghi, người khác chỉ đọc):
```bash
chmod 644 sample_file.txt
ls -l sample_file.txt
```
Kết quả: `-rw-r--r--`

3. Gán quyền chỉ đọc cho chủ sở hữu `400`:
```bash
chmod 400 sample_file.txt
ls -l sample_file.txt
```
Kết quả: `-r--------`"""
    },
    "source-270252-section-5": {
        "title_vi": "Thay Đổi Quyền Truy Cập Thư Mục",
        "task_vi": "Thực hành đổi quyền thư mục sample_dir bằng chmod 755 và chmod 700.",
        "hint_vi": "Chạy chmod 755 sample_dir và chmod 700 sample_dir.",
        "content_vi": """Phân quyền đối với thư mục có ý nghĩa đặc biệt:
- **Đọc (`r`)**: Cho phép liệt kê danh sách tệp trong thư mục (chạy lệnh `ls`).
- **Ghi (`w`)**: Cho phép tạo mới, xóa bỏ hoặc đổi tên tệp trong thư mục.
- **Thực thi (`x`)**: Cho phép đi vào bên trong thư mục (chạy lệnh `cd`).

Nếu một thư mục thiếu quyền `x`, bạn sẽ không thể mở thư mục đó hoặc truy cập các tệp con!

1. Gán quyền tiêu chuẩn cho thư mục `755`:
```bash
chmod 755 sample_dir
ls -ld sample_dir
```

2. Gán quyền riêng tư `700` (chỉ chủ sở hữu mới có quyền truy cập):
```bash
chmod 700 sample_dir
ls -ld sample_dir
```

3. Thay đổi quyền đệ quy cho cả thư mục và các tệp bên trong bằng cờ `-R`:
```bash
chmod -R 755 sample_dir
ls -ld sample_dir
ls -l sample_dir
```"""
    },
    "source-270252-section-6": {
        "title_vi": "Sử Dụng Ký Hiệu Biểu Tượng (Symbolic Notation)",
        "task_vi": "Thực hành chmod bằng ký hiệu biểu tượng như u+x, g-w, o=r, a+x.",
        "hint_vi": "Sử dụng chmod u+x, g-w, a+r trên sample_file.txt.",
        "content_vi": """Ngoài cách tính số bát phân, Linux còn hỗ trợ ký pháp biểu tượng (Symbolic Notation), rất trực quan khi bạn chỉ muốn thêm hoặc bớt một quyền cụ thể mà không cần tính toán lại toàn bộ:

### Các ký hiệu đối tượng:
- `u` (User): Chủ sở hữu
- `g` (Group): Nhóm sở hữu
- `o` (Others): Người khác
- `a` (All): Tất cả mọi đối tượng (`u`, `g`, và `o`)

### Các toán tử:
- `+`: Thêm quyền
- `-`: Gỡ bỏ quyền
- `=`: Thiết lập quyền chính xác

### Ví dụ thực hành:

1. Thêm quyền thực thi cho chủ sở hữu:
```bash
chmod u+x sample_file.txt
ls -l sample_file.txt
```

2. Bớt quyền đọc và ghi của nhóm:
```bash
chmod g-rw sample_file.txt
ls -l sample_file.txt
```

3. Thêm quyền đọc cho tất cả mọi người:
```bash
chmod a+r sample_file.txt
ls -l sample_file.txt
```

4. Kết hợp nhiều thao tác bằng dấu phẩy:
```bash
chmod u=rwx,g=rx,o=r sample_file.txt
ls -l sample_file.txt
```"""
    },
    "source-270252-section-7": {
        "title_vi": "Tổng kết bài học",
        "content_vi": """Trong bài thực hành này, bạn đã làm chủ các kiến thức phân quyền toàn diện trong Linux:

1. Dùng `touch` để khởi tạo tệp tin mẫu.
2. Dùng `chown` để thay đổi người dùng và nhóm sở hữu (kèm cờ đệ quy `-R`).
3. Dùng `chmod` dạng số (Bát phân: 755, 644, 700) để thiết lập quyền truy cập.
4. Dùng `chmod` dạng biểu tượng (`u+x`, `g-w`, `a+r`) để tinh chỉnh quyền linh hoạt.
5. Hiểu rõ ý nghĩa của quyền `r`, `w`, `x` đối với tệp tin và thư mục.

Đây là kiến thức bắt buộc cho bất kỳ chứng chỉ Linux nào (CompTIA Linux+, LPIC-1, RHCSA)!"""
    }
}

# Lab 8: shell-change-file-ownership
LAB8_TRANSLATIONS = {
    "source-270254-section-0": {
        "title_vi": "Giới thiệu",
        "content_vi": """Thử thách này sẽ kiểm tra hiểu biết của bạn về quản lý quyền truy cập và sở hữu tệp trong Linux. Bạn sẽ áp dụng kiến thức về xem xét và thay đổi quyền sở hữu tệp để hoàn thành các yêu cầu mà không có hướng dẫn từng bước.

### Kỹ năng cần vận dụng:
- Tạo tệp tin chỉ định.
- Thay đổi chủ sở hữu và nhóm sở hữu sang tài khoản hệ thống.
- Thiết lập quyền truy cập chính xác theo yêu cầu bảo mật."""
    },
    "source-270254-section-1": {
        "title_vi": "Tạo Tệp Tin Chỉ Định",
        "task_vi": "Tạo tệp target_file trong thư mục ~/project.",
        "hint_vi": "Chạy touch ~/project/target_file hoặc touch target_file.",
        "content_vi": """Nhiệm vụ đầu tiên của bạn là tạo một tệp tin mới trong thư mục `~/project`.

### Nhiệm vụ

- Tạo một tệp có tên chính xác là `target_file` trong thư mục `~/project`.

### Yêu cầu

- Bạn có thể sử dụng câu lệnh `touch` để tạo tệp.
- Đảm bảo bạn đang đứng ở đúng thư mục `/home/labex/project` hoặc chỉ định đường dẫn tuyệt đối đầy đủ."""
    },
    "source-270254-section-2": {
        "title_vi": "Thay Đổi Quyền Sở Hữu Tệp",
        "task_vi": "Chuyển chủ sở hữu thành root và nhóm thành sudo cho target_file.",
        "hint_vi": "Sử dụng sudo chown root:sudo target_file.",
        "content_vi": """Trong bước này, bạn sẽ sửa đổi quyền sở hữu của tệp `target_file` vừa tạo.

### Nhiệm vụ

- Thay đổi người sở hữu (owner) của `target_file` thành người dùng `root`.
- Thay đổi nhóm sở hữu (group) của `target_file` thành nhóm `sudo`.

### Yêu cầu

- Sử dụng câu lệnh `chown`.
- Hãy nhớ sử dụng `sudo` vì việc chuyển quyền sở hữu sang tài khoản `root` đòi hỏi đặc quyền quản trị viên."""
    },
    "source-270254-section-3": {
        "title_vi": "Thiết Lập Quyền Truy Cập Tệp",
        "task_vi": "Đặt quyền của target_file thành 644 (hoặc rw-r--r--).",
        "hint_vi": "Chạy sudo chmod 644 target_file.",
        "content_vi": """Trong bước cuối cùng này, bạn sẽ điều chỉnh quyền truy cập của `target_file`.

### Nhiệm vụ

- Đặt quyền của `target_file` thành `644` (tức là `-rw-r--r--`).

### Yêu cầu

- Sử dụng câu lệnh `chmod`.
- Chủ sở hữu có quyền đọc và ghi (`rw-`), nhóm và những người khác chỉ có quyền đọc (`r--`)."""
    },
    "source-270254-section-4": {
        "title_vi": "Tổng kết thử thách",
        "content_vi": """Chúc mừng bạn đã hoàn thành xuất sắc thử thách phân quyền tệp tin!

Bạn đã chứng minh khả năng thực hành độc lập:
1. Tạo tệp tin chỉ định trong thư mục làm việc.
2. Dùng `sudo chown` để phân chia chủ sở hữu và nhóm sở hữu.
3. Dùng `sudo chmod` để thiết lập quyền truy cập chuẩn xác."""
    }
}

# Lab 9: linux-user-account-management
LAB9_TRANSLATIONS = {
    "source-49-section-0": {
        "title_vi": "Giới thiệu",
        "content_vi": """Bài thực hành này sẽ hướng dẫn bạn các thao tác quản lý tài khoản người dùng cơ bản trong hệ thống Linux. Bạn sẽ học cách tạo mới, sửa đổi, khóa và xóa tài khoản người dùng, cũng như quản lý mật khẩu và quyền thành viên nhóm.

Quản lý tài khoản người dùng là kỹ năng nền tảng và cốt lõi nhất của mọi quản trị viên hệ thống Linux (Sysadmin)."""
    },
    "source-49-section-1": {
        "title_vi": "Tạo Người Dùng Mới (useradd)",
        "task_vi": "Chạy sudo useradd joker và kiểm tra tài khoản bằng id joker.",
        "hint_vi": "Dùng sudo useradd joker rồi kiểm tra id joker.",
        "content_vi": """Hãy bắt đầu bằng việc tạo một tài khoản người dùng mới có tên là "joker".

Trong Linux, lệnh `useradd` (hoặc `adduser`) được sử dụng để tạo người dùng mới. Vì đây là thao tác quản trị hệ thống, bạn cần sử dụng quyền `sudo`.

1. Chạy câu lệnh sau trong terminal:
```bash
sudo useradd joker
```

2. Xác minh rằng tài khoản người dùng đã được tạo thành công:
```bash
id joker
```

Kết quả sẽ hiển thị mã định danh người dùng (UID), mã nhóm chính (GID) và các nhóm mà `joker` trực thuộc:
```plaintext
uid=1001(joker) gid=1001(joker) groups=1001(joker)
```

Theo mặc định, lệnh `useradd` tạo một nhóm riêng có cùng tên với người dùng và gán người dùng đó vào nhóm."""
    },
    "source-49-section-2": {
        "title_vi": "Tạo Người Dùng Kèm Thư Mục Cá Nhân (-m)",
        "task_vi": "Chạy sudo useradd -m bob để tạo người dùng bob kèm thư mục home.",
        "hint_vi": "Dùng sudo useradd -m bob rồi ls -ld /home/bob.",
        "content_vi": """Bây giờ, chúng ta hãy tạo một người dùng khác có tên là "bob" và tự động cấp cho người này một thư mục cá nhân (home directory).

Theo mặc định trên một số bản phân phối Linux, lệnh `useradd` đơn thuần có thể không tự động tạo thư mục `/home/username`. Tùy chọn `-m` sẽ yêu cầu hệ thống tạo thư mục này.

1. Chạy câu lệnh sau:
```bash
sudo useradd -m bob
```

2. Xác minh thư mục cá nhân của bob đã được tạo:
```bash
ls -ld /home/bob
```

Bạn sẽ thấy thư mục `/home/bob` được tạo ra với quyền sở hữu thuộc về người dùng `bob`."""
    },
    "source-49-section-3": {
        "title_vi": "Thiết Lập Mật Khẩu Cho Người Dùng (passwd)",
        "task_vi": "Thiết lập mật khẩu cho tài khoản joker bằng sudo passwd joker.",
        "hint_vi": "Chạy sudo passwd joker và nhập mật khẩu mới.",
        "content_vi": """Khi tài khoản người dùng mới được tạo, tài khoản đó chưa có mật khẩu và thường bị khóa đăng nhập. Chúng ta cần thiết lập mật khẩu bằng lệnh `passwd`.

1. Chạy lệnh đổi mật khẩu cho `joker`:
```bash
sudo passwd joker
```

2. Terminal sẽ yêu cầu bạn nhập mật khẩu mới hai lần:
```plaintext
New password:
Retype new password:
passwd: password updated successfully
```

> **Lưu ý bảo mật trong Linux**: Khi bạn gõ mật khẩu trong terminal, màn hình sẽ **không hiển thị bất kỳ ký tự nào** (kể cả dấu sao `*`). Đây là tính năng bảo mật chuẩn của Linux để ngăn người khác nhìn thấy độ dài mật khẩu của bạn. Hãy cứ gõ bình thường và nhấn Enter!"""
    },
    "source-49-section-4": {
        "title_vi": "Sửa Đổi Thuộc Tính Người Dùng (usermod)",
        "task_vi": "Thay đổi thư mục cá nhân của joker thành /home/joker_home bằng sudo usermod -d -m.",
        "hint_vi": "Chạy sudo usermod -d /home/joker_home -m joker.",
        "content_vi": """Linux cho phép chúng ta thay đổi các thiết lập khác nhau của tài khoản sau khi đã tạo thông qua lệnh `usermod` (user modify).

Hãy thay đổi thư mục cá nhân của `joker` thành `/home/joker_home`:

1. Chạy câu lệnh `usermod` với cờ `-d` (đường dẫn mới) và `-m` (di chuyển dữ liệu hiện có):
```bash
sudo usermod -d /home/joker_home -m joker
```

2. Xác minh thay đổi trong tệp cấu hình người dùng `/etc/passwd`:
```bash
grep joker /etc/passwd
```

Kết quả sẽ phản ánh đường dẫn thư mục mới:
```plaintext
joker:x:1001:1001::/home/joker_home:/bin/sh
```"""
    },
    "source-49-section-5": {
        "title_vi": "Thay Đổi Shell Mặc Định Của Người Dùng (-s)",
        "task_vi": "Đổi shell mặc định của joker thành /bin/bash bằng sudo usermod -s /bin/bash joker.",
        "hint_vi": "Dùng sudo usermod -s /bin/bash joker.",
        "content_vi": """Một thiết lập quan trọng khác là shell mặc định của người dùng. Shell là chương trình thông dịch các câu lệnh mà người dùng gõ vào terminal.

1. Hãy đổi shell của `joker` thành `/bin/bash`:
```bash
sudo usermod -s /bin/bash joker
```

2. Kiểm tra lại thông tin trong `/etc/passwd`:
```bash
grep joker /etc/passwd
```

Bạn sẽ thấy trường cuối cùng đã chuyển thành `/bin/bash`:
```plaintext
joker:x:1001:1001::/home/joker_home:/bin/bash
```"""
    },
    "source-49-section-6": {
        "title_vi": "Thêm Người Dùng Vào Nhóm (usermod -aG)",
        "task_vi": "Thêm joker vào nhóm sudo bằng sudo usermod -aG sudo joker.",
        "hint_vi": "Sử dụng sudo usermod -aG sudo joker rồi kiểm tra bằng groups joker.",
        "content_vi": """Trong Linux, nhóm (Group) dùng để gom nhóm các tài khoản và phân quyền chung. Một nhóm đặc biệt quan trọng là nhóm `sudo`, cấp quyền quản trị viên cho các thành viên.

Để thêm người dùng vào nhóm phụ mà không làm mất các nhóm hiện có, chúng ta **luôn luôn kết hợp hai cờ**:
- `-a` (append): Thêm vào.
- `-G` (supplementary group): Chỉ định nhóm phụ.

1. Thêm `joker` vào nhóm `sudo`:
```bash
sudo usermod -aG sudo joker
```

2. Xác minh các nhóm của `joker`:
```bash
groups joker
```

Kết quả sẽ hiển thị `joker` đã là thành viên của nhóm `sudo`:
```plaintext
joker : joker sudo
```

> ⚠️ **Cảnh báo cực kỳ quan trọng**: Nếu bạn quên cờ `-a` mà chỉ dùng `usermod -G group user`, người dùng sẽ bị **xóa khỏi toàn bộ các nhóm phụ khác**! Hãy luôn nhớ `-aG`."""
    },
    "source-49-section-7": {
        "title_vi": "Khóa và Mở Khóa Tài Khoản (usermod -L / -U)",
        "task_vi": "Khóa tài khoản joker bằng sudo usermod -L joker rồi mở lại bằng sudo usermod -U joker.",
        "hint_vi": "Dùng sudo usermod -L joker rồi sudo usermod -U joker.",
        "content_vi": """Đôi khi bạn cần tạm thời vô hiệu hóa quyền truy cập của một tài khoản mà không muốn xóa dữ liệu của họ (ví dụ khi nhân viên nghỉ phép hoặc nghi vấn bảo mật).

1. Khóa tài khoản `joker`:
```bash
sudo usermod -L joker
```
Cờ `-L` (Lock) sẽ thêm dấu chấm than `!` vào trước chuỗi mật khẩu trong tệp `/etc/shadow`, khiến không mật khẩu nào có thể khớp để đăng nhập.

2. Xác minh trạng thái bị khóa:
```bash
sudo grep joker /etc/shadow
```

3. Mở khóa tài khoản `joker` trở lại:
```bash
sudo usermod -U joker
```
Cờ `-U` (Unlock) sẽ gỡ bỏ dấu chấm than, khôi phục lại mật khẩu ban đầu."""
    },
    "source-49-section-8": {
        "title_vi": "Xóa Tài Khoản Người Dùng (userdel -r)",
        "task_vi": "Xóa tài khoản bob và thư mục cá nhân bằng sudo userdel -r bob.",
        "hint_vi": "Dùng sudo userdel -r bob rồi kiểm tra id bob.",
        "content_vi": """Khi một tài khoản không còn cần thiết, chúng ta sử dụng câu lệnh `userdel` để xóa bỏ khỏi hệ thống.

1. Xóa người dùng `bob` cùng toàn bộ thư mục cá nhân và hộp thư của họ bằng cờ `-r` (remove home):
```bash
sudo userdel -r bob
```

2. Xác minh người dùng `bob` đã bị xóa:
```bash
id bob
```
Hệ thống sẽ trả về: `id: ‘bob’: no such user`.

3. Xác minh thư mục `/home/bob` cũng đã được dọn sạch:
```bash
ls /home/bob
```
Hệ thống sẽ báo `No such file or directory`."""
    },
    "source-49-section-9": {
        "title_vi": "Tổng kết bài học",
        "content_vi": """Xin chúc mừng! Bạn đã hoàn thành toàn diện bài thực hành **Linux User Account Management**.

Bạn đã thành thạo trọn bộ kỹ năng quản trị người dùng Linux:
1. `useradd` & `useradd -m`: Tạo người dùng kèm thư mục cá nhân.
2. `passwd`: Thiết lập và quản lý mật khẩu bảo mật.
3. `usermod -d -m`: Thay đổi và di chuyển thư mục cá nhân.
4. `usermod -s`: Đổi shell mặc định (`/bin/bash`).
5. `usermod -aG`: Phân quyền thêm người dùng vào nhóm (nhóm `sudo`).
6. `usermod -L` & `-U`: Khóa và mở khóa tài khoản tức thì.
7. `userdel -r`: Xóa sạch tài khoản và thư mục dữ liệu."""
    }
}

# Lab 10: linux-the-jokers-trick
LAB10_TRANSLATIONS = {
    "source-270247-section-0": {
        "title_vi": "Giới thiệu",
        "content_vi": """Trong thử thách này, bạn sẽ vận dụng toàn bộ kiến thức về quản lý tài khoản người dùng Linux để giải quyết một tình huống thực tế.

Bạn sẽ tạo tài khoản người dùng theo yêu cầu kỹ thuật chi tiết, thiết lập mật khẩu, chỉnh sửa thông tin người dùng và dọn dẹp hệ thống một cách an toàn."""
    },
    "source-270247-section-1": {
        "title_vi": "Tạo Các Tài Khoản Người Dùng",
        "task_vi": "Tạo tài khoản joker và tài khoản batman có thư mục home.",
        "hint_vi": "Dùng sudo useradd joker và sudo useradd -m batman.",
        "content_vi": """Trong bước này, bạn sẽ tạo các tài khoản người dùng với các đặc tả kỹ thuật khác nhau.

### Nhiệm vụ

1. Tạo một người dùng tên là `joker` không tự động tạo thư mục home.
2. Tạo một người dùng tên là `batman` có tạo thư mục cá nhân `/home/batman`.

### Yêu cầu

- Sử dụng câu lệnh `useradd` kết hợp với `sudo`.
- Dùng cờ `-m` cho người dùng `batman`."""
    },
    "source-270247-section-2": {
        "title_vi": "Quản Lý Mật Khẩu Người Dùng",
        "task_vi": "Đặt mật khẩu cho người dùng joker và batman.",
        "hint_vi": "Chạy sudo passwd joker và sudo passwd batman.",
        "content_vi": """Trong bước này, bạn sẽ kích hoạt tài khoản bằng cách đặt mật khẩu cho các người dùng vừa tạo.

### Nhiệm vụ

1. Đặt mật khẩu cho người dùng `joker`.
2. Đặt mật khẩu cho người dùng `batman`.

### Yêu cầu

- Sử dụng câu lệnh `passwd` với quyền `sudo`."""
    },
    "source-270247-section-3": {
        "title_vi": "Sửa Đổi Thuộc Tính Tài Khoản",
        "task_vi": "Đổi shell của joker thành /bin/bash và thêm batman vào nhóm sudo.",
        "hint_vi": "Sử dụng sudo usermod -s /bin/bash joker và sudo usermod -aG sudo batman.",
        "content_vi": """Trong bước này, bạn sẽ chỉnh sửa thuộc tính của các tài khoản hiện có.

### Nhiệm vụ

1. Thay đổi shell đăng nhập mặc định của `joker` thành `/bin/bash`.
2. Thêm người dùng `batman` vào nhóm quản trị `sudo`.

### Yêu cầu

- Sử dụng câu lệnh `usermod` kèm quyền `sudo`.
- Dùng cờ `-s` để đổi shell và `-aG` để thêm nhóm."""
    },
    "source-270247-section-4": {
        "title_vi": "Xóa Tài Khoản Người Dùng",
        "task_vi": "Xóa tài khoản joker và xóa batman kèm thư mục home.",
        "hint_vi": "Dùng sudo userdel joker và sudo userdel -r batman.",
        "content_vi": """Trong bước kết thúc này, bạn sẽ dọn dẹp các tài khoản theo yêu cầu.

### Nhiệm vụ

1. Xóa người dùng `joker` khỏi hệ thống.
2. Xóa người dùng `batman` cùng toàn bộ thư mục cá nhân của họ.

### Yêu cầu

- Sử dụng câu lệnh `userdel` kèm quyền `sudo`.
- Đảm bảo dùng cờ `-r` khi xóa `batman` để dọn sạch thư mục cá nhân."""
    },
    "source-270247-section-5": {
        "title_vi": "Tổng kết thử thách",
        "content_vi": """Xin chúc mừng! Bạn đã hoàn thành trọn vẹn thử thách **"Joker's Trick"** về quản trị tài khoản người dùng Linux.

Bạn đã chứng minh khả năng:
- Tạo tài khoản với các tùy chọn thư mục khác nhau.
- Quản lý mật khẩu và kích hoạt tài khoản.
- Tùy biến shell và phân quyền nhóm `sudo`.
- Xóa bỏ tài khoản và dọn dẹp dữ liệu an toàn."""
    }
}

def apply_all():
    mappings = [
        ("linux-the-manuscript-mystery.json", LAB6_TRANSLATIONS, "Bản Thảo Bí Ẩn (The Manuscript Mystery)"),
        ("linux-permissions-of-files.json", LAB7_TRANSLATIONS, "Quyền Truy Cập Tệp Tin (Permissions of Files)"),
        ("shell-change-file-ownership.json", LAB8_TRANSLATIONS, "Thay Đổi Quyền Sở Hữu Tệp (Change File Ownership)"),
        ("linux-user-account-management.json", LAB9_TRANSLATIONS, "Quản Trị Tài Khoản Người Dùng (User Account Management)"),
        ("linux-the-jokers-trick.json", LAB10_TRANSLATIONS, "Thử Thách Joker (The Joker's Trick)"),
    ]

    for fname, tr_map, vi_title in mappings:
        fpath = LABS_DIR / fname
        if not fpath.exists():
            continue
        data = json.loads(fpath.read_text(encoding="utf8"))
        data["title_vi"] = vi_title
        for sec in data.get("sections", []):
            sec_id = sec.get("id")
            if sec_id in tr_map:
                sec.update(tr_map[sec_id])
        for step in data.get("steps", []):
            step_id = step.get("id")
            if step_id in tr_map:
                tr = tr_map[step_id]
                for k in ("title_vi", "task_vi", "hint_vi", "content_vi"):
                    if k in tr:
                        step[k] = tr[k]
        fpath.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf8")
        print(f"Updated {fname}")

if __name__ == "__main__":
    apply_all()

