"""Reviewed public requirements, Commands course orders 23–41.

Explanations are independently written. VM fixture bytes are reconstructed;
outputs are calculated from those fixtures, never copied illustrative numbers.
"""
from commands_course_common import BASE, state, history, all_checks, file, directory
import re


def build():
    result = {}

    def lesson(sid, title, fixtures=None):
        files = fixtures or {}
        parents = {BASE.rstrip('/')}
        for path in files:
            bits = (BASE + path).rsplit('/', 1)[0]
            while bits.startswith(BASE.rstrip('/')):
                parents.add(bits)
                bits = bits.rsplit('/', 1)[0]
        value = {'title_vi': title, 'sections': {}, 'setup': {
            'version': 1, 'directories': [directory(p) for p in sorted(parents)],
            'files': [file(BASE + p, content) for p, content in files.items()],
            'accounts': [], 'groups': [], 'provenance': {
                'kind': 'public-requirements-reconstructed-fixtures',
                'source_lab_id': sid, 'private_vm_bytes_recovered': False}}}
        result[sid] = value
        return value

    def task(lab, pos, title, en, vi, commands, pattern=None, check=None, statuses=None):
        if pattern is None:
            raise ValueError('Every task needs specific completed-command evidence')
        rule = history(pattern, statuses)
        if check:
            rule = all_checks(rule, state('set -e\ncd ' + BASE + '\n' + check))
        lab['sections'][pos] = {'title_vi': title, 'en': en, 'vi': vi,
                                'commands': commands, 'verification': rule}

    def output(lab, pos, title, en, vi, command, name, pattern=None):
        task(lab, pos, title, en, vi, [command + ' > ' + name],
             pattern or r'\b' + re.escape(command.split()[0]) + r'\b[^\n]*' + re.escape(name),
             'test -s ' + name + '\ncmp -s ' + name + ' <(' + command + ')')

    logs = {
        'logs/server.log': '[2023-08-13] INFO Started\n[2023-08-13] ERROR database connection failed\n[2023-08-13] error retry scheduled\n[2023-08-13] CRITICAL database unavailable\n[2023-08-13] INFO User authenticated: learner\n',
        'logs/access.log': 'INFO User authenticated: admin\nERROR database connection failed\n',
        'logs/error.log': 'ERROR database connection failed\nCRITICAL retry exhausted\n'}
    l = lesson(219192, 'Lệnh grep: tìm mẫu trong văn bản', logs)
    rows = [
        ('Chuẩn bị thư mục log', 'List the prepared log files.', 'Liệt kê các tệp log đã chuẩn bị.', 'ls -l logs', r'\bls\s+-l\s+(?:\S*/)?logs\b'),
        ('Tìm và đếm lỗi', 'Find ERROR lines and count matching lines.', 'Tìm các dòng ERROR và đếm số dòng khớp.', 'grep "ERROR" logs/server.log\ngrep -c "ERROR" logs/server.log', r'\bgrep\s+-c\s+[\"\x27]?ERROR[\"\x27]?\s+logs/server\.log'),
        ('Không phân biệt hoa thường', 'Include every capitalization of error.', 'Tìm error với mọi kiểu viết hoa và thường.', 'grep -i "error" logs/server.log', r'\bgrep\s+-i\s+.*error.*logs/server\.log'),
        ('Tìm trong nhiều tệp', 'Search all logs for the database failure.', 'Tìm lỗi kết nối cơ sở dữ liệu trong mọi tệp log.', 'grep "database connection failed" logs/*', r'\bgrep\s+.*database connection failed.*logs/\*'),
        ('Biểu thức chính quy', 'Match dates in 2023 with digit classes.', 'Dùng lớp chữ số để khớp ngày trong năm 2023.', 'grep "2023-[0-9][0-9]-[0-9][0-9]" logs/server.log', r'\bgrep\s+.*2023-\[0-9\].*logs/server\.log'),
        ('Xem ngữ cảnh', 'Show two lines before and after CRITICAL.', 'Xem hai dòng trước và sau CRITICAL.', 'grep -B 2 -A 2 "CRITICAL" logs/server.log', r'\bgrep\s+-B\s+2\s+-A\s+2\s+.*CRITICAL.*logs/server\.log'),
        ('Đảo điều kiện khớp', 'Display lines without uppercase ERROR.', 'Hiển thị những dòng không chứa ERROR viết hoa.', 'grep -v "ERROR" logs/server.log', r'\bgrep\s+-v\s+.*ERROR.*logs/server\.log')]
    for p, (t, en, vi, cmd, pat) in enumerate(rows, 1):
        task(l, p, t, en, vi, [cmd], pat)

    challenge_logs = {'system.log': 'INFO Started\nERROR Disk warning\nERROR Network failure\nINFO User authenticated: alice\n',
        'access.log': '10.0.0.1 GET / 200\n10.0.0.2 POST /api/order 201\n10.0.0.3 POST /api/user 200\n',
        'application.log': 'WARNING Slow query\nwarning Query timeout\nWARNING cache\nINFO User authenticated: bob\n'}
    l = lesson(388109, 'Tìm kim trong đống cỏ', challenge_logs)
    commands = ['grep -c ERROR system.log > task1_output.txt',
                'grep POST access.log > task2_output.txt',
                'grep -i WARNING application.log | grep -i query > task3_output.txt',
                'grep "User authenticated" *.log > task4_output.txt']
    check = '\n'.join('cmp -s ' + name + ' <(' + cmd + ')' for name, cmd in [
        ('task1_output.txt', 'grep -c ERROR system.log'), ('task2_output.txt', 'grep POST access.log'),
        ('task3_output.txt', 'grep -i WARNING application.log | grep -i query'),
        ('task4_output.txt', 'grep "User authenticated" *.log')])
    task(l, 1, 'Trích xuất bốn kết quả', 'Work in /home/labex/project. Use grep for every search. Save only the count of uppercase ERROR lines in system.log to task1_output.txt; POST lines from access.log to task2_output.txt; lines containing both WARNING and query, case-insensitively, from application.log to task3_output.txt; and every "User authenticated" match across *.log to task4_output.txt, retaining filename prefixes. Keep all input logs unchanged. Counts come from your prepared files, not the source page’s illustrative numbers.',
         'Làm trong /home/labex/project và dùng grep cho mọi tìm kiếm. Lưu riêng số dòng chứa ERROR viết hoa của system.log vào task1_output.txt; các dòng POST của access.log vào task2_output.txt; dòng chứa đồng thời WARNING và query, không phân biệt hoa thường, của application.log vào task3_output.txt; mọi kết quả "User authenticated" trong *.log, có tiền tố tên tệp, vào task4_output.txt. Giữ nguyên log đầu vào. Tính kết quả từ tệp thực tế của bạn.', commands,
         r'\bgrep\b[^\n]*task4_output\.txt', check)
    l['sections'][1]['verification'] = all_checks(
        history(r'\bgrep\b[^\n]*system\.log'), history(r'\bgrep\b[^\n]*access\.log'),
        history(r'\bgrep\b[^\n]*application\.log'), l['sections'][1]['verification'])

    l = lesson(219200, 'Lệnh wc: đếm văn bản', {'requirements.txt': 'Authentication\nBackups\nMonitoring\n',
        'project_overview.md': '# Project\nBuild a reliable service.\n', 'technical_specs.txt': 'Linux server with daily backups.\n',
        'README.md': '# Readme\nRun the application.\n', 'src/main.py': 'print("hello")\n',
        'src/utils.py': 'def identity(value):\n    return value\n', 'src/database.py': 'database = {}\n'})
    wc_rows = [('Cấu trúc dự án', 'List project inputs.', 'Liệt kê dữ liệu của dự án.', 'ls', r'^ls$'),
        ('Đếm dòng', 'Count requirements and source lines.', 'Đếm dòng yêu cầu và mã nguồn.', 'wc -l requirements.txt src/main.py', r'\bwc\s+-l\s+requirements\.txt\s+src/main\.py'),
        ('Đếm từ', 'Count words in both documents.', 'Đếm từ trong hai tài liệu.', 'wc -w project_overview.md technical_specs.txt', r'\bwc\s+-w\s+project_overview\.md\s+technical_specs\.txt'),
        ('Đếm ký tự', 'Count source characters; this does not measure code quality.', 'Đếm ký tự mã nguồn; số ký tự không đánh giá chất lượng mã.', 'wc -m src/utils.py src/database.py', r'\bwc\s+-m\s+src/utils\.py\s+src/database\.py'),
        ('Kết hợp tùy chọn', 'Show lines, words and characters together.', 'Hiển thị số dòng, từ và ký tự cùng lúc.', 'wc -l -w -m README.md', r'\bwc\s+-l\s+-w\s+-m\s+README\.md')]
    for p, (t, en, vi, cmd, pat) in enumerate(wc_rows, 1): task(l, p, t, en, vi, [cmd], pat)

    customers = 'ID,Name,Age,Email\n1,John Doe,25,john.doe@email.com\n2,Jane Smith,35,jane.smith@email.com\n3,Lily Chen,30,lily.chen@email.com\n4,Andy Brown,22,andy.brown@email.com\n'
    books = 'ISBN,Title,Author,Price\n978-1234567890,The Great Adventure,Alice Writer,19.99\n978-2345678901,Mystery in the Woods,Bob Author,24.99\n978-3456789012,Cooking Basics,Carol Chef,15.99\n978-4567890123,Science Explained,David Scientist,29.99\n'
    l = lesson(219187, 'Lệnh cut: trích trường và ký tự', {'customers.txt': customers, 'books.txt': books})
    task(l, 1, 'Xem dữ liệu hiệu sách', 'Read both CSV files.', 'Đọc cả hai tệp CSV.', ['cat customers.txt books.txt'], r'\bcat\s+customers\.txt\s+books\.txt')
    for p, title, command, pat, en, vi in [
        (2, 'Trích tên khách hàng', "cut -d ',' -f 2 customers.txt", r'\bcut\s+.*-f\s+2\s+customers\.txt', 'Select field two.', 'Chọn trường thứ hai.'),
        (3, 'Trích nhiều trường', "cut -d ',' -f 2,3 customers.txt", r'\bcut\s+.*-f\s+2,3\s+customers\.txt', 'Select name and age.', 'Chọn tên và tuổi.'),
        (4, 'Trích một dải trường', "cut -d ',' -f 1-3 customers.txt", r'\bcut\s+.*-f\s+1-3\s+customers\.txt', 'Select the first three fields.', 'Chọn ba trường đầu tiên.')]: task(l,p,title,en,vi,[command],pat)
    task(l,5,'Trường có độ rộng cố định','Create inventory.txt and extract character columns 11–25.', 'Tạo inventory.txt rồi lấy các cột ký tự 11–25.',
         ["printf '%-10s%-15s%s\\n' ISBN Title Stock 1234567890 Linux 10 > inventory.txt", 'cut -c 11-25 inventory.txt'], r'\bcut\s+-c\s+11-25\s+inventory\.txt', 'test -s inventory.txt')
    task(l,6,'Kết hợp lọc và trích trường','Find books priced at least 20 and print titles.', 'Lọc sách có giá ít nhất 20 rồi in tiêu đề.',
         ["grep -E ',[2-9][0-9]\\.[0-9]{2}$' books.txt | cut -d ',' -f 2"], r'\bgrep\s+-E\s+.*books\.txt\s*\|\s*cut\s+.*-f\s+2')

    names = ['David Lee','Alice Johnson','Charlie Brown','Bob Smith','Eve Wilson']
    ages = [21,18,19,20,18]; grades = [87,92,95,88,91]
    l = lesson(219196,'Lệnh sort: sắp xếp văn bản', {'students.txt':'\n'.join(names)+'\n',
        'student_ages.txt':''.join(f'{n}:{a}\n' for n,a in zip(names,ages)),
        'student_grades.txt':''.join(f'{n}:{a}\n' for n,a in zip(names,grades)),
        'student_records.txt':''.join(f'{n}:{a}:{g}\n' for n,a,g in zip(names,ages,grades)),
        'student_clubs.txt':'Alice Johnson:Chess Club\nBob Smith:Debate Team\nAlice Johnson:Chess Club\nBob Smith:Science Club\n'})
    for p,t,cmd,pat,en,vi in [
        (1,'Sắp xếp tên','sort students.txt',r'\bsort\s+students\.txt','Sort names alphabetically.','Sắp xếp tên theo bảng chữ cái.'),
        (2,'Sắp xếp tuổi','sort -n -t: -k2 student_ages.txt',r'\bsort\s+-n\s+-t:\s+-k2\s+student_ages\.txt','Use numeric field two.','Sắp xếp trường thứ hai theo giá trị số.'),
        (3,'Điểm giảm dần','sort -nr -t: -k2 student_grades.txt',r'\bsort\s+-nr\s+.*student_grades\.txt','Order grades highest first.','Xếp điểm cao trước.'),
        (4,'Nhiều khóa','sort -t: -k2n -k3nr student_records.txt',r'\bsort\s+.*-k2n\s+-k3nr\s+student_records\.txt','Sort age ascending, then grade descending.','Xếp tuổi tăng rồi điểm giảm.'),
        (5,'Loại dòng trùng','sort -u student_clubs.txt',r'\bsort\s+-u\s+student_clubs\.txt','Remove duplicate club records.','Loại bản ghi câu lạc bộ trùng.')]: task(l,p,t,en,vi,[cmd],pat)

    purchases='Alice,Electronics\nBob,Books\nCharlie,Clothing\nAlice,Electronics\nDavid,Home Goods\nBob,Books\nEve,Toys\nCharlie,Clothing\nFrank,Sports\nAlice,Electronics\n'
    l=lesson(219199,'Lệnh uniq: lọc dòng trùng',{'customer_purchases.txt':purchases})
    task(l,1,'Xem giao dịch','Read the unsorted purchase records.','Đọc các giao dịch chưa sắp xếp.',['cat customer_purchases.txt'],r'\bcat\s+customer_purchases\.txt')
    for p,t,cmd,name,en,vi in [
        (2,'Sắp xếp dữ liệu','sort customer_purchases.txt','sorted_purchases.txt','Group identical records together.','Đưa bản ghi giống nhau về liền kề.'),
        (3,'Lấy bản ghi duy nhất','uniq sorted_purchases.txt','unique_purchases.txt','Remove adjacent duplicates.','Loại các dòng trùng liền kề.'),
        (4,'Đếm giao dịch','uniq -c sorted_purchases.txt','purchase_counts.txt','Count each repeated record.','Đếm số lần xuất hiện mỗi bản ghi.'),
        (5,'Tìm giao dịch lặp','uniq -d sorted_purchases.txt','repeat_customers.txt','Show records occurring more than once.','Lấy bản ghi xuất hiện nhiều lần.')]: output(l,p,t,en,vi,cmd,name)

    l=lesson(219198,'Lệnh tr: biến đổi ký tự')
    trrows=[('Chuyển chữ hoa','greeting.txt','hello, world',"tr 'a-z' 'A-Z'",r"tr\s+'a-z'\s+'A-Z'",'Translate lowercase to uppercase.','Chuyển chữ thường thành chữ hoa.'),
        ('Xóa dấu câu','punctuated.txt','Hello, World! How are you?',"tr -d '[:punct:]'",r'tr\s+-d\s+.*punct','Delete punctuation.','Xóa các dấu câu.'),
        ('Giải mã dịch ký tự','encoded.txt','Uijt jt b tfdsfu nfttbhf.',"tr 'b-zaB-ZA' 'a-zA-Z'",r"tr\s+'b-zaB-ZA'",'Shift encoded letters back by one.','Dịch lùi chữ cái một vị trí.'),
        ('Lớp ký tự','log_entry.txt','User123 logged in at 09:45 AM on 2023-08-15',"tr -cd '[:digit:]'",r'tr\s+-cd\s+.*digit','Retain only digits.','Chỉ giữ các chữ số.'),
        ('Gộp ký tự lặp','spaced.txt','This    is    a    test    with    extra    spaces.',"tr -s ' '",r'tr\s+-s\s+','Squeeze repeated spaces.','Gộp các dấu cách lặp lại.')]
    import shlex
    for p,(t,name,text,cmd,pat,en,vi) in enumerate(trrows,1): task(l,p,t,en,vi,[f'printf "%s\\n" {shlex.quote(text)} > {name}',f'cat {name} | {cmd}'],r'\bcat\s+'+re.escape(name)+r'\s*\|\s*'+pat,'test -s '+name)

    l=lesson(219189,'Lệnh diff: so sánh tệp',{'file1.txt':'Hello World\nSecond line\n','file2.txt':'Hello Linux\nSecond line\n',
        'script_v1.py':'def greet(name):\n    print("Hello", name)\ngreet("World")\n',
        'script_v2.py':'def greet(name):\n    print("Welcome", name)\ngreet("Linux")\n'})
    for p,t,cmd,pat,en,vi in [
        (1,'So sánh cơ bản','diff file1.txt file2.txt',r'\bdiff\s+file1\.txt\s+file2\.txt','Compare the two text files.','So sánh hai tệp văn bản.'),
        (2,'So sánh mã Python','diff script_v1.py script_v2.py',r'\bdiff\s+script_v1\.py\s+script_v2\.py','Identify code differences.','Tìm các thay đổi trong mã.'),
        (3,'Định dạng unified','diff -u script_v1.py script_v2.py',r'\bdiff\s+-u\s+script_v1\.py','Include context around changes.','Hiển thị ngữ cảnh quanh thay đổi.')]: task(l,p,t,en,vi,[cmd],pat,statuses=[0,1])
    task(l,4,'Bỏ qua khoảng trắng','Create a whitespace variant and compare with -w. Exit status 1 means differences, not a command error.','Tạo biến thể khoảng trắng rồi so sánh bằng -w. Mã 1 biểu thị có khác biệt.',
         ["sed 's/    /        /g' script_v2.py > script_v3.py",'diff -w script_v2.py script_v3.py'],r'\bdiff\s+-w\s+script_v2\.py\s+script_v3\.py','test -s script_v3.py\ndiff -w script_v2.py script_v3.py')
    task(l,5,'So sánh thư mục','Create different directory trees and compare recursively.','Tạo hai cây thư mục khác nhau rồi so sánh đệ quy.',
         ['mkdir -p dir1 dir2',"echo 'This is a file in dir1' > dir1/file.txt","echo 'This is a file in dir2' > dir2/file.txt","echo 'unique to dir1' > dir1/unique1.txt","echo 'unique to dir2' > dir2/unique2.txt",'diff -r dir1 dir2'],r'\bdiff\s+-r\s+dir1\s+dir2', 'test -f dir1/unique1.txt\ntest -f dir2/unique2.txt',statuses=[0,1])

    employees='1001 John Engineering\n1002 Sarah Marketing\n1003 Mike Sales\n1004 Emily HR\n1005 David Finance\n'
    salaries='1001 75000\n1002 65000\n1003 70000\n1004 60000\n1005 80000\n'
    l=lesson(219193,'Lệnh join: ghép tệp',{'employees.txt':employees,'salaries.txt':salaries})
    task(l,1,'Xem hai bảng','Read employee and salary tables.','Đọc bảng nhân viên và lương.',['cat employees.txt salaries.txt'],r'\bcat\s+employees\.txt\s+salaries\.txt')
    task(l,2,'Ghép theo mã','Join records on the first field.','Ghép bản ghi theo trường đầu tiên.',['join employees.txt salaries.txt'],r'\bjoin\s+employees\.txt\s+salaries\.txt')
    task(l,3,'Đổi thứ tự đầu ra','Select name, department, salary and identifier.','Chọn tên, phòng ban, lương rồi mã.',['join -o 1.2,1.3,2.2,1.1 employees.txt salaries.txt'],r'\bjoin\s+-o\s+1\.2,1\.3,2\.2,1\.1')
    task(l,4,'Bản ghi không khớp','Append Alex and include unmatched employees.','Thêm Alex và giữ nhân viên chưa có lương.',["echo '1006 Alex IT' >> employees.txt",'join -a 1 employees.txt salaries.txt'],r'\bjoin\s+-a\s+1\s+employees\.txt',"grep -qx '1006 Alex IT' employees.txt")
    task(l,5,'Ghép theo trường khác','Sort both inputs by their join keys before joining department names.','Sắp xếp cả hai đầu vào theo khóa phòng ban trước khi ghép.',
         ["printf '%s\\n' 'Engineering ENG' 'Marketing MKT' 'Sales SLS' 'HR HRS' 'Finance FIN' 'IT ITS' > departments.txt",'sort -k3,3 employees.txt > employees_by_department.txt','sort departments.txt > departments_sorted.txt','join -1 3 -2 1 employees_by_department.txt departments_sorted.txt'],r'\bjoin\s+-1\s+3\s+-2\s+1\s+employees_by_department\.txt', 'test -s departments_sorted.txt')

    l=lesson(219201,'Lệnh xargs: dựng đối số',{'fruits.txt':'apple\nbanana\norange\n', 'books.txt':'linux\nnetworking\nscripting\n',
        'more_books.txt':'alpha\nbeta\ngamma\ndelta\nepsilon\n','classic_books.txt':'hamlet\nodyssey\niliad\n',
        'process_book.sh':'#!/bin/sh\nprintf "Processing %s\\n" "$1" > "/home/labex/project/processed_$1"\n'})
    l['setup']['files'][-1]['mode']='0755'
    task(l,1,'Dữ liệu thành đối số','Build one echo invocation from fruit names.','Đưa tên trái cây thành đối số cho echo.',['cat fruits.txt | xargs echo'],r'\bcat\s+fruits\.txt\s*\|\s*xargs\s+echo')
    task(l,2,'Tạo tệp theo danh sách','Create a .txt file for each book with a placeholder.','Dùng vị trí thay thế để tạo tệp .txt cho mỗi sách.', ['cat books.txt | xargs -I {} touch {}.txt'],r'\bxargs\s+-I\s+\{\}\s+touch', 'test -f linux.txt\ntest -f networking.txt\ntest -f scripting.txt')
    task(l,3,'Giới hạn đối số','Process two book names per invocation.','Xử lý hai tên sách trong mỗi lần gọi.', ['cat more_books.txt | xargs -n 2 echo "Processing books:"'],r'\bxargs\s+-n\s+2\s+echo')
    task(l,4,'Xử lý song song','Run at most three processing scripts concurrently.','Chạy đồng thời tối đa ba script xử lý.', ['cat more_books.txt | xargs -P 3 -I {} ./process_book.sh {}'],r'\bxargs\s+-P\s+3\s+-I\s+\{\}\s+\./process_book\.sh','for x in alpha beta gamma delta epsilon; do test -s "processed_$x" || exit 1; done')
    task(l,5,'Kết hợp giới hạn và song song','Pass pairs to sh -c with at most three workers.','Truyền từng cặp vào sh -c với tối đa ba tiến trình.', ["cat classic_books.txt | xargs -n 2 -P 3 sh -c 'echo \"Processing batch: $@\"' _"],r'\bxargs\s+-n\s+2\s+-P\s+3\s+sh\s+-c')

    server_logs='2024-05-22 09:00:00 10.0.0.1 GET / 200\n2024-05-22 09:00:01 10.0.0.2 POST /login 401\n2024-05-22 09:00:02 10.0.0.1 GET /missing 404\n2024-05-22 09:00:03 10.0.0.3 POST /api 200\n'
    l=lesson(388493,'Lệnh awk: xử lý văn bản',{'server_logs.txt':server_logs})
    task(l,1,'Xem log máy chủ','Inspect field positions in the log.','Xem vị trí các trường trong log.',['head server_logs.txt'],r'\bhead\s+server_logs\.txt')
    task(l,2,'In trường cụ thể','Print client addresses and requested resources.','In địa chỉ máy khách và tài nguyên yêu cầu.',["awk '{print $3, $5}' server_logs.txt | head -n 5"],r'\bawk\s+.*print\s+\$3,\s*\$5.*server_logs\.txt')
    task(l,3,'Lọc yêu cầu','Print POST requests returning an error.','In yêu cầu POST trả về lỗi.', ["awk '$4 == \"POST\" && $6 >= 400 {print $0}' server_logs.txt"],r'\bawk\s+.*POST.*\$6\s*>=\s*400.*server_logs\.txt')
    task(l,4,'Tổng hợp trạng thái','Count responses by status code.','Đếm phản hồi theo mã trạng thái.', ["awk '{count[$6]++} END {for (code in count) print code, count[code]}' server_logs.txt | sort -n"],r'\bawk\s+.*count\[\$6\].*END.*server_logs\.txt')
    report='''function top5(counts, heading,    i,k,best) {
    print "<h2>" heading "</h2><ul>"
    for (i=0; i<5; i++) {
        best=""
        for (k in counts) if (best=="" || counts[k]>counts[best]) best=k
        if (best=="") break
        print "<li>" best ": " counts[best] " requests</li>"
        delete counts[best]
    }
    print "</ul>"
}
BEGIN { print "<html><body><h1>Server Log Summary</h1>" }
{ total++; if ($6>=400) errors++; ips[$3]++; resources[$5]++ }
END {
    print "<p>Total requests: " total "</p>"
    print "<p>Error rate: " (total ? 100*errors/total : 0) "%</p>"
    top5(ips,"Top 5 IP Addresses")
    top5(resources,"Top 5 Requested Resources")
    print "</body></html>"
}
'''
    task(l,5,'Tạo báo cáo HTML','Create an AWK report with request totals, error rate, top five IPs and resources.','Tạo báo cáo AWK gồm tổng yêu cầu, tỷ lệ lỗi, năm IP và tài nguyên thường gặp.',
         ["cat > log_report.awk <<'AWK'\n"+report+'AWK','awk -f log_report.awk server_logs.txt > log_report.html'],r'\bawk\s+-f\s+log_report\.awk\s+server_logs\.txt\s*>\s*log_report\.html',
         "test -s log_report.awk\ngrep -qi '<html' log_report.html\ngrep -q 'Total requests: 4' log_report.html\ngrep -q 'Error rate: 50%' log_report.html\ngrep -q 'Top 5 IP Addresses' log_report.html\ngrep -q '10.0.0.1: 2 requests' log_report.html\ngrep -q 'Top 5 Requested Resources' log_report.html\ncmp -s log_report.html <(awk -f log_report.awk server_logs.txt)")

    access=''.join(f'10.0.0.{i} GET / 200\n' for i,count in enumerate([9,7,5,3,2,1],1) for _ in range(count))
    l=lesson(388125,'Đếm từ và sắp xếp',{'access.log':access,'documents/guide.txt':'Linux commands help administrators.\n','documents/notes.txt':'Practice every day.\n','numbers.txt':'9\n100\n3\n55\n1000\n82\n17\n6\n44\n210\n71\n38\n'})
    for p,t,cmd,name,en,vi in [
        (1,'Đếm dòng log','wc -l < access.log','task1_output.txt','In /home/labex/project, use wc to count access.log lines. Save one integer only, without the filename, to task1_output.txt. Preserve access.log.','Trong /home/labex/project, dùng wc đếm dòng access.log. Lưu duy nhất số nguyên, không kèm tên tệp, vào task1_output.txt. Giữ nguyên access.log.'),
        (2,'Năm IP thường gặp',"cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -n 5 | awk '{print $2}'",'task2_output.txt','Extract the first field of access.log, count frequencies using sort and uniq, then save the five most frequent IPs in descending frequency order to task2_output.txt. Save one IP per line without counts; preserve the log.','Trích trường đầu của access.log, dùng sort và uniq đếm số lần xuất hiện, rồi lưu năm IP phổ biến nhất theo tần suất giảm dần vào task2_output.txt. Mỗi dòng chỉ có IP, không có số lần; giữ nguyên log.'),
        (3,'Tổng số từ',"wc -w documents/*.txt | tail -n 1 | awk '{print $1}'",'task3_output.txt','Use wc to count words across every documents/*.txt file. Save only the combined total integer to task3_output.txt, without filenames or the word total. Preserve the documents.','Dùng wc đếm từ trong mọi tệp documents/*.txt. Lưu duy nhất tổng số nguyên vào task3_output.txt, không kèm tên tệp hay chữ total. Giữ nguyên tài liệu.'),
        (4,'Mười số lớn nhất','sort -nr numbers.txt | head -n 10','task4_output.txt','Sort numbers.txt numerically in descending order. Save exactly the ten highest numbers, one per line, to task4_output.txt. Preserve repeated values and the input file.','Sắp xếp numbers.txt theo giá trị số giảm dần. Lưu đúng mười số lớn nhất, mỗi dòng một số, vào task4_output.txt. Giữ các giá trị lặp và giữ nguyên tệp đầu vào.')]:
        pattern = {1:r'\bwc\b',2:r'\bsort\b',3:r'\bwc\b',4:r'\bsort\b'}[p]
        output(l,p,t,en,vi,cmd,name,pattern)
        if p == 2:
            l['sections'][p]['verification'] = all_checks(history(r'\buniq\b'),l['sections'][p]['verification'])

    # Preserve the public example's first three records and reconstruct the
    # remaining rows; the source describes a 50-employee exercise.
    employee_rows = {1:('John','Doe','Sales'),2:('Jane','Smith','Marketing'),3:('Bob','Johnson','Engineering')}
    employee_rows.update({i:(f'Employee{i:02d}', f'Local{i:02d}', ['Sales','Marketing','Engineering','Finance','HR'][i%5]) for i in range(4,51)})
    ids = sorted(employee_rows, key=str)  # GNU join's textual key order.
    l=lesson(388132,'Xử lý dữ liệu nhân viên',{
        'employees.txt':''.join(f'{i} {employee_rows[i][0]} {employee_rows[i][1]}\n' for i in ids),
        'departments.txt':''.join(f'{i} {employee_rows[i][2]}\n' for i in ids)})
    output(l,1,'Ghép và định dạng dữ liệu','Work in /home/labex/project. Use join to combine employees.txt and departments.txt on employee ID. Use awk to print the employee’s two name fields followed by "works in" and the department; for example, John Doe works in Sales. Sort the complete lines alphabetically and save employee_departments.txt. Omit IDs and preserve both inputs. The local dataset is reconstructed, so names can differ from the source examples.',
           'Làm trong /home/labex/project. Dùng join ghép employees.txt với departments.txt theo mã nhân viên. Dùng awk in hai trường tên, tiếp theo là "works in" và phòng ban; ví dụ John Doe works in Sales. Sắp xếp các dòng theo bảng chữ cái rồi lưu employee_departments.txt, không kèm mã. Giữ nguyên hai tệp đầu vào. Bộ dữ liệu local được tái dựng nên tên có thể khác ví dụ nguồn.',
           "join employees.txt departments.txt | awk '{print $2, $3, \"works in\", $4}' | sort",'employee_departments.txt',r'\bjoin\s+employees\.txt\s+departments\.txt[^\n]*\bawk\b[^\n]*employee_departments\.txt')
    previous = l['sections'][1]['verification']
    l['sections'][1]['verification'] = all_checks(
        history(r'\bjoin\b[^\n]*(?:employees\.txt[^\n]*departments\.txt|departments\.txt[^\n]*employees\.txt)'),
        history(r'\bawk\b'), previous['checks'][-1])

    l=lesson(388500,'Lệnh top: theo dõi hệ thống trực tiếp')
    for p,t,cmd,pat,en,vi in [
        (1,'Theo dõi tiến trình','top',r'^top$','Read the live display; press q to return.','Đọc màn hình trực tiếp; nhấn q để trở lại.'),
        (2,'Sắp xếp theo bộ nhớ','top -o %MEM',r'^top\s+-o\s+%MEM$','Sort by memory. -o %MEM selects the same ordering as interactive M; press q.','Xếp theo bộ nhớ. -o %MEM tương đương phím M trong top; nhấn q.'),
        (3,'Chu kỳ cập nhật','top -d 1',r'^top\s+-d\s+1$','Update every second; exit with q.','Cập nhật mỗi giây; thoát bằng q.'),
        (4,'Tiến trình người dùng','top -u labex',r'^top\s+-u\s+labex$','Show labex processes; exit with q.','Xem tiến trình của labex; thoát bằng q.'),
        (5,'Chỉ hiện tiến trình hoạt động','top -i',r'^top\s+-i$','Hide idle tasks; exit with q.','Ẩn tiến trình nhàn rỗi; thoát bằng q.')]:
        task(l,p,t,en,vi,[{'command':cmd,'input':[{'wait_for':'PID','text':'q'}]}],pat)

    l=lesson(388496,'Lệnh free: theo dõi bộ nhớ')
    for p,t,cmd,pat,en,vi in [
        (1,'Tổng quan bộ nhớ','free',r'^free$','Read RAM and swap usage.','Đọc mức sử dụng RAM và swap.'),
        (2,'Đơn vị dễ đọc','free -h',r'^free\s+-h$','Use human-readable units.','Dùng đơn vị dễ đọc.'),
        (3,'Đơn vị MiB','free -m',r'^free\s+-m$','Display memory in mebibytes.','Hiển thị bộ nhớ theo MiB.'),
        (4,'Theo dõi liên tục','free -h -s 3 -c 5',r'^free\s+-h\s+-s\s+3\s+-c\s+5$','Take five samples three seconds apart.','Lấy năm mẫu, cách nhau ba giây.'),
        (5,'Hiển thị tổng','free -h -t',r'^free\s+-h\s+-t$','Include the RAM-plus-swap total.','Hiển thị tổng RAM và swap.')]: task(l,p,t,en,vi,[cmd],pat)

    l=lesson(219188,'Lệnh df: dung lượng hệ thống tệp')
    for p,t,cmd,pat,en,vi in [
        (1,'Xem dung lượng','df',r'^df$','Inspect mounted filesystems.','Xem các hệ thống tệp đã gắn.'),
        (2,'Đơn vị dễ đọc','df -h',r'^df\s+-h$','Read sizes with unit suffixes.','Đọc kích thước kèm đơn vị.'),
        (3,'Loại hệ thống tệp','df -T',r'^df\s+-T$','Display filesystem types.','Hiển thị loại hệ thống tệp.'),
        (4,'Sử dụng inode','df -i',r'^df\s+-i$','Inspect inode counts instead of blocks.','Xem số inode thay cho khối dung lượng.'),
        (5,'Kết hợp tùy chọn','df -hT',r'^df\s+-hT$','Combine readable sizes and filesystem types.','Kết hợp đơn vị dễ đọc và loại hệ thống tệp.'),
        (6,'Phân vùng gốc','df -h /',r'^df\s+-h\s+/$','Inspect the root filesystem.','Xem hệ thống tệp chứa thư mục gốc.'),
        (7,'Dung lượng thư mục home','df -h /home',r'^df\s+-h\s+/home$','Inspect the filesystem containing /home.','Xem hệ thống tệp chứa /home.'),
        (8,'Loại trừ tmpfs','df -h -x tmpfs',r'^df\s+-h\s+-x\s+tmpfs$','Exclude tmpfs entries.','Loại các mục tmpfs.'),
        (9,'Tổng dung lượng','df -h --total',r'^df\s+-h\s+--total$','Append the aggregate total row.','Thêm dòng tổng hợp dung lượng.')]:task(l,p,t,en,vi,[cmd],pat)

    l=lesson(219190,'Lệnh du: dung lượng tệp và thư mục', {'data/small.txt':'small\n','data/large.txt':'large local fixture\n'*100,'logs/server.log':'log\n'*50,'documents/notes.txt':'notes\n'})
    for p,t,cmd,pat,en,vi in [
        (1,'Dung lượng thư mục','du -h',r'^du\s+-h$','Read recursive directory sizes.','Đọc dung lượng thư mục đệ quy.'),
        (2,'Giới hạn độ sâu','du -h --max-depth=1',r'^du\s+-h\s+--max-depth=1$','Limit results to immediate subdirectories.','Giới hạn kết quả ở thư mục con trực tiếp.'),
        (3,'Sắp xếp dung lượng','du -h --max-depth=1 | sort -hr',r'\bdu\s+-h\s+--max-depth=1\s*\|\s*sort\s+-hr','Sort sizes largest first.','Xếp dung lượng lớn trước.'),
        (4,'Năm tệp lớn nhất','find . -type f -exec du -h {} + | sort -hr | head -n 5',r'\bfind\s+\.\s+-type\s+f\s+-exec\s+du\s+-h.*sort\s+-hr.*head\s+-n\s+5','Rank individual files by allocated size.','Xếp hạng tệp theo dung lượng đã cấp phát.')]:task(l,p,t,en,vi,[cmd],pat)
    task(l,5,'Báo cáo dung lượng','Save a depth-two usage report.','Lưu báo cáo dung lượng đến độ sâu hai.',
         ['du -h --max-depth=2 | sort -hr > disk_usage_report.txt'],
         r'\bdu\s+-h\s+--max-depth=2\s*\|\s*sort\s+-hr\s*>\s*disk_usage_report\.txt',
         "test -s disk_usage_report.txt\ngrep -Eq '[[:space:]]\\./data$' disk_usage_report.txt\ngrep -Eq '[[:space:]]\\./documents$' disk_usage_report.txt\nsort -hcr disk_usage_report.txt")

    l=lesson(388099,'Điều tra dung lượng đĩa',{'data/local.txt':'local storage fixture\n'*1000})
    cmds=['df -h > disk_usage.txt','du -sh /home/labex > home_size.txt',"du -h --max-depth=1 /home/labex | sort -hr | awk '$2 != \"/home/labex\" {print $2; exit}' > largest_subdir.txt"]
    check="test -s disk_usage.txt\ngrep -q '^Filesystem' disk_usage.txt\nawk 'NR>1 && $5 ~ /%$/ {found=1} END {exit !found}' disk_usage.txt\ntest -s home_size.txt\ngrep -Eq '[[:space:]]/home/labex$' home_size.txt\nexpected=$(du -h --max-depth=1 /home/labex | sort -hr | awk '$2 != \"/home/labex\" {print $2; exit}')\ntest -n \"$expected\"\ngot=$(cat largest_subdir.txt)\ntest \"$got\" = \"$expected\" || test \"$got\" = \"${expected##*/}\""
    task(l,1,'Phân tích dung lượng','Work in ~/project. Use df -h to inspect all mounted filesystems, save the complete table to disk_usage.txt, and identify the highest Use% row. Use du with human-readable units to save the total size and /home/labex path to home_size.txt. Limit another du scan to immediate subdirectories and save only the largest subdirectory’s name or full path to largest_subdir.txt, excluding /home/labex itself. Measurements depend on the actual container; no extra file is required for the highest-Use% observation.',
         'Làm trong ~/project. Dùng df -h xem mọi hệ thống tệp đã gắn, lưu toàn bộ bảng vào disk_usage.txt và xác định dòng có Use% cao nhất. Dùng du với đơn vị dễ đọc để lưu tổng dung lượng kèm đường dẫn /home/labex vào home_size.txt. Giới hạn lần quét du khác ở các thư mục con trực tiếp rồi lưu riêng tên hoặc đường dẫn đầy đủ của thư mục con lớn nhất vào largest_subdir.txt; loại chính /home/labex. Đọc số liệu container thực tế; phần xác định Use% cao nhất không cần tệp bổ sung.',cmds,r'\bdu\b',check)
    l['sections'][1]['verification']=all_checks(history(r'\bdf\b'),history(r'\bdu\b'),l['sections'][1]['verification'])

    l=lesson(219197,'Lệnh time: đo thời gian chạy')
    task(l,1,'Đo thao tác đọc tệp','Create test_file.txt and time reading it. Bash labels real/user/sys differ from Zsh examples.','Tạo test_file.txt rồi đo thời gian đọc. Bash hiển thị real/user/sys khác ví dụ Zsh.',
         ["echo \"This is a test file for TechInnovate's performance analysis.\" > test_file.txt",'time cat test_file.txt'],r'^time\s+cat\s+test_file\.txt$','test -s test_file.txt')
    script='#!/bin/bash\nfor i in {1..1000}; do echo "Processing log entry $i" >> output.log; done\nsort output.log > sorted_output.log\nuniq -c sorted_output.log > final_output.log\nrm output.log sorted_output.log\n'
    task(l,2,'Đo thời gian script','Create and time the log-processing script.','Tạo và đo thời gian script xử lý log.',["cat > process_logs.sh <<'SH'\n"+script+'SH','chmod +x process_logs.sh','time ./process_logs.sh'],r'^time\s+\./process_logs\.sh$', 'test -x process_logs.sh\ntest "$(wc -l < final_output.log)" -eq 1000\ntest ! -e output.log\ntest ! -e sorted_output.log')
    task(l,3,'So sánh các loại tải','Time a numeric pipeline, file search and passwd sort. Runtime values vary.','Đo pipeline số, tìm tệp và sắp xếp passwd. Thời gian thực tế có thể khác.',
         ['time echo {1..10000} | wc -w','time find / -name "*.txt" 2>/dev/null','time sort -R /etc/passwd | head -n 5'],r'^time\s+sort\s+-R\s+/etc/passwd\s*\|\s*head\s+-n\s+5$')
    # Challenge outputs must not be made correct by editing their input datasets.
    import hashlib
    for sid in (388109, 388125, 388132):
        lab = result[sid]
        entries = ''.join(hashlib.sha256(f['content'].encode()).hexdigest()+'  '+f['path']+'\n' for f in lab['setup']['files'])
        immutable = state('set -e\nprintf %s '+shlex.quote(entries)+' | sha256sum -c - >/dev/null')
        for section in lab['sections'].values():
            section['verification'] = all_checks(immutable, section['verification'])
    return result
