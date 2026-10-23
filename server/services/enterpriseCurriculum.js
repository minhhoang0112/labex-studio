import fs from 'node:fs';
import {getVmTargetConfig} from './cloudConfig.js';
const source=fs.readFileSync(new URL('../runtime/windows/enterprise-common.ps1',import.meta.url),'utf8');
const functions=new Map([...source.matchAll(/^function ([\w-]+)[\s\S]*?(?=^function |$(?![\s\S]))/gm)].map(m=>[m[1],m[0]]));
export function enterpriseHelpers(script){
  const pending=[...functions.keys()].filter(n=>script.includes(n));const names=new Set(pending);
  while(pending.length){const body=functions.get(pending.pop());for(const n of functions.keys())if(body.includes(n)&&!names.has(n)){names.add(n);pending.push(n);}}
  return [...functions].filter(([name])=>names.has(name)).map(([,body])=>body).join('\n');
}
export function enterpriseCommand(labId,script){
  if(!/^win-(adg|dnsdhcp)-[a-z0-9-]+$/.test(labId))throw Error('Invalid enterprise lab ID');
  return `$ErrorActionPreference='Stop';$labId='${labId}'\n${enterpriseHelpers(script)}\n${script}`;
}
export const enterpriseRules=JSON.parse(fs.readFileSync(new URL('../data/windows-enterprise-rules.json',import.meta.url),'utf8'));
export function enterpriseRequirement(rule,{readProof=()=>JSON.parse(fs.readFileSync(new URL('../runtime/state/enterprise-environment.json',import.meta.url),'utf8')),now=Date.now()}={}){
  if(rule.runtime==='isolated-dhcp')return rule.blocked_reason;
  if(rule.runtime==='domain-client'){
    try{
      const p=readProof();
      const time=Date.parse(p.verifiedAt),age=now-time;
      if(p.schema===1 && p.registry?.server===getVmTargetConfig('server').vmName && p.registry?.client===getVmTargetConfig('client').vmName && p.capabilities?.['domain-client']===true && Number.isFinite(age) && age>=-300000 && age<86400000)return null;
    }catch{}
    return rule.blocked_reason;
  }
  return null;
}
