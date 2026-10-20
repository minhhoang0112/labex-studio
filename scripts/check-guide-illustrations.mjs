// Real lesson JSON + SVG assets; runtime HTTP fixtures avoid opening VM sessions.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright-core'); }
catch {
  const cache = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'), 'npm-cache/_npx');
  for (const folder of await fs.readdir(cache)) {
    try { playwright = require(path.join(cache, folder, 'node_modules/playwright-core')); break; } catch {}
  }
}
assert.ok(playwright);
const browser = await playwright.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/api/environment', route => route.fulfill({ json: { available: false, capabilities: {} } }));
await page.route('**/api/cloud-vm/status*', route => route.fulfill({ json: { powerState: 'unknown', controlConfigured: false } }));
const report = { checks: [], fixtures: 'Only runtime status mocked; lesson JSON and SVG files served by the real local backend.' };
try {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [lab, sections] of [['win-server-ad-users-groups', [0, 1, 2, 3]], ['win-server-iis-web', [0, 1]]]) {
      await page.goto('http://127.0.0.1:5000/labs/' + lab);
      for (const section of sections) {
        await page.getByRole('combobox').selectOption(String(section));
        const images = page.getByTestId('guide-pane').locator('img');
        assert.ok(await images.count() > 0);
        for (const image of await images.all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(element => element.decode());
          assert.equal(await image.evaluate(element => element.naturalWidth), 800);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        const trigger = page.getByTestId('guide-pane').getByRole('button', { name: /^Phóng to hình:/ }).first();
        await trigger.click();
        const dialog = page.getByRole('dialog');
        await dialog.waitFor();
        assert.ok((await dialog.locator('img').boundingBox()).width >= 640);
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await trigger.evaluate(element => element === document.activeElement), true);
        report.checks.push({ width, lab, section, passed: true });
      }
    }
  }
  await page.goto('http://127.0.0.1:5000/labs/win-server-ad-users-groups');
  await page.getByRole('combobox').selectOption('1');
  await page.getByTestId('guide-pane').getByRole('button', { name: /^Phóng to hình:/ }).first().click();
  await page.getByRole('dialog').locator('img').evaluate(element => element.decode());
  await page.screenshot({ path: '.artifacts/windows-guide-illustration.png' });
  assert.deepEqual(errors, []);
  report.complete = true;
  console.log(`PASS ${report.checks.length} guide image/modal checks; no page overflow or JavaScript errors.`);
} finally {
  await fs.writeFile('.artifacts/windows-guide-illustrations-check.json', JSON.stringify({ ...report, errors }, null, 2));
  await browser.close();
}
