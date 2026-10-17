const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const LABS_DIR = path.resolve('server/data/labs');

function normalizeTitle(t) {
  return (t || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

async function getWs() {
  const r = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await r.json();
  const page = tabs.find(t => t.type === 'page');
  return new WebSocket(page.webSocketDebuggerUrl);
}

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === id) {
        ws.off('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const EXTRACTOR_SCRIPT = `
(() => {
  function htmlToMd(el) {
    function walk(node, listCounter = { val: 1 }) {
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
        return '**' + Array.from(node.childNodes).map(n => walk(n, listCounter)).join('') + '**';
      }

      if (['em', 'i'].includes(tag)) {
        return '*' + Array.from(node.childNodes).map(n => walk(n, listCounter)).join('') + '*';
      }

      if (tag === 'p') {
        return '\\n\\n' + Array.from(node.childNodes).map(n => walk(n, listCounter)).join('').trim() + '\\n\\n';
      }

      if (tag === 'h3') {
        return '\\n\\n### ' + Array.from(node.childNodes).map(n => walk(n, listCounter)).join('').trim() + '\\n\\n';
      }

      if (tag === 'h4') {
        return '\\n\\n#### ' + Array.from(node.childNodes).map(n => walk(n, listCounter)).join('').trim() + '\\n\\n';
      }

      if (tag === 'blockquote') {
        const inner = Array.from(node.childNodes).map(n => walk(n, listCounter)).join('').trim();
        return '\\n\\n> ' + inner.split('\\n').join('\\n> ') + '\\n\\n';
      }

      if (tag === 'ul') {
        return '\\n' + Array.from(node.children).map(li => '- ' + walk(li, listCounter).trim()).join('\\n') + '\\n';
      }

      if (tag === 'ol') {
        let idx = 1;
        return '\\n' + Array.from(node.children).map(li => (idx++) + '. ' + walk(li, listCounter).trim()).join('\\n') + '\\n';
      }

      if (tag === 'li') {
        return Array.from(node.childNodes).map(n => walk(n, listCounter)).join('').trim();
      }

      return Array.from(node.childNodes).map(n => walk(n, listCounter)).join('');
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

async function scrapeLab(ws, labFile) {
  const filePath = path.join(LABS_DIR, labFile);
  const labData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!labData.source_url) {
    console.log(`[SKIP] ${labFile} has no source_url`);
    return;
  }

  console.log(`\n========================================`);
  console.log(`Processing: ${labData.title} (${labFile})`);
  console.log(`URL: ${labData.source_url}`);

  await sendCommand(ws, 'Page.navigate', { url: labData.source_url });
  // Wait 3.5s for page and nuxt rendering
  await new Promise(r => setTimeout(r, 3500));

  const evalRes = await sendCommand(ws, 'Runtime.evaluate', {
    expression: EXTRACTOR_SCRIPT,
    returnByValue: true
  });

  const scrapedSections = evalRes?.result?.value || [];
  if (!scrapedSections.length) {
    console.log(`[WARN] No H2 sections found for ${labFile}`);
    return;
  }

  console.log(`Scraped ${scrapedSections.length} sections from web:`);
  scrapedSections.forEach(s => console.log(` - ${s.title} (${s.markdown.length} chars)`));

  let updatedCount = 0;

  // Update sections in labData
  if (Array.isArray(labData.sections)) {
    for (const sec of labData.sections) {
      const match = scrapedSections.find(s => normalizeTitle(s.title) === normalizeTitle(sec.title));
      if (match && match.markdown && match.markdown.length > 20) {
        sec.content = match.markdown;
        updatedCount++;
      }
    }
  }

  // Update steps in labData
  if (Array.isArray(labData.steps)) {
    for (const step of labData.steps) {
      const match = scrapedSections.find(s => normalizeTitle(s.title) === normalizeTitle(step.title));
      if (match && match.markdown && match.markdown.length > 20) {
        step.content = match.markdown;
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(labData, null, 2), 'utf8');
  console.log(`[DONE] Updated ${updatedCount} sections for ${labFile}`);
}

async function main() {
  const ws = await getWs();
  await new Promise(r => ws.on('open', r));

  const files = fs.readdirSync(LABS_DIR).filter(f => f.endsWith('.json'));
  // Sort quick-start-with-linux labs first
  const quickStart = [
    'linux-your-first-linux-lab.json',
    'linux-display-user-and-group-information.json',
    'linux-files-and-directories.json',
    'linux-basic-files-operations.json',
    'linux-file-contents-and-comparing.json',
    'linux-permissions-of-files.json',
    'shell-change-file-ownership.json',
    'linux-user-account-management.json',
    'linux-the-manuscript-mystery.json',
    'linux-the-jokers-trick.json'
  ];

  const others = files.filter(f => !quickStart.includes(f) && !f.includes('docker') && !f.includes('git'));
  const queue = [...quickStart, ...others];

  for (const f of queue) {
    try {
      await scrapeLab(ws, f);
    } catch (err) {
      console.error(`Error scraping ${f}:`, err);
    }
  }

  console.log('\nAll done!');
  ws.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

