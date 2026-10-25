import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { listLabs, loadLab } from '../server/data/catalog.js';
import { needsVietnameseTranslation, untranslatedProse } from '../scripts/lib/translation-quality.mjs';

test('translation retry detects copied prose even when a Vietnamese note was appended', () => {
  const en = '## Adding Main Sections\n\nLet us create directories for different types of content.';
  assert.equal(needsVietnameseTranslation(en, en+'\n\nHướng dẫn thực hành.'), true);
  assert.equal(needsVietnameseTranslation(en, ''), true);
  assert.equal(needsVietnameseTranslation('## Introduction', '## Introduction'), true);
  assert.equal(needsVietnameseTranslation(en, '## Tạo các khu vực chính\n\nHãy tạo thư mục cho từng loại nội dung.'), false);
});

test('translation audit excludes commands, outputs, inline identifiers and HTML attributes', () => {
  const en = '```bash\necho "This text must stay in English"\n```\n<div class="alert alert-warning" role="alert">\n`directory named the root`';
  const vi = 'Đọc kết quả sau:\n'+en;
  assert.deepEqual(untranslatedProse(en, vi), []);
});

test('all 41 command lessons and 263 sections expose translated prose to the reader', () => {
  const labs = listLabs().filter(lab => lab.course_id === 'linux-basic-commands-practice-online');
  assert.equal(labs.length, 41);
  assert.equal(labs.reduce((n, l) => n+l.sections.length, 0), 263);
  for (const lab of labs) {
    for (const section of lab.sections) {
      assert.ok(section.title_vi, `${lab.id}/${section.position}: missing title`);
      assert.equal(needsVietnameseTranslation(section.content, section.content_vi), false,
        `${lab.id}/${section.position}: untranslated English prose`);
    }
    for (const step of lab.steps) {
      assert.equal(step.content_vi, lab.sections.find(s => s.id === step.id).content_vi);
    }
  }
});

test('reviewed overrides remain bound to source hashes and match published VI', () => {
  const overrides = JSON.parse(fs.readFileSync(new URL('../server/data/translations/commands-reviewed.vi.json', import.meta.url), 'utf8'));
  for (const [id, lab] of Object.entries(overrides)) {
    const published = loadLab(id);
    const local = JSON.parse(fs.readFileSync(new URL(`../server/data/labs/${id}.json`, import.meta.url), 'utf8'));
    for (const record of lab.sections) {
      const source = local.sections.find(s => s.position === record.position);
      assert.equal(crypto.createHash('sha256').update(source.content).digest('hex'), record.source_content_sha256);
      assert.equal(published.sections.find(s => s.position === record.position).content_vi, record.content_vi);
    }
  }
});

test('repaired mkdir and log introduction preserve source commands and inline identifiers', () => {
  for (const [id, position] of [
    ['linux-linux-mkdir-command-directory-creating-209739', 2],
    ['linux-viewing-log-and-configuration-files-in-linux-387914', 0],
  ]) {
    const section = loadLab(id).sections.find(s => s.position === position);
    for (const pattern of [/```[\s\S]*?```/g, /`[^`\n]+`/g]) {
      assert.deepEqual(section.content_vi.match(pattern), section.content.match(pattern));
    }
  }
});
