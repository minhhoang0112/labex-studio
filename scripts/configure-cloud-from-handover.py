"""Copy the user's supplied RDP configuration to the ignored backend .env.

Never print credentials or put them in browser bundles.
"""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
document = (root / 'CODEX_BACKEND_HANDOVER.md').read_text(encoding='utf-8-sig')
credentials = re.search(r'Tài khoản quản trị:\*\*\s*`([^`]+)`\s*/\s*`([^`]+)`', document)
if not credentials:
    raise SystemExit('No admin credentials found in the user-supplied handover; no config changed.')
path = root / '.env'
content = path.read_text(encoding='utf-8-sig') if path.exists() else ''
settings = {'WINDOWS_ADMIN_USERNAME': credentials[1], 'WINDOWS_ADMIN_PASSWORD': credentials[2],
            'WINDOWS_RDP_IGNORE_CERT': 'true'}
count = 0
for key, value in settings.items():
    if re.search(r'(?m)^\s*' + re.escape(key) + r'\s*=', content):
        continue
    content = content.rstrip() + '\n' + key + '=' + value + '\n'
    count += 1
path.write_text(content, encoding='utf-8')
print(f'Saved {count} backend-only RDP settings; values not displayed.')
