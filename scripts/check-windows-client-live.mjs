// Actual browser -> local API -> CLIENT01 Azure/RDP. Ends by deallocating CLIENT01.
import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { azureClient } from '../server/services/azureComputeClient.js';
import { getVmTargetConfig } from '../server/services/cloudConfig.js';
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
const config = getVmTargetConfig('client');
assert.equal(config.vmName, 'LabEx-CLIENT01');
const browser = await playwright.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const report = { realAzure: true, target: config.vmName, checks: [], errors: [] };
page.on('pageerror', error => report.errors.push(error.message));
page.on('dialog', dialog => dialog.accept());
try {
  await page.goto('http://127.0.0.1:5000/labs/win-it-pc-onboarding-setup');
  await page.getByRole('combobox').selectOption('1');
  await page.getByText('LabEx-CLIENT01', { exact: true }).waitFor();
  const start = page.getByRole('button', { name: 'Bật Máy Ảo', exact: true });
  if (await start.isVisible()) await start.click();
  await page.getByRole('button', { name: 'Tắt VM', exact: true }).waitFor({ timeout: 180000 });
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Tắt VM' && !button.disabled), null, { timeout: 180000 });
  report.checks.push('Actual web start routes to CLIENT01.');
  await page.getByRole('button', { name: 'Kết nối Desktop', exact: true }).click();
  await page.getByText('Đã kết nối Windows Desktop', { exact: true }).waitFor({ timeout: 180000 });
  await page.waitForFunction(() => {
    for (const canvas of document.querySelectorAll('[aria-label="Windows Desktop từ xa"] canvas')) {
      if (canvas.width < 500 || canvas.height < 300) continue;
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set();
      for (let i = 0; i < data.length; i += 400) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      if (colors.size > 50) return true;
    }
    return false;
  }, null, { timeout: 180000 });
  await page.waitForTimeout(15000);
  await page.screenshot({ path: '.artifacts/windows-client-live-desktop.png' });
  report.checks.push('Actual Guacamole/RDP session rendered a detailed CLIENT01 screen.');
  await page.getByRole('button', { name: 'PowerShell trên Azure VM', exact: true }).click();
  await page.getByRole('textbox', { name: 'Lệnh PowerShell trên VM' }).fill('hostname');
  const commandResponse = page.waitForResponse(response => response.url().endsWith('/api/cloud-vm/powershell'), { timeout: 240000 });
  await page.getByRole('button', { name: 'Chạy', exact: true }).click();
  const command = await (await commandResponse).json();
  assert.equal(command.exitCode, 0); assert.equal(command.computerName, 'CLIENT01'); assert.equal(command.target, 'LabEx-CLIENT01');
  report.checks.push('Browser hostname executes on CLIENT01 via Azure Agent.');
  await page.getByRole('combobox').selectOption('2');
  const gradeResponse = page.waitForResponse(response => response.url().endsWith('/api/verify'), { timeout: 240000 });
  await page.getByRole('button', { name: 'Kiểm tra kết quả', exact: true }).click();
  const grade = await (await gradeResponse).json();
  assert.equal(grade.passed, true); assert.equal(grade.verification_method, 'windows-remote');
  report.checks.push('HTTP grader accepts the real CLIENT01 hostname history and state.');
  const stopResponse = page.waitForResponse(response => response.url().endsWith('/api/cloud-vm/stop'), { timeout: 60000 });
  await page.getByRole('button', { name: 'Tắt VM', exact: true }).click();
  assert.equal((await stopResponse).status(), 202);
  report.checks.push('Actual web stop submits CLIENT01 deallocation.');
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) {
  report.error = error.message; console.error(error.message); process.exitCode = 1;
} finally {
  await browser.close();
  try {
    await azureClient().virtualMachines.deallocate(config.resourceGroup, config.vmName).pollUntilDone();
    report.deallocated = true;
  } catch { report.deallocated = false; process.exitCode = 1; }
  await fs.writeFile('.artifacts/windows-client-live.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks, passed: report.passed || false, deallocated: report.deallocated }));
}
