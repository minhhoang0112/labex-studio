import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
export const isUpskillLab = id => /^luc-day-(?:0\d|1\d|2[01])$/.test(id || '');
const unavailable = message => Object.assign(new Error(message),{code:'ENVIRONMENT_UNAVAILABLE'});
export function sshConfig(env=process.env) {
  const {LUC_SSH_HOST:host,LUC_SSH_USER:user,LUC_SSH_KEY:key,LUC_SSH_KNOWN_HOSTS:known}=env;
  if(!host || !user || !key || !known) throw unavailable('Khóa này cần VM Ubuntu Server riêng. Chưa cấu hình LUC_SSH_HOST/USER/KEY/KNOWN_HOSTS; xem Ngày 0. Container bài Linux khác không thay thế VM của khóa này.');
  if(!/^[a-zA-Z0-9][a-zA-Z0-9.:-]*$/.test(host) || !/^[a-z_][a-z0-9_-]*[$]?$/.test(user) || user==='root') throw unavailable('Host hoặc user SSH không hợp lệ; dùng user thường có sudo trên VM lab.');
  const port=Number(env.LUC_SSH_PORT || 22);
  if(!Number.isInteger(port)||port<1||port>65535) throw unavailable('Cổng SSH không hợp lệ.');
  for(const file of [key,known]) {
    if(!path.isAbsolute(file)||/[\r\n"\x00]/.test(file)||!fs.existsSync(file)||!fs.statSync(file).isFile()) throw unavailable('Key SSH và known_hosts phải là tệp tuyệt đối tồn tại trên backend.');
  }
  return {host,user,key,known,port};
}
const quote = value => "'"+value.replaceAll("'","'\\''")+"'";
export function sshProcess(labId,command,{env=process.env,platform=process.platform}={}) {
  if(!isUpskillLab(labId)) throw unavailable('Bài không thuộc Linux Upskill Challenge.');
  const c=sshConfig(env);
  const args=['-F',platform==='win32'?'NUL':'/dev/null','-i',c.key,'-p',String(c.port),
    '-o','BatchMode=yes','-o','IdentitiesOnly=yes','-o','StrictHostKeyChecking=yes',
    '-o',`UserKnownHostsFile="${c.known.replaceAll('\\','/')}"`,'-o','ConnectTimeout=8',
    '-o','ServerAliveInterval=15','-o','ServerAliveCountMax=2',...(command===undefined?['-tt']:['-T']),`${c.user}@${c.host}`];
  const guard="test \"$(cat /etc/labex-upskill-vm 2>/dev/null)\" = 'LabEx Linux Upskill Challenge dedicated VM v1' || { echo 'Dedicated course VM marker missing; refusing to use this server' >&2; exit 78; }; ";
  const script=guard+(command===undefined?"printf '__LABEX_LOCAL_SHELL_READY_173A__\\n'; exec /bin/bash -l":command);
  args.push('/bin/bash -lc '+quote(script));
  return {file:platform==='win32'?path.join(env.SystemRoot || 'C:\\Windows','System32','OpenSSH','ssh.exe'):'/usr/bin/ssh',args};
}
export async function execUpskill(labId,command) {
  const spec=sshProcess(labId,command);
  try {
    const result=await exec(spec.file,spec.args,{windowsHide:true,timeout:20000,maxBuffer:1024*1024});
    return {...result,exitCode:0,timedOut:false};
  } catch(error) {
    if(error.code===255 || error.code==='ENOENT') throw unavailable('Không kết nối được SSH tới VM Ubuntu. Kiểm tra VM đã bật, mạng, key và fingerprint trong known_hosts.');
    return {stdout:error.stdout || '',stderr:error.stderr || '',exitCode:Number.isInteger(error.code)?error.code:1,timedOut:Boolean(error.killed)};
  }
}
export async function upskillEnvironment(labId) {
  try {
    const result=await execUpskill(labId,'test "$(ps -p 1 -o comm= | xargs)" = systemd && . /etc/os-release && test "$ID" = ubuntu && test "$(id -u)" -ne 0 && printf READY');
    if(result.exitCode!==0 || result.stdout.trim()!=='READY') throw unavailable('VM cần Ubuntu Server có systemd, đăng nhập bằng user thường; chưa xác nhận đúng môi trường.');
    return {available:true,provider:'upskill-ssh',label:'Ubuntu Server riêng · SSH · dữ liệu dùng chung cả khóa',shared:true,capabilities:{terminal:true,files:true,sudo:true,systemd:true,network:true,desktop:false,webide:false}};
  } catch(error) {return {available:false,provider:'upskill-ssh',label:'Chưa kết nối VM Ubuntu Server',shared:true,error:error.message,capabilities:{terminal:false}};}
}
export function upskillConfigured() {try {sshConfig();return true;}catch{return false;}}
