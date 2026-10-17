const WebSocket = require('ws');
const fs = require('fs');

async function main() {
  const r = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await r.json();
  const page = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  ws.on('open', () => {
    const script = `
      (() => {
        function htmlToMd(el) {
          function walk(node) {
            if (node.nodeType === Node.TEXT_NODE) {
              return node.textContent;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';

            const tag = node.tagName.toLowerCase();
            if (['button', 'svg', 'style', 'script'].includes(tag)) return '';

            if (tag === 'pre') {
              const code = node.querySelector('code');
              const text = code ? code.textContent.trim() : node.textContent.trim();
              const lang = (code?.className?.match(/language-([\\w-]+)/) || [])[1] || 'bash';
              return '\\n\\n\`\`\`' + lang + '\\n' + text + '\\n\`\`\`\\n\\n';
            }

            if (tag === 'code') {
              if (node.parentElement?.tagName.toLowerCase() === 'pre') return node.textContent;
              return '\`' + node.textContent + '\`';
            }

            if (['strong', 'b'].includes(tag)) {
              return '**' + Array.from(node.childNodes).map(walk).join('') + '**';
            }

            if (['em', 'i'].includes(tag)) {
              return '*' + Array.from(node.childNodes).map(walk).join('') + '*';
            }

            if (tag === 'p') {
              return '\\n\\n' + Array.from(node.childNodes).map(walk).join('').trim() + '\\n\\n';
            }

            if (tag === 'h3') {
              return '\\n\\n### ' + Array.from(node.childNodes).map(walk).join('').trim() + '\\n\\n';
            }

            if (tag === 'h4') {
              return '\\n\\n#### ' + Array.from(node.childNodes).map(walk).join('').trim() + '\\n\\n';
            }

            if (tag === 'blockquote') {
              const inner = Array.from(node.childNodes).map(walk).join('').trim();
              return '\\n\\n> ' + inner.split('\\n').join('\\n> ') + '\\n\\n';
            }

            if (tag === 'ul') {
              return '\\n' + Array.from(node.children).map(li => '- ' + walk(li).trim()).join('\\n') + '\\n';
            }

            if (tag === 'ol') {
              let idx = 1;
              return '\\n' + Array.from(node.children).map(li => (idx++) + '. ' + walk(li).trim()).join('\\n') + '\\n';
            }

            if (tag === 'li') {
              return Array.from(node.childNodes).map(walk).join('').trim();
            }

            return Array.from(node.childNodes).map(walk).join('');
          }

          let md = walk(el);
          return md.replace(/\\n{3,}/g, '\\n\\n').trim();
        }

        const article = document.querySelector('article') || document.querySelector('main') || document.body;
        const headings = Array.from(article.querySelectorAll('h2'));
        const result = [];
        for (let i = 0; i < headings.length; i++) {
          const h = headings[i];
          const title = h.innerText.trim();
          let node = h.nextElementSibling;
          const container = document.createElement('div');
          while (node && node.tagName !== 'H2') {
            container.appendChild(node.cloneNode(true));
            node = node.nextElementSibling;
          }
          result.push({
            title,
            markdown: htmlToMd(container)
          });
        }
        return result;
      })()
    `;
    ws.send(JSON.stringify({
      id: 5,
      method: 'Runtime.evaluate',
      params: { expression: script, returnByValue: true }
    }));
  });

  ws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.id === 5) {
      const res = msg.result?.result?.value || [];
      const cpSec = res.find(s => s.title.includes('Copying'));
      console.log('--- CONVERTED MARKDOWN FOR:', cpSec?.title, '---');
      console.log(cpSec?.markdown);
      fs.writeFileSync('scripts/test_converted_sections.json', JSON.stringify(res, null, 2), 'utf8');
      process.exit(0);
    }
  });
}

main().catch(console.error);

