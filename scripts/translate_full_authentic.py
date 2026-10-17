"""Full authentic translation script for Quick Start with Linux.
Translates 100% of the authentic English lesson text into comprehensive,
technically accurate Vietnamese, preserving all Markdown structures, commands,
code blocks, options, notes, examples, and sample outputs.
"""
import json
from pathlib import Path

LABS_DIR = Path(__file__).resolve().parents[1] / "server" / "data" / "labs"

# Translation data for Lab 4: linux-files-and-directories
LAB4_TRANSLATIONS = {
    "source-270246-section-0": {
        "title_vi": "Giới thiệu",
        "content_vi": """Trong thử thách này, bạn sẽ thực hành các kỹ năng quản trị tệp tin thiết yếu trong Linux bằng terminal. Bạn sẽ thực hiện các tác vụ phổ biến như sao lưu tệp cấu hình, tổ chức các thư mục dự án và dọn dẹp các tệp cũ.

Để hoàn thành tốt, bạn nên nắm vững các khái niệm cơ bản như:

- **Đường dẫn (Paths)**: Sử dụng ký hiệu `~` để đại diện cho thư mục cá nhân (home directory) của bạn (ví dụ: `~/Desktop`).
- **Thao tác đệ quy (Recursive Operations)**: Xử lý các thư mục có chứa các tệp và thư mục con bên trong.

Bạn sẽ làm việc với các câu lệnh sau để quản lý dữ liệu một cách hiệu quả:

### Kỹ năng đạt được

Sau khi hoàn thành thử thách này, bạn sẽ làm chủ các câu lệnh:

- `cp` - dùng để sao chép tệp và thư mục.
- `mv` - dùng để di chuyển và đổi tên tệp, thư mục.
- `rm` - dùng để xóa tệp và thư mục."""
    },
    "source-270246-section-1": {
        "title_vi": "Sao Chép Tệp và Thư Mục",
        "task_vi": "Copy ~/.zshrc thành ~/Desktop/zshrc-copy và copy cả thư mục ~/Code vào ~/Desktop.",
        "hint_vi": "Dùng cp ~/.zshrc ~/Desktop/zshrc-copy và cp -r ~/Code ~/Desktop",
        "content_vi": """Bước này tập trung vào việc sử dụng câu lệnh `cp` để sao lưu dữ liệu. Bạn sẽ sao chép một tệp cấu hình và một thư mục vào thư mục Desktop của bạn.

### Thuật ngữ then chốt:

- `~`: Đại diện cho thư mục cá nhân (home directory) của bạn.
- `~/.zshrc`: Một tệp cấu hình ẩn nằm trong thư mục cá nhân của bạn.
- `~/Code`: Thư mục chứa mã nguồn dự án.

Mục tiêu của bạn là nhân bản các mục này vào `~/Desktop`.

### Nhiệm vụ

1. Sao chép tệp `~/.zshrc` vào `~/Desktop/zshrc-copy`.
2. Sao chép toàn bộ thư mục `~/Code` vào `~/Desktop`.

### Yêu cầu

- Sử dụng câu lệnh `cp` để hoàn thành cả hai nhiệm vụ.
- Tùy chọn `-r` (recursive - đệ quy) là **bắt buộc** khi sao chép thư mục để đảm bảo toàn bộ nội dung bên trong thư mục được sao chép đầy đủ.

### Ví dụ minh họa

Sau khi thực thi thành công các tác vụ này, bạn sẽ thấy một tệp mới tên là `zshrc-copy` và một thư mục tên là `Code` xuất hiện trên Desktop của bạn. Bạn có thể dễ dàng xác minh thao tác sao chép thành công bằng cách liệt kê nội dung của Desktop bằng lệnh sau:

```bash
ls -l ~/Desktop
```

Kết quả mẫu kỳ vọng (Sample Output):

```plaintext
drwxr-xr-x 2 labex labex    6 Jan 19 09:25 Code
-rwxr-xr-x 1 labex labex  636 Jan 15 10:47 code.desktop
-rwxr-xr-x 1 labex labex  749 Jan 15 10:47 gedit.desktop
-rwxr-xr-x 1 labex labex 5106 Jan 15 10:47 gvim.desktop
-rwxr-xr-x 1 labex labex 8499 Jan 15 10:47 xfce4-terminal.desktop
-rw-r--r-- 1 labex labex 4752 Jan 19 09:25 zshrc-copy
```"""
    },
    "source-270246-section-2": {
        "title_vi": "Đổi Tên Tệp và Thư Mục",
        "task_vi": "Đổi tên ~/Desktop/zshrc-copy thành zshrc-move và ~/Desktop/Code thành Code-move.",
        "hint_vi": "Sử dụng lệnh mv để đổi tên cả tệp và thư mục trên Desktop.",
        "content_vi": """Sau khi đã nắm vững kỹ năng sao chép, kỹ năng quan trọng tiếp theo là đổi tên tệp và thư mục. Trong bước này, bạn sẽ sử dụng câu lệnh `mv`, một công cụ đa năng phục vụ hai mục đích: vừa di chuyển tệp/thư mục, vừa dùng để đổi tên chúng. Chúng ta sẽ làm việc với các bản sao bạn vừa tạo ở bước trước.

### Nhiệm vụ

1. Đổi tên tệp `~/Desktop/zshrc-copy` thành `~/Desktop/zshrc-move`.
2. Đổi tên thư mục `~/Desktop/Code` thành `~/Desktop/Code-move`.

### Yêu cầu

- Sử dụng duy nhất câu lệnh `mv` cho cả hai thao tác đổi tên.
- Hãy nhớ rằng bản chất của việc đổi tên bằng lệnh `mv` chính là di chuyển một mục đến cùng vị trí nhưng với một tên gọi mới.

### Ví dụ minh họa

Sau khi hoàn thành các tác vụ đổi tên này, Desktop của bạn sẽ hiển thị `zshrc-move` và `Code-move` thay vì tên cũ. Hãy xác minh các thay đổi bằng cách liệt kê lại nội dung của Desktop:

```bash
ls -l ~/Desktop
```

Kết quả mẫu kỳ vọng (Sample Output):

```plaintext
drwxr-xr-x 2 labex labex    6 Jan 19 09:25 Code-move
-rwxr-xr-x 1 labex labex  636 Jan 15 10:47 code.desktop
-rwxr-xr-x 1 labex labex  749 Jan 15 10:47 gedit.desktop
-rwxr-xr-x 1 labex labex 5106 Jan 15 10:47 gvim.desktop
-rwxr-xr-x 1 labex labex 8499 Jan 15 10:47 xfce4-terminal.desktop
-rw-r--r-- 1 labex labex 4752 Jan 19 09:25 zshrc-move
```"""
    },
    "source-270246-section-3": {
        "title_vi": "Xóa Tệp và Thư Mục",
        "task_vi": "Xóa ~/Desktop/zshrc-move và ~/Desktop/Code-move bằng lệnh rm.",
        "hint_vi": "Dùng rm ~/Desktop/zshrc-move và rm -r ~/Desktop/Code-move.",
        "content_vi": """Sau khi học cách sao chép và đổi tên, kỹ năng quản lý tệp cốt lõi cuối cùng là xóa bỏ dữ liệu. Bước này tập trung vào câu lệnh `rm`, được dùng để xóa tệp và thư mục. Bạn cần hết sức cẩn trọng khi dùng `rm`, vì các mục bị xóa thường sẽ mất vĩnh viễn khỏi hệ thống tệp mà không thể hoàn tác. Trong bước này, bạn sẽ dọn dẹp các tệp và thư mục mà bạn đã làm việc trên Desktop.

### Nhiệm vụ

1. Xóa tệp `~/Desktop/zshrc-move`.
2. Xóa thư mục `~/Desktop/Code-move`.

### Yêu cầu

- Sử dụng câu lệnh `rm` để xóa cả tệp và thư mục.
- Hãy đặc biệt cẩn trọng khi sử dụng `rm` với thư mục. Bạn cần sử dụng tùy chọn `-r` hoặc `-R` để xóa đệ quy thư mục cùng toàn bộ nội dung bên trong nó.
- **Lưu ý quan trọng**: Giữ nguyên vẹn các tệp và thư mục gốc ban đầu tại `~/.zshrc` và `~/Code`.

### Ví dụ minh họa

Sau khi xóa thành công các mục này, cả `zshrc-move` lẫn `Code-move` đều không còn xuất hiện trên Desktop của bạn nữa. Xác minh việc xóa bằng cách kiểm tra nội dung Desktop lần cuối:

```bash
ls -l ~/Desktop
```

Kết quả mẫu kỳ vọng (Sample Output):

```plaintext
-rwxr-xr-x 1 labex labex  636 Jan 15 10:47 code.desktop
-rwxr-xr-x 1 labex labex  749 Jan 15 10:47 gedit.desktop
-rwxr-xr-x 1 labex labex 5106 Jan 15 10:47 gvim.desktop
-rwxr-xr-x 1 labex labex 8499 Jan 15 10:47 xfce4-terminal.desktop
```"""
    },
    "source-270246-section-4": {
        "title_vi": "Tổng kết thử thách",
        "content_vi": """Xin chúc mừng! Bạn đã hoàn thành xuất sắc thử thách **"Files and Directories"**, đánh dấu một bước tiến quan trọng trong hành trình làm chủ Linux của bạn.

Hiện tại bạn đã trang bị đầy đủ các câu lệnh quản lý tệp tin cốt lõi trong Linux:
- `cp`: Nhân bản tệp và thư mục (dùng cờ `-r` cho thư mục).
- `mv`: Vừa di chuyển vừa đổi tên tệp và thư mục.
- `rm`: Xóa bỏ các mục dữ liệu khi không còn cần thiết.

Những kỹ năng này tạo nên nền tảng vững chắc cho việc điều hướng và quản lý hệ thống tệp hiệu quả trong môi trường Linux. Việc thực hành thường xuyên sẽ giúp bạn củng cố kiến thức và nâng cao độ thuần thục với dòng lệnh Linux!"""
    }
}

# Translation data for Lab 5: linux-file-contents-and-comparing
LAB5_TRANSLATIONS = {
    "source-270251-section-0": {
        "title_vi": "Giới thiệu",
        "content_vi": """Chào mừng bạn đến với bài thực hành về làm việc với nội dung tệp tin trong Linux! Nếu bạn là người mới làm quen với Linux, đừng lo lắng. Chúng tôi sẽ hướng dẫn bạn từng bước một.

Trong bài thực hành này, bạn sẽ học cách xem nội dung của các tệp văn bản và so sánh hai tệp để tìm sự khác biệt. Đây là một kỹ năng thiết yếu đối với bất kỳ ai làm việc với Linux."""
    },
    "source-270251-section-1": {
        "title_vi": "In Nội Dung Tệp Ra Màn Hình",
        "task_vi": "Chạy lệnh cat /etc/passwd trong terminal.",
        "hint_vi": "Sử dụng lệnh cat /etc/passwd.",
        "content_vi": """Trước tiên, hãy đảm bảo bạn đang mở cửa sổ **Terminal**.

Chúng ta sẽ bắt đầu với lệnh `cat`. Lệnh này viết tắt của "concatenate" (nối ghép), nhưng thường được dùng phổ biến nhất để hiển thị toàn bộ nội dung của một tệp ra màn hình terminal.

1. Trong terminal, hãy gõ câu lệnh sau và nhấn **Enter**:

```bash
cat /etc/passwd
```

Lệnh này đọc tệp `/etc/passwd` và in toàn bộ nội dung của nó ra màn hình terminal của bạn. Tệp `/etc/passwd` là một tệp hệ thống quan trọng chứa thông tin về các tài khoản người dùng trên hệ thống Linux.

Bạn sẽ thấy rất nhiều dòng văn bản cuộn qua. Mỗi dòng biểu thị một tài khoản người dùng trên hệ thống, kèm theo các thông tin như tên đăng nhập, mã định danh người dùng (UID), thư mục cá nhân và shell mặc định."""
    },
    "source-270251-section-2": {
        "title_vi": "Hiển Thị Nội Dung Tệp Kèm Số Dòng",
        "task_vi": "Chạy lệnh cat -n /etc/passwd trong terminal.",
        "hint_vi": "Thêm cờ -n vào câu lệnh cat: cat -n /etc/passwd.",
        "content_vi": """Bây giờ, chúng ta sẽ sử dụng lại câu lệnh `cat`, nhưng lần này chúng ta sẽ thêm số thứ tự dòng vào kết quả đầu ra.

1. Trong terminal, hãy gõ câu lệnh sau và nhấn **Enter**:

```bash
cat -n /etc/passwd
```

Tùy chọn `-n` yêu cầu lệnh `cat` đánh số thứ tự cho tất cả các dòng đầu ra, bắt đầu từ dòng số 1.

Điều này rất hữu ích khi bạn muốn tham chiếu đến các dòng cụ thể trong một tệp, chẳng hạn như khi gỡ lỗi mã nguồn (debugging) hoặc kiểm tra các tệp cấu hình dài."""
    },
    "source-270251-section-3": {
        "title_vi": "In Các Dòng Đầu Tiên Của Tệp",
        "task_vi": "Chạy lệnh head -n 5 /etc/passwd trong terminal.",
        "hint_vi": "Sử dụng lệnh head -n 5 /etc/passwd.",
        "content_vi": """Tiếp theo, chúng ta sẽ sử dụng câu lệnh `head`. Đúng như tên gọi của nó, `head` (đầu) được sử dụng để xem phần đầu của một tệp. Theo mặc định, nó hiển thị 10 dòng đầu tiên, nhưng bạn có thể chỉ định số dòng bạn muốn xem.

1. Trong terminal, hãy gõ câu lệnh sau và nhấn **Enter**:

```bash
head -n 5 /etc/passwd
```

Tùy chọn `-n 5` yêu cầu lệnh `head` chỉ in ra 5 dòng đầu tiên của tệp `/etc/passwd`.

Lệnh này đặc biệt tiện lợi khi bạn chỉ muốn xem qua định dạng hoặc phần mở đầu của một tệp tin lớn mà không muốn in toàn bộ nội dung làm tràn màn hình terminal."""
    },
    "source-270251-section-4": {
        "title_vi": "Xem Số Byte Đầu Tiên Của Tệp",
        "task_vi": "Chạy lệnh head -c 20 /etc/passwd trong terminal.",
        "hint_vi": "Sử dụng tùy chọn -c: head -c 20 /etc/passwd.",
        "content_vi": """Bây giờ chúng ta sẽ tiếp tục sử dụng lệnh `head`, nhưng lần này để xem một số lượng byte cụ thể tính từ đầu tệp thay vì xem theo dòng.

1. Trong terminal, hãy gõ câu lệnh sau và nhấn **Enter**:

```bash
head -c 20 /etc/passwd
```

Tùy chọn `-c 20` yêu cầu lệnh `head` chỉ hiển thị 20 byte (ký tự) đầu tiên của tệp `/etc/passwd`.

Lệnh này rất hữu ích khi bạn làm việc với các tệp nhị phân hoặc khi bạn chỉ cần kiểm tra vài ký tự đầu tiên của một tệp (chẳng hạn như kiểm tra magic number hoặc phần tiêu đề tệp)."""
    },
    "source-270251-section-5": {
        "title_vi": "In Các Dòng Cuối Cùng Của Tệp",
        "task_vi": "Chạy lệnh tail -n 5 /etc/passwd trong terminal.",
        "hint_vi": "Sử dụng lệnh tail -n 5 /etc/passwd.",
        "content_vi": """Bây giờ hãy chuyển sang câu lệnh `tail`. Như bạn có thể đoán, `tail` (đuôi) là câu lệnh đối lập với `head` - nó hiển thị phần kết thúc của một tệp. Giống như `head`, theo mặc định nó hiển thị 10 dòng cuối cùng, nhưng bạn có thể thay đổi số lượng dòng theo ý muốn.

1. Trong terminal, hãy gõ câu lệnh sau và nhấn **Enter**:

```bash
tail -n 5 /etc/passwd
```

Tùy chọn `-n 5` yêu cầu lệnh `tail` in ra 5 dòng cuối cùng của tệp `/etc/passwd`.

Lệnh `tail` cực kỳ hữu ích để kiểm tra các mục mới nhất được ghi vào tệp nhật ký hệ thống (log files)."""
    },
    "source-270251-section-6": {
        "title_vi": "Xem Số Byte Cuối Cùng Của Tệp",
        "task_vi": "Chạy lệnh tail -c 20 /etc/passwd trong terminal.",
        "hint_vi": "Sử dụng tùy chọn -c: tail -c 20 /etc/passwd.",
        "content_vi": """Tương tự như những gì chúng ta đã làm với lệnh `head`, chúng ta có thể sử dụng `tail` để hiển thị một số lượng byte cụ thể tính từ cuối tệp.

1. Trong terminal, hãy gõ câu lệnh sau và nhấn **Enter**:

```bash
tail -c 20 /etc/passwd
```

Tùy chọn `-c 20` yêu cầu lệnh `tail` hiển thị 20 byte cuối cùng của tệp `/etc/passwd`.

Lưu ý rằng đầu ra có thể không bắt đầu ở đầu một dòng, vì nó cắt chính xác 20 byte cuối cùng của tệp bất kể vị trí ngắt dòng nằm ở đâu."""
    },
    "source-270251-section-7": {
        "title_vi": "So Sánh Hai Tệp Tin",
        "task_vi": "Tạo hai tệp file1, file2 và so sánh chúng bằng lệnh diff -u file1 file2.",
        "hint_vi": "Tạo tệp theo hướng dẫn rồi chạy lệnh diff -u file1 file2.",
        "content_vi": """Bây giờ chúng ta sẽ học cách sử dụng câu lệnh `diff` để so sánh hai tệp tin và tìm ra sự khác biệt giữa chúng.

Trước tiên, hãy tạo hai tệp văn bản đơn giản để thực hành so sánh:

1. Tạo tệp thứ nhất tên là `file1`:
```bash
echo -e "apple\\nbanana\\ncherry" > file1
```

2. Tạo tệp thứ hai tên là `file2` với nội dung hơi khác một chút:
```bash
echo -e "apple\\nblueberry\\ncherry" > file2
```

3. Bây giờ, hãy so sánh hai tệp này:
```bash
diff -u file1 file2
```

Tùy chọn `-u` tạo ra định dạng so sánh hợp nhất (unified output), đây là định dạng chuẩn được sử dụng rộng rãi nhất trong các công cụ quản lý mã nguồn như Git.

Hãy phân tích kết quả đầu ra:
- `--- file1`: Cho biết tệp gốc đầu tiên.
- `+++ file2`: Cho biết tệp mới được so sánh.
- `-banana`: Dấu trừ màu đỏ biểu thị dòng đã bị xóa hoặc thay đổi từ `file1`.
- `+blueberry`: Dấu cộng màu xanh biểu thị dòng đã được thêm vào trong `file2`."""
    },
    "source-270251-section-8": {
        "title_vi": "So Sánh Hai Thư Mục",
        "task_vi": "Tạo hai thư mục dir1, dir2 và so sánh chúng bằng diff -r dir1 dir2.",
        "hint_vi": "Tạo các thư mục mẫu rồi chạy diff -r dir1 dir2.",
        "content_vi": """Cuối cùng, chúng ta hãy sử dụng câu lệnh `diff` để so sánh toàn bộ hai thư mục với nhau.

1. Tạo hai thư mục mẫu và các tệp bên trong:
```bash
mkdir dir1 dir2
echo "hello" > dir1/file1
echo "world" > dir1/file2
echo "hello" > dir2/file1
echo "everyone" > dir2/file2
```

2. So sánh hai thư mục bằng cờ đệ quy `-r`:
```bash
diff -r dir1 dir2
```

Tùy chọn `-r` (recursive) yêu cầu `diff` đi vào từng thư mục con và so sánh từng cặp tệp tương ứng.

Kết quả sẽ chỉ ra chính xác tệp nào có nội dung giống nhau và tệp nào (`file2`) có sự khác biệt giữa hai thư mục."""
    },
    "source-270251-section-9": {
        "title_vi": "Tổng kết bài học",
        "content_vi": """Xin chúc mừng! Bạn đã hoàn thành xuất sắc bài thực hành **File Contents and Comparing**.

Hãy cùng điểm lại những kỹ năng quan trọng bạn đã học được:
1. `cat`: Xem toàn bộ nội dung tệp tin.
2. `cat -n`: Xem nội dung tệp kèm số thứ tự dòng.
3. `head`: Xem các dòng đầu tiên của tệp.
4. `head -c`: Xem một số lượng byte cụ thể từ đầu tệp.
5. `tail`: Xem các dòng cuối cùng của tệp (rất hữu ích cho file log).
6. `tail -c`: Xem số byte cuối cùng của tệp.
7. `diff -u`: So sánh sự khác biệt giữa hai tệp văn bản.
8. `diff -r`: So sánh toàn bộ cấu trúc và nội dung của hai thư mục.

Đây là bộ công cụ thiết yếu hàng ngày của bất kỳ quản trị viên Linux hoặc kỹ sư phần mềm nào!"""
    }
}

def apply_translations():
    # Update Lab 4
    lab4_file = LABS_DIR / "linux-files-and-directories.json"
    if lab4_file.exists():
        data = json.loads(lab4_file.read_text(encoding="utf8"))
        data["title_vi"] = "Tệp và Thư Mục (Files and Directories)"
        data["overview_vi"] = "Thực hành sao chép cấu hình ~/.zshrc và thư mục ~/Code vào Desktop, đổi tên và dọn dẹp an toàn bằng cp, mv, rm."
        for sec in data.get("sections", []):
            sec_id = sec.get("id")
            if sec_id in LAB4_TRANSLATIONS:
                sec.update(LAB4_TRANSLATIONS[sec_id])
        for step in data.get("steps", []):
            step_id = step.get("id")
            if step_id in LAB4_TRANSLATIONS:
                tr = LAB4_TRANSLATIONS[step_id]
                for k in ("title_vi", "task_vi", "hint_vi", "content_vi"):
                    if k in tr:
                        step[k] = tr[k]
        lab4_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf8")
        print("Updated Lab 4: linux-files-and-directories")

    # Update Lab 5
    lab5_file = LABS_DIR / "linux-file-contents-and-comparing.json"
    if lab5_file.exists():
        data = json.loads(lab5_file.read_text(encoding="utf8"))
        data["title_vi"] = "Xem và So Sánh Nội Dung Tệp (File Contents and Comparing)"
        data["overview_vi"] = "Làm chủ các công cụ kiểm tra và so sánh tệp trong Linux: cat, head, tail, và diff."
        for sec in data.get("sections", []):
            sec_id = sec.get("id")
            if sec_id in LAB5_TRANSLATIONS:
                sec.update(LAB5_TRANSLATIONS[sec_id])
        for step in data.get("steps", []):
            step_id = step.get("id")
            if step_id in LAB5_TRANSLATIONS:
                tr = LAB5_TRANSLATIONS[step_id]
                for k in ("title_vi", "task_vi", "hint_vi", "content_vi"):
                    if k in tr:
                        step[k] = tr[k]
        lab5_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf8")
        print("Updated Lab 5: linux-file-contents-and-comparing")

if __name__ == "__main__":
    apply_translations()

