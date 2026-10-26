// Real Guacamole client and browser input; VM API/WebSocket are fixtures.
// Does not start, stop, reset, or connect to an Azure VM.
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
const messages = [], errors = [];
await page.addInitScript(()=>{
  window.__clipboard={read:'Tiếng Việt 🧪\r\nDòng thứ hai',writes:[],denied:false};
  Object.defineProperty(navigator,'clipboard',{value:{
    readText:async()=>{if(window.__clipboard.denied)throw new DOMException('Denied','NotAllowedError');return window.__clipboard.read;},
    writeText:async text=>{window.__clipboard.writes.push(text);},
  }});
});
let onSocket;
let desktopSocket;
const instruction = (...args) => args.map(value => `${String(value).length}.${value}`).join(',') + ';';
const key = (keysym, down) => instruction('key', keysym, down);
page.on('pageerror', error => errors.push(error.message));
await page.route('**/api/environment', route => route.fulfill({ json: { available: false } }));
await page.route('**/api/cloud-vm/**', route => {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith('/status')) return route.fulfill({ json: {
    vmName: 'Keyboard fixture', powerStateCode: 'PowerState/running', powerState: 'VM running', controlConfigured: true,
    desktop: { configured: true, guacdAvailable: true },
  } });
  if (url.pathname.endsWith('/desktop-session')) return route.fulfill({ json: { path: '/ws/desktop', ticket: 'keyboard-fixture' } });
  throw new Error('Unexpected VM operation: ' + url.pathname);
});
await page.routeWebSocket('**/ws/desktop*', socket => {
  desktopSocket=socket;
  socket.onMessage(message => messages.push(message));
  socket.send(instruction('', 'keyboard-fixture') + instruction('size', 0, 900, 600) + instruction('sync', 1));
  onSocket?.();
});
try {
  await page.goto('http://127.0.0.1:5000/labs/win-it-printer-spooler-fix');
  await page.getByRole('combobox').first().selectOption('1');
  await page.getByRole('button', { name: 'Kết nối Desktop', exact: true }).click();
  await page.getByText('Đã kết nối Windows Desktop', { exact: true }).waitFor();
  const desktop = page.locator('[aria-label="Windows Desktop từ xa"]');
  // Reproduce loss of focus, then click the Guacamole display (which cancels bubbling).
  await page.getByRole('button', { name: 'Win + R', exact: true }).focus();
  messages.length = 0;
  await desktop.click({ position: { x: 50, y: 50 } });
  assert.ok(messages.some(message => message.startsWith('5.mouse,')), 'Click must reach Guacamole mouse handler');
  assert.equal(await desktop.evaluate(element => document.activeElement === element), true);
  await page.keyboard.type('Rename123');
  for (const character of 'Rename123') {
    assert.ok(messages.includes(key(character.codePointAt(0), 1)), 'Missing keydown: ' + character);
    assert.ok(messages.includes(key(character.codePointAt(0), 0)), 'Missing keyup: ' + character);
  }
  // Moving focus away must release modifiers, and typing elsewhere must stay local.
  await page.keyboard.down('Control');
  await page.evaluate(() => {
    const input = document.createElement('input'); input.id = 'outside-desktop'; document.body.append(input); input.focus();
  });
  assert.ok(messages.includes(key(0xffe3, 0)), 'Control must be released on blur');
  await page.keyboard.up('Control');
  messages.length = 0;
  await page.keyboard.type('local chat');
  assert.ok(messages.every(message => !message.startsWith('3.key,')), 'Outside input leaked to VM');
  assert.equal(await page.locator('#outside-desktop').inputValue(), 'local chat');
  messages.length = 0;
  await page.getByRole('button', { name: 'Win + R', exact: true }).click();
  assert.deepEqual(messages.filter(message => message.startsWith('3.key,')), [key(0xffeb, 1), key(0x72, 1), key(0x72, 0), key(0xffeb, 0)]);
  await page.getByRole('combobox', { name: 'Gửi phím vào máy ảo' }).selectOption('rename');
  assert.ok(messages.includes(key(0xffbf, 1)) && messages.includes(key(0xffbf, 0)));
  // Real browser shortcuts + Guacamole streams, without reading the user's clipboard.
  await desktop.click({position:{x:50,y:50}});messages.length=0;
  await page.keyboard.press('Control+v');
  await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Windows Desktop từ xa');
  assert.ok(messages.some(m=>m.startsWith('9.clipboard,')));
  const outgoing=messages.filter(m=>m.startsWith('4.blob,')).map(m=>m.match(/,\d+\.([A-Za-z0-9+/=]+);$/)?.[1]).join('');
  assert.equal(Buffer.from(outgoing,'base64').toString('utf8'),'Tiếng Việt 🧪\r\nDòng thứ hai');
  assert.equal(messages.filter(m=>m===key(0x76,1)).length,1,'Paste chord sent once');
  await page.keyboard.press('Control+c');
  const remote='Đã sao chép từ Windows 🧪\nDòng hai';
  desktopSocket.send(instruction('clipboard',17,'text/plain')+instruction('blob',17,Buffer.from(remote).toString('base64'))+instruction('end',17));
  await page.waitForFunction(expected=>window.__clipboard.writes.includes(expected),remote);
  await page.evaluate(()=>{window.__clipboard.denied=true;});
  await page.keyboard.press('Control+v');
  await page.getByRole('region',{name:'Clipboard hai chiều',exact:true}).waitFor();
  assert.ok((await page.getByRole('region',{name:'Clipboard hai chiều',exact:true}).innerText()).includes('Trình duyệt chưa cho đọc clipboard'));
  await page.getByRole('textbox',{name:'Máy tính → VM',exact:true}).fill('Dán thủ công');
  messages.length=0;await page.getByRole('button',{name:'Dán vào VM',exact:true}).click();
  assert.ok(messages.some(m=>m.startsWith('9.clipboard,')));
  assert.equal(await page.getByRole('textbox',{name:'VM → máy tính',exact:true}).inputValue(),remote);
  await page.getByRole('button',{name:'Đóng Clipboard',exact:true}).click();
  // Reconnection must not duplicate keyboard handlers.
  const reconnected = new Promise(resolve => { onSocket = resolve; });
  await page.getByRole('button', { name: 'Kết nối lại', exact: true }).click();
  await reconnected;
  await page.getByText('Đã kết nối Windows Desktop', { exact: true }).waitFor();
  await desktop.click({ position: { x: 50, y: 50 } });
  messages.length = 0;
  await page.keyboard.type('z');
  assert.equal(messages.filter(message => message === key(0x7a, 1)).length, 1);
  assert.equal(messages.filter(message => message === key(0x7a, 0)).length, 1);
  assert.deepEqual(errors, []);
  await fs.writeFile('.artifacts/desktop-keyboard.json', JSON.stringify({ passed: true, realAzure: false,
    checks: ['click focuses despite Guacamole cancellation', 'typing sends keys', 'blur releases modifiers', 'outside typing stays local', 'Win+R protocol chord', 'F2 shortcut', 'reconnect without duplicate keys'], errors }, null, 2));
  console.log('PASS Desktop keyboard: focus, typing, release on blur, outside input, Win+R/F2, reconnect. No Azure changes.');
} finally { await browser.close(); }
