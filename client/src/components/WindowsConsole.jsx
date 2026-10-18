import React, { useState } from 'react';
import { 
  Server, Shield, AlertTriangle, CheckCircle, RefreshCw, 
  Terminal, Play, Square, RotateCcw, Search, Folder, 
  User, Users, Settings, Activity, Database, Globe,
  HelpCircle, Monitor, HardDrive, Key, FileText, ChevronRight
} from 'lucide-react';

export default function WindowsConsole({ labId, onActionComplete }) {
  const [activeTool, setActiveTool] = useState('server-manager'); // 'server-manager' | 'event-viewer' | 'services' | 'aduc' | 'powershell'
  
  // Simulated Services State
  const [services, setServices] = useState([
    { name: 'Spooler', displayName: 'Print Spooler', status: 'Stopped', startup: 'Automatic', desc: 'Quản lý hàng đợi in ấn và gửi tài liệu tới máy in.' },
    { name: 'W32Time', displayName: 'Windows Time', status: 'Running', startup: 'Automatic', desc: 'Duy trì đồng bộ hóa ngày giờ trên mạng Domain.' },
    { name: 'LanmanServer', displayName: 'Server (SMB File Sharing)', status: 'Running', startup: 'Automatic', desc: 'Hỗ trợ chia sẻ tệp, máy in và RPC qua mạng.' },
    { name: 'DNS', displayName: 'DNS Server', status: 'Running', startup: 'Automatic', desc: 'Phân giải tên miền máy chủ và định vị Domain Controller.' },
    { name: 'W3SVC', displayName: 'World Wide Web Publishing Service', status: 'Stopped', startup: 'Manual', desc: 'Cung cấp kết nối web và quản lý trang qua IIS.' },
    { name: 'Dhcp', displayName: 'DHCP Client', status: 'Running', startup: 'Automatic', desc: 'Đăng ký và cập nhật địa chỉ IP và bản ghi DNS.' },
  ]);

  // Simulated Event Viewer Logs State
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

  // Simulated Active Directory Users and Computers (ADUC)
  const [adUsers, setAdUsers] = useState([
    { username: 'jdoe', fullName: 'John Doe', ou: 'Sales', status: 'Locked Out', role: 'Sales Executive' },
    { username: 'mchen', fullName: 'Mary Chen', ou: 'Finance', status: 'Active', role: 'Senior Accountant' },
    { username: 'alex.admin', fullName: 'Alex System Admin', ou: 'IT-Admins', status: 'Active', role: 'Domain Administrator' },
    { username: 'intern01', fullName: 'Tech Intern', ou: 'IT-Admins', status: 'Disabled', role: 'Junior SysAdmin Intern' },
  ]);

  // PowerShell Simulation State
  const [psHistory, setPsHistory] = useState([
    { type: 'output', text: 'Windows PowerShell v7.4.2 — Microsoft Corporation. All rights reserved.\nType "help" or run Windows Server management cmdlets.' }
  ]);
  const [psInput, setPsInput] = useState('');

  // Actions
  const toggleService = (name) => {
    setServices(prev => prev.map(s => {
      if (s.name === name) {
        const nextStatus = s.status === 'Running' ? 'Stopped' : 'Running';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const unlockUser = (username) => {
    setAdUsers(prev => prev.map(u => u.username === username ? { ...u, status: 'Active' } : u));
    setEventLogs(prev => prev.map(e => (e.eventId === 4625 ? { ...e, fixed: true } : e)));
    if (onActionComplete) onActionComplete('unlock_user');
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
          toggleService(target);
          newEntries.push({ type: 'output', text: `[+] Service '${target}' started successfully.` });
        }
      } else if (lower.startsWith('get-winevent') || lower.startsWith('get-eventlog')) {
        const lines = eventLogs.map(ev => `[${ev.time}] EventID: ${ev.eventId} [${ev.level}] ${ev.source} - ${ev.message}`).join('\n');
        newEntries.push({ type: 'output', text: lines });
      } else if (lower === 'help' || lower === 'clear') {
        newEntries.push({ type: 'output', text: 'Available simulated cmdlets:\nGet-Service, Start-Service <Name>, Stop-Service <Name>, Get-WinEvent, Get-ADUser, Test-NetConnection' });
      } else {
        newEntries.push({ type: 'output', text: `Command '${cmd}' executed in PowerShell sandbox.` });
      }

      setPsHistory(prev => [...prev, ...newEntries]);
      setPsInput('');
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-2xl font-sans">
      {/* Top Header / Taskbar of Windows Server Manager */}
      <div className="h-12 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            ⊞
          </div>
          <span className="font-bold text-sm text-slate-200 tracking-wide flex items-center gap-2">
            Windows Server 2022 Management Console
            <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/50">
              DC01.CORP.LOCAL
            </span>
          </span>
        </div>

        {/* Quick Tool Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTool('server-manager')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTool === 'server-manager' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}>
            <Server className="w-3.5 h-3.5" />
            <span>Server Manager</span>
          </button>

          <button
            onClick={() => setActiveTool('event-viewer')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTool === 'event-viewer' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}>
            <Activity className="w-3.5 h-3.5 text-amber-300" />
            <span>Event Viewer</span>
          </button>

          <button
            onClick={() => setActiveTool('services')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTool === 'services' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}>
            <Settings className="w-3.5 h-3.5 text-indigo-300" />
            <span>Services (services.msc)</span>
          </button>

          <button
            onClick={() => setActiveTool('aduc')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTool === 'aduc' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}>
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>Active Directory (ADUC)</span>
          </button>

          <button
            onClick={() => setActiveTool('powershell')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTool === 'powershell' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}>
            <Terminal className="w-3.5 h-3.5 text-sky-300" />
            <span>PowerShell</span>
          </button>
        </div>
      </div>

      {/* Main Console Content Pane */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* VIEW 1: SERVER MANAGER DASHBOARD */}
        {activeTool === 'server-manager' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white">Dashboard Quản Trị Máy Chủ</h2>
              <p className="text-xs text-slate-400 mt-1">
                Theo dõi tình trạng các vai trò máy chủ (Server Roles), cảnh báo bảo mật và hiệu năng thời gian thực.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>ACTIVE DIRECTORY (AD DS)</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">4 Accounts</div>
                <p className="text-xs text-slate-500">Domain Controller hoạt động ổn định. 1 tài khoản bị tạm khóa (Lockout).</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>SYSTEM EVENT LOGS</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">3 Lỗi Cần Xử Lý</div>
                <p className="text-xs text-slate-500">Phát hiện Event ID 7034 (Service Crash) và 4625 (Failed Logon).</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>WINDOWS SERVICES</span>
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">4 Running / 2 Stopped</div>
                <p className="text-xs text-slate-500">Dịch vụ Print Spooler và W3SVC đang ở trạng thái ngừng hoạt động.</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-slate-200">Kịch Bản Khắc Phục Sự Cố Đề Xuất (Troubleshooting Playbook)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div 
                  onClick={() => setActiveTool('event-viewer')}
                  className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer flex items-center justify-between transition">
                  <div>
                    <div className="font-bold text-amber-300">1. Điều tra Event ID 7034 & 4625</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Mở Event Viewer để lọc chi tiết mã sự cố và nguyên nhân.</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>

                <div 
                  onClick={() => setActiveTool('services')}
                  className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer flex items-center justify-between transition">
                  <div>
                    <div className="font-bold text-indigo-300">2. Khởi động lại Print Spooler</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Mở Services (services.msc) để bấm Start và cấu hình phục hồi.</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: EVENT VIEWER CONSOLE */}
        {activeTool === 'event-viewer' && (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Left Log Categories Tree */}
            <div className="w-full md:w-56 bg-slate-950 border-r border-slate-800 p-3 space-y-2 shrink-0">
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

            {/* Event List & Detail Panel */}
            <div className="flex-1 min-h-0 flex flex-col p-4 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-sm text-white">Nhật Ký Sự Kiện: {selectedLogCategory}</h3>
                <input
                  type="text"
                  placeholder="Lọc Event ID (vd: 7034, 4625)..."
                  value={eventFilter}
                  onChange={e => setEventFilter(e.target.value)}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Event Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
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
                              <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Đã khắc phục
                              </span>
                            ) : (
                              <span className="text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Cần xử lý
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Event Details Viewer */}
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
        )}

        {/* VIEW 3: SERVICES CONSOLE (services.msc) */}
        {activeTool === 'services' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Services (Local System)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Quản lý trạng thái khởi động, dừng và khởi động lại các Windows Services.</p>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
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
                            s.status === 'Running'
                              ? 'bg-red-900/80 hover:bg-red-800 text-red-200'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
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
        )}

        {/* VIEW 4: ACTIVE DIRECTORY USERS AND COMPUTERS (ADUC) */}
        {activeTool === 'aduc' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div>
              <h3 className="font-bold text-base text-white">Active Directory Users & Computers</h3>
              <p className="text-xs text-slate-400 mt-0.5">Quản lý tài khoản người dùng, nhóm bảo mật và mở khóa tài khoản (Unlock Account).</p>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
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
        )}

        {/* VIEW 5: POWERSHELL INTERACTIVE SANDBOX */}
        {activeTool === 'powershell' && (
          <div className="flex-1 min-h-0 flex flex-col bg-slate-950 p-4 font-mono text-xs">
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
                placeholder="Gõ lệnh PowerShell (vd: Get-Service, Get-WinEvent, Get-ADUser)..."
                className="flex-1 bg-transparent text-white focus:outline-none placeholder-slate-600"
                autoFocus
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
