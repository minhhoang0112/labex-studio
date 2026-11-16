// Opt-in against the dedicated local VM only. Restore its clean snapshot afterwards.
import 'dotenv/config';
import fs from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {sshProcess} from '../server/pty/upskillSsh.js';
import {loadLab} from '../server/data/catalog.js';
const exec=promisify(execFile);
const prep=[
  '',
  'mkdir -p ~/luc-course/day01; uname -sr > ~/luc-course/day01/kernel.txt',
  "mkdir -p ~/luc-course/day02/archive; printf 'luc-navigation\\n' > ~/luc-course/day02/source.txt; cp ~/luc-course/day02/source.txt ~/luc-course/day02/archive/copy.txt",
  'sudo -n hostnamectl set-hostname luc-lab; sudo -n timedatectl set-timezone Asia/Ho_Chi_Minh',
  'sudo -n apt-get -o DPkg::Lock::Timeout=120 update -qq; sudo -n apt-get -o DPkg::Lock::Timeout=120 install -y -qq mc tree apache2 ufw cron hello build-essential wget logrotate',
  "mkdir -p ~/luc-course/day05; printf 'less reads files\\ndotfiles are convention\\nnano edits text\\n' > ~/luc-course/day05/notes.txt",
  "mkdir -p ~/luc-course/day06; printf 'service=apache2\\nstatus=ready\\n' > ~/luc-course/day06/service-note.txt",
  "sudo -n systemctl start apache2; printf 'LUC service is working\\n' | sudo -n tee /var/www/html/luc.html; curl -fsS http://127.0.0.1/luc.html",
  "mkdir -p ~/luc-course/day08; printf '10.0.0.1 GET 200\\n10.0.0.2 GET 404\\n10.0.0.1 POST 200\\n' > ~/luc-course/day08/access.txt; awk '{print $1}' ~/luc-course/day08/access.txt | sort | uniq -c | sort -nr > ~/luc-course/day08/top.txt",
  'sudo -n ufw allow OpenSSH; sudo -n ufw allow 80/tcp; sudo -n ufw default deny incoming; sudo -n ufw default allow outgoing; sudo -n ufw --force enable',
  `mkdir -p ~/luc-course/day10; (crontab -l 2>/dev/null || :; printf '%s\n' '* * * * * /usr/bin/date -Is >> "$HOME/luc-course/day10/heartbeat.log"') | crontab -; sudo -n systemctl start cron; for n in $(seq 1 70); do test -s ~/luc-course/day10/heartbeat.log && break; sleep 1; done`,
  "mkdir -p ~/luc-course/day11/inputs; printf 'old\\n' > ~/luc-course/day11/inputs/a.log; printf 'keep\\n' > ~/luc-course/day11/inputs/b.txt; find ~/luc-course/day11/inputs -type f -name '*.log' -printf '%f\\n' | sort > ~/luc-course/day11/log-files.txt",
  "mkdir -p ~/luc-course/day12; printf 'LUC transfer test\\n' > ~/luc-course/day12/upload.txt",
  "sudo -n adduser --disabled-password --gecos '' luc-helper; sudo -n groupadd -f luc-ops; sudo -n usermod -aG luc-ops luc-helper",
  'sudo -n mkdir -p /srv/luc-shared; sudo -n chown "$USER":luc-ops /srv/luc-shared; sudo -n chmod 2770 /srv/luc-shared; printf "team notes\\n" > /srv/luc-shared/report.txt; chmod 660 /srv/luc-shared/report.txt',
  'mkdir -p ~/luc-course/day15; LC_ALL=C apt-cache policy hello > ~/luc-course/day15/policy.txt',
  "mkdir -p ~/luc-course/day16/source ~/luc-course/day16/restored; printf 'restore-me\\n' > ~/luc-course/day16/source/important.txt; tar -czf ~/luc-course/day16/backup.tar.gz -C ~/luc-course/day16/source .; tar -xzf ~/luc-course/day16/backup.tar.gz -C ~/luc-course/day16/restored",
  'mkdir -p ~/luc-course/day17; cd ~/luc-course/day17; wget -q https://ftp.gnu.org/gnu/hello/hello-2.12.1.tar.gz; tar -xzf hello-2.12.1.tar.gz; cd hello-2.12.1; ./configure --prefix="$HOME/luc-course/day17/install" >/dev/null; make -j2 >/dev/null; make install >/dev/null',
  `sudo -n sed -i 's/^[[:space:]]*weekly[[:space:]]*$/    daily/' /etc/logrotate.d/apache2; mkdir -p ~/luc-course/day18; printf 'LUC rotation test\\n' > ~/luc-course/day18/application.log; printf '%s\\n' "$HOME/luc-course/day18/application.log {" 'size 1' 'rotate 2' 'copytruncate' '}' > ~/luc-course/day18/rotate.conf; logrotate -s ~/luc-course/day18/state -f ~/luc-course/day18/rotate.conf`,
  "mkdir -p ~/luc-course/day19; cd ~/luc-course/day19; printf 'linked-data\\n' > original.txt; ln original.txt hard.txt; ln -s original.txt soft.txt",
  `mkdir -p ~/luc-course/day20; cat > ~/luc-course/day20/topips.sh <<'SCRIPT'
#!/usr/bin/env bash
set -eu
if [ "$#" -ne 1 ] || [ ! -r "$1" ]; then exit 2; fi
sort "$1" | uniq -c | sort -k1,1nr -k2,2 | head -n 3
SCRIPT
chmod +x ~/luc-course/day20/topips.sh`
];
async function run(day,command,timeout=25000) {
  const p=sshProcess(`luc-day-${String(day).padStart(2,'0')}`,command);
  try{const r=await exec(p.file,p.args,{windowsHide:true,timeout,maxBuffer:1024*1024});return {...r,exitCode:0};}
  catch(e){return {stdout:e.stdout || '',stderr:e.stderr || '',exitCode:e.code || 1};}
}
const from=Number(process.argv.find(a=>a.startsWith('--from='))?.split('=')[1] || 0);
const report=from?JSON.parse(await fs.readFile('.artifacts/upskill-course-live.json','utf8')):{passed:false,checks:[],note:'Automated equivalent operations on dedicated local VM; editor usage, Windows SFTP download and original extensions not certified.'};
delete report.error;
if(from) {report.checks=report.checks.filter(x=>x.day<from);report.aggregatedRuns=true;}
try {
  for(let day=from;day<=20;day++) {
    const lab=loadLab(`luc-day-${String(day).padStart(2,'0')}`),command=lab.steps[0].verification.command;
    const before=await run(day,command);
    if(prep[day]){const r=await run(day,'set -eu\n'+prep[day],240000);if(r.exitCode!==0)throw Error(`Day ${day} setup: ${r.stderr.slice(-1800)}`);}
    const after=await run(day,command);
    if(after.exitCode!==0)throw Error(`Day ${day} grader: ${after.stderr.slice(-1500)} ${after.stdout.slice(-500)}`);
    report.checks.push({day,beforePassed:before.exitCode===0,afterPassed:true});
    await fs.writeFile('.artifacts/upskill-course-live.json',JSON.stringify(report,null,2));
    console.log(`Day ${day}: PASS (before=${before.exitCode===0?'already satisfied':'not passed'})`);
  }
  report.passed=true;
}catch(error){report.error=error.message;process.exitCode=1;}
await fs.writeFile('.artifacts/upskill-course-live.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
