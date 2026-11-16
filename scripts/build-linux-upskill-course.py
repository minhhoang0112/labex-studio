"""Build the attributed EN source + authored Vietnamese guided practice.
No course material is fetched at runtime; import the pinned source first.
"""
import json, hashlib, re
from pathlib import Path
BASE=Path('server/data/reference/linux-upskill-challenge')
manifest=json.loads((BASE/'manifest.json').read_text())
COURSE='linux-upskill-challenge'
SHA_HELLO='8d99142afd92576f30b0cd7cb42a8dc6809998bc5d607d88761f512e26c7db20'
START_GUIDE='''## Kết nối để bắt đầu học
**Không cần mở cửa sổ VMware.** Máy ảo lab riêng đã được thiết lập; nút trên web điều khiển nó chạy nền.

1. Bấm **Bật Ubuntu lab** trên thanh phía trên. Nếu đã thấy **Tắt Ubuntu lab**, máy đã được bật, không bấm lại nút tắt.
2. Chờ Ubuntu khởi động và SSH sẵn sàng, thường khoảng 30–60 giây. Web tự thử kết nối trong tối đa 2 phút.
3. Khi terminal bên phải hiện dấu nhắc như `luc@luc-lab:~$` và trạng thái **SSH đã sẵn sàng**, bấm vào terminal và gõ `whoami`, Enter. Kết quả là `luc`.
4. Nếu chưa có terminal sau thời gian chờ, bấm **Kiểm tra kết nối**. Không cần nhập IP, mật khẩu hoặc SSH key vào web.

Học xong, lưu công việc rồi bấm **Tắt Ubuntu lab**. Dữ liệu được giữ cho buổi sau. VM này tách riêng khỏi Ubuntu dùng cho dự án CV.

'''
# Each tuple: title, explanation, runnable guide, deliverable, state probe, reflection.
LESSONS=[
('Chuẩn bị Ubuntu Server riêng',
'Khóa dùng một VM xuyên suốt, không tạo lại môi trường mỗi ngày. Bạn sẽ có quyền sudo trên máy lab nên phải tách VM dự án CV ra. Bản triển khai local dùng VMware NAT, user luc đăng nhập SSH bằng key; không mở SSH ra Internet. Web chỉ là giao diện terminal, lệnh thực sự chạy trong VM.',
'''VM lab được cấu hình riêng; xem `docs/LINUX_UPSKILL_VM_LOCAL.md` trong dự án. Khi VM được bật và backend đã có cấu hình SSH, terminal bên phải sẽ kết nối thẳng vào máy đó.
```bash
whoami
hostnamectl
ps -p 1 -o comm=
sudo -n true
```
Kỳ vọng: user thường (không phải root), PID 1 là systemd và sudo dùng được trên VM lab. `sudo -n` phục vụ bộ chấm; cấu hình không hỏi mật khẩu chỉ dành cho VM học riêng đã được cấp key, không phải khuyến nghị cho server dùng chung. Key/fingerprint do bộ thiết lập tạo, không dán private key vào chat.
Tắt VM lab sau buổi học, giữ đĩa ảo. Muốn làm lại toàn khóa thì dùng snapshot baseline; nút reset từng bài bị tắt để tránh mất dữ liệu các ngày trước.''',
'Kết nối đúng VM Ubuntu Server bằng user thường và xác nhận systemd/sudo hoạt động.',
'test -n "$SSH_CONNECTION" && test "$(id -u)" -ne 0 && test "$(ps -p 1 -o comm= | xargs)" = systemd && . /etc/os-release && test "$ID" = ubuntu && sudo -n true',
'VM, container và terminal web khác nhau ở đâu? Vì sao không học trên VM đang chạy dự án CV?'),
('Làm quen server và SSH',
'SSH tạo phiên shell trên server từ xa. Kernel, bộ nhớ, dung lượng đĩa và uptime là các thông tin khác nhau; dung lượng RAM không phải dung lượng ổ đĩa. Lệnh chỉ đọc giúp lập baseline trước khi cấu hình.',
'''Chạy từng lệnh rồi giải thích kết quả:
```bash
whoami
uname -sr
uptime
free -h
df -h /
lsblk
```
`free` có cột available để ước lượng bộ nhớ còn dùng được; không kết luận thiếu RAM chỉ từ cột free. `df` xem filesystem đã mount, `lsblk` xem thiết bị khối.
Lưu một thông tin có thể đối chiếu với máy thật:
```bash
mkdir -p ~/luc-course/day01
uname -sr > ~/luc-course/day01/kernel.txt
```
Đây là kết quả lệnh ngắn, không phải script thu thập báo cáo dài. Mở thêm một phiên SSH từ PowerShell máy chính khi muốn luyện SSH client; terminal web cũng đi qua SSH.''',
'Đọc thông số server và lưu kernel.txt khớp kernel đang chạy.',
'test "$(cat "$HOME/luc-course/day01/kernel.txt")" = "$(uname -sr)"',
'Uptime khác load average thế nào? Vì sao RAM trống ít chưa chắc máy thiếu RAM?'),
('Điều hướng và tài liệu lệnh',
'Đường dẫn tuyệt đối bắt đầu từ /; đường dẫn tương đối tính từ thư mục hiện tại. Home của user khác thư mục root. Tra man để hiểu tùy chọn, không cần học thuộc mọi cờ.',
'''Thử `pwd`, `cd /var/log`, `cd ..`, `cd ~`, `ls -la`, rồi `man ls` (q để thoát). Đọc mô tả `cp`, `mv`, `mkdir`, `rmdir` trước khi dùng.
```bash
mkdir -p ~/luc-course/day02/archive
printf 'luc-navigation\\n' > ~/luc-course/day02/source.txt
cp ~/luc-course/day02/source.txt ~/luc-course/day02/archive/copy.txt
cmp ~/luc-course/day02/source.txt ~/luc-course/day02/archive/copy.txt
```
Tạo thêm thư mục tên bạn chọn, di chuyển rồi xóa **thư mục thử của mình** bằng rmdir. Không thử rm -rf trên đường dẫn hệ thống. Hai tệp ở trên là đầu ra quy ước cho bài chấm; ngoài chúng, tên thư mục luyện thêm tùy bạn.''',
'Tạo cây archive và bản sao đúng nội dung; tự thử di chuyển/xóa một thư mục rỗng.',
'test -d "$HOME/luc-course/day02/archive" && test "$(cat "$HOME/luc-course/day02/source.txt")" = luc-navigation && cmp -s "$HOME/luc-course/day02/source.txt" "$HOME/luc-course/day02/archive/copy.txt"',
'Khi đứng trong /var, cd log và cd /var/log có khác kết quả không?'),
('Sudo, hostname và múi giờ',
'User thường dùng sudo cho thay đổi hệ thống; không cần giữ cả buổi trong shell root. Hostname nhận diện máy, múi giờ ảnh hưởng cách đọc thời gian log. Đổi hostname không đổi IP hoặc tên resource cloud.',
'''Xem trước: `id`, `sudo -l`, `hostnamectl`, `timedatectl`. Trên **VM lab riêng**, thực hiện:
```bash
sudo hostnamectl set-hostname luc-lab
sudo timedatectl set-timezone Asia/Ho_Chi_Minh
hostnamectl --static
timedatectl show -p Timezone --value
```
Mở phiên mới để prompt có thể nhận hostname mới. Thử `sudo -i`, quan sát whoami rồi exit để về user thường. Không in toàn bộ /etc/shadow vào AI hoặc tài liệu bàn giao; chỉ cần hiểu user thường không được đọc hash mật khẩu.
Phần mở rộng nguồn có đổi mật khẩu và reboot: nếu thử reboot, kết nối web ngắt là bình thường, chờ VM lên rồi kết nối lại. Không thay SSH key backend giữa buổi.''',
'Hostname luc-lab và timezone Asia/Ho_Chi_Minh trên đúng VM lab.',
'test "$(hostnamectl --static)" = luc-lab && test "$(timedatectl show -p Timezone --value)" = Asia/Ho_Chi_Minh',
'Sudo khác đăng nhập root ở đâu? Vì sao log dùng UTC vẫn có thể là lựa chọn đúng ngoài thực tế?'),
('Cài phần mềm và cấu trúc hệ thống',
'apt update cập nhật danh sách gói; apt install cài phần mềm; apt upgrade nâng phiên bản đã cài. /etc chứa cấu hình, /var/log chứa log, /usr chứa phần lớn chương trình.',
'''Trên VM lab:
```bash
sudo apt update
sudo apt install -y mc tree
mc --version
tree --version
```
Mở mc để khám phá /etc và /var/log; F10 để thoát. Xem `dpkg -L tree` để biết gói đặt file ở đâu, `apt-cache policy tree` để biết nguồn/phiên bản. Nếu apt đang bị khóa do cập nhật nền, chờ tiến trình đó hoàn tất; không xóa lock hoặc kill dpkg tùy tiện.
Không cài gói lên Windows/WSL host thay cho VM. Bộ chấm đọc trạng thái gói trong VM.''',
'mc và tree được cài thực sự qua hệ thống gói của VM.',
"dpkg-query -W -f='${Status}' mc | grep -qx 'install ok installed' && dpkg-query -W -f='${Status}' tree | grep -qx 'install ok installed'",
'Vì sao apt update chưa làm phần mềm đã cài chuyển sang bản mới?'),
('Đọc văn bản, dotfile và nano',
'less cho cuộn/tìm nội dung mà không sửa; nano là trình soạn thảo. Tệp bắt đầu bằng dấu chấm thường bị ls thông thường ẩn đi, không phải cơ chế bảo mật.',
'''Dùng `less /etc/services`, tìm bằng /ssh rồi q. Thử `ls -a ~`, phím Tab và phím mũi tên lên trong shell.
```bash
mkdir -p ~/luc-course/day05
nano ~/luc-course/day05/notes.txt
```
Viết ít nhất ba dòng bằng lời của bạn: less dùng làm gì, dotfile là gì, và cách thoát/lưu nano. Trong nano: Ctrl+O, Enter để lưu; Ctrl+X để thoát. Đọc lại bằng `cat -n` và `less`. Chấm chỉ xác nhận tệp có ít nhất ba dòng không rỗng, không tự đánh giá đúng/sai phần giải thích.''',
'Tự soạn notes.txt có ít nhất ba dòng không rỗng và đọc lại.',
'test "$(grep -c "[^[:space:]]" "$HOME/luc-course/day05/notes.txt")" -ge 3',
'less, cat và nano khác nhau thế nào?'),
('Chỉnh sửa với Vim',
'Vim có chế độ normal để thao tác và insert để nhập chữ. Esc đưa về normal; :w ghi và :q thoát. :q! bỏ thay đổi nên cần hiểu trước khi dùng.',
'''Chạy vimtutor khi muốn luyện kỹ. Tạo file để thực hành:
```bash
mkdir -p ~/luc-course/day06
vim ~/luc-course/day06/service-note.txt
```
Bấm i, gõ `service=apache2` trên dòng đầu, Esc rồi :wq. Mở lại, thêm `status=ready`, lưu và dùng cat đọc lại. Thử tìm /apache2, di chuyển bằng h j k l, xóa một dòng thử với dd rồi undo bằng u. Bộ chấm chỉ kiểm tra nội dung file, không tuyên bố biết bạn đã dùng editor nào.''',
'service-note.txt có hai dòng service=apache2 và status=ready; tự luyện chế độ Vim.',
'grep -qx "service=apache2" "$HOME/luc-course/day06/service-note.txt" && grep -qx "status=ready" "$HOME/luc-course/day06/service-note.txt"',
'Vì sao mới mở Vim gõ chữ lại không vào? Cách thoát mà giữ hoặc bỏ thay đổi?'),
('Apache, dịch vụ, cấu hình và log',
'Service chạy nền không phụ thuộc cửa sổ terminal. Trạng thái active chưa đủ chứng minh HTTP phục vụ đúng nội dung; cần truy cập thật và đọc log. systemd là lý do khóa dùng VM đầy đủ.',
'''Cài và quan sát:
```bash
sudo apt install -y apache2 curl
systemctl status apache2 --no-pager
curl -I http://127.0.0.1/
```
Tự stop Apache rồi thử curl (phải thất bại); start lại và thử lại. Sau đó tạo trang riêng, giữ trang mặc định:
```bash
printf 'LUC service is working\\n' | sudo tee /var/www/html/luc.html
curl -fsS http://127.0.0.1/luc.html
sudo tail -n 5 /var/log/apache2/access.log
```
Xem DocumentRoot trong /etc/apache2/sites-enabled/000-default.conf; xem cấu hình include trong /etc/apache2/apache2.conf. Truy cập `http://IP_VM/luc.html` từ trình duyệt máy chính khi mạng/firewall cho phép. Không nhầm 127.0.0.1 của VM với 127.0.0.1 của Windows.''',
'Apache active và truy cập HTTP thật trả nội dung trang luc.html.',
"systemctl is-active --quiet apache2 && test \"$(curl -fsS --max-time 3 http://127.0.0.1/luc.html)\" = 'LUC service is working' && sudo -n grep -q '/luc.html' /var/log/apache2/access.log",
'Nếu service active nhưng trình duyệt không mở được, còn những lớp nào cần kiểm tra?'),
('Grep, pipeline và lọc log',
'Pipeline nối stdout lệnh trước vào stdin lệnh sau. grep lọc dòng, awk chọn trường, sort và uniq đếm/tổng hợp. Không phải log SSH ở mọi bản Ubuntu đều nằm trong auth.log; journalctl là nguồn thay thế.',
'''Đọc log thật ngày 7:
```bash
sudo tail -n 20 /var/log/apache2/access.log
sudo grep '/luc.html' /var/log/apache2/access.log | tail
```
Tạo dữ liệu nhỏ để thấy rõ từng bước, không cần chờ server bị dò quét:
```bash
mkdir -p ~/luc-course/day08
printf '10.0.0.1 GET 200\\n10.0.0.2 GET 404\\n10.0.0.1 POST 200\\n' > ~/luc-course/day08/access.txt
awk '{print $1}' ~/luc-course/day08/access.txt | sort | uniq -c | sort -nr > ~/luc-course/day08/top.txt
cat ~/luc-course/day08/top.txt
```
Chạy từng đoạn trước khi ghép pipeline. Kỳ vọng IP 10.0.0.1 xuất hiện hai lần và đứng đầu. Đây là dữ liệu mô phỏng để học xử lý văn bản, không phải log tấn công thật.''',
'top.txt phản ánh đúng tần suất IP trong access.txt.',
'''python3 - <<'PY'
from pathlib import Path
from collections import Counter
p=Path.home()/'luc-course/day08'
c=Counter(line.split()[0] for line in (p/'access.txt').read_text().splitlines())
assert c=={'10.0.0.1':2,'10.0.0.2':1}
actual=[line.split() for line in (p/'top.txt').read_text().splitlines()]
assert actual==[['2','10.0.0.1'],['1','10.0.0.2']]
PY''',
'Vì sao uniq -c thường cần sort trước?'),
('Mạng, cổng và firewall',
'Địa chỉ IP, socket lắng nghe, firewall và ứng dụng là các lớp khác nhau. ss cho biết cổng trên VM; curl thử ứng dụng; kiểm tra từ máy chính mới cho biết đường mạng tới VM. NAT VMware không đồng nghĩa public server.',
'''Giữ một phiên SSH đang mở và biết cách vào console VMware trước khi bật firewall. Kiểm tra cổng SSH thực tế trong cấu hình lab; VM mặc định dùng 22.
```bash
ip -br addr
ip route
ss -lnt
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw --force enable
sudo ufw status verbose
```
Mở **phiên SSH mới** và mở trang Apache từ Windows để thử end-to-end. Nếu SSH dùng cổng khác, allow đúng cổng đó trước enable. Nếu tự khóa, dùng console VMware sửa rule; không cần đổi mạng VM CV.
Bộ chấm kiểm tra UFW active, chính sách incoming deny và rule TCP 22/80. Nó không thay thế việc thử kết nối từ Windows, và không chấm các cổng khác ngoài hợp đồng bài này.''',
'UFW đang bật, incoming mặc định deny và cho phép TCP 22/80; tự kiểm tra phiên SSH mới và HTTP từ máy chính.',
"s=$(sudo -n env LC_ALL=C ufw status verbose) && printf '%s\\n' \"$s\" | grep -q 'Status: active' && printf '%s\\n' \"$s\" | grep -q 'Default: deny (incoming)' && printf '%s\\n' \"$s\" | grep -Eq '^22/tcp([[:space:]]+\\(OpenSSH\\))?[[:space:]]+ALLOW IN' && printf '%s\\n' \"$s\" | grep -Eq '^80/tcp[[:space:]]+ALLOW IN'",
'Cổng đang LISTEN nhưng kết nối từ máy chính thất bại có thể do đâu?'),
('Cron, at và systemd timer',
'Lịch chạy không dùng cửa sổ terminal hiện tại, nên dùng đường dẫn rõ ràng và xác định user chạy. Phân biệt crontab riêng, /etc/cron.* và systemd timer; không bắt sửa lịch của ứng dụng khác.',
'''Cài cron nếu cần: `sudo apt install -y cron`; xem `systemctl status cron`. Tạo thư mục và mở crontab của **user thường**:
```bash
mkdir -p ~/luc-course/day10
crontab -e
```
Thêm dòng (giữ nguyên các dòng khác):
```cron
* * * * * /usr/bin/date -Is >> "$HOME/luc-course/day10/heartbeat.log"
```
Cron thay $HOME bằng home user chạy; /usr/bin/date dùng đường dẫn đầy đủ. Chờ sang phút kế tiếp, đọc log, đợi thêm một phút để thấy dòng mới. Bộ chấm đợi một dòng timestamp gần hiện tại, không nhận file trống hoặc log cũ. Xem thêm `systemctl list-timers --all` và `at` trong bản gốc; không phải viết mọi lịch bằng cron.
Sau khi học có thể bỏ **đúng dòng của lab** bằng crontab -e, không dùng crontab -r nếu còn lịch khác.''',
'Cron active và đã ghi timestamp thật gần hiện tại vào heartbeat.log.',
'''systemctl is-active --quiet cron && crontab -l | grep -Fq 'luc-course/day10/heartbeat.log' && python3 - <<'PY'
from pathlib import Path
from datetime import datetime, timezone
p=Path.home()/'luc-course/day10/heartbeat.log'
lines=p.read_text().splitlines()
t=datetime.fromisoformat(lines[-1])
age=(datetime.now(timezone.utc)-t).total_seconds()
assert 0 <= age < 150
PY''',
'Vì sao chạy lệnh bằng tay được nhưng cron có thể không chạy được?'),
('Tìm tệp và chương trình',
'find tìm trên filesystem hiện tại; locate dùng chỉ mục có thể chưa cập nhật; command -v cho biết shell sẽ chạy chương trình nào. grep tìm trong nội dung, không thay thế tìm tên tệp.',
'''Tạo vài tệp rồi thử điều kiện:
```bash
mkdir -p ~/luc-course/day11/inputs
printf 'old\\n' > ~/luc-course/day11/inputs/a.log
printf 'keep\\n' > ~/luc-course/day11/inputs/b.txt
find ~/luc-course/day11/inputs -type f -name '*.log' -print
command -v bash
```
Lưu kết quả tìm vào ngoài thư mục inputs để không tự tìm thấy file đầu ra:
```bash
find ~/luc-course/day11/inputs -type f -name '*.log' -printf '%f\\n' | sort > ~/luc-course/day11/log-files.txt
```
Thử tìm theo -mtime hoặc -size nhưng quan sát bằng -print trước. Không ghép -delete lên cây hệ thống để luyện. Bộ chấm đối chiếu danh sách với các tệp .log thật, nên bạn có thể thêm tệp .log tên khác rồi chạy lại.''',
'log-files.txt liệt kê đầy đủ tệp .log thực có trong inputs.',
'''python3 - <<'PY'
from pathlib import Path
p=Path.home()/'luc-course/day11'
expected=sorted(x.name for x in (p/'inputs').rglob('*.log') if x.is_file())
assert expected and sorted((p/'log-files.txt').read_text().splitlines())==expected
PY''',
'Vì sao locate không thấy tệp mới nhưng find lại thấy?'),
('Truyền tệp bằng SFTP',
'SFTP truyền tệp qua SSH; không dùng FTP thường. Tệp tải lên nằm trên VM, tệp tải xuống nằm trên Windows. Có terminal SSH hoạt động chưa chứng minh bạn đã thử truyền tệp hai chiều.',
'''Trong VM tạo nơi nhận:
```bash
mkdir -p ~/luc-course/day12
```
Trên **PowerShell Windows**, tạo một tệp văn bản có dòng `LUC transfer test`, sau đó mở `sftp -i DUONG_DAN_KEY luc@IP_VM` (dùng đúng user/key lab). Trong SFTP:
```text
put upload.txt luc-course/day12/upload.txt
get luc-course/day12/upload.txt download.txt
bye
```
Trên Windows dùng `Get-FileHash upload.txt` và `Get-FileHash download.txt` để đối chiếu. Cũng có thể dùng WinSCP với cùng key và fingerprint đã xác nhận.
Bộ chấm ở bài này xác nhận tệp nhận trên VM có nội dung đúng. Nó **không xác minh đường truyền SFTP hoặc bản tải xuống Windows**; bạn cần tự đối chiếu hash hai phía. Không coi việc cp một tệp trong VM là đã thực hành truyền tệp.''',
'upload.txt trên VM chứa dòng LUC transfer test; tự xác nhận hash bản tải xuống Windows.',
'grep -qx "LUC transfer test" "$HOME/luc-course/day12/upload.txt"',
'SFTP dùng cổng nào và khác SCP/FTP ở đâu? Bằng chứng nào xác nhận truyền hai chiều?'),
('User, group và sudo có giới hạn',
'Tài khoản, group và quyền sudo là các khái niệm khác nhau. User hỗ trợ không cần thành quản trị viên đầy đủ; visudo kiểm tra cú pháp trước khi chấp nhận cấu hình.',
'''Tạo tài khoản thực hành không đăng nhập SSH bằng mật khẩu:
```bash
sudo adduser --disabled-password --gecos '' luc-helper
sudo groupadd -f luc-ops
sudo usermod -aG luc-ops luc-helper
id luc-helper
```
Không chạy adduser lần nữa nếu tài khoản đã có. Trong bài sudo nâng cao, dùng `sudo visudo -f /etc/sudoers.d/luc-helper` để cấp **chỉ** quyền xem trạng thái Apache theo ví dụ nguồn; không cấp ALL. Kiểm tra bằng `sudo -l -U luc-helper` và `sudo -u luc-helper -H bash` rồi exit.
Bộ chấm chính kiểm tra user/home/group và không thuộc sudo hoặc adm; việc giới hạn sudoers là phần tự kiểm tra riêng. Không thay tài khoản luc đang dùng để backend kết nối.''',
'luc-helper có home đúng owner, thuộc luc-ops, không thuộc sudo/adm.',
'''id luc-helper >/dev/null && test -d /home/luc-helper && test "$(stat -c %U /home/luc-helper)" = luc-helper && id -nG luc-helper | tr ' ' '\n' | grep -qx luc-ops && ! id -nG luc-helper | tr ' ' '\n' | grep -Eq '^(sudo|adm)$' ''',
'usermod -G khác usermod -aG ở đâu? Vì sao phải dùng visudo?'),
('Quyền tệp, thư mục và group',
'Quyền r/w/x trên thư mục khác tệp. x cho đi qua thư mục, w cho thay đổi mục trong thư mục. SGID trên thư mục giúp tệp con kế thừa group, không tự cấp quyền truy cập cho mọi người.',
'''Dùng group/user từ ngày 13:
```bash
sudo mkdir -p /srv/luc-shared
sudo chown "$USER":luc-ops /srv/luc-shared
sudo chmod 2770 /srv/luc-shared
printf 'team notes\\n' > /srv/luc-shared/report.txt
chmod 660 /srv/luc-shared/report.txt
sudo -u luc-helper cat /srv/luc-shared/report.txt
sudo -u nobody cat /srv/luc-shared/report.txt
```
Lệnh cuối phải bị từ chối. Thử tạo tệp bằng luc-helper rồi kiểm tra group bằng ls -l. Không chmod 777 để né lỗi. Dùng /srv thay vì thư mục home riêng để tránh quyền traverse của thư mục cha che nguyên nhân.
Bộ chấm thực sự thử đọc/ghi bằng luc-helper và kiểm tra nobody không đọc được, ngoài việc nhìn số quyền.''',
'Group làm việc đọc/ghi được trong /srv/luc-shared; người ngoài không đọc được report.txt.',
'''test "$(stat -c %G /srv/luc-shared)" = luc-ops && test "$(stat -c %a /srv/luc-shared)" = 2770 && sudo -n -u luc-helper test -r /srv/luc-shared/report.txt && ! sudo -n -u nobody test -r /srv/luc-shared/report.txt && p=$(sudo -n -u luc-helper mktemp /srv/luc-shared/probe.XXXXXX) && sudo -n -u luc-helper sh -c 'printf checked > "$1"; test "$(cat "$1")" = checked; rm -- "$1"' sh "$p"''',
'Vì sao chmod 660 cho file vẫn không đủ nếu thiếu x trên thư mục cha?'),
('Repository, phiên bản và nguồn gói',
'Repository không chỉ là link tải: APT dùng metadata và chữ ký, distro/codename phải khớp. Ubuntu 24.04 là noble, 22.04 là jammy. Bản nguồn đã nhập có ví dụ nhầm codename 26.04; đừng sao chép ví dụ đó vào cấu hình máy.',
'''Đọc thông tin thật của VM:
```bash
. /etc/os-release
printf '%s\\n' "$VERSION_CODENAME"
apt-cache policy hello
ls /etc/apt/sources.list.d/
```
Ubuntu 24.04 thường dùng /etc/apt/sources.list.d/ubuntu.sources (deb822), không nhất thiết sources.list có mọi nội dung. Xem file đó bằng less.
```bash
mkdir -p ~/luc-course/day15
apt-cache policy hello > ~/luc-course/day15/policy.txt
sudo apt install -y hello
hello
```
Tự giải thích Installed, Candidate và nguồn phiên bản. Theo bản EN để tìm hiểu thêm thêm/bỏ repo; trước khi sửa phải sao lưu **file repo sẽ sửa**, chỉ dùng repo chính thức khớp bản Ubuntu. Không thêm PPA không rõ nguồn hoặc tắt kiểm tra chữ ký để lấy điểm. Bộ chấm chỉ kiểm tra gói hello và policy có nguồn thật, không chấm thêm/xóa repo.''',
'Gói hello được cài từ APT và lưu policy thực có Candidate/nguồn gói.',
"dpkg-query -W -f='${Status}' hello | grep -qx 'install ok installed' && grep -q 'Candidate:' \"$HOME/luc-course/day15/policy.txt\" && grep -Eq 'https?://' \"$HOME/luc-course/day15/policy.txt\"",
'Vì sao PPA cho bản Ubuntu khác có thể gây lỗi dù apt update vẫn chạy?'),
('Sao lưu, nén và thử phục hồi',
'Tar gom tệp, gzip nén dữ liệu; có archive chưa đồng nghĩa phục hồi được. Trước giải nén xem danh sách và chọn thư mục đích riêng, tránh ghi đè dữ liệu đang dùng.',
'''Tạo dữ liệu nhỏ, sao lưu rồi phục hồi sang nơi khác:
```bash
mkdir -p ~/luc-course/day16/source ~/luc-course/day16/restored
printf 'restore-me\\n' > ~/luc-course/day16/source/important.txt
tar -czf ~/luc-course/day16/backup.tar.gz -C ~/luc-course/day16/source .
tar -tzf ~/luc-course/day16/backup.tar.gz
tar -xzf ~/luc-course/day16/backup.tar.gz -C ~/luc-course/day16/restored
diff -r ~/luc-course/day16/source ~/luc-course/day16/restored
```
Thử gzip -k trên một tệp riêng và so kích thước; dữ liệu quá nhỏ có thể nén xong còn lớn hơn do header. Chưa cần xóa bản gốc để chứng minh phục hồi. Không giải nén archive lạ bằng sudo vào / hoặc /etc.''',
'Archive đọc được và important.txt phục hồi đúng nội dung từ source.',
'''tar -tzf "$HOME/luc-course/day16/backup.tar.gz" >/dev/null && test "$(cat "$HOME/luc-course/day16/source/important.txt")" = restore-me && cmp -s "$HOME/luc-course/day16/source/important.txt" "$HOME/luc-course/day16/restored/important.txt"''',
'Vì sao cần thử restore chứ không chỉ nhìn backup.tar.gz tồn tại?'),
('Tải source, kiểm tra và biên dịch',
'Source code cần build thành chương trình; configure kiểm tra môi trường, make biên dịch và make install chép kết quả vào prefix. Cài từ source thường không được APT theo dõi. Bản local thay ví dụ Nmap cũ trong nguồn bằng GNU Hello nhỏ, cài vào home để không ghi đè gói hệ thống.',
f'''Chuẩn bị công cụ:
```bash
sudo apt install -y build-essential wget
mkdir -p ~/luc-course/day17
cd ~/luc-course/day17
wget https://ftp.gnu.org/gnu/hello/hello-2.12.1.tar.gz
printf '{SHA_HELLO}  hello-2.12.1.tar.gz\\n' | sha256sum -c -
tar -xzf hello-2.12.1.tar.gz
cd hello-2.12.1
./configure --prefix="$HOME/luc-course/day17/install"
make -j2
make install
LC_ALL=C "$HOME/luc-course/day17/install/bin/hello"
```
Không chạy make bằng sudo; prefix nằm trong home nên install cũng không cần sudo. SHA được đối chiếu khi xây khóa; nếu không khớp, dừng và xác minh nguồn thay vì bỏ kiểm tra. Bản 2.12.1 là phiên bản cố định cho lab, không có tuyên bố đây là phiên bản mới nhất. So `command -v hello` với đường dẫn vừa build để thấy hai bản khác nhau.''',
'Tarball đúng SHA và binary build từ source trong prefix riêng chạy được.',
f'''test "$(sha256sum "$HOME/luc-course/day17/hello-2.12.1.tar.gz" | cut -d' ' -f1)" = {SHA_HELLO} && test -f "$HOME/luc-course/day17/hello-2.12.1/config.status" && test "$(LC_ALL=C "$HOME/luc-course/day17/install/bin/hello")" = 'Hello, world!' ''',
'Nếu apt remove hello, bản cài trong home có tự bị xóa không? Vì sao?'),
('Journal và logrotate',
'Log giúp điều tra theo thời gian; logrotate quản lý kích thước/số bản lưu, không phải công cụ tự sửa lỗi ứng dụng. Debug cấu hình không làm xoay log thật.',
'''Quan sát:
```bash
sudo journalctl -u apache2 -p err --since today --no-pager
sudo less /etc/logrotate.d/apache2
sudo logrotate -d /etc/logrotate.conf
```
Không có dòng error không tự động là lỗi. Tìm weekly trong block Apache, sao lưu file đó rồi dùng sudoedit đổi sang daily, giữ các chỉ thị khác. Debug lại cấu hình trước khi áp dụng.
Tập xoay một log riêng bằng user thường, không ép xoay mọi log hệ thống:
```bash
mkdir -p ~/luc-course/day18
printf 'LUC rotation test\\n' > ~/luc-course/day18/application.log
nano ~/luc-course/day18/rotate.conf
```
Nội dung rotate.conf dùng **đường dẫn tuyệt đối tới application.log của bạn**, kèm block `{`, `size 1`, `rotate 2`, `copytruncate`, `}` trên các dòng riêng. Chạy `logrotate -s ~/luc-course/day18/state -f ~/luc-course/day18/rotate.conf`. Kiểm tra application.log.1 có dòng gốc. Không xóa log Windows/Linux để giấu lỗi.''',
'Apache cấu hình daily hợp lệ và bản log riêng đã xoay giữ được nội dung.',
'''sudo -n grep -Eq '^[[:space:]]*daily[[:space:]]*$' /etc/logrotate.d/apache2 && sudo -n logrotate -d /etc/logrotate.conf >/dev/null 2>&1 && grep -qx 'LUC rotation test' "$HOME/luc-course/day18/application.log.1"''',
'Vì sao logrotate -d không tạo archive? Nếu file vẫn mở, copytruncate có giới hạn gì?'),
('Inode, hard link và symlink',
'Hard link là tên khác của cùng inode trên cùng filesystem; symlink lưu đường dẫn đích. Symlink có thể trỏ tới đích không còn; hard link không dùng cho thư mục bình thường. Không thử hard link tới /etc/passwd từ home như ví dụ cũ vì thường khác quyền/thiết lập bảo vệ.',
'''Thử trên file do bạn sở hữu:
```bash
mkdir -p ~/luc-course/day19
cd ~/luc-course/day19
printf 'linked-data\\n' > original.txt
ln original.txt hard.txt
ln -s original.txt soft.txt
ls -li
stat original.txt hard.txt soft.txt
```
Sửa original rồi cat hard/soft để thấy liên hệ. Có thể đổi tên original để quan sát soft bị đứt, nhưng đổi lại trước khi chấm. Tự thử alias trong shell; alias không phải tệp symlink.''',
'hard.txt cùng inode với original.txt; soft.txt thực sự là symlink trỏ đúng đích.',
'''test -f "$HOME/luc-course/day19/original.txt" && test "$HOME/luc-course/day19/original.txt" -ef "$HOME/luc-course/day19/hard.txt" && test -L "$HOME/luc-course/day19/soft.txt" && test "$HOME/luc-course/day19/original.txt" -ef "$HOME/luc-course/day19/soft.txt"''',
'Xóa một tên hard link có xóa ngay dữ liệu không? Symlink khác alias thế nào?'),
('Viết script vận hành và thử dữ liệu mới',
'Script gom quy trình lặp lại nhưng vẫn cần hiểu từng lệnh. Nhận đường dẫn đầu vào qua tham số giúp chạy lại với dữ liệu khác; không hardcode kết quả. Kiểm tra đầu vào và trả mã lỗi rõ ràng.',
'''Dùng dữ liệu đơn giản mỗi dòng một IP để tập trung vào script; tự đọc bản EN để mở rộng sang auth.log/journal thật. Tạo `~/luc-course/day20/topips.sh` bằng nano/vim:
```bash
#!/usr/bin/env bash
set -eu
if [ "$#" -ne 1 ] || [ ! -r "$1" ]; then
  echo "Usage: topips.sh INPUT" >&2
  exit 2
fi
sort "$1" | uniq -c | sort -k1,1nr -k2,2 | head -n 3
```
Giải thích từng lệnh trong pipeline rồi `chmod +x` script. Tự tạo file IP lặp lại, chạy thử với hai dữ liệu khác nhau và thử đường dẫn không tồn tại. Đầu ra quy ước: số lần, khoảng trắng, IP; giảm dần theo số lần, hòa thì tăng dần theo IP dạng chuỗi. Đây là hợp đồng đầu ra chấm, tên các file dữ liệu bạn tự chọn.
Bộ chấm chạy script trên dữ liệu mới ngẫu nhiên, so kết quả và yêu cầu mã lỗi khác 0 khi file thiếu. Lệnh trong script chạy bằng user thường, không cần sudo.''',
'topips.sh xử lý đúng dữ liệu đầu vào mới và không báo thành công khi file không tồn tại.',
'''python3 - <<'PY'
from pathlib import Path
from collections import Counter
import subprocess,tempfile,random,os
s=Path.home()/'luc-course/day20/topips.sh'
assert s.is_file() and os.access(s,os.X_OK)
for _ in range(2):
    values=[f'192.0.2.{random.randint(1,7)}' for n in range(40)]
    with tempfile.TemporaryDirectory() as d:
        p=Path(d)/'input.txt';p.write_text('\\n'.join(values)+'\\n')
        r=subprocess.run([str(s),str(p)],capture_output=True,text=True,timeout=4)
        expected=sorted(Counter(values).items(),key=lambda x:(-x[1],x[0]))[:3]
        assert r.returncode==0 and [x.split() for x in r.stdout.splitlines()]==[[str(n),ip] for ip,n in expected]
        assert subprocess.run([str(s),str(Path(d)/'missing')],capture_output=True,timeout=4).returncode!=0
PY''',
'Vì sao script chạy đúng dữ liệu mẫu vẫn cần thử dữ liệu khác và đầu vào lỗi?'),
('Tổng kết và dự án quản trị server',
'Hoàn thành khóa là nền tảng quản trị ban đầu, không phải chứng chỉ hoặc bảo đảm sẵn sàng vận hành production. Dự án cá nhân cần mô tả việc bạn thật sự tự làm và tự xử lý lỗi.',
'''Làm một buổi tổng hợp không nhìn lại lời giải:
1. Kết nối SSH bằng user thường; giải thích sudo và kiểm tra máy.
2. Phục vụ một trang bằng Apache; chỉ ra cấu hình, cổng, service và log.
3. Tạo một user hỗ trợ có quyền phù hợp; thử cả người được phép và người bị chặn.
4. Sao lưu dữ liệu rồi phục hồi sang vị trí khác, đối chiếu nội dung.
5. Lập lịch và kiểm tra kết quả thật; dùng script trên dữ liệu mới.
6. Tự tạo một lỗi cấu hình nhỏ trên VM lab, tìm log và sửa; không lấy việc tắt firewall làm lời giải chung.

Viết README gồm sơ đồ đơn giản, cách dựng lại, thay đổi đã làm, bằng chứng thử và giới hạn. Không ghi private key, password hay log chứa thông tin nhạy cảm. Bài tổng kết chỉ ghi nhận bạn đã đọc kế hoạch tiếp theo, **không tự chấm dự án hoặc cấp chứng chỉ**.''',
'Đọc kế hoạch tổng kết; dự án cần được đánh giá riêng bằng bằng chứng thực hành.',
None,
'Nếu phỏng vấn hỏi server không truy cập được, bạn sẽ kiểm tra theo thứ tự nào và dựa vào bằng chứng gì?')
]

for day,(title,concept,guide,task,probe,reflection) in enumerate(LESSONS):
    ident=f'luc-day-{day:02d}'
    original=(BASE/'source'/f'{day:02d}.md').read_text(encoding='utf-8')
    recorded=next(x for x in manifest['files'] if x['file']==f'docs/{day:02d}.md')
    assert hashlib.sha256(original.encode()).hexdigest()==recorded['sha256']
    url=f'https://linuxupskillchallenge.org/{day:02d}/'
    credit=f'Nguồn: Linux Upskill Challenge — Steve Brorens (@snori74), Livia Lima và contributors, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Bài gốc]({url}); revision `{manifest["commit"][:12]}`. Hướng dẫn VI, đầu ra bài tập và bộ chấm được dự án biên soạn thêm; không phải bản dịch nguyên văn toàn bộ tài liệu.'
    sections=[
      {'id':ident+'-intro','position':0,'title':f'Ngày {day}: {title}','title_vi':f'Ngày {day}: {title}','kind':'introduction','need_verify':False,'content':f'## Mục tiêu\n{concept}\n\n**Môi trường:** VM Ubuntu Server riêng qua SSH, dữ liệu giữ xuyên suốt cả khóa.\n\n{credit}','content_vi':f'## Mục tiêu\n{concept}\n\n**Môi trường:** VM Ubuntu Server riêng qua SSH, dữ liệu giữ xuyên suốt cả khóa.\n\n{credit}'},
      {'id':ident+'-guide','position':1,'title':'Tài liệu gốc và hướng dẫn thực hành','title_vi':'Tài liệu gốc và hướng dẫn thực hành','kind':'document','need_verify':False,'content':original,'content_vi':f'## Hiểu bản chất\n{concept}\n\n## Thực hành từng bước\n{guide}\n\n## Tự giải thích\n{reflection}\n\n{credit}','source_text_verified':True,'source_url':url,'source_sha256':recorded['sha256'],'translation_kind':'adaptation'},
      {'id':ident+'-task','position':2,'title':'Kiểm tra kết quả' if probe else 'Kế hoạch học tiếp','kind':'task','need_verify':True,'content':f'## Đề bài\n{task}\n\n## Phạm vi chấm\n'+('Bộ chấm kiểm tra kết quả trọng tâm được mô tả ở trên, không tự chấm toàn bộ phần Extension hoặc câu trả lời giải thích. Không dùng container bài khác để thay VM khóa này.' if probe else 'Chỉ xác nhận đã đọc, không tính là kiểm thử dự án.'),'task':task,'hint':'Đọc lại hướng dẫn VI, thử từng lệnh ngắn và đối chiếu kết quả trên đúng VM lab. '+reflection,'verification':{'kind':'state','command':probe} if probe else {'kind':'acknowledgement','scope':'informational'}}
    ]
    if not probe:sections[-1]['action']='continue'
    if day==0:
        for field in ['content','content_vi']:sections[0][field]=START_GUIDE+sections[0][field]
        sections[1]['content_vi']=START_GUIDE+sections[1]['content_vi']
    steps=[{k:v for k,v in sections[-1].items() if k in ('id','title','task','hint','verification','action')}]
    lab={'id':ident,'course_id':COURSE,'order':day+1,'title':f'Ngày {day}: {title}','title_vi':f'Ngày {day}: {title}','type':'lab','difficulty':'Beginner','estimated_time':'45–90 mins','overview':concept,'runtime':{'kind':'upskill-ssh','shared_course':True},'source_url':url,'source':'Linux Upskill Challenge · CC BY 4.0','source_attribution':credit,'curriculum_origin':'cc-by-4.0-adaptation','validation_status':'source-imported-ssh-runtime-pending','sections':sections,'steps':steps}
    Path(f'server/data/labs/{ident}.json').write_text(json.dumps(lab,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
courses_path=Path('server/data/courses.json')
courses=json.loads(courses_path.read_text(encoding='utf-8'))
courses=[c for c in courses if c['id']!=COURSE]
courses.append({'id':COURSE,'alias':COURSE,'name':'Linux Upskill Challenge — Quản trị Ubuntu Server','topic':'linux','level':1,'level_label':'Beginner','description':'Ngày 0 chuẩn bị VM, 20 ngày thực hành quản trị và Ngày 21 tổng kết. Giữ toàn văn EN nguồn CC BY 4.0, hướng dẫn VI biên soạn thêm và bộ chấm trọng tâm trên một VM Ubuntu Server riêng.','cover':'/covers/linux-upskill.svg','tags':['Linux','Ubuntu Server','System Administration','SSH'],'skills':['SSH','systemd','Apache','UFW','cron','Users and Groups','Permissions','Backup','Logrotate','Bash'],'has_cert':False,'source_url':'https://linuxupskillchallenge.org/','source_labs_count':22,'runtime_required':'upskill-ssh','environment_plan':'VM Ubuntu Server local riêng trên VMware, dùng chung xuyên suốt khóa; không dùng VM dự án CV. Terminal web kết nối SSH, không thay môi trường các khóa Linux cũ.'})
courses_path.write_text(json.dumps(courses,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Built 22 attributed lessons (Days 0–21), 21 state tasks and one informational continuation. VM acceptance remains separate.')
