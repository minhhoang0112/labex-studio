const http = require('http');
const WebSocket = require('ws');

http.get('http://127.0.0.1:9222/json', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const list = JSON.parse(d);
    const page = list.find(t => t.type === 'page') || list[0];
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: 'localStorage.getItem("labex.local.progress.v2")', returnByValue: true }
      }));
    });
    ws.on('message', m => {
      const res = JSON.parse(m);
      if (res.id === 1) {
        console.log('Progress storage:', JSON.parse(res.result?.result?.value || '{}'));
        ws.close();
      }
    });
  });
});

