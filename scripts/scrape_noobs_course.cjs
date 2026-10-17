const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const COURSE_INDEX_PATH = path.resolve('server/data/reference/linux-course-index.json');
const LABS_DIR = path.resolve('server/data/labs');

const LAB_TITLES_VI = {
  // Stage 1
  "linux-getting-started-with-linux-446315": "Bắt Đầu Với Terminal Linux",
  "linux-create-personalized-terminal-greeting-446322": "Lưu Banner Lời Chào Terminal",
  "linux-basic-file-operations-in-linux-18001": "Thao Tác Tệp Cơ Bản Trong Linux",
  "linux-get-help-on-linux-commands-18000": "Tra Cứu Trợ Giúp Câu Lệnh Linux",
  "linux-delete-and-move-files-7777": "Lưu Trữ Tệp Bản Nháp",
  "linux-linux-user-group-and-file-permissions-18002": "Nhóm Người Dùng và Quyền Hạn Tệp Linux",
  "linux-add-new-user-and-group-17987": "Tạo Người Dùng Thực Hành Mới",
  "linux-file-and-directory-operations-17997": "Thao Tác Quản Lý Tệp và Thư Mục Nâng Cao",
  "linux-find-a-file-17993": "Tìm Kiếm và Bảo Vệ Tệp Cấu Hình",

  // Stage 2
  "linux-environment-variables-in-linux-385274": "Biến Môi Trường Trong Linux",
  "linux-configure-linux-environment-variables-437861": "Cấu Hình Biến Môi Trường Linux",
  "linux-file-packaging-and-compression-385413": "Đóng Gói và Nén Tệp Tin",
  "linux-backup-system-log-17989": "Sao Lưu Bản Ghi Log Hệ Thống",
  "linux-file-system-and-disk-management-17999": "Quản Lý Hệ Thống Tệp và Đĩa Cứng",
  "linux-analyzing-disk-usage-7775": "Phân Tích Dung Lượng Bộ Nhớ Đĩa",

  // Stage 3
  "linux-sequence-control-and-pipeline-17994": "Kiểm Soát Tuần Tự và Đường Ống Lệnh",
  "linux-space-battle-data-pipeline-385343": "Xây Dựng Pipeline Dữ Liệu Space Battle",
  "linux-simple-text-processing-18004": "Xử Lý Văn Bản Cơ Bản Trong Linux",
  "linux-analyzing-path-directories-385344": "Phân Tích Thư Mục Biến PATH",
  "linux-text-processing-and-regular-expressions-18003": "Xử Lý Văn Bản và Biểu Thức Chính Quy (Regex)",
  "linux-extracting-mails-and-numbers-17991": "Trích Xuất Email và Số Điện Thoại",
  "linux-data-stream-redirection-17995": "Chuyển Hướng Dòng Dữ Liệu (Redirection)",
  "linux-analyze-historical-commands-17988": "Phân Tích Lịch Sử Câu Lệnh",

  // Stage 4
  "linux-system-information-and-process-management-725419": "Thông Tin Hệ Thống và Quản Lý Tiến Trình",
  "linux-stop-a-runaway-process-725412": "Dừng Tiến Trình Bị Treo Hoặc Quá Tải",
  "linux-software-installation-on-linux-18005": "Cài Đặt Phần Mềm Trên Linux",
  "linux-installing-and-removing-packages-385380": "Cài Đặt và Gỡ Bỏ Gói Phần Mềm",
  "linux-managing-services-and-system-logs-725415": "Quản Lý Dịch Vụ Hệ Thống và System Logs",
  "linux-recover-a-failed-service-725413": "Khắc Phục Dịch Vụ Bị Lỗi",
  "linux-linux-networking-and-firewall-basics-725414": "Mạng Căn Bản và Tường Lửa Trong Linux",
  "linux-correct-a-service-bind-address-725411": "Sửa Địa Chỉ Bind Của Dịch Vụ Mạng",
  "linux-remote-access-and-file-transfer-with-ssh-725416": "Truy Cập Từ Xa và Truyền Tệp Bằng SSH",
  "linux-upload-a-configuration-with-scp-725408": "Tải Tệp Cấu Hình Lên Máy Chủ Qua SCP",

  // Stage 5
  "shell-shell-scripting-fundamentals-725418": "Nền Tảng Lập Trình Shell Script",
  "shell-write-a-log-error-summary-script-725410": "Viết Script Tổng Hợp Lỗi Từ File Log",
  "linux-scheduled-backup-and-recovery-725417": "Lập Lịch Sao Lưu và Khôi Phục Hệ Thống",
  "linux-restore-a-configuration-from-backup-725409": "Khôi Phục Cấu Hình Từ Bản Sao Lưu"
};

async function getWs() {
  const r = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await r.json();
  const page = tabs.find(t => t.type === 'page');
  return new WebSocket(page.webSocketDebuggerUrl);
}

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === id) {
        ws.off('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const EXTRACT_SECTIONS_SCRIPT = `
(() => {
  function htmlToMd(el) {
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent;
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const tag = node.tagName.toLowerCase();
      if (['button', 'svg', 'style', 'script'].includes(tag)) return '';

      if (tag === 'pre') {
        const code = node.querySelector('code');
        const text = code ? code.textContent.trim() : node.textContent.trim();
        const lang = (code?.className?.match(/language-([\\w-]+)/) || [])[1] || 'bash';
        return '\\n\\n\`\`\`' + lang + '\\n' + text + '\\n\`\`\`\\n\\n';
      }

      if (tag === 'code') {
        if (node.parentElement?.tagName.toLowerCase() === 'pre') return node.textContent;
        return '\`' + node.textContent + '\`';
      }

      if (['strong', 'b'].includes(tag)) {
        return '**' + Array.from(node.childNodes).map(walk).join('') + '**';
      }

      if (['em', 'i'].includes(tag)) {
        return '*' + Array.from(node.childNodes).map(walk).join('') + '*';
      }

      if (tag === 'p') {
        return '\\n\\n' + Array.from(node.childNodes).map(walk).join('').trim() + '\\n\\n';
      }

      if (tag === 'h3') {
        return '\\n\\n### ' + Array.from(node.childNodes).map(walk).join('').trim() + '\\n\\n';
      }

      if (tag === 'h4') {
        return '\\n\\n#### ' + Array.from(node.childNodes).map(walk).join('').trim() + '\\n\\n';
      }

      if (tag === 'blockquote') {
        const inner = Array.from(node.childNodes).map(walk).join('').trim();
        return '\\n\\n> ' + inner.split('\\n').join('\\n> ') + '\\n\\n';
      }

      if (tag === 'ul') {
        return '\\n' + Array.from(node.children).map(li => '- ' + walk(li).trim()).join('\\n') + '\\n';
      }

      if (tag === 'ol') {
        let idx = 1;
        return '\\n' + Array.from(node.children).map(li => (idx++) + '. ' + walk(li).trim()).join('\\n') + '\\n';
      }

      if (tag === 'li') {
        return Array.from(node.childNodes).map(walk).join('').trim();
      }

      return Array.from(node.childNodes).map(walk).join('');
    }

    let md = walk(el);
    return md.replace(/\\n{3,}/g, '\\n\\n').trim();
  }

  const article = document.querySelector('article') || document.querySelector('main') || document.body;
  const headings = Array.from(article.querySelectorAll('h2'));
  const result = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const title = h.innerText.trim();
    if (title.toLowerCase().includes('other linux tutorials') || title.toLowerCase().includes('explore more')) continue;
    
    let node = h.nextElementSibling;
    const container = document.createElement('div');
    const commands = [];
    while (node && node.tagName !== 'H2') {
      container.appendChild(node.cloneNode(true));
      const codeBlocks = node.querySelectorAll ? node.querySelectorAll('pre code') : [];
      codeBlocks.forEach(cb => {
        const cmd = cb.textContent.trim();
        if (cmd && !cmd.includes('\\n') && cmd.length < 80) commands.push(cmd);
      });
      node = node.nextElementSibling;
    }
    result.push({
      title,
      markdown: htmlToMd(container),
      commands
    });
  }
  return result;
})()
`;

async function scrapeLab(ws, labInfo) {
  const outPath = path.join(LABS_DIR, `${labInfo.alias}.json`);
  if (fs.existsSync(outPath)) {
    console.log(`[SKIP] Already exists: ${labInfo.alias}`);
    return JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  console.log(`\n--------------------------------------------------`);
  console.log(`Scraping: ${labInfo.title} (${labInfo.alias})`);
  console.log(`URL: ${labInfo.source_url}`);

  await sendCommand(ws, 'Page.navigate', { url: labInfo.source_url });
  await new Promise(r => setTimeout(r, 4000));

  let evalRes = await sendCommand(ws, 'Runtime.evaluate', {
    expression: EXTRACT_SECTIONS_SCRIPT,
    returnByValue: true
  });

  let scrapedSections = evalRes?.result?.value || [];
  if (!scrapedSections.length) {
    console.log(`[RETRY] Waiting 3 more seconds for ${labInfo.alias}...`);
    await new Promise(r => setTimeout(r, 3000));
    evalRes = await sendCommand(ws, 'Runtime.evaluate', {
      expression: EXTRACT_SECTIONS_SCRIPT,
      returnByValue: true
    });
    scrapedSections = evalRes?.result?.value || [];
  }

  if (!scrapedSections.length) {
    console.log(`[WARN] No sections found for ${labInfo.alias}`);
    return null;
  }

  console.log(`Found ${scrapedSections.length} sections:`, scrapedSections.map(s => s.title));

  const sections = [];
  const steps = [];

  scrapedSections.forEach((s, idx) => {
    const isIntro = s.title.toLowerCase().includes('introduction') || idx === 0;
    const isSummary = s.title.toLowerCase().includes('summary') || idx === scrapedSections.length - 1;
    const kind = isIntro ? 'introduction' : isSummary ? 'summary' : 'task';
    const sectionId = `section-${idx}`;

    let title_vi = s.title;
    if (kind === 'introduction') title_vi = 'Giới thiệu';
    else if (kind === 'summary') title_vi = 'Tổng kết bài học';

    const secObj = {
      id: sectionId,
      title: s.title,
      position: idx,
      kind,
      layout: isIntro || isSummary ? 'doc-fullscreen' : 'doc-workbench-split',
      need_verify: kind === 'task',
      has_solution: false,
      content: s.markdown,
      title_vi
    };

    if (kind === 'task') {
      const cmdList = s.commands.filter(c => !c.startsWith('cat ') && !c.startsWith('ls ') && !c.startsWith('pwd'));
      const targetCmd = cmdList[0] || s.commands[0] || '';
      
      // A displayed code block may be output, a setup command, or one of many
      // requirements. Importing text never proves that it is a complete grader.
      const verification = { kind: 'unsupported', reason: 'Nội dung đã nhập; cần biên soạn và kiểm thử bộ kiểm tra thực hành.' };

      const stepObj = {
        ...secObj,
        task: `Thực hiện hướng dẫn: ${s.title}`,
        hint: targetCmd ? `Chạy lệnh: ${targetCmd}` : 'Đọc hướng dẫn và thực hành trên terminal.',
        verification
      };
      steps.push(stepObj);
      secObj.task = stepObj.task;
      secObj.hint = stepObj.hint;
      secObj.verification = stepObj.verification;
    }

    sections.push(secObj);
  });

  const labFileObj = {
    id: labInfo.alias,
    course_id: 'linux-for-noobs',
    order: labInfo.order,
    title: labInfo.title,
    title_vi: LAB_TITLES_VI[labInfo.alias] || labInfo.title,
    type: labInfo.type || 'lab',
    difficulty: labInfo.difficulty || 'Beginner',
    estimated_time: `${labInfo.estimated_minutes || 25} mins`,
    overview: sections[0]?.content?.slice(0, 200)?.replace(/[#*`\n]/g, ' ')?.trim() || labInfo.title,
    source_url: labInfo.source_url,
    source_lab_id: labInfo.source_lab_id,
    sections,
    steps
  };

  fs.writeFileSync(outPath, JSON.stringify(labFileObj, null, 2), 'utf8');
  console.log(`[SAVED] Created lab file: ${outPath} with ${sections.length} sections and ${steps.length} tasks`);
  return labFileObj;
}

async function main() {
  const ws = await getWs();
  await new Promise(r => ws.on('open', r));

  const indexData = JSON.parse(fs.readFileSync(COURSE_INDEX_PATH, 'utf8'));
  const noobsCourse = indexData.courses.find(c => c.id === 'linux-for-noobs');

  const allLabs = noobsCourse.stages.flatMap(s => s.labs);
  console.log(`Starting to scrape Linux for Noobs: total ${allLabs.length} labs across ${noobsCourse.stages.length} stages`);

  const createdLabs = [];
  for (const lab of allLabs) {
    try {
      const res = await scrapeLab(ws, lab);
      if (res) createdLabs.push(res);
    } catch (e) {
      console.error(`Error scraping ${lab.alias}:`, e);
    }
  }

  console.log(`\nCompleted: ${createdLabs.length}/${allLabs.length} labs processed!`);
  ws.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
