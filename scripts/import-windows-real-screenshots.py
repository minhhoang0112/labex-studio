"""Import unmodified Windows Server 2022 reference screenshots with attribution."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import struct
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'client/public/guides/windows/screenshots'
OUT.mkdir(parents=True, exist_ok=True)
BASE = 'https://www.server-world.info/en/Windows_Server_2022/'
PAGES = {name: f'https://www.server-world.info/en/note?os=Windows_Server_2022&p={topic}&f={number}'
         for name, topic, number in [('users','active_directory',4),('groups','active_directory',6),
                                      ('ou','active_directory',7),('iis','iis',4)]}
SOURCES = [
    ('ad-tools-menu', 'active_directory', 31, 'users'),
    ('ad-new-user-menu', 'active_directory', 32, 'users'),
    ('ad-user-details', 'active_directory', 33, 'users'),
    ('ad-user-password', 'active_directory', 34, 'users'),
    ('ad-new-group-menu', 'active_directory', 45, 'groups'),
    ('ad-group-details', 'active_directory', 46, 'groups'),
    ('ad-group-members', 'active_directory', 48, 'groups'),
    ('ad-add-group-member', 'active_directory', 49, 'groups'),
    ('ad-new-ou-menu', 'active_directory', 51, 'ou'),
    ('ad-ou-details', 'active_directory', 52, 'ou'),
    ('ad-ou-tree', 'active_directory', 53, 'ou'),
    ('iis-add-site-menu', 'iis', 24, 'iis'),
    ('iis-site-details', 'iis', 25, 'iis'),
    ('iis-sites-list', 'iis', 26, 'iis'),
]


def download(item):
    name, folder, number, page = item
    url = f'{BASE}{folder}/img/{number}.png'
    target = OUT / f'{name}.png'
    if target.exists():
        data = target.read_bytes()
    else:
        with urlopen(Request(url, headers={'User-Agent': 'LabExLocalReferenceCollector/1.0'}), timeout=30) as response:
            data = response.read()
        if data[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError(f'Not a PNG screenshot: {name}')
        target.write_bytes(data)
    width, height = struct.unpack('>II', data[16:24])
    return {'id':name, 'file':f'{name}.png', 'image_url':url, 'source_page':PAGES[page],
            'publisher':'Server World', 'product':'Windows Server 2022', 'kind':'reference-screenshot',
            'unmodified':True, 'width':width, 'height':height, 'sha256':hashlib.sha256(data).hexdigest()}


def picture(name, vi, caption):
    label = ('Ảnh Windows Server 2022 thật: ' if vi else 'Real Windows Server 2022 screenshot: ') + caption
    return f'![{label}](/guides/windows/screenshots/{name}.png)'


def main():
    with ThreadPoolExecutor(max_workers=4) as pool:
        inventory = list(pool.map(download, SOURCES))
    manifest = {'imported_at': datetime.now(timezone.utc).isoformat(), 'images':inventory,
                'note':'Unmodified reference screenshots, not captures of the local Azure VM. Preserve attribution.'}
    (OUT / 'sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    by_id = {item['id']:item for item in inventory}
    selections = {
        'win-ad-01-sec-0': [('ad-ou-tree','Cây domain và OU trong ADUC','Domain and OU tree in ADUC')],
        'win-ad-01-sec-1': [('ad-tools-menu','Server Manager → Tools → ADUC','Server Manager → Tools → ADUC'),
                          ('ad-new-ou-menu','Chuột phải domain → New → Organizational Unit','Right-click domain → New → Organizational Unit'),
                          ('ad-ou-details','Cửa sổ New Object - Organizational Unit','New Object - Organizational Unit dialog')],
        'win-ad-01-sec-2': [('ad-new-user-menu','Chọn New → User','Select New → User'),
                          ('ad-user-details','Các trường thông tin của New Object - User','New Object - User fields'),
                          ('ad-user-password','Trang mật khẩu và tùy chọn tài khoản','Password and account options')],
        'win-ad-01-sec-3': [('ad-new-group-menu','Chọn New → Group','Select New → Group'),
                          ('ad-group-details','Group name, Group scope và Group type','Group name, Group scope and Group type'),
                          ('ad-group-members','Tab Members của nhóm','Group Members tab'),
                          ('ad-add-group-member','Chọn user trong cửa sổ Select Users','Select a user in the Select Users dialog')],
        'win-iis-05-sec-0': [('iis-sites-list','Danh sách Sites trong IIS Manager','Sites list in IIS Manager')],
        'win-iis-05-sec-1': [('iis-add-site-menu','Chọn Sites → Add Website','Select Sites → Add Website'),
                           ('iis-site-details','Cửa sổ Add Website đầy đủ thông số','Full Add Website configuration dialog')],
    }
    changed = 0
    for filename in ('win-server-ad-users-groups.json', 'win-server-iis-web.json'):
        path = ROOT / 'server/data/labs' / filename
        original = path.read_text(encoding='utf-8')
        lab = json.loads(original)
        for entity in [*lab.get('sections',[]), *lab.get('steps',[])]:
            selected = selections.get(entity['id'])
            if not selected:
                continue
            for field, vi in [('content',False),('content_vi',True)]:
                if field not in entity:
                    continue
                content = entity[field]
                # Replace every old vector illustration with one real reference
                # gallery at the first picture position. Preserve commands/text.
                old = r'!\[[^\]]*\]\(/guides/windows/(?!screenshots/)[^)]+\.svg\)'
                if not re.search(old, content):
                    continue
                galleries = []
                if filename.startswith('win-server-ad'):
                    note = ('> **Ảnh chụp giao diện thật — ảnh tham khảo, không phải VM hiện tại.** Nguồn Server World dùng domain `srv.world`, OU `Hiroshima`, user `ADUser01` và nhóm `Development01`. Trong bài này, dùng domain của bạn và các tên `Company_HQ`, `IT_Department`, `david.miller`, `Sec_IT_Admins` theo hướng dẫn; không chép tên mẫu trong ảnh.' if vi else
                            '> **Real reference screenshots, not the current VM.** Server World uses `srv.world`, `Hiroshima`, `ADUser01` and `Development01`. Follow this lab using your own domain and `Company_HQ`, `IT_Department`, `david.miller`, `Sec_IT_Admins`; do not copy the sample names in the images.')
                else:
                    note = ('> **Ảnh chụp giao diện thật — ảnh tham khảo, không phải VM hiện tại.** Tên site, đường dẫn và binding trong ảnh thuộc ví dụ của Server World. Với bài này, điền `PortalCorp`, `C:\\inetpub\\wwwroot`, Type `http`, IP `All Unassigned`, Port `8080`; không chép các giá trị mẫu trong ảnh.' if vi else
                            '> **Real reference screenshots, not the current VM.** Site names, paths and bindings in the images belong to the Server World example. For this lab use `PortalCorp`, `C:\\inetpub\\wwwroot`, Type `http`, IP `All Unassigned`, Port `8080`, rather than copying the image values.')
                galleries.append(note)
                for name, label_vi, label_en in selected:
                    source = by_id[name]['source_page']
                    caption = label_vi if vi else label_en
                    galleries.append(picture(name, vi, caption) + f'\n\n*Nguồn / Source: [Server World — Windows Server 2022]({source}).*')
                gallery = '\n\n'.join(galleries)
                first = True
                def replace(_match):
                    nonlocal first
                    if first:
                        first = False
                        return gallery
                    return ''
                entity[field] = re.sub(old, replace, content)
        updated = json.dumps(lab, ensure_ascii=False, indent=2)+'\n'
        if updated != original:
            backup = ROOT / '.artifacts/windows-before-real-screenshots'
            backup.mkdir(parents=True, exist_ok=True)
            if not (backup / filename).exists():
                (backup / filename).write_text(original, encoding='utf-8')
            path.write_text(updated, encoding='utf-8')
            changed += 1
    print(f'Imported {len(inventory)} unmodified PNG screenshots; updated {changed} lessons. Each image retains source attribution.')
    for item in inventory:
        print(f"{item['id']}: {item['width']}x{item['height']}")


if __name__ == '__main__':
    main()
