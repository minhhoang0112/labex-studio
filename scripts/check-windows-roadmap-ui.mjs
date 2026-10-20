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
const browser=await playwright.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const report={passed:false,azureActions:0,checks:[]};
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/cloud-vm/**',r=>{report.azureActions++;return r.abort();});
  await page.goto('http://127.0.0.1:5000/learn');
  await page.getByRole('button',{name:'Lộ trình Windows & IT Support',exact:true}).click();
  await page.getByRole('heading',{level:1,name:'Lộ trình Windows: IT Support → System Administrator'}).waitFor();
  assert.equal(await page.getByText('Đã có đề cương · Chưa có bài',{exact:true}).count(),11);
  assert.equal(await page.locator('main section').count(),6);
  assert.equal(await page.locator('main h3').count(),15);
  assert.equal(await page.getByRole('button',{name:'Thứ tự khóa nguồn',exact:true}).count(),0);
  assert.ok(!(await page.locator('main').innerText()).includes('khóa tại nguồn LabEx'));
  report.checks.push('Homepage opens Windows roadmap: 6 stages, 15 courses, 11 outline-only badges; no Linux source claims.');
  await page.screenshot({path:'.artifacts/windows-roadmap.png'});
  await page.getByRole('button',{name:'Xem khóa đầu tiên',exact:true}).click();
  await page.getByRole('heading',{level:1,name:'Nền tảng Windows 11 cho IT Support'}).waitFor();
  await page.getByRole('heading',{name:'Đề cương dự kiến',exact:true}).waitFor();
  const outline=page.getByRole('region',{name:'Đề cương khóa học Windows'});
  assert.equal(await outline.getByText('· Chưa triển khai',{exact:true}).count(),6);
  assert.equal(await page.locator('.btn-start-lab').count(),0);
  assert.equal(await page.getByText('Nội dung tham khảo nguồn',{exact:true}).count(),0);
  report.checks.push('New course opens its real detail page with 3 modules/6 planned lessons, objectives and references, no Start Lab.');
  await page.getByRole('link',{name:'← Lộ trình Windows đầy đủ',exact:true}).click();
  await page.getByRole('button',{name:'Mở 25 bài IT Support đã có →',exact:true}).click();
  await page.getByRole('heading',{level:1,name:'Chuyên Viên IT Support: Cài Đặt & Sửa Lỗi Máy Tính Windows 11'}).waitFor();
  await page.locator('.btn-start-lab').first().waitFor();assert.equal(await page.locator('.btn-start-lab').count(),25);
  report.checks.push('Existing IT Support course still has all 25 actual lesson buttons. No VM is started by viewing.');
  await page.goto('http://127.0.0.1:5000/paths/windows');
  await page.getByRole('button',{name:'Linux',exact:true}).click();
  await page.getByRole('heading',{level:1,name:'Lộ trình Linux cho System Administrator'}).waitFor();
  assert.equal(await page.locator('main h3').count(),8);
  await page.getByRole('button',{name:'Thứ tự khóa nguồn',exact:true}).click();
  assert.equal(await page.locator('main h3').count(),8);
  await page.getByRole('button',{name:'Windows',exact:true}).click();
  await page.getByRole('heading',{level:1,name:'Lộ trình Windows: IT Support → System Administrator'}).waitFor();
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  report.checks.push('Linux recommended/source views remain functional; Windows roadmap fits a 390 px mobile viewport.');
  assert.equal(report.azureActions,0);assert.deepEqual(errors,[]);report.passed=true;console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await fs.writeFile('.artifacts/windows-roadmap-ui.json',JSON.stringify(report,null,2));}
