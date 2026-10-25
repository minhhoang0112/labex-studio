// One short real-provider text turn; never records a physical microphone.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {WebSocket} from 'ws';

const report={passed:false,realProvider:true,physicalMicrophoneTested:false,acknowledged:false,audioChunks:0,transcript:''};
let ws,deadline;
try {
  await new Promise((resolve,reject)=>{
    const started=Date.now();
    ws=new WebSocket('ws://127.0.0.1:5000/ws/ai/live',{origin:'http://127.0.0.1:5000'});
    deadline=setTimeout(()=>reject(Error('Live text reply timed out.')),25000);
    ws.on('open',()=>ws.send(JSON.stringify({type:'start',persona:'tutor'})));
    ws.on('error',reject);
    ws.on('close',()=>{if(!report.passed)reject(Error('Live text session closed before reply.'));});
    ws.on('message',raw=>{
      const msg=JSON.parse(raw);
      if(msg.type==='error' || msg.type==='text-error')return reject(Error(msg.message));
      if(msg.type==='ready'){
        report.model=msg.model;report.setupMs=Date.now()-started;
        ws.send(JSON.stringify({type:'text',id:'live-text-check',text:'Giải thích lệnh pwd bằng một câu tiếng Việt ngắn.'}));
      }
      if(msg.type==='text-sent' && msg.id==='live-text-check')report.acknowledged=true;
      const content=msg.content;
      if(!content)return;
      if(content.outputTranscription?.text)report.transcript+=content.outputTranscription.text;
      report.audioChunks+=(content.modelTurn?.parts || []).filter(p=>p.inlineData?.data && /^audio\/pcm/.test(p.inlineData.mimeType || '')).length;
      if(content.turnComplete){
        report.elapsedMs=Date.now()-started;
        report.passed=report.acknowledged && report.audioChunks>0 && report.transcript.trim().length>0;
        report.passed ? resolve() : reject(Error('Reply lacked acknowledgement, audio or transcription.'));
      }
    });
  });
  assert.equal(report.passed,true);
} catch(error) {report.error=error.message;process.exitCode=1;}
finally {
  clearTimeout(deadline);ws?.close();
  await fs.mkdir('.artifacts',{recursive:true});
  await fs.writeFile('.artifacts/native-voice-text-live.json',JSON.stringify(report,null,2));
}
console.log(JSON.stringify(report,null,2));
