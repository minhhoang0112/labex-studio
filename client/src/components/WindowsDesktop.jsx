import { useEffect, useRef, useState } from 'react';
import Guacamole from 'guacamole-common-js';
import { api } from '../lib/api';
import { Maximize, Minimize, RefreshCw, Plug, Clipboard, X } from 'lucide-react';
import { desktopClipboard } from '../lib/desktopClipboard';

export default function WindowsDesktop({ labId }) {
  const container = useRef(null);
  const panel = useRef(null);
  const remoteKeys = useRef(null);
  const clipboardBridge = useRef(null);
  const [clipboardOpen, setClipboardOpen] = useState(false);
  const [clipboardDraft, setClipboardDraft] = useState('');
  const [remoteClipboard, setRemoteClipboard] = useState('');
  const [clipboardNotice, setClipboardNotice] = useState('');
  const [connected, setConnected] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState('Chưa kết nối Desktop.');
  const [error, setError] = useState('');
  const [resolution, setResolution] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  function pasteText(text, bridge = clipboardBridge.current) {
    if (!bridge || bridge !== clipboardBridge.current) return;
    try {
      bridge.sendText(text);
      remoteKeys.current?.([0xffe3, 0x76]);
      setClipboardNotice('Đã gửi văn bản và Ctrl+V vào cửa sổ đang chọn trên VM.');
    } catch (reason) { setClipboardNotice(reason.message); }
  }
  async function pasteFromComputer() {
    const bridge = clipboardBridge.current;
    if (!bridge) return;
    try { pasteText(await navigator.clipboard.readText(), bridge); }
    catch {
      if (bridge !== clipboardBridge.current) return;
      setClipboardOpen(true);
      setClipboardNotice('Trình duyệt chưa cho đọc clipboard. Dán vào ô “Máy tính → VM” rồi bấm “Dán vào VM”.');
    }
  }
  async function copyFromVm() {
    try {
      await navigator.clipboard.writeText(remoteClipboard);
      setClipboardNotice('Đã sao chép văn bản từ VM vào máy tính.');
    } catch { setClipboardNotice('Hãy bôi đen văn bản trong ô “VM → máy tính” và nhấn Ctrl+C để sao chép.'); }
  }
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
    let client, keyboard, mouse, observer, resizeTimer, clipboard;
    let disposed = false;
    let ready = false;
    let copyRequestedAt = 0;
    setRemoteClipboard(''); setClipboardDraft(''); setClipboardNotice(''); setConnected(false);
    // Guacamole cancels mouse events at the display. Focus in the capture
    // phase, before that cancellation, so keyboard events reach this element.
    const focusDesktop = () => element.focus({ preventScroll: true });
    const releaseKeys = () => keyboard?.reset();
    const visibilityChanged = () => { if (document.hidden) releaseKeys(); };
    const clipboardShortcut = event => {
      if (!ready || event.altKey || !(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'v') {
        event.preventDefault(); event.stopImmediatePropagation();
        if (!event.repeat) pasteFromComputer();
      } else if (key === 'c' || key === 'x') copyRequestedAt = Date.now();
    };
    const pasted = event => {
      if (!ready || !event.clipboardData) return;
      event.preventDefault(); event.stopImmediatePropagation();
      pasteText(event.clipboardData.getData('text/plain'));
    };
    element.addEventListener('keydown', clipboardShortcut, true);
    element.addEventListener('paste', pasted, true);
    element.addEventListener('mousedown', focusDesktop, true);
    element.addEventListener('pointerdown', focusDesktop, true);
    element.addEventListener('blur', releaseKeys);
    window.addEventListener('blur', releaseKeys);
    document.addEventListener('visibilitychange', visibilityChanged);
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
      clipboard = desktopClipboard(client, {
        active: () => ready && !disposed,
        onError: message => { if (!disposed) {setClipboardNotice(message); setClipboardOpen(true);} },
        onText: text => {
          if (disposed) return;
          setRemoteClipboard(text);
          setClipboardNotice('Đã nhận văn bản từ VM. Có thể sao chép ở mục Clipboard.');
          // Write to the OS clipboard only following the learner's copy gesture.
          if (Date.now() - copyRequestedAt < 10000) {
            copyRequestedAt = 0;
            const manualCopy = () => {
              if (!disposed) {setClipboardOpen(true); setClipboardNotice('Bấm “Sao chép về máy tính” để cho phép trình duyệt ghi clipboard.');}
            };
            if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(manualCopy);
            else manualCopy();
          }
        },
      });
      clipboardBridge.current = clipboard;
      const display = client.getDisplay();
      element.replaceChildren(display.getElement());
      client.onerror = detail => { if (!disposed) { setError(detail.message || 'Desktop không kết nối được. Kiểm tra VM/RDP/guacd.'); setState('Mất kết nối'); } };
      client.onstatechange = value => {
        ready = value === 3;
        if (!disposed) setConnected(ready);
        if (!disposed) setState(value === 3 ? 'Đã kết nối Windows Desktop' : value === 5 ? 'Đã ngắt Desktop' : 'Đang kết nối Desktop…');
        if (value === 3) resize();
      };
      keyboard = new Guacamole.Keyboard(element);
      keyboard.onkeydown = keysym => { client.sendKeyEvent(1, keysym); return false; };
      keyboard.onkeyup = keysym => client.sendKeyEvent(0, keysym);
      remoteKeys.current = keysyms => {
        if (!ready || disposed) return;
        keyboard.reset();
        focusDesktop();
        for (const keysym of keysyms) client.sendKeyEvent(1, keysym);
        for (const keysym of [...keysyms].reverse()) client.sendKeyEvent(0, keysym);
      };
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
      remoteKeys.current = null;
      clipboardBridge.current = null;
      clipboard?.dispose();
      element.removeEventListener('keydown', clipboardShortcut, true);
      element.removeEventListener('paste', pasted, true);
      element.removeEventListener('mousedown', focusDesktop, true);
      element.removeEventListener('pointerdown', focusDesktop, true);
      element.removeEventListener('blur', releaseKeys);
      window.removeEventListener('blur', releaseKeys);
      document.removeEventListener('visibilitychange', visibilityChanged);
      if (keyboard) { keyboard.reset(); keyboard.onkeydown = null; keyboard.onkeyup = null; }
      if (mouse) mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = null;
      client?.disconnect();
      element?.replaceChildren();
    };
  }, [labId, attempt]);
  return <div ref={panel} className="relative h-full min-h-0 flex flex-col bg-slate-950">
    <div className="min-h-8 px-3 py-0.5 flex flex-wrap items-center gap-2 text-xs border-b border-slate-800 text-slate-300 shrink-0">
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${state === 'Đã kết nối Windows Desktop' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      <span role="status" className="truncate">{state}</span>
      {resolution && <span data-testid="desktop-resolution" className="hidden sm:inline text-slate-500 tabular-nums">{resolution} · PNG</span>}
      <div className="ml-auto flex items-center gap-1">
        <button disabled={!connected} aria-label="Clipboard hai chiều" title="Sao chép/dán văn bản giữa máy tính và VM" onClick={() => setClipboardOpen(value => !value)} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40"><Clipboard size={13} /><span className="hidden lg:inline">Clipboard</span></button>
        <button disabled={!connected} title="Mở Run trong máy ảo. Phím Windows trên bàn phím có thể bị máy chính giữ lại." className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40" onClick={() => remoteKeys.current?.([0xffeb, 0x72])}>Win + R</button>
        <select aria-label="Gửi phím vào máy ảo" disabled={!connected} defaultValue="" className="max-w-36 rounded border border-slate-700 bg-slate-950 px-1 py-1 disabled:opacity-40" onChange={event => {
          const shortcuts = { explorer: [0xffeb, 0x65], windows: [0xffeb], switch: [0xffe9, 0xff09], security: [0xffe3, 0xffe9, 0xffff], rename: [0xffbf], escape: [0xff1b] };
          remoteKeys.current?.(shortcuts[event.target.value] || []);
          event.target.value = '';
        }}>
          <option value="" disabled>Gửi phím vào VM</option>
          <option value="explorer">Win + E</option>
          <option value="windows">Windows / Start</option>
          <option value="switch">Alt + Tab</option>
          <option value="security">Ctrl + Alt + Del</option>
          <option value="rename">F2 · Đổi tên</option>
          <option value="escape">Esc</option>
        </select>
        <button title="Desktop chiếm toàn bộ màn hình; nhấn Esc để thoát" aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình Desktop'} className="p-1.5 rounded hover:bg-slate-800" onClick={toggleFullscreen}>{fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}</button>
        <button className={`flex items-center gap-1.5 px-3 py-1 rounded ${attempt ? 'hover:bg-slate-800' : 'bg-blue-600 text-white'}`} onClick={() => setAttempt(value => value + 1)}>{attempt ? <RefreshCw size={13} /> : <Plug size={13} />}{attempt ? 'Kết nối lại' : 'Kết nối Desktop'}</button>
      </div>
    </div>
    {error && <div role="alert" className="p-3 bg-red-950 text-red-200 text-sm">{error}</div>}
    {clipboardOpen && <section aria-label="Clipboard hai chiều" className="absolute top-10 right-2 z-30 w-[min(400px,calc(100%-16px))] rounded-xl border border-slate-600 bg-slate-900 p-3 shadow-2xl text-xs text-slate-100 space-y-3">
      <div className="flex items-center justify-between"><strong>Clipboard văn bản hai chiều</strong><button aria-label="Đóng Clipboard" onClick={() => setClipboardOpen(false)} className="p-1 hover:bg-slate-700 rounded"><X size={15}/></button></div>
      <p>Chọn ô nhập trên VM trước khi dán. Văn bản nhiều dòng được giữ nguyên.</p>
      <label className="block space-y-1"><span>Máy tính → VM</span><textarea aria-label="Máy tính → VM" value={clipboardDraft} onChange={e=>setClipboardDraft(e.target.value)} maxLength={1048576} className="w-full h-24 resize-y rounded border border-slate-600 bg-slate-950 p-2 font-mono select-text" placeholder="Dán văn bản hoặc lệnh vào đây…" /></label>
      <div className="flex flex-wrap gap-2"><button disabled={!connected} onClick={pasteFromComputer} className="rounded bg-slate-700 px-2 py-1.5 disabled:opacity-40">Dán từ máy tính</button><button disabled={!connected || !clipboardDraft} onClick={()=>pasteText(clipboardDraft)} className="rounded bg-blue-600 px-2 py-1.5 disabled:opacity-40">Dán vào VM</button></div>
      <label className="block space-y-1"><span>VM → máy tính</span><textarea aria-label="VM → máy tính" value={remoteClipboard} readOnly className="w-full h-24 resize-y rounded border border-slate-600 bg-slate-950 p-2 font-mono select-text" placeholder="Chọn văn bản trong VM rồi nhấn Ctrl+C…" /></label>
      <button disabled={!remoteClipboard} onClick={copyFromVm} className="rounded bg-slate-700 px-2 py-1.5 disabled:opacity-40">Sao chép về máy tính</button>
      {clipboardNotice && <p role="status" className="text-blue-200 break-words">{clipboardNotice}</p>}
      <p className="text-slate-400">Hỗ trợ văn bản tối đa 1 MiB; chưa chuyển tệp hoặc ảnh.</p>
    </section>}
    <div ref={container} tabIndex={0} aria-label="Windows Desktop từ xa" className="flex-1 min-h-0 overflow-hidden bg-black outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-blue-500" />
  </div>;
}
