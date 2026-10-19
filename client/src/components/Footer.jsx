import React from 'react';
import { 
  Terminal, Server, Shield, Sparkles, BookOpen, Layers, 
  ExternalLink, Heart, Cpu, Globe, CheckCircle2 
} from 'lucide-react';

export default function Footer({ onSelectPath, onSelectTopic }) {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 font-sans text-xs">
      {/* Upper Footer: Main columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 font-black text-base">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-white tracking-tight">LabEx</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white uppercase tracking-wider shadow-xs">
                  Studio
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Nền tảng thực hành quản trị hệ thống và đám mây đa nền tảng. 
              Thực hành trực tiếp với Linux Container cách ly và máy ảo Windows Server 2022 Datacenter trên hạ tầng Microsoft Azure.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Rootless Docker: Online</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                <span>Azure Cloud VM: Ready</span>
              </div>
            </div>
          </div>

          {/* Col 3: Chuyên ngành học tập */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Chuyên Ngành Đào Tạo
            </h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => onSelectPath ? onSelectPath('linux') : onSelectTopic?.('linux')}
                  className="hover:text-primary-400 transition-colors flex items-center gap-1.5 text-left">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Linux System Administrator</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTopic ? onSelectTopic('windows') : onSelectPath?.('windows')}
                  className="hover:text-primary-400 transition-colors flex items-center gap-1.5 text-left">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  <span>Windows Server & Azure VM</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTopic?.('devops')}
                  className="hover:text-primary-400 transition-colors flex items-center gap-1.5 text-left">
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  <span>DevOps & Docker CI/CD</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTopic?.('security')}
                  className="hover:text-primary-400 transition-colors flex items-center gap-1.5 text-left">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cybersecurity & Pentest</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Luyện thi chứng chỉ */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Chứng Chỉ Quốc Tế
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onSelectTopic?.('rhcsa')} className="hover:text-primary-400 transition-colors">
                  Red Hat RHCSA (EX200)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTopic?.('comptia')} className="hover:text-primary-400 transition-colors">
                  CompTIA Linux+ (XK0-005)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTopic?.('cka')} className="hover:text-primary-400 transition-colors">
                  Kubernetes CKA & CKAD
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTopic?.('rhce-ansible')} className="hover:text-primary-400 transition-colors">
                  Red Hat RHCE Ansible (EX294)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Hệ thống & Công nghệ */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Kiến Trúc Studio
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Isolated PTY Terminal</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>100% Hands-On Labs</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Auto Verification Engine</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Labby AI Interactive Tutor</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar: Copyright & Version */}
      <div className="border-t border-slate-800/80 bg-slate-950 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div className="flex items-center gap-2">
            <span>© 2026 LabEx Studio. All rights reserved.</span>
            <span>•</span>
            <span className="font-mono text-slate-400">v2.4 LTS</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              Designed for SysAdmins & Cloud Engineers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
