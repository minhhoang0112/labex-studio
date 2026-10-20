import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoiceSession} from '../client/src/lib/voiceSession.js';
import {createSpeechPlayer,speechChunks,clampSpeechRate} from '../client/src/lib/speechPlayer.js';
import {getTutorReply} from '../server/routes/ai.js';
import {createTextToSpeech} from '../server/services/textToSpeech.js';

const flush=async()=>{for(let i=0;i<8;i++) await Promise.resolve();};
function fixture(overrides={}) {
  const engines=[], states=[], requests=[], timers=new Map(); let id=0;
  const speaker={stop(){},async speak(_text,options){options?.onPlaying?.();}};
  const session=createVoiceSession({
    makeRecognition:()=>{const engine={start(){this.onstart?.();},abort(){this.aborted=true;}};engines.push(engine);return engine;},
    chat:async body=>{requests.push(body);return {reply:'Trả lời mẫu.',mode:'gemini'};},
    speaker,onChange:patch=>states.push(patch),setTimer:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimer:key=>timers.delete(key),...overrides,
  });
  const result=(text,final=true)=>{const row=[{transcript:text}];row.isFinal=final;engines.at(-1).onresult?.({results:[row]});};
  const runTimers=async(maxMs=1000)=>{for(const [key,value] of [...timers]) if(value.ms<=maxMs){timers.delete(key);value.fn();} await flush();};
  return {session,engines,states,requests,timers,result,runTimers};
}

test('voice sends final result once, resumes listening and preserves alternating history',async()=>{
  const f=fixture();f.session.start();
  const engine=f.engines[0], lateEnd=engine.onend;
  f.result('Giải thích DNS'); lateEnd(); await flush();
  assert.equal(f.requests.length,1);assert.deepEqual(f.requests[0].history,[]);
  await f.runTimers();assert.equal(f.engines.length,2);
  f.result('Còn DHCP thì sao?');await flush();
  assert.deepEqual(f.requests[1].history,[{role:'user',content:'Giải thích DNS'},{role:'assistant',content:'Trả lời mẫu.'}]);
  assert.equal(f.requests[1].context.isVoiceMode,true);f.session.close();
});
test('partial results send on speech end or silence, accept one-character answers',async()=>{
  for(const byEnd of [true,false]) {
    const f=fixture();f.session.start();f.result('ừ',false);
    if(byEnd) f.engines.at(-1).onend(); else await f.runTimers();
    await flush();assert.equal(f.requests.length,1);assert.equal(f.requests[0].message,'ừ');f.session.close();
  }
});
test('silent recognition sessions restart; permissions fail visibly without an infinite retry loop',async()=>{
  const f=fixture();f.session.start();f.engines[0].onend();await f.runTimers();assert.equal(f.engines.length,2);
  f.engines[1].onerror({error:'not-allowed'});await f.runTimers();assert.equal(f.engines.length,2);
  assert.ok(f.states.some(s=>s.error?.includes('Mic đang bị chặn')));f.session.close();
});
test('mute cancels a pending transcript, unmute resumes and close releases callbacks',async()=>{
  const f=fixture();f.session.start();f.result('Đừng gửi câu này',false);f.session.setMuted(true);await f.runTimers();assert.equal(f.requests.length,0);
  f.session.setMuted(false);assert.equal(f.engines.length,2);f.result('Câu mới');await flush();await f.runTimers();
  f.session.close();assert.equal(f.timers.size,0);assert.equal(f.engines.at(-1).onresult,null);
});
test('interrupt aborts slow AI; late replies cannot speak or clear the new turn',async()=>{
  const calls=[], spoken=[];
  const f=fixture({chat:(body,signal)=>new Promise(resolve=>calls.push({body,signal,resolve})),speaker:{stop(){},async speak(text){spoken.push(text);}}});
  f.session.start();f.result('Câu đầu');f.session.interrupt();assert.equal(calls[0].signal.aborted,true);
  f.result('Câu sau');calls[0].resolve({reply:'Phản hồi cũ'});await flush();assert.deepEqual(spoken,[]);
  calls[1].resolve({reply:'Phản hồi mới'});await flush();assert.deepEqual(spoken,['Phản hồi mới']);f.session.close();
});
test('AI failures never claim the microphone failed; the microphone resumes',async()=>{
  const f=fixture({chat:async()=>{throw new Error('HTTP 503');}});f.session.start();f.result('Mic đã nghe');await flush();
  assert.ok(f.states.some(s=>s.error?.includes('Không lấy được câu trả lời AI: HTTP 503')));
  assert.ok(f.states.every(s=>!s.error?.includes('chưa nghe rõ')));await f.runTimers();assert.equal(f.engines.length,2);f.session.close();
});
test('speech preserves long answers, respects chunk boundaries and changes playback rate immediately',async()=>{
  const text='Đây là một câu trả lời tiếng Việt đủ dài để chia thành nhiều đoạn. '.repeat(14);
  const chunks=speechChunks(text);assert.ok(chunks.length>3);assert.ok(chunks.every(chunk=>chunk.length<=170));
  assert.equal(chunks.join(' '),text.trim());assert.equal(clampSpeechRate(10),2);assert.equal(clampSpeechRate('bad'),1.25);
  const audios=[];const player=createSpeechPlayer({rate:1.25,synthesis:null,makeAudio:url=>{
    const audio={url,pause(){},load(){},removeAttribute(){},play(){this.onplaying?.();return Promise.resolve();}};audios.push(audio);return audio;
  }});
  const playing=player.speak(text);await flush();player.setRate(1.75);assert.equal(audios[0].playbackRate,1.75);
  for(let i=0;i<chunks.length;i++){audios[i].onended();await flush();}
  await playing;assert.equal(audios.length,chunks.length);assert.equal(decodeURIComponent(audios.at(-1).url.split('text=')[1]),chunks.at(-1));
});
test('cancelling playback resolves the old queue and discards prefetched audio',async()=>{
  const audios=[];const player=createSpeechPlayer({synthesis:null,makeAudio:()=>{const audio={pause(){this.paused=true;},load(){},removeAttribute(){this.removed=true;},play(){return Promise.resolve();}};audios.push(audio);return audio;}});
  const playing=player.speak('Kiểm tra hủy âm thanh. '.repeat(30));player.stop();await playing;
  assert.ok(audios.every(audio=>audio.paused && audio.removed));
});
test('voice provider request uses compact context, one current question and bounded output',async()=>{
  await getTutorReply({message:'DNS là gì?',context:{isVoiceMode:true,content:'x'.repeat(8000),terminalOutput:'y'.repeat(8000)},history:[{role:'user',content:'DNS là gì?'}]}, {
    env:{GEMINI_API_KEY:'fixture',GEMINI_MODEL:'fixture-model'},fetchImpl:async(_url,options)=>{
      const data=JSON.parse(options.body);assert.equal(data.contents.length,1);assert.equal(data.generationConfig.maxOutputTokens,768);
      assert.ok(data.systemInstruction.parts[0].text.length<5500);
      return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'DNS phân giải tên.'}]}}]})};
    },
  });
});
test('offline voice interviews never fabricate a fixed interview score',async()=>{
  const result=await getTutorReply({message:'Tôi dùng ping',persona:'interviewer',context:{isVoiceMode:true}},{env:{}});
  assert.equal(result.mode,'offline');assert.doesNotMatch(result.reply,/8\/10/);assert.match(result.reply,/chưa thể đánh giá/);
});
test('TTS validates lengths, rejects non-audio, uses a deadline and caches only successful audio',async()=>{
  let count=0;
  const tts=createTextToSpeech({fetchImpl:async(_url,options)=>{count++;assert.ok(options.signal);return {ok:true,headers:new Headers({'content-type':'audio/mpeg'}),arrayBuffer:async()=>Buffer.from('fixture mp3')};}});
  assert.equal((await tts('Xin chào')).toString(),'fixture mp3');await tts('Xin chào');assert.equal(count,1);
  await assert.rejects(tts('a'.repeat(201)),error=>error.status===400);
  const html=createTextToSpeech({fetchImpl:async()=>({ok:true,headers:new Headers({'content-type':'text/html'})})});
  await assert.rejects(html('Xin chào'),error=>error.status===502);
});

test('a playback stall has a bounded watchdog instead of trapping the call in speaking',async()=>{
  const timers=new Map();let id=0;
  const player=createSpeechPlayer({synthesis:null,setTimer:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimer:key=>timers.delete(key),
    makeAudio:()=>({load(){},pause(){},removeAttribute(){},play(){this.onplaying();return Promise.resolve();}})});
  const speaking=player.speak('Giọng đọc mẫu.');
  assert.equal(timers.size,1);
  const timer=[...timers.values()][0];assert.ok(timer.ms<=45000);timer.fn();
  await assert.rejects(speaking,/gián đoạn/);player.stop();
});

test('voice request timeout resumes the microphone and retains the captured question',async()=>{
  const f=fixture({chat:(_body,signal)=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))))});
  f.session.start();f.result('Câu hỏi đã nghe');await f.runTimers(30000);
  assert.ok(f.states.some(state=>state.error?.includes('Mic đã nghe được câu của bạn')));
  await f.runTimers();assert.equal(f.engines.length,2);assert.equal(f.session.getHistory()[0].content,'Câu hỏi đã nghe');f.session.close();
});

test('closing an AI HTTP request aborts the provider without trying the fallback provider',async()=>{
  const controller=new AbortController();let calls=0;
  const pending=getTutorReply({message:'Chào'}, {signal:controller.signal,env:{GEMINI_API_KEY:'fixture',OPENAI_API_KEY:'fixture',OPENAI_MODEL:'fixture'},
    fetchImpl:(_url,options)=>{calls++;return new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted'))));}});
  controller.abort();await assert.rejects(pending);assert.equal(calls,1);
});

test('interrupt also cancels a native Vietnamese fallback voice and resolves its queue',async()=>{
  let native, cancelled=0;
  const player=createSpeechPlayer({synthesis:{getVoices:()=>[{lang:'vi-VN'}],speak:value=>{native=value;},cancel:()=>cancelled++},makeUtterance:text=>({text}),
    makeAudio:()=>({load(){},pause(){},removeAttribute(){},play(){return Promise.reject(new Error('Fixture proxy unavailable'));}})});
  const speaking=player.speak('Xin chào.');await flush();assert.equal(native.lang,'vi-VN');
  player.stop();await speaking;assert.equal(cancelled,1);assert.equal(native.onstart,null);
});
