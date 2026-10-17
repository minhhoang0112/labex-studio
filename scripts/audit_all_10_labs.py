import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

labs = [
    'linux-your-first-linux-lab',
    'linux-display-user-and-group-information',
    'linux-basic-files-operations',
    'linux-files-and-directories',
    'linux-file-contents-and-comparing',
    'linux-the-manuscript-mystery',
    'linux-permissions-of-files',
    'shell-change-file-ownership',
    'linux-user-account-management',
    'linux-the-jokers-trick'
]

for lab_id in labs:
    path = f'server/data/labs/{lab_id}.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"\n=======================================================")
    print(f"LAB: {lab_id} ({data.get('title')}) - Sections: {len(data.get('sections', []))}")
    for idx, s in enumerate(data.get('sections', [])):
        title = s.get('title')
        title_vi = s.get('title_vi', '')
        content = s.get('content', '')
        content_vi = s.get('content_vi', '')
        print(f"  [{idx}] {title} | VI: {title_vi}")
        print(f"       EN chars: {len(content)} | VI chars: {len(content_vi)}")
        first_line_en = content.strip().split('\n')[0] if content else ''
        first_line_vi = content_vi.strip().split('\n')[0] if content_vi else ''
        print(f"       EN start: {first_line_en[:60]}...")
        print(f"       VI start: {first_line_vi[:60]}...")

