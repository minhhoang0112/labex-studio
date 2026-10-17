import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { RefreshCw, Trash2, TerminalSquare } from 'lucide-react';

export default function Terminal({ labId, onOutput }) {
  const container = useRef(null);
  const session = useRef(null);
  const outputCallback = useRef(onOutput);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('Đang kết nối...');
  const [connected, setConnected] = useState(false);
  useEffect(() => { outputCallback.current = onOutput; }, [onOutput]);
  useEffect(() => {
    let active = true;
    let ready = false;
    setConnected(false); setStatus('Đang kết nối...');
    const term = new XTerminal({ cursorBlink: true, fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 14, theme: { background: '#0f172a', foreground: '#f8fafc', cursor: '#38bdf8' } });
    const fit = new FitAddon(); term.loadAddon(fit); term.open(container.current);
    const url = new URL('/ws/terminal', window.location.href);
    url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('labId', labId);
    const ws = new WebSocket(url);
    session.current = { term, ws };
    const resize = () => {
      if (!active || !container.current?.clientWidth || !container.current?.clientHeight) return;
      try { fit.fit(); if (ready && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows })); } catch { /* Hidden panes are fitted when visible. */ }
    };
    const observer = new ResizeObserver(resize); observer.observe(container.current);
    const input = term.onData(data => { if (ready && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'input', data })); });
    ws.onmessage = event => {
      if (!active) return;
      let msg; try { msg = JSON.parse(event.data); } catch { term.write(event.data); return; }
      if (msg.type === 'ready') {
        ready = msg.environment?.available !== false;
        setConnected(ready); setStatus(msg.environment?.label || msg.environment?.shell || 'Linux'); resize(); term.focus();
      } else if (msg.type === 'output') { term.write(msg.data); outputCallback.current?.(msg.data); }
      else if (msg.type === 'error') { const message = msg.message || msg.error || 'Không thể khởi động môi trường Linux.'; setStatus(message); term.writeln(`\r\n\x1b[31m${message}\x1b[0m`); }
      else if (msg.type === 'exit') { ready = false; setConnected(false); setStatus('Phiên shell đã kết thúc. Kết nối lại để mở phiên mới.'); }
    };
    ws.onerror = () => { if (active) setStatus('Không thể kết nối máy chủ terminal.'); };
    ws.onclose = () => { if (active) { ready = false; setConnected(false); setStatus(previous => previous === 'Đang kết nối...' ? 'Kết nối terminal đã đóng.' : `${previous} · Đã ngắt kết nối`); } };
    resize();
    return () => { active = false; observer.disconnect(); input.dispose(); ws.close(); term.dispose(); session.current = null; };
  }, [labId, attempt]);
  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs shrink-0">
        <div className="flex min-w-0 items-center gap-2 text-slate-300"><TerminalSquare className="w-4 h-4 shrink-0" /><span className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} /><span className="truncate" title={status}>{status}</span></div>
        <div className="flex gap-1"><button aria-label="Xóa màn hình terminal" title="Xóa màn hình" onClick={() => session.current?.term.clear()} className="p-1.5 text-slate-400 hover:text-white"><Trash2 className="w-4 h-4" /></button><button aria-label="Kết nối lại terminal" title="Mở phiên terminal mới" onClick={() => setAttempt(value => value + 1)} className="p-1.5 text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button></div>
      </div>
      <div ref={container} className="flex-1 min-h-0 w-full p-2 overflow-hidden" />
    </div>
  );
}
