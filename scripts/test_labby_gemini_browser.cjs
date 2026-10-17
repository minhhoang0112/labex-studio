const WebSocket = require('ws');
const fs = require('fs');

async function testGeminiInBrowser() {
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: 'http://localhost:5000/labs/linux-permissions-of-files' });
  await new Promise(res => setTimeout(res, 2500));

  // Click on "Labby AI" button
  await send('Runtime.evaluate', {
    expression: `
      const aiBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Labby AI'));
      if (aiBtn) aiBtn.click();
    `
  });
  await new Promise(res => setTimeout(res, 1000));

  // Click on quick prompt "Gợi ý bước này"
  await send('Runtime.evaluate', {
    expression: `
      const promptBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Gợi ý bước này'));
      if (promptBtn) promptBtn.click();
    `
  });
  
  // Wait 6 seconds for Gemini response
  await new Promise(res => setTimeout(res, 6000));

  const screenRes = await send('Page.captureScreenshot', { format: 'png' });
  if (screenRes && screenRes.data) {
    fs.writeFileSync('C:/Users/HP VICTUS/.gemini/antigravity/brain/58c2ac8b-3865-4dbe-81f4-725a716efe04/labby_ai_gemini_active.png', Buffer.from(screenRes.data, 'base64'));
    console.log('Saved Labby AI Gemini screenshot');
  }
  ws.close();
}

testGeminiInBrowser().catch(console.error);

