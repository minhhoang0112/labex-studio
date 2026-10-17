const WebSocket = require('ws');
const fs = require('fs');

async function main() {
  const r = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await r.json();
  const page = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  ws.on('open', () => {
    // Extract each section under H2 / H3 with full markdown formatting
    const script = `
      (() => {
        const article = document.querySelector('article') || document.querySelector('main') || document.body;
        // Find all headings
        const headings = Array.from(article.querySelectorAll('h2'));
        const result = [];
        for (let i = 0; i < headings.length; i++) {
          const h = headings[i];
          const title = h.innerText.trim();
          let node = h.nextElementSibling;
          let html = '';
          while (node && node.tagName !== 'H2') {
            html += node.outerHTML + '\\n';
            node = node.nextElementSibling;
          }
          result.push({ title, html });
        }
        return result;
      })()
    `;
    ws.send(JSON.stringify({
      id: 4,
      method: 'Runtime.evaluate',
      params: { expression: script, returnByValue: true }
    }));
  });

  ws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.id === 4) {
      const res = msg.result?.result?.value || [];
      console.log('Found H2 sections:', res.map(x => x.title));
      fs.writeFileSync('scripts/parsed_sections.json', JSON.stringify(res, null, 2), 'utf8');
      process.exit(0);
    }
  });
}

main().catch(console.error);

