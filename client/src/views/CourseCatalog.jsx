import React, { useState, useEffect } from 'react';
import CourseCard from '../components/CourseCard';
import { 
  Terminal, Shield, Cloud, Server, Sparkles, Filter,
  BookOpen, Award, CheckCircle, Search, ArrowRight, Layers,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../lib/api';

export default function CourseCatalog({ onSelectCourse, onSelectPath }) {
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [onlyReady, setOnlyReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 9;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [linuxTotals, setLinuxTotals] = useState(null);
  const [roadmapError, setRoadmapError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLinuxTotals(null); setRoadmapError('');
    api('/api/roadmaps/linux-system-administrator', { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setLinuxTotals(data.totals || null); })
      .catch(e => { if (e.name !== 'AbortError') setRoadmapError(e.message); });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const controller = new AbortController();
    api('/api/topics', { signal: controller.signal })
      .then(data => { if (Array.isArray(data)) setTopics(data); })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (selectedTopic !== 'all') params.append('topic', selectedTopic);
    if (selectedLevel !== 'all') params.append('level', selectedLevel);
    if (searchTerm.trim()) params.append('q', searchTerm.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';

    api(`/api/courses${queryString}`, { signal: controller.signal })
      .then(data => {
        let list = data.courses || [];
        setCourses(list);
      })
      .catch(e => {
        if (e.name !== 'AbortError') {
          setError(e.message);
          setCourses([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [selectedTopic, selectedLevel, searchTerm, attempt]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTopic, selectedLevel, searchTerm, onlyReady]);

  const handleSelectTopic = (alias) => {
    setSelectedTopic(alias);
    window.scrollTo({ top: document.getElementById('catalog-content')?.offsetTop - 80 || 600, behavior: 'smooth' });
  };

  const filteredTopics = topics.filter(t => 
    t.name.toLowerCase().includes(topicSearch.toLowerCase()) || 
    t.alias.toLowerCase().includes(topicSearch.toLowerCase())
  );

  const displayedCourses = onlyReady 
    ? courses.filter(c => ['ready', 'partial'].includes(c.readiness) && c.practice_labs_count > 0)
    : courses;

  const totalPages = Math.ceil(displayedCourses.length / PAGE_SIZE) || 1;
  const paginatedCourses = displayedCourses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const el = document.getElementById('catalog-content');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors">
      {/* 1. Hero Section - Multi-Platform (Linux & Windows Cloud) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-gray-950 text-white pt-20 pb-20 border-b border-gray-800">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-7">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 text-blue-300 text-xs font-semibold border border-blue-400/30 shadow-inner">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LabEx Studio Hub
            </span>
            <span className="text-slate-500">•</span>
            <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-amber-400" /> Linux Enterprise Sandbox</span>
            <span className="text-slate-500">•</span>
            <span className="flex items-center gap-1"><Server className="w-3.5 h-3.5 text-sky-400" /> Windows Server Azure Cloud</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            Master Infrastructure with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Hands-On Production Labs
            </span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Trải nghiệm thực chiến song song: Máy ảo Linux cô lập tức thì trên WSL2 / Docker và hạ tầng Windows Server Datacenter trên Azure Cloud. Chấm điểm tự động từng lệnh và hướng dẫn trực quan từng bước.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1">
            <button
              onClick={() => onSelectPath ? onSelectPath('linux') : handleSelectTopic('linux')}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Terminal className="w-4 h-4 text-slate-900" /> Lộ trình Linux Enterprise
            </button>
            <button
              onClick={() => onSelectPath ? onSelectPath('windows') : handleSelectTopic('windows')}
              className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Server className="w-4 h-4 text-white" /> Lộ trình Windows & IT Support
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('catalog-content');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur border border-white/15 flex items-center gap-2 transition-all">
              Tất cả khóa học <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-4 text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200">Linux Rootless</div>
                <div className="text-[11px] text-slate-400 truncate">Sandbox cô lập 100%</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200">Azure Datacenter</div>
                <div className="text-[11px] text-slate-400 truncate">AD DS, IIS, PowerShell</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200">Auto Verification</div>
                <div className="text-[11px] text-slate-400 truncate">Chấm điểm thao tác thực</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200">Labby AI Assistant</div>
                <div className="text-[11px] text-slate-400 truncate">Gợi ý & sửa lỗi thông minh</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Skill Trees */}
      <section id="skill-trees" className="scroll-mt-20 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2 border-b dark:border-gray-800 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">
              Chuyên ngành hàng đầu
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Featured Skill Trees
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lộ trình bài bản giúp bạn đi từ con số 0 đến chuyên gia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-6">
          {[
            { 
              alias: 'linux',
              name: 'Linux', 
              subtitle: linuxTotals ? `${linuxTotals.source_courses} khóa nguồn · ${linuxTotals.source_labs} mục nguồn · ${linuxTotals.unique_imported_labs} bài local duy nhất` : 'Đang tải số liệu lộ trình',
              desc: 'Làm chủ terminal Linux, quản trị hệ thống, quyền hạn tệp và shell script automation.', 
              icon: Terminal, 
              hours: linuxTotals ? `${linuxTotals.runnable_labs} bài chấm đủ` : 'Chưa có số liệu',
              badge: 'Chuyên ngành nổi bật',
              color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-500',
              btnColor: 'bg-amber-600 hover:bg-amber-500 text-white'
            },
                        { 
              alias: 'windows',
              name: 'Windows Server', 
              subtitle: 'Active Directory & PowerShell',
              desc: 'Quản trị hệ thống Windows Server, AD DS, Group Policy (GPO), PowerShell automation và xử lý sự cố Event Viewer.', 
              icon: Server, 
              hours: '3 khóa · 15 bài thực hành',
              badge: 'Doanh nghiệp & Thực tập',
              color: 'from-blue-600/20 to-sky-500/10 border-blue-500/30 text-blue-500',
              btnColor: 'bg-blue-600 hover:bg-blue-500 text-white'
            },
            { 
              alias: 'devops',
              name: 'DevOps', 
              subtitle: 'CI/CD, Docker & Kubernetes',
              desc: 'Xây dựng pipeline CI/CD, đóng gói container và điều phối cụm dịch vụ tự động hóa.', 
              icon: Server, 
              hours: 'Xem danh mục',
              badge: 'Xu hướng tuyển dụng',
              color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-500',
              btnColor: 'bg-blue-600 hover:bg-blue-500 text-white'
            },
            { 
              alias: 'cybersecurity',
              name: 'Cybersecurity', 
              subtitle: 'Penetration Testing',
              desc: 'Bảo mật mạng, ethical hacking với Nmap, Wireshark, phân tích mã độc và phòng thủ.', 
              icon: Shield, 
              hours: 'Xem danh mục',
              badge: 'Thực hành bảo mật',
              color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-500',
              btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white'
            },
            { 
              alias: 'aws',
              name: 'AWS Cloud', 
              subtitle: 'Cloud Architect & SysOps',
              desc: 'Hạ tầng điện toán đám mây Amazon Web Services: EC2, S3, IAM, VPC và Serverless.', 
              icon: Cloud, 
              hours: 'Xem danh mục',
              badge: 'Chứng chỉ Cloud',
              color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-500',
              btnColor: 'bg-purple-600 hover:bg-purple-500 text-white'
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-primary-500/50 transition-all duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${item.color} border`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300">
                      {item.hours}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-xl group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5">
                      {item.subtitle}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 leading-relaxed line-clamp-3">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t dark:border-gray-800 flex gap-2">
                  <button
                    onClick={() => onSelectPath ? onSelectPath(item.alias) : handleSelectTopic(item.alias)}
                    className="flex-1 py-2 px-3 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-primary-600 dark:hover:bg-primary-500 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Xem Lộ Trình
                  </button>
                  <button
                    onClick={() => handleSelectTopic(item.alias)}
                    className="py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium transition-all text-gray-700 dark:text-gray-300">
                    Khóa học
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {roadmapError && <p role="alert" className="max-w-7xl mx-auto px-4 text-sm text-red-600">Không tải được số liệu lộ trình. <button onClick={() => setAttempt(value => value + 1)} className="underline">Thử lại</button></p>}
      {/* 3. Certification Prep Section */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-blue-900/90 to-indigo-950 p-6 sm:p-8 text-white border border-blue-800/50 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                <Award className="w-4 h-4" /> Luyện thi chứng chỉ quốc tế
              </div>
              <h3 className="text-2xl font-bold">Linux & DevOps Certification Training</h3>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Tập trung thực hành theo format đề thi chứng chỉ thực tế: Red Hat, CompTIA, Linux Foundation và Cloud Native Computing Foundation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { code: 'RHCSA', name: 'Red Hat EX200', topic: 'rhcsa' },
              { code: 'RHCE', name: 'Ansible EX294', topic: 'rhce-ansible' },
              { code: 'CompTIA', name: 'Linux+ XK0-005', topic: 'comptia' },
              { code: 'LFCS', name: 'Linux Foundation', topic: 'lfcs' },
              { code: 'CKA', name: 'K8s Administrator', topic: 'cka' },
              { code: 'Security+', name: 'CompTIA SY0-701', topic: 'comptia' },
            ].map((cert, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectTopic(cert.topic)}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-left transition-all group">
                <div className="text-sm font-black text-amber-300 group-hover:text-amber-200">{cert.code}</div>
                <div className="text-[11px] text-slate-300 line-clamp-1">{cert.name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. All Courses & Topics Sidebar (Main Section) */}
      <section id="catalog-content" className="py-12 border-t dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b dark:border-gray-800 gap-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                All Courses
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Hiển thị {displayedCourses.length} khóa học · xem trạng thái thực hành ở từng khóa.
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Ready filter toggle */}
              <button
                onClick={() => setOnlyReady(!onlyReady)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  onlyReady 
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-500'
                }`}>
                <CheckCircle className="w-3.5 h-3.5" />
                Chỉ hiện bài có sẵn Lab
              </button>

              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">Tất cả trình độ</option>
                <option value="Beginner">Beginner (Cơ bản)</option>
                <option value="Intermediate">Intermediate (Trung cấp)</option>
                <option value="Advanced">Advanced (Nâng cao)</option>
              </select>

              {/* Keyword Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Lọc khóa học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 w-44 sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* 2 Columns Layout: Sidebar + Grid */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: 41 Topics Sidebar */}
            <aside className="w-full lg:w-72 shrink-0">
              <div className="sticky top-20 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-3 pb-2 border-b dark:border-gray-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    Chủ đề ({topics.length})
                  </div>
                  {selectedTopic !== 'all' && (
                    <button
                      onClick={() => handleSelectTopic('all')}
                      className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                      Xem tất cả
                    </button>
                  )}
                </div>

                {/* Topic Search Box */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Tìm chủ đề..."
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                {/* Topics List */}
                <nav className="flex flex-col gap-1 max-h-[65vh] overflow-y-auto pr-1">
                  <button
                    onClick={() => handleSelectTopic('all')}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      selectedTopic === 'all'
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}>
                    <span>Tất cả chủ đề</span>
                    <span className="text-[10px] opacity-60">All</span>
                  </button>

                  {filteredTopics.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTopic(t.alias)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                        selectedTopic === t.alias
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300 font-bold shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}>
                      <span className="truncate pr-2">{t.name}</span>
                      {t.course_count > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0">
                          {t.course_count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Right: Courses Grid */}
            <main className="flex-1 min-w-0">
              {error && (
                <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-700 dark:text-red-200 flex items-center justify-between">
                  <span>{error}</span>
                  <button className="font-semibold underline" onClick={() => setAttempt(v => v + 1)}>Thử lại</button>
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-72 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  ))}
                </div>
              ) : displayedCourses.length > 0 ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onSelectCourse={onSelectCourse}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Hiển thị <span className="font-semibold text-gray-800 dark:text-gray-200">{(currentPage - 1) * PAGE_SIZE + 1}</span> - <span className="font-semibold text-gray-800 dark:text-gray-200">{Math.min(currentPage * PAGE_SIZE, displayedCourses.length)}</span> trên tổng số <span className="font-semibold text-gray-800 dark:text-gray-200">{displayedCourses.length}</span> khóa học
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 transition flex items-center gap-1">
                          <ChevronLeft className="w-3.5 h-3.5" /> Trước
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .map((p, idx, arr) => {
                              const prev = arr[idx - 1];
                              const showEllipsis = prev && p - prev > 1;
                              return (
                                <React.Fragment key={p}>
                                  {showEllipsis && <span className="px-1 text-xs text-gray-400">…</span>}
                                  <button
                                    onClick={() => handlePageChange(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                                      currentPage === p
                                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                                        : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}>
                                    {p}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 transition flex items-center gap-1">
                          Sau <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-dashed dark:border-gray-800">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mx-auto mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Không tìm thấy khóa học nào</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Thử chọn chủ đề khác hoặc xóa bộ lọc tìm kiếm.
                  </p>
                  <button
                    onClick={() => { setSelectedTopic('all'); setSelectedLevel('all'); setSearchTerm(''); setOnlyReady(false); }}
                    className="mt-4 px-4 py-2 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-500 transition-colors">
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}
