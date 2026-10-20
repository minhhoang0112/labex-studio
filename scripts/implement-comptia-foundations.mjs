// Reviewed against public source captures. Actual commands, never placeholders.
import fs from 'node:fs/promises';
const lessons=[
  {id:'comptia-navigate-the-filesystem-in-linux-590971',commands:[
    ['pwd','cd','pwd','cd ~/project','pwd'],
    ['cd /etc','pwd','cd ~','pwd','cd ~/project','pwd'],
    ['touch sample.txt','touch .hidden_file','ls','ls -a'],
    ['ls -l','ls -la'],
    ['pwd','cd ..','pwd','cd /etc','cd','pwd'],
  ]},
  {id:'comptia-search-text-with-grep-in-linux-590841',commands:[
    ['grep labex /etc/passwd','sudo grep labex /etc/passwd /etc/shadow /etc/group'],
    ['sudo grep -n labex /etc/passwd /etc/shadow /etc/group'],
    ['grep root /etc/passwd','grep ^root /etc/passwd','grep bash$ /etc/passwd'],
    ["grep 'roo*' /etc/passwd","grep 'ro.' /etc/passwd"],
    ["grep -E 'o{2}' /etc/passwd","grep -E 'root|Root' /etc/passwd"],
  ]},
];
const pattern=command=>'^\\s*'+command.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ /g,'\\s+')+'\\s*$';
const scenario={version:1,course_id:'comptia-linux-plus-training-labs',provider:'docker',expected_tasks:10,provenance:'Independently reviewed exact successful commands from public LabEx instructions; not original private graders.',lessons:[]};
for(const definition of lessons) {
  const file='server/data/labs/'+definition.id+'.json';
  const original=await fs.readFile(file,'utf8');
  const lab=JSON.parse(original);
  if(lab.steps.length!==definition.commands.length) throw new Error('Source task count changed; review required');
  const backup='.artifacts/comptia-before-foundations/'+definition.id+'.json';
  await fs.mkdir('.artifacts/comptia-before-foundations',{recursive:true});
  try {await fs.writeFile(backup,original,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
  for(const [index,step] of lab.steps.entries()) {
    const commands=[...new Set(definition.commands[index])];
    let rule={kind:'commands',user:'labex',allowed_status:[0],groups:commands.map(c=>[pattern(c)])};
    if(index===2 && definition.id.includes('navigate')) rule={kind:'all',checks:[{kind:'state',command:'test -f /home/labex/project/sample.txt && test -f /home/labex/project/.hidden_file'},rule]};
    for(const item of [step,...(lab.sections||[]).filter(s=>s.id===step.id)]) {
      item.verification_by_provider={...item.verification_by_provider,docker:rule};
      item.required_capabilities_by_provider={...item.required_capabilities_by_provider,docker:['terminal','files','shell']};
    }
  }
  const manifest='server/data/environment-setups/'+definition.id+'.json';
  await fs.writeFile(manifest,JSON.stringify({version:1,directories:[{path:'/home/labex/project'}],files:[],accounts:[],groups:[],provenance:{source:'public source instructions',fixture_fidelity:'No fabricated lesson output; learner creates the files.'}},null,2)+'\n');
  lab.environment_setup=manifest;
  await fs.writeFile(file,JSON.stringify(lab,null,2)+'\n');
  scenario.lessons.push({lab_id:lab.id,source_lab_id:lab.source_lab_id,setup_manifest:manifest,steps:lab.steps.map((s,i)=>({id:s.id,commands:definition.commands[i]}))});
}
await fs.writeFile('tests/scenarios/comptia-foundations.json',JSON.stringify(scenario,null,2)+'\n');
console.log('Authored Docker graders for 10 foundation tasks in 2 CompTIA labs; run the isolated scenario before treating them as verified.');
