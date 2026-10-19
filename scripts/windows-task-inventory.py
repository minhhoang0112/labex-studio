import json
from pathlib import Path
for path in sorted(Path('server/data/labs').glob('win-*.json')):
    lab = json.loads(path.read_text(encoding='utf-8'))
    print('\nLAB', lab['id'])
    for step in lab.get('steps', []):
        print('STEP', step['id'], step.get('task', ''))
        print(step.get('content', ''))
