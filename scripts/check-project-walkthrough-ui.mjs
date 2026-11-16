import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const target=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(target,'.artifacts','project-walkthrough');await fs.mkdir(out,{recursive:true});
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
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],runtimeRequests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/api\/(environment|cloud|verify)|\/ws\//.test(r.url()))runtimeRequests.push(r.url());});
 await page.addInitScript(()=>{if(!localStorage.getItem('tour-seeded')){localStorage.setItem('labex.portfolio-review.v2',JSON.stringify({stage:'project',introDraft:'Bản giới thiệu cũ',notes:{L05:'Ghi chú AD cũ'}}));localStorage.setItem('tour-seeded','1');}});
 await page.goto(base+'/courses/portfolio-infrastructure-review');
 await page.getByRole('heading',{name:'Hiểu toàn bộ dự án từ đầu đến cuối',exact:true}).waitFor();
 assert.equal(await page.locator('[data-project-chapter]').getAttribute('data-project-chapter'),'P01');
 assert.equal(await page.getByLabel('Chọn chặng để học — hoặc đi lần lượt từ đầu').locator('option').count(),18);
 await page.getByText('Mở bản đồ thiết bị và danh sách dự án đã làm được',{exact:true}).click();
 assert.equal(await page.getByRole('heading',{name:'Cisco Packet Tracer',exact:true}).count(),1);
 assert.equal(await page.getByRole('heading',{name:'VMware · VMnet2 Host-only',exact:true}).count(),1);
 await page.getByText('Mở bản đồ thiết bị và danh sách dự án đã làm được',{exact:true}).click();
 let imageChecks=0,documentChecks=0;
 for(const c of study.project_walkthrough.chapters){
  await page.getByLabel('Chọn chặng để học — hoặc đi lần lượt từ đầu').selectOption(c.id);
  const article=page.locator('[data-project-chapter]');assert.equal(await article.getAttribute('data-project-chapter'),c.id);
  await article.getByRole('button',{name:'2. Bạn đã làm những gì?',exact:true}).click();
  await article.getByRole('heading',{name:'Những thao tác đã có trong dự án',exact:true}).waitFor();
  await article.getByRole('button',{name:'3. Xem bằng chứng cũ',exact:true}).click();
  for(let i=0;i<c.evidence.length;i++){
   if(c.evidence.length>1)await page.getByLabel('Chọn bằng chứng dự án').selectOption(String(i));
   const e=c.evidence[i];
   if(e.kind==='image'){
    const img=article.getByAltText('Bằng chứng lịch sử: '+e.file);await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(url=>{const img=[...document.images].find(i=>i.getAttribute('src')===url);return img?.complete&&img.naturalWidth>0;},e.url);
    imageChecks++;
   }else{
    const summary=article.getByText('Mở trích đoạn đúng từ tệp dự án',{exact:true});
    if(await summary.locator('..').getAttribute('open')===null)await summary.click();
    assert.ok((await article.locator('pre').innerText()).length>20,c.id+': '+e.file);documentChecks++;
   }
  }
  if(c.id==='P08'){
   await article.getByRole('button',{name:'4. Tự giải thích lại',exact:true}).click();
   await page.locator('#project-recall').fill('OU để tổ chức đối tượng; GG_IT để cấp quyền.');
   await page.locator('#project-chapter-note').fill('Tôi cần tự xem lại membership trên client.');
   await page.getByLabel('Tự đánh giá hiểu chặng dự án').selectOption('explained');
   await page.getByRole('button',{name:'Đối chiếu sau khi tôi đã thử',exact:true}).click();
   await page.reload();
   assert.equal(await page.locator('[data-project-chapter]').getAttribute('data-project-chapter'),'P08');
   assert.equal(await page.locator('#project-recall').inputValue(),'OU để tổ chức đối tượng; GG_IT để cấp quyền.');
   assert.equal(await page.getByLabel('Tự đánh giá hiểu chặng dự án').inputValue(),'explained');
   await page.getByRole('button',{name:'Tôi cần học kỹ hơn khái niệm ở chặng này →',exact:true}).click();
   await page.getByRole('heading',{name:'Tài khoản công ty và phòng ban',exact:true}).waitFor();
   await page.getByText('Ghi lại điều tôi đã hiểu hoặc còn vướng',{exact:true}).click();assert.equal(await page.getByLabel('Ghi chú chủ đề').inputValue(),'Ghi chú AD cũ');
   await page.getByRole('button',{name:/Bước 2.*Hiểu dự án/}).click();
  }
 }
 await page.getByLabel('Chọn chặng để học — hoặc đi lần lượt từ đầu').selectOption('P18');
 await page.locator('[data-project-chapter]').getByRole('button',{name:'4. Tự giải thích lại',exact:true}).click();
 await page.getByRole('button',{name:'Tôi đã đi hết dự án — tập kể ngắn →',exact:true}).click();
 await page.getByRole('heading',{name:'Tập trả lời: “Em kể sơ qua dự án trong CV”',exact:true}).waitFor();
 await page.getByRole('button',{name:'Học dự án từ đầu đến cuối',exact:true}).click();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Tải bản giải thích toàn dự án',exact:true}).click();
 const download=await downloadPromise;await download.saveAs(path.join(out,'HIEU-TOAN-BO-DU-AN.md'));
 const book=await fs.readFile(path.join(out,'HIEU-TOAN-BO-DU-AN.md'),'utf8');assert.match(book,/P01/);assert.match(book,/P18/);assert.match(book,/AI hướng dẫn/);
 await page.getByLabel('Chọn chặng để học — hoặc đi lần lượt từ đầu').selectOption('P10');
 await page.locator('[data-project-chapter]').getByRole('button',{name:'2. Bạn đã làm những gì?',exact:true}).click();
 await page.screenshot({path:path.join(out,'walkthrough-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 await page.screenshot({path:path.join(out,'walkthrough-mobile.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(runtimeRequests,[]);
 console.log(`PASS: 18 chapters, sequential phases, ${imageChecks} image checks, ${documentChecks} document excerpts, saved recall/rating/notes, old notes, concept link, short-story handoff, full export, mobile layout and no VM requests.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
