"""Commands course 11–22: public requirements, original local EN/VI wording.

Checked official tutorial pages on 2026-10-17. Fixture text is reconstructed,
not recovered private VM data. Completion journal proves pager invocation and
successful exit; it does not record or grade keys pressed inside a pager.
"""
import shlex
import re
from commands_course_common import BASE, state, history, all_checks, file, directory

FENCE = '`' * 3


def setup(files=(), directories=()):
    return {'version': 1, 'directories': [directory(BASE.rstrip('/'))] + [directory(p) for p in directories],
            'files': list(files), 'accounts': [], 'groups': [],
            'provenance': {'kind': 'local-reconstruction', 'private_source_fixture_recovered': False,
                           'note': 'File paths and task parameters match public tutorials; local fixture contents are reconstructed.'}}


def step(title, en, vi, command, rule=None, commands=None):
    example = FENCE + 'bash\n' + command + '\n' + FENCE
    # Bash journals completed simple commands separately. Never expect an
    # entire multiline example to appear as one history entry. Script-writing
    # blocks supply their own filesystem/behaviour rules below.
    if rule is None:
        rules = [history(r'(^|[;&|]\s*)' + re.escape(line) + r'\s*$')
                 for line in command.splitlines() if line.strip()]
        rule = rules[0] if len(rules) == 1 else all_checks(*rules)
    return {'title_vi': title, 'en': en + '\n\n' + example,
            'vi': vi + '\n\n' + example, 'commands': commands or [command],
            'verification': rule}


def pager(command, key='q', wait='2025-01-15 08:'):
    return {'command': command, 'input': [{'wait_for': wait, 'text': key, 'raw': True}]}


def compare(output, expression):
    return state('test -f ' + shlex.quote(BASE+output) + ' && ' + expression)


def build():
    result = {}
    report = 'Daily operational report\nSystems online\nReview complete\n'
    sales = 'Sales total: 1200\n'; marketing = 'Campaign visits: 350\n'
    result[210986] = {'title_vi': 'Lệnh cat: xem và nối tệp', 'setup': setup([
        file(BASE+'daily_report.txt', report), file(BASE+'sales.txt', sales), file(BASE+'marketing.txt', marketing)]), 'sections': {
        1: step('Khám phá thư mục dự án', 'Enter the project directory, check its path, and list its files.', 'Vào thư mục dự án, kiểm tra đường dẫn rồi liệt kê các tệp.', 'cd /home/labex/project\npwd\nls', all_checks(history(r'^pwd\s*$'), history(r'^ls\s*$'))),
        2: step('Đọc nội dung tệp', 'Read the daily report with cat.', 'Dùng cat để đọc báo cáo hằng ngày.', 'cat daily_report.txt'),
        3: step('Nối nhiều tệp', 'Join sales followed by marketing into combined_report.txt; verify the saved result.', 'Nối sales trước marketing vào combined_report.txt rồi đọc lại kết quả.', 'cat sales.txt marketing.txt > combined_report.txt\ncat combined_report.txt', compare('combined_report.txt', 'cmp -s '+BASE+'combined_report.txt <(cat '+BASE+'sales.txt '+BASE+'marketing.txt)')),
        4: step('Hiện số dòng', 'Number every output line with -n.', 'Dùng -n để đánh số mọi dòng được hiển thị.', 'cat -n daily_report.txt'),
        5: step('Hiện ký tự cuối dòng', 'Use -E to mark each line ending with a dollar sign.', 'Dùng -E để hiện dấu đô la ở cuối mỗi dòng.', 'cat -E daily_report.txt')}}

    weather = ''.join(f'2023-{1+(i//28)%12:02d}-{1+i%28:02d} Temperature {15+i%20}C\n' for i in range(1,365))
    weather += '2023-07-15 Temperature 28C\n2023-08-15 Temperature 30C\n'
    result[214299] = {'title_vi':'Lệnh more: cuộn xem tệp', 'setup':setup([file(BASE+'weather_data.txt',weather)]), 'sections': {
        1: step('Tìm tệp thời tiết','List the project directory and locate weather_data.txt.','Liệt kê thư mục dự án để tìm weather_data.txt.','cd /home/labex/project\nls',history(r'^ls(?:\s+/home/labex/project)?\s*$')),
        2: step('Mở và di chuyển bằng more','Open the file. Try Space, Enter and b; press q to return. The local check records the completed pager command.','Mở tệp. Thử Space, Enter và b; nhấn q để trở về. Bộ chấm local xác nhận lệnh more đã kết thúc.', 'more weather_data.txt', commands=[pager('more weather_data.txt',wait='--More--')]),
        3: step('Bắt đầu ở dòng 100','Open at line 100. Press = to inspect position, then q.','Mở từ dòng 100. Nhấn = để xem vị trí, sau đó nhấn q.','more +100 weather_data.txt', commands=[pager('more +100 weather_data.txt',wait='--More--')]),
        4: step('Đổi số dòng mỗi trang','Display ten lines per page; Space advances and q exits.','Hiển thị mười dòng mỗi trang; Space sang trang và q thoát.','more -10 weather_data.txt', commands=[pager('more -10 weather_data.txt',wait='--More--')]),
        5: step('Tìm dữ liệu theo ngày','Start near 2023-07-15, then practice /2023-08-15 and Enter. Exit with q.','Mở gần ngày 2023-07-15, rồi thử /2023-08-15 và Enter. Thoát bằng q.','more +/"2023-07-15" weather_data.txt', commands=[pager('more +/"2023-07-15" weather_data.txt',wait='--More--')])}}

    log=''.join(f'2025-01-15 08:{i%60:02d}:00 '+('ERROR: Database connection failed' if i%9==0 else 'INFO: Server request processed')+'\n' for i in range(150))
    result[214301] = {'title_vi':'Lệnh less: phân trang tệp', 'setup':setup([file(BASE+'server_log.txt', log)]), 'sections': {
        1: step('Mở nhật ký','Open server_log.txt and leave the pager with q.','Mở server_log.txt rồi dùng q để thoát.','less server_log.txt',commands=[pager('less server_log.txt')]),
        2: step('Di chuyển trong tệp','Open the file again. Practice Space, b, G and g, then q.','Mở lại tệp. Thử Space, b, G và g, rồi q.','less server_log.txt',commands=[pager('less server_log.txt',key=' Gb gq')]),
        3: step('Tìm nội dung','Open again; type /ERROR and Enter, use n or N, then q. Internal search keys are practice, not separately measured by the local grader.','Mở lại; gõ /ERROR và Enter, dùng n hoặc N rồi q. Phím tìm bên trong được thực hành nhưng bộ chấm local chưa ghi riêng.', 'less server_log.txt',commands=[pager('less server_log.txt',key='/ERROR\nnNq')]),
        4: step('Hiện số dòng','Enable line numbers with -N and exit with q.','Bật số dòng bằng -N rồi nhấn q.','less -N server_log.txt',commands=[pager('less -N server_log.txt')]),
        5: step('Mở tại lỗi cơ sở dữ liệu','Use the startup pattern to jump to a database error.','Dùng mẫu tìm lúc khởi động để nhảy tới lỗi cơ sở dữ liệu.','less +/ERROR:.Database server_log.txt',commands=[pager('less +/ERROR:.Database server_log.txt')])}}

    overview='System overview\nOperating normally\nMaintenance window: Sunday 02:00 UTC\n'
    large=''.join(f'INFO Routine event {i}\n' for i in range(100))+'2025-01-15 ERROR Database unavailable\n'+''.join(f'INFO Follow-up event {i}\n' for i in range(100))
    result[387914] = {'title_vi':'Xem tệp nhật ký và cấu hình Linux', 'setup':setup([file(BASE+'system_overview.txt',overview),file(BASE+'large_log.txt',large)]), 'sections': {
        1: step('Thực hành đọc tệp văn bản','Use cat to read system_overview.txt; copy its final line into answer1.txt. Search ERROR inside more large_log.txt and save that entire line to answer2.txt. Work in the project directory. Fixture text here is local.','Dùng cat đọc system_overview.txt; chép dòng cuối vào answer1.txt. Tìm ERROR trong more large_log.txt rồi lưu nguyên dòng vào answer2.txt. Làm việc trong thư mục dự án; nội dung tệp mẫu là bản local.', 'cat system_overview.txt\nmore large_log.txt', all_checks(history(r'^cat\s+(?:\./)?system_overview\.txt\s*$'),history(r'^more\s+(?:\./)?large_log\.txt\s*$'),compare('answer1.txt','cmp -s '+BASE+'answer1.txt <(tail -n 1 '+BASE+'system_overview.txt)'), compare('answer2.txt','cmp -s '+BASE+'answer2.txt <(grep ERROR '+BASE+'large_log.txt)')), commands=['cat system_overview.txt',pager('more large_log.txt',key='/ERROR\nq',wait='--More--'),"printf '%s\\n' 'Maintenance window: Sunday 02:00 UTC' > answer1.txt", "printf '%s\\n' '2025-01-15 ERROR Database unavailable' > answer2.txt"])}}

    access=''.join(f'192.168.1.{100+i%50} - - [01/Jan/2024:00:00:{i%60:02d} +0000] "GET '+('/admin' if i%5==0 else '/index.html')+' HTTP/1.1" 200 1234\n' for i in range(80))
    errors=''.join(f'[2024-01-01] [error] Local error event {i}\n' for i in range(30))
    result[214302] = {'title_vi':'Lệnh head: đọc đầu tệp', 'setup':setup([file(BASE+'access.log',access),file(BASE+'error.log',errors)]), 'sections': {
        1:step('Mặc định mười dòng','Read the start of access.log; head defaults to ten lines.','Đọc đầu access.log; head mặc định hiện mười dòng.','head access.log'),
        2:step('Chọn năm dòng','Limit the preview to five lines.','Giới hạn phần xem trước còn năm dòng.','head -n 5 access.log'),
        3:step('Đọc nhiều tệp','Read both log beginnings and notice their headers.','Đọc đầu cả hai nhật ký và quan sát tiêu đề phân cách.','head access.log error.log'),
        4:step('Kết hợp đường ống','Select the quoted HTTP request field, then keep three lines.','Chọn trường yêu cầu HTTP nằm trong dấu nháy rồi giữ ba dòng.', 'cut -d \'"\' -f2 access.log | head -n 3'),
        5:step('Lọc bằng grep','Filter /admin requests before taking the first three matches.','Lọc yêu cầu /admin rồi lấy ba kết quả đầu.','grep "/admin" access.log | head -n 3'),
        6:step('Xem trước tệp lớn','Inspect the file size, then preview fifteen lines.','Xem kích thước tệp rồi đọc trước mười lăm dòng.','ls -lh access.log\nhead -n 15 access.log',all_checks(history(r'^ls\s+-lh\s+access\.log\s*$'),history(r'^head\s+-n\s+15\s+access\.log\s*$')))}}

    system=''.join(f'2025-01-15 08:{i%60:02d}:00 [INFO] System event {i}\n' for i in range(90))
    tailfile='/home/labex/project/system.log'
    def follower(cmd, line):
        # A real background writer substitutes for opening a second terminal.
        command="(sleep 1; printf '%s\\n' "+shlex.quote(line)+" >> "+tailfile+") & "+cmd
        return {'command':command, 'allowed_status':[0,130],
                'input':[{'wait_for':'\r\n'+line,'text':'\u0003','raw':True}]}
    result[214303]={'title_vi':'Lệnh tail: đọc cuối và theo dõi tệp','setup':setup([file(BASE+'system.log',system)]),'sections':{
        1:step('Đọc cuối tệp','Display the final ten log entries.','Hiển thị mười dòng nhật ký cuối.','tail '+tailfile),
        2:step('Chọn số dòng cuối','Display the final five entries.','Hiển thị năm dòng cuối.','tail -n 5 '+tailfile),
        3:step('Đọc từ dòng 50','A plus sign makes -n start from line 50.','Dấu cộng khiến -n bắt đầu đọc từ dòng 50.','tail -n +50 '+tailfile),
        4:step('Theo dõi thay đổi','Run tail -f. In a second terminal append a testing entry with echo; it appears in the first terminal. Use Ctrl+C to stop. With one terminal, a delayed background writer also works.','Chạy tail -f. Ở terminal thứ hai, dùng echo thêm dòng thử; dòng mới sẽ hiện ở terminal đầu. Dùng Ctrl+C dừng. Nếu chỉ có một terminal, có thể dùng tiến trình nền ghi sau một giây.','tail -f '+tailfile,all_checks(history(r'(^|[;&]\s*)tail\s+-f\s+/home/labex/project/system\.log\s*$',allowed_status=[0,130]),state('grep -Fq "New log entry for testing" '+tailfile)),commands=[follower('tail -f '+tailfile,'[INFO] New log entry for testing')]),
        5:step('Kết hợp số dòng và theo dõi','Follow the file starting with the last three lines. Append a warning in the other terminal; stop with Ctrl+C.','Theo dõi tệp bắt đầu từ ba dòng cuối. Thêm cảnh báo ở terminal còn lại rồi dùng Ctrl+C dừng.','tail -n 3 -f '+tailfile,all_checks(history(r'(^|[;&]\s*)tail\s+-n\s+3\s+-f\s+/home/labex/project/system\.log\s*$',allowed_status=[0,130]),state('grep -Fq "Unusual network activity detected" '+tailfile)),commands=[follower('tail -n 3 -f '+tailfile,'[WARNING] Unusual network activity detected')])}}

    config='## Server Configuration\nport=8080\nmax_connections=100\n\n## Database Settings\ndb_host=localhost\ndb_port=5432\ndb_name=myapp\n\n### Logging Configuration\nlog_level=info\nlog_file=/var/log/myapp.log\n\n## Security Settings\nenable_ssl=true\nssl_cert_path=/etc/ssl/certs/myapp.crt\n\n### Performance Tuning\ncache_size=1024\nthread_pool=20\n\n## Miscellaneous\ndebug_mode=false\n'
    nlsteps=[('Đánh số dòng có nội dung','Number nonempty lines; tee also saves the output.','Đánh số dòng có nội dung; tee đồng thời lưu kết quả.','nl config.txt','nl-basic.txt'),('Đánh số cả dòng trống','Use -b a to include blank lines.','Dùng -b a để đánh số cả dòng trống.','nl -b a config.txt','nl-all-lines.txt'),('Thêm số không phía trước','Use right alignment with zero padding.','Căn phải và thêm số không phía trước.','nl -n rz config.txt','nl-zero-padded.txt'),('Chọn loại dòng','Number lines whose first character is not #.','Đánh số dòng có ký tự đầu khác #.',"nl -b p'^[^#]' config.txt",'nl-settings-only.txt'),('Kết hợp định dạng','Number every line with three digits and a colon separator.','Đánh số mọi dòng bằng ba chữ số và dấu hai chấm.',"nl -b a -n rz -s ': ' -w 3 config.txt",'nl-combined.txt')]
    result[210988]={'title_vi':'Lệnh nl: đánh số dòng','setup':setup([file(BASE+'config.txt',config)]),'sections':{}}
    for pos,(title,en,vi,cmd,out) in enumerate(nlsteps,1):
        result[210988]['sections'][pos]=step(title,en,vi,cmd+' | tee '+out,compare(out,'cmp -s '+BASE+out+' <('+cmd.replace('config.txt',BASE+'config.txt')+')'))

    auth=''.join(f'2025-01-15 login attempt {i}: '+('FAILED' if i%7==0 else 'SUCCESS')+'\n' for i in range(1000))
    traffic=''.join(f'packet {1000-i} source=192.0.2.{i%200+1} destination=203.0.113.10\n' for i in range(1000))
    result[387930]={'title_vi':'Phát hiện nhanh mối đe dọa','setup':setup([file(BASE+'auth_log.txt',auth),file(BASE+'network_traffic.txt',traffic)]),'sections':{
        1:step('Phân tích nhật ký nhanh','Keep the last twenty authentication entries in recent_logins.txt and the first fifteen network entries in recent_traffic.txt. Use head/tail and preserve both source files.','Lưu hai mươi dòng xác thực cuối vào recent_logins.txt và mười lăm dòng lưu lượng đầu vào recent_traffic.txt. Dùng head/tail và giữ nguyên hai tệp gốc.','tail -n 20 auth_log.txt > recent_logins.txt\nhead -n 15 network_traffic.txt > recent_traffic.txt',all_checks(compare('recent_logins.txt','cmp -s '+BASE+'recent_logins.txt <(tail -n 20 '+BASE+'auth_log.txt)'),compare('recent_traffic.txt','cmp -s '+BASE+'recent_traffic.txt <(head -n 15 '+BASE+'network_traffic.txt)'),history(r'^tail\s+-n\s+20\s+auth_log\.txt\s*>\s*recent_logins\.txt\s*$'),history(r'^head\s+-n\s+15\s+network_traffic\.txt\s*>\s*recent_traffic\.txt\s*$'),state('test "$(sha256sum '+BASE+'auth_log.txt | cut -d\' \' -f1)" = '+__import__('hashlib').sha256(auth.encode()).hexdigest()+' && test "$(sha256sum '+BASE+'network_traffic.txt | cut -d\' \' -f1)" = '+__import__('hashlib').sha256(traffic.encode()).hexdigest())))}}

    result[215210]={'title_vi':'Lệnh which: tìm chương trình trong PATH','setup':setup([file('/home/labex/custom_bin/prioritydemo','#!/bin/sh\necho custom priority\n',mode='0755'),file('/usr/local/bin/prioritydemo','#!/bin/sh\necho system priority\n',mode='0755')],['/home/labex/custom_bin']),'sections':{
        1:step('Tìm lệnh đã cài','Locate gcc and python. Paths depend on the installed distribution; use the real executables, not a fabricated output.','Tìm gcc và python. Đường dẫn phụ thuộc bản phân phối; phải dùng chương trình thật.','which gcc\nwhich python',all_checks(history(r'^which\s+gcc\s*$'),history(r'^which\s+python\s*$'))),
        2:step('Xử lý lệnh không tồn tại','Check techbuild, then create and execute a script which reports whether it exists.','Kiểm tra techbuild, rồi tạo và chạy script thông báo nó có tồn tại hay không.',"which techbuild\ncat > ~/check_techbuild.sh <<'EOF'\n#!/bin/bash\nif which techbuild >/dev/null 2>&1; then\n  echo 'techbuild is installed'\nelse\n  echo 'techbuild is not installed'\nfi\nEOF\nchmod +x ~/check_techbuild.sh\n~/check_techbuild.sh",all_checks(history(r'^which\s+techbuild\s*$',allowed_status=[1]),history(r'^(?:~/|/home/labex/)check_techbuild\.sh\s*$'),state('test -x /home/labex/check_techbuild.sh && grep -Eq "which[[:space:]]+techbuild" /home/labex/check_techbuild.sh && test "$(/home/labex/check_techbuild.sh)" = "techbuild is not installed"'))),
        3:step('Tìm mọi bản cài đặt','List every matching python executable along PATH; multiple paths may reference one underlying binary.','Liệt kê mọi python trong PATH; nhiều đường dẫn có thể trỏ cùng một chương trình.','which -a python'),
        4:step('Thứ tự ưu tiên PATH','Put custom_bin first, then compare the first prioritydemo match with all matches.','Đưa custom_bin lên đầu, rồi so sánh vị trí prioritydemo đầu tiên với toàn bộ kết quả.','export PATH=$HOME/custom_bin:$PATH\nwhich prioritydemo\nwhich -a prioritydemo',all_checks(history(r'^export\s+PATH=\$HOME/custom_bin:\$PATH\s*$'),history(r'^which\s+prioritydemo\s*$'),history(r'^which\s+-a\s+prioritydemo\s*$'))),
        5:step('Tạo lệnh tùy chỉnh','Create executable ~/hello, add HOME to PATH, run hello and locate it.','Tạo ~/hello có quyền chạy, thêm HOME vào PATH, chạy hello rồi tìm vị trí.',"cat > ~/hello <<'EOF'\n#!/bin/bash\necho 'Hello from TechCorp!'\nEOF\nchmod +x ~/hello\nexport PATH=\"$PATH:$HOME\"\nhello\nwhich hello",all_checks(state('test -x /home/labex/hello && test "$(/home/labex/hello)" = "Hello from TechCorp!"'),history(r'^hello\s*$'),history(r'^which\s+hello\s*$')))}}

    result[215211]={'title_vi':'Lệnh whereis: tìm chương trình và tài liệu','setup':setup(),'sections':{
        1:step('Tra cứu cơ bản','Locate the resources associated with ls.','Tìm các tài nguyên liên quan tới ls.','whereis ls'),
        2:step('Chỉ tìm chương trình','Find the grep binary and compare with a nonexistent command.','Tìm chương trình grep rồi so sánh với một tên không tồn tại.','whereis -b grep\nwhereis -b nonexistent',all_checks(history(r'^whereis\s+-b\s+grep\s*$'),history(r'^whereis\s+-b\s+nonexistent\s*$'))),
        3:step('Tìm trang hướng dẫn','Find the ssh manual page and confirm the returned file exists. Minimal images may not contain documentation; no manual page is invented.','Tìm trang hướng dẫn ssh và xác nhận tệp kết quả có thật. Ảnh tối giản có thể chưa chứa tài liệu; không tạo trang hướng dẫn giả.','whereis -m ssh\nls /usr/share/man/man1/ssh.1.gz',all_checks(history(r'^whereis\s+-m\s+ssh\s*$'),state('test -f /usr/share/man/man1/ssh.1.gz'))),
        4:step('Kết hợp tùy chọn','Request both executable and manual-page locations for python3.','Tra cứu đồng thời chương trình và trang hướng dẫn python3.','whereis -bm python3'),
        5:step('Tìm mã nguồn','Look for Bash source resources, then compare with the complete lookup. Empty source results are valid.','Tìm tài nguyên mã nguồn Bash rồi so với tra cứu đầy đủ. Kết quả nguồn trống vẫn hợp lệ.','whereis -s bash\nwhereis bash',all_checks(history(r'^whereis\s+-s\s+bash\s*$'),history(r'^whereis\s+bash\s*$')))}}

    # 524289 Unicode characters encode to >1MiB without exceeding the manifest
    # character-count limit; find measures actual UTF-8 bytes on disk.
    evidence=[file(BASE+'evidence/clue.txt','Local clue: inspect the logs.\n'),file(BASE+'evidence/new_lead.txt','Local lead: review timestamps.\n'),file(BASE+'logs/system.log','System online\n'),file(BASE+'logs/recent_activity.log','Recent activity recorded\n'),file(BASE+'notes/interview.txt','Local interview notes\n'),file(BASE+'evidence/large_file.dat','Đ'*524289)]
    result[219191]={'title_vi':'Lệnh find: tìm kiếm tệp','setup':setup(evidence,[BASE+'evidence',BASE+'logs',BASE+'notes']),'sections':{
        1:step('Tìm theo tên','Search recursively from the project directory for clue.txt.','Tìm đệ quy từ thư mục dự án theo tên clue.txt.','find . -name "clue.txt"'),
        2:step('Tìm nhiều loại tệp','Match txt or log extensions with -o. Quote wildcards to prevent shell expansion.','Dùng -o tìm đuôi txt hoặc log. Đặt wildcard trong dấu nháy để shell không mở rộng trước.','find . -name "*.txt" -o -name "*.log"'),
        3:step('Tìm theo kích thước','Search regular files larger than one MiB.','Tìm tệp thông thường lớn hơn một MiB.','find . -type f -size +1M'),
        4:step('Tìm tệp sửa gần đây','Find regular files modified less than one day ago.','Tìm tệp thông thường được sửa trong vòng một ngày.','find . -type f -mtime -1'),
        5:step('Chạy lệnh trên kết quả','Read each txt file using -exec cat; escape the terminating semicolon.','Dùng -exec cat đọc từng tệp txt; thêm dấu gạch chéo trước dấu chấm phẩy kết thúc.','find . -name "*.txt" -exec cat {} \\;')}}

    result[388032]={'title_vi':'Tìm tài nguyên hệ thống quan trọng','setup':setup(),'sections':{
        1:step('Thực hành tìm tài nguyên','Locate python3 with which and gcc with whereis. Find only regular files ending in .conf below /etc; save every resulting path to config_files.txt in the project directory. Results reflect this container.','Dùng which tìm python3 và whereis tìm gcc. Tìm riêng tệp thông thường có đuôi .conf trong /etc và thư mục con; lưu toàn bộ đường dẫn vào config_files.txt trong thư mục dự án. Kết quả phụ thuộc container đang chạy.','which python3\nwhereis gcc\nfind /etc -type f -name "*.conf" > config_files.txt',all_checks(history(r'^which\s+python3\s*$'),history(r'^whereis\s+gcc\s*$'),history(r'^find\s+/etc\s+-type\s+f\s+-name\s+[\'\"]\*\.conf[\'\"]\s*>\s*config_files\.txt\s*$',allowed_status=[0,1]),compare('config_files.txt','test -s '+BASE+'config_files.txt && diff -u <(find /etc -type f -name "*.conf" 2>/dev/null | sort) <(sort '+BASE+'config_files.txt)')))}}
    return result
