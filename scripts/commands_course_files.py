"""Commands course 1–10: public requirements, locally written EN/VI and checks.

Reviewed official tutorial pages 2026-10-17. Starter file bodies not published
by the source are reconstructed fixtures; private LabEx graders are unknown.
No generation side effects: build() returns definitions for the course builder.
"""
from commands_course_common import BASE, state, history, all_checks, file, directory
import shlex


def task(title, en, vi, commands, rule, capabilities=None):
    example='\n\n```bash\n'+'\n'.join(c if isinstance(c,str) else c['command'] for c in commands)+'\n```' if commands else ''
    return dict(title_vi=title, en=en+example, vi=vi+example, commands=commands,
                verification=rule, **({'capabilities': capabilities} if capabilities else {}))


def manifest(dirs=(), files=(), **extra):
    return dict(version=1, directories=[directory(p) for p in dirs],
                files=[file(*f) for f in files], accounts=[], groups=[],
                provenance={'notes':'Public source paths; unpublished file bodies reconstructed locally.'}, **extra)


def present(*paths):
    return state(' && '.join('test -e '+shlex.quote(BASE+p) for p in paths))


def absent(*paths):
    return state(' && '.join('test ! -e '+shlex.quote(BASE+p) for p in paths))


def same(a, b):
    return state('test -f '+BASE+b+' && cmp -s '+BASE+a+' '+BASE+b)


def observation(title, en, vi, commands, *patterns):
    return task(title, en, vi, commands, all_checks(*(history(p) for p in patterns)))


def build():
    lessons = {}
    def put(i, title, sections, setup=None):
        lessons[i] = dict(title_vi=title, sections=sections, setup=setup or manifest())

    ls = {}
    specs = [
        ('Quan sát thư mục', 'List visible entries.', 'Liệt kê mục hiện trong thư mục.', ['ls'], [r'^\s*ls\s*$']),
        ('Hiện mục ẩn', 'Include dot-prefixed entries.', 'Hiện cả tên bắt đầu bằng dấu chấm.', ['ls -a'], [r'^\s*ls\s+-(?:[A-Za-z]*a[A-Za-z]*)\s*$']),
        ('Đọc thuộc tính tệp', 'Inspect permissions, owner, size and modification time.', 'Đọc quyền, chủ sở hữu, kích thước và thời gian sửa.', ['ls -l'], [r'^\s*ls\s+-[A-Za-z]*l[A-Za-z]*\s*$']),
        ('Kích thước dễ đọc', 'Show detailed sizes with readable units.', 'Xem kích thước chi tiết theo đơn vị dễ đọc.', ['ls -lh'], [r'^\s*ls\s+(?=[^\n]*l)(?=[^\n]*h)-[A-Za-z]+\s*$']),
        ('Kết hợp tùy chọn', 'Combine hidden entries, details and readable sizes.', 'Kết hợp mục ẩn, thông tin chi tiết và đơn vị dễ đọc.', ['ls -alh'], [r'^\s*ls\s+(?=[^\n]*a)(?=[^\n]*l)(?=[^\n]*h)-[A-Za-z]+\s*$']),
        ('Sắp xếp kết quả', 'Compare newest-first and oldest-first listings.', 'So sánh thứ tự mới nhất và cũ nhất.', ['ls -lt','ls -ltr'], [r'^\s*ls\s+(?=[^\n]*l)(?=[^\n]*t)-[A-Za-z]+\s*$',r'^\s*ls\s+(?=[^\n]*l)(?=[^\n]*t)(?=[^\n]*r)-[A-Za-z]+\s*$']),
        ('Xem thư mục con', 'Inspect test without changing directory.', 'Xem test mà không chuyển thư mục.', ['ls -l test'], [r'^\s*ls\s+-[A-Za-z]*l[A-Za-z]*\s+(?:\./)?test/?\s*$']),
        ('Pipe và màu sắc', 'Pipe a listing to cowsay; disable ls colors.', 'Chuyển kết quả qua cowsay; tắt màu của ls.', ['ls | cowsay','ls --color=never'], [r'^\s*ls\s*\|\s*(?:/usr/games/)?cowsay\s*$',r'^\s*ls\s+--color=never\s*$'])]
    for p,(title,en,vi,cmds,patterns) in enumerate(specs,1):
        ls[p] = observation(title,en,vi,cmds,*patterns)
    put(219205,'Lệnh ls: liệt kê nội dung',ls,manifest([BASE+'test'],[(BASE+'data_file.txt','sample data\n'),(BASE+'test_file.txt','A local listing fixture.\n')]))

    put(209734,'Lệnh pwd: hiển thị thư mục',{
        1: observation('Vị trí ban đầu','Print the current absolute path.','In đường dẫn tuyệt đối hiện tại.',['pwd'],r'^\s*pwd\s*$'),
        2: observation('Nội dung và vị trí','List entries, then print the directory again.','Liệt kê nội dung rồi in lại đường dẫn.',['ls','pwd'],r'^\s*ls\s*$',r'^\s*pwd\s*$'),
        3: observation('Đường dẫn logic và vật lý','Enter symlink_dir; compare pwd, pwd -L and pwd -P. The physical directory is real_dir.','Vào symlink_dir; so sánh pwd, pwd -L và pwd -P. Thư mục thật là real_dir.',['cd '+BASE+'symlink_dir','pwd','pwd -L','pwd -P'],r'^\s*cd\s+(?:/home/labex/project/|~/project/)?symlink_dir/?\s*$',r'^\s*pwd\s+-L\s*$',r'^\s*pwd\s+-P\s*$')
    },manifest([BASE+'real_dir'],symlinks=[dict(path=BASE+'symlink_dir',target=BASE+'real_dir')]))

    put(387844,'Thử thách điều hướng thư mục',{
        1: observation('Khám phá thư mục','In /home/labex/project, use separate pwd and ls commands to show the path, hidden entries and long listing. Do not use pipes.','Trong /home/labex/project, dùng riêng pwd và ls để xem vị trí, mục ẩn và danh sách chi tiết; không dùng pipe.',['pwd','ls -a','ls -l'],r'^\s*pwd\s*$',r'^\s*ls\s+-[A-Za-z]*a[A-Za-z]*\s*$',r'^\s*ls\s+-[A-Za-z]*l[A-Za-z]*\s*$')
    },manifest([BASE+'directory1'],[(BASE+'.hidden_file','hidden\n'),(BASE+'file1.txt','one\n'),(BASE+'file2.txt','two\n')]))

    put(209733,'Lệnh cd: chuyển thư mục',{
        1: observation('Vị trí ban đầu','Print your location.','In vị trí hiện tại.',['pwd'],r'^\s*pwd\s*$'),
        2: observation('Về thư mục nhà','Go home and inspect the path.','Về thư mục nhà và xem đường dẫn.',['cd ~','pwd'],r'^\s*cd(?:\s+(?:~|/home/labex|\$HOME))?\s*$'),
        3: observation('Dùng đường dẫn tương đối','From home, enter project.','Từ thư mục nhà, vào project.',['cd project','pwd'],r'^\s*cd\s+project/?\s*$'),
        4: observation('Về thư mục cha','Move up one directory.','Lên một cấp thư mục.',['cd ..','pwd'],r'^\s*cd\s+\.\./?\s*$'),
        5: observation('Quay lại vị trí trước','Enter project, then return with cd -.','Vào project rồi quay lại bằng cd -.',['cd project','cd -','pwd'],r'^\s*cd\s+-\s*$'),
        6: observation('Đường dẫn tuyệt đối','Visit /etc, inspect it, then return to /home/labex.','Vào /etc, xem nội dung rồi trở lại /home/labex.',['cd /etc','pwd','ls','cd /home/labex'],r'^\s*cd\s+/etc/?\s*$',r'^\s*cd\s+/home/labex/?\s*$'),
        7: task('Đi qua mê cung','Create maze/twisty/little/passages under home; enter it and return home.','Tạo maze/twisty/little/passages trong thư mục nhà; đi vào rồi trở về.',['cd ~','mkdir -p maze/twisty/little/passages','cd maze/twisty/little/passages','pwd','cd ~'],all_checks(state('test -d /home/labex/maze/twisty/little/passages'),history(r'^\s*cd\s+(?:/home/labex/|~/)?maze/twisty/little/passages/?\s*$')))
    })

    garden=BASE+'digital_garden/'
    put(209739,'Lệnh mkdir: tạo thư mục',{
        1: task('Tạo gốc khu vườn','Create digital_garden.','Tạo digital_garden.',['mkdir digital_garden'],present('digital_garden')),
        2: task('Tạo các khu vực','Add notes, projects and resources.','Thêm notes, projects và resources.',['mkdir '+garden+'notes '+garden+'projects '+garden+'resources'],present('digital_garden/notes','digital_garden/projects','digital_garden/resources')),
        3: task('Tạo thư mục lồng nhau','Create projects/web_app/src/components using -p.','Tạo projects/web_app/src/components bằng -p.',['mkdir -p '+garden+'projects/web_app/src/components'],present('digital_garden/projects/web_app/src/components')),
        4: task('Quyền truy cập','Create private with mode 700.','Tạo private với quyền 700.',['mkdir -m 700 '+garden+'private'],state('test -d '+garden+'private && test "$(stat -c %a '+garden+'private)" = 700')),
        5: task('Thông báo chi tiết','Use -v to create resources/books, articles and videos.','Dùng -v tạo resources/books, articles và videos.',['mkdir -v '+garden+'resources/books '+garden+'resources/articles '+garden+'resources/videos'],all_checks(present('digital_garden/resources/books','digital_garden/resources/articles','digital_garden/resources/videos'),history(r'^\s*mkdir\s+[^\n]*-\w*v\w*\b'))),
        6: task('Kết hợp tùy chọn','Create research_paper/drafts and references under projects using -pvm 750.','Tạo research_paper/drafts và references trong projects bằng -pvm 750.',['mkdir -pvm 750 '+garden+'projects/research_paper/drafts '+garden+'projects/research_paper/references'],state('test -d '+garden+'projects/research_paper/drafts && test "$(stat -c %a '+garden+'projects/research_paper/drafts)" = 750 && test "$(stat -c %a '+garden+'projects/research_paper/references)" = 750')),
        7: observation('Xem cây thư mục','Display the garden tree with and without permissions.','Xem cây khu vườn, rồi hiện thêm quyền.',['tree '+garden,'tree -p '+garden],r'^\s*tree\s+(?:/home/labex/project/|~/project/)?digital_garden/?\s*$',r'^\s*tree\s+-p\s+(?:/home/labex/project/|~/project/)?digital_garden/?\s*$')
    })

    put(387859,'Thiết lập cấu trúc dự án',{
        1: task('Tạo và di chuyển trong cây thư mục','Use mkdir and cd to build frontend/css, frontend/js, backend/api and backend/database in project; navigate through the result.','Dùng mkdir và cd tạo frontend/css, frontend/js, backend/api, backend/database trong project rồi đi qua cây thư mục.',['mkdir -p frontend/css frontend/js backend/api backend/database','cd frontend/css','cd ../../backend/api'],all_checks(present('frontend/css','frontend/js','backend/api','backend/database'),history(r'^\s*cd\s+[^\n]*(?:frontend|backend)[^\n]*$')))
    })

    cpdirs=[BASE+p for p in ['music','documents','website','website/css','text_files','pdf_files']]
    cpfiles=[(BASE+p,c) for p,c in [('important_report.txt','Quarterly report\n'),('favorite_song.mp3','Local audio fixture\n'),('report1.txt','Report one\n'),('report2.txt','Report two\n'),('notes.txt','Notes\n'),('test_file.txt','Original content\n'),('new_test_file.txt','New content\n'),('website/index.html','<h1>Website</h1>\n'),('website/css/styles.css','body { color: navy; }\n'),('old_file.txt','Preserve my attributes\n'),('manual.pdf','Local PDF fixture\n')]]
    put(209744,'Lệnh cp: sao chép tệp',{
        1: task('Sao lưu một tệp','Copy important_report.txt to important_report_backup.txt.','Chép important_report.txt thành important_report_backup.txt.',['cp important_report.txt important_report_backup.txt'],same('important_report.txt','important_report_backup.txt')),
        2: task('Chép sang thư mục khác','Copy favorite_song.mp3 into music.','Chép favorite_song.mp3 vào music.',['cp favorite_song.mp3 music/'],same('favorite_song.mp3','music/favorite_song.mp3')),
        3: task('Chép nhiều tệp','Copy report1.txt, report2.txt and notes.txt into documents.','Chép report1.txt, report2.txt và notes.txt vào documents.',['cp report1.txt report2.txt notes.txt documents/'],all_checks(*(same(p,'documents/'+p) for p in ['report1.txt','report2.txt','notes.txt']))),
        4: task('Xác nhận ghi đè','Run cp -i new_test_file.txt test_file.txt; answer y to replace the original.','Chạy cp -i new_test_file.txt test_file.txt; trả lời y để ghi đè.',[{'command':'cp -i new_test_file.txt test_file.txt','input':[{'wait_for':'overwrite','text':'y'}]}],all_checks(same('new_test_file.txt','test_file.txt'),history(r'^\s*cp\s+-\w*i\w*\s+[^\n]*new_test_file\.txt\s+[^\n]*test_file\.txt\s*$'))),
        5: task('Sao chép đệ quy','Copy the website directory into website_backup.','Sao chép cả website thành website_backup.',['cp -r website website_backup'],state('test -d '+BASE+'website_backup && diff -qr '+BASE+'website '+BASE+'website_backup')),
        6: task('Giữ thuộc tính','Copy old_file.txt to preserved_file.txt with -p; compare metadata.','Chép old_file.txt thành preserved_file.txt bằng -p; so sánh thuộc tính.',['cp -p old_file.txt preserved_file.txt'],all_checks(same('old_file.txt','preserved_file.txt'),state('test "$(stat -c %a:%u:%g:%Y '+BASE+'old_file.txt)" = "$(stat -c %a:%u:%g:%Y '+BASE+'preserved_file.txt)"'),history(r'^\s*cp\s+-\w*p\w*\s+[^\n]*old_file\.txt\s+[^\n]*preserved_file\.txt\s*$'))),
        7: task('Sao chép theo mẫu','Copy *.txt into text_files and *.pdf into pdf_files.','Chép *.txt vào text_files và *.pdf vào pdf_files.',['cp *.txt text_files/','cp *.pdf pdf_files/'],state('for src in '+BASE+'*.txt; do cmp -s "$src" '+BASE+'text_files/"${src##*/}" || exit 1; done; for src in '+BASE+'*.pdf; do cmp -s "$src" '+BASE+'pdf_files/"${src##*/}" || exit 1; done'))
    },manifest(cpdirs,cpfiles))

    mvfiles=[(BASE+p,c) for p,c in [('index.html','<h1>Home</h1>\n'),('styles.css','body{}\n'),('script.js','console.log(1);\n'),('utils.js','function util() {}\n')]]
    put(209743,'Lệnh mv: di chuyển và đổi tên',{
        1: observation('Xem dự án','Inspect the starting project.','Xem nội dung dự án ban đầu.',['pwd','ls'],r'^\s*ls\s*$'),
        2: task('Di chuyển tệp','Create css and move styles.css into it.','Tạo css và chuyển styles.css vào đó.',['mkdir css','mv styles.css css/'],all_checks(present('css/styles.css'),absent('styles.css'),state("grep -Fxq 'body{}' "+BASE+'css/styles.css'))),
        3: task('Đổi tên tệp','Rename index.html to home.html.','Đổi index.html thành home.html.',['mv index.html home.html'],all_checks(present('home.html'),absent('index.html'),state("grep -Fxq '<h1>Home</h1>' "+BASE+'home.html'))),
        4: task('Di chuyển theo mẫu','Create scripts and move every .js file into it.','Tạo scripts và chuyển mọi tệp .js vào đó.',['mkdir scripts','mv *.js scripts/'],all_checks(present('scripts/script.js','scripts/utils.js'),absent('script.js','utils.js'))),
        5: task('Từ chối ghi đè','Create test.txt containing Test content; run mv -i test.txt home.html and answer n. Both files must survive.','Tạo test.txt chứa Test content; chạy mv -i test.txt home.html và trả lời n. Cả hai tệp phải còn.',['echo "Test content" > test.txt',{'command':'mv -i test.txt home.html','input':[{'wait_for':'overwrite','text':'n'}]}],all_checks(present('test.txt','home.html'),state("grep -Fxq 'Test content' "+BASE+"test.txt && grep -Fxq '<h1>Home</h1>' "+BASE+'home.html'),history(r'^\s*mv\s+-\w*i\w*\s+(?:\./)?test\.txt\s+(?:\./)?home\.html\s*$')))
    },manifest([BASE+'images'],mvfiles))

    rmfiles=[(BASE+p,c) for p,c in [('old_report.txt','Old report\n'),('file1.tmp','tmp1\n'),('file2.tmp','tmp2\n'),('file3.tmp','tmp3\n'),('old_projects/project1.txt','Old project 1\n'),('old_projects/project2.txt','Old project 2\n'),('important_file.txt','Important fixture\n')]]
    put(209741,'Lệnh rm: xóa tệp',{
        1: observation('Đến nơi thực hành','Enter the project directory; inspect location and entries.','Vào project; xem vị trí và nội dung.',['cd '+BASE.rstrip('/'),'pwd','ls'],r'^\s*cd\s+/home/labex/project/?\s*$',r'^\s*ls\s*$'),
        2: task('Xóa một tệp','Remove old_report.txt. Deletion does not use a trash folder.','Xóa old_report.txt; lệnh không chuyển vào thùng rác.',['rm old_report.txt'],all_checks(absent('old_report.txt'),history(r'^\s*rm\s+[^\n]*old_report\.txt\s*$'))),
        3: task('Xóa nhiều tệp','Remove file1.tmp, file2.tmp and file3.tmp.','Xóa file1.tmp, file2.tmp và file3.tmp.',['rm file1.tmp file2.tmp file3.tmp'],all_checks(absent('file1.tmp','file2.tmp','file3.tmp'),history(r'^\s*rm\s+[^\n]*(?:file1\.tmp|\*\.tmp)[^\n]*$'))),
        4: task('Xóa thư mục','Use recursive removal on old_projects after inspecting it.','Xem old_projects rồi xóa đệ quy thư mục đó.',['ls old_projects','rm -r old_projects'],all_checks(absent('old_projects'),history(r'^\s*rm\s+-\w*[rR]\w*\s+[^\n]*old_projects/?\s*$'))),
        5: task('Xác nhận xóa','Run rm -i important_file.txt and confirm with y.','Chạy rm -i important_file.txt rồi xác nhận y.',[{'command':'rm -i important_file.txt','input':[{'wait_for':'remove regular file','text':'y'}]}],all_checks(absent('important_file.txt'),history(r'^\s*rm\s+-\w*i\w*\s+[^\n]*important_file\.txt\s*$')))
    },manifest([BASE+'old_projects'],rmfiles))

    orgfiles=[(BASE+p,c) for p,c in [('old_stuff/deprecated_script.sh','#!/bin/sh\necho old\n'),('old_stuff/outdated_notes.txt','outdated\n'),('temp/draft_readme.md','# Project\n'),('temp/config_backup.json','{}\n'),('app.js','console.log("app");\n'),('styles.css','body{}\n'),('data.json','{"app":"demo"}\n')]]
    orgcheck=state("python3 - <<'CHECK'\nfrom pathlib import Path\np=Path('/home/labex/project')\nexpected={'src/app.js':'console.log(\"app\");\\n','src/styles.css':'body{}\\n','config/config.json':'{\"app\":\"demo\"}\\n','README.md':'# Project\\n'}\nassert all((p/k).is_file() and (p/k).read_text()==v for k,v in expected.items())\nassert not any((p/k).exists() for k in ['app.js','styles.css','data.json','temp','old_stuff'])\nCHECK")
    put(387877,'Sắp xếp tệp và thư mục',{
        1: task('Sắp xếp dự án','Build src and config; move app.js and styles.css to src, rename data.json to config/config.json, copy temp/draft_readme.md to README.md, then remove temp and old_stuff.','Tạo src và config; chuyển app.js, styles.css vào src; đổi data.json thành config/config.json; chép temp/draft_readme.md thành README.md rồi xóa temp, old_stuff.',['mkdir src config','mv app.js styles.css src/','mv data.json config/config.json','cp temp/draft_readme.md README.md','rm -r temp old_stuff'],all_checks(orgcheck,history(r'^\s*cp\s+[^\n]*draft_readme\.md\s+[^\n]*README\.md\s*$'),history(r'^\s*mv\s+[^\n]*data\.json\s+[^\n]*config(?:/config\.json)?\s*$'),history(r'^\s*rm\s+-\w*[rR]\w*\s+[^\n]*(?:temp|old_stuff)[^\n]*$')))
    },manifest([BASE+'old_stuff',BASE+'temp'],orgfiles))
    return lessons
