"""Repair instructions, fixtures and grading contract; never edit live workspaces.

Run after legacy translation scripts. The captured source text and existing
fixture bytes remain unchanged. sections is the canonical presentation.
"""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def repair():
    changed = []
    for path in (ROOT / 'server/data/labs').glob('*.json'):
        lab = json.loads(path.read_text(encoding='utf-8'))
        if lab.get('course_id') != 'quick-start-with-linux':
            continue
        before = copy.deepcopy(lab)
        if lab['id'] == 'linux-the-manuscript-mystery':
            inspect = lab['sections'][1]
            inspect['content_vi'] = '''Trong bước này, dùng `cat`, `head` và `tail` để kiểm tra hai tệp có sẵn. Không sửa nội dung tệp.

### Nhiệm vụ

1. Dùng `cat` xem toàn bộ `/home/labex/project/manuscript_v1.txt`.
2. Dùng `head` xem **2 dòng đầu** của `/home/labex/project/manuscript_v2.txt`.
3. Dùng `tail` xem **1 dòng cuối của cả hai tệp**.

### Gợi ý thực hiện

```bash
cd ~/project
cat manuscript_v1.txt
head -n 2 manuscript_v2.txt
tail -n 1 manuscript_v1.txt manuscript_v2.txt
```

Có thể đọc hai tệp bằng hai lệnh `tail` riêng. `-n 2` chọn 2 dòng, `-n 1` chọn 1 dòng; đọc 3 dòng là một thao tác khác với yêu cầu này.

### Đối chiếu dữ liệu local

Lệnh `cat manuscript_v1.txt` sẽ hiển thị:

```text
The room fell silent.
A shadow moved across the room.
The mystery continued.
```

`head -n 2 manuscript_v2.txt` hiển thị:

```text
The room fell silent.
A figure darted behind the curtains.
```

Dòng cuối của mỗi tệp là `The mystery continued.`. Dòng 1 và 3 của dữ liệu thực hành được biên soạn local; chỉ dòng khác biệt thứ 2 đã được đối chiếu nguồn. Không cần sửa tệp để làm giống một ví dụ khác.'''
            inspect['task_vi'] = inspect['task']
            inspect['hint_vi'] = 'Chạy cat manuscript_v1.txt; head -n 2 manuscript_v2.txt; tail -n 1 manuscript_v1.txt manuscript_v2.txt trong ~/project.'
            rules = inspect['verification']['checks'][0]
            base = r'(?:/home/labex/project/|~/project/|\./)?'
            v1, v2 = base + r'manuscript_v1\.txt', base + r'manuscript_v2\.txt'
            # Bounded options/operands only; reject echo, failed commands and
            # wrong line counts. Numbered cat and combined cat are legitimate.
            rules['groups'] = [
                [rf'^\s*cat\s+(?:-n\s+)?{v1}(?:\s+{v2})?\s*$',
                 rf'^\s*cat\s+(?:-n\s+)?{v2}\s+{v1}\s*$'],
                [rf'^\s*head\s+(?:-n\s*2|--lines(?:=|\s+)2|-2)\s+{v2}\s*$'],
                [rf'^\s*tail\s+(?:-n\s*1|--lines(?:=|\s+)1|-1)\s+{v1}(?:\s+{v2})?\s*$',
                 rf'^\s*tail\s+(?:-n\s*1|--lines(?:=|\s+)1|-1)\s+{v2}\s+{v1}\s*$'],
                [rf'^\s*tail\s+(?:-n\s*1|--lines(?:=|\s+)1|-1)\s+(?:{v1}\s+)?{v2}\s*$',
                 rf'^\s*tail\s+(?:-n\s*1|--lines(?:=|\s+)1|-1)\s+{v2}\s+{v1}\s*$'],
            ]
            compare = lab['sections'][2]
            compare['verification']['checks'][0]['groups'] = [[rf'^\s*diff\s+(?:(?:-u|--unified|-U\s*3)\s+)?{v1}\s+{v2}\s*$']]
            compare['content_vi'] += '\n\nCó thể dùng `diff -u` để xem định dạng hợp nhất. Khi hai tệp khác nhau, `diff` trả mã 1 là kết quả so sánh hợp lệ; mã 2 là lỗi đọc tệp/cú pháp và không được chấm đạt.'
            # Keep this repair idempotent, including when legacy translators run.
            note = '\n\nCó thể dùng `diff -u`'
            first, *rest = compare['content_vi'].split(note)
            compare['content_vi'] = first + note + rest[0] if rest else first

        by_id = {step['id']: step for step in lab.get('steps', [])}
        for section in lab.get('sections', []):
            old = by_id.get(section['id'], {})
            # Preserve task translations missing only from the document copy.
            for key in ('task_vi', 'hint_vi'):
                if key not in section and key in old:
                    section[key] = old[key]
        lab['steps'] = [copy.deepcopy(section) for section in lab.get('sections', []) if section['id'] in by_id]
        if lab != before:
            path.write_text(json.dumps(lab, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            changed.append(lab['id'])
    print('Quick Start consistency repaired: ' + ', '.join(changed))


if __name__ == '__main__':
    repair()
