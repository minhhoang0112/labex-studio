import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('server/data/labs/linux-user-account-management.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

for i in range(4):
    print(f"\n=== SEC {i}: {d['sections'][i]['title']} ===")
    print(d['sections'][i]['content'])

