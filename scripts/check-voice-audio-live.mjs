// Exercise the deployed TTS endpoint and real browser media playback with a
// fixed benign phrase. No microphone access and no AI/lesson context is sent.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let playwright;
try {playwright=require('playwright-core');}catch{
  const cache=path.join(process.env.LOCALAPPDATA || path.join(os.homedir(),'AppData/Local'),'npm-cache/_npx');
  for(const folder of await fs.readdir(cache)){try{playwright=require(path.join(cache,folder,'node_modules/playwright-core'));break;}catch{}}
}
assert.ok(playwright);
const browser=await playwright.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
  const page=await browser.newPage();
  await page.route('**/api/environment',route=>route.fulfill({json:{available:false}}));
  await page.goto('http://127.0.0.1:5000/learn');
  const url='/api/ai/tts?text='+encodeURIComponent('Xin chào, đây là kiểm tra giọng nói.');
  const response=await page.request.get('http://127.0.0.1:5000'+url);
  assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/^audio\/mpeg/);
  assert.match(response.headers()['cache-control'],/^private/);
  await page.evaluate(url=>{
    window.__audio=new Audio(url);window.__audio.playbackRate=1.5;
    const button=document.createElement('button');button.textContent='Play test speech';
    button.onclick=()=>{window.__audioStarted=performance.now();window.__audio.play().catch(error=>{window.__audioError=error.message;});};
    window.__audio.onplaying=()=>{window.__audioPlaying ??=performance.now();};
    window.__audio.onended=()=>{window.__audioResult={rate:window.__audio.playbackRate,duration:window.__audio.duration,elapsedMs:performance.now()-window.__audioStarted,playbackMs:performance.now()-window.__audioPlaying,currentTime:window.__audio.currentTime};};
    document.body.append(button);
  },url);
  await page.getByRole('button',{name:'Play test speech',exact:true}).click();
  await page.waitForFunction(()=>window.__audioResult || window.__audioError,null,{timeout:15000});
  const result=await page.evaluate(()=>window.__audioResult || {error:window.__audioError});
  assert.equal(result.rate,1.5,JSON.stringify(result));assert.ok(result.duration>0);assert.ok(Math.abs(result.currentTime-result.duration)<0.2);
  assert.ok(Math.abs(result.playbackMs-result.duration/1.5*1000)<1200,'Actual playback should follow the selected rate.');
  const oversized=await page.request.get('http://127.0.0.1:5000/api/ai/tts?text='+'a'.repeat(201));assert.equal(oversized.status(),400);
  await fs.writeFile('.artifacts/voice-audio-live.json',JSON.stringify({passed:true,physicalMicrophoneTested:false,...result},null,2));
  console.log('PASS actual TTS API and native browser audio:',JSON.stringify(result));
}finally{await browser.close();}
