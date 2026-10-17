const http = require('http');
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
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else {
            reject(new Error('No inspectable page found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const wsUrl = await getWebSocketUrl();
  const WebSocket = require('ws');
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
  console.log('Connected to CDP');

  await send('Page.enable');
  await send('Runtime.enable');

  // Navigate to lab 2
  console.log('Navigating to Lab 2...');
  await send('Page.navigate', { url: 'http://localhost:5000/labs/linux-display-user-and-group-information' });

  // Wait 4 seconds for load
  await new Promise(r => setTimeout(r, 4000));

  // Evaluate current text & state
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1')?.innerText;
      const h2 = document.querySelector('h2')?.innerText;
      const activeTab = document.querySelector('.guide-tab.active, [aria-selected="true"]')?.innerText;
      const markdown = document.querySelector('.markdown-body, .prose')?.innerText?.slice(0, 300);
      const isViBtn = document.querySelector('button[title*="VI"], button:has-text("VI"), button:has-text("EN")')?.innerText;
      const headerTitle = document.querySelector('header')?.innerText;
      return { h1, h2, activeTab, markdown, headerTitle };
    })()`,
    returnByValue: true
  });

  console.log('Rendered state:', evalResult.result.value);

  // Take screenshot
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshot.data, 'base64');
  const outPath = path.join(__dirname, 'lab2_vietnamese_rendered.png');
  fs.writeFileSync(outPath, buffer);
  console.log('Saved screenshot to:', outPath);

  ws.close();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

