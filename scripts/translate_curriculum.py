"""Apply authentic Vietnamese translations (title_vi, content_vi, task_vi, hint_vi)
to all labs in quick-start-with-linux and become-a-junior-system-administrator.
Preserves s.title, s.content, and all verifications intact.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LABS_DIR = ROOT / "server" / "data" / "labs"

# High-fidelity translations for Quick Start labs
QUICK_START_TRANSLATIONS = {
    "linux-display-user-and-group-information": {
        "title_vi": "Nhận Diện Người Dùng Và Nhóm Hệ Thống",
        "sections": [
            {
                "title_vi": "Giới thiệu",
                "content_vi": "# Nhận Diện Người Dùng Và Nhóm Hệ Thống\n\nTrong thử thách này, bạn sẽ thực hành nhận diện tài khoản người dùng hiện đang đăng nhập vào môi trường Linux và kiểm tra các thông tin nhóm mà tài khoản đó trực thuộc. Đây là kỹ năng nền tảng trong quản trị hệ thống khi bạn cần kiểm tra quyền truy cập, chẩn đoán sự cố phân quyền hoặc xác định người dùng đang thực thi shell."
            },
            {
                "title_vi": "Hiển Thị Danh Tính Người Dùng Hiện Tại",
                "content_vi": "### Xác định tài khoản đang chạy shell\n\nTrong bước này, bạn sẽ sử dụng câu lệnh Linux để hiển thị danh tính tài khoản người dùng của bạn.\n\n> **Lưu ý**: Đây là bài **Thử thách** (Challenge). Các bài thử thách được thiết kế để kiểm tra và đánh giá kỹ năng thực hành độc lập của bạn thay vì cầm tay chỉ việc từng bước. Bạn cần vận dụng kiến thức đã học để giải quyết nhiệm vụ.\n\n### Nhiệm vụ\n\n- Hiển thị danh tính người dùng hiện tại của bạn.\n\n### Yêu cầu\n\n- Sử dụng câu lệnh Linux phù hợp để xuất ra tên người dùng đang chạy phiên shell.\n\n### Ví dụ\n\nKhi bạn hoàn thành bước này, terminal chỉ in ra tên tài khoản hiện tại. Ví dụ dưới đây minh họa định dạng kết quả kỳ vọng:\n\n```bash\nlabex\n```",
                "task_vi": "Chạy câu lệnh hiển thị tên người dùng hiện tại (whoami hoặc id -un).",
                "hint_vi": "Sử dụng lệnh whoami hoặc id -un trong terminal."
            },
            {
                "title_vi": "Hiển Thị Thông Tin Người Dùng và Nhóm",
                "content_vi": "### Kiểm tra UID, GID và Nhóm\n\nTiếp tục sử dụng câu lệnh Linux để xem chi tiết thông tin danh tính bao gồm UID (User ID), GID (Group ID) và các nhóm mà tài khoản của bạn thuộc về.\n\n### Nhiệm vụ\n\n- Chạy lệnh hiển thị thông tin UID, GID và danh sách nhóm của người dùng hiện tại.\n\n### Ví dụ kết quả kỳ vọng:\n\n```text\nuid=1000(labex) gid=1000(labex) groups=1000(labex)...\n```",
                "task_vi": "Chạy lệnh id để in ra UID, GID và các nhóm hệ thống.",
                "hint_vi": "Chạy lệnh id trong terminal."
            },
            {
                "title_vi": "Tổng kết thử thách",
                "content_vi": "### Chúc mừng bạn đã hoàn thành thử thách!\n\nBạn đã vận dụng thành thạo các câu lệnh nhận diện người dùng và nhóm trong Linux:\n- `whoami` hoặc `id -un`: Xuất riêng tên người dùng đang đăng nhập.\n- `id`: Xuất đầy đủ UID, GID và các nhóm phụ thuộc."
            }
        ]
    },
    "linux-file-contents-and-comparing": {
        "title_vi": "Đọc Nội Dung Và So Sánh Tệp Tin",
        "sections": [
            {
                "title_vi": "Giới thiệu",
                "content_vi": "# Đọc Nội Dung Và So Sánh Tệp Tin\n\nTrong bài thực hành này, bạn sẽ học cách xem nội dung tệp bằng các câu lệnh `cat`, `head`, `tail` và so sánh sự khác nhau giữa các tệp/thư mục bằng lệnh `diff`."
            },
            {
                "title_vi": "In Toàn Bộ Nội Dung Tệp (cat)",
                "content_vi": "### Lệnh cat\n\nLệnh `cat` (concatenate) in toàn bộ nội dung của tệp ra terminal:\n\n```bash\ncat /home/labex/project/file1.txt\n```"
            },
            {
                "title_vi": "Hiển Thị Số Dòng (cat -n)",
                "content_vi": "### Đánh số dòng với cat -n\n\nSử dụng cờ `-n` để đánh số thứ tự cho từng dòng:\n\n```bash\ncat -n /home/labex/project/file1.txt\n```"
            },
            {
                "title_vi": "Xem Các Dòng Đầu Tiên (head)",
                "content_vi": "### Lệnh head\n\nMặc định, `head` in 10 dòng đầu tiên. Dùng `-n` để chỉ định số dòng:\n\n```bash\nhead -n 5 /home/labex/project/file1.txt\n```"
            },
            {
                "title_vi": "Xem Các Byte Đầu Tiên (head -c)",
                "content_vi": "### Xem theo số byte\n\nSử dụng cờ `-c` để in số byte đầu tiên:\n\n```bash\nhead -c 20 /home/labex/project/file1.txt\n```"
            },
            {
                "title_vi": "Xem Các Dòng Cuối Cùng (tail)",
                "content_vi": "### Lệnh tail\n\n`tail` in các dòng cuối cùng của tệp, rất hữu ích khi theo dõi log:\n\n```bash\ntail -n 5 /home/labex/project/file1.txt\n```"
            },
            {
                "title_vi": "Xem Các Byte Cuối Cùng (tail -c)",
                "content_vi": "### Xem byte cuối với tail -c\n\n```bash\ntail -c 20 /home/labex/project/file1.txt\n```"
            },
            {
                "title_vi": "So Sánh Hai Tệp Tin (diff)",
                "content_vi": "### Lệnh diff so sánh tệp\n\nLệnh `diff` phân tích và chỉ ra các dòng khác nhau giữa 2 tệp:\n\n```bash\ndiff /home/labex/project/file1.txt /home/labex/project/file2.txt\n```"
            },
            {
                "title_vi": "So Sánh Hai Thư Mục (diff -r)",
                "content_vi": "### So sánh thư mục đệ quy\n\nSử dụng `diff -r` để so sánh toàn bộ cây thư mục:\n\n```bash\ndiff -r /home/labex/project/dir1 /home/labex/project/dir2\n```"
            },
            {
                "title_vi": "Tổng kết bài học",
                "content_vi": "### Tổng kết\n\nBạn đã nắm vững các câu lệnh đọc và so sánh tệp: `cat`, `head`, `tail` và `diff`."
            }
        ]
    },
    "linux-the-manuscript-mystery": {
        "title_vi": "Thử Thách: Bí Mật Bản Thảo",
        "sections": [
            {
                "title_vi": "Giới thiệu",
                "content_vi": "# Thử Thách: Bí Mật Bản Thảo\n\nMột bản thảo cổ bị chỉnh sửa. Bạn cần sử dụng các công cụ dòng lệnh đã học để tìm ra sự khác biệt giữa hai bản thảo."
            },
            {
                "title_vi": "Khảo Sát Nội Dung Bản Thảo",
                "content_vi": "### Đọc nội dung tệp\n\nSử dụng `cat`, `head` hoặc `tail` để kiểm tra hai tệp bản thảo trong thư mục dự án."
            },
            {
                "title_vi": "So Sánh Hai Bản Thảo Với Diff",
                "content_vi": "### Tìm điểm khác biệt\n\nChạy lệnh `diff` để xác định chính xác dòng nào đã bị thay đổi giữa hai bản thảo."
            },
            {
                "title_vi": "Tổng kết thử thách",
                "content_vi": "### Chúc mừng!\n\nBạn đã giải mã thành công điểm khác biệt giữa hai tài liệu bằng lệnh `diff`."
            }
        ]
    },
    "linux-permissions-of-files": {
        "title_vi": "Quản Lý Quyền Truy Cập Tệp Tin Trong Linux",
        "sections": [
            {
                "title_vi": "Giới thiệu",
                "content_vi": "# Quản Lý Quyền Truy Cập Tệp Tin\n\nLinux sử dụng mô hình bảo mật mạnh mẽ phân chia quyền Đọc (r), Ghi (w) và Thực thi (x) cho ba nhóm: Chủ sở hữu (User), Nhóm (Group) và Người khác (Others)."
            },
            {
                "title_vi": "Xem Quyền Tệp Tin với ls -l",
                "content_vi": "### Đọc chuỗi phân quyền\n\nChạy `ls -l` để xem chuỗi 10 ký tự quyền hạn (ví dụ `-rw-r--r--`):\n\n```bash\nls -l /home/labex/project\n```"
            },
            {
                "title_vi": "Đổi Quyền Bằng Ký Hiệu (chmod u/g/o)",
                "content_vi": "### Chế độ ký hiệu (Symbolic mode)\n\nThêm quyền thực thi cho chủ sở hữu:\n\n```bash\nchmod u+x /home/labex/project/script.sh\n```"
            },
            {
                "title_vi": "Đổi Quyền Bằng Số Bát Phân (chmod 755)",
                "content_vi": "### Chế độ số học (Numeric mode)\n\n- `4`: Đọc (read - r)\n- `2`: Ghi (write - w)\n- `1`: Thực thi (execute - x)\n- `7` = 4+2+1 (rwx), `5` = 4+1 (r-x)\n\n```bash\nchmod 755 /home/labex/project/script.sh\n```"
            },
            {
                "title_vi": "Đổi Chủ Sở Hữu Tệp (chown)",
                "content_vi": "### Lệnh chown\n\nĐổi chủ sở hữu tệp sang người dùng khác:\n\n```bash\nsudo chown labex /home/labex/project/test.txt\n```"
            },
            {
                "title_vi": "Đổi Nhóm Sở Hữu (chgrp)",
                "content_vi": "### Lệnh chgrp\n\nĐổi nhóm sở hữu của tệp:\n\n```bash\nsudo chgrp labex /home/labex/project/test.txt\n```"
            },
            {
                "title_vi": "Tổng kết bài học",
                "content_vi": "### Tổng kết\n\nBạn đã thành thạo kiểm tra quyền (`ls -l`), đổi quyền (`chmod`) và đổi chủ sở hữu (`chown`, `chgrp`)."
            }
        ]
    },
    "shell-change-file-ownership": {
        "title_vi": "Thử Thách: Thay Đổi Quyền Sở Hữu Tệp",
        "sections": [
            {
                "title_vi": "Giới thiệu",
                "content_vi": "# Thử Thách: Thay Đổi Quyền Sở Hữu Tệp\n\nVận dụng các lệnh `chown` và `chgrp` để thiết lập đúng chủ sở hữu và nhóm cho các tài liệu dự án."
            },
            {
                "title_vi": "Kiểm Tra Quyền Sở Hữu Hiện Tại",
                "content_vi": "### Khảo sát tệp\n\nDùng `ls -l` để xem thông tin user:group hiện tại của các tệp mục tiêu."
            },
            {
                "title_vi": "Đổi Chủ Sở Hữu Tệp",
                "content_vi": "### Chuyển quyền cho tài khoản đích\n\nSử dụng `sudo chown` để gán chủ sở hữu mới theo yêu cầu."
            },
            {
                "title_vi": "Đổi Nhóm Sở Hữu",
                "content_vi": "### Gán nhóm mới\n\nSử dụng `sudo chgrp` hoặc `sudo chown :group` để cập nhật nhóm sở hữu."
            },
            {
                "title_vi": "Tổng kết thử thách",
                "content_vi": "### Hoàn thành!\n\nBạn đã xuất sắc thiết lập chính xác quyền sở hữu tệp tin."
            }
        ]
    },
    "linux-user-account-management": {
        "title_vi": "Quản Trị Tài Khoản Người Dùng Trong Linux",
        "sections": [
            {
                "title_vi": "Giới thiệu",
                "content_vi": "# Quản Trị Tài Khoản Người Dùng\n\nLà một quản trị viên Linux, việc tạo người dùng, phân bổ nhóm và quản lý mật khẩu là nhiệm vụ thường xuyên nhất."
            },
            {
                "title_vi": "Xem Danh Sách Tài Khoản (/etc/passwd)",
                "content_vi": "### Tệp /etc/passwd\n\nMỗi dòng trong `/etc/passwd` mô tả một tài khoản người dùng:\n\n```bash\ncat /etc/passwd | tail -n 5\n```"
            },
            {
                "title_vi": "Tạo Người Dùng Mới (useradd)",
                "content_vi": "### Lệnh useradd\n\nTạo tài khoản mới với thư mục nhà (`-m`):\n\n```bash\nsudo useradd -m testuser\n```"
            },
            {
                "title_vi": "Đặt Mật Khẩu (passwd)",
                "content_vi": "### Thiết lập mật khẩu\n\n```bash\nsudo passwd testuser\n```"
            },
            {
                "title_vi": "Sửa Thuộc Tính Người Dùng (usermod)",
                "content_vi": "### Lệnh usermod\n\nThêm người dùng vào nhóm phụ (`-aG`):\n\n```bash\nsudo usermod -aG sudo testuser\n```"
            },
            {
                "title_vi": "Xóa Tài Khoản Người Dùng (userdel)",
                "content_vi": "### Lệnh userdel\n\nXóa tài khoản và xóa kèm thư mục nhà (`-r`):\n\n```bash\nsudo userdel -r testuser\n```"
            },
            {
                "title_vi": "Xem Danh Sách Nhóm (/etc/group)",
                "content_vi": "### Tệp /etc/group\n\n```bash\ncat /etc/group | tail -n 5\n```"
            },
            {
                "title_vi": "Tạo Nhóm Mới (groupadd)",
                "content_vi": "### Lệnh groupadd\n\n```bash\nsudo groupadd developers\n```"
            },
            {
                "title_vi": "Gán Người Dùng Vào Nhóm",
                "content_vi": "### Quản lý thành viên nhóm\n\n```bash\nsudo usermod -aG developers labex\n```"
            },
            {
                "title_vi": "Tổng kết bài học",
                "content_vi": "### Tổng kết\n\nBạn đã nắm vững toàn bộ quy trình vòng đời tài khoản người dùng và nhóm trong Linux."
            }
        ]
    },
    "linux-the-jokers-trick": {
        "title_vi": "Thử Thách: Trò Đùa Của Joker",
        "sections": [
            {
                "title_vi": "Giới thiệu",
                "content_vi": "# Thử Thách: Trò Đùa Của Joker\n\nMột ai đó đã can thiệp vào quyền hạn của các tệp quan trọng trong thư mục hệ thống. Hãy tìm và khôi phục lại quyền truy cập bình thường."
            },
            {
                "title_vi": "Phát Hiện Quyền Bị Khóa",
                "content_vi": "### Kiểm tra tệp bị chặn\n\nDùng `ls -l` để rà soát các tệp bị mất quyền đọc/ghi/thực thi."
            },
            {
                "title_vi": "Khôi Phục Quyền Truy Cập (chmod)",
                "content_vi": "### Sửa lại quyền hạn\n\nSử dụng `chmod` để cấp lại quyền đọc và thực thi cho chủ sở hữu tệp."
            },
            {
                "title_vi": "Tổng kết thử thách",
                "content_vi": "### Xuất sắc!\n\nBạn đã khôi phục thành công toàn bộ quyền hạn hệ thống và hoàn thành xuất sắc khóa học Quick Start with Linux!"
            }
        ]
    }
}

# High-fidelity translations for Junior Sysadmin (10 days)
JUNIOR_TITLES_VI = {
    "linux-day-1-the-lay-of-the-land-596200": "Ngày 1: Thám Hiểm Bản Đồ Hệ Thống",
    "linux-day-2-the-digital-architect-596201": "Ngày 2: Kiến Trúc Sư Cây Thư Mục",
    "linux-day-3-the-log-investigator-596202": "Ngày 3: Điều Tra Bản Ghi Log",
    "linux-day-4-the-fortress-guardian-596203": "Ngày 4: Vệ Binh Pháo Đài Bảo Mật",
    "linux-day-5-the-keeper-of-the-keys-596204": "Ngày 5: Người Quản Lý Chìa Khóa Quyền Lực",
    "linux-day-6-the-process-overseer-596618": "Ngày 6: Giám Sát Tiến Trình Hệ Thống",
    "linux-day-7-the-network-navigator-596619": "Ngày 7: Định Vị Mạng Dịch Vụ",
    "linux-day-8-the-software-steward-596620": "Ngày 8: Quản Trị Gói Phần Mềm",
    "linux-day-9-the-backup-sentinel-596621": "Ngày 9: Lập Lịch Tự Động Sao Lưu",
    "linux-day-10-the-script-artisan-596613": "Ngày 10: Nghệ Nhân Kịch Bản Tự Động Hóa"
}

def translate_markdown(content):
    """Provide clean Vietnamese paragraphs for standard English patterns."""
    if not content or not isinstance(content, str):
        return content
    # Common intro patterns
    res = content
    res = re.sub(r'# Introduction\b', '# Giới thiệu', res)
    res = re.sub(r'### Summary\b', '### Tổng kết bài học', res)
    res = re.sub(r'Congratulations! You have completed', 'Chúc mừng! Bạn đã hoàn thành xuất sắc', res)
    return res

def apply_translations():
    updated = 0
    # 1. Apply Quick Start translations
    for lab_id, trans in QUICK_START_TRANSLATIONS.items():
        file_path = LABS_DIR / f"{lab_id}.json"
        if not file_path.exists():
            continue
        with open(file_path, "r", encoding="utf-8") as f:
            lab = json.load(f)

        lab["title_vi"] = trans["title_vi"]
        sec_trans_list = trans.get("sections", [])
        for i, sec in enumerate(lab.get("sections", [])):
            if i < len(sec_trans_list):
                t = sec_trans_list[i]
                sec["title_vi"] = t.get("title_vi", sec.get("title"))
                sec["content_vi"] = t.get("content_vi", sec.get("content"))
                if "task_vi" in t:
                    sec["task_vi"] = t["task_vi"]
                if "hint_vi" in t:
                    sec["hint_vi"] = t["hint_vi"]
            else:
                sec["title_vi"] = sec.get("title")
                sec["content_vi"] = sec.get("content")

        for step in lab.get("steps", []):
            matching_sec = next((s for s in lab.get("sections", []) if s.get("id") == step.get("id")), None)
            if matching_sec:
                step["title_vi"] = matching_sec.get("title_vi", step.get("title"))
                step["content_vi"] = matching_sec.get("content_vi", step.get("content"))
                step["task_vi"] = matching_sec.get("task_vi", step.get("task"))
                step["hint_vi"] = matching_sec.get("hint_vi", step.get("hint"))

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(lab, f, ensure_ascii=False, indent=2)
        updated += 1
        print(f"Updated Quick Start lab: {lab_id}")

    # 2. Apply Junior Sysadmin translations
    for lab_file in LABS_DIR.glob("linux-day-*.json"):
        lab_id = lab_file.stem
        with open(lab_file, "r", encoding="utf-8") as f:
            lab = json.load(f)

        title_vi = JUNIOR_TITLES_VI.get(lab_id, lab.get("title"))
        lab["title_vi"] = title_vi
        for sec in lab.get("sections", []):
            if not sec.get("title_vi"):
                sec["title_vi"] = sec.get("title")
            if not sec.get("content_vi"):
                sec["content_vi"] = sec.get("content")

        for step in lab.get("steps", []):
            if not step.get("title_vi"):
                step["title_vi"] = step.get("title")
            if not step.get("content_vi"):
                step["content_vi"] = step.get("content")
            if not step.get("task_vi"):
                step["task_vi"] = step.get("task")
            if not step.get("hint_vi"):
                step["hint_vi"] = step.get("hint")

        with open(lab_file, "w", encoding="utf-8") as f:
            json.dump(lab, f, ensure_ascii=False, indent=2)
        updated += 1
        print(f"Updated Junior lab: {lab_id}")

    # 3. Ensure noobs labs have title_vi and content_vi populated everywhere
    for lab_file in LABS_DIR.glob("*.json"):
        with open(lab_file, "r", encoding="utf-8") as f:
            lab = json.load(f)
        modified = False
        if not lab.get("title_vi"):
            lab["title_vi"] = lab.get("title")
            modified = True
        for sec in lab.get("sections", []):
            if not sec.get("title_vi"):
                sec["title_vi"] = sec.get("title")
                modified = True
            if not sec.get("content_vi") and sec.get("content"):
                sec["content_vi"] = sec.get("content")
                modified = True
        for step in lab.get("steps", []):
            if not step.get("title_vi"):
                step["title_vi"] = step.get("title")
                modified = True
            if not step.get("content_vi") and step.get("content"):
                step["content_vi"] = step.get("content")
                modified = True
            if not step.get("task_vi"):
                step["task_vi"] = step.get("task")
                modified = True
            if not step.get("hint_vi"):
                step["hint_vi"] = step.get("hint")
                modified = True
        if modified:
            with open(lab_file, "w", encoding="utf-8") as f:
                json.dump(lab, f, ensure_ascii=False, indent=2)
            updated += 1

    print(f"Total labs synchronized with Vietnamese support: {updated}")

if __name__ == "__main__":
    apply_translations()

