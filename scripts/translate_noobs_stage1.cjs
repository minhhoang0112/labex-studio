const fs = require('fs');
const path = require('path');

const LABS_DIR = path.resolve('server/data/labs');

const LAB_TITLES_VI = {
  "linux-getting-started-with-linux-446315": "Bắt Đầu Với Terminal Linux",
  "linux-create-personalized-terminal-greeting-446322": "Lưu Banner Lời Chào Terminal",
  "linux-basic-file-operations-in-linux-18001": "Thao Tác Tệp Cơ Bản Trong Linux",
  "linux-get-help-on-linux-commands-18000": "Tra Cứu Trợ Giúp Câu Lệnh Linux",
  "linux-delete-and-move-files-7777": "Lưu Trữ Tệp Bản Nháp",
  "linux-linux-user-group-and-file-permissions-18002": "Nhóm Người Dùng và Quyền Hạn Tệp Linux",
  "linux-add-new-user-and-group-17987": "Tạo Người Dùng Thực Hành Mới",
  "linux-file-and-directory-operations-17997": "Thao Tác Quản Lý Tệp và Thư Mục Nâng Cao",
  "linux-find-a-file-17993": "Tìm Kiếm và Bảo Vệ Tệp Cấu Hình"
};

const SECTION_TRANSLATIONS = {
  "Run Your First Command": {
    title_vi: "Chạy Câu Lệnh Đầu Tiên Của Bạn",
    desc_vi: "Làm quen với terminal bằng cách chạy câu lệnh đầu tiên với echo."
  },
  "Read Dates and Calendars": {
    title_vi: "Xem Ngày Giờ và Lịch Hệ Thống",
    desc_vi: "Sử dụng lệnh date và cal để đọc thông tin thời gian thực của hệ điều hành."
  },
  "Calculate with Expr": {
    title_vi: "Tính Toán Số Học với Expr",
    desc_vi: "Thực hiện các phép tính số học trực tiếp trong terminal bằng lệnh expr."
  },
  "Turn Text into ASCII Art": {
    title_vi: "Tạo Chữ Nghệ Thuật ASCII",
    desc_vi: "Sử dụng các công cụ dòng lệnh như banner, figlet hoặc toilet để tạo chữ nghệ thuật ASCII."
  },
  "Reset a Busy Terminal": {
    title_vi: "Khôi Phục và Dọn Sạch Terminal",
    desc_vi: "Sử dụng lệnh clear hoặc reset để dọn dẹp màn hình terminal khi bị rối."
  },
  "Save the ASCII-Art Banner": {
    title_vi: "Lưu Banner Chữ Nghệ Thuật ASCII",
    desc_vi: "Tạo biểu ngữ chữ nghệ thuật và lưu vào tệp theo yêu cầu thử thách."
  },
  "Locate Your Working Directory": {
    title_vi: "Xác Định Thư Mục Làm Việc Hiện Tại",
    desc_vi: "Dùng pwd để xác định vị trí thư mục hiện tại trong cây hệ thống."
  },
  "Navigate with Relative Paths": {
    title_vi: "Điều Hướng Bằng Đường Dẫn Tương Đối",
    desc_vi: "Sử dụng cd kết hợp các ký hiệu . và .. để di chuyển tương đối."
  },
  "Inspect Directory Contents": {
    title_vi: "Kiểm Tra Nội Dung Thư Mục",
    desc_vi: "Dùng ls với các tùy chọn -l, -a để xem chi tiết tệp và tệp ẩn."
  },
  "Create Directories and Files": {
    title_vi: "Tạo Mới Thư Mục và Tệp",
    desc_vi: "Tạo thư mục bằng mkdir và tạo tệp rỗng bằng touch."
  },
  "Select Names with Wildcards": {
    title_vi: "Lọc Tên Tệp Bằng Ký Tự Đại Diện (Wildcard)",
    desc_vi: "Sử dụng dấu sao * và dấu chấm hỏi ? để thao tác hàng loạt tệp."
  },
  "Copy, Move, and Remove Files Safely": {
    title_vi: "Sao Chép, Di Chuyển và Xóa Tệp An Toàn",
    desc_vi: "Vận dụng cp, mv và rm an toàn với các cờ tùy chọn."
  },
  "Work Faster with Terminal Shortcuts": {
    title_vi: "Tăng Tốc Làm Việc với Phím Tắt Terminal",
    desc_vi: "Sử dụng phím Tab tự hoàn thành lệnh, Ctrl+C hủy lệnh, Ctrl+L xóa màn hình."
  },
  "Identify What a Command Name Means": {
    title_vi: "Tìm Hiểu Ý Nghĩa Tên Câu Lệnh",
    desc_vi: "Sử dụng whatis và type để tìm hiểu nguồn gốc và loại câu lệnh."
  },
  "Read Quick Help and Usage Syntax": {
    title_vi: "Đọc Trợ Giúp Nhanh và Cú Pháp Sử Dụng",
    desc_vi: "Sử dụng cờ --help để xem hướng dẫn sử dụng nhanh."
  },
  "Navigate a Manual Page": {
    title_vi: "Tra Cứu Sách Hướng Dẫn Chi Tiết (Man Page)",
    desc_vi: "Sử dụng lệnh man để đọc tài liệu chính thức đầy đủ của lệnh."
  },
  "Discover Commands by Topic": {
    title_vi: "Tìm Kiếm Lệnh Theo Chủ Đề với Apropos",
    desc_vi: "Dùng apropos hoặc man -k để tìm các câu lệnh liên quan đến từ khóa."
  },
  "Archive the Draft": {
    title_vi: "Lưu Trữ Tệp Bản Nháp",
    desc_vi: "Di chuyển và đổi tên tệp bản nháp vào thư mục lưu trữ theo yêu cầu."
  },
  "Inspect Identities and Create a Practice User": {
    title_vi: "Kiểm Tra Danh Tính và Tạo Người Dùng Mới",
    desc_vi: "Dùng id, whoami và useradd để tạo tài khoản người dùng thực hành."
  },
  "Manage Supplementary Groups": {
    title_vi: "Quản Lý Các Nhóm Bổ Sung",
    desc_vi: "Thêm người dùng vào nhóm phụ bằng usermod -aG."
  },
  "Control File Ownership and Permissions": {
    title_vi: "Kiểm Soát Quyền Sở Hữu và Quyền Hạn Tệp",
    desc_vi: "Phân quyền đọc/ghi/thực thi bằng chmod và chown."
  },
  "Inspect and Change an Account Lock": {
    title_vi: "Khóa và Mở Khóa Tài Khoản Người Dùng",
    desc_vi: "Sử dụng passwd -l và passwd -u để kiểm soát khóa tài khoản."
  },
  "Control Default Permissions with Umask": {
    title_vi: "Kiểm Soát Quyền Mặc Định Bằng Umask",
    desc_vi: "Tìm hiểu và thiết lập giá trị umask cho các tệp mới tạo."
  },
  "Protect a Shared Directory with the Sticky Bit": {
    title_vi: "Bảo Vệ Thư Mục Dùng Chung Bằng Sticky Bit",
    desc_vi: "Gán quyền sticky bit (+t) để ngăn chặn người dùng xóa tệp của nhau."
  },
  "Configure a Setgid Team Directory": {
    title_vi: "Cấu Hình Thư Mục Nhóm Làm Việc với Setgid",
    desc_vi: "Gán quyền setgid (g+s) để tệp mới tự động kế thừa nhóm của thư mục."
  },
  "Refresh Group Membership and Verify Inheritance": {
    title_vi: "Làm Mới Nhóm và Kiểm Tra Kế Thừa Quyền",
    desc_vi: "Xác thực quyền kế thừa và nhóm người dùng sau khi cấu hình."
  },
  "Onboard the User": {
    title_vi: "Tiếp Nhận và Cấp Tài Khoản Người Dùng",
    desc_vi: "Thực hiện quy trình tạo người dùng và gán nhóm hoàn chỉnh."
  },
  "Explore the Linux Directory Tree": {
    title_vi: "Khám Phá Cây Thư Mục Linux",
    desc_vi: "Tìm hiểu cấu trúc cây thư mục chuẩn FHS của Linux."
  },
  "Navigate with Absolute and Relative Paths": {
    title_vi: "Điều Hướng với Đường Dẫn Tuyệt Đối và Tương Đối",
    desc_vi: "Phân biệt đường dẫn bắt đầu bằng / và đường dẫn từ vị trí hiện tại."
  },
  "Create Directories and Write Files": {
    title_vi: "Tạo Thư Mục và Ghi Nội Dung Tệp",
    desc_vi: "Tạo cấu trúc thư mục với mkdir -p và ghi tệp với toán tử chuyển hướng."
  },
  "Copy, Move, Rename, and Remove Files": {
    title_vi: "Sao Chép, Di Chuyển, Đổi Tên và Xóa Tệp",
    desc_vi: "Vận dụng tổng hợp các lệnh cp, mv, rm."
  },
  "View, Update, and Find Files": {
    title_vi: "Xem, Cập Nhật và Tìm Kiếm Tệp",
    desc_vi: "Xem nội dung bằng cat/less, cập nhật bằng touch và tìm kiếm bằng find."
  },
  "Inspect File Types, Metadata, and Inodes": {
    title_vi: "Kiểm Tra Loại Tệp, Siêu Dữ Liệu và Inode",
    desc_vi: "Sử dụng lệnh file, stat và ls -i để phân tích inode."
  },
  "Work with Hard Links and Symbolic Links": {
    title_vi: "Làm Việc với Hard Link và Soft Link (Symlink)",
    desc_vi: "Tạo liên kết cứng bằng ln và liên kết mềm bằng ln -s."
  },
  "Compare Files and Directories with Diff": {
    title_vi: "So Sánh Tệp và Thư Mục Bằng Lệnh Diff",
    desc_vi: "So sánh sự khác biệt nội dung giữa hai phiên bản tệp."
  },
  "Protect the Active Configuration": {
    title_vi: "Bảo Vệ Tệp Cấu Hình Đang Hoạt Động",
    desc_vi: "Tìm tệp cấu hình và phân quyền bảo vệ an toàn."
  }
};

for (const [labId, titleVi] of Object.entries(LAB_TITLES_VI)) {
  const file = path.join(LABS_DIR, `${labId}.json`);
  if (!fs.existsSync(file)) continue;
  const lab = JSON.parse(fs.readFileSync(file, 'utf8'));
  lab.title_vi = titleVi;

  if (Array.isArray(lab.sections)) {
    for (const sec of lab.sections) {
      if (sec.kind === 'introduction') {
        sec.title_vi = 'Giới thiệu';
      } else if (sec.kind === 'summary') {
        sec.title_vi = 'Tổng kết';
      } else if (SECTION_TRANSLATIONS[sec.title]) {
        sec.title_vi = SECTION_TRANSLATIONS[sec.title].title_vi;
      }
    }
  }

  if (Array.isArray(lab.steps)) {
    for (const step of lab.steps) {
      if (SECTION_TRANSLATIONS[step.title]) {
        step.title_vi = SECTION_TRANSLATIONS[step.title].title_vi;
        step.task_vi = SECTION_TRANSLATIONS[step.title].desc_vi;
      }
    }
  }

  fs.writeFileSync(file, JSON.stringify(lab, null, 2), 'utf8');
  console.log(`Updated Vietnamese translations for: ${labId}`);
}

console.log('All 9 labs translated successfully!');

