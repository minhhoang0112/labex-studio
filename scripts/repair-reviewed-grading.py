"""Restore reviewed grading fields, preserving lesson text and learner files."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / '.artifacts/reviewed-regeneration-stage/server/data/labs'
BACKUP = ROOT / '.artifacts/grading-before-repair-2026-10-19'
FIELDS = ('verification', 'verification_by_provider', 'required_capabilities',
          'required_capabilities_by_provider')
COURSES = {'linux-for-noobs', 'become-a-junior-system-administrator', 'shell-for-beginners'}


def main():
    if not BASELINE.is_dir():
        raise SystemExit('Reviewed baseline absent; refusing to invent replacement graders.')
    changed = 0
    for path in (ROOT / 'server/data/labs').glob('*.json'):
        lab = json.loads(path.read_text(encoding='utf-8'))
        original = json.dumps(lab, sort_keys=True)
        if lab.get('course_id') in COURSES:
            old_path = BASELINE / path.name
            if not old_path.exists():
                raise RuntimeError(f'No reviewed baseline for {path.name}')
            before = json.loads(old_path.read_text(encoding='utf-8'))
            for collection in ('steps', 'sections'):
                indexed = {item['id']: item for item in before.get(collection, [])}
                for item in lab.get(collection, []):
                    reviewed = indexed.get(item['id'])
                    if not reviewed or not any(field in reviewed for field in FIELDS):
                        continue
                    for field in FIELDS:
                        if field in reviewed:
                            item[field] = reviewed[field]
                        else:
                            item.pop(field, None)
        if lab['id'].startswith('win-'):
            lab['required_capabilities'] = sorted(set(lab.get('required_capabilities', [])) | {'windows'})
        if json.dumps(lab, sort_keys=True) != original:
            BACKUP.mkdir(parents=True, exist_ok=True)
            target = BACKUP / path.name
            if not target.exists():
                shutil.copyfile(path, target)
            path.write_text(json.dumps(lab, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            changed += 1
    print(f'Repaired grading metadata in {changed} labs; content and learner files preserved.')


if __name__ == '__main__':
    main()
