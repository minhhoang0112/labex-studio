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
        d = json.load(f)
    print(f"\n==================================================")
    print(f"LAB: {lab_id}")
    for i, s in enumerate(d.get('sections', [])):
        print(f"  Sec {i}: {s.get('title')} | need_verify: {s.get('need_verify')}")
        v = s.get('verification')
        if v:
            print(f"       verification kind: {v.get('kind')}")
            if v.get('groups'):
                print(f"       regex groups: {v.get('groups')}")

