"""Repair untranslated command-course prose; preserve English, fixtures and graders.

Writes hash-bound overrides so reviewed translations can be reapplied safely with
scripts/apply-reviewed-translations.py after a content sync.
"""
import copy
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE = 'linux-basic-commands-practice-online'
OVERRIDES = ROOT/'server/data/translations/commands-reviewed.vi.json'

CONTENTS = {
    ('linux-linux-mkdir-command-directory-creating-209739', 2): """## Tạo các khu vực chính

Trong một khu vườn số, bạn có thể muốn sắp xếp các ý tưởng của mình thành những nhóm chính. Hãy tạo các thư mục cho từng loại nội dung.

Chúng ta sẽ tạo ba thư mục bên trong `digital_garden`: 'notes', 'projects' và 'resources'. Bạn có thể thực hiện bằng ba lệnh riêng biệt:

```bash
mkdir ~/project/digital_garden/notes
mkdir ~/project/digital_garden/projects
mkdir ~/project/digital_garden/resources
```

Ở đây, `~/project/digital_garden/` là đường dẫn đầy đủ đến khu vườn số của chúng ta. Ký hiệu `~` là cách viết tắt của "thư mục cá nhân".

Để xem cấu trúc mới, hãy dùng lệnh `ls` với đường dẫn đến khu vườn số:

```bash
ls ~/project/digital_garden
```

Bạn sẽ thấy ba thư mục mới được liệt kê: `notes`, `projects` và `resources`.

Nếu bạn muốn biết có thể dùng những thư mục này vào việc gì:

- `notes` có thể lưu các ý tưởng ngắn hoặc những suy ngẫm hằng ngày
- `projects` có thể chứa các công việc hoặc nghiên cứu dài hạn
- `resources` có thể dùng để lưu tài liệu tham khảo
""",
    ('linux-viewing-log-and-configuration-files-in-linux-387914', 0): """## Giới thiệu

Trong công việc quản trị hệ thống Linux, xem và điều hướng trong các tệp văn bản một cách hiệu quả là kỹ năng thiết yếu. Thử thách này sẽ kiểm tra khả năng sử dụng ba lệnh xem văn bản cơ bản trong Linux: `cat`, `more` và `less`. Đây là những công cụ cần thiết cho mọi người dùng hoặc quản trị viên Linux, giúp bạn nhanh chóng kiểm tra nội dung tệp, cuộn qua các tệp lớn và tìm kiếm thông tin cụ thể.

Hãy tưởng tượng bạn là một quản trị viên hệ thống mới vào nghề, được giao nhiệm vụ xem xét một số tệp nhật ký và tệp cấu hình quan trọng trên máy chủ Linux. Quản trị viên cấp trên đã giao cho bạn một loạt nhiệm vụ cần hoàn thành bằng các lệnh xem văn bản này. Bạn đã sẵn sàng đón nhận thử thách chưa?

""",
}

HEADINGS = {
    'Introduction': 'Giới thiệu',
    'Summary': 'Tổng kết',
    'Absolute Paths - Navigating from the Root': 'Đường dẫn tuyệt đối - Điều hướng từ thư mục gốc',
}


def without_vi(value):
    if isinstance(value, dict):
        return {k: without_vi(v) for k, v in value.items() if not k.endswith('_vi')}
    if isinstance(value, list):
        return [without_vi(v) for v in value]
    return value


def apply():
    overrides = json.loads(OVERRIDES.read_text(encoding='utf-8')) if OVERRIDES.exists() else {}
    changed = []
    for path in sorted((ROOT/'server/data/labs').glob('*.json')):
        lab = json.loads(path.read_text(encoding='utf-8'))
        if lab.get('course_id') != COURSE:
            continue
        before = copy.deepcopy(lab)
        for section in lab.get('sections', []):
            original_vi = section.get('content_vi', '')
            vi = CONTENTS.get((lab['id'], section['position']), original_vi)
            vi = re.sub(r'^(#{1,6}\s+)([^\n]+)',
                        lambda m: m[1] + HEADINGS.get(m[2].strip(), m[2]), vi, flags=re.M)
            if vi != original_vi:
                # No translated command, path or sample output can slip into these repairs.
                assert re.findall(r'```[\s\S]*?```', vi) == re.findall(r'```[\s\S]*?```', original_vi)
                assert re.findall(r'`[^`\n]+`', vi) == re.findall(r'`[^`\n]+`', original_vi)
                section['content_vi'] = vi
                record = {
                    'position': section['position'],
                    'source_content_sha256': hashlib.sha256(section.get('content', '').encode()).hexdigest(),
                    'content_vi': vi,
                }
                records = overrides.setdefault(lab['id'], {}).setdefault('sections', [])
                records[:] = [r for r in records if r['position'] != section['position']]
                records.append(record)
                records.sort(key=lambda r: r['position'])
                changed.append({'lab_id': lab['id'], 'position': section['position']})
        by_id = {s['id']: s for s in lab.get('sections', [])}
        for step in lab.get('steps', []):
            if step['id'] in by_id:
                step['content_vi'] = by_id[step['id']].get('content_vi', '')
        assert without_vi(lab) == without_vi(before), 'Non-translation field changed'
        if lab != before:
            path.write_text(json.dumps(lab, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    OVERRIDES.write_text(json.dumps(overrides, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'repaired_sections': len(changed), 'changes': changed,
                      'english_and_grading_unchanged': True}, ensure_ascii=False))


if __name__ == '__main__':
    apply()
