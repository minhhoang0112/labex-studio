"""Independent Docker checks and smoke actions for the supplied Junior lessons.

The namespace checks stay unchanged. These variants require concrete capabilities;
they do not infer Internet/ICMP, firewall or persistent processes from a terminal.
"""
import copy


def commands(*groups):
    return {"kind": "commands", "user": "labex", "allowed_status": [0],
            "groups": [[item] if isinstance(item, str) else item for item in groups]}


def state(command):
    return {"kind": "state", "command": command}


def combined(command, *patterns):
    return {"kind": "all", "checks": [state(command), commands(*patterns)]}


def variants(plans):
    """Return {(zero-based day, task): provider rule}, Docker setup overrides."""
    rules = {}
    setups = {}

    def add(day, task, verification, actions, capabilities, **scenario):
        rules[(day - 1, task - 1)] = {
            "verification": verification, "commands": actions,
            "required_capabilities": ["terminal", *capabilities], **scenario}

    setup = copy.deepcopy(plans[5]["setup"])
    for name, content in {
        "critical_service.sh": "#!/bin/bash\ntrap 'exit 0' TERM INT\nwhile :; do sleep 2; done\n",
        "resource_hog.sh": "#!/bin/bash\ntrap 'exit 0' TERM INT\nwhile :; do :; done\n",
        "data_processor.sh": "#!/bin/bash\nprintf 'Starting data processing at %s\\n' \"$(date)\"\ntrap 'exit 0' TERM INT\nwhile :; do sleep 2; done\n",
    }.items():
        setup["files"].append({"path": "/home/labex/project/" + name,
                               "content": content, "mode": "0755", "owner": "labex:labex"})
    setup["docker"] = {"startup": [
        {"script": "/home/labex/project/critical_service.sh", "user": "labex"},
        {"script": "/home/labex/project/resource_hog.sh", "user": "labex"}]}
    setups[5] = setup
    add(6, 2, combined("pgrep -f '^/bin/bash /home/labex/project/[r]esource_hog[.]sh$' >/dev/null",
                       r"^\s*top\s*$"),
        [{"command": "top", "input": [{"wait_for": "PID", "text": "q", "raw": True}]}],
        ["persistent_processes"])
    add(6, 3, combined("pgrep -f '^/bin/bash /home/labex/project/[c]ritical_service[.]sh$' >/dev/null",
                       r"^\s*pgrep\s+-f\s+['\"]?critical_service\.sh['\"]?\s*$"),
        ["pgrep -f critical_service.sh"], ["persistent_processes"])
    add(6, 4, combined("! pgrep -f '^/bin/bash /home/labex/project/[r]esource_hog[.]sh$' >/dev/null && pgrep -f '^/bin/bash /home/labex/project/[c]ritical_service[.]sh$' >/dev/null",
                       r"^\s*pkill\s+-f\s+['\"]?resource_hog\.sh['\"]?\s*$"),
        ["pkill -f resource_hog.sh"], ["persistent_processes"])
    add(6, 5, combined("pgrep -f '^(/bin/)?bash (/home/labex/project/|\\./)?[d]ata_processor[.]sh$' >/dev/null && test -s /home/labex/project/processor.log && grep -Fq 'Starting data processing at ' /home/labex/project/processor.log",
                       r"^\s*nohup\s+(?:bash\s+)?(?:\./|/home/labex/project/)data_processor\.sh\s*>\s*processor\.log\s+2>&1\s*&\s*$"),
        ["cd ~/project", "nohup ./data_processor.sh > processor.log 2>&1 &"],
        ["persistent_processes"], wait_for_pass_ms=10000)

    setup = copy.deepcopy(plans[6]["setup"])
    setup["files"].append({"path": "/home/labex/project/index.html", "content": "<h1>Local training portal</h1>\n"})
    setup["docker"] = {"http_services": [{"port": 8000, "directory": "/home/labex/project", "user": "labex"}]}
    setups[6] = setup
    add(7, 2, commands(r"^\s*ifconfig(?:\s+-a)?\s*$"), ["ifconfig"], ["ifconfig"])
    add(7, 3, commands(r"^\s*ping\s+-c\s*3\s+8\.8\.8\.8\s*$"),
        ["ping -c 3 8.8.8.8"], ["external_icmp"])
    add(7, 4, combined("ss -tln | grep -Eq 'LISTEN[[:space:]].*[:.]8000[[:space:]]'",
                       r"^\s*ss\s+-(?=[a-zA-Z]*t)(?=[a-zA-Z]*l)[a-zA-Z]+(?:\s*\|\s*grep\s+['\"]?8000['\"]?)?\s*$",
                       ), ["ss -tlnp | grep 8000"], ["network_ports"])
    add(7, 5, combined("sudo -n ufw status | grep -q '^Status: active' && sudo -n ufw status | grep -Eq '^8000([[:space:]]|/tcp).*ALLOW' && sudo -n ufw status | grep -Eq '^22([[:space:]]|/tcp).*ALLOW'",
                       r"^\s*sudo\s+ufw\s+allow\s+8000(?:/tcp)?\s*$",
                       r"^\s*sudo\s+ufw\s+allow\s+(?:22(?:/tcp)?|ssh)\s*$",
                       r"^\s*sudo\s+ufw\s+(?:--force\s+)?enable\s*$"),
        ["sudo ufw allow 8000", "sudo ufw allow 22", "sudo ufw --force enable"], ["firewall"])

    apt = r"^\s*sudo\s+apt\s+"
    add(8, 1, combined("test -n \"$(find /var/lib/apt/lists -maxdepth 1 -type f -name '*Packages*' -print -quit)\"",
                       apt + r"update\s*$"), [{"command": "sudo apt update", "timeout_ms": 180000}], ["package_management"])
    installed = "dpkg-query -W -f='${Status}' neofetch 2>/dev/null | grep -Fxq 'install ok installed'"
    add(8, 2, combined(installed, apt + r"(?:-y\s+)?install\s+(?:-y\s+)?neofetch(?:\s+-y)?\s*$"),
        [{"command": "sudo apt install -y neofetch", "timeout_ms": 180000}], ["package_management"])
    add(8, 3, combined(installed,
                       [r"^\s*apt\s+show\s+neofetch\s*$", r"^\s*dpkg\s+-s\s+neofetch\s*$"]),
        ["dpkg -s neofetch"], ["package_management"])
    add(8, 4, combined("! dpkg-query -W -f='${Status}' figlet 2>/dev/null | grep -Fxq 'install ok installed'",
                       apt + r"(?:-y\s+)?remove\s+(?:-y\s+)?figlet(?:\s+-y)?\s*$"),
        [{"command": "sudo apt remove -y figlet", "timeout_ms": 120000}], ["package_management"])
    add(8, 5, combined("! dpkg-query -W -f='${Status}' libtext-charwidth-perl 2>/dev/null | grep -Fxq 'install ok installed'",
                       apt + r"(?:-y\s+)?autoremove(?:\s+-y)?\s*$"),
        [{"command": "sudo apt autoremove -y", "timeout_ms": 120000}], ["package_management"])

    cron_line = r"* * * * * tar -czf /home/labex/project/backups/backup-$(date +\%Y-\%m-\%d_\%H-\%M-\%S).tar.gz -C /home/labex/project data config logs"
    # Native crontab compares edit mtimes at second precision. Ensure the real
    # editor's file write is observable instead of reporting 'no changes made'.
    editor = "#!/bin/bash\nsleep 1\ncat > \"$1\" <<'LOCAL_CRON'\n" + cron_line + "\nLOCAL_CRON\n"
    actions = ["cat > cron-editor.sh <<'LOCAL_EDITOR'\n" + editor + "LOCAL_EDITOR",
               "chmod +x cron-editor.sh", "EDITOR=/home/labex/project/cron-editor.sh crontab -e"]
    cron_state = r"""entry=$(crontab -l) && printf '%s\n' "$entry" | grep -Eq '^\* \* \* \* \* .*tar .* /home/labex/project/backups/[^ ]*\$\(date ' && printf '%s\n' "$entry" | grep -Fq -- '-C /home/labex/project' && printf '%s\n' "$entry" | grep -Eq '(data config logs|-T /home/labex/project/backup-list\.txt)' && latest=$(find /home/labex/project/backups -maxdepth 1 -type f -name 'backup-*.tar.gz' -printf '%T@ %p\n' | sort -nr | head -n1 | cut -d' ' -f2-) && test -n "$latest" && gzip -t "$latest" && tar -tzf "$latest" | grep -Fxq data/transactions.csv && tar -tzf "$latest" | grep -Fxq config/app.conf && tar -tzf "$latest" | grep -Fxq logs/app.log"""
    add(9, 5, combined(cron_state,
                       r"^\s*(?:EDITOR=\S+\s+)?crontab\s+-e\s*$"),
        actions, ["cron_scheduler"], wait_for_pass_ms=130000)
    assert len(rules) == 14
    return rules, setups
