"""Full translation for Lab 1 and complete sections for Lab 7."""
import json
from pathlib import Path

LABS_DIR = Path(__file__).resolve().parents[1] / "server" / "data" / "labs"

LAB1_TRANSLATIONS = {
    "source-270253-section-0": {
        "title_vi": "Giới thiệu",
        "content_vi": """Chào mừng bạn đến với LabEx! Trong bài thực hành này, bạn sẽ bắt đầu những bước đi đầu tiên vào thế giới Linux. Chúng ta sẽ cùng nhau thực hiện chương trình kinh điển \"Hello, World!\" và một số câu lệnh cốt lõi (`echo`, `whoami`, `id`) để tìm hiểu danh tính người dùng trong hệ thống.

Đây là một bài thực hành có hướng dẫn (Guided Lab), cung cấp các chỉ dẫn từng bước chi tiết giúp bạn vừa học vừa thực hành ngay lập tức. Hãy làm theo hướng dẫn cẩn thận để hoàn thành từng bước và tích lũy kinh nghiệm thực tế.

> Nhấn nút **Bắt đầu nhiệm vụ** hoặc chuyển sang tab Terminal để bắt đầu bài lab."""
    },
    "source-270253-section-1": {
        "title_vi": "Hello LabEx",
        "task_vi": "Chạy lệnh echo \"Hello LabEx\" trong terminal.",
        "hint_vi": "Gõ đúng chữ hoa/thường: echo \"Hello LabEx\".",
        "content_vi": """Hãy bắt đầu bằng việc yêu cầu máy tính nói lời chào! 😄

Trước hết là cửa sổ terminal. Hãy coi terminal như trung tâm chỉ huy dựa trên văn bản giúp bạn tương tác trực tiếp với máy tính của mình. Cửa sổ terminal là nơi bạn sẽ gõ các câu lệnh. Đây là một công cụ cực kỳ mạnh mẽ và trong nhiều trường hợp, đó là cách nhanh nhất để hoàn thành công việc trong Linux so với việc dùng chuột.

Bây giờ, hãy làm cho nó nói lời chào! Chúng ta sẽ sử dụng câu lệnh `echo`. Lệnh `echo` đơn giản là lặp lại bất kỳ điều gì bạn truyền cho nó.

**Cách tốt nhất để học Linux (và lập trình nói chung) là *thực hành* (Doing).** Đừng chỉ đọc lướt qua một cách thụ động – hãy thử nghiệm các câu lệnh trực tiếp trong môi trường Terminal! Đây là nơi hoàn hảo để bạn vừa khám phá vừa học hỏi.

Hãy nhập câu lệnh sau vào terminal của bạn *chính xác* như hiển thị:

```bash
echo "Hello LabEx"
```

Nhấn **Enter**.

Bạn sẽ thấy dòng chữ "Hello LabEx" xuất hiện ngay bên dưới. Xin chúc mừng, bạn vừa chạy thành công câu lệnh Linux đầu tiên trong đời!

### Những điều then chốt cần ghi nhớ:
- **Linux phân biệt chữ hoa và chữ thường (Case-sensitive)**: `echo`, `Echo`, và `ECHO` là các câu lệnh hoàn toàn khác nhau.
- **Khoảng trắng rất quan trọng**: Hãy đảm bảo luôn có khoảng trắng giữa `echo` và dấu ngoặc kép (`"`).
- Dấu ngoặc kép báo cho `echo` biết chính xác chuỗi văn bản nào cần được in ra."""
    },
    "source-270253-section-2": {
        "title_vi": "Hiển Thị Người Dùng Hiện Tại",
        "task_vi": "Chạy lệnh whoami để xem tài khoản hiện tại.",
        "hint_vi": "Nhập lệnh whoami trong terminal.",
        "content_vi": """Hãy cùng tìm hiểu xem máy tính nhận diện bạn là ai.

Nhập câu lệnh sau vào terminal và nhấn **Enter**:

```bash
whoami
```

Câu lệnh này thực chất là hỏi máy tính: "Who am I?" (Tôi là ai?). Hệ thống sẽ phản hồi bằng tên tài khoản người dùng của bạn.

Bạn sẽ thấy kết quả:

```plaintext
labex
```

Câu lệnh `whoami` cực kỳ hữu ích khi bạn làm việc trên nhiều máy chủ khác nhau hoặc khi cần xác định quyền của tài khoản bạn đang chuyển đổi qua."""
    },
    "source-270253-section-3": {
        "title_vi": "Hiển Thị Thông Tin Người Dùng và Nhóm",
        "task_vi": "Chạy lệnh id trong terminal.",
        "hint_vi": "Gõ id và nhấn Enter.",
        "content_vi": """Hãy xem thêm nhiều thông tin chi tiết hơn về tài khoản người dùng bằng câu lệnh `id`. Đây là cách tuyệt vời để xem bạn đang thuộc về những nhóm hệ thống nào.

Trong Linux, người dùng được phân chia vào các nhóm (Groups). Các nhóm này quyết định quyền hạn và mức độ truy cập tệp tin mà người dùng được phép thực hiện.

Nhập lệnh sau và nhấn **Enter**:

```bash
id
```

Bạn sẽ thấy kết quả tương tự như sau:

```plaintext
uid=1000(labex) gid=1000(labex) groups=1000(labex),27(sudo)...
```

Đừng quá bận tâm về các con số ngay lúc này. Dưới đây là ý nghĩa chi tiết:
- `uid`: Mã định danh người dùng duy nhất của bạn (User ID).
- `gid`: Mã nhóm chính của bạn (Primary Group ID).
- `groups`: Danh sách tất cả các nhóm mà bạn là thành viên.

Bạn cũng có thể dùng `id` để tra cứu thông tin của tài khoản khác trên hệ thống. Hãy thử chạy:

```bash
id root
```

Bạn sẽ thấy:

```plaintext
uid=0(root) gid=0(root) groups=0(root)
```

Tài khoản `root` là tài khoản siêu quản trị viên (Superuser) – người nắm toàn quyền cao nhất trên hệ thống Linux!"""
    },
    "source-270253-section-4": {
        "title_vi": "Trích Xuất Riêng Tên Người Dùng",
        "task_vi": "Chạy lệnh id -un trong terminal.",
        "hint_vi": "Gõ id -un và nhấn Enter.",
        "content_vi": """Ở bước 2, bạn đã dùng `whoami` để hiển thị tên người dùng. Ở bước 3, bạn đã dùng `id` để hiển thị toàn bộ thông tin tài khoản và nhóm.

Đôi khi, câu lệnh `id` in ra nhiều chi tiết hơn mức bạn cần. Một kỹ năng thực tế rất phổ biến trong viết kịch bản shell (scripting) là yêu cầu hệ thống chỉ xuất ra một mẩu thông tin cụ thể.

Hãy nhập câu lệnh sau và nhấn **Enter**:

```bash
id -un
```

Tùy chọn `-u` (user) kết hợp với `-n` (name) yêu cầu lệnh `id` chỉ in ra riêng tên tài khoản tương ứng với UID hiện tại của bạn:

```plaintext
labex
```

Sau khi chạy xong, hãy bấm **Tiếp tục** để chuyển sang bước trải nghiệm tiếp theo."""
    },
    "source-270253-section-5": {
        "title_vi": "Học Qua Thực Hành (Learn By Doing)",
        "task_vi": "Đọc phần phương pháp học qua thực hành và xác nhận tiếp tục.",
        "hint_vi": "Bấm nút Tiếp tục để hoàn tất bài học.",
        "content_vi": """Xin chúc mừng bạn đã hoàn thành bài thực hành đầu tiên! Bạn vừa trải nghiệm phong cách học tập cốt lõi của LabEx: **Học Qua Thực Hành (Learn By Doing)**.

Những gì bạn vừa hoàn thành là một bài **Guided Lab** (Thực hành có hướng dẫn): các bước đi rõ ràng kết hợp với cơ chế kiểm tra tự động. Ở bài tiếp theo, bạn sẽ được thử sức với bài **Challenge** (Thử thách) – nơi bạn tự vận dụng kiến thức độc lập để giải quyết nhiệm vụ.

### Trợ lý thông minh Labby AI

Trong quá trình học tập, bạn có thể đặt câu hỏi cho trợ lý Labby AI bất cứ lúc nào bằng nút **Hỏi Labby AI**. Labby hiểu được ngữ cảnh bài học hiện tại và các thao tác bạn vừa thực hiện trên terminal, giúp bạn:
- Giải thích chi tiết các câu lệnh và tùy chọn phức tạp.
- Phân tích nguyên nhân khi bạn gõ sai cú pháp và hướng dẫn sửa lỗi.
- Đề xuất các phương án tối ưu hóa khi thao tác với Linux.

Hãy bấm **Tiếp tục** để chuyển sang bước tổng kết và hoàn thành bài lab!"""
    },
    "source-270253-section-6": {
        "title_vi": "Tổng kết bài học",
        "content_vi": """Xin chúc mừng bạn đã hoàn thành bài lab đầu tiên!

Hãy cùng điểm lại những câu lệnh bạn đã thành thạo hôm nay:
- `echo`: In văn bản và lời chào ra màn hình terminal.
- `whoami`: Xác định tài khoản người dùng hiện đang đăng nhập.
- `id`: Kiểm tra mã định danh UID, GID và các nhóm quyền hệ thống.
- `id -un`: Trích xuất riêng tên người dùng phục vụ cho tự động hóa.

Bạn đã sẵn sàng để bước tiếp vào các thử thách thú vị tiếp theo của lộ trình Linux!"""
    }
}

def apply():
    fpath = LABS_DIR / "linux-your-first-linux-lab.json"
    if fpath.exists():
        data = json.loads(fpath.read_text(encoding="utf8"))
        data["title_vi"] = "Bài Thực Hành Linux Đầu Tiên (Your First Linux Lab)"
        for sec in data.get("sections", []):
            sid = sec.get("id")
            if sid in LAB1_TRANSLATIONS:
                sec.update(LAB1_TRANSLATIONS[sid])
        for step in data.get("steps", []):
            sid = step.get("id")
            if sid in LAB1_TRANSLATIONS:
                tr = LAB1_TRANSLATIONS[sid]
                for k in ("title_vi", "task_vi", "hint_vi", "content_vi"):
                    if k in tr:
                        step[k] = tr[k]
        fpath.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf8")
        print("Updated Lab 1 successfully")

if __name__ == "__main__":
    apply()

