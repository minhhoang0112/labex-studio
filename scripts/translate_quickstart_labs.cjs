const fs = require('fs');
const path = require('path');

const LABS_DIR = path.resolve('server/data/labs');

const LAB_TRANSLATIONS = {
  "linux-your-first-linux-lab": {
    title_vi: "Bài Thực Hành Linux Đầu Tiên Của Bạn",
    sections: {
      "source-270253-section-0": {
        title_vi: "Giới thiệu",
        content_vi: "Chào mừng bạn đến với Linux! Bài lab nhập môn này sẽ giúp bạn làm quen với giao diện dòng lệnh (terminal), chạy câu lệnh đầu tiên với echo, kiểm tra danh tính người dùng với whoami và xem thông tin nhóm hệ thống với id."
      },
      "source-270253-section-1": {
        title_vi: "In Lời Chào Hello LabEx",
        content_vi: "### In văn bản ra màn hình với echo\n\nLệnh \`echo\` dùng để in một chuỗi văn bản ra cửa sổ terminal. Lệnh này xuất ra chính xác những gì bạn truyền vào.\n\nNhập lệnh sau vào terminal và nhấn **Enter**:\n\n```bash\necho \"Hello LabEx\"\n```\n\n> **Lưu ý:** Lệnh trong Linux phân biệt chữ hoa và chữ thường (\`echo\` viết thường, không viết \`Echo\`). Giữa lệnh và chuỗi ký tự cần có khoảng trắng."
      },
      "source-270253-section-2": {
        title_vi: "Hiển Thị Người Dùng Hiện Tại",
        content_vi: "### Xác định tài khoản với whoami\n\nKhi làm việc trên Linux, bạn thường cần biết mình đang đăng nhập dưới tài khoản nào. Lệnh \`whoami\` (Who am I?) sẽ in ra tên người dùng của phiên làm việc hiện tại.\n\nNhập lệnh sau vào terminal và nhấn **Enter**:\n\n```bash\nwhoami\n```\n\nKết quả hiển thị tên tài khoản đang chạy là \`labex\`."
      },
      "source-270253-section-3": {
        title_vi: "Hiển Thị Thông Tin Người Dùng và Nhóm",
        content_vi: "### Xem chi tiết danh tính với id\n\nTrong khi \`whoami\` chỉ in tên tài khoản, lệnh \`id\` cung cấp thông tin chi tiết hơn gồm:\n- \`uid\`: Mã định danh người dùng (User ID)\n- \`gid\`: Mã nhóm chính (Group ID)\n- \`groups\`: Các nhóm mà người dùng thuộc về\n\nThực thi câu lệnh:\n\n```bash\nid\n```\n\nBạn cũng có thể xem thông tin của tài khoản quản trị tối cao root:\n\n```bash\nid root\n```"
      },
      "source-270253-section-4": {
        title_vi: "Trích Xuất Riêng Tên Người Dùng",
        content_vi: "### Lấy riêng tên tài khoản với id -un\n\nTùy chọn \`-u\` (user) và \`-n\` (name) kết hợp thành \`id -un\`, giúp trích xuất riêng tên người dùng tương ứng với UID hiện tại mà không kèm theo các thông số UID/GID.\n\n```bash\nid -un\n```"
      },
      "source-270253-section-5": {
        title_vi: "Học Qua Thực Hành (Learn By Doing)",
        content_vi: "### Phương pháp học thông qua thực hành\n\nTriết lý cốt lõi của LabEx là **Học bằng cách thực hành** (Learn by Doing). Thay vì chỉ đọc tài liệu thụ động, bạn gõ lệnh trực tiếp trên terminal Linux thật, quan sát hệ thống phản hồi và để bộ kiểm tra tự động thẩm định kết quả.\n\nSau khi đã nắm rõ tinh thần học tập, hãy bấm nút **Tiếp tục** bên dưới để chuyển sang phần tổng kết bài học."
      },
      "source-270253-section-6": {
        title_vi: "Tổng kết",
        content_vi: "Chúc mừng bạn đã hoàn thành bài thực hành Linux đầu tiên! Bạn đã thành thạo các câu lệnh: \`echo\` (in văn bản), \`whoami\` (xem tài khoản hiện tại), \`id\` (xem UID, GID, nhóm) và \`id -un\` (trích xuất tên người dùng)."
      }
    }
  },
  "linux-files-and-directories": {
    title_vi: "Tệp và Thư mục trong Linux",
    sections: {
      "source-270246-section-0": {
        title_vi: "Giới thiệu",
        content_vi: "Bài thực hành này giúp bạn làm quen với các thao tác cốt lõi trên tệp và thư mục: sao chép (cp), đổi tên/di chuyển (mv) và xóa (rm) một cách an toàn và chuẩn xác."
      },
      "source-270246-section-1": {
        title_vi: "Sao Chép Tệp và Thư Mục",
        content_vi: "### Sử dụng lệnh cp để sao chép\n\nLệnh \`cp\` (copy) dùng để tạo bản sao của tệp hoặc thư mục.\n\n1. Sao chép tệp đơn lẻ:\n```bash\ncp file1.txt file1_copy.txt\n```\n\n2. Sao chép vào thư mục con:\n```bash\ncp file2.txt testdir/\n```\n\n3. Sao chép toàn bộ thư mục bằng cờ đệ quy \`-r\`:\n```bash\ncp -r testdir testdir_copy\n```\n\n4. Kiểm tra đối chiếu kết quả bằng lệnh \`ls\`:\n```bash\nls\nls testdir\nls testdir_copy\n```"
      },
      "source-270246-section-2": {
        title_vi: "Đổi Tên và Di Chuyển",
        content_vi: "### Sử dụng lệnh mv để đổi tên và di chuyển\n\nLệnh \`mv\` (move) có thể vừa đổi tên vừa di chuyển tệp:\n\n1. Đổi tên tệp:\n```bash\nmv file1.txt newname.txt\n```\n\n2. Di chuyển tệp vào thư mục:\n```bash\nmv newname.txt testdir/\n```\n\n3. Đổi tên thư mục:\n```bash\nmv testdir_copy new_testdir\n```\n\n4. Vừa di chuyển vừa đổi tên:\n```bash\nmv testdir/newname.txt ./original_file1.txt\n```"
      },
      "source-270246-section-3": {
        title_vi: "Xóa Tệp và Thư Mục",
        content_vi: "### Sử dụng lệnh rm để dọn dẹp\n\n1. Xóa tệp đơn lẻ:\n```bash\nrm original_file1.txt\n```\n\n2. Xóa tương tác an toàn với cờ \`-i\`:\n```bash\nrm -i file2.txt\n```\n\n3. Xóa thư mục rỗng với \`rmdir\` hoặc đệ quy với \`rm -r\`:\n```bash\nrm -r testdir\n```\n\n> ⚠️ Hãy luôn cẩn thận khi sử dụng lệnh \`rm\` vì trong Linux không có thùng rác!"
      },
      "source-270246-section-4": {
        title_vi: "Tổng kết",
        content_vi: "Bạn đã hoàn thành bài thực hành quản lý tệp và thư mục với các câu lệnh \`cp\`, \`mv\`, \`rm\` và \`rmdir\`."
      }
    }
  }
};

for (const [labId, trans] of Object.entries(LAB_TRANSLATIONS)) {
  const file = path.join(LABS_DIR, `${labId}.json`);
  if (!fs.existsSync(file)) continue;
  const lab = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (trans.title_vi) lab.title_vi = trans.title_vi;

  if (Array.isArray(lab.sections)) {
    for (const sec of lab.sections) {
      if (trans.sections?.[sec.id]) {
        sec.title_vi = trans.sections[sec.id].title_vi;
        sec.content_vi = trans.sections[sec.id].content_vi;
      }
    }
  }

  if (Array.isArray(lab.steps)) {
    for (const step of lab.steps) {
      if (trans.sections?.[step.id]) {
        step.title_vi = trans.sections[step.id].title_vi;
        step.content_vi = trans.sections[step.id].content_vi;
      }
    }
  }

  fs.writeFileSync(file, JSON.stringify(lab, null, 2), 'utf8');
  console.log(`Updated translations for ${labId}`);
}

