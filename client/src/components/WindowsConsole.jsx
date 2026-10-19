import React, { useState, useEffect } from 'react';
import { 
  Server, Shield, AlertTriangle, CheckCircle, RefreshCw, 
  Terminal, Play, Square, RotateCcw, Search, Folder, 
  User, Users, Settings, Activity, Database, Globe,
  HelpCircle, Monitor, HardDrive, Key, FileText, ChevronRight,
  Minimize2, Maximize2, X, Cpu, Clock, Wifi, Volume2, Bell,
  Sliders, ExternalLink, Lock, Unlock, Eye, Edit3
} from 'lucide-react';

export default function WindowsConsole({ labId, onActionComplete }) {
  // Modes: 'desktop' (full VM desktop experience) or 'tabs' (direct console tabs)
  const [viewMode, setViewMode] = useState('desktop'); 
  const [activeWindow, setActiveWindow] = useState('server-manager'); 
  const [openWindows, setOpenWindows] = useState(['server-manager']);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Live Clock updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // 1. Simulated Services State
  const [services, setServices] = useState([
    { name: 'Spooler', displayName: 'Print Spooler', status: 'Stopped', startup: 'Automatic', desc: 'Quản lý hàng đợi in ấn và gửi tài liệu tới máy in.' },
    { name: 'W32Time', displayName: 'Windows Time', status: 'Running', startup: 'Automatic', desc: 'Duy trì đồng bộ hóa ngày giờ trên mạng Domain.' },
    { name: 'LanmanServer', displayName: 'Server (SMB File Sharing)', status: 'Running', startup: 'Automatic', desc: 'Hỗ trợ chia sẻ tệp, máy in và RPC qua mạng.' },
    { name: 'DNS', displayName: 'DNS Server', status: 'Running', startup: 'Automatic', desc: 'Phân giải tên miền máy chủ và định vị Domain Controller.' },
    { name: 'W3SVC', displayName: 'World Wide Web Publishing Service', status: 'Stopped', startup: 'Manual', desc: 'Cung cấp kết nối web và quản lý trang qua IIS.' },
    { name: 'Dhcp', displayName: 'DHCP Client', status: 'Running', startup: 'Automatic', desc: 'Đăng ký và cập nhật địa chỉ IP và bản ghi DNS.' },
  ]);

  // 2. Simulated Event Viewer Logs State
  const [selectedLogCategory, setSelectedLogCategory] = useState('System');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventFilter, setEventFilter] = useState('');
  const [eventLogs, setEventLogs] = useState([
    { id: 1, log: 'System', eventId: 7034, level: 'Error', source: 'Service Control Manager', time: '10:14:22', message: 'Dịch vụ Print Spooler đã bị dừng đột ngột. Đây là lần thứ 1 xảy ra sự cố này.', fixed: false },
    { id: 2, log: 'Security', eventId: 4625, level: 'Warning', source: 'Microsoft-Windows-Security-Auditing', time: '10:12:05', message: 'Tài khoản không đăng nhập được. Lý do: Sai mật khẩu người dùng quá 5 lần liên tiếp (Tài khoản: jdoe).', fixed: false },
    { id: 3, log: 'System', eventId: 7000, level: 'Error', source: 'Service Control Manager', time: '09:58:11', message: 'Dịch vụ W3SVC không khởi động được do phụ thuộc vào dịch vụ WAS chưa kích hoạt.', fixed: false },
    { id: 4, log: 'Application', eventId: 1000, level: 'Error', source: 'Application Error', time: '09:45:00', message: 'Ứng dụng lỗi CRM_Sync.exe, phiên bản 2.1.0, module ntdll.dll bị crash tại địa chỉ 0x0004f21.', fixed: true },
    { id: 5, log: 'System', eventId: 41, level: 'Critical', source: 'Kernel-Power', time: '08:30:19', message: 'Hệ thống đã tự khởi động lại mà không qua tắt máy an toàn trước đó (Mất nguồn hoặc BSOD).', fixed: true },
  ]);

  // 3. Simulated Active Directory Users and Computers (ADUC)
  const [adUsers, setAdUsers] = useState([
    { username: 'jdoe', fullName: 'John Doe', ou: 'Sales', status: 'Locked Out', role: 'Sales Executive' },
    { username: 'mchen', fullName: 'Mary Chen', ou: 'Finance', status: 'Active', role: 'Senior Accountant' },
    { username: 'alex.admin', fullName: 'Alex System Admin', ou: 'IT-Admins', status: 'Active', role: 'Domain Administrator' },
    { username: 'intern01', fullName: 'Tech Intern', ou: 'IT-Admins', status: 'Disabled', role: 'Junior SysAdmin Intern' },
  ]);

  // 4. Simulated Task Manager Processes
  const [processes, setProcesses] = useState([
    { pid: 4820, name: 'HighCPU_StuckQuery.exe', user: 'SYSTEM', cpu: 84.5, mem: 412, status: 'Not Responding', desc: 'Truy vấn cơ sở dữ liệu bị treo vòng lặp vô tận gây nghẽn CPU.' },
    { pid: 1044, name: 'svchost.exe (DnsClient)', user: 'NETWORK SERVICE', cpu: 0.8, mem: 48, status: 'Running', desc: 'Dịch vụ phân giải DNS của Windows.' },
    { pid: 612, name: 'lsass.exe', user: 'SYSTEM', cpu: 1.2, mem: 64, status: 'Running', desc: 'Local Security Authority Subsystem Service' },
    { pid: 824, name: 'w3wp.exe (DefaultAppPool)', user: 'IIS APPPOOL\\DefaultAppPool', cpu: 0.4, mem: 128, status: 'Running', desc: 'IIS Worker Process' },
    { pid: 1420, name: 'explorer.exe', user: 'CORP\\Administrator', cpu: 1.5, mem: 92, status: 'Running', desc: 'Windows Explorer Shell' },
    { pid: 2100, name: 'powershell.exe', user: 'CORP\\Administrator', cpu: 0.2, mem: 56, status: 'Running', desc: 'Windows PowerShell Host' },
  ]);

  // 5. Simulated IIS Web Sites
  const [iisSites, setIisSites] = useState([
    { id: 1, name: 'Default Web Site', port: 80, path: 'C:\\inetpub\\wwwroot', state: 'Stopped', binding: 'http/*:80:' },
    { id: 2, name: 'Internal HR Portal', port: 8080, path: 'C:\\inetpub\\hr_portal', state: 'Started', binding: 'http/*:8080:' }
  ]);
  const [iisBrowserUrl, setIisBrowserUrl] = useState('http://localhost:80');

  // 6. Simulated Windows Defender Firewall Rules
  const [firewallRules, setFirewallRules] = useState([
    { id: 'http-in', name: 'World Wide Web Services (HTTP Traffic-In)', port: '80/TCP', action: 'Block', direction: 'Inbound', desc: 'Quy tắc cho phép người dùng truy cập web server IIS.' },
    { id: 'rdp-in', name: 'Remote Desktop - User Mode (TCP-In)', port: '3389/TCP', action: 'Allow', direction: 'Inbound', desc: 'Kết nối quản trị từ xa Remote Desktop (RDP).' },
    { id: 'smb-in', name: 'File and Printer Sharing (SMB-In)', port: '445/TCP', action: 'Allow', direction: 'Inbound', desc: 'Chia sẻ tệp qua mạng Windows nội bộ.' },
    { id: 'dns-in', name: 'DNS Server (UDP-In)', port: '53/UDP', action: 'Allow', direction: 'Inbound', desc: 'Phân giải tên miền DNS cho client mạng nội bộ.' }
  ]);

  // 7. Simulated Registry Editor (regedit)
  const [regSelectedKey, setRegSelectedKey] = useState('TerminalServer');
  const [regValues, setRegValues] = useState({
    TerminalServer: [
      { name: 'fDenyTSConnections', type: 'REG_DWORD', data: '0x00000000 (0)', desc: '0 = Cho phép kết nối RDP, 1 = Cấm kết nối RDP' },
      { name: 'TSAppCompat', type: 'REG_DWORD', data: '0x00000001 (1)', desc: 'Khả năng tương thích ứng dụng Terminal Server' }
    ],
    Spooler: [
      { name: 'DependOnService', type: 'REG_MULTI_SZ', data: 'RPCSS', desc: 'Các dịch vụ phụ thuộc của Print Spooler' },
      { name: 'Start', type: 'REG_DWORD', data: '0x00000002 (2)', desc: '2 = Automatic, 3 = Manual, 4 = Disabled' }
    ]
  });

  // 8. PowerShell History
  const [psHistory, setPsHistory] = useState([
    { type: 'output', text: 'Windows PowerShell 5.1 (Build 20348 - Windows Server 2022 Datacenter)\nConnected to Host: LabEx-WinServer (Cloud VM: 20.40.49.168 - Central India)\nRun commands directly or connect via 1-Click RDP file above.\nType "help" for a list of common administration cmdlets.\n' }
  ]);
  const [psInput, setPsInput] = useState('');

  // Window Management Actions
  const openAppWindow = (appName) => {
    if (!openWindows.includes(appName)) {
      setOpenWindows(prev => [...prev, appName]);
    }
    setActiveWindow(appName);
    setStartMenuOpen(false);
  };

  const closeAppWindow = (appName) => {
    setOpenWindows(prev => prev.filter(w => w !== appName));
    if (activeWindow === appName) {
      const remaining = openWindows.filter(w => w !== appName);
      setActiveWindow(remaining.length ? remaining[remaining.length - 1] : null);
    }
  };

  // Actions
  const toggleService = (name, desiredStatus) => {
    setServices(prev => prev.map(s => {
      if (s.name === name) {
        const nextStatus = desiredStatus || (s.status === 'Running' ? 'Stopped' : 'Running');
        return { ...s, status: nextStatus };
      }
      return s;
    }));
    const running = (desiredStatus || (services.find(s => s.name === name)?.status === 'Running' ? 'Stopped' : 'Running')) === 'Running';
    if (name === 'Spooler') {
      setEventLogs(prev => prev.map(e => e.eventId === 7034 ? { ...e, fixed: running } : e));
      if (running && onActionComplete) onActionComplete('service_spooler_started');
    }
    if (name === 'W3SVC') {
      setEventLogs(prev => prev.map(e => e.eventId === 7000 ? { ...e, fixed: running } : e));
      if (running && onActionComplete) onActionComplete('service_w3svc_started');
    }
  };

  const unlockUser = (username) => {
    setAdUsers(prev => prev.map(u => u.username === username ? { ...u, status: 'Active' } : u));
    setEventLogs(prev => prev.map(e => (e.eventId === 4625 ? { ...e, fixed: true } : e)));
    if (onActionComplete) onActionComplete('unlock_user');
  };

  const killProcess = (pid) => {
    setProcesses(prev => prev.filter(p => p.pid !== pid));
    if (pid === 4820) {
      if (onActionComplete) onActionComplete('kill_high_cpu_process');
    }
  };

  const toggleIisSite = (id) => {
    setIisSites(prev => prev.map(s => s.id === id ? { ...s, state: s.state === 'Started' ? 'Stopped' : 'Started' } : s));
    if (id === 1) {
      if (onActionComplete) onActionComplete('iis_site_started');
    }
  };

  const toggleFirewallRule = (ruleId) => {
    setFirewallRules(prev => prev.map(r => r.id === ruleId ? { ...r, action: r.action === 'Allow' ? 'Block' : 'Allow' } : r));
    if (ruleId === 'http-in') {
      if (onActionComplete) onActionComplete('firewall_http_allowed');
    }
  };

  const toggleRdpRegistry = () => {
    setRegValues(prev => {
      const current = prev.TerminalServer.find(v => v.name === 'fDenyTSConnections');
      const nextData = current.data.includes('(0)') ? '0x00000001 (1)' : '0x00000000 (0)';
      return {
        ...prev,
        TerminalServer: prev.TerminalServer.map(v => v.name === 'fDenyTSConnections' ? { ...v, data: nextData } : v)
      };
    });
    if (onActionComplete) onActionComplete('reg_rdp_enabled');
  };

  const handlePsCommand = (e) => {
    if (e.key === 'Enter' && psInput.trim()) {
      const cmd = psInput.trim();
      const newEntries = [{ type: 'input', text: `PS C:\\Windows\\system32> ${cmd}` }];
      const lower = cmd.toLowerCase();

      if (lower === 'get-service') {
        const lines = services.map(s => `${s.status.padEnd(10)} ${s.name.padEnd(15)} ${s.displayName}`).join('\n');
        newEntries.push({ type: 'output', text: `Status     Name            DisplayName\n------     ----            -----------\n${lines}` });
      } else if (lower.startsWith('start-service')) {
        const target = cmd.split(' ')[1];
        if (target) {
          toggleService(target, 'Running');
          newEntries.push({ type: 'output', text: `[+] Service '${target}' started successfully.` });
        }
      } else if (lower.startsWith('stop-service')) {
        const target = cmd.split(' ')[1];
        if (target) {
          toggleService(target, 'Stopped');
          newEntries.push({ type: 'output', text: `[-] Service '${target}' stopped.` });
        }
      } else if (lower === 'get-process') {
        const lines = processes.map(p => `${String(p.pid).padEnd(8)} ${p.name.padEnd(26)} ${p.cpu}%       ${p.mem} MB`).join('\n');
        newEntries.push({ type: 'output', text: `Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id ProcessName\n-------  ------    -----      -----     ------     -- -----------\n${lines}` });
      } else if (lower.startsWith('stop-process')) {
        const match = cmd.match(/-id\s+(\d+)|(\d+)/i);
        const pid = match ? Number(match[1] || match[2]) : null;
        if (pid) {
          killProcess(pid);
          newEntries.push({ type: 'output', text: `[+] Terminated process PID ${pid}.` });
        } else {
          newEntries.push({ type: 'output', text: `Stop-Process: Parameter -Id required.` });
        }
      } else if (lower.startsWith('get-winevent') || lower.startsWith('get-eventlog')) {
        const lines = eventLogs.map(ev => `[${ev.time}] EventID: ${ev.eventId} [${ev.level}] ${ev.source} - ${ev.message}`).join('\n');
        newEntries.push({ type: 'output', text: lines });
      } else if (lower === 'get-aduser' || lower.startsWith('get-aduser')) {
        const lines = adUsers.map(u => `SamAccountName: ${u.username}\nEnabled: ${u.status === 'Active'}\nName: ${u.fullName}\nLockedOut: ${u.status === 'Locked Out'}\nOU: ${u.ou}\n`).join('\n');
        newEntries.push({ type: 'output', text: lines });
      } else if (lower.startsWith('unlock-adaccount')) {
        const user = cmd.split(' ')[1] || 'jdoe';
        unlockUser(user);
        newEntries.push({ type: 'output', text: `[+] Account '${user}' unlocked in Active Directory.` });
      } else if (lower.startsWith('get-netfirewallrule')) {
        const lines = firewallRules.map(r => `${r.id.padEnd(12)} ${r.direction.padEnd(10)} ${r.action.padEnd(8)} ${r.name}`).join('\n');
        newEntries.push({ type: 'output', text: `Name         Direction  Action   DisplayName\n----         ---------  ------   -----------\n${lines}` });
      } else if (lower === 'help' || lower === 'clear') {
        newEntries.push({ type: 'output', text: 'Available simulated cmdlets:\nGet-Service, Start-Service <Name>, Stop-Service <Name>\nGet-Process, Stop-Process -Id <PID>\nGet-WinEvent, Get-ADUser, Unlock-ADAccount <User>\nGet-NetFirewallRule, Set-NetFirewallRule\nTest-NetConnection -ComputerName localhost -Port 80' });
      } else {
        newEntries.push({ type: 'output', text: `Command '${cmd}' executed in PowerShell sandbox.` });
      }

      setPsHistory(prev => [...prev, ...newEntries]);
      setPsInput('');
    }
  };

  const totalCpuUsage = Math.min(100, processes.reduce((sum, p) => sum + p.cpu, 2.5)).toFixed(1);
  const isHighCpuAlert = Number(totalCpuUsage) > 70;

  // Desktop App Icons definition
  const desktopApps = [
    { id: 'server-manager', name: 'Server Manager', icon: Server, color: 'text-blue-400' },
    { id: 'event-viewer', name: 'Event Viewer', icon: Activity, color: 'text-amber-400' },
    { id: 'services', name: 'Services (msc)', icon: Settings, color: 'text-indigo-400' },
    { id: 'aduc', name: 'Active Directory', icon: Users, color: 'text-emerald-400' },
    { id: 'taskmgr', name: 'Task Manager', icon: Cpu, color: 'text-rose-400' },
    { id: 'iis', name: 'IIS Manager', icon: Globe, color: 'text-sky-400' },
    { id: 'firewall', name: 'Windows Firewall', icon: Shield, color: 'text-orange-400' },
    { id: 'regedit', name: 'Registry Editor', icon: Key, color: 'text-purple-400' },
    { id: 'powershell', name: 'PowerShell 7', icon: Terminal, color: 'text-blue-300' },
  ];

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-2xl font-sans select-none relative">
      
      {/* 1. TOP VM CONTROL BAR */}
      <div className="h-11 bg-slate-900/95 border-b border-slate-800 px-3 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
            <span className="font-bold text-emerald-300">Cloud VM Azure: Đang chạy</span>
          </div>
          <span className="text-[11px] bg-slate-800 text-blue-300 px-2.5 py-0.5 rounded border border-blue-900/50 font-mono font-medium">
            IP: 20.40.49.168 (Port 3389)
          </span>
          <a
            href="/api/cloud-vm/connect.rdp"
            download="LabEx-WinServer.rdp"
            className="text-[11px] bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold px-2.5 py-1 rounded transition flex items-center gap-1.5 shadow-sm border border-emerald-500/30"
            title="Tải file cấu hình RDP để mở trực tiếp máy ảo Windows Server bằng 1 cú nhấp chuột">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở RDP thật (1-Click)</span>
          </a>
          <button
            onClick={async () => {
              if (confirm('Bạn có chắc muốn tắt máy ảo trên Azure để dừng tính phí?')) {
                await fetch('/api/cloud-vm/stop', { method: 'POST' });
                alert('Đã gửi lệnh tắt máy ảo Azure thành công!');
              }
            }}
            className="text-[11px] bg-rose-900/50 hover:bg-rose-800/80 text-rose-200 px-2 py-0.5 rounded transition border border-rose-700/50 flex items-center gap-1"
            title="Tắt máy ảo để bảo lưu 100$ credit">
            <Square className="w-3 h-3 text-rose-400" />
            <span>Tắt VM tiết kiệm</span>
          </button>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'desktop' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}>
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop VM</span>
          </button>
          <button
            onClick={() => setViewMode('tabs')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'tabs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}>
            <Sliders className="w-3.5 h-3.5" />
            <span>Tabbed Console</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE AREA */}
      <div className="flex-1 min-h-0 relative flex overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950">
        
        {/* DESKTOP MODE: Windows Server 2022 Desktop Simulation */}
        {viewMode === 'desktop' ? (
          <div className="flex-1 relative flex flex-col overflow-hidden">
            
            {/* Desktop Icons Grid */}
            <div className="p-4 grid grid-flow-col grid-rows-6 gap-3 w-fit z-0">
              {desktopApps.map(app => {
                const IconComponent = app.icon;
                return (
                  <div
                    key={app.id}
                    onDoubleClick={() => openAppWindow(app.id)}
                    onClick={() => setActiveWindow(app.id)}
                    className="w-24 p-2 rounded-lg hover:bg-white/10 active:bg-white/20 flex flex-col items-center gap-1.5 cursor-pointer text-center group transition">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700/80 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconComponent className={`w-5 h-5 ${app.color}`} />
                    </div>
                    <span className="text-[11px] text-white drop-shadow font-medium leading-tight line-clamp-2">
                      {app.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Active Window Modal Overlay */}
            {activeWindow && openWindows.includes(activeWindow) && (
              <div className="absolute inset-4 z-20 flex flex-col bg-slate-900/98 rounded-xl border border-slate-700 shadow-2xl overflow-hidden backdrop-blur-md">
                
                {/* Window Titlebar */}
                <div className="h-9 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between select-none">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    {React.createElement(desktopApps.find(a => a.id === activeWindow)?.icon || Server, {
                      className: `w-4 h-4 ${desktopApps.find(a => a.id === activeWindow)?.color || 'text-blue-400'}`
                    })}
                    <span>{desktopApps.find(a => a.id === activeWindow)?.name || 'Management Tool'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setActiveWindow(null)}
                      className="w-6 h-6 rounded hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
                      <Minimize2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => closeAppWindow(activeWindow)}
                      className="w-6 h-6 rounded hover:bg-red-600 flex items-center justify-center text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Window Content */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {renderToolContent(activeWindow)}
                </div>
              </div>
            )}

            {/* Start Menu Popup */}
            {startMenuOpen && (
              <div className="absolute bottom-11 left-2 w-72 bg-slate-950 border border-slate-800 rounded-t-xl rounded-br-xl shadow-2xl z-30 p-3 space-y-3 font-sans">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    AD
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Administrator</div>
                    <div className="text-[10px] text-slate-400">CORP.LOCAL (Domain Admin)</div>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Administrative Tools</div>
                <div className="space-y-1">
                  {desktopApps.map(app => {
                    const IconComponent = app.icon;
                    return (
                      <div
                        key={app.id}
                        onClick={() => openAppWindow(app.id)}
                        className="px-2.5 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer flex items-center gap-2.5 transition text-xs text-slate-200">
                        <IconComponent className={`w-4 h-4 ${app.color}`} />
                        <span>{app.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Windows Server Taskbar at Bottom */}
            <div className="h-10 bg-slate-950/95 border-t border-slate-800 px-2 flex items-center justify-between shrink-0 z-30 select-none">
              <div className="flex items-center gap-1.5">
                {/* Windows Start Button */}
                <button
                  onClick={() => setStartMenuOpen(!startMenuOpen)}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition font-bold text-xs ${
                    startMenuOpen ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-200'
                  }`}>
                  <span className="text-sm">⊞</span>
                  <span>Start</span>
                </button>

                {/* Open Window Taskbar Buttons */}
                {openWindows.map(winId => {
                  const app = desktopApps.find(a => a.id === winId);
                  const Icon = app?.icon || Server;
                  const isCurrent = activeWindow === winId;
                  return (
                    <button
                      key={winId}
                      onClick={() => setActiveWindow(isCurrent ? null : winId)}
                      className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition border ${
                        isCurrent
                          ? 'bg-slate-800 border-slate-600 text-white font-semibold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}>
                      <Icon className={`w-3.5 h-3.5 ${app?.color || 'text-blue-400'}`} />
                      <span className="hidden sm:inline">{app?.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* System Tray */}
              <div className="flex items-center gap-3 text-slate-400 text-xs px-2">
                <Wifi className="w-3.5 h-3.5 text-slate-300" />
                <Volume2 className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-mono text-[11px] text-slate-300">{currentTime}</span>
              </div>
            </div>

          </div>
        ) : (
          /* TABBED MODE: Direct tool selection */
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Tool selection bar */}
            <div className="bg-slate-950 border-b border-slate-800 px-3 py-1.5 flex items-center gap-1 overflow-x-auto text-xs shrink-0">
              {desktopApps.map(app => {
                const IconComponent = app.icon;
                const isCurrent = activeWindow === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => setActiveWindow(app.id)}
                    className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 shrink-0 ${
                      isCurrent ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}>
                    <IconComponent className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : app.color}`} />
                    <span>{app.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Direct Tool View */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {renderToolContent(activeWindow)}
            </div>
          </div>
        )}

      </div>
    </div>
  );

  // Helper renderer for different Windows Management tools
  function renderToolContent(tool) {
    switch (tool) {
      case 'server-manager':
        return (
          <div className="p-6 space-y-6 text-xs">
            <div>
              <h2 className="text-xl font-extrabold text-white">Dashboard Quản Trị Máy Chủ (Server Manager)</h2>
              <p className="text-slate-400 mt-1">
                Theo dõi tình trạng các vai trò máy chủ (Server Roles), cảnh báo bảo mật và hiệu năng thời gian thực.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-400">
                  <span>ACTIVE DIRECTORY (AD DS)</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{adUsers.length} Accounts</div>
                <p className="text-slate-500">Domain Controller hoạt động ổn định. {adUsers.filter(u => u.status === 'Locked Out').length} tài khoản bị tạm khóa (Lockout).</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-400">
                  <span>SYSTEM EVENT LOGS</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">
                  {eventLogs.filter(e => !e.fixed).length} Lỗi Cần Xử Lý
                </div>
                <p className="text-slate-500">Phát hiện Event ID 7034 (Service Crash) và 4625 (Failed Logon).</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-400">
                  <span>CPU & HIỆU NĂNG TỔNG</span>
                  <Activity className={`w-4 h-4 ${isHighCpuAlert ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`} />
                </div>
                <div className={`text-2xl font-black ${isHighCpuAlert ? 'text-rose-400' : 'text-white'}`}>
                  {totalCpuUsage}% CPU
                </div>
                <p className="text-slate-500">
                  {isHighCpuAlert ? 'Cảnh báo: CPU quá tải do tiến trình bị treo! Cần mở Task Manager để kiểm tra.' : 'Hệ thống vận hành trong ngưỡng tải an toàn.'}
                </p>
              </div>
            </div>

            {/* Quick Actions Playbook */}
            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-slate-200">Kịch Bản Khắc Phục Sự Cố Đề Xuất (Troubleshooting Playbook)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  onClick={() => openAppWindow('event-viewer')}
                  className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer flex items-center justify-between transition">
                  <div>
                    <div className="font-bold text-amber-300">1. Điều tra Event ID 7034 & 4625</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Mở Event Viewer để lọc chi tiết mã sự cố và nguyên nhân.</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>

                <div 
                  onClick={() => openAppWindow('services')}
                  className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer flex items-center justify-between transition">
                  <div>
                    <div className="font-bold text-indigo-300">2. Khởi động lại Print Spooler & W3SVC</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Mở Services (services.msc) để bấm Start và cấu hình phục hồi.</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>

                <div 
                  onClick={() => openAppWindow('taskmgr')}
                  className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer flex items-center justify-between transition">
                  <div>
                    <div className="font-bold text-rose-300">3. Tắt tiến trình HighCPU_StuckQuery.exe</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Giải phóng 84.5% CPU bị chiếm giữ để phục hồi máy chủ.</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>

                <div 
                  onClick={() => openAppWindow('aduc')}
                  className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer flex items-center justify-between transition">
                  <div>
                    <div className="font-bold text-emerald-300">4. Mở khóa tài khoản John Doe (jdoe)</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Active Directory Users & Computers (dsa.msc).</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'taskmgr':
        return (
          <div className="p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Task Manager (taskmgr.exe)</h3>
                <p className="text-slate-400 mt-0.5">Theo dõi tài nguyên CPU, Bộ nhớ và tắt các tiến trình treo (End Task).</p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-lg border font-mono font-bold ${
                  isHighCpuAlert ? 'bg-red-950 border-red-800 text-red-300' : 'bg-slate-900 border-slate-800 text-emerald-400'
                }`}>
                  CPU: {totalCpuUsage}%
                </div>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">PID</th>
                    <th className="p-2.5">Tên tiến trình</th>
                    <th className="p-2.5">Người dùng</th>
                    <th className="p-2.5">CPU %</th>
                    <th className="p-2.5">Bộ nhớ</th>
                    <th className="p-2.5">Trạng thái</th>
                    <th className="p-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {processes.map(proc => (
                    <tr key={proc.pid} className={`hover:bg-slate-900/60 transition ${proc.cpu > 50 ? 'bg-red-950/30' : ''}`}>
                      <td className="p-2.5 font-bold text-slate-300">{proc.pid}</td>
                      <td className="p-2.5 text-white font-medium">{proc.name}</td>
                      <td className="p-2.5 text-slate-400">{proc.user}</td>
                      <td className={`p-2.5 font-bold ${proc.cpu > 50 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                        {proc.cpu}%
                      </td>
                      <td className="p-2.5 text-slate-300">{proc.mem} MB</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          proc.status === 'Running' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {proc.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-sans">
                        <button
                          onClick={() => killProcess(proc.pid)}
                          className="px-2.5 py-1 rounded bg-red-900/80 hover:bg-red-700 text-white font-semibold text-[11px] transition">
                          End Task
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'iis':
        return (
          <div className="p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Internet Information Services (IIS) Manager</h3>
                <p className="text-slate-400 mt-0.5">Quản lý các trang web, cổng lắng nghe (Bindings) và Application Pools.</p>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Tên Trang Web</th>
                    <th className="p-3">Bindings</th>
                    <th className="p-3">Đường dẫn vật lý</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {iisSites.map(site => (
                    <tr key={site.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 font-bold text-white">{site.name}</td>
                      <td className="p-3 font-mono text-slate-300">{site.binding}</td>
                      <td className="p-3 font-mono text-slate-400">{site.path}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          site.state === 'Started' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {site.state}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleIisSite(site.id)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                            site.state === 'Started' ? 'bg-red-900/80 hover:bg-red-800 text-red-200' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}>
                          {site.state === 'Started' ? 'Dừng Site' : 'Khởi động Site'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simulated Web Browser Preview */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-slate-300">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="font-bold">Trình Duyệt Kiểm Tra Nội Bộ (Internal Browser Preview)</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800 font-mono">
                <span className="text-slate-500 text-[11px]">URL:</span>
                <input
                  type="text"
                  value={iisBrowserUrl}
                  onChange={e => setIisBrowserUrl(e.target.value)}
                  className="flex-1 bg-transparent text-white focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-lg bg-white text-slate-900 font-sans min-h-[120px] flex items-center justify-center border border-slate-200">
                {iisSites.find(s => s.id === 1)?.state === 'Started' ? (
                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-black text-blue-600">Internet Information Services (IIS 10.0)</h4>
                    <p className="text-xs text-slate-600">Trang chủ web server Windows đang phản hồi mã 200 OK trên cổng 80.</p>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Site Active & Online
                    </span>
                  </div>
                ) : (
                  <div className="text-center space-y-1 text-slate-500">
                    <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                    <div className="font-bold text-sm text-slate-700">HTTP Error 503 — Service Unavailable</div>
                    <div className="text-xs">Trang web chưa được khởi động trong IIS Manager.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'firewall':
        return (
          <div className="p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Windows Defender Firewall with Advanced Security</h3>
                <p className="text-slate-400 mt-0.5">Cấu hình các quy tắc lưu lượng đến/đi (Inbound/Outbound Rules).</p>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Tên Quy Tắc</th>
                    <th className="p-3">Cổng / Giao thức</th>
                    <th className="p-3">Hướng</th>
                    <th className="p-3">Hành động (Action)</th>
                    <th className="p-3 text-right">Chuyển trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {firewallRules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 font-bold text-white">
                        {rule.name}
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">{rule.desc}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{rule.port}</td>
                      <td className="p-3 font-mono text-slate-400">{rule.direction}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          rule.action === 'Allow' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {rule.action === 'Allow' ? 'Allow Connection' : 'Block Connection'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleFirewallRule(rule.id)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                            rule.action === 'Allow' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}>
                          {rule.action === 'Allow' ? 'Chặn (Block)' : 'Cho phép (Allow)'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'regedit':
        return (
          <div className="p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Registry Editor (regedit.exe)</h3>
                <p className="text-slate-400 mt-0.5">Chỉnh sửa tham số hệ thống HKEY_LOCAL_MACHINE cho sự cố RDP và Print Spooler.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tree navigation */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="font-bold text-slate-400 pb-1 border-b border-slate-800">Registry Keys</div>
                <div 
                  onClick={() => setRegSelectedKey('TerminalServer')}
                  className={`p-2 rounded cursor-pointer transition ${regSelectedKey === 'TerminalServer' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900'}`}>
                  📁 Control\Terminal Server
                </div>
                <div 
                  onClick={() => setRegSelectedKey('Spooler')}
                  className={`p-2 rounded cursor-pointer transition ${regSelectedKey === 'Spooler' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900'}`}>
                  📁 Services\Spooler
                </div>
              </div>

              {/* Key values viewer */}
              <div className="md:col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>Values: HKLM\SYSTEM\CurrentControlSet\{regSelectedKey}</span>
                  {regSelectedKey === 'TerminalServer' && (
                    <button
                      onClick={toggleRdpRegistry}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold">
                      Toggle fDenyTSConnections
                    </button>
                  )}
                </div>

                <div className="space-y-2 font-mono">
                  {(regValues[regSelectedKey] || []).map(val => (
                    <div key={val.name} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sky-400">{val.name} ({val.type})</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{val.desc}</div>
                      </div>
                      <div className="font-bold text-white bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                        {val.data}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'event-viewer':
        return (
          <div className="p-4 flex-1 flex flex-col md:flex-row gap-4 overflow-hidden text-xs">
            <div className="w-full md:w-56 bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 shrink-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Windows Logs</div>
              {['System', 'Security', 'Application'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedLogCategory(cat)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                    selectedLogCategory === cat ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}>
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    {cat}
                  </span>
                  <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
                    {eventLogs.filter(e => e.log === cat).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-sm text-white">Nhật Ký Sự Kiện: {selectedLogCategory}</h3>
                <input
                  type="text"
                  placeholder="Lọc Event ID (vd: 7034, 4625)..."
                  value={eventFilter}
                  onChange={e => setEventFilter(e.target.value)}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Mức độ</th>
                      <th className="p-2.5">Thời gian</th>
                      <th className="p-2.5">Nguồn (Source)</th>
                      <th className="p-2.5">Event ID</th>
                      <th className="p-2.5">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {eventLogs
                      .filter(e => e.log === selectedLogCategory && (!eventFilter || String(e.eventId).includes(eventFilter)))
                      .map(ev => (
                        <tr
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`cursor-pointer transition hover:bg-slate-900/70 ${
                            selectedEvent?.id === ev.id ? 'bg-amber-950/40 text-amber-200' : ''
                          }`}>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.level === 'Error' || ev.level === 'Critical' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {ev.level}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400">{ev.time}</td>
                          <td className="p-2.5 text-slate-300">{ev.source}</td>
                          <td className="p-2.5 font-bold text-white">{ev.eventId}</td>
                          <td className="p-2.5">
                            {ev.fixed ? (
                              <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1 font-sans">
                                <CheckCircle className="w-3 h-3" /> Đã khắc phục
                              </span>
                            ) : (
                              <span className="text-amber-400 text-[11px] font-semibold flex items-center gap-1 font-sans">
                                <AlertTriangle className="w-3 h-3" /> Cần xử lý
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {selectedEvent && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-amber-300">Chi tiết Event ID {selectedEvent.eventId} — {selectedEvent.source}</div>
                    <span className="text-[10px] text-slate-500 font-mono">Time: {selectedEvent.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    {selectedEvent.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Services (services.msc)</h3>
                <p className="text-slate-400 mt-0.5">Quản lý trạng thái khởi động, dừng và khởi động lại các Windows Services.</p>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Tên Dịch Vụ</th>
                    <th className="p-3">Mô tả</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Startup Type</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {services.map(s => (
                    <tr key={s.name} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 font-bold text-white font-mono">{s.name} ({s.displayName})</td>
                      <td className="p-3 text-slate-400 max-w-xs">{s.desc}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          s.status === 'Running' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{s.startup}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleService(s.name)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
                            s.status === 'Running' ? 'bg-red-900/80 hover:bg-red-800 text-red-200' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}>
                          {s.status === 'Running' ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{s.status === 'Running' ? 'Dừng' : 'Khởi động'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'aduc':
        return (
          <div className="p-4 space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-base text-white">Active Directory Users & Computers (dsa.msc)</h3>
              <p className="text-slate-400 mt-0.5">Quản lý tài khoản người dùng, nhóm bảo mật và mở khóa tài khoản (Unlock Account).</p>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Username</th>
                    <th className="p-3">Họ và Tên</th>
                    <th className="p-3">Đơn vị (OU)</th>
                    <th className="p-3">Chức vụ</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {adUsers.map(u => (
                    <tr key={u.username} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 font-mono font-bold text-blue-400">{u.username}</td>
                      <td className="p-3 text-white font-medium">{u.fullName}</td>
                      <td className="p-3 text-slate-400 font-mono">OU={u.ou},DC=corp</td>
                      <td className="p-3 text-slate-300">{u.role}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.status === 'Active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : u.status === 'Locked Out' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.status === 'Locked Out' ? (
                          <button
                            onClick={() => unlockUser(u.username)}
                            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition">
                            Mở khóa (Unlock)
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Bình thường</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'powershell':
        return (
          <div className="flex-1 min-h-0 h-full flex flex-col bg-slate-950 p-4 font-mono text-xs">
            <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-2 text-slate-200">
              {psHistory.map((item, idx) => (
                <div key={idx} className={item.type === 'input' ? 'text-sky-300 font-bold' : 'text-slate-300 whitespace-pre-wrap'}>
                  {item.text}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-800 pt-2 shrink-0">
              <span className="text-sky-400 font-bold select-none">PS C:\&gt;</span>
              <input
                type="text"
                value={psInput}
                onChange={e => setPsInput(e.target.value)}
                onKeyDown={handlePsCommand}
                placeholder="Gõ lệnh PowerShell (Get-Service, Get-Process, Stop-Process -Id 4820, Unlock-ADAccount)..."
                className="flex-1 bg-transparent text-white focus:outline-none placeholder-slate-600"
                autoFocus
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  }
}
