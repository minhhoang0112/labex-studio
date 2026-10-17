import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('server/data/labs/linux-user-account-management.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

for i, s in enumerate(d['sections']):
    print(f"\n==========================================")
    print(f"SECTION {i}: {s['title']}")
    print(s['content'])

