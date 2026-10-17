const WebSocket = require('ws');

async function test() {
  const r = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await r.json();
  const page = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(res => ws.on('open', res));

  console.log('Navigating to Getting Started with Linux...');
  ws.send(JSON.stringify({
    id: 100,
    method: 'Page.navigate',
    params: { url: 'https://labex.io/tutorials/linux-getting-started-with-linux-446315' }
  }));

  await new Promise(r => setTimeout(r, 4000));

  const script = `
    (() => ({
      title: document.title,
      url: location.href,
      headings: Array.from(document.querySelectorAll('h2')).map(h => h.innerText.trim())
    }))()
  `;

  ws.send(JSON.stringify({
    id: 101,
    method: 'Runtime.evaluate',
    params: { expression: script, returnByValue: true }
  }));

  ws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.id === 101) {
      console.log('Scraped result:', msg.result?.result?.value);
      process.exit(0);
    }
  });
}

test().catch(console.error);

