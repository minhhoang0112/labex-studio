import fs from 'node:fs';
import crypto from 'node:crypto';

const directory=new URL('../data/reference/source-lessons/',import.meta.url);
const cache=new Map();
const hash=sections=>crypto.createHash('sha256').update(JSON.stringify(sections)).digest('hex');
export function comparableBody(content,title='') {
  const text=String(content||'').replace(/\r\n/g,'\n').trim();
  const lines=text.split('\n');
  return lines[0]?.replace(/^#{1,6}\s+/,'').trim()===title.trim()
    ? lines.slice(1).join('\n').trim() : text;
}

// Separate immutable captures from generated local grading JSON. Regenerating
// graders/translations cannot silently replace verified original explanations.
export function applySourceContent(lab) {
  if(!lab?.source_lab_id) return lab;
  const file=new URL(Number(lab.source_lab_id)+'.json',directory);
  let source;
  try {
    const stat=fs.statSync(file);
    const old=cache.get(file.href);
    if(old?.mtime===stat.mtimeMs) source=old.value;
    else {
      source=JSON.parse(fs.readFileSync(file,'utf8'));
      if(Number(source.source_lab_id)!==Number(lab.source_lab_id)||hash(source.sections)!==source.sha256) return lab;
      cache.set(file.href,{mtime:stat.mtimeMs,value:source});
    }
  } catch(error) { if(error.code==='ENOENT') return lab; throw error; }
  const sections=lab.sections||lab.steps||[];
  const heading=value=>String(value||'').replace(/[*_`]/g,'').trim();
  if(source.sections.length!==sections.length || source.sections.some((s,i)=>heading(s.title)!==heading(sections[i]?.title))) {
    return {...lab,source_content:{status:'outline-mismatch',checked_at:source.checked_at,source_url:source.source_url}};
  }
  const updated=sections.map((section,i)=>{
    const original=source.sections[i];
    const changed=comparableBody(section.content,section.title)!==comparableBody(original.content,original.title);
    return {...section,title:original.title,content:original.content,source_text_verified:true,
      translation_needs_review:changed,source_url:source.source_url};
  });
  const byId=new Map(updated.map(s=>[s.id,s]));
  return {...lab,source_content:{status:'verified-english',checked_at:source.checked_at,source_url:source.source_url,sha256:source.sha256},
    sections:updated,steps:(lab.steps||[]).map(step=>{
      const section=byId.get(step.id);
      return section?{...step,title:section.title,content:section.content,source_text_verified:true,translation_needs_review:section.translation_needs_review,source_url:source.source_url}:step;
    })};
}
