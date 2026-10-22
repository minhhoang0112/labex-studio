// Real local content/rendering. VM status/grading responses are fixtures; no Azure action.
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
const report={passed:false,realAzure:false,checks:[]};
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/cloud-vm/**',route=>{
    if(new URL(route.request().url()).pathname.endsWith('/status'))return route.fulfill({json:{vmName:'Server fixture',powerState:'VM deallocated',powerStateCode:'PowerState/deallocated',controlConfigured:true}});
    throw Error('Unexpected cloud action');
  });
  await page.addInitScript(()=>localStorage.setItem('labex.local.progress.v2',JSON.stringify({'win-file-system-ntfs':{passed:['win-fs-03-sec-1'],complete:true}})));
  const cases=[['win-file-system-ntfs','bảng quyền'],['win-manage-services-processes','Sort-Object DisplayName'],
    ['win-event-log-analysis','NoMatchingEventsFound'],['win-powershell-scripting-automation','health_report.csv'],
    ['win-server-ad-users-groups','Tạo OU'],['win-server-iis-web','LabEx PortalCorp'],['win-performance-monitoring-bottlenecks','PercentProcessorTime']];
  for(const [id,expected] of cases){
    await page.goto('http://127.0.0.1:5000/labs/'+id);
    await page.getByRole('combobox').first().selectOption('1');
    await page.getByRole('heading',{name:'Bản chất và tình huống thực tế',exact:true}).waitFor();
    assert.ok((await page.locator('body').innerText()).includes(expected),id);
    await page.getByRole('heading',{name:'Kết quả và cách tự kiểm tra',exact:true}).waitFor();
    await page.getByRole('heading',{name:'Câu hỏi tự giải thích',exact:true}).waitFor();
  }
  report.checks.push('Seven revised lesson types render explanations, commands, expectations and self-assessment.');
  await page.goto('http://127.0.0.1:5000/labs/win-file-system-ntfs');
  await page.getByRole('combobox').first().selectOption('1');
  await page.getByText('0 / 1 hoàn thành',{exact:true}).waitFor();
  const old=await page.request.post('http://127.0.0.1:5000/api/verify',{data:{labId:'win-file-system-ntfs',stepId:'win-fs-03-sec-1'}});
  assert.equal(old.status(),404);
  let request;
  await page.route('**/api/verify',route=>{request=route.request().postDataJSON();return route.fulfill({json:{passed:false,message:'Chưa có bằng chứng đọc ACL trên VM.'}});});
  await page.getByRole('button',{name:'Kiểm tra kết quả',exact:true}).click();
  await page.getByText('Chưa có bằng chứng đọc ACL trên VM.',{exact:true}).waitFor();
  assert.equal(request.stepId,'win-fs-03-sec-1-v4');await page.getByText('0 / 1 hoàn thành',{exact:true}).waitFor();
  report.checks.push('Old completion/step IDs are rejected; failure stays incomplete; UI submits the new task ID.');
  assert.deepEqual(errors,[]);report.passed=true;console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await fs.writeFile('.artifacts/windows-starter-ui.json',JSON.stringify(report,null,2));}
