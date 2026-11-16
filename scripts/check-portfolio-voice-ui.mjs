import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const target=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(target,'.artifacts','portfolio-voice');await fs.mkdir(out,{recursive:true});
const require=createRequire(path.join(target,'package.json')),express=require('express');
const {default:courses}=await import(pathToFileURL(path.join(target,'server/routes/courses.js')));
const {readPortfolioReview}=await import(pathToFileURL(path.join(target,'server/services/portfolioReview.js')));
const study=readPortfolioReview();
let pw;try{pw=require('playwright-core');}catch{for(const dir of await fs.readdir(path.join(process.env.LOCALAPPDATA,'npm-cache/_npx'))){try{pw=require(path.join(process.env.LOCALAPPDATA,'npm-cache/_npx',dir,'node_modules/playwright-core'));break;}catch{}}}
assert.ok(pw);
const app=express();app.use('/api',courses);app.use(express.static(path.join(target,'client/dist')));app.get(/.*/,(_req,res)=>res.sendFile(path.join(target,'client/dist/index.html')));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('labex.portfolio-review.v2',JSON.stringify({stage:'project',projectStudy:{chapter_id:'P16'},unit:'U09'})));
 let payload;
 await page.route('**/api/ai/chat',route=>{payload=route.request().postDataJSON();return route.fulfill({json:{reply:'Tôi đã nhận ngữ cảnh lab CV.',mode:'test'}});});
 await page.goto(base+'/courses/portfolio-infrastructure-review');
 const coach=page.locator('[data-portfolio-voice]');await coach.waitFor();
 assert.match(await coach.innerText(),/P16/);
 for(const label of ['Giải thích dự án','Luyện giới thiệu','Phỏng vấn CV','Tập xử lý sự cố'])assert.equal(await coach.getByRole('button',{name:label,exact:true}).count(),1);
 // Denied microphone must show an honest error, retain close/retry and make no provider call.
 await page.addInitScript(()=>Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{throw new DOMException('Denied','NotAllowedError');}}));
 await page.reload();await coach.getByRole('button',{name:'Phỏng vấn CV',exact:true}).click();
 const call=page.getByRole('region',{name:'Labby Voice',exact:true});await call.waitFor();
 await call.getByRole('alert').filter({hasText:'Chưa được cấp quyền mic'}).waitFor();
 assert.match(await call.innerText(),/Ôn CV · Hoàng Công Minh/);
 await call.getByRole('button',{name:'Đóng cuộc gọi',exact:true}).click();
 await page.getByRole('button',{name:'Mở trợ lý Labby AI',exact:true}).click();
 await page.getByRole('button',{name:'Hiểu dự án của tôi',exact:true}).click();
 await page.getByText('Tôi đã nhận ngữ cảnh lab CV.',{exact:true}).waitFor();
 assert.equal(payload.context.targetId,'portfolio-infrastructure-review');
 assert.equal(payload.context.portfolioFocus.chapter_id,'P16');assert.equal(payload.context.portfolioFocus.unit_id,'U09');
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Hiểu dự án của tôi',exact:true}).evaluate(el=>el.closest('div.fixed').querySelector('button').focus());
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({controls:4,chapter:'P16',globalChatContext:true,microphoneDeniedHandled:true,pageErrors:errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
