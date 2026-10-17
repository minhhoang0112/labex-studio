import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { callGeminiWithFallback, sysPromptContent, sysPromptShort } from './gemini_translate_util.js';

const LABS_DIR = 'server/data/labs';

// Danh sách các khóa học ưu tiên: Quản trị hệ thống, Shell Scripting, Docker, Git
const TARGET_COURSES = [
  'shell-for-beginners',
  'linux-for-noobs',
  'docker-for-beginners',
  'git-for-beginners',
  'linux-commands-practice-online'
];

function getTargetLabs() {
  const files = fs.readdirSync(LABS_DIR).filter(f => f.endsWith('.json'));
  const targets = [];
  for (const f of files) {
    try {
      const p = path.join(LABS_DIR, f);
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (TARGET_COURSES.includes(data.course_id) || TARGET_COURSES.includes(data.course_alias)) {
        targets.push({ file: f, path: p, data });
      }
    } catch (e) {}
  }
  return targets;
}

async function processLab(target) {
  const { file, path: filePath, data: lab } = target;
  let changed = false;

  for (let i = 0; i < (lab.sections || []).length; i++) {
    const sec = lab.sections[i];
    const needsTranslation = !sec.content_vi || 
      sec.content_vi === sec.content || 
      sec.content_vi.length < 40 ||
      (sec.content.length > 200 && sec.content_vi.length < 100);

    if (needsTranslation) {
      try {
        console.log(`[${new Date().toLocaleTimeString()}] [${file}] [Mục ${i + 1}/${lab.sections.length}] "${sec.title}" -> Dịch (${sec.content.length} chars)...`);
        const vi = await callGeminiWithFallback(sysPromptContent, sec.content);
        sec.content_vi = vi;
        changed = true;
      } catch (err) {
        console.error(`  Lỗi dịch mục ${sec.title}:`, err.message);
        await new Promise(r => setTimeout(r, 8000));
      }
    }

    if (!sec.title_vi || sec.title_vi === sec.title) {
      try {
        const viTitle = await callGeminiWithFallback(sysPromptShort, sec.title);
        sec.title_vi = viTitle;
        changed = true;
      } catch (e) {}
    }
  }

  // Sync steps
  if (Array.isArray(lab.steps)) {
    for (let j = 0; j < lab.steps.length; j++) {
      const step = lab.steps[j];
      const matchSec = (lab.sections || []).find(s => s.id === step.id);
      if (matchSec && matchSec.content_vi) {
        step.content_vi = matchSec.content_vi;
        step.title_vi = matchSec.title_vi;
        changed = true;
      }
      if (step.task && (!step.task_vi || step.task_vi === step.task)) {
        try {
          step.task_vi = await callGeminiWithFallback(sysPromptContent, step.task);
          changed = true;
        } catch (e) {}
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(lab, null, 2), 'utf8');
    console.log(`[${new Date().toLocaleTimeString()}] >>> [LƯU THÀNH CÔNG] ${file}`);
  }
}

async function runOvernightSentinel() {
  console.log(`========================================================================`);
  console.log(`[SENTINEL ENGINE] BẮT ĐẦU CHU KỲ TỰ ĐỘNG CHẠY XUYÊN ĐÊM ĐẾN 07:00 SÁNG`);
  console.log(`Khóa học mục tiêu: Linux System, Shell Scripting, Docker, Git`);
  console.log(`========================================================================\n`);

  let cycle = 1;
  while (true) {
    const now = new Date();
    const hour = now.getHours();

    console.log(`\n>>> [CHU KỲ ${cycle}] Bắt đầu quét lúc: ${now.toLocaleTimeString()} <<<`);
    const labs = getTargetLabs();

    for (let i = 0; i < labs.length; i++) {
      try {
        await processLab(labs[i]);
      } catch (e) {
        console.error(`Lỗi xử lý ${labs[i].file}:`, e.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }

    console.log(`\n[CHU KỲ ${cycle} HOÀN TẤT] Tạm nghỉ 1 phút trước chu kỳ kiểm toán và tối ưu tiếp theo...`);
    await new Promise(r => setTimeout(r, 60000));
    cycle++;
  }
}

runOvernightSentinel().catch(console.error);

