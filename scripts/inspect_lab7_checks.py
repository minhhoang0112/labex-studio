import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('server/data/labs/linux-permissions-of-files.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

for i, s in enumerate(d['sections']):
    print(f"Sec {i}: {s['title']}")
    v = s.get('verification')
    if v:
        checks = v.get('checks')
        if checks:
            print("  checks:", json.dumps(checks, indent=2))
        groups = v.get('groups')
        if groups:
            print("  groups:", groups)

