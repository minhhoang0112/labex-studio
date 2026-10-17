const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(t => t.type === 'page') || list[0];
          resolve(page.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const wsUrl = await getWebSocketUrl();
  const ws = new WebSocket(wsUrl);

  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  await new Promise(r => ws.on('open', r));

  await send('Page.enable');
  await send('Runtime.enable');

  // Navigate to Lab 4
  await send('Page.navigate', { url: 'http://localhost:5000/labs/linux-files-and-directories' });
  await new Promise(r => setTimeout(r, 3000));

  // Switch to section 1 (Task: Copy Files and Directories)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const select = document.querySelector('select');
      if (select) {
        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`
  });

  await new Promise(r => setTimeout(r, 1500));

  // Read the guide text
  const evalRes = await send('Runtime.evaluate', {
    expression: 'document.querySelector(".markdown-body, .prose")?.innerText',
    returnByValue: true
  });

  console.log('--- Lab 4 Section 1 Rendered Content ---');
  console.log(evalRes.result.value);

  // Take screenshot
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshot.data, 'base64');
  fs.writeFileSync(path.join(__dirname, 'lab4_authentic_vietnamese.png'), buffer);
  console.log('Saved screenshot to lab4_authentic_vietnamese.png');

  ws.close();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

