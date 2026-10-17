import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def compare_lab(lab_id):
    path = f'server/data/labs/{lab_id}.json'
    with open(path, 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"\n==================================================")
    print(f"LAB: {lab_id}")
    for i, s in enumerate(d.get('sections', [])):
        print(f"\n--- Section {i}: {s.get('title')} ---")
        en = s.get('content', '')
        vi = s.get('content_vi', '')
        print(f"EN ({len(en)} chars):\n{en[:250]}...")
        print(f"VI ({len(vi)} chars):\n{vi[:250]}...")

compare_lab('linux-permissions-of-files')
compare_lab('linux-user-account-management')

