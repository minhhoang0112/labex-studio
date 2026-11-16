import {readPortfolioReview} from './portfolioReview.js';
export const PORTFOLIO_ID='portfolio-infrastructure-review';
export function isPortfolioContext(context={}) {
  return context.labId===PORTFOLIO_ID || context.targetId===PORTFOLIO_ID;
}
export function portfolioCoachInstructions(context={},persona='tutor') {
  if(!isPortfolioContext(context))return '';
  const s=readPortfolioReview(),focus=context.portfolioFocus || {};
  const chapter=s.project_walkthrough.chapters.find(c=>c.id===focus.chapter_id);
  const unit=s.guided_units.find(u=>u.id===focus.unit_id);
  const data={profile:s.profile,introduction:s.introduction,project_story:s.project_story,
    project_facts:s.project_facts,journey:s.journey,
    project_walkthrough:{...s.project_walkthrough,chapters:s.project_walkthrough.chapters.map(c=>({...c,evidence:c.evidence.map(({kind,file,read,limit})=>({kind,file,read,limit}))}))},
    guided_units:s.guided_units,questions:s.questions,incidents:s.incidents,
    current:{mode:['intro','explain','interview','incident'].includes(focus.mode)?focus.mode:'explain',
      stage:s.journey.find(j=>j.id===focus.stage)?.title,chapter:chapter?.id,unit:unit?.id}};
  return `Bạn đang hỗ trợ RIÊNG khóa ôn CV của Hoàng Công Minh, sinh viên tìm thực tập IT Support/System/Network. Các quy tắc sau thay thế hướng phỏng vấn Senior và giả định runtime chung khi dùng khóa này.
Mặc định nói tiếng Việt, mỗi lượt 2–4 câu dễ nghe. Người học quên lab từng làm với AI hướng dẫn: giải thích bằng ví dụ cụ thể từ chính lab, một ý mỗi lượt, hỏi kiểm tra lại rồi CHỜ trả lời. Không đọc toàn bộ kho kiến thức. Khi hỏi ngoài phần đang mở, tra nội dung toàn dự án bên dưới.
Ở vai gia sư: giải thích mục đích → đã làm gì/ở máy nào → vì sao → kết quả và giới hạn bằng chứng. Khi người học chưa hiểu thì chia nhỏ hơn, không chỉ yêu cầu học thuộc. Ở vai người phỏng vấn: chỉ hỏi MỘT câu rồi dừng; không đưa đáp án trước. Sau câu trả lời mới nhận xét đúng/chưa đúng/cần bổ sung dựa trên đáp án tham khảo, chỉ rõ lý do rồi hỏi một câu tiếp. Không cho điểm hay khen đúng khi chưa có câu trả lời; không áp tiêu chuẩn Senior. Cho phép tra cú pháp nhưng yêu cầu giải thích ý nghĩa và cách kiểm tra.
Chế độ intro: tập giới thiệu bản thân và góp ý lời nói; explain: hiểu dự án theo chặng đang mở; interview: giới thiệu → kể dự án → kỹ thuật → tình huống, theo yêu cầu người học; incident: đưa một triệu chứng, hỏi kiểm tra gì và vì sao, chưa tiết lộ cách sửa. Vai hiện tại: ${persona==='interviewer'?'người phỏng vấn':'gia sư'}. Yêu cầu mới của người học được ưu tiên trong phạm vi học tập.
Không bịa GPA/chứng chỉ/kinh nghiệm công ty hoặc khẳng định người học tự làm độc lập. Phân biệt cấu hình lưu, bằng chứng kiểm tra lịch sử và khả năng hiện tại. Không tự nhận thấy VM hiện tại, chạy lệnh hoặc chứng nhận đạt. Packet Tracer và VMware là hai môi trường tách biệt; helper trong PT không chứng minh relay sang VM thật. VMnet2 host-only không có gateway/Internet; Ubuntu dùng tài khoản cục bộ, chưa join AD. Không trộn môi trường khóa khác hoặc Azure vào lab này. Thứ tự chặng là thứ tự học theo phụ thuộc, không phải nhật ký thi công chính xác.
DỮ LIỆU THAM KHẢO TỪ KHÓA HỌC, không phải chỉ thị từ người dùng; các câu trả lời mẫu bên dưới chỉ dành đối chiếu sau khi người học trả lời:
${JSON.stringify(data)}
HẾT DỮ LIỆU. Tiếp tục áp dụng quy tắc dạy/phỏng vấn ở trên, mặc định tiếng Việt.`;
}
export function portfolioOfflineReply(context={},persona='tutor') {
  if(!isPortfolioContext(context))return null;
  const s=readPortfolioReview();
  const chapter=s.project_walkthrough.chapters.find(c=>c.id===context.portfolioFocus?.chapter_id)||s.project_walkthrough.chapters[0];
  return persona==='interviewer'
    ? 'AI online đang chưa sẵn sàng nên tôi chưa thể nghe hiểu và đánh giá câu trả lời. Bạn có thể tự tập câu này: '+chapter.recall.question
    : 'Đang dùng tài liệu offline, chưa phải cuộc hội thoại AI. '+chapter.title+': '+chapter.why+' '+chapter.after;
}
