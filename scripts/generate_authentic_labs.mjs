import fs from 'node:fs';
import path from 'node:path';

throw new Error('Legacy generator disabled: its exercises and unconditional checks do not match the reference course. Use scripts/generate-source-aligned-labs.mjs and the reference manifest.');

const labs = [
  {
    id: 'linux-your-first-linux-lab',
    course_id: 'quick-start-with-linux',
    title: 'Your First Linux Lab',
    order: 1,
    difficulty: 'Beginner',
    estimated_time: '20 mins',
    overview: 'Chào mừng bạn đến với Linux! Bài lab nhập môn này sẽ hướng dẫn bạn cách chạy những câu lệnh Linux đầu tiên: in văn bản với echo, kiểm tra tài khoản với whoami và xem thông tin danh tính hệ thống với id.',
    steps: [
      {
        id: 'step-1',
        title: '1. Hello LabEx (echo command)',
        content: `### 1. In văn bản ra màn hình với echo

Lệnh \`echo\` trong Linux dùng để in một chuỗi văn bản ra cửa sổ terminal. Lệnh này lặp lại chính xác những gì bạn truyền vào.

Nhập lệnh sau vào terminal và nhấn **Enter**:

\`\`\`bash
echo "Hello LabEx"
\`\`\`

> **Lưu ý:** Lệnh trong Linux phân biệt chữ hoa và chữ thường (\`echo\` viết thường, không viết \`Echo\`). Cần có khoảng trắng giữa \`echo\` và chuỗi văn bản.`,
        task: 'Chạy lệnh echo "Hello LabEx" trong terminal.',
        verify_command: `history 50 2>/dev/null | grep -Eiq 'echo\\s+["\x27]Hello\\s+LabEx["\x27]' || grep -Eiq 'Hello\\s+LabEx' ~/.bash_history 2>/dev/null || test -f ~/project/hello.txt || true`,
        hint: 'Nhập chính xác: echo "Hello LabEx" rồi nhấn Enter trong terminal.'
      },
      {
        id: 'step-2',
        title: '2. Xác định người dùng hiện tại (whoami)',
        content: `### 2. Xác định người dùng với whoami

Khi làm việc trên Linux, bạn thường cần biết mình đang đăng nhập dưới tài khoản nào. Lệnh \`whoami\` (viết tắt của "Who am I?") sẽ in ra tên người dùng của phiên làm việc hiện tại.

Nhập lệnh sau vào terminal và nhấn **Enter**:

\`\`\`bash
whoami
\`\`\`

Terminal sẽ hiển thị tên tài khoản đang chạy câu lệnh.`,
        task: 'Chạy lệnh whoami trong terminal.',
        verify_command: `history 50 2>/dev/null | grep -Eq 'whoami' || grep -Eq 'whoami' ~/.bash_history 2>/dev/null || true`,
        hint: 'Nhập whoami và nhấn Enter trong terminal.'
      },
      {
        id: 'step-3',
        title: '3. Hiển thị thông tin người dùng và nhóm (id)',
        content: `### 3. Xem chi tiết thông tin danh tính với id

Trong khi \`whoami\` chỉ in tên tài khoản, lệnh \`id\` cung cấp thông tin chi tiết hơn bao gồm:
- \`uid\`: User ID (mã định danh số duy nhất của người dùng)
- \`gid\`: Primary Group ID (mã nhóm chính)
- \`groups\`: Tất cả các nhóm mà tài khoản của bạn thuộc về

Nhập lệnh sau vào terminal và nhấn **Enter**:

\`\`\`bash
id
\`\`\`

Các thông số này đóng vai trò then chốt khi thiết lập quyền hạn truy cập tập tin trong Linux.`,
        task: 'Chạy lệnh id trong terminal.',
        verify_command: `history 50 2>/dev/null | grep -Eq '(^|\\s)id(\\s|$)' || grep -Eq '(^|\\s)id(\\s|$)' ~/.bash_history 2>/dev/null || true`,
        hint: 'Nhập lệnh id và nhấn Enter trong terminal.'
      }
    ]
  },
  {
    id: 'linux-display-user-and-group-information',
    course_id: 'quick-start-with-linux',
    title: 'Display User and Group Information',
    order: 2,
    difficulty: 'Beginner',
    estimated_time: '15 mins',
    overview: 'Thử thách thực hành độc lập: Vận dụng các lệnh whoami và id để kiểm tra thông tin tài khoản người dùng và ghi thông tin ra tập tin.',
    steps: [
      {
        id: 'step-1',
        title: '1. Lưu thông tin danh tính vào user_info.txt',
        content: `### 1. Lưu thông tin danh tính

Trong thử thách này, bạn hãy tự dùng terminal để lấy thông tin tài khoản:
1. Chạy lệnh \`whoami\` để xác nhận bạn là ai.
2. Dùng toán tử chuyển hướng \`>\` để lưu kết quả lệnh \`id\` vào tập tin \`user_info.txt\`:

\`\`\`bash
id > user_info.txt
\`\`\`

3. Dùng lệnh \`cat user_info.txt\` để kiểm tra lại nội dung tập tin vừa tạo.`,
        task: 'Tạo tập tin user_info.txt chứa thông tin kết quả của lệnh id.',
        verify_command: `test -f ~/user_info.txt && grep -Eq 'uid=[0-9]+' ~/user_info.txt`,
        hint: 'Chạy: id > user_info.txt rồi kiểm tra lại bằng: cat user_info.txt'
      }
    ]
  },
  {
    id: 'linux-basic-files-operations',
    course_id: 'quick-start-with-linux',
    title: 'Basic Files Operations',
    order: 3,
    difficulty: 'Beginner',
    estimated_time: '30 mins',
    overview: 'Học cách điều hướng thư mục và thao tác với tệp tin căn bản trong Linux: pwd, cd, ls, touch, mkdir, cp, mv và rm.',
    steps: [
      {
        id: 'step-1',
        title: '1. Điều hướng và tạo thư mục (pwd, cd, mkdir)',
        content: `### 1. Định vị và tạo thư mục

- \`pwd\`: Print Working Directory - hiển thị đường dẫn thư mục hiện tại của bạn.
- \`mkdir\`: Tạo thư mục mới. Dùng tùy chọn \`-p\` để tạo cả cây thư mục cha-con.
- \`cd\`: Change Directory - chuyển sang thư mục khác.

Nhập các lệnh sau vào terminal:

\`\`\`bash
pwd
mkdir -p project/docs
cd project
pwd
\`\`\``,
        task: 'Tạo cấu trúc thư mục project/docs và chuyển vào thư mục project.',
        verify_command: `test -d ~/project/docs`,
        hint: 'Chạy: mkdir -p project/docs rồi chạy cd project'
      },
      {
        id: 'step-2',
        title: '2. Tạo tệp và liệt kê danh sách (touch, ls)',
        content: `### 2. Tạo tệp rỗng và xem danh sách

- \`touch\`: Tạo một tệp tin mới rỗng hoặc cập nhật thời gian sửa đổi của tệp.
- \`ls\`: Liệt kê các tệp và thư mục bên trong thư mục hiện tại.
  - \`ls -l\`: Hiển thị chi tiết (quyền, kích thước, ngày sửa đổi).
  - \`ls -a\`: Hiển thị cả tệp ẩn (bắt đầu bằng dấu chấm \`.\`).

Tạo các tệp tin trong thư mục project:

\`\`\`bash
touch app1.log app2.log readme.txt
ls -l
\`\`\``,
        task: 'Tạo các tệp app1.log, app2.log và readme.txt trong thư mục project.',
        verify_command: `test -f ~/project/app1.log && test -f ~/project/app2.log && test -f ~/project/readme.txt`,
        hint: 'Đảm bảo bạn đang ở ~/project rồi gõ: touch app1.log app2.log readme.txt'
      },
      {
        id: 'step-3',
        title: '3. Sao chép, di chuyển và xóa tệp (cp, mv, rm)',
        content: `### 3. Sao chép, đổi tên và xóa tệp

- \`cp <nguồn> <đích>\`: Copy - sao chép tệp.
- \`mv <nguồn> <đích>\`: Move - di chuyển tệp hoặc đổi tên tệp.
- \`rm <tệp>\`: Remove - xóa tệp vĩnh viễn (hãy cẩn thận vì không có thùng rác!).

Thực hành sao chép và di chuyển:

\`\`\`bash
cp readme.txt docs/readme_backup.txt
mv app1.log app1_old.log
rm app2.log
ls -l
\`\`\``,
        task: 'Sao chép readme.txt sang docs/readme_backup.txt, đổi tên app1.log thành app1_old.log và xóa app2.log.',
        verify_command: `test -f ~/project/docs/readme_backup.txt && test -f ~/project/app1_old.log && test ! -f ~/project/app2.log`,
        hint: 'Chạy: cp readme.txt docs/readme_backup.txt; mv app1.log app1_old.log; rm -f app2.log'
      }
    ]
  },
  {
    id: 'linux-files-and-directories',
    course_id: 'quick-start-with-linux',
    title: 'Files and Directories Challenge',
    order: 4,
    difficulty: 'Beginner',
    estimated_time: '20 mins',
    overview: 'Thử thách tổ chức cấu trúc dữ liệu: Vận dụng tổng hợp mkdir, touch, cp, mv và rm để sắp xếp hệ thống thư mục theo yêu cầu.',
    steps: [
      {
        id: 'step-1',
        title: '1. Tạo cây thư mục dự án workspace',
        content: `### 1. Thiết lập cây thư mục dự án

Bạn được giao nhiệm vụ dọn dẹp và tổ chức thư mục cho nhóm phát triển:
1. Tạo thư mục \`workspace/backup\` và \`workspace/src\`.
2. Tạo tệp \`main.py\` và \`config.json\` trong \`workspace/src\`.
3. Sao chép \`config.json\` sang thư mục \`workspace/backup/config_backup.json\`.

\`\`\`bash
mkdir -p workspace/backup workspace/src
touch workspace/src/main.py workspace/src/config.json
cp workspace/src/config.json workspace/backup/config_backup.json
\`\`\``,
        task: 'Tạo cấu trúc workspace với src/main.py, src/config.json và backup/config_backup.json.',
        verify_command: `test -f ~/workspace/src/main.py && test -f ~/workspace/src/config.json && test -f ~/workspace/backup/config_backup.json`,
        hint: 'Kiểm tra đường dẫn ~/workspace/src/ và ~/workspace/backup/ đã có đầy đủ tệp chưa.'
      }
    ]
  },
  {
    id: 'linux-file-contents-and-comparing',
    course_id: 'quick-start-with-linux',
    title: 'File Contents and Comparing',
    order: 5,
    difficulty: 'Beginner',
    estimated_time: '30 mins',
    overview: 'Học cách đọc nội dung tập tin, xem phần đầu (head), phần đuôi (tail), lọc dữ liệu (grep) và so sánh sự khác biệt giữa hai tập tin (diff).',
    steps: [
      {
        id: 'step-1',
        title: '1. Đọc nội dung tệp với cat, head và tail',
        content: `### 1. Đọc nội dung tệp với cat, head, tail

- \`cat <tệp>\`: Hiển thị toàn bộ nội dung tệp ra màn hình.
- \`head -n <số_dòng> <tệp>\`: Chỉ xem n dòng đầu tiên của tệp.
- \`tail -n <số_dòng> <tệp>\`: Chỉ xem n dòng cuối cùng của tệp.

Hãy tạo tệp văn bản mẫu và thực hành:

\`\`\`bash
cat > sample.txt << 'EOF'
Line 1: Linux Kernel
Line 2: Ubuntu Distribution
Line 3: Bash Shell
Line 4: Systemd Service
Line 5: Package Manager
EOF

cat sample.txt
head -n 2 sample.txt
tail -n 2 sample.txt
\`\`\``,
        task: 'Tạo tệp sample.txt với 5 dòng mẫu và thực hành đọc bằng cat, head, tail.',
        verify_command: `test -f ~/sample.txt && test $(wc -l < ~/sample.txt) -ge 5`,
        hint: 'Dùng lệnh cat > sample.txt để tạo tệp rồi chạy head và tail.'
      },
      {
        id: 'step-2',
        title: '2. So sánh hai tệp tin với diff',
        content: `### 2. So sánh sự khác nhau bằng diff

Lệnh \`diff file1 file2\` so sánh từng dòng giữa 2 tệp tin và chỉ ra điểm khác nhau. Ký tự \`<\` chỉ dòng ở tệp thứ nhất, ký tự \`>\` chỉ dòng ở tệp thứ hai.

Tạo phiên bản sửa đổi \`sample_updated.txt\` và so sánh:

\`\`\`bash
cat > sample_updated.txt << 'EOF'
Line 1: Linux Kernel
Line 2: Ubuntu Distribution
Line 3: Zsh Shell
Line 4: Systemd Service
Line 5: Package Manager
Line 6: Docker Container
EOF

diff sample.txt sample_updated.txt
\`\`\``,
        task: 'Tạo tệp sample_updated.txt và chạy lệnh so sánh diff sample.txt sample_updated.txt.',
        verify_command: `test -f ~/sample_updated.txt && diff ~/sample.txt ~/sample_updated.txt >/dev/null 2>&1; test $? -eq 1`,
        hint: 'Tạo sample_updated.txt có nội dung khác sample.txt rồi chạy diff.'
      }
    ]
  },
  {
    id: 'linux-the-manuscript-mystery',
    course_id: 'quick-start-with-linux',
    title: 'The Manuscript Mystery',
    order: 6,
    difficulty: 'Beginner',
    estimated_time: '20 mins',
    overview: 'Thử thách thám tử văn bản: Bạn vào vai biên tập viên phát hiện sự sai lệch giữa hai bản thảo manuscript_v1.txt và manuscript_v2.txt bằng lệnh diff và head/tail.',
    steps: [
      {
        id: 'step-1',
        title: '1. Khám phá sự khác biệt trong bản thảo',
        content: `### 1. So sánh hai bản thảo

Hai bản thảo \`manuscript_v1.txt\` và \`manuscript_v2.txt\` có những điểm khác biệt quan trọng. 

Tạo hai bản thảo mẫu và lưu kết quả so sánh vào \`diff_report.txt\`:

\`\`\`bash
mkdir -p mystery && cd mystery

cat > manuscript_v1.txt << 'EOF'
Chapter 1: The Dark Forest
The wind was howling through the trees.
The treasure is hidden under the old bridge.
EOF

cat > manuscript_v2.txt << 'EOF'
Chapter 1: The Dark Forest
The wind was howling through the trees.
The treasure is hidden inside the castle tower.
EOF

diff manuscript_v1.txt manuscript_v2.txt > diff_report.txt
cat diff_report.txt
\`\`\``,
        task: 'Tạo thư mục mystery với manuscript_v1.txt, manuscript_v2.txt và lưu diff vào diff_report.txt.',
        verify_command: `test -f ~/mystery/diff_report.txt && test -s ~/mystery/diff_report.txt`,
        hint: 'Chạy: diff manuscript_v1.txt manuscript_v2.txt > diff_report.txt'
      }
    ]
  },
  {
    id: 'linux-permissions-of-files',
    course_id: 'quick-start-with-linux',
    title: 'Permissions of Files',
    order: 7,
    difficulty: 'Beginner',
    estimated_time: '30 mins',
    overview: 'Tìm hiểu hệ thống phân quyền tệp Linux: Read (r=4), Write (w=2), Execute (x=1) và cách sử dụng lệnh chmod để cấp/hủy quyền.',
    steps: [
      {
        id: 'step-1',
        title: '1. Xem quyền tệp với ls -l',
        content: `### 1. Cấu trúc quyền hạn tệp tin trong Linux

Khi chạy lệnh \`ls -l\`, bạn sẽ thấy chuỗi ký tự quyền hạn dạng \`-rw-r--r--\`:
- Ký tự 1: Loại tệp (\`-\` là tệp thường, \`d\` là thư mục).
- 3 ký tự tiếp theo (\`rw-\`): Quyền của chủ sở hữu (Owner/User).
- 3 ký tự tiếp (\`r--\`): Quyền của nhóm (Group).
- 3 ký tự cuối (\`r--\`): Quyền của người dùng khác (Others).

Tạo tệp script mẫu và kiểm tra quyền:

\`\`\`bash
touch myscript.sh
ls -l myscript.sh
\`\`\``,
        task: 'Tạo tệp myscript.sh và xem quyền hạn mặc định bằng ls -l.',
        verify_command: `test -f ~/myscript.sh`,
        hint: 'Gõ: touch myscript.sh rồi chạy ls -l myscript.sh'
      },
      {
        id: 'step-2',
        title: '2. Thay đổi quyền với chmod (chế độ số và chữ)',
        content: `### 2. Cấp quyền thực thi với chmod

- **Chế độ số (Octal):**
  - \`r = 4\`, \`w = 2\`, \`x = 1\`
  - \`755\`: Owner có đủ quyền (4+2+1=7), Group và Others có quyền đọc và chạy (4+1=5).
  - \`644\`: Owner đọc và ghi (4+2=6), Group và Others chỉ đọc (4).

- **Chế độ ký hiệu (Symbolic):**
  - \`chmod +x myscript.sh\`: Thêm quyền thực thi (execute) cho tệp.
  - \`chmod u+x,g-w myscript.sh\`

Thực hành cấp quyền chạy cho \`myscript.sh\`:

\`\`\`bash
chmod 755 myscript.sh
ls -l myscript.sh
\`\`\``,
        task: 'Đặt quyền của myscript.sh thành 755 (rwxr-xr-x).',
        verify_command: `test -f ~/myscript.sh && test $(stat -c %a ~/myscript.sh) = "755"`,
        hint: 'Chạy: chmod 755 myscript.sh'
      }
    ]
  },
  {
    id: 'shell-change-file-ownership',
    course_id: 'quick-start-with-linux',
    title: 'Change File Ownership',
    order: 8,
    difficulty: 'Beginner',
    estimated_time: '20 mins',
    overview: 'Thực hành quản lý quyền sở hữu và bảo mật tệp với chmod và chown: Tạo tệp bảo mật chỉ chủ sở hữu được đọc và ghi (chmod 600).',
    steps: [
      {
        id: 'step-1',
        title: '1. Tạo tệp bảo mật riêng tư (chmod 600)',
        content: `### 1. Phân quyền tệp bảo mật nhạy cảm

Các tệp nhạy cảm (như khóa SSH, cấu hình mật khẩu) thường được thiết lập quyền \`600\` (\`-rw-------\`), nghĩa là chỉ duy nhất chủ sở hữu được phép đọc và ghi, tất cả người khác đều bị từ chối truy cập.

Tạo tệp bí mật \`secret.txt\` và phân quyền 600:

\`\`\`bash
touch secret.txt
chmod 600 secret.txt
ls -l secret.txt
\`\`\``,
        task: 'Tạo tệp secret.txt và đặt quyền truy cập chính xác là 600.',
        verify_command: `test -f ~/secret.txt && test $(stat -c %a ~/secret.txt) = "600"`,
        hint: 'Chạy lệnh: touch secret.txt && chmod 600 secret.txt'
      }
    ]
  },
  {
    id: 'linux-user-account-management',
    course_id: 'quick-start-with-linux',
    title: 'User Account Management',
    order: 9,
    difficulty: 'Beginner',
    estimated_time: '35 mins',
    overview: 'Tìm hiểu cách quản trị tài khoản người dùng trong hệ điều hành Linux: tra cứu thông tin trong /etc/passwd, /etc/shadow và các thao tác tài khoản căn bản.',
    steps: [
      {
        id: 'step-1',
        title: '1. Khám phá tệp cấu hình tài khoản /etc/passwd',
        content: `### 1. Tệp /etc/passwd lưu thông tin gì?

Trong Linux, thông tin về mọi tài khoản người dùng được lưu trữ trong tệp \`/etc/passwd\`. Mỗi dòng biểu diễn một tài khoản với 7 trường thông tin cách nhau bằng dấu hai chấm \`:\`:
\`username:password_placeholder:UID:GID:GECOS(thông_tin):home_directory:login_shell\`

Hãy tra cứu tài khoản hiện tại của bạn:

\`\`\`bash
grep "^$(whoami):" /etc/passwd
\`\`\`

Hoặc tra cứu danh sách 5 tài khoản hệ thống đầu tiên:

\`\`\`bash
head -n 5 /etc/passwd
\`\`\``,
        task: 'Tra cứu thông tin tài khoản hiện tại trong /etc/passwd.',
        verify_command: `grep -Eq "^$(whoami):" /etc/passwd`,
        hint: 'Chạy lệnh: grep "^$(whoami):" /etc/passwd'
      },
      {
        id: 'step-2',
        title: '2. Kiểm tra nhóm người dùng trong /etc/group',
        content: `### 2. Tệp /etc/group và phân nhóm người dùng

Mọi nhóm tài khoản được quản lý trong tệp \`/etc/group\`.

Xem các nhóm mà tài khoản của bạn đang tham gia:

\`\`\`bash
groups
grep "$(whoami)" /etc/group
\`\`\``,
        task: 'Xem danh sách nhóm của tài khoản bằng lệnh groups.',
        verify_command: `id -Gn 2>/dev/null | grep -q "$(whoami)" || true`,
        hint: 'Nhập lệnh: groups rồi nhấn Enter.'
      }
    ]
  },
  {
    id: 'linux-the-jokers-trick',
    course_id: 'quick-start-with-linux',
    title: "The Joker's Trick",
    order: 10,
    difficulty: 'Beginner',
    estimated_time: '25 mins',
    overview: 'Thử thách tổng kết khóa học lấy cảm hứng từ thành phố Gotham: Vận dụng toàn bộ kiến thức quản lý tệp, quyền hạn và danh tính người dùng để giải quyết thử thách cuối cùng của Joker!',
    steps: [
      {
        id: 'step-1',
        title: '1. Giải mã manh mối của Joker trong Gotham',
        content: `### 1. Thử thách cuối cùng: Thành phố Gotham

Joker đã để lại một manh mối bí mật trong thành phố Gotham! Nhiệm vụ của bạn là:
1. Tạo thư mục \`gotham_city\`.
2. Tạo tệp \`batman.txt\` có nội dung \`I am Batman\`.
3. Đặt quyền tệp \`batman.txt\` thành \`755\` để hiệp sĩ bóng đêm có toàn quyền bảo vệ thành phố.

\`\`\`bash
mkdir -p gotham_city
echo "I am Batman" > gotham_city/batman.txt
chmod 755 gotham_city/batman.txt
ls -l gotham_city/batman.txt
\`\`\``,
        task: 'Tạo gotham_city/batman.txt chứa \"I am Batman\" với quyền truy cập 755.',
        verify_command: `test -f ~/gotham_city/batman.txt && grep -Fq 'I am Batman' ~/gotham_city/batman.txt && test $(stat -c %a ~/gotham_city/batman.txt) = "755"`,
        hint: 'Chạy: mkdir -p gotham_city; echo "I am Batman" > gotham_city/batman.txt; chmod 755 gotham_city/batman.txt'
      }
    ]
  }
];

const labsDir = 'server/data/labs';

// 1. Remove old custom linux labs that do not belong to official LabEx
const oldLabFiles = [
  'linux-navigation.json',
  'linux-file-operations.json',
  'linux-permissions.json',
  'linux-text-tools.json',
  'linux-redirection-pipes.json',
  'linux-search-find.json',
  'linux-archives.json',
  'linux-users-groups.json',
  'linux-shell-challenge.json'
];

for (const f of oldLabFiles) {
  const p = path.join(labsDir, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('Removed old lab file:', f);
  }
}

// 2. Write the 10 authentic labs
for (const lab of labs) {
  const p = path.join(labsDir, `${lab.id}.json`);
  fs.writeFileSync(p, JSON.stringify(lab, null, 2), 'utf8');
  console.log(`Saved [${lab.order}/10]: ${lab.id}.json - ${lab.title}`);
}

console.log('\\nSuccessfully updated all 10 labs for Quick Start with Linux!');

