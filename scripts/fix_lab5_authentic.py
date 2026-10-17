"""Fix Lab 5 (linux-file-contents-and-comparing) to match authentic LabEx content 100% exactly."""
import json
from pathlib import Path

LAB_FILE = Path(__file__).resolve().parents[1] / "server" / "data" / "labs" / "linux-file-contents-and-comparing.json"

LAB5_EXACT_TRANSLATION = {
    "source-270251-section-0": {
        "title_vi": "Giới thiệu",
        "content_vi": """Chào mừng bạn đến với bài thực hành về làm việc với các tệp tin trong Linux! Nếu bạn là người mới làm quen với Linux, đừng lo lắng - chúng tôi sẽ hướng dẫn bạn từng bước một.

Trong bài thực hành này, bạn sẽ học cách xem nội dung của các tệp văn bản và so sánh hai tệp để tìm ra sự khác biệt giữa chúng. Đây là kỹ năng thiết yếu đối với bất kỳ ai làm việc với hệ điều hành Linux."""
    },
    "source-270251-section-1": {
        "title_vi": "In Nội Dung Tệp",
        "task_vi": "Chạy lệnh cat /tmp/hello trong terminal.",
        "hint_vi": "Gõ cat /tmp/hello và nhấn Enter.",
        "content_vi": """Trước tiên, hãy mở một cửa sổ terminal trên Desktop **HOẶC** chuyển sang tab terminal trong giao diện bài thực hành.

Sau khi mở terminal, bạn sẽ thấy dấu nhắc lệnh, thường kết thúc bằng ký tự `$`. Đây là nơi chúng ta sẽ nhập các câu lệnh.

Bây giờ, hãy sử dụng câu lệnh `cat` để hiển thị nội dung của một tệp tin:

1. Trong cửa sổ dòng lệnh, nhập lệnh sau và nhấn **Enter**:

```bash
cat /tmp/hello
```

Đây `/tmp/hello` là đường dẫn đến tệp tin mà chúng ta muốn xem. `/tmp` là thư mục trên hệ thống của bạn, và `hello` là tên của tệp tin trong thư mục đó.

2. Sau khi nhấn Enter, bạn sẽ thấy nội dung của tệp tin:

```plaintext
Hi,
I am Labby!
```

Đây là toàn bộ nội dung trong tệp `/tmp/hello`. Lệnh `cat` đã hiển thị nó cho chúng ta trong cửa sổ terminal."""
    },
    "source-270251-section-2": {
        "title_vi": "Hiển Thị Nội Dung Tệp Kèm Số Dòng",
        "task_vi": "Chạy lệnh cat -n /tmp/hello trong terminal.",
        "hint_vi": "Sử dụng tùy chọn -n: cat -n /tmp/hello.",
        "content_vi": """Bây giờ, chúng ta hãy sử dụng lại câu lệnh `cat`, nhưng lần này chúng ta sẽ thêm số thứ tự dòng vào kết quả đầu ra.

1. Trong terminal, nhập lệnh sau và nhấn **Enter**:

```bash
cat -n /tmp/hello
```

Tùy chọn `-n` ở đây được gọi là một cờ (flag) hoặc tùy chọn (option). Nó yêu cầu `cat` đánh số thứ tự cho tất cả các dòng đầu ra.

2. Bây giờ bạn sẽ thấy nội dung của tệp đi kèm với số dòng:

```plaintext
     1  Hi,
     2  I am Labby!
```

Điều này có thể rất hữu ích khi bạn đang làm việc với các tệp dài hơn và cần tham chiếu đến các dòng cụ thể."""
    },
    "source-270251-section-3": {
        "title_vi": "In Các Dòng Đầu Của Tệp",
        "task_vi": "Chạy lệnh head -n1 /tmp/hello trong terminal.",
        "hint_vi": "Dùng head -n1 /tmp/hello hoặc head -n 1 /tmp/hello.",
        "content_vi": """Tiếp theo, chúng ta sẽ sử dụng câu lệnh `head`. Đúng như tên gọi của nó, `head` (đầu) được sử dụng để xem phần đầu hoặc phần mở đầu của một tệp tin.

1. Trong terminal, nhập lệnh sau và nhấn **Enter**:

```bash
head -n1 /tmp/hello
```

Ở đây, `-n1` là một tùy chọn yêu cầu `head` chỉ hiển thị dòng đầu tiên. Số `1` có thể được thay đổi thành bất kỳ số nào để hiển thị số lượng dòng tương ứng.

2. Bạn sẽ thấy kết quả đầu ra như sau:

```plaintext
Hi,
```

Đây chính là dòng đầu tiên của tệp tin. Theo mặc định, nếu không có tùy chọn `-n1`, lệnh `head` sẽ hiển thị 10 dòng đầu tiên của tệp."""
    },
    "source-270251-section-4": {
        "title_vi": "Xem Vài Byte Đầu Tiên Của Tệp",
        "task_vi": "Chạy lệnh head -c1 /tmp/hello trong terminal.",
        "hint_vi": "Dùng head -c1 /tmp/hello hoặc head -c 1 /tmp/hello.",
        "content_vi": """Bây giờ chúng ta sẽ sử dụng lại câu lệnh `head`, nhưng lần này để xem một số lượng byte cụ thể tính từ phần đầu của một tệp tin.

1. Trong terminal, nhập lệnh sau và nhấn **Enter**:

```bash
head -c1 /tmp/hello
```

Tùy chọn `-c1` yêu cầu `head` chỉ hiển thị byte (ký tự) đầu tiên của tệp. Giống như với `-n`, bạn có thể thay đổi số `1` thành bất kỳ số nào để xem số lượng byte tương ứng.

2. Bạn sẽ thấy kết quả đầu ra:

```plaintext
H
```

Đây chính là ký tự đầu tiên của tệp tin. Trong các tệp văn bản thông thường, mỗi ký tự thường chiếm một byte."""
    },
    "source-270251-section-5": {
        "title_vi": "In Các Dòng Cuối Của Tệp",
        "task_vi": "Chạy lệnh tail -n1 /tmp/hello trong terminal.",
        "hint_vi": "Dùng tail -n1 /tmp/hello hoặc tail -n 1 /tmp/hello.",
        "content_vi": """Bây giờ chúng ta hãy chuyển sang câu lệnh `tail`. Như bạn có thể đoán, `tail` (đuôi) là câu lệnh đối lập với `head` - nó hiển thị phần kết thúc của một tệp tin.

1. Trong terminal, nhập lệnh sau và nhấn **Enter**:

```bash
tail -n1 /tmp/hello
```

Tương tự như với `head`, tùy chọn `-n1` yêu cầu `tail` chỉ hiển thị một dòng, trong trường hợp này là dòng cuối cùng của tệp.

2. Bạn sẽ thấy kết quả đầu ra:

```plaintext
I am Labby!
```

Đây là dòng cuối cùng trong tệp của chúng ta. Nếu không có tùy chọn `-n1`, lệnh `tail` theo mặc định sẽ hiển thị 10 dòng cuối cùng."""
    },
    "source-270251-section-6": {
        "title_vi": "Xem Vài Byte Cuối Cùng Của Tệp",
        "task_vi": "Chạy lệnh tail -c1 /tmp/hello rồi tail -c2 /tmp/hello trong terminal.",
        "hint_vi": "Chạy lần lượt tail -c1 /tmp/hello và tail -c2 /tmp/hello.",
        "content_vi": """Tương tự như những gì chúng ta đã làm với lệnh `head`, chúng ta có thể sử dụng `tail` để hiển thị một số lượng byte cụ thể tính từ cuối tệp.

1. Trước hết, hãy thử xem byte cuối cùng. Trong terminal, nhập lệnh sau và nhấn **Enter**:

```bash
tail -c1 /tmp/hello
```

Bạn có thể sẽ không thấy kết quả đầu ra nào hiển thị. Điều này là do ký tự cuối cùng thường là ký tự xuống dòng (newline character `\\n`), vốn là ký tự vô hình.

2. Hãy thử xem hai byte cuối cùng thay thế. Nhập câu lệnh sau và nhấn **Enter**:

```bash
tail -c2 /tmp/hello
```

3. Bây giờ bạn sẽ thấy xuất hiện:

```plaintext
!
```

Tùy chọn `-c2` yêu cầu `tail` hiển thị 2 byte (ký tự) cuối cùng của tệp. Trong trường hợp này, nó hiển thị dấu chấm than, đây là ký tự nhìn thấy được cuối cùng trong tệp của chúng ta."""
    },
    "source-270251-section-7": {
        "title_vi": "So Sánh Hai Tệp Tin (Comparing Files)",
        "task_vi": "Chuyển vào ~/project và chạy lệnh diff file1 file2.",
        "hint_vi": "Chạy cd ~/project rồi diff file1 file2.",
        "content_vi": """Bây giờ chúng ta sẽ học cách sử dụng câu lệnh `diff` để so sánh hai tệp tin và xem sự khác biệt giữa chúng.

1. Trước tiên, hãy đảm bảo chúng ta đang đứng ở đúng thư mục. Nhập câu lệnh sau và nhấn **Enter**:

```bash
cd ~/project
```

Lệnh này chuyển thư mục hiện tại của chúng ta sang thư mục "project" nằm trong thư mục cá nhân. Ký hiệu `~` là lối tắt đại diện cho thư mục cá nhân (home directory).

2. Bây giờ, hãy so sánh hai tệp. Nhập lệnh sau và nhấn **Enter**:

```bash
diff file1 file2
```

Lệnh này yêu cầu `diff` so sánh nội dung của hai tệp `file1` và `file2`.

3. Bạn sẽ thấy kết quả đầu ra tương tự như sau:

```plaintext
1c1
< this is file1
---
> this is file2
```

Hãy cùng phân tích ý nghĩa của kết quả đầu ra này. Lệnh `diff` tạo ra kết quả mô tả những thay đổi cần thiết để làm cho tệp thứ nhất trở nên giống hệt tệp thứ hai. Việc tệp nào được tạo hoặc sửa đổi trước không quan trọng; `diff` chỉ so sánh nội dung của chúng tại thời điểm bạn chạy lệnh:

- `1c1`: Cho biết dòng 1 trong tệp thứ nhất cần được thay đổi (**c**hange) để khớp với dòng 1 trong tệp thứ hai.
- `< this is file1`: Ký hiệu `<` biểu thị một dòng văn bản đến từ tệp thứ nhất (`file1`).
- `---`: Đây là dấu phân cách giữa các dòng của `file1` và `file2`.
- `> this is file2`: Ký hiệu `>` biểu thị một dòng văn bản đến từ tệp thứ hai (`file2`).

Nói một cách đơn giản, `diff` đang chỉ ra cho chúng ta thấy nội dung của dòng 1 là khác nhau giữa hai tệp. Để làm cho `file1` giống `file2`, dòng "this is file1" sẽ cần được thay thế bằng "this is file2"."""
    },
    "source-270251-section-8": {
        "title_vi": "So Sánh Hai Thư Mục (Comparing Directories)",
        "task_vi": "Chạy lệnh diff -r ~/Desktop ~/Code trong terminal.",
        "hint_vi": "Sử dụng lệnh diff -r ~/Desktop ~/Code.",
        "content_vi": """Cuối cùng, chúng ta hãy sử dụng câu lệnh `diff` để so sánh toàn bộ hai thư mục với nhau.

1. Trong terminal, nhập câu lệnh sau và nhấn **Enter**:

```bash
diff -r ~/Desktop ~/Code
```

Tùy chọn `-r` yêu cầu `diff` so sánh đệ quy (recursively) cả các thư mục con bên trong. `~/Desktop` và `~/Code` là đường dẫn đến hai thư mục mà chúng ta đang so sánh.

2. Bạn sẽ thấy kết quả đầu ra tương tự như sau:

```plaintext
Only in /home/labex/Desktop: code.desktop
Only in /home/labex/Desktop: gedit.desktop
Only in /home/labex/Desktop: gvim.desktop
Only in /home/labex/Desktop: xfce4-terminal.desktop
```

Kết quả đầu ra này cho thấy thư mục `Desktop` chứa bốn tệp tin mà không có trong thư mục `Code`."""
    },
    "source-270251-section-9": {
        "title_vi": "Tổng kết bài học",
        "content_vi": """Xin chúc mừng! Bạn đã hoàn thành xuất sắc bài thực hành **File Contents and Comparing**. Hãy cùng điểm lại những gì bạn đã học được:

1. Bạn đã sử dụng `cat` để xem toàn bộ nội dung của một tệp tin.
2. Bạn đã học cách sử dụng `cat -n` để xem nội dung tệp tin đi kèm với số thứ tự dòng.
3. Bạn đã sử dụng `head` để xem phần đầu của tệp, cả theo số dòng lẫn theo số lượng byte.
4. Bạn đã sử dụng `tail` để xem phần cuối của tệp, cả theo số dòng lẫn theo số lượng byte.
5. Bạn đã học cách sử dụng `diff` để so sánh nội dung giữa các tệp tin.
6. Cuối cùng, bạn đã sử dụng `diff -r` để so sánh toàn bộ hai thư mục.

Các câu lệnh này là những công cụ nền tảng thiết yếu trong Linux. Khi tiếp tục làm việc với Linux, bạn sẽ thấy mình sử dụng các câu lệnh này rất thường xuyên để kiểm tra và so sánh các tệp tin cũng như thư mục.

Hãy nhớ rằng, nếu bạn quên cách sử dụng một lệnh nào đó, bạn luôn có thể gõ `man` kèm theo tên lệnh (ví dụ: `man cat`) để xem trang tài liệu hướng dẫn (manual page) của lệnh đó. Điều này sẽ cung cấp cho bạn thông tin chi tiết về tất cả các tùy chọn có sẵn cho từng lệnh.

Hãy tiếp tục thực hành với các câu lệnh này trên các tệp và thư mục khác nhau để ngày càng thành thạo hơn!"""
    }
}

def update_lab5():
    data = json.loads(LAB_FILE.read_text(encoding="utf8"))
    data["title_vi"] = "Xem và So Sánh Nội Dung Tệp (File Contents and Comparing)"
    data["overview_vi"] = "Xem nội dung tệp theo dòng và byte với cat, head, tail; so sánh tệp và thư mục với diff."

    for sec in data.get("sections", []):
        sid = sec.get("id")
        if sid in LAB5_EXACT_TRANSLATION:
            sec.update(LAB5_EXACT_TRANSLATION[sid])

    for step in data.get("steps", []):
        sid = step.get("id")
        if sid in LAB5_EXACT_TRANSLATION:
            tr = LAB5_EXACT_TRANSLATION[sid]
            for k in ("title_vi", "task_vi", "hint_vi", "content_vi"):
                if k in tr:
                    step[k] = tr[k]

    LAB_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf8")
    print("Successfully updated Lab 5 to 100% exact authentic LabEx match!")

if __name__ == "__main__":
    update_lab5()

