"""Reconstructed fixtures and behavioral checks for Noobs automation lessons.

Teaching bodies are supplied by the workspace, not downloaded by this module.
Scripts are exercised as the learner inside its private container, including
invalid arguments and alternate inputs. No host processes or files are used.
"""
import textwrap

BASE = '/home/labex/project/'


def py_check(body):
    return "python3 - <<'LOCAL_CHECK'\n" + textwrap.dedent(body).strip() + "\nLOCAL_CHECK"


def script_check(workspace, body):
    return py_check("import os, pathlib, subprocess, tempfile\n"
                    + f"root = pathlib.Path({BASE + workspace!r})\n"
                    + "def run(name, *args, input=None):\n"
                    + "    return subprocess.run(['/bin/bash', str(root/name), *args], cwd=root, input=input, text=True, capture_output=True, timeout=2)\n"
                    + textwrap.dedent(body))


def plans():
    result = {}

    def lesson(order, workspace, states, files=None, directories=None, actions=None, history=None, capabilities=None):
        root = BASE + workspace
        setup = {'version': 1, 'directories': [{'path': root}], 'files': [], 'accounts': [], 'groups': [],
                 'provenance': {'fixture_fidelity': 'reconstructed-from-local-instructions', 'original_bytes_recovered': False}}
        setup['directories'] += [{'path': root + '/' + p} for p in directories or []]
        setup['files'] += [{'path': root + '/' + p, 'content': content} for p, content in (files or {}).items()]
        result[order] = {'setup': setup, 'root': root, 'states': states, 'actions': actions or {},
                         'history': history or {}, 'capabilities': capabilities or ['terminal', 'files', 'shell']}
        return result[order]

    logs = {'logs/api.log': 'INFO started\nERROR database unavailable\nINFO retry complete\n',
            'logs/healthy.log': 'INFO started\nINFO healthy\n',
            'logs/worker.log': 'ERROR queue timeout\nINFO retry\nERROR retry failed\n'}
    expected_counts = 'api.log errors=1\nhealthy.log errors=0\nworker.log errors=2\n'
    expected_summary = 'api.log lines=3 errors=1\nhealthy.log lines=2 errors=0\nworker.log lines=3 errors=2\n'
    shell_states = {
        1: script_check('shell-lab', '''
            path = root/'hello.sh'
            assert path.read_text().splitlines()[0] == '#!/bin/bash'
            assert os.access(path, os.X_OK)
            wanted = f'Hello from a Bash script\\n{root}\\n'
            p = run('hello.sh')
            assert p.returncode == 0 and p.stdout == wanted
            p = subprocess.run([str(path)], cwd=root, text=True, capture_output=True, timeout=2)
            assert p.returncode == 0 and p.stdout == wanted
        '''),
        2: script_check('shell-lab', '''
            prefix = f'Course: Linux for Noobs\\nWorkspace: {root}\\n'
            expected = prefix + 'Quoted argument count: 1\\nFirst argument: beginner learner\\n'
            assert (root/'variable-output.txt').read_text() == expected
            p = run('variables.sh', 'another learner')
            assert p.returncode == 0 and p.stdout == prefix + 'Quoted argument count: 1\\nFirst argument: another learner\\n'
        '''),
        3: script_check('shell-lab', '''
            p = run('greet-argument.sh')
            assert p.returncode == 2 and 'Usage:' in p.stderr
            p = run('greet-argument.sh', 'Ada Lovelace')
            assert p.returncode == 0 and p.stdout == 'Hello, Ada Lovelace\\n'
            assert (root/'argument-greeting.txt').read_text() == p.stdout
            assert run('greet-argument.sh', 'one', 'two').returncode == 2
        '''),
        4: script_check('shell-lab', '''
            p = run('ask-name.sh', input='Grace Hopper\\n')
            assert p.returncode == 0 and p.stdout == 'Welcome, Grace Hopper\\n'
            assert (root/'interactive-greeting.txt').read_text() == p.stdout
            p = run('ask-name.sh', input='\\n')
            assert p.returncode == 1 and 'A name is required' in p.stderr
        '''),
        5: script_check('shell-lab', '''
            assert run('classify-path.sh', 'logs').stdout == 'directory: logs\\n'
            assert run('classify-path.sh', 'notes.txt').stdout == 'file: notes.txt\\n'
            assert run('classify-path.sh', 'missing.txt').returncode == 1
            assert run('classify-path.sh').returncode == 2
            assert (root/'path-results.txt').read_text() == 'directory: logs\\nfile: notes.txt\\n'
        '''),
        6: script_check('shell-lab', f'''
            p = run('count-errors.sh', 'logs')
            assert p.returncode == 0 and p.stdout == {expected_counts!r}
            assert (root/'error-counts.txt').read_text() == p.stdout
            assert run('count-errors.sh', 'missing').returncode == 1
        '''),
        7: script_check('shell-lab', f'''
            assert os.access(root/'summarize-logs.sh', os.X_OK)
            assert (root/'log-summary.txt').read_text() == {expected_summary!r}
            with tempfile.TemporaryDirectory(prefix='noobs-script-check-') as directory:
                output = str(pathlib.Path(directory)/'summary.txt')
                p = run('summarize-logs.sh', 'logs', output)
                assert p.returncode == 0 and pathlib.Path(output).read_text() == {expected_summary!r}
                assert run('summarize-logs.sh', 'missing', output).returncode == 1
                assert run('summarize-logs.sh').returncode == 2
        '''),
    }
    # Retain the student's actual interactive read; smoke answers the prompt.
    # Other guided commands are extracted from the preserved local body.
    ask_name_script = '''#!/bin/bash
read -r -p "Enter your name: " name
if [ -z "$name" ]; then
  echo "A name is required" >&2
  exit 1
fi
echo "Welcome, $name"
'''
    lesson(34, 'shell-lab', shell_states, files={**logs, 'notes.txt': 'Shell practice notes\n'},
           actions={4: ["cat > ask-name.sh <<'LOCAL_SCRIPT'\n"+ask_name_script+'LOCAL_SCRIPT',
                        {'command': 'bash ask-name.sh', 'input': [{'wait_for': 'Enter your name:', 'text': 'Grace Hopper'}]},
                        "printf 'Grace Hopper\\n' | bash ask-name.sh > interactive-greeting.txt", 'cat interactive-greeting.txt']})

    process_script = '''#!/bin/bash
log_dir=${1:-logs}
if [ ! -d "$log_dir" ]; then exit 1; fi
for log_file in "$log_dir"/*.log; do
  errors=$(grep -c '^ERROR' "$log_file" || true)
  printf '%s errors=%s\\n' "$(basename "$log_file")" "$errors"
done
'''
    lesson(35, 'log-automation', {1: script_check('log-automation', f'''
        path = root/'process-logs.sh'
        assert path.read_text().splitlines()[0] == '#!/bin/bash' and os.access(path, os.X_OK)
        p = run('process-logs.sh', 'logs')
        assert p.returncode == 0 and p.stdout == {expected_counts!r}
        with tempfile.TemporaryDirectory(prefix='noobs-input-') as directory:
            sample = pathlib.Path(directory)/'other.log'
            sample.write_text('ERROR first\\nINFO okay\\nERROR second\\nERROR third\\n')
            p = run('process-logs.sh', directory)
            assert p.returncode == 0 and p.stdout == 'other.log errors=3\\n'
    ''')}, files=logs, actions={1: ['cd '+BASE+'log-automation', "cat > process-logs.sh <<'LOCAL_SCRIPT'\n"+process_script+'LOCAL_SCRIPT',
                                  'chmod u+x process-logs.sh', './process-logs.sh logs']})

    config = 'mode=production\nport=8080\n'
    runbook = 'Production runbook: inspect logs before restarting a service.\n'
    manifest = 'config/app.conf\ndocuments/runbook.txt\n'
    root = BASE+'backup-lab'
    archive_prefix = f'''
        import pathlib, tarfile
        root = pathlib.Path({root!r})
        expected = {{'config/app.conf': {config.encode()!r}, 'documents/runbook.txt': {runbook.encode()!r}}}
        def inspect(archive):
            with tarfile.open(archive, 'r:gz') as source:
                assert set(source.getnames()) == set(expected)
                for name, content in expected.items():
                    assert source.extractfile(name).read() == content
    '''
    archive_prefix = textwrap.dedent(archive_prefix)
    cron_date_example = r'0 2 * * * /bin/echo "backup-$(/bin/date +\%Y\%m\%d-\%H\%M\%S)" >> /home/labex/project/backup-lab/logs/date-example.log 2>&1' + '\n'
    backup_states = {
        1: py_check(f"from pathlib import Path\np=Path({root!r})\nassert (p/'backup-manifest.txt').read_text() == {manifest!r}\nassert all((p/'data'/name).is_file() for name in {list(('config/app.conf','documents/runbook.txt'))!r})"),
        2: py_check(archive_prefix+"inspect(root/'backups/manual-backup.tar.gz')"),
        3: py_check(archive_prefix+f"inspect(root/'backups/manual-backup.tar.gz')\nassert (root/'archive-contents.txt').read_text() == {manifest!r}"),
        4: py_check(f'''from pathlib import Path
root=Path({root!r})
assert (root/'restore/config/app.conf').read_text() == {config!r}
assert (root/'data/config/app.conf').read_text() == {config!r}
assert sorted(str(p.relative_to(root/'restore')) for p in (root/'restore').rglob('*') if p.is_file()) == ['config/app.conf']
assert (root/'data/documents/runbook.txt').read_text() == {runbook!r}
assert (root/'data/documents/scratch.txt').read_text() == 'Unmanaged scratch notes\\n'
'''),
        5: py_check(archive_prefix+r'''
import os, re
assert os.access(root/'backup.sh', os.X_OK)
archives=[p for p in (root/'backups').glob('backup-*.tar.gz') if re.fullmatch(r'backup-\d{8}-\d{6}\.tar\.gz',p.name)]
assert archives
for path in archives:
    inspect(path)
    assert pathlib.Path(str(path)+'.contents').read_text() == (root/'backup-manifest.txt').read_text()
assert 'Created ' in (root/'last-backup.txt').read_text()
'''),
        6: py_check(f'''import pathlib, subprocess
root=pathlib.Path({root!r})
p=subprocess.run(['crontab','-l'],text=True,capture_output=True,timeout=2)
assert p.returncode==0
lines=[line for line in p.stdout.splitlines() if line.strip()]
assert lines == ['## LabEx managed backup schedule', '*/5 * * * * {root}/backup.sh >> {root}/logs/backup.log 2>&1']
assert (root/'installed-crontab.txt').read_text()==p.stdout
'''),
        7: py_check(archive_prefix+f'''
assert 'Created {root}/backups/backup-' in (root/'logs/backup.log').read_text()
expected_example = {cron_date_example!r}
assert (root/'cron-date-example.txt').read_text()==expected_example
for archive in (root/'backups').glob('backup-*.tar.gz'): inspect(archive)
'''),
    }
    # Source step6 specifically requires crontab -e. Smoke uses a deterministic
    # real editor process rather than pretending a crontab file alone is enough.
    cron_editor = '''#!/bin/bash
sleep 1
sed -i '1i## LabEx managed backup schedule' "$1"
'''
    lesson(36, 'backup-lab', backup_states,
           files={'data/config/app.conf': config, 'data/documents/runbook.txt': runbook,
                  'data/documents/scratch.txt': 'Unmanaged scratch notes\n'},
           directories=['backups', 'restore', 'logs'],
           actions={6: ["cat > backup.crontab <<'LOCAL_CRON'\n*/5 * * * * "+root+'/backup.sh >> '+root+'/logs/backup.log 2>&1\nLOCAL_CRON',
                        'crontab backup.crontab', "cat > cron-editor.sh <<'LOCAL_EDITOR'\n"+cron_editor+'LOCAL_EDITOR',
                        'chmod u+x cron-editor.sh', 'EDITOR='+root+'/cron-editor.sh crontab -e',
                        'crontab -l | tee installed-crontab.txt']},
           history={6: {'kind': 'commands', 'user': 'labex', 'allowed_status': [0],
                        'groups': [[r'^(?:EDITOR=\S+\s+)?crontab\s+-e\s*$']]}},
           capabilities=['terminal', 'files', 'shell', 'archives', 'cron_scheduler'])

    # The source challenge supplies an archive with an unrelated old runbook.
    # Prepare it as bytes, then preserve a distinct current runbook in data.
    root37 = BASE+'backup-automation'
    setup = lesson(37, 'backup-automation', {1: py_check(f'''from pathlib import Path
root=Path({root37!r})
assert (root/'data/config/app.conf').read_text() == {config!r}
assert (root/'data/documents/runbook.txt').read_text() == 'Current runbook: keep this file unchanged.\\n'
''')}, files={'archive-source/config/app.conf': config,
             'archive-source/documents/runbook.txt': 'Old runbook stored in archive.\n',
             'data/documents/runbook.txt': 'Current runbook: keep this file unchanged.\n',
             'prepare-archive.sh': '#!/bin/bash\nset -eu\ncd '+root37+'\ntar -czf backups/manual-backup.tar.gz -C archive-source config/app.conf documents/runbook.txt\n'},
        directories=['backups', 'data/config'], actions={1: ['cd '+root37, 'tar -xzf backups/manual-backup.tar.gz -C data config/app.conf']},
        capabilities=['terminal', 'files', 'archives'])['setup']
    setup['docker'] = {'startup': [{'script': root37+'/prepare-archive.sh', 'user': 'labex'}]}
    return result
