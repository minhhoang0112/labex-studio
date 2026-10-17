import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('server/data/labs/linux-permissions-of-files.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

for i in range(1, 5):
    s = d['sections'][i]
    print(f"Sec {i}: {s['title']}")
    print("  Verification:", json.dumps(s.get('verification'), indent=2))

