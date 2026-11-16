import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execUpskill} from '../server/pty/upskillSsh.js';
import {loadLab} from '../server/data/catalog.js';
const checks=[];
async function run(day,command){const r=await execUpskill(`luc-day-${String(day).padStart(2,'0')}`,command);assert.equal(r.exitCode,0,r.stderr);}
async function grade(day,passed){const l=loadLab(`luc-day-${String(day).padStart(2,'0')}`);const r=await execUpskill(l.id,l.steps[0].verification.command);assert.equal(r.exitCode===0,passed,`Day ${day}`);}
await run(9,'sudo -n ufw delete allow 80/tcp');
try{await grade(9,false);checks.push('Missing HTTP rule rejected.');}finally{await run(9,'sudo -n ufw allow 80/tcp');}
await grade(9,true);
await run(14,'sudo -n chmod 777 /srv/luc-shared');
try{await grade(14,false);checks.push('Broad 777 shared-directory permission rejected.');}finally{await run(14,'sudo -n chmod 2770 /srv/luc-shared');}
await grade(14,true);
await run(16,"printf wrong > ~/luc-course/day16/restored/important.txt");
try{await grade(16,false);checks.push('Damaged restored content rejected.');}finally{await run(16,'tar -xzf ~/luc-course/day16/backup.tar.gz -C ~/luc-course/day16/restored');}
await grade(16,true);
await run(20,"cp ~/luc-course/day20/topips.sh ~/luc-course/day20/topips.sh.saved; printf '#!/bin/sh\\necho 2 10.0.0.1\\n' > ~/luc-course/day20/topips.sh");
try{await grade(20,false);checks.push('Hardcoded sample script rejected on fresh input.');}finally{await run(20,'mv ~/luc-course/day20/topips.sh.saved ~/luc-course/day20/topips.sh');}
await grade(20,true);
await fs.writeFile('.artifacts/upskill-negative-live.json',JSON.stringify({passed:true,checks},null,2));
console.log('PASS: '+checks.join(' '));
