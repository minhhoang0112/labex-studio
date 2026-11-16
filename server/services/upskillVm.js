import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
const folder=path.resolve('server/runtime/vms/linux-upskill-lab');
const vmx=path.join(folder,'linux-upskill-lab.vmx');
const tool='C:\\Program Files (x86)\\VMware\\VMware Workstation\\vmrun.exe';
let busy=false;
function configured(){
  try {return process.platform==='win32' && fs.existsSync(tool) && fs.existsSync(vmx) && JSON.parse(fs.readFileSync(path.join(folder,'owner.json'),'utf8')).course==='linux-upskill-challenge';}catch{return false;}
}
async function run(args){return (await exec(tool,args,{windowsHide:true,timeout:45000,maxBuffer:65536})).stdout;}
export async function upskillVmStatus(){
  if(!configured())return {configured:false,running:false,busy,reason:'Chưa có VM VMware local của khóa.'};
  const list=await run(['list']);
  const running=list.split(/\r?\n/).some(line=>line.trim().toLowerCase()===vmx.toLowerCase());
  return {configured:true,running,busy,label:'Ubuntu Server · VM lab riêng · 2 GB RAM'};
}
export async function powerUpskillVm(action){
  if(!['start','stop'].includes(action)||!configured())throw Error('VM lab chưa được thiết lập.');
  if(busy)throw Error('VM lab đang bật/tắt.');
  busy=true;
  try {
    const s=await upskillVmStatus();
    if(action==='start'&&!s.running)await run(['start',vmx,'nogui']);
    if(action==='stop'&&s.running)await run(['stop',vmx,'soft']);
    return {...await upskillVmStatus(),busy:false};
  } finally {busy=false;}
}
