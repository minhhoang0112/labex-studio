// Real provider integration using two fixed synthesized phrases, never a physical mic.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {WebSocket} from 'ws';
const require=createRequire(import.meta.url);let playwright;
try{playwright=require('playwright-core');}catch{
  const cache=path.join(process.env.LOCALAPPDATA || path.join(os.homedir(),'AppData/Local'),'npm-cache/_npx');
  for(const folder of await fs.readdir(cache)){try{playwright=require(path.join(cache,folder,'node_modules/playwright-core'));break;}catch{}}
}
const browser=await playwright.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const report={passed:false,physicalMicrophoneTested:false,realProvider:true,model:'',inputTranscripts:[],outputTranscripts:[],audioChunks:0};
let ws,ticker,deadline;
try{
  const page=await browser.newPage();await page.route('**/api/environment',r=>r.fulfill({json:{available:false}}));await page.goto('http://127.0.0.1:5000/learn');
  const phrases=['Giải thích thật chi tiết DNS hoạt động như thế nào trong khoảng một phút.','Dừng lại. Chỉ trả lời số bảy thôi.'];
  const clips=[];
  for(const phrase of phrases){
    const response=await page.request.get('http://127.0.0.1:5000/api/ai/tts?text='+encodeURIComponent(phrase));assert.equal(response.status(),200);
    const base64=(await response.body()).toString('base64');
    const pcm=await page.evaluate(async base64=>{
      const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const ctx=new AudioContext();
      try{const decoded=await ctx.decodeAudioData(bytes.buffer);const offline=new OfflineAudioContext(1,Math.ceil(decoded.duration*16000),16000);
        const source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();
        const rendered=await offline.startRendering();return Array.from(rendered.getChannelData(0),x=>Math.round(Math.max(-1,Math.min(1,x))*32767));
      }finally{await ctx.close();}
    },base64);
    clips.push(Buffer.from(new Int16Array(pcm).buffer));
  }
  await new Promise((resolve,reject)=>{
    let clip=0,offset=0,firstEnd=0,firstAudio=0,secondStart=0,interrupted=0,secondAudio=0;
    const started=Date.now();
    ws=new WebSocket('ws://127.0.0.1:5000/ws/ai/live',{origin:'http://127.0.0.1:5000'});
    deadline=setTimeout(()=>reject(Error('Native voice test timed out: '+JSON.stringify(report))),60000);
    ws.on('open',()=>ws.send(JSON.stringify({type:'start',persona:'tutor'})));
    ws.on('error',reject);
    ws.on('close',()=>{if(!report.passed)reject(Error('Live socket closed: '+JSON.stringify(report)));});
    ws.on('message',b=>{
      const msg=JSON.parse(b);if(msg.type==='error')return reject(Error(msg.message));
      if(msg.type==='ready'){
        report.model=msg.model;report.setupMs=Date.now()-started;
        ticker=setInterval(()=>{
          let chunk=Buffer.alloc(1024);
          if(clip<2 && offset<clips[clip].length){chunk=clips[clip].subarray(offset,offset+1024);offset+=chunk.length;
            if(clip===1 && !secondStart)secondStart=Date.now();
            if(clip===0 && offset>=clips[0].length)firstEnd=Date.now();
          }
          if(chunk.length%2)chunk=Buffer.concat([chunk,Buffer.alloc(1)]);
          if(ws.readyState===1)ws.send(JSON.stringify({type:'audio',data:chunk.toString('base64')}));
        },32);
      }
      const c=msg.content;if(!c)return;
      if(c.inputTranscription?.text)report.inputTranscripts.push(c.inputTranscription.text);
      if(c.outputTranscription?.text)report.outputTranscripts.push(c.outputTranscription.text);
      if(c.interrupted){interrupted=Date.now();report.interrupted=true;report.bargeInMs=interrupted-secondStart;}
      if(c.modelTurn?.parts?.some(p=>p.inlineData?.data)){
        report.audioChunks++;
        if(!firstAudio){firstAudio=Date.now();report.firstReplyMs=firstAudio-firstEnd;
          setTimeout(()=>{clip=1;offset=0;},300);
        }else if(interrupted && !secondAudio){secondAudio=Date.now();report.secondReplyFromSpeechStartMs=secondAudio-secondStart;}
      }
      if(c.turnComplete && secondAudio){report.passed=Boolean(firstEnd && report.interrupted && report.audioChunks>1);resolve();}
    });
  });
  assert.ok(report.passed,JSON.stringify(report));console.log(JSON.stringify(report,null,2));
}finally{
  clearInterval(ticker);clearTimeout(deadline);ws?.close();await browser.close();
  await fs.writeFile('.artifacts/native-voice-live.json',JSON.stringify(report,null,2));
}
