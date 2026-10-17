const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

http.get('http://127.0.0.1:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', async () => {
    const list = JSON.parse(data);
    const page = list.find(t => t.type === 'page') || list[0];
    const ws = new WebSocket(page.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) => new Promise(resolve => {
      const msgId = id++;
      const handler = (m) => {
        const d = JSON.parse(m);
        if (d.id === msgId) {
          ws.off('message', handler);
          resolve(d.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await new Promise(r => ws.on('open', r));
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:5000/labs/linux-file-contents-and-comparing' });
    await new Promise(r => setTimeout(r, 3000));

    // Switch to section 1
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

    const textRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true
    });

    console.log('--- Rendered Page Content ---');
    console.log(textRes.result.value.slice(0, 1500));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(__dirname, 'lab5_rendered_cat_tmp_hello.png'), buffer);
    console.log('Saved screenshot to lab5_rendered_cat_tmp_hello.png');

    ws.close();
  });
});

