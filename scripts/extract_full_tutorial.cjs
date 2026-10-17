const WebSocket = require('ws');
const fs = require('fs');

async function main() {
  const r = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await r.json();
  const page = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  ws.on('open', () => {
    // Extract structured sections from the DOM
    const script = `
      (() => {
        const sections = [];
        // The tutorial article usually contains h2 for each major step
        const headings = Array.from(document.querySelectorAll('h2, h3'));
        const text = document.querySelector('article') ? document.querySelector('article').innerText : document.body.innerText;
        return {
          title: document.title,
          url: location.href,
          fullText: text
        };
      })()
    `;
    ws.send(JSON.stringify({
      id: 3,
      method: 'Runtime.evaluate',
      params: { expression: script, returnByValue: true }
    }));
  });

  ws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.id === 3) {
      const res = msg.result?.result?.value;
      if (res) {
        fs.writeFileSync('scripts/last_tutorial_raw.txt', res.fullText, 'utf8');
        console.log('Saved raw tutorial text, total chars:', res.fullText.length);
      }
      process.exit(0);
    }
  });
}

main().catch(console.error);

