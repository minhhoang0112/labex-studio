import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

labs = [
    'linux-the-manuscript-mystery',
    'linux-permissions-of-files',
    'shell-change-file-ownership',
    'linux-user-account-management',
    'linux-the-jokers-trick'
]

for lab_id in labs:
    path = f'server/data/labs/{lab_id}.json'
    with open(path, 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"\n=======================================================")
    print(f"LAB: {lab_id} ({len(d['sections'])} sections)")
    for i, s in enumerate(d['sections']):
        en = s.get('content', '')
        vi = s.get('content_vi', '')
        ratio = len(vi) / max(len(en), 1)
        print(f"  Sec {i}: {s.get('title')} | EN: {len(en)} chars | VI: {len(vi)} chars | ratio: {ratio:.2f}")

