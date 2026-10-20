"""Align the four existing Antigravity lessons with the real Windows backend.

Only updates these four files; keeps IDs, course membership, tickets and order.
Backs up their exact prior contents before writing.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKUP = ROOT / '.artifacts/windows-support-before-backend-alignment'


def main():
    BACKUP.mkdir(parents=True, exist_ok=True)
    for file in sorted((ROOT / 'server/data/labs').glob('win-it-*.json')):
        if file.stem not in {'win-it-pc-onboarding-setup', 'win-it-printer-spooler-fix',
                             'win-it-network-dns-troubleshoot', 'win-it-disk-cleanup-recovery'}:
            continue
        original = file.read_bytes()
        if not (BACKUP / file.name).exists():
            (BACKUP / file.name).write_bytes(original)
        lab = json.loads(original.decode('utf-8-sig'))
        lab['target_vm'] = 'client'
        lab['curriculum_version'] = 2
        for section in lab.get('sections', []):
            for key in ('content', 'content_vi'):
                text = section.get(key, '')
                text = text.replace('**Giải pháp:** Luôn cấu hình Unikey chạy `Run as administrator`.',
                                    '**Cách xử lý:** Trước tiên tránh chạy ứng dụng người dùng bằng quyền Administrator nếu không cần. Kiểm tra mức quyền của ứng dụng và bộ gõ; chỉ nâng quyền bộ gõ khi có lý do rõ ràng và nguồn phần mềm đáng tin cậy. Không đặt mọi ứng dụng luôn chạy Admin.')
                text = text.replace('# Giải phóng địa chỉ IP cũ đang bị lỗi\nipconfig /release\n\n# Yêu cầu DHCP Server cấp phát địa chỉ IP mới\nipconfig /renew',
                                    '# Trên Azure: chỉ đọc cấu hình của management adapter\nGet-NetIPConfiguration\n\n# Không chạy ipconfig /release trên card đang giữ RDP và VM Agent.\n# Thực hành release/renew cần mạng lab riêng; bài này không nạp lỗi DHCP/APIPA.')
                text = text.replace('*(Sau bước này, bạn có thể gửi lệnh in tài liệu mới hoàn toàn bình thường)*',
                                    'Bộ chấm kiểm tra Spooler chạy và thư mục queue sạch. Đây là bài khôi phục dịch vụ với tệp orphan do lab tạo, không giả lập được toàn bộ lỗi driver hoặc chứng minh máy in vật lý đã in thành công.')
                section[key] = text.replace('$\\to$', '→').replace('$\\rightarrow$', '→')
        if lab['id'] == 'win-it-network-dns-troubleshoot':
            lab['title'] = lab['title_vi'] = 'Chẩn Đoán Mạng Và Sửa Hosts Của Portal Nội Bộ'
            lab['ticket']['title'] = 'Không mở được portal.company.local trong môi trường thực hành'
            section = lab['sections'][2]
            content = '''### Sửa phân giải tên rồi kiểm tra dịch vụ

Bấm **Chuẩn bị sự cố** sau khi CLIENT01 và baseline sẵn sàng. Lab dựng portal thật trên loopback `127.0.0.1:18080`, rồi đổi riêng tên `portal.company.local` trong hosts sang địa chỉ sai. Không đổi DNS/card mạng quản lý Azure.

```powershell
Get-Content "$env:windir\\System32\\drivers\\etc\\hosts"
[System.Net.Dns]::GetHostAddresses('portal.company.local')
```

Mở Notepad bằng quyền Administrator, mở hosts và sửa **riêng dòng portal.company.local** về `127.0.0.1 portal.company.local`. Giữ nguyên các dòng khác. Xóa cache sau khi sửa:

```powershell
Clear-DnsClientCache
Invoke-WebRequest 'http://portal.company.local:18080/' -UseBasicParsing -UseDefaultCredentials
```

Kết quả mong đợi: tên phân giải về 127.0.0.1 và portal trả `LabEx training portal OK`. Chỉ xóa dòng sai hoặc chạy flushdns chưa đủ: phải phân giải và truy cập đúng dịch vụ. `nslookup` truy vấn DNS trực tiếp nên không dùng riêng nó để kết luận hosts có hoạt động.
'''
            section['content'] = section['content_vi'] = content
            section['task'] = section['task_vi'] = 'Sửa hosts để portal.company.local phân giải đúng và portal HTTP hoạt động.'
            section['hint'] = section['hint_vi'] = 'Sửa riêng dòng portal.company.local về 127.0.0.1, giữ nguyên các dòng khác; sau đó kiểm tra tên và HTTP port 18080.'
        if lab['id'] == 'win-it-disk-cleanup-recovery':
            note = 'Phiên thực hành tạo tối đa 256 MiB log mẫu; không làm đầy thật ổ C hoặc xóa dữ liệu nhân viên.'
            if note not in lab['overview']:
                lab['overview'] += ' ' + note
            lab['title'] = lab['title_vi'] = 'Tìm Và Dọn Log Mẫu An Toàn Trên Ổ C'
            section = lab['sections'][2]
            content = '''### Đo và dọn đúng dữ liệu lab

Bấm **Chuẩn bị sự cố** để tạo tối đa 256 MiB log tại `C:\\Windows\\Temp\\DummyLogs`. Lab giữ ít nhất 5 GiB trống trước khi tạo; đây là bài tìm dữ liệu tăng dung lượng, không làm đầy ổ hệ điều hành.

```powershell
Get-ChildItem 'C:\\Windows\\Temp\\DummyLogs' -File | Measure-Object Length -Sum
Get-Content 'C:\\LabEx\\Keep\\employee-note.txt'
```

Mở File Explorer tới đúng thư mục DummyLogs, xác minh đây là log mẫu của bài rồi xóa các file log trong thư mục đó. Không xóa toàn bộ Windows Temp, Downloads hay thư mục người dùng. Giữ nguyên `C:\\LabEx\\Keep\\employee-note.txt`.

```powershell
Get-PSDrive -PSProvider FileSystem
```

Bộ chấm chấp nhận thư mục DummyLogs còn tồn tại nhưng đã sạch (tối đa 1 MiB) và yêu cầu tài liệu được giữ nguyên nội dung. Không chỉ chấm theo tên thư mục biến mất. Ở môi trường thật, phải xác định chủ dữ liệu, retention và phương án backup trước khi dọn.
'''
            section['content'] = section['content_vi'] = content
            section['task'] = section['task_vi'] = 'Dọn log mẫu trong DummyLogs xuống tối đa 1 MiB và giữ nguyên tài liệu nhân viên.'
            section['hint'] = section['hint_vi'] = 'Đo dung lượng trước/sau; chỉ dọn C:\\Windows\\Temp\\DummyLogs, không xóa employee-note.txt.'
        if lab['id'] == 'win-it-printer-spooler-fix':
            note = 'Lab tạo sự cố dịch vụ dừng và tệp orphan mẫu, không tạo một print job Windows hợp lệ hoặc máy in vật lý.'
            if note not in lab['overview']:
                lab['overview'] += ' ' + note
            lab['sections'][2]['hint'] = lab['sections'][2]['hint_vi'] = 'Dừng Spooler, dọn tệp LabEx-orphan.SHD/SPL trong PRINTERS, khởi động lại Spooler và kiểm tra queue sạch.'
        if lab['id'] == 'win-it-pc-onboarding-setup':
            first_login = '\n\n### Kết nối máy mới lần đầu\nWindows có thể mở màn hình **Choose privacy settings for your device** khi tài khoản đăng nhập lần đầu. Đọc từng lựa chọn theo chính sách thiết bị bạn muốn áp dụng, chọn **Next** và **Accept** khi đã xem xong. Sau khi vào desktop, tiếp tục các bước Start → Settings bên dưới. Không cần tài khoản Microsoft cá nhân để làm các bài lab với tài khoản local đã cấp.'
            for key in ('content', 'content_vi'):
                if '### Kết nối máy mới lần đầu' not in lab['sections'][0][key]:
                    lab['sections'][0][key] += first_login
            lab['sections'][1]['title'] = lab['sections'][1]['title_vi'] = 'Cấu Hình Múi Giờ Việt Nam'
            lab['sections'][2]['title'] = lab['sections'][2]['title_vi'] = 'Ghi Nhận Tên Máy Và Tìm Hiểu Quyền Ứng Dụng'
            for key in ('content', 'content_vi'):
                note = '\n\nPhần bộ gõ là tài liệu tham khảo, chưa có tình huống Unikey được nạp và chấm tự động. Bước hiện tại chỉ kiểm tra ghi nhận tên máy CLIENT01.'
                if note.strip() not in lab['sections'][2][key]:
                    lab['sections'][2][key] += note
        sections = {item['id']: item for item in lab['sections']}
        for step in lab['steps']:
            section = sections[step['id']]
            # One canonical task description/content; do not retain stale duplicate instructions.
            for key in ('title', 'title_vi', 'content', 'content_vi', 'task', 'task_vi', 'hint', 'hint_vi'):
                if key in section:
                    step[key] = section[key]
            rule = {'kind': 'windows-remote', 'rule_id': step['id']}
            step['verification'] = rule
            section['verification'] = rule
            step['required_capabilities'] = section['required_capabilities'] = ['windows-remote']
        file.write_text(json.dumps(lab, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Aligned four Windows support lessons; originals retained in .artifacts.')


if __name__ == '__main__':
    main()
