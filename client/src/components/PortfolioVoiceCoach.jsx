import {useState} from 'react';
import VoiceCallModal from './VoiceCallModal';
import {PORTFOLIO_ID,portfolioFocus} from '../lib/portfolioCoachContext';
export default function PortfolioVoiceCoach({study,progress}) {
  const [call,setCall]=useState(null);
  const chapter=study.project_walkthrough.chapters.find(c=>c.id===(progress.projectStudy?.chapter_id||'P01'));
  const modes=[['explain','Giải thích dự án','tutor'],['intro','Luyện giới thiệu','tutor'],['interview','Phỏng vấn CV','interviewer'],['incident','Tập xử lý sự cố','interviewer']];
  return <section id="portfolio-voice-coach" data-portfolio-voice className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950">
    <h2 className="text-xl font-bold">Nói chuyện với Labby về lab CV của bạn</h2>
    <p className="mt-2 text-sm leading-7">Labby được cung cấp hồ sơ của Minh, 18 chặng dự án, 9 chủ đề, 60 câu hỏi và 16 tình huống. Chọn cách luyện, cho phép mic rồi nói điều bạn cần; Labby hỏi từng câu và chờ bạn trả lời.</p>
    <p className="mt-2 text-sm">Chặng đang chọn: {chapter?.id} · {chapter?.title}. Muốn đổi chặng, đóng cuộc gọi, chọn bài rồi mở lại.</p>
    <div className="mt-3 flex flex-wrap gap-2">{modes.map(([mode,label,persona])=><button key={mode} disabled={!!call} onClick={()=>setCall({mode,persona,focus:portfolioFocus(progress,mode)})} className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{label}</button>)}</div>
    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Thử nói: “Tôi quên hết rồi, giải thích vì sao lab cần DNS” hoặc “Hỏi tôi một câu về dự án, đợi tôi trả lời rồi góp ý”. Thoại cần kết nối dịch vụ AI; kiến thức khóa học được gửi kèm khi mở cuộc gọi.</p>
    {call&&<VoiceCallModal key={call.mode} isOpen onClose={()=>setCall(null)} initialPersona={call.persona}
      lab={{id:PORTFOLIO_ID,title_vi:'Ôn CV · Hoàng Công Minh',portfolioFocus:call.focus}}
      currentStep={{id:call.focus.chapter_id,title_vi:modes.find(m=>m[0]===call.mode)?.[1]}}/>}
  </section>;
}
