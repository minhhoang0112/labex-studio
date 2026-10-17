const WebSocket = require('ws');

async function main() {
  const r = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await r.json();
  const page = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  ws.on('open', () => {
    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: {
        expression: 'JSON.stringify({ title: document.title, url: location.href, text: document.body.innerText.slice(0, 5000) })'
      }
    }));
  });

  ws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.id === 2) {
      const res = JSON.parse(msg.result.result.value || '{}');
      console.log('Title:', res.title);
      console.log('URL:', res.url);
      console.log('Text preview:\n', res.text);
      process.exit(0);
    }
  });
}

main().catch(console.error);

