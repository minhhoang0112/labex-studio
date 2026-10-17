const WebSocket = require('ws');
const fs = require('fs');

async function testSec1() {
  const r = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await r.json();
  const page = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(res => ws.on('open', res));

  function send(method, params = {}) {
    return new Promise(res => {
      const id = Math.floor(Math.random() * 100000);
      const onMsg = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === id) {
          ws.off('message', onMsg);
          res(msg.result);
        }
      };
      ws.on('message', onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.navigate', { url: 'http://localhost:5000/labs/linux-permissions-of-files' });
  await new Promise(res => setTimeout(res, 2000));

  // Click "Tiếp tục" button
  await send('Runtime.evaluate', {
    expression: `
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Tiếp tục'));
      if (btn) btn.click();
    `
  });
  await new Promise(res => setTimeout(res, 1000));

  const screenRes = await send('Page.captureScreenshot', { format: 'png' });
  if (screenRes && screenRes.data) {
    fs.writeFileSync('scripts/lab7_sec1_rendered.png', Buffer.from(screenRes.data, 'base64'));
    console.log('Saved screenshot of Lab 7 Sec 1');
  }
  ws.close();
}

testSec1().catch(console.error);

