import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Shield, AlertTriangle, CheckCircle, RefreshCw, 
  Terminal as TerminalIcon, Play, Square, RotateCcw,
  Monitor, Key, ExternalLink, Power, Download, Check,
  Copy, CornerDownLeft, Trash2, Cpu, HardDrive, Wifi, Info,
  AlertCircle
} from 'lucide-react';

const LAB_SUGGESTIONS = {
  'win-powershell-basics': [
    'Get-Command *-Service',
    '$PSVersionTable.PSVersion',
    'Get-Process | Select-Object -First 5',
    'Get-Help Get-Service -Examples'
  ],
  'win-powershell-scripting-automation': [
    'Get-Service | Where-Object {$_.Status -eq "Running"}',
    'Get-ChildItem -Path C:\\ -Directory',
    'Test-Path "C:\\Windows\\System32"',
    'Get-Date -Format "yyyy-MM-dd HH:mm:ss"'
  ],
  'win-server-ad-users-groups': [
    'Get-LocalUser',
    'Get-LocalGroup',
    'net user adminlab',
    'whoami /all'
  ],
  'win-server-file-storage-share': [
    'Get-SmbShare',
    'Get-Volume',
    'Get-Disk',
    'Get-FileHash -Algorithm SHA256 "C:\\Windows\\notepad.exe"'
  ],
  'win-server-dns-dhcp': [
    'Resolve-DnsName google.com',
    'Get-NetIPAddress -AddressFamily IPv4',
    'Get-NetIPConfiguration',
    'Test-NetConnection -ComputerName 127.0.0.1 -Port 80'
  ],
  'win-server-iis-web': [
    'Get-Service -Name W3SVC',
    'Get-Website',
    'netstat -ano | findstr :80',
    'Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing'
  ],
  'win-file-system-ntfs': [
    'Get-Acl "C:\\Windows"',
    'Get-Volume -DriveLetter C',
    'fsutil fsinfo drives',
    'icacls "C:\\Users"'
  ],
  'win-manage-services-processes': [
    'Get-Service -Name wuauserv, Spooler',
    'Get-Process | Sort-Object -Property CPU -Descending | Select-Object -First 5',
    'Stop-Process -Name notepad -Force -ErrorAction SilentlyContinue',
    'Get-CimInstance Win32_OperatingSystem'
  ],
  'win-event-log-analysis': [
    'Get-EventLog -LogName System -Newest 5',
    'Get-EventLog -LogName Application -EntryType Error -Newest 5',
    'Get-WinEvent -ListLog * | Where-Object {$_.RecordCount -gt 0} | Select-Object -First 6'
  ],
  'win-troubleshoot-network-connectivity': [
    'Test-NetConnection -ComputerName 8.8.8.8 -InformationLevel Detailed',
    'ipconfig /all',
    'route print -4',
    'Get-NetRoute -DestinationPrefix "0.0.0.0/0"'
  ],
  'win-troubleshoot-failed-services': [
    'Get-Service | Where-Object {$_.StartType -eq "Automatic" -and $_.Status -ne "Running"}',
    'Start-Service -Name Spooler -ErrorAction SilentlyContinue',
    'Get-EventLog -LogName System -Source "Service Control Manager" -Newest 5'
  ]
};

export default function WindowsConsole({ labId, onActionComplete }) {
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'rdp_info'
  const [vmStatus, setVmStatus] = useState({
    powerState: 'VM deallocated',
    publicIp: '20.40.49.168',
    isBusy: false
  });
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  // Interactive PowerShell State
  const [inputCmd, setInputCmd] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState(() => [
    {
      id: 1,
      type: 'system',
      text: 'Windows PowerShell 5.1 / PowerShell 7 Cloud Interactive Console\r\nCopyright (C) Microsoft Corporation. All rights reserved.\r\n'
    },
    {
      id: 2,
      type: 'info',
      text: 'Chào mừng bạn đến với môi trường thực hành Windows Server & PowerShell. Bạn có thể gõ trực tiếp lệnh cmdlet bên dưới hoặc bấm gợi ý để làm bài ngay trên trình duyệt.'
    }
  ]);
  const [cmdIndex, setCmdIndex] = useState(-1);
  const [executedCmds, setExecutedCmds] = useState([]);

  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll terminal
  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, activeTab]);

  // Fetch VM live state
  const refreshVmStatus = async () => {
    try {
      const res = await fetch('/api/cloud-vm/status');
      if (res.ok) {
        const data = await res.json();
        setVmStatus(data);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refreshVmStatus();
    const interval = setInterval(refreshVmStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStartVm = async () => {
    setIsStarting(true);
    try {
      await fetch('/api/cloud-vm/start', { method: 'POST' });
      await refreshVmStatus();
      alert('Đang kiểm tra kết nối với Azure VM. Bạn cũng có thể bấm nút "Start" trên Azure Portal để máy ảo khởi động nhanh nhất.');
    } catch (e) {
      alert('Không thể gửi lệnh khởi động: ' + e.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopVm = async () => {
    if (!confirm('Bạn có chắc muốn Deallocate (Tắt máy ảo) để dừng tính phí Azure ngay lập tức?')) return;
    setIsStopping(true);
    try {
      await fetch('/api/cloud-vm/stop', { method: 'POST' });
      await refreshVmStatus();
    } catch (e) {
      alert('Không thể gửi lệnh dừng: ' + e.message);
    } finally {
      setIsStopping(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const handleRdpDownloadClick = (e) => {
    if (!isRunning) {
      const continueDownload = confirm(
        '⚠️ LƯU Ý QUAN TRỌNG TỪ HỆ THỐNG:\n\n' +
        'Máy ảo trên Azure của bạn hiện đang ở trạng thái TẮT (Stopped / Deallocated) để tiết kiệm credit.\n\n' +
        '👉 Để màn hình Desktop bung lên được, bạn cần vào Azure Portal (portal.azure.com) và bấm nút "Start" để bật máy trước.\n' +
        '👉 Khi máy đã bật (đèn xanh Running), bạn chỉ cần CLICK ĐÚP VÀO FILE .RDP vừa tải về là Remote Desktop của Windows sẽ tự động mở màn hình máy ảo Windows Server 2022 thật!\n\n' +
        'Bạn có muốn tiếp tục tải file cấu hình .rdp về máy không?'
      );
      if (!continueDownload) {
        e.preventDefault();
      }
    }
  };

  // Run PowerShell Command
  const runCommand = async (cmdToRun) => {
    const cmd = (cmdToRun || inputCmd).trim();
    if (!cmd) return;

    if (cmd.toLowerCase() === 'cls' || cmd.toLowerCase() === 'clear') {
      setHistory([]);
      setInputCmd('');
      return;
    }

    const commandEntry = {
      id: Date.now(),
      type: 'command',
      prompt: 'PS C:\\Users\\Administrator> ' + cmd
    };

    setHistory(prev => [...prev, commandEntry]);
    setExecutedCmds(prev => [...prev, cmd]);
    setCmdIndex(-1);
    setInputCmd('');
    setIsExecuting(true);

    try {
      const res = await fetch('/api/cloud-vm/powershell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labId, command: cmd })
      });

      if (!res.ok) {
        throw new Error(`Lỗi máy chủ (${res.status})`);
      }

      const data = await res.json();
      const outputEntry = {
        id: Date.now() + 1,
        type: data.exitCode === 0 ? 'output' : 'error',
        text: data.stdout || data.stderr || '(Lệnh hoàn tất không có output)',
        exitCode: data.exitCode
      };

      setHistory(prev => [...prev, outputEntry]);
      onActionComplete?.();
    } catch (err) {
      setHistory(prev => [...prev, {
        id: Date.now() + 1,
        type: 'error',
        text: `Lỗi thực thi lệnh: ${err.message}`
      }]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!executedCmds.length) return;
      const nextIndex = cmdIndex === -1 ? executedCmds.length - 1 : Math.max(0, cmdIndex - 1);
      setCmdIndex(nextIndex);
      setInputCmd(executedCmds[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdIndex === -1) return;
      const nextIndex = cmdIndex + 1;
      if (nextIndex >= executedCmds.length) {
        setCmdIndex(-1);
        setInputCmd('');
      } else {
        setCmdIndex(nextIndex);
        setInputCmd(executedCmds[nextIndex]);
      }
    }
  };

  const suggestions = LAB_SUGGESTIONS[labId] || [
    'Get-Command',
    '$PSVersionTable',
    'Get-Service',
    'Get-Process'
  ];

  const isRunning = vmStatus.powerState === 'VM running';

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-2xl font-sans select-none relative">
      
      {/* 1. TOP AZURE VM STATUS BAR & VIEW SWITCHER */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between shrink-0 text-xs gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isRunning 
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse' 
                : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]'
            }`}></span>
            <span className="font-bold text-white text-xs hidden sm:inline">
              Azure VM: {isRunning ? 'Running (Đang chạy)' : 'Stopped (Đang tắt)'}
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 ${
                activeTab === 'terminal' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}>
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>PowerShell Console</span>
            </button>
            <button
              onClick={() => setActiveTab('rdp_info')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 ${
                activeTab === 'rdp_info' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}>
              <Monitor className="w-3.5 h-3.5" />
              <span>Cloud VM & RDP</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/api/cloud-vm/connect.rdp"
            download="LabEx-WinServer.rdp"
            onClick={handleRdpDownloadClick}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1.5"
            title="Tải tệp RDP cấu hình sẵn để mở Desktop Windows Server">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mở Màn Hình Desktop (RDP)</span>
            <span className="md:hidden">RDP</span>
          </a>

          {isRunning ? (
            <button
              onClick={handleStopVm}
              disabled={isStopping}
              className="px-2.5 py-1.5 rounded-lg bg-rose-900/70 hover:bg-rose-800 text-rose-200 border border-rose-700/60 font-semibold text-[11px] transition flex items-center gap-1">
              <Square className="w-3 h-3 text-rose-400" />
              <span>{isStopping ? 'Đang tắt...' : 'Tắt Máy'}</span>
            </button>
          ) : (
            <button
              onClick={handleStartVm}
              disabled={isStarting}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1">
              <Power className="w-3 h-3" />
              <span>{isStarting ? 'Đang kiểm tra...' : 'Bật Máy Ảo'}</span>
            </button>
          )}

          <button
            onClick={refreshVmStatus}
            title="Làm mới trạng thái VM"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT: POWERSHELL TERMINAL OR RDP INFO */}
      {activeTab === 'terminal' ? (
        <div className="flex-1 min-h-0 flex flex-col bg-[#0c1021] text-slate-100 font-mono text-xs select-text">
          
          {/* Quick Cmdlet Suggestions Toolbar */}
          <div className="bg-slate-900/90 border-b border-slate-800/80 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0 select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Play className="w-2.5 h-2.5 text-blue-400" /> Gợi ý lệnh bài lab:
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => runCommand(sug)}
                  disabled={isExecuting}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-900/60 hover:text-blue-200 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap transition-colors flex items-center gap-1">
                  <span>{sug}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setHistory([])}
              title="Xóa màn hình console"
              className="ml-auto p-1 text-slate-500 hover:text-slate-300 transition shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Terminal Output History */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 font-mono text-xs leading-relaxed">
            {history.map(item => {
              if (item.type === 'system') {
                return (
                  <div key={item.id} className="text-slate-400 whitespace-pre-wrap">
                    {item.text}
                  </div>
                );
              }
              if (item.type === 'info') {
                return (
                  <div key={item.id} className="text-sky-300/90 bg-sky-950/40 border border-sky-900/50 p-2.5 rounded-lg mb-2">
                    {item.text}
                  </div>
                );
              }
              if (item.type === 'command') {
                return (
                  <div key={item.id} className="text-amber-300 font-bold flex items-start gap-1 pt-2">
                    <span>{item.prompt}</span>
                  </div>
                );
              }
              if (item.type === 'error') {
                return (
                  <div key={item.id} className="text-rose-400 bg-rose-950/20 p-2 rounded border border-rose-900/30 whitespace-pre-wrap">
                    {item.text}
                  </div>
                );
              }
              return (
                <div key={item.id} className="text-slate-200 whitespace-pre-wrap pl-2 border-l-2 border-blue-500/30">
                  {item.text}
                </div>
              );
            })}

            {isExecuting && (
              <div className="text-blue-400 flex items-center gap-2 pt-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Đang thực thi lệnh PowerShell...</span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* PowerShell Interactive Input Line */}
          <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2 shrink-0">
            <span className="text-blue-400 font-bold select-none whitespace-nowrap">
              PS C:\Users\Administrator&gt;
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputCmd}
              onChange={e => setInputCmd(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isExecuting}
              placeholder="Nhập lệnh PowerShell và nhấn Enter (ví dụ: Get-Service, $PSVersionTable)..."
              className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-xs placeholder:text-slate-600"
              autoFocus
            />
            <button
              onClick={() => runCommand()}
              disabled={isExecuting || !inputCmd.trim()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded text-xs font-semibold flex items-center gap-1 transition">
              <span>Chạy</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* 3. CLOUD VM & RDP CONNECTION TAB */
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-950 to-slate-900">
          
          {/* Azure VM Offline Warning Banner if stopped */}
          {!isRunning && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/50 flex items-start gap-3 text-amber-200 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-white text-sm">Máy ảo trên Azure hiện đang TẮT (Stopped / Deallocated)</div>
                <p className="leading-relaxed">
                  Bạn đã tắt máy ảo trên Azure để dừng tính phí credit. Khi máy ảo đang tắt, Remote Desktop sẽ không thể kết nối được và màn hình sẽ không lên.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  <a 
                    href="https://portal.azure.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm">
                    <ExternalLink className="w-3.5 h-3.5" /> Mở Azure Portal để Bấm Start
                  </a>
                  <button
                    onClick={() => setActiveTab('terminal')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition border border-slate-700">
                    <TerminalIcon className="w-3.5 h-3.5 text-blue-400" /> Dùng PowerShell Console Làm Bài Ngay
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Real Cloud VM Overview Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-slate-900 border border-blue-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Máy Ảo Windows Server 2022 Datacenter (Azure Cloud)</h2>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Máy ảo vật lý độc lập chạy trên hạ tầng Microsoft Azure (Khu vực Central India, IP: 20.40.49.168). Hỗ trợ song song: 
                <strong> PowerShell Web Console</strong> trực tiếp trong trình duyệt và <strong>Remote Desktop (RDP)</strong> màn hình Desktop Windows Server.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/api/cloud-vm/connect.rdp"
                download="LabEx-WinServer.rdp"
                onClick={handleRdpDownloadClick}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Mở Màn Hình Desktop RDP</span>
              </a>
            </div>
          </div>

          {/* Connection Parameters & Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Địa chỉ IP Public</span>
                <button 
                  onClick={() => copyToClipboard(vmStatus.publicIp || '20.40.49.168', 'ip')}
                  className="text-blue-400 hover:underline flex items-center gap-1 lowercase text-xs">
                  {copiedKey === 'ip' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'ip' ? 'đã copy' : 'copy'}</span>
                </button>
              </div>
              <div className="text-sm font-mono font-bold text-white bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                {vmStatus.publicIp || '20.40.49.168'}
              </div>
              <div className="text-[11px] text-slate-500">Cổng RDP: 3389 / PowerShell Web: Cổng 5000</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Tài khoản Quản Trị</span>
                <button 
                  onClick={() => copyToClipboard('adminlab', 'user')}
                  className="text-blue-400 hover:underline flex items-center gap-1 lowercase text-xs">
                  {copiedKey === 'user' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'user' ? 'đã copy' : 'copy'}</span>
                </button>
              </div>
              <div className="text-sm font-mono font-bold text-sky-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                adminlab
              </div>
              <div className="text-[11px] text-slate-500">Quyền hạn: Built-in Administrator</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Mật khẩu Đăng Nhập</span>
                <button 
                  onClick={() => copyToClipboard('LabEx2026@Pass!', 'pass')}
                  className="text-blue-400 hover:underline flex items-center gap-1 lowercase text-xs">
                  {copiedKey === 'pass' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'pass' ? 'đã copy' : 'copy'}</span>
                </button>
              </div>
              <div className="text-sm font-mono font-bold text-amber-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                LabEx2026@Pass!
              </div>
              <div className="text-[11px] text-slate-500">Dùng đăng nhập RDP và xác thực quản trị</div>
            </div>
          </div>

          {/* Clear explanation of RDP file and how to open Desktop */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Tại sao lại tải file .rdp về máy và làm sao để mở màn hình?</span>
            </div>
            <p className="leading-relaxed">
              Tệp <code>LabEx-WinServer.rdp</code> là file cấu hình Remote Desktop chuẩn của Microsoft. Do Windows Server 2022 trên Azure có giao diện đồ họa Desktop đầy đủ, trình duyệt web không tự hiển thị trực tiếp được mà cần ứng dụng Remote Desktop Connection chính chủ của Windows.
            </p>
            <p className="leading-relaxed font-semibold text-emerald-300">
              👉 Sau khi bật máy ảo trên Azure thành công, bạn chỉ cần <strong>CLICK ĐÚP VÀO FILE .RDP VỪA TẢI</strong> trong thư mục Downloads của máy tính, màn hình máy ảo Windows Server sẽ tự động bung ra trước mắt bạn!
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
