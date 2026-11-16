import test from 'node:test';
import assert from 'node:assert/strict';
import {portfolioCoachInstructions,portfolioOfflineReply} from '../server/services/portfolioCoach.js';
import {liveSetup} from '../server/services/liveVoiceGateway.js';
import {getTutorReply} from '../server/routes/ai.js';
import {readPortfolioReview} from '../server/services/portfolioReview.js';
const context={labId:'portfolio-infrastructure-review',portfolioFocus:{chapter_id:'P16',unit_id:'U09',mode:'incident'}};
test('Full course knowledge reaches live setup without generic 6000 character truncation',()=>{
 const text=liveSetup({context,persona:'interviewer'},{}).setup.systemInstruction.parts[0].text;
 const s=readPortfolioReview();
 for(const c of s.project_walkthrough.chapters){assert.ok(text.includes(c.title));assert.ok(text.includes(JSON.stringify(c.recall.question).slice(1,-1)));}
 for(const q of s.questions)assert.ok(text.includes(JSON.stringify(q.question).slice(1,-1)));
 for(const t of s.incidents)assert.ok(text.includes(t.title));
 assert.match(text,/Hoàng Công Minh/);assert.match(text,/chưa join AD/);assert.match(text,/"chapter":"P16"/);
 assert.match(text,/chỉ hỏi MỘT câu/);assert.match(text,/không áp tiêu chuẩn Senior/);
 assert.ok(text.length<180000);
});
test('Text AI receives same authoritative curriculum, independent from browser supplied content',async()=>{
 let body;
 const reply=await getTutorReply({message:'Hỏi tôi về dự án',context:{...context,content:'wrong runtime Azure'},persona:'interviewer'},
  {env:{GEMINI_API_KEY:'test'},fetchImpl:async(_url,request)=>{body=JSON.parse(request.body);return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Một câu hỏi'}]}}]})};}});
 assert.equal(reply.reply,'Một câu hỏi');
 const text=body.systemInstruction.parts[0].text;
 assert.match(text,/P18/);assert.match(text,/Q60/);assert.match(text,/T16/);assert.ok(!text.includes('wrong runtime Azure'));
});
test('Other courses retain general assistant and offline mode never invents portfolio scoring',async()=>{
 assert.equal(portfolioCoachInstructions({labId:'other'}),'');assert.equal(portfolioOfflineReply({}),null);
 const offline=await getTutorReply({message:'Trả lời rồi',context,persona:'interviewer'},{env:{}});
 assert.equal(offline.mode,'offline');assert.ok(!offline.reply.includes('8/10'));assert.match(offline.reply,/chưa thể/);
});
