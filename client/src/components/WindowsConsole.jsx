import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import WindowsDesktop from './WindowsDesktop';
import { Monitor, Terminal, PanelLeftClose, PanelLeftOpen, Power, MoreHorizontal } from 'lucide-react';

export default function WindowsConsole({ labId, onActionComplete, onOutput, expanded = false, onToggleExpanded, evidenceRequest = 0 }) {
  const [tab, setTab] = useState('desktop');
  useEffect(() => { if (evidenceRequest) setTab('powershell'); }, [evidenceRequest]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [faultBusy, setFaultBusy] = useState(false);
  const faultLab = Boolean(status?.faultScenario) || ['win-it-printer-spooler-fix', 'win-it-network-dns-troubleshoot', 'win-it-disk-cleanup-recovery'].includes(labId);
  const controller = useRef(null);
  useEffect(() => {
    const pending = new AbortController();
    controller.current = pending;
    async function refresh() {
      try { const value = await api('/api/cloud-vm/status?labId=' + encodeURIComponent(labId), { signal: pending.signal }); if (!pending.signal.aborted) setStatus(value); }
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
      const result = await api('/api/cloud-vm/' + action, { method: 'POST', signal: controller.current.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ labId }) });
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
  async function fault(action) {
    if (!confirm(action === 'prepare' ? 'Nạp sự cố thực hành lên CLIENT01? Chỉ thực hiện khi không có công việc khác trên VM.' : 'Hoàn nguyên các thay đổi do kịch bản tạo? Đây không phải khôi phục toàn bộ VM.')) return;
    setFaultBusy(true); setError('');
    try {
      const session = await api('/api/cloud-vm/fault/' + action, { method: 'POST', signal: controller.current.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ labId, confirm: true }) });
      setStatus(value => ({ ...value, faultSession: session }));
    } catch (reason) { if (reason.name !== 'AbortError') setError(reason.message); }
    finally { setFaultBusy(false); }
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
        {status?.powerStateCode !== 'PowerState/running' ? (
          <button disabled={busy || status?.isBusy || !status?.controlConfigured} onClick={() => power('start')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-40 transition">
            <Power size={13} />
            <span>Bật Máy Ảo</span>
          </button>
        ) : (
          <button disabled={busy || status?.isBusy || !status?.controlConfigured} onClick={() => power('stop')} title="Dừng tính phí compute; ổ đĩa và IP giữ lại vẫn có thể tính phí" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium disabled:opacity-40 transition shadow-xs">
            <Power size={13} />
            <span>Tắt VM</span>
          </button>
        )}
        <details className="relative">
          <summary aria-label="Thao tác máy ảo" className="list-none cursor-pointer p-1.5 rounded hover:bg-slate-800"><MoreHorizontal size={17} /></summary>
          <div className="absolute right-0 top-full mt-2 z-30 min-w-44 p-1.5 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
            <a className="block px-3 py-2 rounded hover:bg-slate-800" href={'/api/cloud-vm/connect.rdp?labId=' + encodeURIComponent(labId)}>Tải RDP dự phòng</a>
            <button disabled={busy || status?.isBusy || !status?.controlConfigured} onClick={() => power('stop')} className="block text-left w-full px-3 py-2 rounded text-red-300 hover:bg-red-950 disabled:opacity-40">Tắt / Deallocate</button>
          </div>
        </details>
      </div>
    </div>
    {(error || status?.error || status?.operationError) && <div role="alert" className="p-3 bg-red-950 text-red-200 text-xs">{error || status.error || status.operationError}</div>}
    {faultLab && <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 px-3 py-2 text-xs">
      <span role="status">Sự cố: {faultBusy ? 'đang xử lý, có thể mất vài phút' : status?.faultSession?.state || 'chưa nạp'}</span>
      <button disabled={faultBusy || executing || status?.isBusy || status?.powerStateCode !== 'PowerState/running'} onClick={() => fault('prepare')} className="rounded bg-amber-700 px-2 py-1 disabled:opacity-40">Chuẩn bị sự cố</button>
      <button disabled={faultBusy || executing || status?.isBusy || !status?.faultSession || status.faultSession.state === 'reset'} onClick={() => fault('reset')} className="rounded border border-slate-600 px-2 py-1 disabled:opacity-40">Hoàn nguyên kịch bản</button>
      <span className="text-slate-400">Cần baseline và kiểm thử khôi phục trước khi nạp lỗi.</span>
    </div>}
    <div className={`flex-1 min-h-0 ${tab === 'desktop' ? '' : 'hidden'}`}><WindowsDesktop labId={labId} /></div>
    <div className={`flex-1 min-h-0 flex-col ${tab === 'powershell' ? 'flex' : 'hidden'}`}>
      <p className="p-3 text-xs text-amber-200 bg-amber-950/30">Lệnh chạy trên VM thật qua Azure Agent, quyền SYSTEM, thư mục C:\LabEx\Labs\{labId}. Mỗi lệnh thường mất từ 20 giây; phiên lệnh mới không giữ biến shell của lệnh trước.</p>
      <pre aria-label="Kết quả PowerShell VM" className="flex-1 min-h-0 overflow-auto whitespace-pre-wrap p-3 text-xs">{output.join('\n\n')}</pre>
      {executing && <div role="status" className="p-2 text-xs text-blue-300">Đang chờ VM thực thi PowerShell…</div>}
      <form onSubmit={run} className="p-3 flex gap-2 border-t border-slate-700">
        <textarea aria-label="Lệnh PowerShell trên VM" value={command} onChange={event => setCommand(event.target.value)} disabled={executing || faultBusy || status?.isBusy}
          rows={3} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}
          className="flex-1 min-w-0 min-h-20 max-h-56 resize-y bg-slate-900 p-2 rounded font-mono text-sm"
          placeholder="Dán nguyên khối PowerShell tại đây. Ctrl+Enter hoặc bấm Chạy để gửi." />
        <button disabled={executing || faultBusy || status?.isBusy || !command.trim()} className="px-3 bg-blue-600 rounded disabled:opacity-40">Chạy</button>
      </form>
    </div>
  </div>;
}
