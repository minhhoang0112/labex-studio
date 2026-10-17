import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

labs = [
    'linux-your-first-linux-lab',
    'linux-display-user-and-group-information',
    'linux-basic-files-operations',
    'linux-files-and-directories',
    'linux-file-contents-and-comparing'
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
        if ratio < 0.5:
            print(f"    WARNING: Low translation ratio ({ratio:.2f})!")
            print(f"    EN: {en[:100]}...")
            print(f"    VI: {vi[:100]}...")

