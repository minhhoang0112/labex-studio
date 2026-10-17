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

  // Navigate to lab 2
  await send('Page.navigate', { url: 'http://localhost:5000/labs/linux-display-user-and-group-information' });
  await new Promise(r => setTimeout(r, 3000));

  // Reset progress in localStorage for this lab
  await send('Runtime.evaluate', {
    expression: `(() => {
      const raw = localStorage.getItem('labex.local.progress.v2');
      if (raw) {
        const obj = JSON.parse(raw);
        delete obj['linux-display-user-and-group-information'];
        localStorage.setItem('labex.local.progress.v2', JSON.stringify(obj));
      }
      location.reload();
    })()`
  });

  await new Promise(r => setTimeout(r, 4000));

  // Switch to section 1 (Task 1)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const select = document.querySelector('select');
      if (select) {
        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`
  });

  await new Promise(r => setTimeout(r, 1000));

  // Click verify button without typing commands
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const verifyBtn = btns.find(b => b.innerText.includes('Kiểm tra'));
      if (verifyBtn) verifyBtn.click();
    })()`
  });

  await new Promise(r => setTimeout(r, 2000));

  // Evaluate the verification feedback banner
  const checkRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const badge = document.querySelector('.flex.items-center.gap-1\\\\.5')?.innerText;
      const allText = document.body.innerText;
      const isFailedVisible = allText.includes('Nhiệm vụ chưa hoàn thành');
      const isPassedVisible = allText.includes('Chúc mừng! Bạn đã hoàn thành');
      return { badge, isFailedVisible, isPassedVisible };
    })()`,
    returnByValue: true
  });

  console.log('Browser test result:', checkRes.result.value);

  // Take screenshot
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshot.data, 'base64');
  fs.writeFileSync(path.join(__dirname, 'lab2_failed_when_not_done.png'), buffer);
  console.log('Saved screenshot to lab2_failed_when_not_done.png');

  ws.close();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

