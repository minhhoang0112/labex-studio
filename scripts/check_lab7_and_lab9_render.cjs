const WebSocket = require('ws');
const fs = require('fs');

async function capture(url, screenshotFile) {
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

  await send('Page.navigate', { url });
  await new Promise(res => setTimeout(res, 2000));

  const screenRes = await send('Page.captureScreenshot', { format: 'png' });
  if (screenRes && screenRes.data) {
    fs.writeFileSync(screenshotFile, Buffer.from(screenRes.data, 'base64'));
    console.log(`Saved screenshot to ${screenshotFile}`);
  }
  ws.close();
}

async function main() {
  await capture('http://localhost:5000/labs/linux-permissions-of-files', 'scripts/lab7_rendered.png');
  await capture('http://localhost:5000/labs/linux-user-account-management', 'scripts/lab9_rendered.png');
}

main().catch(console.error);

