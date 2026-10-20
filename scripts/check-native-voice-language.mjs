// Real native-audio model, fixed synthetic text prompts; no user audio/context.
import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {WebSocket} from 'ws';
import {liveSetup} from '../server/services/liveVoiceGateway.js';

const prompts=[
  {text:'Hello, DNS server bị lỗi thì bắt đầu kiểm tra ở đâu? Trả lời một câu.',language:'vi'},
  {text:'Windows Backup and Recovery: restore point khác backup thế nào? Một câu thôi.',language:'vi'},
  {text:'Chỉ riêng câu trả lời này hãy nói bằng tiếng Anh: DNS là gì? Một câu thôi.',language:'en'},
  {text:'Còn DHCP thì sao? Nói một câu thôi.',language:'vi'},
];
const vietnamese=/[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const persona=process.argv.includes('--interviewer')?'interviewer':'tutor';
const report={passed:false,persona,realProvider:true,physicalMicrophoneTested:false,turns:[]};
const socket=new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key='+encodeURIComponent(process.env.GEMINI_API_KEY));
let deadline,index=-1,transcript='',audioChunks=0;
try{
  await new Promise((resolve,reject)=>{
    deadline=setTimeout(()=>reject(Error('Language test timed out')),60000);
    function next(){
      index++;transcript='';audioChunks=0;
      if(index===prompts.length)return resolve();
      socket.send(JSON.stringify({realtimeInput:{text:prompts[index].text}}));
    }
    socket.on('open',()=>socket.send(JSON.stringify(liveSetup({persona,context:{labTitle:'Windows Server Administration',content:'Explain Windows Backup and Recovery. Active Directory, DNS and DHCP troubleshooting.'}}))));
    socket.on('error',()=>reject(Error('Live connection failed')));
    socket.on('close',code=>{if(index<prompts.length)reject(Error(`Live closed: ${code}`));});
    socket.on('message',raw=>{
      const msg=JSON.parse(raw);if(msg.error)return reject(Error('Provider rejected language test'));
      if(msg.setupComplete)return next();
      const c=msg.serverContent;if(!c)return;
      if(c.outputTranscription?.text)transcript+=c.outputTranscription.text;
      audioChunks+=(c.modelTurn?.parts || []).filter(p=>p.inlineData?.data).length;
      if(c.turnComplete){
        const expected=prompts[index].language;
        const passed=audioChunks>0 && Boolean(transcript.trim()) && (expected==='vi'?vietnamese.test(transcript):!vietnamese.test(transcript));
        report.turns.push({prompt:prompts[index].text,expected,transcript,audioChunks,passed});
        if(!passed)return reject(Error('Unexpected response language: '+JSON.stringify(report.turns.at(-1))));
        next();
      }
    });
  });
  report.passed=true;console.log(JSON.stringify(report,null,2));
}finally{clearTimeout(deadline);socket.close();await fs.writeFile(`.artifacts/native-voice-language${persona==='interviewer'?'-interviewer':''}.json`,JSON.stringify(report,null,2));}
