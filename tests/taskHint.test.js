import test from 'node:test';
import assert from 'node:assert/strict';
import {taskHintPresentation} from '../client/src/lib/taskHint.js';
import {listLabs} from '../server/data/catalog.js';

test('ordinary hints remain unchanged; PowerShell code stays byte-for-byte intact', () => {
  const ordinary = 'Dùng mkdir để tạo thư mục, rồi kiểm tra bằng ls.';
  assert.deepEqual(taskHintPresentation(ordinary), {text:ordinary, script:''});
  const script = "$labId='sample'\n"+'Get-Service\n'.repeat(40);
  const body = '### Vì sao làm bước này?\nĐối chiếu trạng thái dịch vụ trước khi kết luận.\n\n### Thực hành\n```powershell\n'+script+'```';
  assert.deepEqual(taskHintPresentation(script, body), {
    text:'Đối chiếu trạng thái dịch vụ trước khi kết luận.', script,
  });
  assert.ok(!taskHintPresentation(script, '').text.includes('$labId'));
  assert.match(taskHintPresentation(script, '', false).text, /Review the requirements/);
});

test('foundation, networking and enterprise runnable hints have compact presentation without changing their scripts', () => {
  let checked = 0;
  for (const lab of listLabs().filter(l => l.id.startsWith('win-'))) {
    for (const step of lab.steps || []) {
      const hint = step.hint_vi || step.hint || '';
      if (hint.length <= 300 || !/^\s*\$\w+\s*=/.test(hint)) continue;
      const shown = taskHintPresentation(hint, step.content_vi || step.content);
      assert.equal(shown.script, hint, step.id);
      assert.ok(shown.text.length <= 600, step.id);
      assert.ok(!shown.text.includes('Assert-FndWorkspace'), step.id);
      checked++;
    }
  }
  assert.ok(checked >= 24, `Insufficient Windows course coverage: ${checked}`);
});
