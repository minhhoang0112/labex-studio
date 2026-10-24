import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, CheckCircle2, Mic, RotateCcw} from 'lucide-react';
import {api} from '../lib/api';
import VoiceCallModal from '../components/VoiceCallModal';

const post = (method, answers) => ({method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answers})});
const button = 'rounded-xl px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40';

export default function CourseAssessment({assessmentId, onBack, onOpenLab}) {
  const storageKey = `labex.assessment.${assessmentId}`;
  const [summary, setSummary] = useState(null), [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({}), [index, setIndex] = useState(0);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [saving, setSaving] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false), [onlyWrong, setOnlyWrong] = useState(true), [voice, setVoice] = useState(null);
  const pendingSave = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setSummary(await api(`/api/assessments/${encodeURIComponent(assessmentId)}`, {signal: controller.signal}));
        let saved; try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { /* optional storage */ }
        if (saved?.attemptId) {
          const attempt = await api(`/api/assessments/attempts/${encodeURIComponent(saved.attemptId)}`, {signal: controller.signal});
          if (controller.signal.aborted) return;
          setExam(attempt);
          const valid = new Map(attempt.questions.map(q => [q.id, new Set(q.options.map(o => o.id))]));
          const draft = Object.fromEntries(Object.entries(saved.answers || {}).filter(([id, choice]) => valid.get(id)?.has(choice)));
          setAnswers(attempt.result ? attempt.answers : {...attempt.answers, ...draft});
          setIndex(Number.isInteger(saved.index) ? Math.max(0, Math.min(saved.index, attempt.questions.length - 1)) : 0);
        }
      } catch (e) { if (e.name !== 'AbortError') setError(e.message); }
    }
    load(); return () => controller.abort();
  }, [assessmentId, storageKey]);

  useEffect(() => {
    if (!exam) return;
    try {localStorage.setItem(storageKey, JSON.stringify({attemptId: exam.id, answers, index}));} catch { /* server draft still works */ }
  }, [exam, answers, index, storageKey]);

  useEffect(() => {
    if (!exam || exam.result) return;
    const controller = new AbortController(); pendingSave.current = controller;
    const timer = setTimeout(async () => {
      setSaving('Đang lưu…');
      try {
        await api(`/api/assessments/attempts/${exam.id}/answers`, {...post('PUT', answers), signal: controller.signal});
        if (!controller.signal.aborted) setSaving('Đã lưu câu trả lời');
      } catch (e) { if (e.name !== 'AbortError') setSaving('Chưa lưu lên máy chủ. Đáp án vẫn được giữ trong trang này; thử nộp lại khi có kết nối.'); }
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [exam, answers]);

  async function start() {
    setBusy(true); setError(''); setVoice(null); pendingSave.current?.abort();
    try {
      const attempt = await api(`/api/assessments/${encodeURIComponent(assessmentId)}/attempts`, {method: 'POST'});
      setExam(attempt); setAnswers({}); setIndex(0); setConfirmSubmit(false); setSaving('');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function submit() {
    setBusy(true); setError(''); pendingSave.current?.abort();
    try {
      const result = await api(`/api/assessments/attempts/${exam.id}/submit`, post('POST', answers));
      setExam(result); setAnswers(result.answers); setConfirmSubmit(false); setSaving('');
      window.scrollTo({top: 0, behavior: 'smooth'});
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const question = exam?.questions[index], result = exam?.result;
  const answered = Object.keys(answers).length;
  const group = summary?.covered_labs.find(g => g.lab_id === question?.lab_id);
  const optionLabel = (q, id) => q.options.find(o => o.id === id)?.text || 'Chưa trả lời';
  return <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
    <button className="flex items-center gap-2 text-primary-600 dark:text-primary-300" onClick={onBack}><ArrowLeft size={18}/>Trở về khóa học</button>
    <header className="space-y-3">
      <p className="text-sm font-semibold text-primary-600 dark:text-primary-300">BÀI 11 · KIỂM TRA TỔNG KẾT · BIÊN SOẠN LOCAL</p>
      <h1 className="text-2xl sm:text-3xl font-bold">Quick Start with Linux — Kiểm tra kiến thức</h1>
      <p className="text-slate-600 dark:text-slate-300">{summary?.question_count || '…'} câu trắc nghiệm bao quát 10 bài. Mỗi câu chọn một đáp án, các câu có trọng số bằng nhau; bỏ trống tính sai. Đạt từ {summary?.pass_percent || 80}%. Không giới hạn thời gian, có thể làm lại.</p>
      <p className="text-sm text-slate-500">Bài kiểm tra bổ sung của web local. Điểm kiến thức được lưu riêng và không thay thế kết quả thực hành terminal.</p>
    </header>
    {error && <p role="alert" className="p-4 rounded-xl bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
    {!exam && summary && <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-5">
      <h2 className="text-xl font-bold">Nội dung kiểm tra</h2>
      <ol className="grid sm:grid-cols-2 gap-3">{summary.covered_labs.map((g, i) => <li key={g.lab_id} className="text-sm">{i + 1}. {g.title} <span className="text-slate-500">· {g.question_count} câu</span></li>)}</ol>
      <button className={`${button} bg-primary-600 text-white hover:bg-primary-700`} onClick={start} disabled={busy}>{busy ? 'Đang tạo đề…' : 'Bắt đầu bài 11'}</button>
    </div>}
    {!summary && !error && <p role="status">Đang tải bài kiểm tra…</p>}
    {exam && !result && <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 sm:p-8 space-y-6">
        <div className="flex flex-wrap gap-2 justify-between text-sm text-slate-500"><span>Câu {index + 1} / {exam.questions.length}</span><span>{group?.title}</span></div>
        <fieldset disabled={busy} className="space-y-4">
          <legend className="text-lg font-semibold mb-5 whitespace-pre-wrap">{question.prompt}</legend>
          {question.options.map((option, i) => <label key={option.id} className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer break-words ${answers[question.id] === option.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-slate-200 dark:border-slate-700 hover:border-primary-400'}`}>
            <input type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id} onChange={() => {setAnswers(previous => ({...previous, [question.id]: option.id})); setConfirmSubmit(false);}} className="mt-1 shrink-0"/>
            <span><strong>{String.fromCharCode(65 + i)}.</strong> {option.text}</span>
          </label>)}
        </fieldset>
        <div className="flex justify-between gap-3 flex-wrap">
          <button className={button} disabled={!index || busy} onClick={() => setIndex(index - 1)}>← Câu trước</button>
          <button className={button} disabled={!answers[question.id] || busy} onClick={() => setAnswers(previous => {const next = {...previous}; delete next[question.id]; return next;})}>Bỏ lựa chọn</button>
          <button className={button} disabled={index === exam.questions.length - 1 || busy} onClick={() => setIndex(index + 1)}>Câu tiếp →</button>
        </div>
      </section>
      <aside className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h2 className="font-bold">Đã trả lời {answered}/{exam.questions.length}</h2>
        <p className="text-xs text-slate-500">Xanh: đã chọn · Viền đậm: câu đang xem. Có thể quay lại sửa trước khi nộp.</p>
        <div className="grid grid-cols-8 gap-1">{exam.questions.map((q, i) => <button key={q.id} aria-label={`Câu ${i+1}${answers[q.id] ? ', đã trả lời' : ', chưa trả lời'}`} aria-current={index === i ? 'step' : undefined} disabled={busy} onClick={() => setIndex(i)} className={`py-1 rounded border text-xs ${index === i ? 'ring-2 ring-primary-500' : ''} ${answers[q.id] ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'border-slate-300 dark:border-slate-600'}`}>{i + 1}</button>)}</div>
        <p role="status" className="text-xs text-slate-500">{saving}</p>
        {!confirmSubmit ? <button className={`${button} w-full bg-primary-600 text-white hover:bg-primary-700`} onClick={() => setConfirmSubmit(true)} disabled={busy}>Nộp bài và chấm điểm</button> : <div className="space-y-3">
          <p className="text-sm">{exam.questions.length - answered} câu còn trống sẽ tính sai. Sau khi nộp không sửa lượt này. Xác nhận nộp?</p>
          <button className={`${button} w-full bg-primary-600 text-white hover:bg-primary-700`} disabled={busy} onClick={submit}>{busy ? 'Đang chấm…' : 'Xác nhận nộp bài'}</button>
          <button className={`${button} w-full`} disabled={busy} onClick={() => setConfirmSubmit(false)}>Tiếp tục làm</button>
        </div>}
      </aside>
    </div>}
    {result && <>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div><h2 className="text-2xl font-bold">{result.score_out_of_10}/10 · {result.percent}%</h2><p>{result.correct}/{result.total} câu đúng · {result.unanswered} câu bỏ trống</p></div>
          <span className={`px-4 py-2 rounded-full font-bold ${result.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{result.passed ? 'Đạt' : 'Cần ôn tập thêm'}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">{result.groups.map(g => <div key={g.lab_id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm flex gap-3 justify-between items-center">
          <div><p className="font-medium">{g.title}</p><p className="text-slate-500">{g.correct}/{g.total} đúng · {Math.round(g.correct*100/g.total)}%</p></div>
          <button onClick={() => onOpenLab(g.lab_id)} className="text-primary-600 dark:text-primary-300 shrink-0 underline">Ôn lab</button>
        </div>)}</div>
        <div className="flex gap-3 flex-wrap"><button className={`${button} flex items-center gap-2`} disabled={busy} onClick={start}><RotateCcw size={16}/>Làm lượt mới</button>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyWrong} onChange={e => setOnlyWrong(e.target.checked)}/>Chỉ xem câu sai/bỏ trống</label></div>
        <p className="text-sm text-slate-500">Có thể vấn đáp bằng thoại với Labby để ôn từng câu sau khi nộp. Nhận xét thoại là hỗ trợ học tập và không thay đổi điểm trắc nghiệm.</p>
      </section>
      <section aria-label="Giải thích đáp án" className="space-y-4">
        {onlyWrong && result.correct === result.total && <p className="flex gap-2 items-center text-emerald-600"><CheckCircle2 size={20}/>Bạn trả lời đúng toàn bộ. Bỏ chọn bộ lọc để xem tất cả lời giải.</p>}
        {result.reviews.filter(r => !onlyWrong || !r.correct).map(review => {
          const q = exam.questions.find(q => q.id === review.id), n = exam.questions.indexOf(q) + 1;
          return <article key={review.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="font-bold">Câu {n}. {review.prompt}</h3>
            <p className={review.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-300'}>Bạn chọn: {optionLabel(q, review.selected_option_id)} · {review.correct ? 'Đúng' : 'Sai / chưa trả lời'}</p>
            <p><strong>Đáp án đúng:</strong> {optionLabel(q, review.correct_option_id)}</p>
            <p className="text-slate-600 dark:text-slate-300">{review.explanation}</p>
            <button className={`${button} text-sm inline-flex items-center gap-2`} onClick={() => setVoice(review)}><Mic size={16}/>Vấn đáp với Labby về câu này</button>
          </article>;
        })}
      </section>
    </>}
    {voice && <VoiceCallModal key={voice.id} isOpen onClose={() => setVoice(null)} initialPersona="interviewer"
      lab={{id: voice.lab_id, title_vi: 'Ôn tập sau bài kiểm tra Quick Start with Linux'}}
      currentStep={{id: voice.id, title_vi: voice.prompt, task: `Câu hỏi ôn tập: ${voice.prompt}`}}
      lastTerminalOutput={`Kết quả bài kiểm tra kiến thức (không phải output terminal): ${voice.correct ? 'Đúng' : 'Chưa đúng'}. Giải thích tham khảo: ${voice.explanation}. Điểm trắc nghiệm đã cố định; cuộc thoại này chỉ dùng ôn tập.`}/>} 
  </div>;
}
