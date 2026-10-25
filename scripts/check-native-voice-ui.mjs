// Real Chromium getUserMedia/AudioWorklet, fake mic and deterministic Live socket.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let playwright;
try{playwright=require('playwright-core');}catch{
  const cache=path.join(process.env.LOCALAPPDATA || path.join(os.homedir(),'AppData/Local'),'npm-cache/_npx');
  for(const folder of await fs.readdir(cache)){try{playwright=require(path.join(cache,folder,'node_modules/playwright-core'));break;}catch{}}
}
const browser=await playwright.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const report={passed:false,realProvider:false,physicalMicrophoneTested:false,checks:[]};
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let oldPipelineCalls=0;await page.route('**/api/ai/chat',r=>{oldPipelineCalls++;return r.abort();});await page.route('**/api/ai/tts?*',r=>{oldPipelineCalls++;return r.abort();});
  await page.route('**/api/environment',r=>r.fulfill({json:{available:false}}));await page.route('**/api/cloud-vm/**',r=>r.fulfill({json:{controlConfigured:false}}));
  await page.addInitScript(()=>{
    const trace=window.__live={frames:0,streams:[],sockets:[],nodes:[],starts:[],clears:0,rates:[],texts:[]};
    const media=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia=async c=>{if(trace.denied)throw new DOMException('Denied','NotAllowedError');const s=await media(c);trace.streams.push(s);if(trace.delayMic)await new Promise(resolve=>{trace.releaseMic=resolve;});return s;};
    const resume=AudioContext.prototype.resume;
    AudioContext.prototype.resume=async function(...args){await resume.apply(this,args);if(trace.delayResume)await new Promise(resolve=>{trace.releaseResume=resolve;});};
    window.SpeechRecognition=class{constructor(){throw Error('Old speech recognizer must not run');}};
    const OriginalNode=window.AudioWorkletNode;
    window.AudioWorkletNode=class extends OriginalNode{constructor(...args){super(...args);trace.nodes.push(this);const post=this.port.postMessage.bind(this.port);this.port.postMessage=(data,...rest)=>{if(data.type==='clear')trace.clears++;if(data.type==='rate')trace.rates.push(data.rate);return post(data,...rest);};}};
    const OriginalSocket=window.WebSocket;
    window.WebSocket=class extends EventTarget{
      static OPEN=1;
      constructor(url){super();if(!String(url).endsWith('/ws/ai/live'))return new OriginalSocket(url);this.readyState=0;this.bufferedAmount=0;trace.sockets.push(this);setTimeout(()=>{this.readyState=1;this.onopen?.();},10);}
      send(raw){const m=JSON.parse(raw);if(m.type==='start'){trace.starts.push(m);setTimeout(()=>this.receive({type:'ready',model:'fixture-live'}),10);}if(m.type==='audio')trace.frames++;if(m.type==='pause')trace.paused=true;
        if(m.type==='text'){
          trace.texts.push(m);
          const rejected=trace.rejectNextText;trace.rejectNextText=false;
          setTimeout(()=>{
            this.receive(rejected?{type:'text-error',id:m.id,message:'Tin nhắn chưa được gửi (kiểm thử).'}:{type:'text-sent',id:m.id});
            if(!rejected)this.receive({type:'content',content:{outputTranscription:{text:'Đã nhận câu hỏi bằng chữ.'},turnComplete:true}});
          },20);
        }
      }
      receive(data){this.onmessage?.({data:JSON.stringify(data)});}
      close(){this.readyState=3;this.onclose?.();}
    };
    trace.content=content=>trace.sockets.at(-1).receive({type:'content',content});
    trace.audio=()=>{const pcm=new Int16Array(24000*8).fill(1500),bytes=new Uint8Array(pcm.buffer);let text='';for(const b of bytes)text+=String.fromCharCode(b);trace.content({modelTurn:{parts:[{inlineData:{data:btoa(text),mimeType:'audio/pcm;rate=24000'}}]},outputTranscription:{text:'Đây là câu trả lời đang phát.'}});};
  });
  await page.goto('http://127.0.0.1:5000/learn');
  await page.getByRole('button',{name:'Mở trợ lý Labby AI',exact:true}).click();await page.getByRole('button',{name:'Bật Chế Độ Thoại Trực Tiếp (Voice Mode)',exact:true}).click();
  const call=page.getByRole('region',{name:'Labby Voice',exact:true});await call.getByRole('status').filter({hasText:'Đang lắng nghe'}).waitFor();
  await page.waitForFunction(()=>window.__live.frames>5);report.checks.push('Real AudioWorklet captures and streams 16 kHz mic without Web Speech Recognition.');
  await call.getByRole('button',{name:'Bắt đầu nghe',exact:true}).click();
  await page.evaluate(()=>window.__live.audio());await call.getByRole('status').filter({hasText:'Labby đang nói'}).waitFor();
  const before=await page.evaluate(()=>window.__live.frames);await page.waitForTimeout(350);assert.ok(await page.evaluate(()=>window.__live.frames)>before+5);
  report.checks.push('Microphone frames continue while native AI audio is playing.');
  await page.evaluate(()=>{
    const t=window.__live;
    t.content({inputTranscription:{text:'Đợi đã, '}});
    t.content({modelTurn:{parts:[{inlineData:{data:'AAAAAA==',mimeType:'audio/pcm;rate=24000'}}]}});
    t.content({inputTranscription:{text:'câu hỏi mới.'}});
    t.content({interrupted:true,outputTranscription:{text:' Phần cuối.'}});
    t.content({turnComplete:true});
    t.content({inputTranscription:{text:' Nói tiếp nhé.'}});
  });
  await call.getByRole('status').filter({hasText:'Đang lắng nghe'}).waitFor();assert.ok(await page.evaluate(()=>window.__live.clears)>0);
  assert.match(await call.textContent(),/Đợi đã, câu hỏi mới\. Nói tiếp nhé\./);
  assert.match(await call.textContent(),/Đây là câu trả lời đang phát\. Phần cuối\. …/);
  report.checks.push('Interleaved mic/audio, interruption and turnComplete preserve complete captions and clear sound.');
  await call.getByRole('combobox',{name:'Tốc độ đọc'}).selectOption('1.5');assert.equal(await page.evaluate(()=>window.__live.rates.at(-1)),1.5);
  await call.getByRole('button',{name:'Tắt Micro',exact:true}).click();const muted=await page.evaluate(()=>window.__live.frames);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__live.frames),muted);
  assert.equal(await page.evaluate(()=>window.__live.paused),true);await call.getByRole('button',{name:'Bật lại Micro',exact:true}).click();await page.waitForFunction(value=>window.__live.frames>value,muted);
  report.checks.push('Live speed control, mute flush and unmute resume work.');
  await call.getByRole('button',{name:'Kết nối lại',exact:true}).click();await page.waitForFunction(()=>window.__live.streams.length===2 && window.__live.sockets.length===2);
  assert.equal(await page.evaluate(()=>window.__live.streams[0].getAudioTracks()[0].readyState),'ended');
  await call.getByRole('status').filter({hasText:'Đang lắng nghe'}).waitFor();
  await call.getByRole('button',{name:'Nhắn tin trong cuộc gọi',exact:true}).click();
  const composer=call.getByRole('textbox',{name:'Tin nhắn cho Labby',exact:true});
  await composer.waitFor();assert.equal(await composer.evaluate(el=>document.activeElement===el),true);
  assert.equal(await call.getByRole('button',{name:'Gửi',exact:true}).isDisabled(),true);
  await composer.fill('Giải thích ls -la');await composer.press('Enter');
  await page.waitForFunction(()=>window.__live.texts.length===1);
  await page.waitForFunction(()=>document.getElementById('live-voice-message').value==='');
  assert.match(await call.textContent(),/Giải thích ls -la/);
  assert.match(await call.textContent(),/Đã nhận câu hỏi bằng chữ/);
  await composer.fill('Dòng một');await composer.press('Shift+Enter');await composer.press('X');
  assert.equal(await composer.inputValue(),'Dòng một\nX');
  assert.equal(await page.evaluate(()=>window.__live.texts.length),1);
  await page.evaluate(()=>{window.__live.rejectNextText=true;});
  await call.getByRole('button',{name:'Gửi',exact:true}).click();
  await call.getByRole('alert').filter({hasText:'Tin nhắn chưa được gửi'}).waitFor();
  assert.equal(await composer.inputValue(),'Dòng một\nX');
  await call.getByRole('button',{name:'Tắt Micro',exact:true}).click();
  await call.getByRole('button',{name:'Gửi',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('live-voice-message').value==='');
  assert.equal(await page.evaluate(()=>window.__live.texts.at(-1).text),'Dòng một\nX');
  await call.getByRole('button',{name:'Bật lại Micro',exact:true}).click();
  await call.getByRole('button',{name:'Bật tắt phụ đề',exact:true}).click();
  assert.equal(await composer.isVisible(),true);
  await call.getByRole('button',{name:'Bật tắt phụ đề',exact:true}).click();
  await call.getByRole('button',{name:'Nhắn tin trong cuộc gọi',exact:true}).click();
  report.checks.push('Typed messages autofocus, Enter sends, Shift+Enter adds a newline; rejected sends retain draft; text works with mic muted and captions remain independent.');
  await page.evaluate(()=>window.__live.sockets.at(-1).receive({type:'error',message:'Hạn mức thử nghiệm.'}));await call.getByRole('alert').filter({hasText:'Hạn mức'}).waitFor();
  assert.equal(await page.evaluate(()=>window.__live.streams.at(-1).getTracks()[0].readyState),'ended');
  assert.equal(await call.getByRole('button',{name:'Bắt đầu nghe',exact:true}).isDisabled(),true);
  await call.getByRole('status').filter({hasText:'Cuộc gọi đã ngắt'}).waitFor();
  await call.getByRole('button',{name:'Kết nối lại',exact:true}).click();
  await call.getByRole('status').filter({hasText:'Đang lắng nghe'}).waitFor();
  const countBeforeNavigation=await page.evaluate(()=>window.__live.sockets.length);
  await page.evaluate(()=>{history.pushState({},'','/courses/quick-start-with-linux');window.dispatchEvent(new PopStateEvent('popstate'));});
  await page.waitForFunction(n=>window.__live.sockets.length===n+1,countBeforeNavigation);
  await call.getByRole('status').filter({hasText:'Đang lắng nghe'}).waitFor();
  assert.equal(await page.evaluate(()=>window.__live.starts.at(-1).context.labId),'quick-start-with-linux');
  assert.equal(await page.evaluate(()=>window.__live.streams.at(-2).getTracks()[0].readyState),'ended');
  report.checks.push('Navigating to another lesson/course reconnects with new context and releases the previous mic.');
  await page.evaluate(()=>{const node=window.__live.nodes.at(-1);if(typeof node.onprocessorerror!=='function')throw Error('Active processor error handler missing');node.onprocessorerror(new Event('processorerror'));});
  await call.getByRole('alert').filter({hasText:'Bộ xử lý âm thanh đã dừng'}).waitFor();
  assert.equal(await page.evaluate(()=>window.__live.streams.at(-1).getTracks()[0].readyState),'ended');
  report.checks.push('Audio processor failure releases resources and cannot masquerade as listening.');
  await page.evaluate(()=>{window.__live.denied=true;});await call.getByRole('button',{name:'Kết nối lại',exact:true}).click();await call.getByRole('alert').filter({hasText:'Chưa được cấp quyền mic'}).waitFor();
  await page.evaluate(()=>{window.__live.denied=false;window.__live.delayMic=true;});
  await call.getByRole('button',{name:'Kết nối lại',exact:true}).click();await page.waitForFunction(()=>Boolean(window.__live.releaseMic));
  await call.getByRole('button',{name:'Đóng cuộc gọi',exact:true}).click();assert.equal(await call.count(),0);
  await page.evaluate(()=>window.__live.releaseMic());await page.waitForFunction(()=>window.__live.streams.at(-1).getTracks().every(t=>t.readyState==='ended'));
  report.checks.push('Closing while mic permission resolves late does not leak a track or open a socket.');
  await page.evaluate(()=>{window.__live.delayMic=false;window.__live.delayResume=true;});
  await page.getByRole('button',{name:'Bật Chế Độ Thoại Trực Tiếp (Voice Mode)',exact:true}).click();
  await page.waitForFunction(()=>Boolean(window.__live.releaseResume));
  const socketsBeforeFailure=await page.evaluate(()=>window.__live.sockets.length);
  await page.evaluate(()=>window.__live.streams.at(-1).getTracks()[0].onended());
  await call.getByRole('alert').filter({hasText:'Microphone đã ngắt kết nối'}).waitFor();
  await page.evaluate(()=>window.__live.releaseResume());await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>window.__live.sockets.length),socketsBeforeFailure);
  assert.equal(await page.evaluate(()=>window.__live.streams.at(-1).getTracks()[0].readyState),'ended');
  await call.getByRole('alert').filter({hasText:'Microphone đã ngắt kết nối'}).waitFor();
  await call.getByRole('button',{name:'Đóng cuộc gọi',exact:true}).click();
  report.checks.push('Mic disconnect while audio is opening cannot create a late socket or overwrite the original error.');
  assert.equal(oldPipelineCalls,0);assert.deepEqual(errors,[]);report.checks.push('Retry, quota error, denied mic and close clean up tracks/sockets; zero old chat/TTS calls.');
  report.passed=true;console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await fs.writeFile('.artifacts/native-voice-ui.json',JSON.stringify(report,null,2));}
