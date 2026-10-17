"""Noobs process, package and networking checks for the private Docker provider."""
import re
import shlex

BASE='/home/labex/project/'


def plans():
    result={}
    def lesson(order,workspace,states,caps):
        root=BASE+workspace
        plan={'root':root,'states':states,'capabilities':['terminal',*caps],
              'setup':{'version':1,'directories':[{'path':root}],'files':[],'accounts':[],'groups':[],
                       'provenance':{'fixture_fidelity':'independently-reconstructed-from-local-instructions','original_bytes_recovered':False}},
              'actions':{},'history':{}}
        result[order]=plan
        return plan
    def exact(path,text):return 'cmp -s '+shlex.quote(path)+' <(printf %s '+shlex.quote(text)+')'
    def history(*patterns):return {'kind':'commands','user':'labex','allowed_status':[0],'groups':[[p] for p in patterns]}
    root=BASE+'process-lab/'
    p=lesson(24,'process-lab',{
        1:'test -s '+root+'system-summary.txt && test "$(head -n1 '+root+'system-summary.txt)" = "$(uname -srm)" && sed -n 2p '+root+'system-summary.txt | grep -Eq "up .*load average"',
        2:'test -s '+root+'process-snapshot.txt && head -n1 '+root+'process-snapshot.txt | grep -Eq "PID.*PPID.*USER.*STAT.*COMMAND"',
        3:'pid=$(cat '+root+'worker.pid) && test "$pid" -gt 1 && ps -o args= -p "$pid" | grep -Fxq "labex-worker 300"',
        4:'for name in worker stubborn helper; do pid=$(cat '+root+'"$name.pid") && test "$pid" -gt 1 && ! kill -0 "$pid" 2>/dev/null || exit 1; done',
        6:exact(root+'exit-status.txt','success=0\nfailure=2\n')+' && '+exact(root+'nohup.log','background: one\nbackground: two\nbackground: three\n'),
    },['files','persistent_processes'])
    p['history'][3]=history(r"^\s*bash\s+-c\s+'exec -a labex-worker sleep 300'\s*&\s*$")
    p['history'][4]=history(r'^\s*kill\s+"\$worker_pid"\s*$',r'^\s*kill\s+-KILL\s+"\$stubborn_pid"\s*$',r"^\s*pkill\s+-TERM\s+-f\s+'\^labex-helper 300\$'\s*$")
    p['wait_for_pass_ms']={6:10000}
    root=BASE+'system-recovery/'
    p=lesson(25,'system-recovery',{1:'pid=$(cat '+root+'runaway.pid) && test "$pid" -gt 1 && ! kill -0 "$pid" 2>/dev/null'},['files','persistent_processes'])
    p['setup']['files']=[{'path':root+'start-runaway.sh','mode':'0755','content':"#!/bin/bash\nbash -c 'exec -a labex-runaway sleep 3600' &\nprintf '%s\\n' \"$!\" > /home/labex/project/system-recovery/runaway.pid\n"}]
    p['setup']['docker']={'startup':[{'script':root+'start-runaway.sh','user':'labex'}]}
    p['actions'][1]=['cd '+root.rstrip('/'),'pid=$(cat runaway.pid)','ps -p "$pid"','kill "$pid"','sleep 1']
    p['history'][1]=history(r'^\s*kill\s+"\$pid"\s*$')
    root=BASE+'package-lab/'
    installed="dpkg-query -W -f='${db:Status-Status}' tree 2>/dev/null | grep -Fxq installed"
    p=lesson(26,'package-lab',{
        1:exact(root+'bash-state.txt','bash installed\n'),
        2:'count=$(cat '+root+'index-file-count.txt) && test "$count" -gt 0 && test -n "$(find /var/lib/apt/lists -maxdepth 1 -type f -name \"*Packages*\" -print -quit)"',
        3:installed+' && test -s '+root+'tree-installed.txt && grep -Eq "^tree .* installed$" '+root+'tree-installed.txt',
        4:'! '+installed+' && '+exact(root+'tree-removed.txt','not-installed\n')+' && test -s '+root+'autoremove-preview.txt',
        5:'test -s '+root+'labex-greeter_1.0_all.deb && '+exact(root+'local-package-output.txt','hello from a local package\n')+' && '+exact(root+'local-package-state.txt','local-package-removed\n')+" && ! dpkg-query -W -f='${db:Status-Status}' labex-greeter 2>/dev/null | grep -Fxq installed",
    },['files','package_management'])
    p['history'][2]=history(r'^\s*sudo\s+apt\s+update\s*$')
    p['history'][3]=history(r'^\s*sudo\s+apt\s+install\s+-y\s+tree\s*$')
    p['history'][4]=history(r'^\s*sudo\s+apt\s+remove\s+-y\s+tree\s*$')
    p['history'][5]=history(r'^\s*sudo\s+apt\s+install\s+-y\s+\./labex-greeter_1\.0_all\.deb\s*$',r'^\s*sudo\s+apt\s+remove\s+-y\s+labex-greeter\s*$')
    add_deb(p,'labex-greeter','1.0','hello from a local package',root+'labex-greeter_1.0_all.deb')
    root=BASE+'software-inventory/'
    p=lesson(27,'software-inventory',{1:"test \"$(dpkg-query -W -f='${Version} ${db:Status-Status}' labex-monitor 2>/dev/null)\" = '2.0 installed' && test -s "+root+'labex-monitor_2.0_all.deb && '+exact('/tmp/noobs-monitor-probe-placeholder','unused')},['files','package_management'])
    # Execute the installed program; do not accept a text file claiming success.
    p['states'][1]="test \"$(dpkg-query -W -f='${Version} ${db:Status-Status}' labex-monitor 2>/dev/null)\" = '2.0 installed' && test -s "+root+'labex-monitor_2.0_all.deb && cmp -s <(labex-monitor) <(printf "monitor status: ready\\n")'
    add_deb(p,'labex-monitor','2.0','monitor status: ready',root+'labex-monitor_2.0_all.deb')
    p['actions'][1]=['cd '+root.rstrip('/'),{'command':'sudo apt install -y ./labex-monitor_2.0_all.deb','timeout_ms':120000},'labex-monitor']
    p['history'][1]=history(r'^\s*sudo\s+apt\s+install\s+-y\s+\./labex-monitor_2\.0_all\.deb\s*$')
    root=BASE+'network-lab/'
    p=lesson(30,'network-lab',{
        2:'test -s '+root+'interface-addresses.txt && grep -Eq "^lo[[:space:]]" '+root+'interface-addresses.txt && test -s '+root+'ifconfig-addresses.txt',
        3:'test -s '+root+'route-summary.txt && gateway=$(ip route show default | awk \'NR==1 {print $3}\') && interface=$(ip route show default | awk \'NR==1 {print $5}\') && test -n "$gateway" && cmp -s '+root+'route-summary.txt <(printf "gateway=%s\\ninterface=%s\\n" "$gateway" "$interface")',
        4:'grep -Eq "1 packets transmitted, 1 received" '+root+'loopback-ping.txt',
        5:'test -s '+root+'dns-result.txt && awk \'{print $1}\' '+root+'dns-result.txt | grep -Eq "^[0-9]+[.][0-9]+[.][0-9]+[.][0-9]+$"',
        7:'sudo -n ufw status | grep -q "^Status: active" && sudo -n ufw status | grep -Eq "^22/tcp[[:space:]].*ALLOW" && sudo -n ufw status | grep -Eq "^8088/tcp[[:space:]].*ALLOW" && grep -q "^Status: active" '+root+'firewall-status.txt && curl -fsS http://127.0.0.1:8088/ | grep -Fq "network demo ready"',
    },['files','network','ifconfig','network_ports','firewall'])
    p['setup']['files']=[{'path':root+'index.html','content':'<h1>network demo ready</h1>\n'}]
    p['setup']['docker']={'http_services':[{'port':8088,'directory':root.rstrip('/'),'user':'labex'}]}
    p['actions'][2]=['cd '+root.rstrip('/'),'ip -brief link','ip -brief address','ip address show dev lo',"primary_if=$(ip route show default | awk 'NR==1 {print $5}')",'ip address show dev "$primary_if"','ifconfig','ifconfig > ifconfig-addresses.txt','ip -brief address > interface-addresses.txt']
    p['history'][7]=history(r'^\s*sudo\s+ufw\s+allow\s+22/tcp\s*$',r'^\s*sudo\s+ufw\s+allow\s+8088/tcp\s*$',r'^\s*sudo\s+ufw\s+--force\s+enable\s*$')
    return result


def add_deb(plan,name,version,message,output):
    root=plan['root']
    tree=root+'/.package-source/'+name
    plan['setup']['files'] += [
        {'path':tree+'/DEBIAN/control','content':f'Package: {name}\nVersion: {version}\nArchitecture: all\nMaintainer: Local Lab <lab@example.invalid>\nDescription: Independently reconstructed local course fixture\n'},
        {'path':tree+'/usr/bin/'+name,'mode':'0755','content':'#!/bin/bash\nprintf "%s\\n" '+shlex.quote(message)+'\n'},
        {'path':root+'/build-fixture.sh','mode':'0755','content':'#!/bin/bash\nset -eu\ndpkg-deb --build '+shlex.quote(tree)+' '+shlex.quote(output)+' >/dev/null\n'},
    ]
    plan['setup']['docker']={'startup':[{'script':root+'/build-fixture.sh','user':'labex'}]}
