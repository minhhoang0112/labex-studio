const fs = require('fs');
const path = require('path');

const filePath = path.resolve('server/data/labs/linux-basic-files-operations.json');
const lab = JSON.parse(fs.readFileSync(filePath, 'utf8'));

lab.title_vi = "Các Thao Tác Tệp Cơ Bản";
lab.overview_vi = "Làm chủ các thao tác quản lý tệp và thư mục cơ bản trong Linux: di chuyển, tạo tệp, sao chép (cp), đổi tên/di chuyển (mv) và xóa an toàn (rm).";

const sectionTranslations = {
  "source-270248-section-0": {
    title_vi: "Giới thiệu",
    content_vi: `Chào mừng bạn đến với bài thực hành **Các Thao Tác Tệp Cơ Bản trong Linux**! 

Trong hệ điều hành Linux, hầu như mọi thứ đều được xem là một tệp (Everything is a file), điều này khiến cho các thao tác quản lý tệp trở thành kỹ năng nền tảng quan trọng nhất để làm việc với hệ thống. 

Bài thực hành này sẽ hướng dẫn bạn từng bước làm quen với những câu lệnh phổ biến nhất để quản lý tệp và thư mục, giúp bạn thao tác thành thạo và tổ chức hệ thống Linux một cách chuyên nghiệp.`
  },
  "source-270248-section-1": {
    title_vi: "Tìm hiểu Môi trường Làm việc",
    content_vi: `Trong Linux, mỗi người dùng thường có một "thư mục cá nhân" (home directory), được ký hiệu bằng dấu ngã \`~\`. Tuy nhiên, trong bài thực hành này, chúng ta sẽ bắt đầu từ thư mục \`/home/labex/project\`, đây là thư mục làm việc mặc định của phiên học.

Trước tiên, hãy đảm bảo bạn đang ở cửa sổ **Terminal**.

### 1. Xác định vị trí hiện tại của bạn:

\`\`\`bash
pwd
\`\`\`

Lệnh \`pwd\` là viết tắt của **"print working directory"** (in thư mục làm việc hiện tại). Lệnh này hiển thị chính xác vị trí của bạn trong cây thư mục hệ thống. Bạn sẽ thấy kết quả hiển thị trên terminal là \`/home/labex/project\`.

### 2. Khám phá mối liên hệ giữa thư mục làm việc và thư mục Home:

\`\`\`bash
echo ~
\`\`\`

Lệnh này sẽ hiển thị đường dẫn đến thư mục cá nhân (home directory) của tài khoản hiện tại, kết quả sẽ là \`/home/labex\`.

### 3. Xem danh sách các tệp trong thư mục hiện tại:

\`\`\`bash
ls
\`\`\`

Lệnh này sẽ liệt kê các tệp và thư mục con nằm trong thư mục làm việc hiện tại (\`/home/labex/project\`).

### 4. Kiểm tra nội dung của thư mục Home:

\`\`\`bash
ls ~
\`\`\`

Lệnh này liệt kê nội dung bên trong thư mục cá nhân của bạn, có thể khác với thư mục làm việc hiện tại.

> **Ghi nhớ:** Hiểu rõ sự khác biệt giữa thư mục làm việc hiện tại (\`pwd\`) và thư mục cá nhân (\`~\`) là nền tảng cốt lõi để điều hướng hệ thống tệp Linux hiệu quả.`
  },
  "source-270248-section-2": {
    title_vi: "Điều hướng Hệ thống Tệp (Navigation)",
    content_vi: `Linux sử dụng cấu trúc **"hệ thống tệp phân cấp"** (hierarchical file system), tương tự như một cái cây lớn có nhiều nhánh. Gốc cây chính được gọi là **"thư mục gốc"** (root directory), ký hiệu bằng một dấu gạch chéo đơn \`/\`. Mọi tệp và thư mục khác đều phân nhánh xuất phát từ gốc này.

Hãy cùng thực hành cách di chuyển trong cây thư mục:

### 1. Kiểm tra vị trí hiện tại:
\`\`\`bash
pwd
\`\`\`
Kết quả sẽ là \`/home/labex/project\`. Nếu không phải, bạn có thể chạy lệnh \`cd /home/labex/project\` để quay lại vị trí ban đầu.

### 2. Xem nội dung thư mục hiện tại:
\`\`\`bash
ls
\`\`\`
Thư mục \`/home/labex/project\` lúc này đang trống, nên bạn sẽ chưa thấy tệp nào xuất hiện.

### 3. Di chuyển lên thư mục cha (cấp trên):
\`\`\`bash
cd ..
\`\`\`
Ký hiệu hai dấu chấm \`..\` đại diện cho **"thư mục cấp trên ngay phía trước"** (thư mục cha). Sau khi chạy lệnh này, hãy gõ \`pwd\` để kiểm tra lại; bạn sẽ thấy mình đang ở \`/home/labex\`.

### 4. Trở lại thư mục project:
\`\`\`bash
cd project
\`\`\`
Lệnh này đưa bạn quay trở lại thư mục \`/home/labex/project\`.

### 5. Di chuyển nhanh về thư mục Home:
\`\`\`bash
cd ~
\`\`\`
Dấu ngã \`~\` là lối tắt đại diện cho thư mục cá nhân. Chạy \`pwd\` để xác nhận bạn đang ở \`/home/labex\`.

### 6. Quay lại thư mục project bằng đường dẫn tuyệt đối:
\`\`\`bash
cd /home/labex/project
\`\`\`
Đây được gọi là **"đường dẫn tuyệt đối"** (absolute path) vì nó bắt đầu từ gốc (\`/\`) và chỉ rõ toàn bộ đường đi cụ thể đến đích.`
  },
  "source-270248-section-3": {
    title_vi: "Tạo Tệp và Liệt kê Chi tiết Thư mục",
    content_vi: `Bây giờ chúng ta đã biết cách điều hướng, hãy cùng tạo các tệp mới và tìm hiểu các tùy chọn liệt kê danh sách tệp nâng cao.

Trước tiên, hãy chắc chắn bạn đang ở thư mục \`/home/labex/project\`:

\`\`\`bash
cd /home/labex/project
\`\`\`

### 1. Tạo tệp rỗng với lệnh touch:
\`\`\`bash
touch file1.txt
\`\`\`
Lệnh \`touch\` dùng để tạo một tệp rỗng mới. Nếu tệp đã tồn tại từ trước, \`touch\` sẽ cập nhật mốc thời gian sửa đổi của tệp mà không làm thay đổi nội dung bên trong.

### 2. Tạo tệp có nội dung bằng toán tử chuyển hướng (>):
\`\`\`bash
echo "Hello, Linux" > file2.txt
\`\`\`
Câu lệnh này thực hiện 2 thao tác kết hợp:
- Lệnh \`echo\` in ra chuỗi văn bản \`Hello, Linux\`.
- Toán tử chuyển hướng \`>\` ghi kết quả đầu ra của \`echo\` vào tệp \`file2.txt\`. Nếu tệp chưa có, hệ thống sẽ tạo mới; nếu tệp đã có, nội dung cũ sẽ bị ghi đè.

### 3. Tạo một tệp ẩn (Hidden file):
\`\`\`bash
echo "Hidden file" > .hiddenfile
\`\`\`
Trong Linux, bất kỳ tệp hoặc thư mục nào có tên bắt đầu bằng **dấu chấm (\`.\`)** đều được hệ thống coi là tệp ẩn.

### 4. Tạo một thư mục mới với mkdir:
\`\`\`bash
mkdir testdir
\`\`\`
Lệnh \`mkdir\` (viết tắt của **"make directory"**) tạo một thư mục con mới có tên là \`testdir\`.

### 5. Liệt kê cơ bản:
\`\`\`bash
ls
\`\`\`
Hiển thị các tệp và thư mục thông thường: bạn sẽ thấy \`file1.txt\`, \`file2.txt\` và \`testdir\`. Tệp \`.hiddenfile\` sẽ không xuất hiện ở đây.

### 6. Liệt kê chi tiết định dạng dài (-l):
\`\`\`bash
ls -l
\`\`\`
Tùy chọn \`-l\` (chữ L thường) hiển thị danh sách theo định dạng chi tiết, bao gồm: quyền truy cập tệp, người sở hữu, nhóm, dung lượng tính theo byte và thời gian chỉnh sửa lần cuối.

### 7. Hiển thị tất cả tệp bao gồm cả tệp ẩn (-a):
\`\`\`bash
ls -a
\`\`\`
Tùy chọn \`-a\` (all) sẽ hiển thị mọi tệp, bao gồm cả tệp ẩn \`.hiddenfile\` cùng các liên kết thư mục \`.\` và \`..\`.

### 8. Kết hợp nhiều tùy chọn:
\`\`\`bash
ls -la
\`\`\`
Kết hợp cả xem chi tiết (\`-l\`) và hiển thị tệp ẩn (\`-a\`).

### 9. Xem nội dung của một thư mục cụ thể:
\`\`\`bash
ls -l testdir
\`\`\`
Xem nội dung bên trong thư mục \`testdir\` (hiện tại đang rỗng).`
  },
  "source-270248-section-4": {
    title_vi: "Sao chép Tệp và Thư mục (cp)",
    content_vi: `Bây giờ chúng ta đã có các tệp mẫu, hãy cùng học cách sao chép tệp và thư mục bằng lệnh \`cp\` (copy):

### 1. Sao chép một tệp sang tệp mới:

\`\`\`bash
cp file1.txt file1_copy.txt
\`\`\`

Lệnh này tạo một bản sao độc lập của \`file1.txt\` với tên gọi mới là \`file1_copy.txt\` ngay trong thư mục hiện tại.

**Đối chiếu kết quả:**
Kiểm tra xem bản sao đã xuất hiện chưa bằng lệnh:
\`\`\`bash
ls
\`\`\`

### 2. Sao chép tệp vào một thư mục khác:

\`\`\`bash
cp file2.txt testdir/
\`\`\`

Lệnh này sao chép tệp \`file2.txt\` vào bên trong thư mục \`testdir/\` với tên tệp được giữ nguyên.

### 3. Sao chép toàn bộ một thư mục với cờ đệ quy (-r):

\`\`\`bash
cp -r testdir testdir_copy
\`\`\`

> **Lưu ý quan trọng:** Tùy chọn \`-r\` là viết tắt của **"recursive"** (đệ quy). Khi sao chép thư mục, bạn bắt buộc phải có cờ \`-r\` để hệ thống sao chép cả thư mục lẫn toàn bộ tệp con và cấu trúc bên trong nó. Nếu không có \`-r\`, lệnh \`cp\` sẽ báo lỗi bỏ qua thư mục.

### 4. Đối chiếu và kiểm tra lại toàn bộ bản sao:

\`\`\`bash
ls
ls testdir
ls testdir_copy
\`\`\`

Quan sát kết quả trên terminal để đảm bảo \`file1_copy.txt\` đã nằm ở thư mục hiện tại, \`file2.txt\` đã có trong \`testdir\`, và thư mục \`testdir_copy\` đã được nhân bản hoàn chỉnh.`
  },
  "source-270248-section-5": {
    title_vi: "Di chuyển và Đổi tên Tệp / Thư mục (mv)",
    content_vi: `Lệnh \`mv\` (move) trong Linux được dùng cho cả 2 mục đích: **di chuyển vị trí** và **đổi tên** tệp/thư mục:

### 1. Đổi tên một tệp:

\`\`\`bash
mv file1.txt newname.txt
\`\`\`

Lệnh này đổi tên \`file1.txt\` thành \`newname.txt\` mà không làm thay đổi vị trí hay nội dung của tệp.

### 2. Di chuyển tệp vào trong một thư mục:

\`\`\`bash
mv newname.txt testdir/
\`\`\`

Lệnh này chuyển tệp \`newname.txt\` từ thư mục hiện tại vào bên trong thư mục \`testdir/\`.

### 3. Đổi tên một thư mục:

\`\`\`bash
mv testdir_copy new_testdir
\`\`\`

Lệnh này đổi tên thư mục \`testdir_copy\` thành \`new_testdir\`.

### 4. Vừa di chuyển vừa đổi tên trong cùng một câu lệnh:

\`\`\`bash
mv testdir/newname.txt ./original_file1.txt
\`\`\`

Lệnh này lấy tệp \`newname.txt\` từ bên trong \`testdir/\`, di chuyển ra thư mục hiện tại (\`./\`) và đồng thời đổi tên thành \`original_file1.txt\`.

### 5. Đối chiếu kết quả sau khi thay đổi:

\`\`\`bash
ls
ls testdir
\`\`\`

Kiểm tra để chắc chắn các tệp đã được di chuyển và đổi tên đúng như yêu cầu.`
  },
  "source-270248-section-6": {
    title_vi: "Xóa Tệp và Thư mục (rm)",
    content_vi: `Xóa tệp và thư mục là một thao tác có tác động rất lớn trong Linux. Khác với giao diện đồ họa trên máy tính cá nhân, dòng lệnh terminal **không có Thùng rác (Recycle Bin / Trash)**! Mọi thao tác xóa bằng lệnh \`rm\` đều mang tính chất vĩnh viễn không thể hoàn tác. Hãy luôn cẩn thận kiểm tra kỹ đường dẫn trước khi gõ lệnh!

Hãy cùng dọn dẹp các tệp và thư mục mà chúng ta đã tạo ra. Trước hết, hãy chắc chắn bạn đang ở thư mục \`/home/labex/project\`:

\`\`\`bash
pwd
ls -a
\`\`\`

Bạn sẽ thấy danh sách các tệp và thư mục:
\`\`\`plaintext
.
..
.hiddenfile
file1_copy.txt
file2.txt
new_testdir
original_file1.txt
testdir
\`\`\`

### 1. Xóa một tệp đơn lẻ:

\`\`\`bash
rm original_file1.txt
\`\`\`

Lệnh \`rm\` (viết tắt của **"remove"**) dùng để xóa tệp. Kiểm tra lại bằng \`ls\`, bạn sẽ thấy \`original_file1.txt\` đã biến mất.

### 2. Xóa ở chế độ tương tác hỏi trước (-i) để an toàn:

\`\`\`bash
rm -i file2.txt
\`\`\`

Tùy chọn \`-i\` (interactive) sẽ dừng lại và hỏi bạn xác nhận trước khi thực sự xóa. Nhấn \`y\` (Yes) rồi ấn **Enter** để đồng ý xóa. Nếu gõ \`n\` (No), tệp sẽ được giữ nguyên an toàn. Kiểm tra lại bằng \`ls\`.

### 3. Thử xóa thư mục có chứa tệp bằng rmdir:

\`\`\`bash
ls new_testdir
rmdir new_testdir
\`\`\`

Lệnh \`rmdir\` (remove directory) chỉ xóa được các **thư mục hoàn toàn rỗng**. Vì thư mục \`new_testdir\` vẫn đang chứa tệp \`file2.txt\`, hệ thống sẽ từ chối và báo lỗi: \`rmdir: failed to remove 'new_testdir': Directory not empty\`.

### 4. Xóa toàn bộ thư mục và nội dung bên trong bằng cờ đệ quy (-r):

\`\`\`bash
rm -r testdir
\`\`\`

Để xóa một thư mục không rỗng, chúng ta phải dùng lệnh \`rm\` kết hợp với tùy chọn đệ quy \`-r\`. Lệnh này sẽ xóa sạch cả thư mục \`testdir\` cùng mọi tệp bên trong nó.

\`\`\`bash
ls
\`\`\`
Thư mục \`testdir\` đã được xóa hoàn toàn.

### 5. Xóa tệp ẩn:

\`\`\`bash
rm .hiddenfile
ls -a
\`\`\`

### 6. Cờ ép buộc (-f) và cảnh báo nguy hiểm khi kết hợp rm -rf:

\`\`\`bash
mkdir temp_dir
touch temp_dir/temp_file.txt
ls -R temp_dir
\`\`\`

> **Lưu ý phân biệt:** Lệnh \`ls -R\` dùng chữ **R in hoa** để liệt kê cây thư mục con đệ quy (Recursive listing). Ngược lại, lệnh \`cp\` và \`rm\` dùng chữ **r thường** (\`-r\`) để duyệt đệ quy. Đừng nhầm lẫn giữa chữ hoa và chữ thường trong Linux!

Bây giờ hãy thử xóa cưỡng bức:
\`\`\`bash
rm -rf temp_dir
\`\`\`

> ⚠️ **CẢNH BÁO NGUY HIỂM:** Tùy chọn \`-f\` (force) sẽ ép buộc xóa mà không bao giờ hỏi xác nhận. Lệnh \`rm -rf\` là lệnh cực kỳ mạnh mẽ và nguy hiểm bậc nhất trong Linux. Một lỗi gõ nhầm đường dẫn (ví dụ \`rm -rf /\`) có thể xóa sạch toàn bộ hệ điều hành của bạn. Luôn kiểm tra kỹ từng ký tự trước khi chạy lệnh này!`
  },
  "source-270248-section-7": {
    title_vi: "Tổng kết",
    content_vi: `Chúc mừng bạn đã hoàn thành bài thực hành **Các Thao Tác Tệp Cơ Bản**!

### Tóm tắt các câu lệnh cốt lõi bạn đã làm chủ:
- **\`pwd\`**: Hiển thị đường dẫn thư mục làm việc hiện tại.
- **\`cd\`**: Di chuyển giữa các thư mục (\`cd ..\` lên cấp trên, \`cd ~\` về Home, \`cd /đường_dẫn_tuyệt_đối\`).
- **\`ls\`**: Liệt kê tệp và thư mục (\`-l\` xem chi tiết, \`-a\` hiện tệp ẩn, \`-la\` kết hợp cả hai).
- **\`touch\`**: Tạo tệp rỗng mới hoặc cập nhật thời gian tệp.
- **\`echo "nội dung" > file.txt\`**: Tạo tệp và ghi nội dung văn bản.
- **\`mkdir\`**: Tạo thư mục mới.
- **\`cp\`**: Sao chép tệp; dùng \`cp -r\` để sao chép cả thư mục đệ quy.
- **\`mv\`**: Di chuyển hoặc đổi tên tệp và thư mục.
- **\`rm\`**: Xóa tệp; dùng \`rm -i\` để hỏi xác nhận an toàn, dùng \`rm -r\` để xóa thư mục đệ quy.`
  }
};

for (const sec of lab.sections) {
  if (sectionTranslations[sec.id]) {
    sec.title_vi = sectionTranslations[sec.id].title_vi;
    sec.content_vi = sectionTranslations[sec.id].content_vi;
  }
}

for (const step of lab.steps) {
  if (sectionTranslations[step.id]) {
    step.title_vi = sectionTranslations[step.id].title_vi;
    step.content_vi = sectionTranslations[step.id].content_vi;
  }
}

fs.writeFileSync(filePath, JSON.stringify(lab, null, 2), 'utf8');
console.log('Successfully updated Vietnamese authentic content for linux-basic-files-operations.json!');

