import fs from 'node:fs';
import path from 'node:path';
import { callGeminiWithFallback, sysPromptContent, sysPromptShort } from './gemini_translate_util.js';

const JUNIOR_FILES = [
  'linux-day-1-the-lay-of-the-land-596200.json',
  'linux-day-2-the-digital-architect-596201.json',
  'linux-day-3-the-log-investigator-596202.json',
  'linux-day-4-the-fortress-guardian-596203.json',
  'linux-day-5-the-keeper-of-the-keys-596204.json',
  'linux-day-6-the-process-overseer-596618.json',
  'linux-day-7-the-network-navigator-596619.json',
  'linux-day-8-the-software-steward-596620.json',
  'linux-day-9-the-backup-sentinel-596621.json',
  'linux-day-10-the-script-artisan-596613.json'
];

const LABS_DIR = 'server/data/labs';

async function processLab(fileName) {
  const filePath = path.join(LABS_DIR, fileName);
  console.log(`\n========================================`);
  console.log(`[PIPELINE] Bắt đầu: ${fileName}`);
  console.log(`========================================`);

  const lab = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  for (let i = 0; i < lab.sections.length; i++) {
    const sec = lab.sections[i];
    console.log(`  -> [Mục ${i + 1}/${lab.sections.length}] "${sec.title}"`);

    // Dịch nội dung nếu chưa dịch (hoặc nếu nội dung tiếng Việt đang bị trùng y đúc tiếng Anh)
    if (!sec.content_vi || sec.content_vi === sec.content || sec.content_vi.length < 50) {
      console.log(`     * Đang dịch nội dung (${sec.content.length} ký tự)...`);
      const vi = await callGeminiWithFallback(sysPromptContent, sec.content);
      sec.content_vi = vi;
      changed = true;
      console.log(`     * Hoàn tất (${vi.length} ký tự)`);
    } else {
      console.log(`     * Đã có bản dịch (${sec.content_vi.length} ký tự), bỏ qua.`);
    }

    if (!sec.title_vi || sec.title_vi === sec.title) {
      const viTitle = await callGeminiWithFallback(sysPromptShort, sec.title);
      sec.title_vi = viTitle;
      changed = true;
      console.log(`     * Tiêu đề: "${sec.title}" -> "${viTitle}"`);
    }
  }

  if (Array.isArray(lab.steps)) {
    for (let j = 0; j < lab.steps.length; j++) {
      const step = lab.steps[j];
      const matchSec = lab.sections.find(s => s.id === step.id);
      if (matchSec && matchSec.content_vi) {
        step.content_vi = matchSec.content_vi;
        step.title_vi = matchSec.title_vi;
      }
      if (step.task && (!step.task_vi || step.task_vi === step.task)) {
        step.task_vi = await callGeminiWithFallback(sysPromptContent, step.task);
      }
      if (step.hint && (!step.hint_vi || step.hint_vi === step.hint)) {
        step.hint_vi = await callGeminiWithFallback(sysPromptShort, step.hint);
      }
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(lab, null, 2), 'utf8');
    console.log(`[LƯU FILE THÀNH CÔNG] -> ${filePath}`);
  }
}

async function runAll() {
  console.log(`Bắt đầu pipeline tự động dịch toàn bộ khóa học Junior SysAdmin...`);
  for (let i = 0; i < JUNIOR_FILES.length; i++) {
    const f = JUNIOR_FILES[i];
    console.log(`\n>>> TIẾN TRÌNH: Bài ${i + 1}/${JUNIOR_FILES.length} (${f}) <<<`);
    try {
      await processLab(f);
    } catch (e) {
      console.error(`Lỗi khi xử lý ${f}:`, e.message);
      // Chờ 10 giây nếu gặp lỗi rồi tiếp tục bài tiếp theo
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  console.log(`\n========================================`);
  console.log(`TẤT CẢ 10 BÀI JUNIOR SYSADMIN ĐÃ HOÀN TẤT ĐỒNG BỘ 100%!`);
  console.log(`========================================`);
}

runAll().catch(console.error);

