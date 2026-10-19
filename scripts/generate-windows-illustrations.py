"""Create deterministic, bilingual SVG teaching illustrations, never fake VM screenshots."""
import copy
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'client/public/guides/windows'
OUT.mkdir(parents=True, exist_ok=True)
BLUE = '#2563eb'
INK = '#0f172a'


def text(x, y, value, size=20, color=INK, weight=400):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}">{escape(value)}</text>'


def rect(x, y, w, h, fill='#ffffff', stroke='#cbd5e1', radius=10):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}"/>'


def line(x1, y1, x2, y2, color='#94a3b8', width=2):
    return f'<path d="M{x1} {y1} L{x2} {y2}" fill="none" stroke="{color}" stroke-width="{width}"/>'


def badge(x, y, label):
    return f'<circle cx="{x}" cy="{y}" r="15" fill="{BLUE}"/>' + text(x-6, y+6, str(label), 18, '#ffffff', 700)


def node(x, y, w, title, detail, kind='OU', fill='#eff6ff'):
    return rect(x, y, w, 75, fill, '#bfdbfe') + text(x+16, y+26, kind, 13, BLUE, 700) + text(x+16, y+51, title, 21, INK, 600) + (text(x+16, y+69, detail, 12, '#475569') if detail else '')


def frame(title, subtitle, body, lang, height=690):
    note = 'Hình minh họa • Không phải ảnh chụp VM • Tên miền là ví dụ' if lang == 'vi' else 'Illustration • Not a VM screenshot • Example domain names'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="{height}" viewBox="0 0 800 {height}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(subtitle)}</desc>
<g font-family="Segoe UI, Arial, sans-serif">
<rect width="800" height="{height}" fill="#f8fafc"/>
{rect(18,18,764,height-36,'#ffffff','#e2e8f0',16)}
{text(42,59,title,25,INK,700)}{text(42,87,subtitle,15,'#475569')}
{line(42,105,758,105,'#e2e8f0')}{body}
{text(42,height-35,note,12,'#64748b')}
</g></svg>'''


def window(title, y=145, height=425):
    return rect(42,y,716,height,'#ffffff','#cbd5e1',5) + rect(42,y,716,40,'#eff6ff','#bfdbfe',5) + text(59,y+26,title,19,INK,600) + text(723,y+27,'×',25,'#64748b')


def field(y, label, value, number=None):
    return (badge(74,y+20,number) if number else '') + text(106,y+8,label,16,'#475569') + rect(106,y+18,586,39,'#ffffff','#94a3b8',4) + text(119,y+44,value,20,INK,600)


def pictures(lang):
    vi = lang == 'vi'
    result = {}
    b = node(42,130,716,'corp.local','Tên miền ví dụ' if vi else 'Example domain','DOMAIN')
    b += line(76,205,76,238)+node(100,225,658,'Company_HQ','Tổng công ty' if vi else 'Head office')+line(76,238,100,238)
    b += line(134,300,134,520)+line(134,340,160,340)+node(160,315,598,'IT_Department','Phòng Công nghệ' if vi else 'IT department')
    b += line(459,390,459,395)+line(350,395,628,395)+line(350,395,350,401)+line(628,395,628,401)+node(222,401,256,'david.miller','','USER','#f0fdf4')
    b += node(498,401,260,'Sec_IT_Admins','','GROUP','#f5f3ff')
    b += line(134,520,160,520)+node(160,500,598,'Sales_Department','Phòng Kinh doanh (nhánh minh họa)' if vi else 'Sales department (illustrative branch)')
    result['ad-structure'] = frame('Cây tổ chức Active Directory' if vi else 'Active Directory organization', 'Domain → OU → User / Security Group', b, lang)

    b = rect(42,130,716,78,'#eff6ff','#bfdbfe') + badge(70,168,1) + text(99,163,'Server Manager  →  Tools',21,INK,600) + text(99,190,'Active Directory Users and Computers',19,BLUE,600)
    b += text(42,244,'Hoặc: Windows + R  →  dsa.msc  →  Enter' if vi else 'Or: Windows + R  →  dsa.msc  →  Enter',20,INK,600)
    b += window('Active Directory Users and Computers',272,285)
    b += rect(55,326,291,218,'#f8fafc','#e2e8f0',3)+text(75,354,'▾  corp.local',21,BLUE,600)
    for y, name in ((394,'Builtin'),(434,'Computers'),(474,'Users')):
        b += line(93,363,93,y-7)+line(93,y-7,116,y-7)+text(124,y,name,20)
    b += text(365,361,'Chọn domain của bạn' if vi else 'Select your domain',20,INK,600)+text(365,390,'Tên thực tế có thể khác corp.local.' if vi else 'Its name may differ from corp.local.',15,'#475569')
    b += text(365,436,'Builtin / Computers / Users',17,BLUE,600)+text(365,465,'là các container có sẵn.' if vi else 'are built-in containers.',16,'#475569')
    result['ad-open-console'] = frame('Mở công cụ ADUC' if vi else 'Open the ADUC console','AD DS / RSAT phải được cài trước' if vi else 'AD DS / RSAT tools must be available first',b,lang)

    b = badge(59,154,1)+text(86,161,'corp.local  →  New  →  Organizational Unit',21,INK,600)
    b += window('New Object - Organizational Unit',190,280)+field(250,'Name:','Company_HQ')
    b += text(106,358,'☑  Protect container from accidental deletion',18)+rect(578,405,114,38,'#2563eb','#2563eb',5)+text(620,431,'OK',20,'#ffffff',600)
    b += badge(59,518,2)+text(86,525,'Company_HQ  →  New  →  Organizational Unit',20,INK,600)+text(86,561,'Name: IT_Department',23,BLUE,700)
    result['ad-create-ou'] = frame('Tạo OU cha và OU con' if vi else 'Create parent and child OUs','Tạo Company_HQ trước, sau đó tạo IT_Department bên trong.' if vi else 'Create Company_HQ first, then IT_Department inside it.',b,lang)

    b = text(42,141,'IT_Department  →  New  →  User',21,BLUE,600)+window('New Object - User',165,420)
    b += field(226,'First name:','David',1)+field(306,'Last name:','Miller',2)+field(386,'User logon name:','david.miller    @corp.local',3)
    b += rect(568,521,124,39,'#2563eb','#2563eb',5)+text(591,548,'Next >',20,'#ffffff',600)
    b += text(42,620,'Bước tiếp: đặt mật khẩu → Next → Finish.' if vi else 'Next: set a password → Next → Finish.',18,INK,600)
    result['ad-create-user'] = frame('Tạo tài khoản David Miller' if vi else 'Create the David Miller account','Chọn OU IT_Department trước khi mở wizard.' if vi else 'Select IT_Department before opening the wizard.',b,lang,710)

    b = window('Sec_IT_Admins Properties',140,415)
    b += text(65,216,'General',18,'#64748b')+rect(168,191,120,38,'#eff6ff','#2563eb',4)+text(186,216,'Members',18,BLUE,700)+text(310,216,'Member Of',18,'#64748b')
    b += text(65,260,'Members:',18)+rect(65,277,670,133,'#ffffff','#94a3b8',2)+rect(76,290,648,39,'#eff6ff','#bfdbfe',2)+text(93,317,'David Miller  (david.miller)',21,INK,600)
    b += badge(91,458,1)+rect(116,438,119,38,'#eff6ff','#2563eb',4)+text(147,464,'Add…',19,BLUE,600)+text(252,462,'→ david.miller → Check Names → OK',18)
    b += badge(490,516,2)+rect(514,496,110,37,'#2563eb','#2563eb',4)+text(549,522,'Apply',18,'#ffffff',600)+rect(639,496,96,37)+text(672,522,'OK',18)
    b += text(42,604,'Group scope: Global   •   Group type: Security',20,BLUE,600)
    result['ad-group-members'] = frame('Thêm thành viên vào nhóm' if vi else 'Add a security group member','Sec_IT_Admins → Properties → Members',b,lang)

    b = node(42,130,716,'IIS Manager','inetmgr','SERVER')+line(76,205,76,475)
    b += line(76,260,105,260)+node(105,232,653,'Application Pools','Chạy ứng dụng bằng worker process w3wp.exe' if vi else 'Runs applications using w3wp.exe worker processes','POOL')
    b += line(76,365,105,365)+node(105,336,653,'Sites','Website và HTTP binding' if vi else 'Websites and HTTP bindings','SITES')
    b += line(140,411,140,540)+line(140,449,169,449)+node(169,425,589,'Default Web Site','http  •  port 80','WEBSITE')
    b += line(140,539,169,539)+node(169,517,589,'PortalCorp','http  •  port 8080  •  C:\\inetpub\\wwwroot','WEBSITE','#f0fdf4')
    result['iis-structure'] = frame('Kiến trúc IIS trong bài lab' if vi else 'IIS structure in this lab','PortalCorp dùng thư mục và cổng đúng theo bước thực hành.' if vi else 'PortalCorp uses the folder and port specified by this lab.',b,lang)

    b = rect(42,130,716,66,'#eff6ff','#bfdbfe')+text(64,170,'Windows + R  →  inetmgr  →  Enter',22,BLUE,600)
    b += window('Internet Information Services (IIS) Manager',220,340)
    b += text(61,287,'Connections',18,'#475569',600)+text(64,328,'▾  YOUR-SERVER',21,INK,600)+text(91,370,'Application Pools',19)+rect(83,390,255,39,'#eff6ff','#bfdbfe',4)+text(96,418,'▾  Sites',21,BLUE,600)+text(122,462,'Default Web Site',18)
    b += line(352,393,393,393,BLUE,3)+badge(423,393,1)+text(449,397,'Sites: chuột phải' if vi else 'Right-click Sites',20,INK,600)+rect(401,422,329,65,'#eff6ff','#2563eb',6)+text(425,463,'Add Website…',24,BLUE,700)
    result['iis-open-manager'] = frame('Mở IIS Manager và thêm website' if vi else 'Open IIS Manager and add a site','Tên máy chủ trong cây Connections có thể khác hình.' if vi else 'The server name in Connections will vary.',b,lang)

    b = window('Add Website',130,450)+field(190,'Site name:','PortalCorp',1)+field(270,'Physical path:','C:\\inetpub\\wwwroot',2)
    b += field(350,'Binding:','Type: http   •   IP: All Unassigned   •   Port: 8080',3)
    b += text(106,459,'☑  Start Website immediately',19)+rect(578,510,114,39,'#2563eb','#2563eb',5)+text(619,537,'OK',20,'#ffffff',600)
    b += text(42,625,'Kiểm tra trên VM: http://localhost:8080' if vi else 'Test inside the VM: http://localhost:8080',20,BLUE,600)
    result['iis-add-website'] = frame('Điền cấu hình website PortalCorp' if vi else 'Configure the PortalCorp website','Port 8080 tránh xung đột với Default Web Site ở port 80.' if vi else 'Port 8080 avoids the Default Web Site binding on port 80.',b,lang,710)
    return result


NAMES = {
    'ad-structure': ('Sơ đồ domain, OU, người dùng và nhóm — minh họa', 'Domain, OU, user and group structure — illustration'),
    'ad-open-console': ('Mở ADUC từ Tools hoặc dsa.msc — minh họa', 'Open ADUC from Tools or dsa.msc — illustration'),
    'ad-create-ou': ('Tạo Company_HQ và OU con IT_Department — minh họa', 'Create Company_HQ and child OU IT_Department — illustration'),
    'ad-create-user': ('Điền thông tin David Miller trong New Object - User — minh họa', 'David Miller in the New Object - User wizard — illustration'),
    'ad-group-members': ('Thêm david.miller vào Members của Sec_IT_Admins — minh họa', 'Add david.miller to Sec_IT_Admins Members — illustration'),
    'iis-structure': ('Sơ đồ Application Pools và Sites trong IIS — minh họa', 'IIS Application Pools and Sites — illustration'),
    'iis-open-manager': ('Chọn Sites và Add Website trong IIS Manager — minh họa', 'Select Sites and Add Website in IIS Manager — illustration'),
    'iis-add-website': ('Cấu hình PortalCorp, thư mục gốc và cổng 8080 — minh họa', 'PortalCorp physical path and port 8080 settings — illustration'),
}
SECTION_IMAGES = {'win-ad-01-sec-0': 'ad-structure', 'win-ad-01-sec-1': 'ad-open-console',
                  'win-ad-01-sec-2': 'ad-create-user', 'win-ad-01-sec-3': 'ad-group-members',
                  'win-iis-05-sec-0': 'iis-structure', 'win-iis-05-sec-1': 'iis-open-manager'}


def image(name, lang):
    label = NAMES[name][0 if lang == 'vi' else 1]
    return f'![{label}](/guides/windows/{name}-{lang}.svg)'


def main():
    for lang in ('en', 'vi'):
        for name, svg in pictures(lang).items():
            (OUT / f'{name}-{lang}.svg').write_text(svg, encoding='utf-8')
    changed = 0
    for path in (ROOT / 'server/data/labs').glob('win-*.json'):
        lab = json.loads(path.read_text(encoding='utf-8'))
        previous = copy.deepcopy(lab)
        for entity in [*lab.get('sections', []), *lab.get('steps', [])]:
            name = SECTION_IMAGES.get(entity['id'])
            if not name:
                continue
            for field, lang in (('content', 'en'), ('content_vi', 'vi')):
                if field not in entity:
                    continue
                body = entity[field]
                if '/guides/windows/screenshots/' in body:
                    # The user chose authentic screenshots over schematic art.
                    # Regenerating old SVG assets must not change that choice.
                    continue
                # Only replace diagram fences. Executable code stays untouched.
                def replace(match):
                    block = match.group(0)
                    return image(name, lang) if any(token in block for token in ('+---', '└', '├', 'Cửa sổ MMC')) else block
                body = re.sub(r'```[^\n]*\n.*?```', replace, body, flags=re.S)
                if f'/guides/windows/{name}-{lang}.svg' not in body:
                    heading = re.match(r'^.*?\n', body)
                    at = heading.end() if heading else 0
                    body = body[:at] + '\n' + image(name, lang) + '\n\n' + body[at:]
                if entity['id'] == 'win-ad-01-sec-1' and f'ad-create-ou-{lang}.svg' not in body:
                    body += '\n\n' + image('ad-create-ou', lang) + '\n'
                if entity['id'] == 'win-iis-05-sec-1' and f'iis-add-website-{lang}.svg' not in body:
                    body += '\n\n' + image('iis-add-website', lang) + '\n'
                # Markdown has no math plugin; render literal arrows cleanly.
                body = body.replace('$\\rightarrow$', '→')
                entity[field] = body
        if lab != previous:
            backup = ROOT / '.artifacts/windows-before-illustrations'
            backup.mkdir(parents=True, exist_ok=True)
            if not (backup / path.name).exists():
                (backup / path.name).write_text(path.read_text(encoding='utf-8'), encoding='utf-8')
            path.write_text(json.dumps(lab, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            changed += 1
    print(f'Generated 16 SVG illustrations; updated {changed} Windows labs without changing graders or step IDs.')


if __name__ == '__main__':
    main()
