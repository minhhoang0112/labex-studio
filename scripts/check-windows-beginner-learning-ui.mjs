// Browser-only curriculum/console check. VM status is simulated; commands never execute.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;
try{pw=require('playwright-core');}catch{for(const dir of await fs.readdir(path.join(process.env.LOCALAPPDATA,'npm-cache/_npx'))){try{pw=require(path.join(process.env.LOCALAPPDATA,'npm-cache/_npx',dir,'node_modules/playwright-core'));break;}catch{}}}
const browser=await pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
let mutations=0;
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.route('**/api/environment',r=>r.fulfill({json:{available:false}}));
 await page.route('**/api/labs/*/environment',r=>r.fulfill({json:{available:false}}));
 await page.route('**/api/cloud-vm/**',r=>{
   if(r.request().method()!=='GET')mutations++;
   return r.fulfill({json:{controlConfigured:true,powerState:'VM running',powerStateCode:'PowerState/running'}});
 });
 await page.addInitScript(()=>{
   localStorage.setItem('labex.language','vi');
   Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text;}}});
 });
 for(const [id,first] of [['win-fnd-accounts-uac','Get-LocalUser'],['win-nwf-ipv4-routing','ipconfig']]) {
   await page.goto(`http://127.0.0.1:5000/labs/${id}`);
   await page.getByRole('combobox',{name:'Chọn mục bài học',exact:true}).selectOption('1');
   assert.equal((await page.locator('[data-testid="guide-pane"] .prose-lab pre code').first().textContent()).trim(),first);
   assert.ok(!(await page.locator('[data-testid="guide-pane"] .prose-lab').innerText()).includes('Assert-FndWorkspace'));
   const details=page.getByTestId('task-hint').locator('details');
   assert.equal(await details.getAttribute('open'),null);
   await details.locator('summary').click();
   const script=await details.locator('pre code').textContent();
   assert.ok(script.includes('Assert-FndWorkspace'));
   await details.getByRole('button',{name:'Sao chép lệnh gợi ý',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.__copied),script);
   await details.getByRole('button',{name:'Mở PowerShell của web để ghi bằng chứng',exact:true}).click();
   const consoleInput=page.getByRole('textbox',{name:'Lệnh PowerShell trên VM',exact:true});
   await consoleInput.waitFor();await consoleInput.fill(script);
   assert.equal(await consoleInput.inputValue(),script);
   assert.equal(await consoleInput.evaluate(e=>e.tagName),'TEXTAREA');
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Hướng dẫn',exact:true}).click();
 await page.getByTestId('task-hint').getByRole('button',{name:'Mở PowerShell của web để ghi bằng chứng',exact:true}).click();
 await page.getByRole('textbox',{name:'Lệnh PowerShell trên VM',exact:true}).waitFor();
 assert.equal(mutations,0);
 console.log('PASS: short commands first, collector collapsed, exact script copy, web PowerShell navigation, multiline input intact, mobile navigation. No VM commands/power operations.');
}finally{await browser.close();}
