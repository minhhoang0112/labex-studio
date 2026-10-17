"""Reapply reviewed VI text without modifying source bodies or verifiers."""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def apply():
    count = 0
    for override_path in sorted((ROOT/'server/data/translations').glob('*.vi.json')):
        overrides = json.loads(override_path.read_text(encoding='utf-8'))
        for lab_id, override in overrides.items():
            if not lab_id or Path(lab_id).name != lab_id or '/' in lab_id or '\\' in lab_id:
                raise ValueError('Invalid lesson ID in translation overrides')
            path = ROOT/'server/data/labs'/(lab_id+'.json')
            lab = json.loads(path.read_text(encoding='utf-8'))
            if 'title_vi' in override: lab['title_vi'] = override['title_vi']
            by_position = {item['position']:item for item in override.get('sections',[])}
            for section in lab.get('sections',[]):
                translated = by_position.get(section.get('position'))
                if not translated: continue
                digest = translated.get('source_content_sha256')
                if digest and hashlib.sha256(section.get('content','').encode()).hexdigest() != digest:
                    raise ValueError(f'Source body changed; review translation first: {lab_id}/{section["position"]}')
                for key, value in translated.items():
                    if key.endswith('_vi') and isinstance(value,str): section[key] = value
                count += 1
            sections = {section['id']:section for section in lab.get('sections',[])}
            for step in lab.get('steps',[]):
                for key,value in sections.get(step['id'],{}).items():
                    if key.endswith('_vi'): step[key] = copy.deepcopy(value)
            path.write_text(json.dumps(lab,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Reviewed translations applied to {count} sections; source bodies and grading unchanged.')


if __name__ == '__main__': apply()
