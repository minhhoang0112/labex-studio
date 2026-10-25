import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { needsVietnameseTranslation } from '../../scripts/lib/translation-quality.mjs';
import { callGeminiWithFallback, sysPromptContent, sysPromptShort } from './gemini_translate_util.js';

const REF_DIR = 'server/data/reference/commands-course';
const LABS_DIR = 'server/data/labs';
const REVIEWED_FILE = 'server/data/translations/commands-reviewed.vi.json';

async function updateLabWithAuthentic(refFileName) {
  const refPath = path.join(REF_DIR, refFileName);
  const labPath = path.join(LABS_DIR, refFileName);

  if (!fs.existsSync(labPath)) {
    console.warn(`Lab file ${labPath} không tồn tại trong server/data/labs, bỏ qua.`);
    return;
  }

  const refData = JSON.parse(fs.readFileSync(refPath, 'utf8'));
  const labData = JSON.parse(fs.readFileSync(labPath, 'utf8'));
  const reviewed = fs.existsSync(REVIEWED_FILE)
    ? JSON.parse(fs.readFileSync(REVIEWED_FILE, 'utf8'))[labData.id]?.sections || [] : [];

  console.log(`\n======================================================`);
  console.log(`Đồng bộ 100% nguyên bản: ${refFileName}`);
  console.log(`Số steps: ${refData.steps.length}`);
  console.log(`======================================================`);

  let changed = false;

  for (let i = 0; i < refData.steps.length; i++) {
    const rStep = refData.steps[i];
    const sec = labData.sections[i];

    if (!sec) continue;

    const sourceChanged = sec.content !== rStep.text;
    if (sourceChanged) {
      console.log(`[Mục ${i + 1}/${refData.steps.length}] "${rStep.title}"`);
      console.log(`  -> Cập nhật content gốc (từ ${sec.content.length} ký tự -> ${rStep.text.length} ký tự)`);
      sec.content = rStep.text;
      sec.title = rStep.title;
      changed = true;
    }

    const override = reviewed.find(item => item.position === sec.position &&
      item.source_content_sha256 === crypto.createHash('sha256').update(sec.content).digest('hex'));
    if (override) {
      for (const [key, value] of Object.entries(override)) {
        if (key.endsWith('_vi') && typeof value === 'string' && sec[key] !== value) {
          sec[key] = value;
          changed = true;
        }
      }
    } else if (sourceChanged || needsVietnameseTranslation(sec.content, sec.content_vi)) {

      // Translate authentic text to Vietnamese
      console.log(`  -> Đang dịch tiếng Việt chuẩn 100% qua Gemini...`);
      try {
        const vi = await callGeminiWithFallback(sysPromptContent, rStep.text);
        if (needsVietnameseTranslation(rStep.text, vi)) throw new Error('Bản dịch vẫn chứa đoạn tiếng Anh chưa dịch.');
        sec.content_vi = vi;
        changed = true;
        console.log(`  -> Dịch xong (${vi.length} ký tự)`);
      } catch (err) {
        console.error(`  Lỗi dịch: ${err.message}; giữ dữ liệu hiện có để thử dịch lại lần sau.`);
      }
    }

    if (!sec.title_vi || sec.title_vi === sec.title) {
        try {
          sec.title_vi = await callGeminiWithFallback(sysPromptShort, rStep.title);
          changed = true;
        } catch (e) {}
    }
  }

  // Đồng bộ sang mảng steps
  if (Array.isArray(labData.steps)) {
    for (let j = 0; j < labData.steps.length; j++) {
      const step = labData.steps[j];
      const matchSec = labData.sections.find(s => s.id === step.id);
      if (matchSec) {
        step.content = matchSec.content;
        step.content_vi = matchSec.content_vi;
        step.title = matchSec.title;
        step.title_vi = matchSec.title_vi;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(labPath, JSON.stringify(labData, null, 2), 'utf8');
    console.log(`[ĐÃ LƯU THÀNH CÔNG 100% NGUYÊN BẢN] -> ${labPath}`);
  }
}

async function run() {
  const target = process.argv[2];
  if (target) {
    await updateLabWithAuthentic(target);
  } else {
    const files = fs.readdirSync(REF_DIR).filter(f => f.endsWith('.json'));
    for (const f of files) {
      await updateLabWithAuthentic(f);
    }
  }
}

run().catch(console.error);

