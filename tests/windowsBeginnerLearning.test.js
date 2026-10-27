import test from 'node:test';
import assert from 'node:assert/strict';
import {listLabs} from '../server/data/catalog.js';

test('both Windows beginner courses teach 24 tasks through short commands before separate evidence scripts', () => {
  const labs = listLabs().filter(l => ['windows-11-fundamentals','windows-networking-fundamentals'].includes(l.course_id));
  assert.equal(labs.length,12);
  assert.equal(labs.flatMap(l=>l.steps).length,24);
  for (const lab of labs) for (const step of lab.steps) {
    assert.equal(step.learning_flow,'core-commands-first',step.id);
    assert.ok(step.content.includes('Lệnh có nghĩa gì'),step.id);
    assert.ok(step.content.includes('Đọc kết quả'),step.id);
    assert.ok(step.content.includes('không chấm tự động'),step.id);
    assert.ok(step.content.includes('PowerShell của web'),step.id);
    assert.ok(step.content.includes('không tự chứng nhận'),step.id);
    assert.ok(!step.content.includes(step.hint),`${step.id}: collector flattened into primary guide`);
    const blocks=[...step.content.matchAll(/```powershell\n([\s\S]*?)```/g)].map(m=>m[1]);
    assert.ok(blocks.length>=2,step.id);
    assert.ok(blocks.every(code=>code.trim().split('\n').length<=3),step.id);
    assert.ok(blocks.every(code=>!code.includes('Assert-FndWorkspace')&&!code.includes('[pscustomobject]@{Schema')),step.id);
    assert.equal(lab.sections.find(s=>s.id===step.id).content,step.content);
  }
});
