import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import vm from 'node:vm';
import fs from 'node:fs';
import {WebSocket,WebSocketServer} from 'ws';
import {createLiveVoiceGateway,liveSetup} from '../server/services/liveVoiceGateway.js';

test('Live setup uses native audio, automatic interruption and bounded lesson context',()=>{
  const config=liveSetup({persona:'interviewer',context:{content:'x'.repeat(10000)},model:'untrusted'},{GEMINI_LIVE_MODEL:'test-live'}).setup;
  assert.equal(config.model,'models/test-live');
  assert.deepEqual(config.generationConfig.responseModalities,['AUDIO']);
  assert.equal(config.realtimeInputConfig.activityHandling,'START_OF_ACTIVITY_INTERRUPTS');
  assert.equal(config.realtimeInputConfig.automaticActivityDetection.silenceDurationMs,500);
  assert.ok(config.systemInstruction.parts[0].text.length<7200);
});

async function fixture(t,env={GEMINI_API_KEY:'private-test-key'}){
  const provider=new WebSocketServer({port:0,host:'127.0.0.1'});await once(provider,'listening');
  const received=[];let upstream;
  provider.on('connection',socket=>{upstream=socket;socket.on('message',b=>{const msg=JSON.parse(b);received.push(msg);if(msg.setup)socket.send(JSON.stringify({setupComplete:{}}));});});
  let target;
  const gateway=createLiveVoiceGateway({env,connect:url=>{target=url;return new WebSocket(`ws://127.0.0.1:${provider.address().port}`);}});
  const server=http.createServer();server.on('upgrade',(req,socket,head)=>gateway.upgrade(req,socket,head));server.listen(0,'127.0.0.1');await once(server,'listening');
  const client=new WebSocket(`ws://127.0.0.1:${server.address().port}`);const messages=[];
  client.on('message',b=>messages.push(JSON.parse(b)));await once(client,'open');
  t.after(async()=>{client.terminate();gateway.close();for(const c of provider.clients)c.terminate();await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>provider.close(r))]);});
  const until=async predicate=>{for(let n=0;n<100;n++){if(predicate())return;await new Promise(r=>setTimeout(r,10));}throw Error('fixture timed out');};
  return {client,messages,received,until,get upstream(){return upstream;},get target(){return target;}};
}

test('Live gateway forwards simultaneous mic and audio, interruptions, hides credentials, closes upstream',async t=>{
  const f=await fixture(t);f.client.send(JSON.stringify({type:'start',persona:'tutor'}));await f.until(()=>f.messages.some(m=>m.type==='ready'));
  assert.ok(f.target.includes('private-test-key'));
  assert.ok(!JSON.stringify(f.messages).includes('private-test-key'));
  f.upstream.send(JSON.stringify({serverContent:{modelTurn:{parts:[{inlineData:{data:'AAAAAA==',mimeType:'audio/pcm;rate=24000'}}]}}}));
  f.client.send(JSON.stringify({type:'audio',data:'AQACAA=='}));await f.until(()=>f.received.some(m=>m.realtimeInput?.audio));
  assert.equal(f.received.at(-1).realtimeInput.audio.mimeType,'audio/pcm;rate=16000');
  f.upstream.send(JSON.stringify({serverContent:{interrupted:true}}));await f.until(()=>f.messages.some(m=>m.content?.interrupted));
  f.client.send(JSON.stringify({type:'pause'}));await f.until(()=>f.received.some(m=>m.realtimeInput?.audioStreamEnd));
  f.client.close();await f.until(()=>f.upstream.readyState===WebSocket.CLOSED);
});

test('Live gateway reports missing key and sanitizes upstream quota failures',async t=>{
  const noKey=await fixture(t,{});noKey.client.send(JSON.stringify({type:'start'}));await noKey.until(()=>noKey.messages.some(m=>m.type==='error'));assert.match(noKey.messages[0].message,/GEMINI_API_KEY/);
  const f=await fixture(t);f.client.send(JSON.stringify({type:'start'}));await f.until(()=>f.messages.some(m=>m.type==='ready'));
  f.upstream.close(1008,'quota exceeded private-test-key');await f.until(()=>f.messages.some(m=>m.type==='error'));
  assert.match(f.messages.at(-1).message,/hạn mức/);assert.ok(!JSON.stringify(f.messages).includes('private-test-key'));
});

test('Live text joins the same conversation, acknowledges delivery, and leaves microphone audio available',async t=>{
  const f=await fixture(t);
  f.client.send(JSON.stringify({type:'text',id:'before-ready',text:'Xin chào'}));
  await f.until(()=>f.messages.some(m=>m.type==='text-error' && m.id==='before-ready'));
  assert.ok(!f.received.some(m=>m.realtimeInput?.text));
  f.client.send(JSON.stringify({type:'start'}));await f.until(()=>f.messages.some(m=>m.type==='ready'));
  f.client.send(JSON.stringify({type:'text',id:'typed-1',text:'  Giải thích lệnh ls -la bằng tiếng Việt  '}));
  await f.until(()=>f.messages.some(m=>m.type==='text-sent' && m.id==='typed-1'));
  assert.equal(f.received.find(m=>m.realtimeInput?.text).realtimeInput.text,'Giải thích lệnh ls -la bằng tiếng Việt');
  // Muting/ending the audio stream must not disconnect text input.
  f.client.send(JSON.stringify({type:'pause'}));
  f.client.send(JSON.stringify({type:'text',id:'typed-muted',text:'Mic tắt, vẫn nhắn được'}));
  await f.until(()=>f.messages.some(m=>m.type==='text-sent' && m.id==='typed-muted'));
  f.client.send(JSON.stringify({type:'audio',data:'AQACAA=='}));
  await f.until(()=>f.received.some(m=>m.realtimeInput?.audio));
  f.upstream.send(JSON.stringify({serverContent:{outputTranscription:{text:'Đây là câu trả lời.'},turnComplete:true}}));
  await f.until(()=>f.messages.some(m=>m.content?.outputTranscription?.text==='Đây là câu trả lời.'));
  assert.ok(!JSON.stringify(f.messages).includes('private-test-key'));
});

test('Live text rejects empty, oversized and malformed messages without terminating the call',async t=>{
  const f=await fixture(t);f.client.send(JSON.stringify({type:'start'}));await f.until(()=>f.messages.some(m=>m.type==='ready'));
  for(const [id,text] of [['empty','   '],['long','x'.repeat(4001)],['object',{text:'x'}]]){
    f.client.send(JSON.stringify({type:'text',id,text}));await f.until(()=>f.messages.some(m=>m.type==='text-error' && m.id===id));
  }
  assert.equal(f.received.filter(m=>m.realtimeInput?.text).length,0);
  assert.equal(f.client.readyState,WebSocket.OPEN);
  f.client.send(JSON.stringify({type:'text',id:'limit',text:'a'.repeat(4000)}));
  await f.until(()=>f.messages.some(m=>m.type==='text-sent' && m.id==='limit'));
  assert.equal(f.received.find(m=>m.realtimeInput?.text)?.realtimeInput.text.length,4000);
});

test('Malformed JSON values fail explicitly instead of throwing in a socket callback',async t=>{
  for(const value of [null,[],42]){
    const f=await fixture(t);f.client.send(JSON.stringify(value));await f.until(()=>f.messages.some(m=>m.type==='error'));
    assert.match(f.messages.at(-1).message,/không hợp lệ/);
  }
  const f=await fixture(t);f.client.send(JSON.stringify({type:'start'}));await f.until(()=>f.messages.some(m=>m.type==='ready'));
  f.upstream.send('null');await f.until(()=>f.messages.some(m=>m.type==='error'));assert.match(f.messages.at(-1).message,/không hợp lệ/);
});

function worklet(){
  let Processor;const events=[];
  const context={AudioWorkletProcessor:class{constructor(){this.port={postMessage:event=>events.push(event)};}},sampleRate:48000,registerProcessor:(_name,value)=>{Processor=value;},Int16Array,Math};
  vm.runInNewContext(fs.readFileSync('client/public/audio/live-voice-worklet.js','utf8'),context);
  const processor=new Processor();const message=data=>processor.port.onmessage({data});
  const tick=()=>{const out=new Float32Array(128);processor.process([[new Float32Array(128).fill(0.1)]],[[out]]);return out;};
  return {processor,events,message,tick};
}
test('Audio thread captures 16 kHz mic during playback, interruption clears pending sound',()=>{
  const f=worklet();f.message({type:'audio',pcm:new Int16Array(24000).fill(10000).buffer});
  for(let i=0;i<20;i++)f.tick();
  assert.ok(f.events.some(e=>e.type==='capture' && e.pcm.byteLength===1024));
  assert.ok(f.events.some(e=>e.type==='playing'));assert.ok(f.processor.buffered>0);
  f.message({type:'clear'});assert.ok(f.tick().every(x=>x===0));assert.equal(f.processor.buffered,0);
  f.events.length=0;for(let i=0;i<20;i++)f.tick();assert.ok(f.events.some(e=>e.type==='capture'));
});
test('Audio thread speed changes immediately and mute stops capture without stopping playback',()=>{
  const f=worklet();f.message({type:'audio',pcm:new Int16Array(24000).fill(10000).buffer});
  f.message({type:'rate',rate:2});f.tick();assert.equal(f.processor.offset,128);
  f.message({type:'mute',muted:true});f.events.length=0;for(let i=0;i<30;i++)assert.ok(f.tick().some(x=>x!==0));
  assert.ok(!f.events.some(e=>e.type==='capture'));f.message({type:'mute',muted:false});for(let i=0;i<20;i++)f.tick();assert.ok(f.events.some(e=>e.type==='capture'));
});
