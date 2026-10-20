// Course data comes from the local backend. All VM requests are fixtures.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { faultScenarios } from '../server/services/windowsFaults.js';
const require=createRequire(import.meta.url);
let playwright;
try { playwright=require('playwright-core'); }
catch {
  const cache=path.join(process.env.LOCALAPPDATA || path.join(os.homedir(),'AppData/Local'),'npm-cache/_npx');
  for (const folder of await fs.readdir(cache)) {
    try { playwright=require(path.join(cache,folder,'node_modules/playwright-core')); break; } catch {}
  }
}
assert.ok(playwright);
const browser=await playwright.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[], actions=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('dialog',dialog=>dialog.accept());
await page.route('**/api/environment',route=>route.fulfill({json:{available:false}}));
await page.route('**/api/cloud-vm/**',route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith('/status')) return route.fulfill({json:{vmName:'CLIENT01 fixture',powerStateCode:'PowerState/running',powerState:'VM running',controlConfigured:true,faultScenario:faultScenarios[url.searchParams.get('labId')] || null}});
  if(url.pathname.endsWith('/fault/prepare')) {
    actions.push(route.request().postDataJSON());
    return route.fulfill({status:409,json:{error:'Baseline fixture: no Azure operation performed.'}});
  }
  throw new Error('Unexpected Azure request: '+url.pathname);
});
try {
  const response=await page.request.get('http://127.0.0.1:5000/api/courses/windows-11-it-support-troubleshooting');
  const data=await response.json();
  assert.equal(data.labs.length,25);
  assert.equal(data.course.steps_count,50);
  assert.deepEqual(data.labs.map(lab=>lab.order),Array.from({length:25},(_,i)=>i+1));
  await page.goto('http://127.0.0.1:5000/courses/windows-11-it-support-troubleshooting');
  await page.getByRole('heading',{name:'Chuyên Viên IT Support: Cài Đặt & Sửa Lỗi Máy Tính Windows 11'}).waitFor();
  await page.getByText('Giáo trình thực hành Windows',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Bắt đầu bài',exact:true}).count(),25);
  assert.equal(await page.getByText('Mỗi bài học đều chạy trên terminal Linux biệt lập kèm hướng dẫn chi tiết').count(),0);
  await page.screenshot({path:'.artifacts/windows-25-course.png',fullPage:true});
  for(const labId of ['win-it-file-extension-fix','win-it-app-config-repair','win-it-deleted-file-restore','win-it-scheduled-backup-fix']) {
    await page.goto('http://127.0.0.1:5000/labs/'+labId);
    await page.getByRole('combobox').first().selectOption('1');
    await page.getByRole('button',{name:'Chuẩn bị sự cố',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Baseline fixture'}).waitFor();
    assert.equal(actions.at(-1).labId,labId); assert.equal(actions.at(-1).confirm,true);
  }
  await page.goto('http://127.0.0.1:5000/labs/win-it-backup-robocopy');
  await page.getByRole('combobox').first().selectOption('1');
  await page.getByText('CLIENT01 fixture',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Chuẩn bị sự cố',exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  await fs.writeFile('.artifacts/windows-expanded-ui.json',JSON.stringify({passed:true,labs:25,tasks:50,realAzure:false,actions,errors},null,2));
  console.log('PASS 25 Windows lessons / 50 tasks; correct ordering; 4 new fault buttons target correct lab; ordinary backup has no injection button.');
} finally {await browser.close();}
