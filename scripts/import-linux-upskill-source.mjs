import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const commit='fc9ed4f08ee315541292d8f5aa9f515832668f40';
const base='server/data/reference/linux-upskill-challenge';
await fs.mkdir(path.join(base,'source'),{recursive:true});
const files=['LICENSE','docs/how-this-works.md','docs/00-Local-Server.md','docs/00-Azure-Free-Tier.md',...Array.from({length:22},(_,i)=>`docs/${String(i).padStart(2,'0')}.md`)];
const records=await Promise.all(files.map(async file=>{
  const url=`https://raw.githubusercontent.com/livialima/linuxupskillchallenge/${commit}/${file}`;
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(`${file}: ${response.status}`);
  const content=await response.text();
  if(file==='LICENSE'&&!content.includes('CC BY 4.0'))throw Error('Unexpected license');
  await fs.writeFile(path.join(base,'source',path.basename(file)),content);
  return {file,source_url:url,sha256:createHash('sha256').update(content).digest('hex')};
}));
await fs.writeFile(path.join(base,'manifest.json'),JSON.stringify({repository:'https://github.com/livialima/linuxupskillchallenge',website:'https://linuxupskillchallenge.org/',commit,license:'CC BY 4.0',attribution:'Steve Brorens (@snori74), maintained by Livia Lima and contributors',imported_at:new Date().toISOString(),files:records},null,2)+'\n');
console.log(`Imported ${records.length} source files at ${commit}; license and hashes recorded.`);
