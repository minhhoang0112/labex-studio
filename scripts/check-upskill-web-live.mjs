import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const base='http://127.0.0.1:5000';
const course=await (await fetch(base+'/api/courses/linux-upskill-challenge')).json();
assert.equal(course.labs.length,22);
const environment=await (await fetch(base+'/api/environment?labId=luc-day-00')).json();
assert.equal(environment.provider,'upskill-ssh');assert.equal(environment.available,true);
assert.equal((await (await fetch(base+'/api/labs/luc-day-00/environment')).json()).reset_supported,false);
await new Promise((resolve,reject)=>{
  const ws=new WebSocket('ws://127.0.0.1:5000/ws/terminal?labId=luc-day-00',{origin:base});
  let output='',ready=false;const timeout=setTimeout(()=>{ws.close();reject(Error('Web terminal timed out'));},30000);
  ws.on('error',reject);
  ws.on('message',data=>{
    const p=JSON.parse(data);
    if(p.type==='error'){clearTimeout(timeout);ws.close();reject(Error(p.message));}
    if(p.type==='ready') {ready=true;assert.equal(p.environment.provider,'upskill-ssh');ws.send(JSON.stringify({type:'input',data:"printf 'LUC_WEB_%s\\n' SSH_CONNECTED\r"}));}
    if(p.type==='output'){output+=p.data;if(ready&&output.includes('LUC_WEB_SSH_CONNECTED')){clearTimeout(timeout);ws.close();resolve();}}
  });
});
const require=createRequire(import.meta.url);let pw;
try{pw=require('playwright-core');}catch{
  for(const dir of await fs.readdir(path.join(process.env.LOCALAPPDATA,'npm-cache/_npx'))){try{pw=require(path.join(process.env.LOCALAPPDATA,'npm-cache/_npx',dir,'node_modules/playwright-core'));break;}catch{}}
}
assert.ok(pw);
const browser=await pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/courses/linux-upskill-challenge');
  await page.getByRole('heading',{name:'Linux Upskill Challenge — Quản trị Ubuntu Server',exact:true}).waitFor();
  assert.equal(await page.locator('.btn-start-lab').count(),22);
  await page.locator('.btn-start-lab').first().click();
  await page.locator('[data-upskill-controls]').waitFor();
  await page.waitForFunction(()=>document.querySelector('button[aria-label="Khởi động lại Lab"]')?.disabled===true);
  await page.getByRole('combobox',{name:'Chọn mục bài học',exact:true}).selectOption('1');
  await page.getByText('Đối chiếu nguồn ↗',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'.artifacts/upskill-course-ui.png'});
  let probes=0;
  await page.route('**/api/environment?labId=luc-day-00',async route=>{
    probes++;
    if(probes===1)return route.fulfill({json:{available:false,provider:'upskill-ssh',error:'Ubuntu đang khởi động; chờ SSH.',capabilities:{terminal:false}}});
    return route.continue();
  });
  await page.goto(base+'/labs/luc-day-00?courseId=linux-upskill-challenge');
  await page.getByText('Ubuntu đang khởi động; chờ SSH.',{exact:true}).first().waitFor();
  await page.waitForFunction(()=>document.querySelector('[data-upskill-controls]')?.textContent.includes('SSH đã sẵn sàng'),{},{timeout:30000});
  assert.ok(probes>=2,'Initial SSH unavailability must retry without a manual click');
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
console.log('PASS: 22 lessons, own SSH environment, real web terminal round trip, course UI and shared-VM reset disabled. No VM CV access.');
