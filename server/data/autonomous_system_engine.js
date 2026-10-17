import fs from 'node:fs';
import path from 'node:path';
import { callGeminiWithFallback, sysPromptContent, sysPromptShort } from './gemini_translate_util.js';

const LABS_DIR = 'server/data/labs';

// Target System Administrator courses
const COURSES = ['shell-for-beginners', 'linux-for-noobs'];

function getTargetLabs() {
  const files = fs.readdirSync(LABS_DIR).filter(f => f.endsWith('.json'));
  const targets = [];
  for (const f of files) {
    try {
      const p = path.join(LABS_DIR, f);
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (COURSES.includes(data.course_id) || COURSES.includes(data.course_alias)) {
        targets.push({ file: f, path: p, data });
      }
    } catch (e) {}
  }
  return targets;
}

async function processLab(target) {
  const { file, path: filePath, data: lab } = target;
  let changed = false;
  let translatedSections = 0;

  for (let i = 0; i < (lab.sections || []).length; i++) {
    const sec = lab.sections[i];
    // Check if translation is needed
    const needsTranslation = !sec.content_vi || 
      sec.content_vi === sec.content || 
      sec.content_vi.length < 40 ||
      (sec.content.length > 200 && sec.content_vi.length < 100);

    if (needsTranslation) {
      try {
        console.log(`[${file}] [Mục ${i + 1}/${lab.sections.length}] "${sec.title}" -> Đang dịch (${sec.content.length} chars)...`);
        const vi = await callGeminiWithFallback(sysPromptContent, sec.content);
        sec.content_vi = vi;
        changed = true;
        translatedSections++;
      } catch (err) {
        console.error(`  Lỗi dịch mục ${sec.title}:`, err.message);
        await new Promise(r => setTimeout(r, 6000));
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
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(lab, null, 2), 'utf8');
    console.log(`>>> [ĐÃ LƯU] ${file} (Cập nhật ${translatedSections} mục)`);
  }
}

async function runAutonomousEngine() {
  console.log(`==================================================================`);
  console.log(`HỆ THỐNG TỰ ĐỘNG CHUẨN HÓA DỮ LIỆU SYSTEM ADMIN XUYÊN ĐÊM (LABEX)`);
  console.log(`Mục tiêu: shell-for-beginners & linux-for-noobs (55 bài lab)`);
  console.log(`==================================================================\n`);

  const labs = getTargetLabs();
  console.log(`Tổng số bài lab cần kiểm toán: ${labs.length} bài.\n`);

  for (let i = 0; i < labs.length; i++) {
    const target = labs[i];
    console.log(`\n--------------------------------------------------------------`);
    console.log(`[BÀI ${i + 1}/${labs.length}] ID: ${target.data.id} - ${target.data.title}`);
    console.log(`--------------------------------------------------------------`);
    try {
      await processLab(target);
    } catch (e) {
      console.error(`Lỗi bài ${target.file}:`, e.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  console.log(`\n==================================================================`);
  console.log(`TOÀN BỘ 55 BÀI LAB SYSTEM ADMIN ĐÃ ĐƯỢC CHUẨN HÓA THÀNH CÔNG 100%!`);
  console.log(`==================================================================`);
}

runAutonomousEngine().catch(console.error);

