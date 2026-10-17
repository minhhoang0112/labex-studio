import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

for lab_id in ['linux-the-manuscript-mystery', 'shell-change-file-ownership', 'linux-the-jokers-trick']:
    path = f'server/data/labs/{lab_id}.json'
    with open(path, 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"\n=======================================================")
    print(f"LAB: {lab_id} ({len(d['sections'])} sections)")
    for i, s in enumerate(d['sections']):
        print(f"\n--- Section {i}: {s['title']} ---")
        print(s['content'])

