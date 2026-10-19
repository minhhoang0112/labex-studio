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
assert.ok(playwright, 'Installed playwright-core is required.');
const browser = await playwright.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: process.argv.includes('--hidpi') ? 2 : 1 });
const errors = [];
let desktopSockets = 0;
page.on('websocket', socket => { if (socket.url().includes('/ws/desktop')) desktopSockets++; });
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:5000/labs/win-powershell-basics');
  await page.getByRole('combobox').selectOption('1');
  await page.getByRole('button', { name: 'Kết nối Desktop', exact: true }).click();
  await page.getByText('Đã kết nối Windows Desktop', { exact: true }).waitFor({ timeout: 90000 });
  await page.locator('[aria-label="Windows Desktop từ xa"] canvas').first().waitFor({ timeout: 30000 });
  // A successful RDP handshake can precede Windows finishing its logon screen.
  // Wait for a rendered screen with actual detail instead of accepting a solid
  // blue first frame as a usable Desktop.
  await page.waitForFunction(() => {
    const canvases = document.querySelectorAll('[aria-label="Windows Desktop từ xa"] canvas');
    for (const canvas of canvases) {
      if (canvas.width < 500 || canvas.height < 300) continue;
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set();
      for (let i = 0; i < data.length; i += 400) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      let darkTaskbar = 0, samples = 0;
      for (let x = 20; x < canvas.width - 20; x += 20) {
        const offset = ((canvas.height - 10) * canvas.width + x) * 4;
        const [r, g, b] = data.slice(offset, offset + 3);
        samples++;
        if (r < 80 && g < 80 && b < 80 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) darkTaskbar++;
      }
      if (colors.size > 30 && darkTaskbar / samples > 0.5) return true;
    }
    return false;
  }, null, { timeout: 90000 });
  // Give a newly started Windows profile time to complete shell initialization.
  await page.waitForTimeout(20000);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: '.artifacts/cloud-desktop.png' });
  if (process.argv.includes('--layout')) {
    const viewport = page.locator('[aria-label="Windows Desktop từ xa"]');
    async function nativeResolution() {
      const size = await viewport.evaluate(element => {
        const ratio = 1;
        return { width: Math.round(Math.max(640, Math.min(3840, element.clientWidth * ratio))),
          height: Math.round(Math.max(480, Math.min(2160, element.clientHeight * ratio))) };
      });
      await page.getByTestId('desktop-resolution').filter({ hasText: `${size.width} × ${size.height}` }).waitFor({ timeout: 30000 });
      return size;
    }
    const split = await nativeResolution();
    const headerHeight = await page.locator('header').evaluate(element => element.getBoundingClientRect().height);
    assert.ok(headerHeight <= 65, `Workspace header occupies ${headerHeight}px`);
    await page.getByRole('button', { name: 'Mở rộng máy ảo', exact: true }).click();
    assert.equal(await page.getByTestId('guide-pane').isVisible(), false);
    const expanded = await nativeResolution();
    assert.ok(expanded.width > split.width + 200);
    await page.screenshot({ path: '.artifacts/desktop-expanded.png' });
    await page.getByRole('button', { name: 'Toàn màn hình Desktop', exact: true }).click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    const fullscreen = await nativeResolution();
    await page.screenshot({ path: '.artifacts/desktop-fullscreen.png' });
    await page.getByRole('button', { name: 'Thoát toàn màn hình', exact: true }).click();
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.getByRole('button', { name: 'Hiện hướng dẫn', exact: true }).click();
    assert.equal(await page.getByTestId('guide-pane').isVisible(), true);
    const restored = await nativeResolution();
    assert.deepEqual(restored, split);
    assert.equal(desktopSockets, 1, 'Resizing/fullscreen must preserve the same RDP connection');
    await fs.writeFile('.artifacts/desktop-layout-regression.json', JSON.stringify({ complete: true,
      devicePixelRatio: process.argv.includes('--hidpi') ? 2 : 1,
      split, expanded, fullscreen, restored, headerHeight, desktopSockets, errors }, null, 2));
    console.log('PASS native resolution, expanded view, fullscreen and restore preserve one RDP connection.');
  }
  if (process.argv.includes('--powershell')) {
    await page.getByRole('button', { name: 'PowerShell trên Azure VM', exact: true }).click();
    for (const command of ['Get-Command *-Service', '$PSVersionTable.PSVersion']) {
      await page.getByRole('textbox', { name: 'Lệnh PowerShell trên VM' }).fill(command);
      const response = page.waitForResponse(value => value.url().endsWith('/api/cloud-vm/powershell') && value.request().method() === 'POST', { timeout: 240000 });
      await page.getByRole('button', { name: 'Chạy', exact: true }).click();
      const result = await (await response).json();
      assert.equal(result.exitCode, 0, command);
      assert.equal(result.computerName, 'LabEx-WinServer');
      assert.equal(result.target, 'LabEx-WinServer');
    }
    const response = page.waitForResponse(value => value.url().endsWith('/api/verify') && value.request().method() === 'POST', { timeout: 240000 });
    await page.getByRole('button', { name: 'Kiểm tra kết quả', exact: true }).click();
    const grade = await (await response).json();
    assert.equal(grade.passed, true);
    assert.equal(grade.verification_method, 'windows-remote');
    await fs.writeFile('.artifacts/cloud-powershell-web-smoke.json', JSON.stringify({ complete: true, checkedAt: new Date().toISOString(),
      commands: 2, realVm: 'LabEx-WinServer', grade }, null, 2));
    console.log('PASS real browser PowerShell commands and Windows remote verification API.');
  }
  await fs.writeFile('.artifacts/cloud-desktop-smoke.json', JSON.stringify({ checkedAt: new Date().toISOString(),
    complete: true, target: 'LabEx-WinServer', connection: 'actual Guacamole/RDP handshake and rendered canvas; screenshot retained for visual review', errors }, null, 2));
  console.log('PASS real Windows Desktop connected and canvas rendered in Chrome.');
} catch (error) {
  await page.screenshot({ path: '.artifacts/cloud-desktop-failure.png' });
  console.log('Desktop status:', await page.getByRole('alert').allTextContents());
  throw error;
} finally { await browser.close(); }
