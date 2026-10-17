"""Requirement-aligned Shell lessons 1–7; wording and graders are local.

Public tutorial facts checked 2026-10-17. This is not the private LabEx grader
or a copy of all original prose. VM/WebIDE access is reported separately.
"""
import copy
import json
from pathlib import Path
import re
import shlex

ROOT = Path(__file__).resolve().parents[1]
BASE = '/home/labex/project/'
FENCE = '`' * 3


def state(code):
    return {'kind': 'state', 'command': code}


def python_check(body):
    return state("python3 - <<'LOCAL_CHECK'\nimport pathlib, subprocess, os, re\nroot=pathlib.Path('/home/labex/project')\n"
                 "def run(name,*args):\n return subprocess.run(['/bin/bash',str(root/name),*args],cwd=root,text=True,capture_output=True,timeout=2)\n"
                 + body + '\nLOCAL_CHECK')


def variables(name, predicate, *source_args):
    # Inspect variables even if a valid student script ends with exit 0.
    # Require a marker from our assertion, rather than trusting that exit code.
    assertion = '__local_source_status=$?; test "$__local_source_status" = 0 && (' + predicate + ") && printf '%s\\n' '__LOCAL_VARIABLE_ASSERTION_PASSED__'"
    script = 'trap '+shlex.quote(assertion)+' EXIT\nsource "$1" '+shlex.join(source_args)+' >/dev/null'
    return state('test -f '+shlex.quote(BASE+name)+' && bash -n '+shlex.quote(BASE+name)
                 +' && bash -c '+shlex.quote(script)+' _ '+shlex.quote(BASE+name)+" | grep -Fxq '__LOCAL_VARIABLE_ASSERTION_PASSED__'")


def history(pattern):
    return {'kind': 'commands', 'user': 'labex', 'groups': [[pattern]], 'allowed_status': [0]}


def combined(*rules):
    return {'kind': 'all', 'checks': list(rules)}


def executable(name):
    return state('test -f '+BASE+name+' && test -x '+BASE+name+' && bash -n '+BASE+name)


def wrote(name):
    return state('test -f '+BASE+name)


def write_script(name, body, append=False):
    return "cat "+('>>' if append else '>')+shlex.quote(BASE+name)+" <<'LOCAL_SCRIPT'\n"+body.rstrip()+'\nLOCAL_SCRIPT'


def content(en, vi, script=None, command=None):
    example = (FENCE+'bash\n'+(command or script).rstrip()+'\n'+FENCE) if script or command else ''
    return en+('\n\n'+example if example else ''), vi+('\n\n'+example if example else '')


def task(en, vi, rule, commands, script=None, command=None, hint=None):
    a,b=content(en,vi,script,command)
    return {'content':a,'content_vi':b,'verification':rule,'commands':commands,
            'task':en,'task_vi':vi,'hint_vi':hint or 'Thực hiện đúng tên tệp, dữ kiện và kết quả trong hướng dẫn.'}


def definitions():
    lessons = {}
    hello = '#!/bin/bash\necho \'Hello, World!\'\n'
    hello_run = history(r'^\s*(?:bash\s+)?(?:\./|/home/labex/project/|~/project/)?hello\.sh\s*$')
    hello_result = python_check("p=run('hello.sh'); assert p.returncode==0 and p.stdout=='Hello, World!\\n'")
    lessons[388809] = {
        1: task('Explore the source WebIDE: file explorer, editor and integrated terminal. This local runtime does not provide WebIDE yet.',
                'Làm quen WebIDE ở nguồn: trình duyệt tệp, vùng soạn thảo và terminal tích hợp. Runtime local chưa cung cấp WebIDE; bước này chưa chấm được.',
                {'kind':'unsupported','reason':'Bước nguồn yêu cầu WebIDE (VS Code). Không thể xác nhận thao tác WebIDE bằng thư mục terminal có sẵn.'},[]),
        2: task('Create hello.sh in the project directory.', 'Tạo tệp hello.sh trong thư mục project.',wrote('hello.sh'),['touch '+BASE+'hello.sh'],command='touch hello.sh'),
        3: task('Use Bash and print the source greeting.', 'Dùng Bash và in đúng lời chào của bài nguồn.',hello_result,[write_script('hello.sh',hello)],script=hello),
        4: task('Give the script execute permission.', 'Cấp quyền thực thi cho script.',executable('hello.sh'),['chmod +x '+BASE+'hello.sh'],command='chmod +x hello.sh'),
        5: task('Run hello.sh and check its greeting.', 'Chạy hello.sh và kiểm tra lời chào.',combined(hello_result,hello_run),['./hello.sh'],command='./hello.sh'),
        6: task('Display the script contents with cat.', 'Dùng cat để xem nội dung script.',
                combined(wrote('hello.sh'),history(r'^\s*cat\s+(?:-n\s+)?(?:\./|/home/labex/project/|~/project/)?hello\.sh\s*$')),
                ['cat hello.sh'],command='cat hello.sh'),
    }
    variables1 = '''#!/bin/bash
PRICE_PER_APPLE=5
MyFirstLetters=ABC
greeting='Hello        world!'
printf 'Price per apple: %s\nMy first letters: %s\nGreeting: %s\n' "$PRICE_PER_APPLE" "$MyFirstLetters" "$greeting"
'''
    variables2 = r'''#!/bin/bash
PRICE_PER_APPLE=5
MyFirstLetters=ABC
greeting='Hello        world!'
echo "The price of an Apple today is: \$HK $PRICE_PER_APPLE"
echo "The first 10 letters in the alphabet are: ${MyFirstLetters}DEFGHIJ"
echo $greeting
echo "$greeting"
'''
    substitutions = '''CURRENT_DATE=$(date +%Y-%m-%d)
FILES_IN_DIR=$(ls)
UPTIME=$(uptime -p)
echo "Today's date is: $CURRENT_DATE"
printf 'Files in the current directory:\n%s\nSystem uptime: %s\n' "$FILES_IN_DIR" "$UPTIME"
'''
    arithmetic = '''#!/bin/bash
X=10
Y=5
SUM=$((X+Y)); DIFF=$((X-Y)); PRODUCT=$((X*Y)); QUOTIENT=$((X/Y)); REMAINDER=$((X%Y))
echo "Sum of $X and $Y is: $SUM"
echo "Difference between $X and $Y is: $DIFF"
echo "Product of $X and $Y is: $PRODUCT"
echo "Quotient of $X divided by $Y is: $QUOTIENT"
echo "Remainder of $X divided by $Y is: $REMAINDER"
X=$((X+1)); echo "After incrementing, X is now: $X"
Y=$((Y-1)); echo "After decrementing, Y is now: $Y"
'''
    environment = '''#!/bin/bash
echo "Home directory: $HOME"
echo "Current user: $LOGNAME"
echo "Shell being used: $SHELL"
echo "Current PATH: $PATH"
export MY_VARIABLE="Hello from my variable"
echo "My new variable: $MY_VARIABLE"
bash -c 'echo "MY_VARIABLE in child process: $MY_VARIABLE"'
unset MY_VARIABLE
echo "MY_VARIABLE after unsetting: $MY_VARIABLE"
'''
    lessons[388810] = {
        1: task('Define PRICE_PER_APPLE=5, MyFirstLetters=ABC and greeting with eight internal spaces; keep quoting when printing.',
                'Khai báo PRICE_PER_APPLE=5, MyFirstLetters=ABC và greeting có tám dấu cách bên trong; đặt biến trong dấu nháy khi in.',
                variables('variables.sh','test "$PRICE_PER_APPLE" = 5 && test "$MyFirstLetters" = ABC && test "$greeting" = "Hello        world!"'),
                [write_script('variables.sh',variables1),'chmod +x variables.sh','./variables.sh'],script=variables1),
        2: task('Compare escaped dollar signs, braced expansion and quoted versus unquoted spaces.',
                'So sánh dấu đô la được escape, mở rộng biến với ngoặc nhọn và khoảng trắng khi có hoặc không có dấu nháy.',
                python_check("p=run('variables.sh'); assert p.returncode==0\nassert '$HK 5' in p.stdout and 'ABCDEFGHIJ' in p.stdout\nassert '\\nHello world!\\nHello        world!\\n' in p.stdout"),
                [write_script('variables.sh',variables2),'./variables.sh'],script=variables2),
        3: task('Capture date, directory listing and readable uptime in variables.',
                'Lưu ngày hiện tại, danh sách thư mục và thời gian hoạt động dễ đọc vào các biến.',
                python_check("p=run('variables.sh'); assert p.returncode==0\nassert re.search(r\"Today's date is: \\d{4}-\\d{2}-\\d{2}\",p.stdout)\nassert 'Files in the current directory:' in p.stdout and 'variables.sh' in p.stdout and 'System uptime: up' in p.stdout"),
                [write_script('variables.sh',substitutions,True),'./variables.sh'],script=substitutions),
        4: task('Create arithmetic.sh; use X=10 and Y=5 for arithmetic, then increment X and decrement Y.',
                'Tạo arithmetic.sh; dùng X=10, Y=5 để tính toán, sau đó tăng X và giảm Y một đơn vị.',
                variables('arithmetic.sh','test "$SUM:$DIFF:$PRODUCT:$QUOTIENT:$REMAINDER:$X:$Y" = "15:5:50:2:0:11:4"'),
                [write_script('arithmetic.sh',arithmetic),'chmod +x arithmetic.sh','./arithmetic.sh'],script=arithmetic),
        5: task('Use environment.sh to display environment values, export MY_VARIABLE to a child Bash, then unset it. Shell paths depend on the runtime.',
                'Trong environment.sh, xem biến môi trường, export MY_VARIABLE cho Bash con rồi unset. Đường dẫn shell phụ thuộc môi trường đang dùng.',
                python_check("p=run('environment.sh'); assert p.returncode==0\nassert 'Home directory: /home/labex' in p.stdout and 'Current user: labex' in p.stdout\nassert 'MY_VARIABLE in child process: Hello from my variable' in p.stdout\nassert p.stdout.endswith('MY_VARIABLE after unsetting: \\n')"),
                [write_script('environment.sh',environment),'chmod +x environment.sh','./environment.sh'],script=environment),
    }
    treasure = '''#!/bin/bash
LATITUDE=15
LONGITUDE=25
PACES_NORTH=$((LATITUDE*2))
PACES_EAST=$((LONGITUDE/5))
echo "The treasure is buried $PACES_NORTH paces north and $PACES_EAST paces east from the old oak tree."
'''
    lessons[388807] = {1:task('Complete treasure_map.sh using LATITUDE=15 and LONGITUDE=25. North is latitude times two; east is longitude divided by five. Keep the prepared output sentence.',
        'Hoàn thiện treasure_map.sh với LATITUDE=15 và LONGITUDE=25. Số bước bắc bằng vĩ độ nhân hai; số bước đông bằng kinh độ chia năm. Giữ nguyên câu xuất kết quả đã chuẩn bị.',
        combined(executable('treasure_map.sh'),variables('treasure_map.sh','test "$LATITUDE:$LONGITUDE:$PACES_NORTH:$PACES_EAST" = "15:25:30:5"'),
                 python_check("p=run('treasure_map.sh'); assert p.returncode==0 and p.stdout=='The treasure is buried 30 paces north and 5 paces east from the old oak tree.\\n'")),
        [write_script('treasure_map.sh',treasure),'chmod +x treasure_map.sh','./treasure_map.sh'])}
    args1 = '''#!/bin/bash
echo "Script name: $0"
echo "First argument: $1"
echo "Second argument: $2"
echo "Third argument: $3"
'''
    args2 = '''#!/bin/bash
if [ "$#" -eq 0 ]; then
 echo "No arguments provided."
elif [ "$#" -eq 1 ]; then
 echo "One argument provided: $1"
elif [ "$#" -eq 2 ]; then
 echo "Two arguments provided: $1 and $2"
else
 echo "More than two arguments provided:"
 echo "First argument: $1"
 echo "Second argument: $2"
 echo "Third argument: $3"
 echo "Total number of arguments: $#"
fi
'''
    args3 = '''#!/bin/bash
echo "Total number of arguments: $#"
echo "All arguments:"
count=1
for arg in "$@"; do
 echo "Argument $count: $arg"
 count=$((count+1))
done
'''
    args_first = python_check("p=run('arguments.sh','hello','world','example'); assert p.returncode==0\nassert 'First argument: hello\\nSecond argument: world\\nThird argument: example\\n' in p.stdout\nq=run('arguments.sh','quoted value','other','third'); assert 'First argument: quoted value\\n' in q.stdout")
    args_branch = python_check("assert run('arguments.sh').stdout=='No arguments provided.\\n'\nassert run('arguments.sh','one').stdout=='One argument provided: one\\n'\nassert run('arguments.sh','one','two').stdout=='Two arguments provided: one and two\\n'\np=run('arguments.sh','one','two','three','four'); assert p.returncode==0 and 'Total number of arguments: 4' in p.stdout")
    args_loop = python_check("p=run('arguments.sh','a b','c'); assert p.returncode==0 and p.stdout=='Total number of arguments: 2\\nAll arguments:\\nArgument 1: a b\\nArgument 2: c\\n'")
    lessons[388811] = {
        1:task('Create arguments.sh with a Bash shebang.', 'Tạo arguments.sh với dòng shebang Bash.',wrote('arguments.sh'),[write_script('arguments.sh','#!/bin/bash\n')],command='touch arguments.sh'),
        2:task('Display the script name and its first three positional arguments.', 'Hiển thị tên script và ba tham số vị trí đầu tiên.',args_first,[write_script('arguments.sh',args1)],script=args1),
        3:task('Make arguments.sh executable.', 'Cấp quyền thực thi cho arguments.sh.',executable('arguments.sh'),['chmod +x arguments.sh'],command='chmod +x arguments.sh'),
        4:task('Run the script with hello, world and example.', 'Chạy script với ba tham số hello, world và example.',combined(args_first,history(r'^\s*(?:\./|/home/labex/project/)?arguments\.sh\s+hello\s+world\s+example\s*$')),['./arguments.sh hello world example'],command='./arguments.sh hello world example'),
        5:task('Branch on argument counts zero, one, two and greater than two.', 'Phân nhánh theo số tham số: không, một, hai và nhiều hơn hai.',args_branch,[write_script('arguments.sh',args2)],script=args2),
        6:task('Test all four argument-count branches.', 'Chạy thử cả bốn nhánh số lượng tham số.',combined(args_branch,{'kind':'commands','user':'labex','groups':[[r'^\s*\./arguments\.sh\s*$'],[r'^\s*\./arguments\.sh\s+one\s*$'],[r'^\s*\./arguments\.sh\s+one\s+two\s*$'],[r'^\s*\./arguments\.sh\s+one\s+two\s+three\s+four\s*$']]}),['./arguments.sh','./arguments.sh one','./arguments.sh one two','./arguments.sh one two three four'],command='./arguments.sh\n./arguments.sh one\n./arguments.sh one two\n./arguments.sh one two three four'),
        7:task('Iterate over quoted "$@" and number each argument.', 'Duyệt "$@" có dấu nháy và đánh số từng tham số.',args_loop,[write_script('arguments.sh',args3)],script=args3),
        8:task('Test the final script with apple, banana, cherry and date.', 'Thử script hoàn chỉnh với apple, banana, cherry và date.',combined(args_loop,history(r'^\s*\./arguments\.sh\s+apple\s+banana\s+cherry\s+date\s*$')),['./arguments.sh apple banana cherry date'],command='./arguments.sh apple banana cherry date'),
    }
    arrays1 = '#!/bin/bash\nNUMBERS=()\nSTRINGS=()\nNAMES=()\n'
    arrays2 = '''NUMBERS+=(1 2 3)
STRINGS+=("hello" "world")
NAMES+=("John" "Eric" "Jessica")
'''
    arrays3 = 'NumberOfNames=${#NAMES[@]}\n'
    arrays4 = 'second_name=${NAMES[1]}\n'
    arrays5 = '''echo "NUMBERS array: ${NUMBERS[@]}"
echo "STRINGS array: ${STRINGS[@]}"
echo "The number of names listed in the NAMES array: $NumberOfNames"
echo "The second name on the NAMES list is: $second_name"
'''
    arrays_result=python_check("p=run('arrays.sh'); assert p.returncode==0\nassert p.stdout=='NUMBERS array: 1 2 3\\nSTRINGS array: hello world\\nThe number of names listed in the NAMES array: 3\\nThe second name on the NAMES list is: Eric\\n'")
    lessons[388812] = {
        1:task('Create arrays.sh.', 'Tạo tệp arrays.sh.',wrote('arrays.sh'),['touch arrays.sh'],command='touch arrays.sh'),
        2:task('Initialize NUMBERS, STRINGS and NAMES as empty arrays.', 'Khởi tạo ba mảng rỗng NUMBERS, STRINGS và NAMES.',variables('arrays.sh','declare -p NUMBERS STRINGS NAMES >/dev/null && test "${#NUMBERS[@]}:${#STRINGS[@]}:${#NAMES[@]}" = "0:0:0"'),[write_script('arrays.sh',arrays1)],script=arrays1),
        3:task('Append numbers 1–3, hello/world and John/Eric/Jessica.', 'Thêm các số 1–3, hello/world và John/Eric/Jessica.',variables('arrays.sh','test "${NUMBERS[*]}" = "1 2 3" && test "${STRINGS[*]}" = "hello world" && test "${NAMES[*]}" = "John Eric Jessica"'),[write_script('arrays.sh',arrays2,True)],script=arrays2),
        4:task('Store the NAMES length in NumberOfNames.', 'Lưu số phần tử NAMES vào NumberOfNames.',variables('arrays.sh','test "$NumberOfNames" = 3'),[write_script('arrays.sh',arrays3,True)],script=arrays3),
        5:task('Store NAMES index one in second_name.', 'Lưu phần tử chỉ số một của NAMES vào second_name.',variables('arrays.sh','test "$second_name" = Eric'),[write_script('arrays.sh',arrays4,True)],script=arrays4),
        6:task('Print the arrays, their count and the second name.', 'In các mảng, số phần tử và tên thứ hai.',arrays_result,[write_script('arrays.sh',arrays5,True)],script=arrays5),
        7:task('Make arrays.sh executable and run it.', 'Cấp quyền thực thi rồi chạy arrays.sh.',combined(executable('arrays.sh'),arrays_result,history(r'^\s*\./arrays\.sh\s*$')),['chmod +x arrays.sh','./arrays.sh'],command='chmod +x arrays.sh\n./arrays.sh'),
    }
    cargo = '''#!/bin/bash
forward_bay=("Space Suits" "Oxygen Tanks" "Repair Kits")
midship_bay=("Food Supplies" "Water Containers" "Medical Equipment")
aft_bay=("Spare Parts" "Fuel Cells" "Scientific Instruments")
case "${1:-}" in
 forward) label='Forward'; items=("${forward_bay[@]}");;
 midship) label='Midship'; items=("${midship_bay[@]}");;
 aft) label='Aft'; items=("${aft_bay[@]}");;
 '') echo 'Please specify a cargo bay: forward, midship, or aft'; exit;;
 *) echo 'Invalid cargo bay. Choose forward, midship, or aft.'; exit;;
esac
echo "$label Bay Inventory:"
i=1
for item in "${items[@]}"; do printf '%s. %s\n' "$i" "$item"; i=$((i+1)); done
'''
    cargo_check=python_check("expected={'forward':('Forward',['Space Suits','Oxygen Tanks','Repair Kits']),'midship':('Midship',['Food Supplies','Water Containers','Medical Equipment']),'aft':('Aft',['Spare Parts','Fuel Cells','Scientific Instruments'])}\nfor bay,(label,items) in expected.items():\n p=run('cargo_manifest.sh',bay); assert p.returncode==0 and p.stdout==label+' Bay Inventory:\\n'+''.join(str(i)+'. '+item+'\\n' for i,item in enumerate(items,1))\nassert run('cargo_manifest.sh').stdout=='Please specify a cargo bay: forward, midship, or aft\\n'\nassert run('cargo_manifest.sh','engine').stdout=='Invalid cargo bay. Choose forward, midship, or aft.\\n'")
    lessons[388869]={1:task('Complete cargo_manifest.sh: three three-item arrays forward_bay/midship_bay/aft_bay; select with $1, number the inventory, and handle absent or invalid bay names. Use the prepared exact cargo strings.',
        'Hoàn thiện cargo_manifest.sh: ba mảng forward_bay/midship_bay/aft_bay, mỗi mảng ba món; chọn kho bằng $1, đánh số hàng và xử lý tên kho thiếu hoặc sai. Giữ đúng tên hàng đã chuẩn bị.',
        combined(executable('cargo_manifest.sh'),variables('cargo_manifest.sh','test "${#forward_bay[@]}:${#midship_bay[@]}:${#aft_bay[@]}" = "3:3:3"','forward'),cargo_check),
        [write_script('cargo_manifest.sh',cargo),'chmod +x cargo_manifest.sh','./cargo_manifest.sh forward','./cargo_manifest.sh midship','./cargo_manifest.sh aft'])}
    fruit1='#!/bin/bash\n'
    fruit2='COST_PINEAPPLE=50\nCOST_BANANA=4\nCOST_WATERMELON=23\nCOST_BASKET=1\n'
    fruit3='TOTAL=$((COST_PINEAPPLE + COST_BANANA*2 + COST_WATERMELON*3 + COST_BASKET))\n'
    fruit4='echo "Total Cost is $TOTAL cents"\n'
    fruit_result=python_check("p=run('fruit_basket.sh'); assert p.returncode==0 and p.stdout=='Total Cost is 128 cents\\n'")
    lessons[388813]={
        1:task('Create fruit_basket.sh with a Bash shebang.', 'Tạo fruit_basket.sh với shebang Bash.',wrote('fruit_basket.sh'),[write_script('fruit_basket.sh',fruit1)],command='touch fruit_basket.sh'),
        2:task('Set pineapple, banana, watermelon and basket costs to 50, 4, 23 and 1 cents.', 'Đặt giá dứa, chuối, dưa hấu và giỏ lần lượt là 50, 4, 23 và 1 xu.',variables('fruit_basket.sh','test "$COST_PINEAPPLE:$COST_BANANA:$COST_WATERMELON:$COST_BASKET" = "50:4:23:1"'),[write_script('fruit_basket.sh',fruit2,True)],script=fruit2),
        3:task('Calculate one pineapple, two bananas, three watermelons and one basket in TOTAL.', 'Tính TOTAL cho một quả dứa, hai quả chuối, ba quả dưa hấu và một giỏ.',variables('fruit_basket.sh','test "$TOTAL" = 128'),[write_script('fruit_basket.sh',fruit3,True)],script=fruit3),
        4:task('Display the computed total in cents.', 'In tổng chi phí tính được theo đơn vị xu.',fruit_result,[write_script('fruit_basket.sh',fruit4,True)],script=fruit4),
        5:task('Make fruit_basket.sh executable and run it.', 'Cấp quyền thực thi rồi chạy fruit_basket.sh.',combined(executable('fruit_basket.sh'),fruit_result,history(r'^\s*(?:\./|~/project/|/home/labex/project/)fruit_basket\.sh\s*$')),['chmod +x fruit_basket.sh','./fruit_basket.sh'],command='chmod +x fruit_basket.sh\n./fruit_basket.sh'),
    }
    return lessons


def generate():
    reviewed=definitions(); scenario={'version':1,'course_id':'shell-for-beginners','lessons':[],'expected_tasks':0}
    for path in (ROOT/'server/data/labs').glob('*.json'):
        lab=json.loads(path.read_text(encoding='utf-8')); source_id=lab.get('source_lab_id')
        if lab.get('course_id')!='shell-for-beginners' or source_id not in reviewed: continue
        backup=ROOT/'.artifacts/shell-before-fidelity-fix'/path.name;backup.parent.mkdir(parents=True,exist_ok=True)
        if not backup.exists():backup.write_text(path.read_text(encoding='utf-8'),encoding='utf-8')
        cases=[];steps=[]
        for section in lab['sections']:
            position=section['position']
            if section.get('kind')!='task':
                if section.get('kind')=='introduction':
                    section['content']='Practice '+lab['title']+'. The tasks below retain the source filenames, data and required behavior; explanations are locally written.'
                    section['content_vi']='Thực hành '+lab.get('title_vi',lab['title'])+'. Các bước dưới giữ đúng tên tệp, dữ kiện và hành vi nguồn; phần giải thích do dự án biên soạn.'
                continue
            patch=copy.deepcopy(reviewed[source_id][position]); commands=patch.pop('commands');rule=patch.pop('verification')
            section.update(patch);section['id']=f'source-{source_id}-section-{position}-v4'
            if source_id==388809 and position==1: section['title_vi']='Giới thiệu WebIDE (VS Code)'
            section['hint']=section['hint_vi'];section['verification']=rule;section['verification_by_provider']={'docker':copy.deepcopy(rule),'namespace':copy.deepcopy(rule)}
            section.pop('action',None);section.pop('verify_command',None)
            section['required_capabilities']=['terminal','files','shell'];section['required_capabilities_by_provider']={'docker':['terminal','files','shell'],'namespace':['terminal','files','shell']}
            steps.append(copy.deepcopy(section));cases.append({'id':section['id'],'commands':commands,**({'unsupported':True} if rule['kind']=='unsupported' else {})})
        lab['steps']=steps;lab['curriculum_version']=4
        lab['backend_audit']={'date':'2026-10-17','fidelity':'public-requirements-aligned-local-wording','private_grader_recovered':False,'integration_status':'requires-current-smoke-proof'}
        setup={'version':1,'directories':[],'files':[],'accounts':[],'groups':[],'provenance':{'original_vm_bytes_recovered':False,'requirements_from':lab['source_url']}}
        if source_id==388807:
            setup['files']=[{'path':BASE+'treasure_map.sh','content':'#!/bin/bash\nLATITUDE=\nLONGITUDE=\nPACES_NORTH=\nPACES_EAST=\necho "The treasure is buried $PACES_NORTH paces north and $PACES_EAST paces east from the old oak tree."\n'}]
        if source_id==388869:
            setup['files']=[{'path':BASE+'cargo_manifest.sh','content':'#!/bin/bash\n# Complete the three arrays and select a bay using $1.\nforward_bay=()\nmidship_bay=()\naft_bay=()\n# forward: Space Suits; Oxygen Tanks; Repair Kits\n# midship: Food Supplies; Water Containers; Medical Equipment\n# aft: Spare Parts; Fuel Cells; Scientific Instruments\n'}]
        setup_path=ROOT/'server/data/environment-setups'/path.name
        setup_path.write_text(json.dumps(setup,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        lab['environment_setup']='server/data/environment-setups/'+path.name
        path.write_text(json.dumps(lab,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        scenario['lessons'].append({'lab_id':lab['id'],'source_lab_id':source_id,'setup_manifest':lab['environment_setup'],'steps':cases})
        scenario['expected_tasks']+=len(cases)
    scenario['lessons'].sort(key=lambda l:next(json.loads(p.read_text(encoding='utf-8'))['order'] for p in [ROOT/'server/data/labs'/(l['lab_id']+'.json')]))
    target=ROOT/'tests/scenarios/shell-reviewed-early.json';target.write_text(json.dumps(scenario,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"Shell1–7: {len(scenario['lessons'])} lessons, {scenario['expected_tasks']} tasks; fixtures and scenario written.")


if __name__=='__main__':generate()
