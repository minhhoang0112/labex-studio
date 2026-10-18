import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { callGeminiWithFallback, sysPromptContent, sysPromptShort } from './gemini_translate_util.js';

const INDEX_FILE = 'server/data/reference/linux-course-index.json';
const LABS_DIR = 'server/data/labs';
const REF_DIR = 'server/data/reference/expanded-courses';

if (!fs.existsSync(REF_DIR)) {
  fs.mkdirSync(REF_DIR, { recursive: true });
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (res.status === 200) return await res.json();
    } catch (err) {}
    await new Promise(r => setTimeout(r, 2000));
  }
  return null;
}

// Danh sách các khóa mở rộng cần nạp 100% nguyên bản:
// 1. CompTIA Linux+ (33 bài)
// 2. Linux Security for DevSecOps (20 bài)
// 3. Linux Practice Challenges (156 bài)
const TARGET_COURSE_IDS = [
  'comptia-linux-plus-training-labs',
  'linux-security-for-devsecops',
  'linux-practice-challenges'
];

async function syncCourse(courseId) {
  const indexData = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const course = indexData.courses.find(c => c.id === courseId);
  if (!course) return;

  const labs = [];
  (course.stages || []).forEach(st => (st.labs || []).forEach(l => labs.push(l)));
  console.log(`\n========================================================================`);
  console.log(`[BẮT ĐẦU KHÓA] ${course.id}: ${labs.length} bài lab cần nạp & chuẩn hóa`);
  console.log(`========================================================================`);

  for (let i = 0; i < labs.length; i++) {
    const l = labs[i];
    const labFileName = `${l.alias}.json`;
    const labPath = path.join(LABS_DIR, labFileName);

    // Nếu bài đã có đủ nội dung tiếng Việt chi tiết rồi thì bỏ qua
    if (fs.existsSync(labPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(labPath, 'utf8'));
        if (existing.sections && existing.sections.length > 0 && existing.sections[0].content_vi && existing.sections[0].content_vi !== existing.sections[0].content) {
          console.log(`[${i + 1}/${labs.length}] ${l.alias} đã hoàn tất từ trước, bỏ qua.`);
          continue;
        }
      } catch (e) {}
    }

    console.log(`\n[${new Date().toLocaleTimeString()}] [${i + 1}/${labs.length}] Tải dữ liệu gốc: ${l.alias}...`);
    const apiUrl = `https://labex.io/api/v2/tutorials/${l.alias}`;
    const rawData = await fetchWithRetry(apiUrl);

    if (!rawData || !rawData.steps) {
      console.warn(`  -> Không lấy được dữ liệu từ API cho ${l.alias}, tiếp tục bài kế.`);
      continue;
    }

    console.log(`  -> Tải thành công (${rawData.steps.length} steps). Bắt đầu chuẩn hóa & dịch tiếng Việt...`);

    const sections = [];
    const steps = [];

    for (let sIdx = 0; sIdx < rawData.steps.length; sIdx++) {
      const step = rawData.steps[sIdx];
      const stepId = `${l.alias}-step-${sIdx}`;
      console.log(`     * Mục ${sIdx + 1}/${rawData.steps.length}: "${step.title}" (${step.text?.length || 0} ký tự)...`);

      let viText = step.text || "";
      let viTitle = step.title || "";

      try {
        if (step.text && step.text.length > 50) {
          viText = await callGeminiWithFallback(sysPromptContent, step.text);
        }
        if (step.title) {
          viTitle = await callGeminiWithFallback(sysPromptShort, step.title);
        }
      } catch (err) {
        console.error(`       Lỗi dịch: ${err.message}, giữ văn bản gốc.`);
      }

      const secObj = {
        id: stepId,
        title: step.title,
        title_vi: viTitle,
        content: step.text || "",
        content_vi: viText,
        layout: step.layout || "doc-workbench-split",
        need_verify: Boolean(step.need_verify)
      };
      sections.push(secObj);

      if (step.need_verify) {
        steps.push({
          id: stepId,
          title: step.title,
          title_vi: viTitle,
          content: step.text || "",
          content_vi: viText,
          task: "Thực hiện các thao tác theo hướng dẫn và kiểm tra kết quả.",
          task_vi: "Thực hiện các thao tác theo hướng dẫn và kiểm tra kết quả.",
          verification: {
            kind: "commands",
            user: "labex",
            groups: [["^\\s*.*$"]],
            allowed_status: [0]
          }
        });
      }
    }

    const fullLab = {
      id: l.alias,
      source_lab_id: l.source_lab_id,
      course_id: course.id,
      title: l.title,
      title_vi: sections[0]?.title_vi || l.title,
      difficulty: l.difficulty || "Beginner",
      estimated_time: `${l.estimated_minutes || 20} mins`,
      sections,
      steps
    };

    fs.writeFileSync(labPath, JSON.stringify(fullLab, null, 2), 'utf8');
    console.log(`  -> [ĐÃ LƯU THÀNH CÔNG] ${labPath}`);

    // Giữ an toàn nhịp độ API
    await new Promise(r => setTimeout(r, 1000));
  }
}

async function runContinuousAllNight() {
  console.log(`========================================================================`);
  console.log(`CỖ MÁY TỰ ĐỘNG CHUẨN HÓA TOÀN BỘ KHÓA HỌC SYSTEM ADMIN CHẠY XUYÊN ĐÊM`);
  console.log(`Thời gian bắt đầu: ${new Date().toLocaleTimeString()} - Dự kiến chạy đến 07:00 sáng`);
  console.log(`========================================================================\n`);

  while (true) {
    const now = new Date();
    const currentHour = now.getHours();

    // Duyệt qua từng khóa học mục tiêu
    for (const cId of TARGET_COURSE_IDS) {
      try {
        await syncCourse(cId);
      } catch (err) {
        console.error(`Lỗi khi xử lý khóa ${cId}:`, err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }

    console.log(`\n[${new Date().toLocaleTimeString()}] Hoàn tất một vòng quét. Tạm nghỉ 2 phút trước khi quét kiểm tra và bổ sung tiếp...`);
    await new Promise(r => setTimeout(r, 120000));
  }
}

runContinuousAllNight().catch(console.error);

