"""Local fixtures and independently authored checks for the existing Noobs text.

Source fixture bytes were not supplied. All fixtures here are reconstructed from
the names, counts and acceptance criteria in the local teaching material.
"""
import shlex

BASE = '/home/labex/project/'


def plans():
    result = {}

    def lesson(order, workspace, states, files=None, directories=None, capabilities=None):
        root = BASE + workspace
        setup = {'version': 1, 'directories': [{'path': root}], 'files': [], 'accounts': [], 'groups': [],
                 'provenance': {'fixture_fidelity': 'reconstructed-from-local-instructions', 'original_bytes_recovered': False}}
        for path in directories or []:
            setup['directories'].append({'path': root + '/' + path})
        for path, content in (files or {}).items():
            setup['files'].append({'path': root + '/' + path, 'content': content})
        result[order] = {'setup': setup, 'root': root, 'states': states,
                         'capabilities': capabilities or ['terminal', 'files']}
        return result[order]

    def exact(path, text):
        return 'cmp -s ' + shlex.quote(path) + ' <(printf %s ' + shlex.quote(text) + ')'

    def file(path, text):
        return exact(path, text)

    root = BASE + 'first-commands/'
    lesson(1, 'first-commands', {
        1: file(root+'greeting.txt', 'Hello, Linux\n'),
        3: file(root+'calculation.txt', '42\n'),
        4: 'test -s '+root+'labex-art.txt && cmp -s '+root+'labex-art.txt <(figlet LabEx)',
        5: file(root+'terminal-ready.txt', 'Terminal ready\n'),
    })
    lesson(2, 'terminal-greeting', {1: 'test -s '+BASE+'terminal-greeting/welcome-banner.txt && cmp -s '+BASE+'terminal-greeting/welcome-banner.txt <(figlet Welcome)'})
    root = BASE+'file-basics/'
    lesson(3, 'file-basics', {
        1: file(root+'starting-location.txt', root.rstrip('/')+'\n'),
        2: file(root+'relative-location.txt',root+'path-map/south\n'),
        3: "grep -Fxq .practice-note "+root+"all-names.txt && grep -Fxq path-map "+root+"all-names.txt",
        4: file(root+'workspace/docs/guide.txt','Linux file practice\nPaths make locations predictable\n')+' && test -f '+root+'workspace/logs/app.log',
        5: file(root+'workspace/logs/matched-logs.txt','app.log\napp1.log\napp2.log\napp3.log\nworker1.log\nworker2.log\n'),
        6: 'cmp -s '+root+'workspace/docs/guide.txt '+root+'workspace/archived-guide.txt && test ! -e '+root+'workspace/docs/guide-backup.txt && test ! -e '+root+'workspace/logs/notes.txt',
        # Terminal key presses themselves cannot be inferred from this marker.
    }, files={'.practice-note':'Hidden practice fixture\n','path-map/north/reference.txt':'north reference\n','path-map/south/reference.txt':'south reference\n'})
    root=BASE+'command-help/'
    lesson(4,'command-help',{
        1:'grep -Fq "cd is a shell builtin" '+root+'command-types.txt && grep -Fq "ls is" '+root+'command-types.txt && grep -Fq "cp is" '+root+'command-types.txt',
        2:'grep -Fxq "=== ls ===" '+root+'quick-help.txt && grep -Fxq "=== cp ===" '+root+'quick-help.txt && grep -Fq "Usage:" '+root+'quick-help.txt',
    })
    root=BASE+'file-organization/'
    lesson(5,'file-organization',{1:file(root+'archive/final-notes.txt','Reviewed draft notes.\n')+' && test ! -e '+root+'incoming/draft-notes.txt'},
           files={'incoming/draft-notes.txt':'Reviewed draft notes.\n'},directories=['archive'])
    root=BASE
    lesson(6,'permissions-lab',{
        1:'test "$(id -gn jack)" = jack && test "$(getent passwd jack | cut -d: -f7)" = /bin/bash && test "$(stat -c %U:%G /home/jack)" = jack:jack',
        2:'id -nG jack | tr " " "\\n" | grep -Fxq developers && id -nG jack | tr " " "\\n" | grep -Fxq sudo && id -nG labex | tr " " "\\n" | grep -Fxq developers',
        3:'test "$(stat -c %U:%G:%a /home/labex/project/secure-report.txt)" = jack:developers:640',
        5:'test "$(stat -c %a /home/labex/project/umask-demo/private-note.txt)" = 640 && test "$(stat -c %a /home/labex/project/umask-demo/private-dir)" = 750',
        6:'test "$(stat -c %a /tmp/shared-dropbox)" = 1777 && test "$(stat -c %U /tmp/shared-dropbox/jack-note.txt)" = jack && test "$(stat -c %U /tmp/shared-dropbox/contractor-note.txt)" = contractor',
        7:'test "$(stat -c %U:%G:%a /home/labex/project/team-share)" = jack:developers:2770',
    },capabilities=['terminal','files','users','sudo','permissions'])
    result[6]['setup']['accounts']=[{'name':'contractor'}]
    # GNU rm asks about this other user's write-protected file before attempting
    # unlink. Confirm the attempt, then assert sticky-bit protection denies it.
    result[6]['actions']={6:[
        'mkdir /tmp/shared-dropbox', 'chmod 1777 /tmp/shared-dropbox',
        'sudo -u jack touch /tmp/shared-dropbox/jack-note.txt',
        'sudo -u contractor touch /tmp/shared-dropbox/contractor-note.txt',
        {'command':'sudo -u jack rm /tmp/shared-dropbox/contractor-note.txt',
         'input':[{'wait_for':'remove write-protected','text':'y'}], 'allowed_status':[1]},
    ]}
    lesson(7,'onboarding',{1:'test "$(id -gn trainee)" = trainee && test "$(getent passwd trainee | cut -d: -f7)" = /bin/bash && test "$(stat -c %U:%G /home/trainee)" = trainee:trainee && id -nG trainee | tr " " "\\n" | grep -Fxq developers'},capabilities=['terminal','users','sudo'])
    result[7]['setup']['groups']=[{'name':'developers'}]
    root=BASE+'file-ops-lab/'
    lesson(8,'file-ops-lab',{
        1: None, # command-history observation is supplied explicitly below.
        2:'test -d '+root+'navigation/alpha/beta',
        3:file(root+'documents/notes.txt','Linux file practice\nPaths identify each filesystem object\n')+' && test -f '+root+'documents/empty.txt',
        4:'cmp -s '+root+'documents/notes.txt '+root+'archive/notes-backup.txt && '+file(root+'archive/final-draft.txt','draft\n')+' && test ! -e '+root+'documents/draft.txt && test ! -e '+root+'disposable.tmp && cmp -s '+root+'documents/notes.txt '+root+'archive/documents-copy/notes.txt',
        5:file(root+'documents/journal.txt','First entry: created a workspace\nSecond entry: practiced paths\nThird entry: copied files\nFourth entry: reviewed the results\n'),
        6:file(root+'metadata-sample.txt','inode practice\n'),
        7:'test ! -e '+root+'links/source.txt && test -L '+root+'links/symbolic-link.txt && test "$(readlink '+root+'links/symbolic-link.txt)" = source.txt && '+file(root+'links/hard-link.txt','shared inode data\n'),
        8:'diff -r '+root+'comparison/version-a '+root+'comparison/version-b >/dev/null && '+file(root+'comparison/version-a/app.conf','mode=production\nport=8080\n')+' && '+file(root+'comparison/version-a/README.txt','release notes\n'),
    })
    root=BASE+'file-search/'
    conf='mode=training\nport=8080\n'
    lesson(9,'file-search',{1:file(root+'application/config/app.conf',conf)+' && test "$(stat -c %a '+root+'application/config/app.conf)" = 600 && '+file(root+'application/config/app.conf.backup',conf)},
           files={'application/config/app.conf':conf,'application/config/app.conf.backup':conf})
    root=BASE+'environment-lab/'
    lesson(10,'environment-lab',{
        1:file(root+'shell-variable.txt','course=Linux for Noobs\n'),
        2:file(root+'child-environment.txt','local=<missing>\nshared=visible in child processes\n'),
        3:file(root+'standard-environment.txt','HOME=/home/labex\nUSER=labex\n'),
        4:file(root+'path-command.txt','Linux learning environment is ready\n')+' && test -x /home/labex/bin/course-status && cmp -s '+root+'path-command.txt <(/home/labex/bin/course-status)',
    })
    root=BASE+'archive-lab/'
    lesson(12,'archive-lab',{
        1:file(root+'source/config/app.conf','mode=training\nport=8080\n')+' && '+file(root+'source/notes/README.txt','Archive the complete project tree.\n')+' && '+file(root+'source/data/sample.csv','alpha,beta,gamma\n1,2,3\n'),
        2:'tar -tf '+root+'project.tar >/dev/null && cmp -s '+root+'tar-members.txt <(tar -tf '+root+'project.tar) && cmp -s <(tar -xOf '+root+'project.tar source/config/app.conf) '+root+'source/config/app.conf',
        3:'test -f '+root+'tar-restore-ok.txt && diff -r '+root+'source '+root+'tar-restore/source >/dev/null',
        4:'test ! -e '+root+'sample-copy.csv.gz && cmp -s '+root+'sample-copy.csv '+root+'source/data/sample.csv && '+file(root+'gzip-round-trip-ok.txt','gzip round trip matches\n'),
        5:'gzip -t '+root+'project.tar.gz && diff -r '+root+'source '+root+'targz-restore/source >/dev/null && '+file(root+'targz-restore-ok.txt','tar.gz restore matches source\n'),
        6:'unzip -t '+root+'project.zip >/dev/null && diff -r '+root+'source '+root+'zip-restore/source >/dev/null && '+file(root+'zip-restore-ok.txt','zip restore matches source\n'),
    },capabilities=['terminal','files','archives'])
    root=BASE+'log-backup/'
    logs={'api.log':'INFO api ready\n','worker.log':'INFO worker ready\n','scheduler.log':'INFO scheduler ready\n'}
    lesson(13,'log-backup',{1:'gzip -t '+root+'logs-backup.tar.gz && '+ ' && '.join('cmp -s <(tar -xOzf '+root+'logs-backup.tar.gz logs/'+name+') <(printf %s '+shlex.quote(text)+') && '+file(root+'source/logs/'+name,text) for name,text in logs.items())},files={'source/logs/'+name:text for name,text in logs.items()},capabilities=['terminal','files','archives'])
    root=BASE+'storage-lab/'
    plan=lesson(14,'storage-lab',{
        2:'test "$(stat -c %s '+root+'usage/reports/weekly.log)" = 2097152 && test "$(stat -c %s '+root+'usage/archive/records.bin)" = 5242880',
    })
    plan['history']={2:{'kind':'commands','user':'labex','allowed_status':[0],
                       'groups':[[r'^\s*df\s+-h\s+/home/labex/project/storage-lab\s*$'],
                                 [r'^\s*du\s+-h\s+--apparent-size\s+--max-depth=1\s+usage\s*$']]}}
    root=BASE+'disk-audit/'
    lesson(15,'disk-audit',{1:'cmp -s '+root+'reports/directory-usage.txt <(cd '+root+'; du -sh workspace/* | sort -h) && test "$(stat -c %s '+root+'workspace/cache/cache.bin)" = 1024 && test "$(stat -c %s '+root+'workspace/logs/application.log)" = 8192 && test "$(stat -c %s '+root+'workspace/releases/release.bin)" = 32768'},
           files={'workspace/cache/cache.bin':'C'*1024,'workspace/logs/application.log':'L'*8192,'workspace/releases/release.bin':'R'*32768},directories=['reports'])
    root=BASE+'pipeline-lab/'
    events='api,INFO,started\nworker,ERROR,failed\napi,WARN,slow\nweb,ERROR,timeout\nworker,INFO,done\napi,ERROR,retry\n'
    lesson(16,'pipeline-lab',{
        1:file(root+'status-result.txt','events.csv is ready\n'),
        2:'cmp -s '+root+'events.csv '+root+'working.csv && '+file(root+'sequence-result.txt','guarded copy matches\n'),
        3:'cmp -s '+root+'error-events.csv <(grep ",ERROR," '+root+'events.csv) && '+file(root+'error-count.txt','3\n'),
        4:'cmp -s '+root+'warning-services.txt <(grep ",WARN," '+root+'events.csv | cut -d, -f1)',
        5:'cmp -s '+root+'service-frequency.txt <(cut -d, -f1 '+root+'events.csv | sort | uniq -c | sort -k1,1nr)',
    },files={'events.csv':events})
    root=BASE+'sensor-pipeline/'
    sensor='01,alpha,INFO,ready\n02,beta,ALERT,heat\n03,gamma,INFO,ready\n04,alpha,ALERT,power\n05,beta,OK,done\n06,gamma,ALERT,fan\n'
    lesson(17,'sensor-pipeline',{1:file(root+'sensor-events.csv',sensor)+' && cmp -s '+root+'alert-events.csv <(grep ",ALERT," '+root+'sensor-events.csv)'},files={'sensor-events.csv':sensor})
    root=BASE+'text-combine-lab/'
    lesson(18,'text-combine-lab',{
        1:file(root+'clean-services.txt','api,worker,web\n'),
        2:file(root+'service-owners.csv','api,team-blue\nworker,team-green\nweb,team-blue\n'),
        3:file(root+'service-details.txt','api 9000 maintenance\nweb 8080 active\nworker 9100 active\n'),
        4:file(root+'service-report-with-header.csv','service,port,state\napi,9000,maintenance\nweb,8080,active\nworker,9100,active\n')+' && '+file(root+'service-count.txt','3\n'),
    })
    root=BASE+'path-audit/'
    path='/usr/bin:/home/labex/bin:/bin:/usr/local/bin:/usr/bin:/bin\n'
    lesson(19,'path-audit',{1:file(root+'configured-path.txt',path)+' && '+file(root+'path-directories.txt','/bin\n/home/labex/bin\n/usr/bin\n/usr/local/bin\n')},files={'configured-path.txt':path})
    root=BASE+'regex-lab/'
    contacts='Alice|alice@example.com|active|25\nBob|bob@example.net|pending|32\nCarol|carol@example.org|inactive|41\nDavid|david@example.com|active|103\n'
    services='service,state,latency\napi,warn,250\nworker,ok,150\nweb,warn,300\n'
    lesson(20,'regex-lab',{
        1:'cmp -s '+root+'abc-contacts.txt <(grep "^[ABC]" '+root+'contacts.txt) && cmp -s '+root+'two-digit-values.txt <(grep "[0-9][0-9]$" '+root+'contacts.txt)',
        2:'cmp -s '+root+'emails.txt <(grep -Eo \'[[:alnum:]._-]+@[[:alnum:].-]+\\.[[:alpha:]]{2,}\' '+root+'contacts.txt) && '+file(root+'email-count.txt','4\n'),
        3:'cmp -s '+root+'contacts-preview.txt <(sed \'/|inactive|/s/|inactive|/|disabled|/\' '+root+'contacts.txt) && '+file(root+'contacts.txt',contacts),
        4:file(root+'services-clean.csv','service,state,latency\napi,warning,250ms\nworker,ok,150ms\nweb,warning,300ms\n'),
        5:file(root+'slow-services.txt','api 250\nweb 300\n')+' && '+file(root+'latency-summary.txt','average_latency=233.3\n'),
    },files={'contacts.txt':contacts,'services.csv':services})
    root=BASE+'extraction-challenge/'
    note='Email alice@example.com then bob@example.net. Duplicate alice@example.com. Owner carol@example.org. Bad user@ and @invalid.\n'
    lesson(21,'extraction-challenge',{1:file(root+'emails.txt','alice@example.com\nbob@example.net\ncarol@example.org\n')+' && '+file(root+'handover.txt',note)},files={'handover.txt':note})
    root=BASE+'streams-lab/'
    lesson(22,'streams-lab',{
        1:file(root+'input.txt','alpha\nbeta\ngamma\n'),
        2:file(root+'report.txt','Input lines: 3\nStatus: complete\n'),
        3:'grep -Fq input.txt '+root+'listing.log && ! grep -Fq missing.txt '+root+'listing.log && grep -Fq missing.txt '+root+'errors.log',
        4:'grep -Fq input.txt '+root+'combined.log && grep -Fq missing.txt '+root+'combined.log && grep -Fq report.txt '+root+'shorthand.log && grep -Fq absent.txt '+root+'shorthand.log',
        5:file(root+'sorted.txt','gamma\nbeta\nalpha\ndelta\n'),
        6:'test -f '+root+'scratch.log && test ! -s '+root+'scratch.log && test -s '+root+'visible-listing.log && ! grep -Fq missing-directory '+root+'visible-listing.log',
    })
    root=BASE+'history-analysis/'
    history='1|ls|/home/labex\n2|pwd|/home/labex\n3|cat|notes.txt\n4|ls|-la\n5|grep|ERROR app.log\n'
    lesson(23,'history-analysis',{1:file(root+'programs.txt','ls\npwd\ncat\nls\ngrep\n')+' && '+file(root+'command-history.txt',history)},files={'command-history.txt':history})
    return result
