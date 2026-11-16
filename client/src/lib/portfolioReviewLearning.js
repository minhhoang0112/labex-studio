import {projectWalkthroughMarkdown} from './projectWalkthroughMarkdown.js';
export const STORAGE_KEY = 'labex.portfolio-review.v2';
export function readStudyProgress(storage) {
  try {
    const current=JSON.parse(storage.getItem(STORAGE_KEY)||'null');
    if(current && typeof current==='object' && !Array.isArray(current))return current;
    const old=JSON.parse(storage.getItem('labex.portfolio-review.v1')||'{}');
    return {notes:old?.notes||{},read:Array.isArray(old?.read)?old.read:[],lastQuiz:old?.lastQuiz,stage:'intro',unit:'U01'};
  }catch{return {stage:'intro',unit:'U01'};}
}
export function interviewPack(study) {
  return `${study.prompt}\n\nLỘ TRÌNH LUYỆN\n${study.journey.map((s,i)=>`${i+1}. ${s.title}: ${s.goal}`).join('\n')}\n\nLỜI GIỚI THIỆU THAM KHẢO\n${study.introduction.full}\n\nKỂ DỰ ÁN NGẮN\n${study.project_story.full}\n\nSỰ THẬT DỰ ÁN\n${study.project_facts}\n\nHIỂU DỰ ÁN TỪ ĐẦU ĐẾN CUỐI\n${projectWalkthroughMarkdown(study.project_walkthrough)}\n\nCHỦ ĐỀ ĐÃ BIÊN SOẠN\n${study.guided_units.map(u=>`${u.id} ${u.title}\nMục tiêu: ${u.goal}\nCâu trả lời gợi ý: ${u.spoken_answer}`).join('\n\n')}\n\nNGÂN HÀNG CÂU HỎI — không đọc đáp án trước cho người học\n${study.questions.map(q=>`${q.id} ${q.question}\nGợi ý: ${q.answer}\nHỏi sâu: ${q.followup}`).join('\n\n')}\n\nTICKET GIẢ LẬP\n${JSON.stringify(study.incidents,null,2)}`;
}
export function studyMarkdown(study) {
  const units=study.guided_units.map(u=>`## ${u.id} · ${u.title}\n\nMục tiêu: ${u.goal}\n\n### Dùng để làm gì?\n${u.need}\n\nTrong lab: ${u.scene}\n\n### Từ cần hiểu\n${u.terms.map(t=>`- ${t.term}: ${t.meaning}`).join('\n')}\n\n### Luồng hoạt động\n${u.flow.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n### Ví dụ mẫu\n${u.example.question}\n\n${u.example.steps.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\nKết luận: ${u.example.conclusion}\n\n### Tự nhớ lại\n${u.recall.question}\n\nGợi ý: ${u.recall.answer}\n\n### Trả lời phỏng vấn\n${u.spoken_answer}\n\n### Tra lệnh\n${u.commands.map(c=>`**${c.machine}**\n\n\`\`\`text\n${c.command}\n\`\`\`\n\nMục đích: ${c.purpose}\n\nĐọc kết quả: ${c.read}`).join('\n\n')}`).join('\n\n');
  const reference=study.lessons.map(l=>`## ${l.id} · ${l.title}\n\n${l.body}\n\n\`\`\`text\n${l.commands}\n\`\`\`\n\nBài tự làm: ${l.exercise}\n\nKỳ vọng: ${l.expected}`).join('\n\n');
  return `# ${study.name}\n\nCập nhật ${study.revision}\n\n# 1. Giới thiệu bản thân\n\n${study.introduction.full}\n\nBản ngắn:\n${study.introduction.short}\n\n# 2. Hiểu toàn bộ dự án rồi tập kể\n\n${projectWalkthroughMarkdown(study.project_walkthrough)}\n\n## Kể ngắn sau khi hiểu\n${study.project_story.full}\n\n# 3. Hiểu từng phần\n\n${units}\n\n# 4. Luyện phỏng vấn\n\n${interviewPack(study)}\n\n# 5. Tự kiểm tra\n\n${study.quiz.map(q=>`## ${q.id} · ${q.prompt}\n\n${q.options.map((o,i)=>`${String.fromCharCode(65+i)}. ${o}`).join('\n')}\n\nĐáp án: ${String.fromCharCode(65+q.correct)}. ${q.explanation}`).join('\n\n')}\n\n# Tài liệu đọc sâu\n\n${reference}\n\n# Nguồn\n\n${[...study.sources,...study.teaching_sources].map(s=>`- ${s.title}: ${s.url}`).join('\n')}`;
}
export function downloadMarkdown(name,text) {
  const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
