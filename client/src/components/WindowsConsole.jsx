import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import WindowsDesktop from './WindowsDesktop';
import { Monitor, Terminal, PanelLeftClose, PanelLeftOpen, Power, MoreHorizontal } from 'lucide-react';

export default function WindowsConsole({ labId, onActionComplete, onOutput, expanded = false, onToggleExpanded }) {
  const [tab, setTab] = useState('desktop');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const controller = useRef(null);
  useEffect(() => {
    const pending = new AbortController();
    controller.current = pending;
    async function refresh() {
      try { const value = await api('/api/cloud-vm/status', { signal: pending.signal }); if (!pending.signal.aborted) setStatus(value); }
      catch (reason) { if (!pending.signal.aborted) setError(reason.message); }
    }
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => { pending.abort(); clearInterval(interval); };
  }, [labId]);
  async function power(action) {
    if (action === 'stop' && !confirm('Deallocate máy ảo Azure? Mọi phiên Desktop và lệnh đang chạy trên VM sẽ bị ngắt.')) return;
    setBusy(true); setError('');
    try {
      const result = await api('/api/cloud-vm/' + action, { method: 'POST', signal: controller.current.signal });
      setStatus(value => ({ ...value, powerState: result.powerState, isBusy: true }));
    } catch (reason) { if (reason.name !== 'AbortError') setError(reason.message); }
    finally { setBusy(false); }
  }
  async function run(event) {
    event.preventDefault();
    if (!command.trim() || executing) return;
    const submitted = command.trim();
    setCommand(''); setExecuting(true); setError('');
    setOutput(value => [...value, 'PS> ' + submitted]);
    try {
      const result = await api('/api/cloud-vm/powershell', { method: 'POST', signal: controller.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labId, command: submitted }) });
      onOutput?.(`PS> ${submitted}\n${result.stdout || ''}\n${result.stderr || ''}\nexit=${result.exitCode}\n`);
      setOutput(value => [...value, `${result.stdout || ''}${result.stderr ? '\n' + result.stderr : ''}\n[${result.target} / ${result.computerName} / ${result.identity}] exit=${result.exitCode}${result.outputTruncated ? ' — output đã rút gọn' : ''}`]);
      onActionComplete?.();
    } catch (reason) { if (reason.name !== 'AbortError') { setError(reason.message); onOutput?.(`PS> ${submitted}\n${reason.message}\n`); } }
    finally { setExecuting(false); }
  }
  return <div className="flex-1 min-h-0 flex flex-col bg-slate-950 text-slate-100 rounded-lg border border-slate-700 overflow-hidden">
    <div className="min-h-10 px-3 py-1 border-b border-slate-700 flex flex-wrap items-center gap-2 text-xs shrink-0">
      <Monitor size={16} className="text-blue-400 shrink-0" />
      <div className="min-w-0 mr-1 flex flex-wrap items-center gap-x-2"><strong className="truncate">{status?.vmName || 'Windows Azure VM'}</strong>
        <span role="status" className="text-[10px] text-slate-400">{status?.powerState || 'Đang đọc trạng thái Azure…'}{status?.isBusy ? ' · đang xử lý' : ''}</span></div>
      <div className="flex bg-slate-900 rounded-lg p-0.5 gap-0.5" aria-label="Chế độ Windows">
        <button className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${tab === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`} onClick={() => setTab('desktop')}><Monitor size={13} />Desktop</button>
        <button className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${tab === 'powershell' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`} aria-label="PowerShell trên Azure VM" onClick={() => setTab('powershell')}><Terminal size={13} />PowerShell</button>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        {onToggleExpanded && <button aria-label={expanded ? 'Hiện hướng dẫn' : 'Mở rộng máy ảo'} title={expanded ? 'Hiện lại hướng dẫn bên cạnh máy ảo' : 'Ẩn hướng dẫn để dành toàn bộ chiều rộng cho máy ảo'} onClick={onToggleExpanded} className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-700 hover:bg-slate-800">{expanded ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}<span className="hidden lg:inline">{expanded ? 'Hiện hướng dẫn' : 'Mở rộng'}</span></button>}
        {status?.powerStateCode !== 'PowerState/running' && <button disabled={busy || status?.isBusy || !status?.controlConfigured} onClick={() => power('start')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 rounded disabled:opacity-40"><Power size={13} />Bật Máy Ảo</button>}
        <details className="relative">
          <summary aria-label="Thao tác máy ảo" className="list-none cursor-pointer p-1.5 rounded hover:bg-slate-800"><MoreHorizontal size={17} /></summary>
          <div className="absolute right-0 top-full mt-2 z-30 min-w-44 p-1.5 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
            <a className="block px-3 py-2 rounded hover:bg-slate-800" href="/api/cloud-vm/connect.rdp">Tải RDP dự phòng</a>
            <button disabled={busy || status?.isBusy || !status?.controlConfigured} onClick={() => power('stop')} className="block text-left w-full px-3 py-2 rounded text-red-300 hover:bg-red-950 disabled:opacity-40">Tắt / Deallocate</button>
          </div>
        </details>
      </div>
    </div>
    {(error || status?.error || status?.operationError) && <div role="alert" className="p-3 bg-red-950 text-red-200 text-xs">{error || status.error || status.operationError}</div>}
    <div className={`flex-1 min-h-0 ${tab === 'desktop' ? '' : 'hidden'}`}><WindowsDesktop labId={labId} /></div>
    <div className={`flex-1 min-h-0 flex-col ${tab === 'powershell' ? 'flex' : 'hidden'}`}>
      <p className="p-3 text-xs text-amber-200 bg-amber-950/30">Lệnh chạy trên VM thật qua Azure Agent, quyền SYSTEM, thư mục C:\LabEx\Labs\{labId}. Mỗi lệnh thường mất từ 20 giây; phiên lệnh mới không giữ biến shell của lệnh trước.</p>
      <pre aria-label="Kết quả PowerShell VM" className="flex-1 min-h-0 overflow-auto whitespace-pre-wrap p-3 text-xs">{output.join('\n\n')}</pre>
      {executing && <div role="status" className="p-2 text-xs text-blue-300">Đang chờ VM thực thi PowerShell…</div>}
      <form onSubmit={run} className="p-3 flex gap-2 border-t border-slate-700">
        <input aria-label="Lệnh PowerShell trên VM" value={command} onChange={event => setCommand(event.target.value)} disabled={executing} className="flex-1 min-w-0 bg-slate-900 p-2 rounded font-mono text-sm" placeholder="Get-Service" />
        <button disabled={executing || !command.trim()} className="px-3 bg-blue-600 rounded disabled:opacity-40">Chạy</button>
      </form>
    </div>
  </div>;
}
