// Read-only UI checks. Runtime status fixtures prevent opening learner shells.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let playwright;
try {playwright=require('playwright-core');} catch {
  const cache=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData/Local'),'npm-cache/_npx');
  for(const folder of await fs.readdir(cache)) {try {playwright=require(path.join(cache,folder,'node_modules/playwright-core'));break;}catch{}}
}
assert.ok(playwright);
const browser=await playwright.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const report={checks:[],errors:[],scope:'Real local source content and course APIs; Linux/cloud status mocked to avoid learner sessions.'};
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('**/api/environment',r=>r.fulfill({json:{available:false,capabilities:{}}}));
  await page.route('**/api/cloud-vm/status',r=>r.fulfill({json:{powerState:'unknown',controlConfigured:false}}));
  for(const width of [390,1440]) {
    await page.setViewportSize({width,height:1000});
    await page.goto('http://127.0.0.1:5000/paths/linux');
    const badge=page.getByText('Đã đối chiếu 33/33 bài',{exact:true});
    await badge.waitFor();
    await badge.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    assert.equal(await page.getByText('Thực hành 1 phần',{exact:true}).count(),0);
    report.checks.push({name:'Course content badges distinguish source verification from grading',width,passed:true});
  }
  await page.screenshot({path:'.artifacts/source-roadmap-2026-10-20.png'});
  await page.goto('http://127.0.0.1:5000/labs/linux-data-stream-redirection-17995');
  await page.getByRole('combobox').selectOption('1');
  const guide=page.getByTestId('guide-pane');
  await guide.getByRole('button',{name:'Bản gốc EN',exact:true}).click();
  await guide.locator('table').waitFor();
  assert.match(await guide.locator('table').innerText(),/Descriptor/);
  report.checks.push({name:'Original Markdown table is restored and rendered as a table',passed:true});
  await page.screenshot({path:'.artifacts/source-original-table-2026-10-20.png'});
  await page.goto('http://127.0.0.1:5000/labs/linux-hello-bash-388809');
  await page.getByRole('combobox').selectOption('3');
  await guide.getByRole('button',{name:'Bản gốc EN',exact:true}).click();
  assert.match(await guide.innerText(),/Let's break down what these lines mean/);
  await guide.getByRole('button',{name:'Bản dịch VI',exact:true}).click();
  assert.equal(await guide.getByRole('button',{name:'Bản dịch VI',exact:true}).getAttribute('aria-pressed'),'true');
  await guide.getByRole('button',{name:'Bản gốc EN',exact:true}).click();
  report.checks.push({name:'Full Shell explanation and original/translation switch work',passed:true});
  await page.goto('http://127.0.0.1:5000/labs/linux-getting-started-with-linux-446315');
  await page.getByRole('combobox').selectOption('1');
  await guide.getByRole('button',{name:'Bản gốc EN',exact:true}).click();
  assert.ok(await guide.locator('img').count()>0);
  await guide.locator('img').first().evaluate(image=>image.decode());
  report.checks.push({name:'Original tutorial images are retained in the guide',passed:true});
  await page.goto('http://127.0.0.1:5000/labs/linux-audit-listening-services-662167');
  await guide.getByRole('button',{name:'Bản gốc EN',exact:true}).waitFor();
  assert.equal(await guide.getByRole('button',{name:'Bản gốc EN',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await guide.getByRole('button',{name:'Bản dịch VI',exact:true}).count(),0);
  report.checks.push({name:'A newly imported original-only lesson is labeled English, never a translation',passed:true});
  assert.deepEqual(report.errors,[]);
  report.complete=true;
  console.log(JSON.stringify(report,null,2));
} finally {
  await fs.writeFile('.artifacts/source-content-ui-check.json',JSON.stringify(report,null,2));
  await browser.close();
}
