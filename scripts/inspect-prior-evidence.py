"""Summarize previously saved REA records without replaying their actions."""
import argparse
import json
from pathlib import Path
from html.parser import HTMLParser


class Headings(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tag = None
        self.values = []

    def handle_starttag(self, tag, attrs):
        if tag in ('title', 'h1', 'h2', 'h3'):
            self.tag = tag

    def handle_data(self, data):
        if self.tag and data.strip():
            self.values.append((self.tag, data.strip()))

    def handle_endtag(self, tag):
        if tag == self.tag:
            self.tag = None


parser = argparse.ArgumentParser()
parser.add_argument('steps', type=Path)
args = parser.parse_args()
for file in sorted(args.steps.glob('*/output.txt'), key=lambda p: int(p.parent.name)):
    try:
        record = json.loads(file.read_text(encoding='utf-8'))
    except (ValueError, OSError):
        continue
    if record.get('operation') != 'capture_browser_scenario':
        continue
    url = record.get('parameters', {}).get('start_url', {}).get('url', '')
    if not url.startswith('https://labex.io/'):
        continue
    print(json.dumps({'saved_step': file.parent.name, 'evidence': record.get('evidence_id'),
                      'start_url': url}, ensure_ascii=False))
    for step in record.get('normalized_result', {}).get('steps', []):
        dom = step.get('artifacts', {}).get('dom', {}).get('value', {}).get('text', '')
        headings = Headings()
        headings.feed(dom)
        print(json.dumps({'step': step.get('step_id'), 'status': step.get('status'),
                          'url': step.get('after_url', {}).get('url'),
                          'headings': headings.values[:24]}, ensure_ascii=False))
