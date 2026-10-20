// A fixed benign test phrase only. No microphone capture, history or lab context.
import 'dotenv/config';
import fs from 'node:fs/promises';
import {getTutorReply} from '../server/routes/ai.js';
import {createTextToSpeech} from '../server/services/textToSpeech.js';
const report={checkedAt:new Date().toISOString(),privateContextSent:false};
let start=performance.now();
const reply=await getTutorReply({message:'Xin chào. Hãy trả lời bằng một câu tiếng Việt ngắn.',context:{isVoiceMode:true}});
report.ai={milliseconds:Math.round(performance.now()-start),mode:reply.mode,model:reply.model || null,characters:reply.reply.length,notice:reply.notice || null};
start=performance.now();
try {
  const audio=await createTextToSpeech()('Xin chào, đây là kiểm tra giọng nói.');
  report.tts={milliseconds:Math.round(performance.now()-start),bytes:audio.length,ok:true};
  await fs.writeFile('.artifacts/voice-service-test.mp3',audio);
}catch(error){report.tts={milliseconds:Math.round(performance.now()-start),ok:false,error:error.message};}
await fs.writeFile('.artifacts/voice-services.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(reply.mode==='offline' || !report.tts.ok) process.exitCode=1;
