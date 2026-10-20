// Real lesson UI; all VM mutation/status endpoints are fixtures (no Azure calls).
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
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const actions = [], errors = [], queries = [];
let running = false;
page.on('pageerror', error => errors.push(error.message));
page.on('dialog', dialog => dialog.accept());
await page.route('**/api/environment', route => route.fulfill({ json: { available: false } }));
await page.route('**/api/cloud-vm/status*', route => {
  const labId = new URL(route.request().url()).searchParams.get('labId'); queries.push(labId);
  return route.fulfill({ json: { vmName: labId?.startsWith('win-it-') ? 'LabEx-CLIENT01' : 'LabEx-WinServer',
    powerStateCode: running ? 'PowerState/running' : 'PowerState/deallocated', powerState: running ? 'VM running' : 'VM deallocated', controlConfigured: true } });
});
for (const action of ['start', 'stop']) await page.route('**/api/cloud-vm/' + action, route => {
  actions.push({ action, ...route.request().postDataJSON() }); running = action === 'start';
  return route.fulfill({ status: 202, json: { accepted: true, powerState: running ? 'starting' : 'deallocating' } });
});
await page.route('**/api/cloud-vm/fault/prepare', route => {
  actions.push({ action: 'prepare', ...route.request().postDataJSON() });
  return route.fulfill({ status: 409, json: { error: 'Baseline fixture is not ready.' } });
});
try {
  const labId = 'win-it-printer-spooler-fix';
  await page.goto('http://127.0.0.1:5000/labs/' + labId);
  await page.getByRole('combobox').selectOption('1');
  await page.getByText('LabEx-CLIENT01', { exact: true }).waitFor();
  assert.equal(actions.length, 0, 'Reading a lesson must not start the VM.');
  await page.getByRole('button', { name: 'Bật Máy Ảo', exact: true }).click();
  await page.getByRole('button', { name: 'Tắt VM', exact: true }).waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: 'Chuẩn bị sự cố', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Baseline fixture is not ready.' }).waitFor();
  await page.getByRole('button', { name: 'Tắt VM', exact: true }).click();
  assert.deepEqual(actions.map(action => action.action), ['start', 'prepare', 'stop']);
  assert.ok(actions.every(action => action.labId === labId));
  assert.equal(actions.find(action => action.action === 'prepare').confirm, true);
  assert.ok((await page.locator('a[href*="/api/cloud-vm/connect.rdp"]').getAttribute('href')).includes('labId=' + labId));
  assert.ok(queries.every(id => id === labId));
  assert.deepEqual(errors, []);
  await fs.writeFile('.artifacts/windows-target-ui.json', JSON.stringify({ passed: true, realAzure: false, actions, errors }, null, 2));
  console.log('PASS Windows client UI: no auto-start, explicit target for start/stop/RDP, baseline failure shown truthfully.');
} finally { await browser.close(); }
