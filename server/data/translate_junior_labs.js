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
  console.log(`Processing: ${fileName}`);
  console.log(`========================================`);

  const lab = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  // Process sections
  for (let i = 0; i < lab.sections.length; i++) {
    const sec = lab.sections[i];
    console.log(`[Section ${i + 1}/${lab.sections.length}] "${sec.title}"`);

    // Check if translation is needed (if content_vi is identical to English content or missing)
    if (!sec.content_vi || sec.content_vi === sec.content || sec.content_vi.length < 50) {
      console.log(`  -> Translating content (${sec.content.length} chars)...`);
      const vi = await callGeminiWithFallback(sysPromptContent, sec.content);
      sec.content_vi = vi;
      changed = true;
      console.log(`  -> Done (${vi.length} chars)`);
    } else {
      console.log(`  -> Content already translated (${sec.content_vi.length} chars)`);
    }

    if (!sec.title_vi || sec.title_vi === sec.title) {
      const viTitle = await callGeminiWithFallback(sysPromptShort, sec.title);
      sec.title_vi = viTitle;
      changed = true;
      console.log(`  -> Title: "${sec.title}" -> "${viTitle}"`);
    }
  }

  // Process steps (which are identical to tasks in sections)
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
    console.log(`Saved updated: ${filePath}`);
  }
}

async function run() {
  const targetFile = process.argv[2];
  const list = targetFile ? [targetFile] : JUNIOR_FILES;

  for (const f of list) {
    await processLab(f);
  }
  console.log("\nAll requested labs processed successfully!");
}

run().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});

