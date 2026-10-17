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
        content = s.get('content', '')
        print(f"  [{idx}] {title} ({len(content)} chars)")
        print(f"       Preview: {content[:120].replace('\n', ' ')}...")

