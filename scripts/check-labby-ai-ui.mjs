// All chat requests are intercepted: no lesson context leaves this browser.
// The live provider is checked separately with a benign greeting only.
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
const report = { checks: [], providerCalls: 0, chatTransport: 'browser fixtures only', complete: false };
const errors = [];
async function pageFor(host = '127.0.0.1') {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('**/api/ai/chat', route => route.fulfill({ json: { reply: 'Xin chào! Tôi là Labby, trợ lý học tập của bạn.', mode: 'gemini', model: 'fixture-model' } }));
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/environment', route => route.fulfill({ json: { available: false, capabilities: {} } }));
  await page.route('**/api/cloud-vm/status*', route => route.fulfill({ json: { powerState: 'unknown', controlConfigured: false } }));
  await page.goto(`http://${host}:5000/labs/win-server-ad-users-groups`);
  await page.getByRole('combobox').selectOption('1');
  return page;
}
try {
  const real = await pageFor();
  const configuration = await real.request.get('http://127.0.0.1:5000/api/ai/status').then(response => response.json());
  assert.equal(configuration.configured, true);
  assert.equal(JSON.stringify(configuration).includes('API_KEY'), false);
  await real.getByRole('button', { name: 'Labby AI', exact: true }).click();
  const panel = real.locator('#workspace-ai');
  await panel.getByRole('status').filter({ hasText: 'Chưa gửi yêu cầu' }).waitFor();
  await panel.getByRole('textbox', { name: 'Câu hỏi cho Labby AI' }).fill('Chào Labby, giới thiệu ngắn trong một câu tiếng Việt.');
  const received = real.waitForResponse(response => response.url().endsWith('/api/ai/chat') && response.request().method() === 'POST', { timeout: 65000 });
  await panel.getByRole('button', { name: 'Gửi câu hỏi cho Labby AI' }).click();
  const response = await received;
  assert.equal(response.status(), 200);
  assert.equal(new URL(response.url()).hostname, '127.0.0.1');
  const answer = await response.json();
  assert.equal(answer.mode, 'gemini');
  assert.equal(answer.model, 'fixture-model');
  assert.ok(answer.reply.trim());
  await panel.getByRole('status').filter({ hasText: 'Gemini' }).waitFor();
  assert.equal(await panel.getByText('⚠️ Không thể kết nối đến máy chủ AI.', { exact: false }).count(), 0);
  await real.screenshot({ path: '.artifacts/labby-ai-ui-fixture.png' });
  report.checks.push({ name: 'same-origin browser chat with simulated Gemini response', model: answer.model, passed: true });
  await real.close();

  const page = await pageFor('localhost');
  const bodies = [];
  let requests = 0;
  await page.route('**/api/ai/chat', async route => {
    const body = route.request().postDataJSON(); bodies.push(body); requests++;
    assert.equal(new URL(route.request().url()).hostname, 'localhost');
    if (requests === 1) await route.fulfill({ json: { reply: 'Hướng dẫn offline mẫu.', mode: 'offline', notice: 'Quota mẫu đã hết.' } });
    else if (requests === 2) await route.fulfill({ status: 400, json: { error: 'Câu hỏi mẫu chưa hợp lệ.' } });
    else await route.fulfill({ json: { reply: 'Đã nhận câu hỏi từ bước học.', mode: 'gemini', model: 'fixture-model' } });
  });
  await page.getByRole('button', { name: 'Labby AI', exact: true }).click();
  const fixturePanel = page.locator('#workspace-ai');
  await fixturePanel.getByRole('textbox', { name: 'Câu hỏi cho Labby AI' }).fill('gợi ý');
  await fixturePanel.getByRole('button', { name: 'Gửi câu hỏi cho Labby AI' }).click();
  await fixturePanel.getByText('Hướng dẫn offline mẫu.', { exact: true }).waitFor();
  await fixturePanel.getByText('Quota mẫu đã hết.', { exact: true }).waitFor();
  await fixturePanel.getByRole('status').filter({ hasText: /^Offline$/ }).waitFor();
  report.checks.push({ name: 'offline mode and provider notice are visible', passed: true });
  await fixturePanel.getByRole('textbox', { name: 'Câu hỏi cho Labby AI' }).fill('câu hỏi tiếp');
  await fixturePanel.getByRole('button', { name: 'Gửi câu hỏi cho Labby AI' }).click();
  await fixturePanel.getByText('Không gửi được câu hỏi: Câu hỏi mẫu chưa hợp lệ.', { exact: true }).waitFor();
  assert.ok(bodies[1].history.some(message => message.role === 'user' && message.content === 'gợi ý'));
  report.checks.push({ name: 'conversation history sent; HTTP errors show the actual error', passed: true });
  await page.getByTestId('guide-pane').getByRole('button', { name: 'Hỏi Labby AI về bước này →', exact: true }).click();
  await fixturePanel.getByText('Đã nhận câu hỏi từ bước học.', { exact: true }).waitFor();
  assert.equal(typeof bodies[2].message, 'string');
  assert.equal(bodies[2].context.platform, 'windows');
  assert.equal(bodies[2].context.labId, 'win-server-ad-users-groups');
  assert.ok(bodies[2].context.task);
  report.checks.push({ name: 'external prompt object becomes a string with Windows task context', passed: true });
  await page.close();
  assert.deepEqual(errors, []);
  report.complete = true;
  console.log('PASS browser fixtures: same-origin reply, offline notice, history, HTTP error and Ask AI context. No provider calls.');
} finally {
  await fs.writeFile('.artifacts/labby-ai-ui-check.json', JSON.stringify({ ...report, errors }, null, 2));
  await browser.close();
}
