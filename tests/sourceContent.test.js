import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLab } from '../server/data/catalog.js';
import { applySourceContent } from '../server/services/sourceContent.js';
import { sourceMarkdown } from '../client/src/lib/sourceMarkdown.js';

test('verified source explanations survive local generator output without changing task IDs or graders',()=>{
  const raw=JSON.parse(fs.readFileSync(new URL('../server/data/labs/linux-hello-bash-388809.json',import.meta.url),'utf8'));
  const changed=structuredClone(raw);
  changed.sections[3].content='A short generated replacement';
  const lab=applySourceContent(changed);
  assert.equal(lab.source_content.status,'verified-english');
  assert.ok(lab.sections[3].content.includes("echo 'Hello, World!'"));
  assert.ok(lab.sections[3].content.length>changed.sections[3].content.length);
  assert.deepEqual(lab.steps.map(s=>s.id),raw.steps.map(s=>s.id));
  assert.deepEqual(lab.steps.map(s=>s.verification),raw.steps.map(s=>s.verification));
  assert.deepEqual(lab.steps.map(s=>s.verification_by_provider),raw.steps.map(s=>s.verification_by_provider));
  assert.equal(lab.sections[3].translation_needs_review,true);
  assert.equal(changed.sections[3].content,'A short generated replacement');
});

test('all installed source snapshots are served exactly, including images and Markdown tables',()=>{
  const directory=new URL('../server/data/reference/source-lessons/',import.meta.url);
  const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',directory),'utf8'));
  assert.ok(Object.keys(manifest.lessons).length>=144);
  for(const item of Object.values(manifest.lessons)) {
    const expected=JSON.parse(fs.readFileSync(new URL(item.file,directory),'utf8'));
    const lab=loadLab(item.local_id);
    assert.equal(lab.source_content.status,'verified-english',item.local_id);
    assert.deepEqual(lab.sections.map(s=>s.content),expected.sections.map(s=>s.content),item.local_id);
  }
  assert.match(loadLab('linux-getting-started-with-linux-446315').sections[1].content,/!\[/);
  assert.match(loadLab('linux-data-stream-redirection-17995').sections[1].content,/\|.*Descriptor/);
});

test('source alert links are visible while fenced HTML examples remain unchanged',()=>{
  const example='```html\n<div class="alert">literal example</div>\n```';
  const result=sourceMarkdown('<div class="alert alert-warning"><p>Start with <a href="https://labex.io/learn/linux">Linux</a>.</p></div>\n'+example);
  assert.ok(result.includes('> Start with [Linux](https://labex.io/learn/linux).'));
  assert.ok(result.endsWith(example));
});
