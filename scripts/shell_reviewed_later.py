"""Reviewed Shell lessons 8–18. Independent explanations and local equivalent graders.

Public source URLs establish functional requirements, not access to private graders.
Run this file to update only its eleven lessons, fixtures and smoke scenarios.
"""
import copy
import json
import shlex
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT = "/home/labex/project/"
LESSONS = {}
TITLES_VI = {
    "Creating a Script File":"Tạo tệp kịch bản", "String Length":"Độ dài chuỗi",
    "Finding Character Position":"Tìm vị trí ký tự", "Substring Extraction":"Trích xuất chuỗi con",
    "String Replacement":"Thay thế chuỗi", "Create Your First If Statement":"Viết câu lệnh if đầu tiên",
    "Add an Else Clause":"Thêm nhánh else", "Introducing Elif":"Làm quen với elif",
    "Numeric Comparisons":"So sánh số", "String Comparisons and Logical Operators":"So sánh chuỗi và toán tử logic",
    "Complete the Weather Advisory Script":"Hoàn thiện kịch bản tư vấn thời tiết",
    "Setting Up the Environment":"Chuẩn bị môi trường", "The for Loop":"Vòng lặp for",
    "The while Loop":"Vòng lặp while", "The until Loop":"Vòng lặp until",
    "Using break and continue Statements":"Dùng break và continue", "Create the script file":"Tạo tệp kịch bản",
    "Add the shebang and initialize the arrays":"Thêm shebang và khởi tạo mảng",
    "Implement the first comparison loop":"Viết vòng lặp so sánh thứ nhất",
    "Implement the second comparison loop":"Viết vòng lặp so sánh thứ hai",
    "Make the script executable and run it":"Cấp quyền thực thi và chạy kịch bản",
    "Creating Your First Shell Function":"Viết hàm shell đầu tiên", "Functions with Parameters":"Hàm có tham số",
    "Return Values from Functions":"Lấy kết quả từ hàm", "Understanding Variable Scope":"Phạm vi của biến",
    "Advanced Function - ENGLISH_CALC":"Hàm nâng cao ENGLISH_CALC", "Create Calculator Functions":"Viết các hàm máy tính",
    "Creating Your First Script":"Tạo kịch bản đầu tiên", "Running the Script with Arguments":"Chạy kịch bản với tham số",
    "Understanding `$?` and `$!`":"Tìm hiểu $? và $!", "Using Special Variables in Functions":"Dùng biến đặc biệt trong hàm",
    "Understanding the Difference Between $@ and $*":"Phân biệt $@ và $*",
    "Create a Bash Script":"Tạo kịch bản Bash", "Implement a Basic Trap Command":"Viết lệnh trap cơ bản",
    "Make the Script Executable and Run It":"Cấp quyền thực thi và chạy kịch bản",
    "Modify the Trap to Use a Function":"Mở rộng hàm xử lý tín hiệu",
    "Creating a Test File":"Tạo tệp thử nghiệm", "Testing File Existence":"Kiểm tra tệp tồn tại",
    "Testing Directory Existence":"Kiểm tra thư mục tồn tại", "Testing File Permissions":"Kiểm tra quyền trên tệp",
    "Create the File System Explorer Script":"Viết kịch bản khám phá hệ thống tệp",
}


def task(file, code, en, vi, *, contains=(), output=(), args=(), stdin="", executable=True,
         command=None, extra_assert="", blocked=False, run=False):
    return dict(file=file, code=code.strip()+"\n" if code else "", en=en, vi=vi,
                contains=list(contains), output=list(output), args=list(args), stdin=stdin,
                executable=executable, command=command, extra_assert=extra_assert,
                blocked=blocked, run=run)


def lesson(source_id, *tasks, fixture=None):
    LESSONS[source_id] = {"tasks": list(tasks), "fixture": fixture or {}}


lesson(388814,
    task("string_operations.sh", "#!/bin/bash", "Create string_operations.sh with a Bash shebang.", "Tạo string_operations.sh với shebang Bash.", contains=("#!/bin/bash",), executable=False),
    task("string_operations.sh", '''#!/bin/bash
STRING="Hello, World!"
LENGTH=${#STRING}
echo "The string is: $STRING"
echo "Its length is: $LENGTH"''', "Measure STRING with ${#STRING}; punctuation and spaces count.", "Đo STRING bằng ${#STRING}; dấu câu và khoảng trắng đều được tính.", contains=("${#STRING}",), output=("Its length is: 13",)),
    task("string_operations.sh", '''#!/bin/bash
STRING="abcdefghijklmnopqrstuvwxyz"
CHAR="j"
POSITION=$(expr index "$STRING" "$CHAR")
echo "It is at position: $POSITION"''', "Find j in the alphabet with expr index; indexing starts at 1.", "Tìm j trong bảng chữ cái bằng expr index; vị trí bắt đầu từ 1.", contains=("expr index",), output=("It is at position: 10",)),
    task("string_operations.sh", '''#!/bin/bash
STRING="The quick brown fox jumps over the lazy dog"
START=10
LENGTH=5
SUBSTRING=${STRING:$START:$LENGTH}
echo "The substring is: $SUBSTRING"''', "Extract five characters at offset 10; Bash offsets start at zero.", "Cắt năm ký tự tại vị trí 10; chỉ số Bash bắt đầu từ 0.", contains=("${STRING:",), output=("The substring is: brown",)),
    task("string_operations.sh", '''#!/bin/bash
STRING="The quick brown fox jumps over the lazy dog"
echo "${STRING/o/O}"
echo "${STRING//o/O}"
echo "${STRING/#The quick/The slow}"
echo "${STRING/%dog/cat}"''', "Compare first/all replacements and anchored prefix/suffix replacement.", "So sánh thay lần đầu, toàn bộ, đầu chuỗi và cuối chuỗi.", contains=("${STRING/o/O}","${STRING//o/O}","${STRING/#", "${STRING/%"), output=("The quick brOwn fox jumps over the lazy dog","The quick brOwn fOx jumps Over the lazy dOg","The slow brown fox jumps over the lazy dog","The quick brown fox jumps over the lazy cat")))

# The public lesson appends examples to a single file. Keep earlier operations
# in later examples rather than silently replacing the student's whole script.
for previous,current in zip(LESSONS[388814]["tasks"][1:],LESSONS[388814]["tasks"][2:]):
    current["code"]=previous["code"]+"\n"+current["code"].removeprefix("#!/bin/bash\n")

lesson(388815,
    task("if.sh", '''#!/bin/bash
NAME="John"
if [ "$NAME" = "John" ]; then
  echo "The name is John"
fi''', "Write if.sh: compare NAME=John and execute the matching branch.", "Viết if.sh: so sánh NAME=John rồi chạy nhánh phù hợp.", contains=("if", "NAME=", "fi"), output=("The name is John",)),
    task("if.sh", '''#!/bin/bash
NAME="Alice"
if [ "$NAME" = "John" ]; then
  echo "The name is John"
else
  echo "The name is not John"
fi''', "Set NAME=Alice and add the else branch; compare with John.", "Đặt NAME=Alice và thêm nhánh else; so sánh với trường hợp John.", contains=("else", "Alice"), output=("The name is not John",)),
    task("if.sh", '''#!/bin/bash
NAME="George"
if [ "$NAME" = John ]; then echo "John Lennon"
elif [ "$NAME" = Paul ]; then echo "Paul McCartney"
elif [ "$NAME" = George ]; then echo "George Harrison"
elif [ "$NAME" = Ringo ]; then echo "Ringo Starr"
else echo "Unknown member"
fi''', "Use elif for John, Paul, George and Ringo; test George.", "Dùng elif cho John, Paul, George và Ringo; chạy với George.", contains=("elif", "Ringo", "Paul"), output=("George Harrison",)),
    task("numeric.sh", '''#!/bin/bash
NUMBER=10
if [ "$NUMBER" -lt 5 ]; then echo "The number is less than 5"
elif [ "$NUMBER" -eq 10 ]; then echo "The number is exactly 10"
elif [ "$NUMBER" -gt 15 ]; then echo "The number is greater than 15"
else echo "The number is between 5 and 15, but not 10"
fi''', "Create numeric.sh using -lt, -eq and -gt, initially NUMBER=10.", "Tạo numeric.sh dùng -lt, -eq và -gt, ban đầu NUMBER=10.", contains=("-lt", "-eq", "-gt"), output=("The number is exactly 10",)),
    task("string_logic.sh", '''#!/bin/bash
STRING1="hello"; STRING2="world"; NUMBER1=5; NUMBER2=10
if [ "$STRING1" = hello ] && [ "$STRING2" = world ]; then echo "Both strings match"; fi
if [ "$NUMBER1" -lt 10 ] || [ "$NUMBER2" -gt 5 ]; then echo "At least one of the number conditions is true"; fi
if [[ "$STRING1" != "$STRING2" ]]; then echo "The strings are different"; fi
if [[ -z "$STRING3" ]]; then echo "STRING3 is empty or not set"; fi''', "Use string_logic.sh to compare strings, combine conditions and detect an unset variable.", "Dùng string_logic.sh so sánh chuỗi, kết hợp điều kiện và nhận biết biến chưa đặt.", contains=("&&", "||", "!=", "-z"), output=("Both strings match", "The strings are different", "STRING3 is empty or not set")))

WEATHER_START = '''#!/bin/bash
read -r -p "Enter the current temperature in Celsius: " temperature
# Complete the conditional branches here.
'''
WEATHER = '''#!/bin/bash
read -r -p "Enter the current temperature in Celsius: " temperature
if [ "$temperature" -lt 0 ]; then echo "It's freezing! Wear a heavy coat and gloves."
elif [ "$temperature" -le 10 ]; then echo "It's cold. A warm jacket is recommended."
elif [ "$temperature" -le 20 ]; then echo "It's cool. A light jacket should suffice."
else echo "It's warm. Enjoy the pleasant weather!"
fi'''
WEATHER_TESTS = [(-2,"It's freezing! Wear a heavy coat and gloves."), (0,"It's cold. A warm jacket is recommended."), (10,"It's cold. A warm jacket is recommended."), (11,"It's cool. A light jacket should suffice."), (20,"It's cool. A light jacket should suffice."), (21,"It's warm. Enjoy the pleasant weather!")]
lesson(388885, task("weather_advisor.sh", WEATHER,
    "Complete the provided weather_advisor.sh. Read Celsius from stdin; handle <0, 0–10, 11–20 and >20. Preserve the four source advice strings shown below.",
    "Hoàn thiện weather_advisor.sh có sẵn. Đọc độ C từ stdin; xử lý <0, 0–10, 11–20 và >20. Giữ bốn thông báo trong mã dưới đây.", contains=("read", "if"),
    extra_assert="for number, expected in "+repr(WEATHER_TESTS)+":\n    assert expected in execute([str(p)], str(number)+'\\n').stdout"), fixture={"weather_advisor.sh":WEATHER_START})

lesson(388816,
    task("bash_loops", "", "Create bash_loops under ~/project and enter it.", "Tạo bash_loops trong ~/project rồi chuyển vào thư mục đó.", executable=False, command="test -d /home/labex/project/bash_loops"),
    task("bash_loops/for_loop.sh", '''#!/bin/bash
NAMES=(Alice Bob Charlie David)
for name in "${NAMES[@]}"; do echo "Hello, $name!"; done
for i in {1..5}; do echo "Number: $i"; done''', "In bash_loops, greet Alice/Bob/Charlie/David and iterate numbers 1–5.", "Trong bash_loops, chào Alice/Bob/Charlie/David và duyệt số 1–5.", contains=("for ", "${NAMES[@]}"), output=("Hello, Alice!", "Hello, David!", "Number: 1", "Number: 5")),
    task("bash_loops/while_loop.sh", '''#!/bin/bash
count=5
echo "Countdown:"
while [ "$count" -gt 0 ]; do
  echo "$count"
  count=$((count - 1))
  sleep 1
done
echo "Blast off!"''', "Count down 5→1 using while, pause one second, then announce launch.", "Dùng while đếm ngược 5→1, nghỉ mỗi giây rồi thông báo phóng.", contains=("while", "sleep 1"), output=("Countdown:\n5\n4\n3\n2\n1\nBlast off!",)),
    task("bash_loops/until_loop.sh", '''#!/bin/bash
count=1
echo "Counting up to 5:"
until [ "$count" -gt 5 ]; do
  echo "$count"
  count=$((count + 1))
  sleep 1
done''', "Use until to count upward from 1 through 5, pausing each second.", "Dùng until đếm từ 1 đến 5, nghỉ một giây mỗi vòng.", contains=("until", "sleep 1"), output=("Counting up to 5:\n1\n2\n3\n4\n5",)),
    task("bash_loops/break_continue.sh", '''#!/bin/bash
echo "Demonstration of break:"
for i in {1..10}; do
  if [ "$i" -eq 6 ]; then echo "Breaking the loop at $i"; break; fi
  echo "$i"
done
echo "Demonstration of continue (printing odd numbers):"
for i in {1..10}; do
  if [ $((i % 2)) -eq 0 ]; then continue; fi
  echo "$i"
done''', "Break at 6; use continue in a second loop to print odd numbers through 9.", "Dừng tại 6; dùng continue ở vòng thứ hai để in số lẻ đến 9.", contains=("break", "continue"), output=("Breaking the loop at 6", "1\n3\n5\n7\n9")))

ARRAY_INIT = "#!/bin/bash\na=(3 5 8 10 6)\nb=(6 5 4 12)\nc=(14 7 5 7)\n"
ARRAY_FIRST = '''z=()
for x in "${a[@]}"; do
  for y in "${b[@]}"; do
    if [ "$x" = "$y" ]; then z+=("$x"); fi
  done
done
echo "Common elements between a and b: ${z[@]}"
'''
ARRAY_SECOND = '''j=()
for i in "${c[@]}"; do
  for k in "${z[@]}"; do
    if [ "$i" = "$k" ]; then j+=("$i"); fi
  done
done
echo "Common elements among a, b, and c: ${j[@]}"
'''
lesson(388817,
    task("array-comparison.sh", "", "Create array-comparison.sh in ~/project.", "Tạo array-comparison.sh trong ~/project.", executable=False, command="test -f /home/labex/project/array-comparison.sh"),
    task("array-comparison.sh", ARRAY_INIT, "Initialize a=(3 5 8 10 6), b=(6 5 4 12), c=(14 7 5 7).", "Khai báo a=(3 5 8 10 6), b=(6 5 4 12), c=(14 7 5 7).", contains=("a=(3 5 8 10 6)","b=(6 5 4 12)","c=(14 7 5 7)"), executable=False),
    task("array-comparison.sh", ARRAY_INIT+ARRAY_FIRST, "Collect shared values of a and b into z using nested loops.", "Dùng vòng lặp lồng nhau lưu phần tử chung của a và b vào z.", contains=("for ","z+=("), output=("Common elements between a and b: 5 6",), executable=False),
    task("array-comparison.sh", ARRAY_INIT+ARRAY_FIRST+ARRAY_SECOND, "Compare c with z and store their shared values in j.", "So sánh c với z và lưu phần tử chung vào j.", contains=("j+=(",), output=("Common elements among a, b, and c: 5",), executable=False),
    task("array-comparison.sh", ARRAY_INIT+ARRAY_FIRST+ARRAY_SECOND, "Make array-comparison.sh executable and run it; the intersection of all three arrays is 5.", "Cấp quyền thực thi rồi chạy array-comparison.sh; giao của ba mảng là 5.", output=("Common elements between a and b: 5 6", "Common elements among a, b, and c: 5"), run=True))

FUNCTION_1 = '''#!/bin/bash
greet() { echo "Hello, World!"; }
greet'''
FUNCTION_2 = '''#!/bin/bash
greet() { echo "Hello, $1!"; }
calculate() { echo "The sum of $1 and $2 is $(($1 + $2))"; }
greet Alice
calculate 5 3'''
FUNCTION_3 = '''#!/bin/bash
get_square() { echo $(($1 * $1)); }
RESULT=0
set_global_result() { RESULT=$(($1 * $1)); }
square_of_5=$(get_square 5)
echo "The square of 5 is $square_of_5"
set_global_result 6
echo "The square of 6 is $RESULT"'''
FUNCTION_4 = '''#!/bin/bash
GLOBAL_VAR="I'm global"
demonstrate_scope() {
  local LOCAL_VAR="I'm local"
  echo "Inside function: GLOBAL_VAR = $GLOBAL_VAR"
  echo "Inside function: LOCAL_VAR = $LOCAL_VAR"
}
demonstrate_scope
echo "Outside function: GLOBAL_VAR = $GLOBAL_VAR"
echo "Outside function: LOCAL_VAR = $LOCAL_VAR"'''
FUNCTION_5 = '''#!/bin/bash
ENGLISH_CALC() {
  local num1=$1 operation=$2 num2=$3 result
  case "$operation" in
    plus) result=$((num1 + num2)); echo "$num1 + $num2 = $result" ;;
    minus) result=$((num1 - num2)); echo "$num1 - $num2 = $result" ;;
    times) result=$((num1 * num2)); echo "$num1 * $num2 = $result" ;;
    *) echo "Invalid operation. Please use 'plus', 'minus', or 'times'."; return 1 ;;
  esac
}
ENGLISH_CALC 3 plus 5
ENGLISH_CALC 5 minus 1
ENGLISH_CALC 4 times 6
ENGLISH_CALC 2 divide 2'''
lesson(388818,
    task("functions.sh", FUNCTION_1, "Define and invoke greet inside functions.sh.", "Định nghĩa và gọi greet trong functions.sh.", contains=("greet",), output=("Hello, World!",)),
    task("functions.sh", FUNCTION_2, "Pass Alice to greet and 5,3 to calculate; function parameters have their own positions.", "Truyền Alice cho greet và 5,3 cho calculate; hàm có tham số vị trí riêng.", contains=("$1","$2","calculate"), output=("Hello, Alice!","The sum of 5 and 3 is 8")),
    task("functions.sh", FUNCTION_3, "Capture get_square output and compare with a function changing global RESULT.", "Hứng đầu ra get_square rồi so sánh với hàm thay đổi biến toàn cục RESULT.", contains=("get_square", "set_global_result", "$("), output=("The square of 5 is 25", "The square of 6 is 36")),
    task("functions.sh", FUNCTION_4, "Observe GLOBAL_VAR inside/outside a function; local LOCAL_VAR disappears outside it.", "Quan sát GLOBAL_VAR trong/ngoài hàm; LOCAL_VAR khai báo local chỉ tồn tại trong hàm.", contains=("local LOCAL_VAR", "demonstrate_scope"), output=("Inside function: LOCAL_VAR = I'm local","Outside function: GLOBAL_VAR = I'm global","Outside function: LOCAL_VAR =")),
    task("functions.sh", FUNCTION_5, "Implement ENGLISH_CALC for plus/minus/times and reject divide with return 1.", "Viết ENGLISH_CALC cho plus/minus/times và từ chối divide bằng return 1.", contains=("ENGLISH_CALC", "return 1"), output=("3 + 5 = 8", "5 - 1 = 4", "4 * 6 = 24", "Invalid operation."), extra_assert="assert result.returncode == 1"))

CALC_MAIN = '''read -r -p "Enter first number: " num1
read -r -p "Enter second number: " num2
read -r -p "Enter operation (+, -, *, /): " operation
case "$operation" in
  '+') echo "Result: $(add "$num1" "$num2")" ;;
  '-') echo "Result: $(subtract "$num1" "$num2")" ;;
  '*') echo "Result: $(multiply "$num1" "$num2")" ;;
  '/') if [ "$num2" -eq 0 ]; then echo "Error: Division by zero is not allowed."; else echo "Result: $(divide "$num1" "$num2")"; fi ;;
  *) echo "Invalid operation" ;;
esac
'''
CALC_START = "#!/bin/bash\nadd() { :; }\nsubtract() { :; }\nmultiply() { :; }\ndivide() { :; }\n"+CALC_MAIN
CALC = '''#!/bin/bash
add() { echo $(($1 + $2)); }
subtract() { echo $(($1 - $2)); }
multiply() { echo $(($1 * $2)); }
divide() { if [ "$2" -eq 0 ]; then echo "Error: Division by zero is not allowed."; return 1; fi; echo $(($1 / $2)); }
'''+CALC_MAIN
lesson(388893, task("calculator.sh", CALC,
    "Complete add, subtract, multiply and divide in calculator.sh. Read two integers and a quoted operator from stdin; reject division by zero.",
    "Hoàn thiện add, subtract, multiply và divide trong calculator.sh. Đọc hai số nguyên và toán tử từ stdin; xử lý chia cho 0.", contains=("add", "subtract", "multiply", "divide", "read"),
    extra_assert="for a,b,op,expected in [(10,5,'+','Result: 15'),(10,5,'-','Result: 5'),(10,5,'*','Result: 50'),(10,5,'/','Result: 2'),(10,0,'/','Error: Division by zero is not allowed.'),(23,7,'+','Result: 30'),(9,3,'*','Result: 27')]:\n    assert expected in execute([str(p)], f'{a}\\n{b}\\n{op}\\n').stdout\nfor function,a,b,expected in [('add',23,7,'30'),('subtract',23,7,'16'),('multiply',9,3,'27'),('divide',27,3,'9'),('divide',10,0,'Error: Division by zero is not allowed.')]:\n    outcome=execute(['-c','source \\\"$1\\\" </dev/null >/dev/null; \\\"$2\\\" \\\"$3\\\" \\\"$4\\\"','bash',str(p),function,str(a),str(b)])\n    assert expected in outcome.stdout, outcome.stdout"), fixture={"calculator.sh":CALC_START})

SPECIAL = '''#!/bin/bash
echo "Script Name: $0"
echo "First Argument: $1"
echo "Second Argument: $2"
echo "All Arguments: $@"
echo "Number of Arguments: $#"
echo "Process ID: $$"'''
EXIT_STATUS = '''#!/bin/bash
echo "Running a successful command:"
ls /home
echo "Exit status: $?"
echo "Running a command that will fail:"
ls /nonexistent_directory
echo "Exit status: $?"
sleep 2 &
echo "Process ID of last background command: $!"
wait'''
FUNCTION_VARS = '''#!/bin/bash
print_args() {
  echo "Function Name: $0"
  echo "First Argument: $1"
  echo "Second Argument: $2"
  echo "All Arguments: $@"
  echo "Number of Arguments: $#"
}
print_args hello world
print_args one two three four'''
AT_STAR = '''#!/bin/bash
echo 'Using $@:'
for arg in "$@"; do echo "Argument: $arg"; done
echo 'Using $*:'
for arg in "$*"; do echo "Argument: $arg"; done'''
lesson(388819,
    task("special_vars.sh", SPECIAL, "Create special_vars.sh to display $0, $1, $2, $@, $# and $$.", "Tạo special_vars.sh hiển thị $0, $1, $2, $@, $# và $$.", contains=("$0", "$1", "$2", "$@", "$#", "$$"), output=("Number of Arguments: 0",)),
    task("special_vars.sh", SPECIAL, "Run without arguments, then run with hello world; compare counts 0 and 2.", "Chạy không tham số, rồi chạy với hello world; so sánh số lượng 0 và 2.", args=("hello", "world"), output=("First Argument: hello", "Second Argument: world", "Number of Arguments: 2"), run=True),
    task("exit_status.sh", EXIT_STATUS, "Use exit_status.sh to compare successful/failed ls status and the background PID from $!.", "Dùng exit_status.sh so sánh mã thoát ls thành công/thất bại và PID nền từ $!.", contains=("$?", "$!", "/nonexistent_directory", "&"), output=("Exit status: 0", "Exit status: 2")),
    task("function_vars.sh", FUNCTION_VARS, "Create function_vars.sh; print_args receives two arguments then four.", "Tạo function_vars.sh; gọi print_args lần lượt với hai và bốn tham số.", contains=("print_args", "$#", "$@"), output=("Number of Arguments: 2", "Number of Arguments: 4")),
    task("at_vs_star.sh", AT_STAR, 'In at_vs_star.sh compare "$@" and "$*" using arguments containing spaces.', 'Trong at_vs_star.sh so sánh "$@" với "$*" bằng tham số có khoảng trắng.', contains=('"$@"','"$*"'), args=("arg with spaces", "another_arg", "third arg"), output=("Argument: arg with spaces\nArgument: another_arg\nArgument: third arg", "Argument: arg with spaces another_arg third arg")))

TRAP = '''#!/bin/bash
cleanup_and_exit() {
  echo "Signal received! Cleaning up and exiting..."
  exit 0
}
trap cleanup_and_exit SIGINT SIGTERM
echo "This script will run until you press Ctrl+C."
count=1
while true; do
  echo "Script is running... (iteration $count)"
  sleep 1
  ((count++))
done'''
TRAP_FUNCTION = TRAP.replace('echo "Signal received! Cleaning up and exiting..."', 'echo "Signal received! Cleaning up..."\n  echo "Performing cleanup tasks..."\n  echo "Cleanup completed."\n  echo "Exiting script gracefully."')
TRAP_ASSERT = '''import signal,time
child=subprocess.Popen(['/bin/bash',str(p)],cwd=work,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True)
try:
    time.sleep(0.25)
    child.send_signal(signal.SIGTERM)
    captured,_=child.communicate(timeout=3)
    assert child.returncode == 0
    assert 'Signal received!' in captured
finally:
    if child.poll() is None:
        os.killpg(child.pid,signal.SIGKILL)
        child.wait()
'''
lesson(388820,
    task("trap_example.sh", "", "Create trap_example.sh in ~/project.", "Tạo trap_example.sh trong ~/project.", executable=False, command="test -f /home/labex/project/trap_example.sh"),
    task("trap_example.sh", TRAP, "Install cleanup_and_exit for SIGINT and SIGTERM around a running counter loop.", "Đăng ký cleanup_and_exit cho SIGINT và SIGTERM quanh vòng lặp đếm liên tục.", contains=("trap", "SIGINT", "SIGTERM", "while"), executable=False, extra_assert=TRAP_ASSERT),
    task("trap_example.sh", TRAP, "Make executable, run the counter, then press Ctrl+C to trigger graceful cleanup.", "Cấp quyền thực thi, chạy bộ đếm rồi nhấn Ctrl+C để dừng qua hàm dọn dẹp.", contains=("SIGINT", "SIGTERM"), extra_assert=TRAP_ASSERT, run=True),
    task("trap_example.sh", TRAP_FUNCTION, "Expand cleanup_and_exit to report cleanup completion and graceful exit; test Ctrl+C again.", "Mở rộng cleanup_and_exit thông báo dọn dẹp hoàn tất và thoát an toàn; thử Ctrl+C lần nữa.", contains=("Cleanup completed.", "Exiting script gracefully."), extra_assert=TRAP_ASSERT+"assert 'Cleanup completed.' in captured\n"))

FILE_EXISTS = '''#!/bin/bash
filename="test_file.txt"
if [ -e "$filename" ]; then echo "$filename exists"; else echo "$filename does not exist"; fi'''
DIR_EXISTS = '''#!/bin/bash
dirname="test_directory"
if [ -d "$dirname" ]; then echo "$dirname exists"; else echo "$dirname does not exist"; fi'''
READABLE = '''#!/bin/bash
filename="test_file.txt"
if [ -r "$filename" ]; then echo "You have read permission for $filename"; else echo "You do not have read permission for $filename"; fi'''
lesson(388821,
    task("test_file.txt", "This is a test file for our lab.", "Create test_file.txt with the provided sample text and inspect it with cat.", "Tạo test_file.txt với câu mẫu rồi xem bằng cat.", executable=False, contains=("This is a test file for our lab.",)),
    task("file_exists.sh", FILE_EXISTS, "Create file_exists.sh using -e; run before/after renaming test_file.txt to non_existent.txt.", "Tạo file_exists.sh dùng -e; chạy trước/sau khi đổi test_file.txt thành non_existent.txt.", contains=("-e",), extra_assert="(work/'test_file.txt').write_text('sample')\nassert 'test_file.txt exists' in execute([str(p)]).stdout\n(work/'test_file.txt').unlink()\nassert 'test_file.txt does not exist' in execute([str(p)]).stdout"),
    task("dir_exists.sh", DIR_EXISTS, "Create dir_exists.sh using -d; compare output before/after mkdir test_directory.", "Tạo dir_exists.sh dùng -d; so sánh trước/sau khi mkdir test_directory.", contains=("-d",), extra_assert="assert 'test_directory does not exist' in execute([str(p)]).stdout\n(work/'test_directory').mkdir()\nassert 'test_directory exists' in execute([str(p)]).stdout"),
    task("file_readable.sh", READABLE, "Restore test_file.txt; use -r in file_readable.sh, remove read permission, test, then restore it.", "Khôi phục test_file.txt; dùng -r trong file_readable.sh, bỏ quyền đọc, thử rồi cấp lại.", contains=("-r",), extra_assert="q=work/'test_file.txt'\nq.write_text('sample'); q.chmod(0o600)\nassert 'You have read permission for test_file.txt' in execute([str(p)]).stdout\nq.chmod(0o000)\nassert 'You do not have read permission for test_file.txt' in execute([str(p)]).stdout\nq.chmod(0o600)"))

EXPLORER_MAIN = '''if [ "$#" -ne 1 ]; then echo "Usage: $0 <file_or_directory>"; exit 1; fi
check_item "$1"
'''
EXPLORER_START = "#!/bin/bash\ncheck_item() {\n  # Complete existence, type and readability checks.\n  :\n}\n"+EXPLORER_MAIN
EXPLORER = '''#!/bin/bash
check_item() {
  echo "Checking: $1"
  if [ ! -e "$1" ]; then echo "Exists: No"; return; fi
  echo "Exists: Yes"
  if [ -f "$1" ]; then echo "Type: File"; elif [ -d "$1" ]; then echo "Type: Directory"; fi
  if [ -r "$1" ]; then echo "Readable: Yes"; else echo "Readable: No"; fi
}
'''+EXPLORER_MAIN
lesson(388898, task("file_explorer.sh", EXPLORER,
    "Complete check_item in file_explorer.sh: accept one path; report existence, file/directory type and readability using -e/-f/-d/-r.",
    "Hoàn thiện check_item trong file_explorer.sh: nhận một đường dẫn; báo tồn tại, loại tệp/thư mục và quyền đọc bằng -e/-f/-d/-r.", contains=("check_item", "-e", "-f", "-d", "-r"),
    extra_assert="q=work/'test_file.txt'; q.write_text('sample'); q.chmod(0o600)\n(work/'test_directory').mkdir()\nfor name,lines in [('test_file.txt',['Exists: Yes','Type: File','Readable: Yes']),('non_existent.txt',['Exists: No']),('test_directory',['Exists: Yes','Type: Directory','Readable: Yes'])]:\n    out=execute([str(p),name]).stdout\n    assert all(line in out for line in lines),out\nq.chmod(0o000)\nassert 'Readable: No' in execute([str(p),'test_file.txt']).stdout\nq.chmod(0o600)"), fixture={"file_explorer.sh":EXPLORER_START, "test_file.txt":"Local readability fixture\n", "test_directory/":None})


def checker(t):
    """Evaluate a private temporary copy as labex, never mutate learner files."""
    if t["command"]:
        return {"kind":"state", "command":t["command"]}
    # A signal example deliberately runs until interrupted: only the controlled
    # Popen/terminate probe runs it. Other examples get a hard two-second bound.
    signal_probe = "child=subprocess.Popen" in t["extra_assert"]
    program = '''import os,pathlib,shutil,subprocess,tempfile
p=pathlib.Path(FILE)
assert p.is_file(), 'Create the requested file first'
text=p.read_text()
assert all(token in text for token in TOKENS), 'Required concepts missing'
if EXECUTABLE: assert os.access(p,os.X_OK), 'Add execute permission'
with tempfile.TemporaryDirectory(prefix='labex-shell-check-') as directory:
    work=pathlib.Path(directory)
    source=p
    if p.suffix == '.sh':
        p=work/source.name
        # Preserve teaching delays in the learner file; suppress sleep only in
        # this isolated behavior probe so a five-second loop does not time out.
        p.write_text(text if SIGNAL_PROBE else text.replace('sleep 1', ':').replace('sleep 2', ':'))
        p.chmod(0o700)
        assert subprocess.run(['/bin/bash','-n',str(p)],capture_output=True).returncode == 0
    def execute(arguments, data=''):
        return subprocess.run(['/bin/bash',*arguments],input=data,text=True,capture_output=True,cwd=work,timeout=2)
'''
    program = program.replace("FILE",repr(PROJECT+t["file"])).replace("TOKENS",repr(t["contains"])).replace("EXECUTABLE",repr(t["executable"])).replace("SIGNAL_PROBE",repr(signal_probe))
    if t["file"].endswith(".sh") and not signal_probe:
        program += "    result=execute([str(p),*"+repr(t["args"])+"],"+repr(t["stdin"])+")\n"
        program += "    assert all(item in result.stdout for item in "+repr(t["output"])+"),result.stdout\n"
    if t["extra_assert"]:
        program += "\n".join("    "+line for line in t["extra_assert"].splitlines())+"\n"
    return {"kind":"state", "command":"python3 - <<'LABEX_CHECK'\n"+program+"LABEX_CHECK"}


def write_command(t):
    if t["command"] and t["file"]=="bash_loops":
        return ["mkdir -p ~/project/bash_loops", "cd ~/project/bash_loops"]
    target=PROJECT+t["file"]
    commands=["python3 -c "+shlex.quote("from pathlib import Path; p=Path("+repr(target)+"); p.parent.mkdir(parents=True,exist_ok=True); p.write_text("+repr(t["code"])+")")]
    if t["executable"]:
        commands.append("chmod +x "+shlex.quote(target))
    if t["run"] and "trap_" in t["file"]:
        commands.append({"command":target,"input":[{"wait_for":"iteration 1", "text":"\u0003", "raw":True}]})
    elif t["run"]:
        commands.append(target+" "+" ".join(map(shlex.quote,t["args"])))
    return commands


def generate():
    outlines=json.loads((ROOT/"server/data/reference/linux-section-outlines.json").read_text(encoding="utf-8"))
    outlines={x["source_lab_id"]:x["sections"] for x in outlines["lessons"]}
    plan={"version":1,"course_id":"shell-for-beginners","expected_tasks":0,"provenance":"Independent behavior solutions for reviewed public requirements; private source graders unavailable.","lessons":[]}
    reviewed=[]
    for file in sorted((ROOT/"server/data/labs").glob("*.json")):
        lab=json.loads(file.read_text(encoding="utf-8"))
        sid=lab.get("source_lab_id")
        if lab.get("course_id")!="shell-for-beginners" or sid not in LESSONS: continue
        defs=LESSONS[sid]
        source=[s for s in outlines[sid] if s.get("need_verify")]
        assert len(source)==len(defs["tasks"]),(sid,len(source),len(defs["tasks"]))
        tasks=[]; scenario={"lab_id":lab["id"],"source_lab_id":sid,"steps":[]}
        for old,t in zip(source,defs["tasks"]):
            pos=old["position"]; title=old["title"]
            definition=checker(t)
            if t["run"]:
                pattern=r"(?:^|[;&|]\s*)(?:bash\s+)?(?:\./|/home/labex/project/|~/project/)?"+t["file"].replace(".",r"\.")+r"(?:\s|$)"
                definition={"kind":"all","checks":[definition,{"kind":"commands","groups":[[pattern]],"allowed_status":[0]}]}
            step={"id":f"source-{sid}-section-{pos}-v4", "title":title,"title_vi":TITLES_VI.get(title,TITLES_VI.get(title.replace('\\*','*'),title)),"position":pos,"kind":"task","layout":old.get("layout","doc-workbench-split"),"need_verify":True,"has_solution":old.get("has_solution",False),
                  "content":t["en"],"content_vi":t["vi"],"task":t["en"],"task_vi":t["vi"],"hint":"Review the file, interpreter and boundary cases.","hint_vi":"Kiểm tra tên tệp, trình thông dịch và các trường hợp biên.","verification":definition,"required_capabilities":["terminal","files","shell"]}
            if t["code"] and lab.get("type")!="challenge":
                run_command="~/project/"+t["file"]+" "+" ".join(map(shlex.quote,t["args"]))
                if t["executable"]:
                    run_command="chmod +x ~/project/"+t["file"]+"\n"+run_command
                else:
                    run_command="bash "+run_command
                step["content"]+="\n\n`~/project/"+t["file"]+"`:\n\n```bash\n"+t["code"]+"```\n\nRun:\n\n```bash\n"+run_command+"\n```"
                step["content_vi"]+="\n\n`~/project/"+t["file"]+"`:\n\n```bash\n"+t["code"]+"```\n\nChạy:\n\n```bash\n"+run_command+"\n```"
            if lab.get("type")=="challenge":
                # Exact functional output strings are necessary to avoid the
                # former invented challenge. No source explanatory prose copied.
                if sid==388885:
                    examples="\n\n"+"\n".join(f"- `{n}` → `{out}`" for n,out in WEATHER_TESTS)
                elif sid==388893:
                    examples="\n\n`10,5,+` → `Result: 15`; `10,5,-` → `Result: 5`; `10,5,*` → `Result: 50`; `10,5,/` → `Result: 2`; `10,0,/` → `Error: Division by zero is not allowed.`"
                else:
                    examples="\n\n```text\nChecking: test_file.txt\nExists: Yes\nType: File\nReadable: Yes\n```\n\nMissing: `Exists: No`. Directory: `Type: Directory`."
                step["content"]+=examples;step["content_vi"]+=examples
            tasks.append(step)
            scenario["steps"].append({"id":step["id"],"commands":write_command(t)})
        intro=copy.deepcopy(lab["sections"][0]);summary=copy.deepcopy(lab["sections"][-1])
        intro["content"]="Practice the reviewed shell concepts below. Instructions are independently written; functional requirements follow the linked public lesson."
        intro["content_vi"]="Thực hành các khái niệm shell bên dưới. Hướng dẫn được biên soạn lại; yêu cầu chức năng theo bài công khai được liên kết."
        summary["content"]="Review your scripts and retry their edge cases. Passing these local checks does not certify source-private grader parity."
        summary["content_vi"]="Ôn lại script và thử trường hợp biên. Đạt bộ kiểm tra local không có nghĩa đã phục hồi bộ chấm riêng của nguồn."
        lab.update(steps=tasks,sections=[intro,*tasks,summary],curriculum_version=4,
                   backend_audit={"fidelity":"public-functional-requirements-reviewed","reviewed_at":"2026-10-17","source_url":lab["source_url"],"prose":"independently-authored-en-vi","private_grader_recovered":False})
        file.write_text(json.dumps(lab,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        manifest={"version":1,"directories":[],"files":[],"accounts":[],"groups":[],"provenance":{"fixture_fidelity":"reconstructed_from_public_requirements","original_bytes_recovered":False}}
        for name,content in defs["fixture"].items():
            if content is None:manifest["directories"].append({"path":PROJECT+name.rstrip("/"),"owner":"labex:labex"})
            else:manifest["files"].append({"path":PROJECT+name,"content":content,"mode":"0755" if name.endswith(".sh") else "0644","owner":"labex:labex"})
        (ROOT/"server/data/environment-setups"/(lab["id"]+".json")).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        plan["lessons"].append(scenario);plan["expected_tasks"]+=len(tasks)
        reviewed.append({"source_lab_id":sid,"source_url":lab["source_url"],"tasks":len(tasks),"fidelity":"public-functional-requirements-reviewed","private_grader_recovered":False})
    plan["lessons"].sort(key=lambda l:json.loads((ROOT/"server/data/labs"/(l["lab_id"]+".json")).read_text(encoding="utf-8"))["order"])
    (ROOT/"tests/scenarios/shell-reviewed-later.json").write_text(json.dumps(plan,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (ROOT/"server/data/reference/shell-reviewed-later.json").write_text(json.dumps({"version":1,"reviewed_at":"2026-10-17","lessons":reviewed},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return plan


if __name__=="__main__":
    # Compilation catches indentation/string substitutions before any files are
    # emitted. Runtime positive/negative checks use the separate smoke plan.
    for sid, definition in LESSONS.items():
        for entry in definition["tasks"]:
            rule=checker(entry)
            if rule["command"].startswith("python3 - "):
                compile(rule["command"].split("\n",1)[1].rsplit("LABEX_CHECK",1)[0],str(sid),"exec")
    plan=generate()
    print(f"Updated {len(plan['lessons'])} Shell lessons / {plan['expected_tasks']} tasks; no runtime reset performed.")
