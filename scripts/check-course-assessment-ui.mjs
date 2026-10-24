import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {readAssessmentBank} from '../server/services/courseAssessment.js';
const require = createRequire(import.meta.url);
let playwright;
try {playwright = require('playwright-core');} catch {
  const cache = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'), 'npm-cache/_npx');
  for (const folder of await fs.readdir(cache)) {try {playwright = require(path.join(cache, folder, 'node_modules/playwright-core')); break;} catch { /* next cached package */ }}
}
if (!playwright) throw new Error('Playwright is not available.');
const browser = await playwright.chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
const report = {passed: false, checks: [], azureActions: 0};
try {
  const page = await browser.newPage({viewport: {width: 1366, height: 900}});
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/cloud-vm/**', route => {report.azureActions++; return route.abort();});
  await page.goto('http://127.0.0.1:5000/courses/quick-start-with-linux');
  await page.getByRole('button', {name: 'Vào bài 11', exact: true}).click();
  await page.getByRole('button', {name: 'Bắt đầu bài 11', exact: true}).click();
  const questions = readAssessmentBank().groups.flatMap(g => g.questions);
  await page.getByRole('radio').first().waitFor();
  const chooseCorrect = async question => {
    const text = question.options.find(o => o.id === question.correct_option_id).text;
    const options = page.locator('fieldset label');
    for (let i = 0; i < await options.count(); i++) {
      const label = await options.nth(i).innerText();
      if (label.slice(3).trim() === text) {await options.nth(i).getByRole('radio').check(); return;}
    }
    throw new Error(`Correct choice was not rendered: ${question.id}`);
  };
  await chooseCorrect(questions[0]);
  await page.reload();
  await page.getByRole('radio', {checked: true}).waitFor();
  report.checks.push('Bài 11 accessible from course; first answer resumes after page reload.');
  for (let i = 0; i < questions.length; i++) {
    if (i > 0) {await page.getByRole('button', {name: 'Câu tiếp →', exact: true}).click();}
    await chooseCorrect(questions[i]);
  }
  await page.getByRole('button', {name: 'Nộp bài và chấm điểm', exact: true}).click();
  await page.getByRole('button', {name: 'Xác nhận nộp bài', exact: true}).click();
  await page.getByRole('heading', {name: '10/10 · 100%', exact: true}).waitFor();
  assert.equal(await page.getByRole('button', {name: 'Ôn lab', exact: true}).count(), 10);
  report.checks.push('All 80 choices submitted through UI: 100%, 10 lesson breakdowns.');
  await page.getByRole('checkbox', {name: 'Chỉ xem câu sai/bỏ trống'}).uncheck();
  assert.equal(await page.getByRole('article').count(), 80);
  assert.equal(await page.getByRole('button', {name: 'Vấn đáp với Labby về câu này', exact: true}).count(), 80);
  await page.reload();
  await page.getByRole('heading', {name: '10/10 · 100%', exact: true}).waitFor();
  report.checks.push('All explanations and voice review entry points visible; submitted score resumes.');
  await page.getByRole('button', {name: 'Làm lượt mới', exact: true}).click();
  await page.getByRole('radio').first().waitFor();
  assert.equal(await page.getByRole('radio', {checked: true}).count(), 0);
  await page.setViewportSize({width: 390, height: 844});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await fs.mkdir('.artifacts', {recursive: true});
  await page.screenshot({path: '.artifacts/course-assessment-mobile.png', fullPage: true});
  await page.getByRole('button', {name: 'Nộp bài và chấm điểm', exact: true}).click();
  await page.getByRole('button', {name: 'Xác nhận nộp bài', exact: true}).click();
  await page.getByRole('heading', {name: '0/10 · 0%', exact: true}).waitFor();
  assert.equal(await page.getByRole('article').count(), 80);
  report.checks.push('Fresh attempt has no answers; mobile fits; all unanswered score zero with 80 reviews.');
  assert.deepEqual(errors, []); assert.equal(report.azureActions, 0);
  report.passed = true;
} finally {
  await browser.close();
  await fs.mkdir('.artifacts', {recursive: true});
  await fs.writeFile('.artifacts/course-assessment-ui.json', JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
