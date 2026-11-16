import fs from 'node:fs/promises';
import {createWriteStream,createReadStream} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
const base='https://cloud-images.ubuntu.com/releases/noble/release/';
const name='ubuntu-24.04-server-cloudimg-amd64.vmdk';
const folder='.artifacts/upskill-vm-download';await fs.mkdir(folder,{recursive:true});
const target=folder+'/'+name;
if((await fs.statfs('.')).bavail*(await fs.statfs('.')).bsize<6*1024**3)throw Error('Need at least 6 GiB free');
const sums=await (await fetch(base+'SHA256SUMS')).text();
const line=sums.split('\n').find(x=>x.trim().endsWith(name));
if(!line)throw Error('Image checksum not found');const expected=line.split(/\s+/)[0];
let found=false;try{await fs.access(target);found=true;}catch{}
if(!found){
  console.log('Downloading official Ubuntu 24.04 cloud disk (~563 MiB)...');
  const r=await fetch(base+name);if(!r.ok)throw Error(r.status);
  await pipeline(Readable.fromWeb(r.body),createWriteStream(target+'.part'));
  await fs.rename(target+'.part',target);
}
const h=createHash('sha256');for await(const chunk of createReadStream(target))h.update(chunk);
if(h.digest('hex')!==expected)throw Error('Ubuntu image SHA256 mismatch; do not boot');
await fs.writeFile(folder+'/manifest.json',JSON.stringify({source:base+name,sha256:expected,verifiedAt:new Date().toISOString()},null,2));
console.log('Official Ubuntu image SHA256 verified. Existing VM disks untouched.');
