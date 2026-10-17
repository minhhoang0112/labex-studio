// Browser regression against the built local app. Only session variables are
// written to the real shell. Reset/AI/delayed-grading cases use explicit HTTP
// fixtures in a fresh browser profile, never reset learner containers or call AI.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let playwright;
const supplied = process.argv.find(arg => arg.startsWith('--playwright='))?.slice(13);
if (supplied) playwright = require(supplied);
else {
  try { playwright = require('playwright-core'); }
  catch {
    const cache = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'), 'npm-cache/_npx');
    for (const dir of await fs.readdir(cache)) {
      try { playwright = require(path.join(cache, dir, 'node_modules/playwright-core')); break; } catch {}
    }
  }
}
assert.ok(playwright, 'Provide installed playwright-core with --playwright=<module-path>');
const base = process.env.LABEX_UI_URL || 'http://127.0.0.1:5000';
const id = 'linux-hello-bash-388809';
const report = { startedAt: new Date().toISOString(), checks: [], complete: false,
  fixtures: 'Reset, delayed verification and AI responses are HTTP fixtures; catalog/content and shell use the running backend.' };
const browser = await playwright.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const frames = [];
let sockets = 0;
page.on('websocket', socket => {
  if (!socket.url().includes('/ws/terminal')) return;
  sockets++;
  socket.on('framereceived', event => {
    try { const msg = JSON.parse(String(event.payload)); if (msg.type === 'output') frames.push(msg.data); } catch {}
  });
});
async function check(name, action) {
  await action();
  report.checks.push({ name, passed: true });
  console.log('PASS ' + name);
}
async function until(fn, message, timeout = 25000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await fn()) return; await new Promise(resolve => setTimeout(resolve, 80)); }
  throw new Error(message);
}
async function geometry() {
  // Allow the matchMedia change and ResizeObserver fit to commit.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const result = await page.evaluate(() => {
    const visible = selector => [...document.querySelectorAll(selector)].filter(el => el.getClientRects().length);
    const outside = visible('[data-testid], #workspace-ai, header, [role="dialog"], select, button').filter(el => {
      const r = el.getBoundingClientRect();
      return r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1;
    }).map(el => el.getAttribute('data-testid') || el.textContent.slice(0, 50));
    return { overflow: document.documentElement.scrollWidth > innerWidth, outside };
  });
  assert.equal(result.overflow, false, JSON.stringify(result));
  assert.deepEqual(result.outside, [], JSON.stringify(result));
}
await fs.mkdir('.artifacts', { recursive: true });
try {
  await check('catalog, roadmap and course pages have no horizontal overflow on mobile/tablet', async () => {
    for (const width of [390, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      for (const url of ['/learn', '/paths/linux', '/courses/quick-start-with-linux']) {
        await page.goto(base + url);
        if (url === '/learn') await page.locator('.course-card').first().waitFor();
        else if (url.includes('/paths/')) await page.getByRole('heading', { name: 'Lộ trình Linux cho System Administrator', exact: true }).waitFor();
        else await page.locator('#start-first-lab').waitFor();
        const sizes = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        assert.ok(sizes.scroll <= sizes.width, url + ' overflows at ' + width + ': ' + JSON.stringify(sizes));
      }
    }
  });
  await check('roadmap failure shows retry without invented course counts (HTTP fixture)', async () => {
    const isolated = await browser.newPage();
    let fail = true;
    await isolated.route('**/api/roadmaps/linux-system-administrator', route => fail
      ? route.fulfill({ status: 503, json: { error: 'UI fixture: roadmap unavailable' } }) : route.continue());
    await isolated.goto(base + '/paths/linux');
    await isolated.getByRole('heading', { name: 'UI fixture: roadmap unavailable', exact: true }).waitFor();
    assert.equal(await isolated.getByText(/bài chấm đủ nhiệm vụ local/).count(), 0);
    fail = false;
    await isolated.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await isolated.getByRole('heading', { name: 'Lộ trình Linux cho System Administrator', exact: true }).waitFor();
    await isolated.close();
  });
  await check('old task IDs do not inflate course rows; missing availability does not enable Start (HTTP fixture)', async () => {
    const isolated = await browser.newPage();
    const courseUrl = base + '/api/courses/quick-start-with-linux';
    const data = await (await fetch(courseUrl)).json();
    const first = data.labs[0];
    delete first.availability;
    await isolated.addInitScript(({ id, key }) => localStorage.setItem(key, JSON.stringify({ [id]: { passed: ['obsolete-id'], complete: true } })), { id: first.id, key: 'labex.local.progress.v2' });
    await isolated.route('**/api/courses/quick-start-with-linux', route => route.fulfill({ json: data }));
    await isolated.goto(base + '/courses/quick-start-with-linux');
    const button = isolated.locator('#start-first-lab');
    await button.waitFor();
    assert.equal(await button.isDisabled(), true);
    const row = button.locator('..');
    assert.match(await row.innerText(), new RegExp('0/' + first.steps_count + ' tasks'));
    await isolated.close();
  });
  await check('source Commands opens its own 41-lesson syllabus and readable outline', async () => {
    await page.goto(base + '/paths/linux');
    const card = page.getByRole('button').filter({ has: page.getByRole('heading', { name: 'Linux Commands Practice Online', exact: true }) });
    await card.click();
    await page.waitForURL('**/courses/linux-basic-commands-practice-online');
    await page.locator('#start-first-lab').waitFor();
    assert.equal(await page.locator('.btn-start-lab').count(), 41);
    assert.equal(await page.locator('#start-first-lab').isEnabled(), true);
    assert.equal(await page.getByText('Khóa học tham khảo giáo trình nguồn', { exact: true }).count(), 0);
    await page.screenshot({ path: '.artifacts/commands-course-imported-ui.png' });
    const syllabus = page.getByRole('region', { name: 'Giáo trình nguồn' });
    await syllabus.waitFor();
    assert.equal(await syllabus.getByRole('button', { name: 'Xem cấu trúc', exact: true }).count(), 41);
    await syllabus.getByRole('button', { name: 'Xem cấu trúc', exact: true }).first().click();
    await page.getByText('Entering the File System', { exact: true }).waitFor();
  });
  await check('shared lessons retain their course context when opening and returning', async () => {
    await page.goto(base + '/courses/linux-practice-challenges');
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/labs/') && res.url().includes('courseId=linux-practice-challenges') && !res.url().includes('/environment')),
      page.locator('#start-first-lab').click()
    ]);
    const data = await response.json();
    assert.equal(data.course_id, 'linux-practice-challenges');
    await page.getByRole('button', { name: 'Về khóa học', exact: true }).click();
    await page.waitForURL('**/courses/linux-practice-challenges');
  });
  await page.goto(base + '/labs/' + id);
  await page.getByRole('button', { name: 'Bắt đầu nhiệm vụ', exact: true }).waitFor();
  await check('intro fills the available reading height at 390px', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await geometry();
    const pane = await page.getByTestId('guide-pane').boundingBox();
    assert.ok(pane.height > 600, 'Intro must not be restricted to half height');
  });
  await page.getByRole('button', { name: 'Bắt đầu nhiệm vụ', exact: true }).click();
  await page.getByRole('combobox', { name: 'Chọn mục bài học' }).selectOption('2');
  await page.getByRole('button', { name: 'Terminal', exact: true }).click();
  await check('real terminal connects and shell survives guide/summary/AI changes', async () => {
    await page.locator('span[title*="Private rootless"]').waitFor({ timeout: 30000 });
    const input = page.locator('.xterm-helper-textarea');
    await input.focus();
    await page.keyboard.type('export LABEX_UI_SESSION=ui_shell_preserved');
    await page.keyboard.press('Enter');
    const originalSockets = sockets;
    await page.getByRole('button', { name: 'Hướng dẫn', exact: true }).click();
    await page.getByRole('combobox').selectOption('7');
    await page.getByRole('combobox').selectOption('2');
    await page.getByRole('button', { name: 'Labby AI', exact: true }).click();
    await page.getByTitle('Đóng trợ lý AI').click();
    await page.getByRole('button', { name: 'Terminal', exact: true }).click();
    frames.length = 0;
    await input.focus();
    await page.keyboard.type('printf "\\nSESSION:%s\\n" "$LABEX_UI_SESSION"');
    await page.keyboard.press('Enter');
    await until(() => frames.join('').includes('\r\nSESSION:ui_shell_preserved'), 'Shell variable was lost across pane changes');
    assert.equal(sockets, originalSockets);
    await page.keyboard.press('Control+k');
    assert.equal(await page.getByRole('dialog', { name: 'Tìm khóa học' }).count(), 0);
  });
  for (const [width, height] of [[390,844],[768,900],[1024,768],[1440,900]]) {
    await check('workspace fits ' + width + 'px with and without AI', async () => {
      await page.setViewportSize({ width, height });
      if (width < 768) await page.getByRole('button', { name: 'Hướng dẫn', exact: true }).click();
      await geometry();
      await page.getByRole('button', { name: 'Labby AI', exact: true }).click();
      await geometry();
      await page.screenshot({ path: '.artifacts/workspace-ui-' + width + '.png' });
      await page.getByTitle('Đóng trợ lý AI').click();
      await page.getByRole('combobox').selectOption('7');
      await geometry();
      await page.getByRole('combobox').selectOption('2');
    });
  }
  await check('keyboard resize and reset dialog focus trap/Escape restore', async () => {
    const separator = page.getByRole('separator', { name: 'Độ rộng hướng dẫn' });
    await separator.focus();
    const before = Number(await separator.getAttribute('aria-valuenow'));
    await page.keyboard.press('ArrowRight');
    assert.equal(Number(await separator.getAttribute('aria-valuenow')), before + 2);
    const trigger = page.getByRole('button', { name: 'Khởi động lại Lab', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await dialog.getByRole('button', { name: 'Xác nhận khởi tạo lại', exact: true }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await dialog.getByRole('button', { name: 'Hủy bỏ', exact: true }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
  });
  await check('environment failure is visible and retry opens terminal only after success', async () => {
    const isolated = await browser.newPage();
    let attempts = 0, connections = 0;
    isolated.on('websocket', () => connections++);
    await isolated.route('**/api/environment', async route => {
      if (++attempts === 1) await route.fulfill({ status: 503, json: { error: 'UI fixture: environment unavailable' } });
      else await route.continue();
    });
    await isolated.goto(base + '/labs/' + id);
    await isolated.getByRole('button', { name: 'Bắt đầu nhiệm vụ', exact: true }).click();
    await isolated.getByRole('alert').filter({ hasText: 'UI fixture' }).waitFor();
    assert.equal(connections, 0);
    await isolated.getByRole('button', { name: 'Thử lại môi trường', exact: true }).first().click();
    await isolated.locator('span[title*="Private rootless"]').waitFor({ timeout: 30000 });
    assert.equal(connections, 1);
    await isolated.close();
  });
  await check('reset cancels delayed verification and preserves progress of other labs (HTTP fixtures)', async () => {
    const progressKey = 'labex.local.progress.v2';
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ other_lab: { passed: ['keep-me'], complete: true } })), progressKey);
    let release;
    const held = new Promise(resolve => { release = resolve; });
    let started = false;
    await page.route('**/api/verify', async route => {
      started = true; await held;
      await route.fulfill({ json: { passed: true, message: 'STALE_VERIFY_RESPONSE' } }).catch(() => {});
    });
    await page.route('**/api/labs/' + id + '/reset', route => route.fulfill({ json: { success: true } }));
    await page.getByRole('combobox').selectOption('2');
    await page.getByRole('button', { name: 'Kiểm tra kết quả', exact: true }).click();
    await until(() => started, 'Verify request did not begin');
    await page.getByRole('button', { name: 'Khởi động lại Lab', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận khởi tạo lại', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    release();
    await page.getByRole('combobox').waitFor();
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey);
    assert.deepEqual(saved.other_lab.passed, ['keep-me']);
    assert.equal(saved[id]?.passed?.length || 0, 0);
    assert.equal(await page.getByText('STALE_VERIFY_RESPONSE', { exact: true }).count(), 0);
  });
  await check('pointer resize changes width and cleans global drag state on SPA navigation', async () => {
    await page.getByRole('combobox').selectOption('2');
    const separator = page.getByRole('separator', { name: 'Độ rộng hướng dẫn' });
    const box = await separator.boundingBox();
    const before = await page.getByTestId('guide-pane').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 120);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + 120);
    const after = await page.getByTestId('guide-pane').boundingBox();
    assert.ok(after.width > before.width + 30);
    assert.equal(await page.evaluate(() => document.body.style.cursor), 'col-resize');
    await page.getByRole('button', { name: 'Về khóa học', exact: true }).press('Enter');
    await page.waitForURL('**/courses/shell-for-beginners');
    assert.equal(await page.evaluate(() => document.body.style.cursor), '');
    assert.equal(await page.evaluate(() => document.body.style.userSelect), '');
    await page.mouse.up();
  });
  assert.deepEqual(errors, [], 'Unexpected browser page errors');
  report.complete = true;
} catch (error) {
  report.error = error.stack;
  await page.screenshot({ path: '.artifacts/workspace-ui-failure.png' }).catch(() => {});
  throw error;
} finally {
  await fs.writeFile('.artifacts/workspace-ui-regression.json', JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
