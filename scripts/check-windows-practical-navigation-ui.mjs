// Uses the real course API and built UI, with all VM/AI calls isolated.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import courses from '../server/routes/courses.js';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright-core'); } catch {
  for (const dir of await fs.readdir(path.join(process.env.LOCALAPPDATA, 'npm-cache/_npx'))) {
    try { pw = require(path.join(process.env.LOCALAPPDATA, 'npm-cache/_npx', dir, 'node_modules/playwright-core')); break; } catch {}
  }
}
assert.ok(pw, 'Existing Playwright installation required');
const app = express(); app.use('/api', courses);
let mutations = 0;
app.use('/api', (req, res) => {
  if (req.method !== 'GET') mutations++;
  res.json({ available: false, configured: false, controlConfigured: false });
});
app.use(express.static('client/dist'));
app.get(/.*/, (_, res) => res.sendFile(path.resolve('client/dist/index.html')));
const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await pw.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/paths/windows');
  const card = page.locator('[data-course-id="windows-11-it-support-troubleshooting"]');
  await card.scrollIntoViewIfNeeded();
  const roadmapScroll = await page.evaluate(() => window.scrollY);
  assert.ok(roadmapScroll > 200);
  await card.click();
  await page.getByRole('heading', { name: 'Bắt đầu bằng ticket thực hành GUI', exact: true }).waitFor();
  assert.equal(await page.locator('.btn-start-lab').count(), 3);
  await page.locator('.btn-start-lab').first().scrollIntoViewIfNeeded();
  const courseScroll = await page.evaluate(() => window.scrollY);
  await page.locator('.btn-start-lab').first().click();
  const brief = page.locator('[data-practice-brief]');
  await brief.waitFor();
  assert.ok((await brief.innerText()).includes('Việc bạn cần làm'));
  assert.equal(await brief.locator('details[open]').count(), 0);
  assert.equal(await brief.locator('pre:visible').count(), 0);
  await brief.locator('summary').first().click();
  assert.equal(await brief.locator('details[open]').count(), 1);
  await page.getByRole('combobox', { name: 'Chọn mục bài học', exact: true }).selectOption('2');
  assert.equal(await brief.locator('details[open]').count(), 0);
  await page.getByRole('button', { name: 'Về khóa học', exact: true }).click();
  await page.waitForFunction(y => Math.abs(window.scrollY - y) < 5, courseScroll);
  await page.getByRole('button', { name: 'Trở về lộ trình', exact: true }).click();
  await page.waitForURL('**/paths/windows');
  await page.waitForFunction(y => Math.abs(window.scrollY - y) < 5, roadmapScroll);
  // Browser history and reloading a nested page must retain the same origin.
  await page.goForward();
  await page.getByRole('heading', { name: 'Bắt đầu bằng ticket thực hành GUI', exact: true }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Trở về lộ trình', exact: true }).click();
  await page.waitForURL('**/paths/windows');
  await page.waitForFunction(y => Math.abs(window.scrollY - y) < 5, roadmapScroll);
  await page.goto(base + '/courses/windows-11-fundamentals');
  await page.getByRole('button', { name: 'Trở về lộ trình Windows', exact: true }).click();
  await page.waitForURL('**/paths/windows');
  assert.deepEqual(errors, []);
  assert.equal(mutations, 0);
  console.log('PASS: real course API, 3 GUI tickets first, hints collapsed/reset, course/roadmap scroll restored, reload/back/forward and direct links. No VM mutations.');
} finally { await browser.close(); server.close(); }
