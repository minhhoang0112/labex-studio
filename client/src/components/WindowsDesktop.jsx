import { useEffect, useRef, useState } from 'react';
import Guacamole from 'guacamole-common-js';
import { api } from '../lib/api';
import { Maximize, Minimize, RefreshCw, Plug } from 'lucide-react';

export default function WindowsDesktop({ labId }) {
  const container = useRef(null);
  const panel = useRef(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState('Chưa kết nối Desktop.');
  const [error, setError] = useState('');
  const [resolution, setResolution] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === panel.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await panel.current.requestFullscreen();
    } catch { setError('Trình duyệt chưa cho phép toàn màn hình. Bạn có thể dùng nút Mở rộng ở thanh phía trên.'); }
  }
  useEffect(() => {
    if (!attempt) return;
    const controller = new AbortController();
    const element = container.current;
    let client, keyboard, mouse, observer, resizeTimer;
    let disposed = false;
    // The existing Windows session uses 96 DPI. Multiplying resolution by the
    // browser's devicePixelRatio makes its controls tiny until Windows logs off.
    // Match CSS pixels so labels remain their native readable size.
    const ratio = 1;
    let requested = '';
    const dimensions = () => ({
      width: Math.round(Math.max(640, Math.min(3840, element.clientWidth * ratio))),
      height: Math.round(Math.max(480, Math.min(2160, element.clientHeight * ratio))),
      dpi: Math.round(96 * ratio),
    });
    const connect = async () => {
      setError(''); setState('Đang kết nối Desktop Windows…');
      const session = await api('/api/cloud-vm/desktop-session', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labId, ...dimensions() }),
      });
      if (disposed) return;
      const url = new URL(session.path, location.href);
      url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const tunnel = new Guacamole.WebSocketTunnel(url.href);
      client = new Guacamole.Client(tunnel);
      const display = client.getDisplay();
      element.replaceChildren(display.getElement());
      client.onerror = detail => { if (!disposed) { setError(detail.message || 'Desktop không kết nối được. Kiểm tra VM/RDP/guacd.'); setState('Mất kết nối'); } };
      client.onstatechange = value => {
        if (!disposed) setState(value === 3 ? 'Đã kết nối Windows Desktop' : value === 5 ? 'Đã ngắt Desktop' : 'Đang kết nối Desktop…');
        if (value === 3) resize();
      };
      keyboard = new Guacamole.Keyboard(element);
      keyboard.onkeydown = keysym => { client.sendKeyEvent(1, keysym); return false; };
      keyboard.onkeyup = keysym => client.sendKeyEvent(0, keysym);
      mouse = new Guacamole.Mouse(display.getElement());
      mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = value => {
        const scale = display.getScale() || 1;
        client.sendMouseState({ ...value, x: value.x / scale, y: value.y / scale });
      };
      const fit = () => {
        if (disposed || !element.clientWidth || !element.clientHeight || !display.getWidth()) return;
        // Never enlarge an old bitmap. Request a new RDP resolution instead.
        display.scale(Math.min(1 / ratio, element.clientWidth / display.getWidth(), element.clientHeight / display.getHeight()));
        setResolution(`${display.getWidth()} × ${display.getHeight()}`);
      };
      const resize = () => {
        fit();
        clearTimeout(resizeTimer);
        if (!element.clientWidth || !element.clientHeight) return;
        resizeTimer = setTimeout(() => {
          if (disposed) return;
          const size = dimensions();
          const signature = `${size.width}x${size.height}`;
          if (requested !== signature) { requested = signature; client.sendSize(size.width, size.height); }
        }, 250);
      };
      display.onresize = fit;
      observer = new ResizeObserver(resize); observer.observe(element);
      client.connect(new URLSearchParams({ ticket: session.ticket }).toString());
      element.focus();
    };
    connect().catch(reason => { if (!disposed && reason.name !== 'AbortError') { setError(reason.message); setState('Không kết nối được'); } });
    return () => {
      disposed = true; controller.abort(); observer?.disconnect(); clearTimeout(resizeTimer);
      if (keyboard) { keyboard.reset(); keyboard.onkeydown = null; keyboard.onkeyup = null; }
      if (mouse) mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = null;
      client?.disconnect();
      element?.replaceChildren();
    };
  }, [labId, attempt]);
  return <div ref={panel} className="h-full min-h-0 flex flex-col bg-slate-950">
    <div className="min-h-8 px-3 py-0.5 flex flex-wrap items-center gap-2 text-xs border-b border-slate-800 text-slate-300 shrink-0">
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${state === 'Đã kết nối Windows Desktop' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      <span role="status" className="truncate">{state}</span>
      {resolution && <span data-testid="desktop-resolution" className="hidden sm:inline text-slate-500 tabular-nums">{resolution} · PNG</span>}
      <div className="ml-auto flex items-center gap-1">
        <button title="Desktop chiếm toàn bộ màn hình; nhấn Esc để thoát" aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình Desktop'} className="p-1.5 rounded hover:bg-slate-800" onClick={toggleFullscreen}>{fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}</button>
        <button className={`flex items-center gap-1.5 px-3 py-1 rounded ${attempt ? 'hover:bg-slate-800' : 'bg-blue-600 text-white'}`} onClick={() => setAttempt(value => value + 1)}>{attempt ? <RefreshCw size={13} /> : <Plug size={13} />}{attempt ? 'Kết nối lại' : 'Kết nối Desktop'}</button>
      </div>
    </div>
    {error && <div role="alert" className="p-3 bg-red-950 text-red-200 text-sm">{error}</div>}
    <div ref={container} tabIndex={0} aria-label="Windows Desktop từ xa" onMouseDown={() => container.current?.focus()} className="flex-1 min-h-0 overflow-hidden bg-black outline-none" />
  </div>;
}
