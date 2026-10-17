"""Persistent Linux namespace practice environments; never changes host accounts.

Only /usr is reused from the host, read-only. Account databases and writable
directories belong to one lab. This is a local teaching sandbox, not a service
for running hostile internet workloads. The installed host userspace is reported
as-is; no claim is made that it is the original LabEx image.
"""
import argparse
import base64
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import pwd
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import uuid

ID = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}\Z")
ACCOUNT = re.compile(r"[a-z_][a-z0-9_.-]{0,31}\Z")
RUNNER_VERSION = 1
SETUPS = Path(__file__).resolve().parents[1] / "data" / "environment-setups"

BASHRC = r'''# Local Bash compatibility setup, not a copy of the LabEx image.
export SHELL=/bin/bash
export HISTFILE=/home/labex/.bash_history
export HISTCONTROL=
export HISTSIZE=2000
export HISTFILESIZE=4000
shopt -s histappend
_labex_last_entry=
_labex_prompt() {
  local result=$? entry command encoded
  entry=$(HISTTIMEFORMAT= history 1)
  if [[ -n "$entry" && "$entry" != "$_labex_last_entry" ]]; then
    command=$(printf '%s' "$entry" | sed -E 's/^[[:space:]]*[0-9]+[[:space:]]+//')
    encoded=$(printf '%s' "$command" | base64 -w0)
    printf '%s\t%s\t%s\n' "$result" "$(id -un)" "$encoded" >> /var/log/labex/commands.tsv
    _labex_last_entry=$entry
  fi
  history -a
}
PROMPT_COMMAND=_labex_prompt
PS1='\u@labex:\w\$ '
'''


def write_file(path, content, mode=0o644):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf8")
    path.chmod(mode)


def os_description():
    values = {}
    for line in Path("/usr/lib/os-release").read_text().splitlines():
        if "=" in line:
            key, value = line.split("=", 1)
            values[key] = value.strip('"')
    return values.get("PRETTY_NAME", "Linux userspace")


def require_runtime():
    if sys.platform != "linux" or os.geteuid() != 0:
        raise RuntimeError("Isolated Linux runtime requires WSL root (or native Linux root); host-shell fallback is disabled")
    for tool in ("unshare", "mount", "setpriv", "bash", "useradd", "chown", "python3", "sudo"):
        if not shutil.which(tool):
            raise RuntimeError(f"Required Linux runtime tool is unavailable: {tool}")


def writable_path(root, sandbox_path, extra_writable_prefixes=()):
    if not isinstance(sandbox_path, str):
        raise ValueError("Setup path must be text")
    path = PurePosixPath(sandbox_path)
    if not path.is_absolute() or ".." in path.parts:
        raise ValueError("Setup paths must be absolute without parent traversal")
    allowed = ("/home/", "/tmp/", "/var/tmp/") + tuple(extra_writable_prefixes)
    if not any(sandbox_path.startswith(prefix) for prefix in allowed):
        raise ValueError("Setup files are limited to sandbox /home, /tmp and /var/tmp")
    target = root.joinpath(*path.parts[1:])
    current = root
    for part in path.parts[1:]:
        current = current / part
        if current.is_symlink():
            raise ValueError("Setup may not follow symlinks")
    return target


def read_records(path):
    return [line.split(":") for line in path.read_text().splitlines() if line]


def save_records(path, records):
    write_file(path, "".join(":".join(row) + "\n" for row in records), 0o600 if path.name in ("shadow", "gshadow") else 0o644)


def apply_manifest(root, manifest, extra_writable_prefixes=()):
    if not isinstance(manifest, dict) or manifest.get("version", 1) != 1:
        raise ValueError("Unsupported environment setup manifest")
    for key in ("directories", "files", "accounts", "groups", "symlinks"):
        if not isinstance(manifest.get(key, []), list):
            raise ValueError(f"Setup {key} must be an array")
    users = read_records(root / "etc/passwd")
    groups = read_records(root / "etc/group")
    shadow = read_records(root / "etc/shadow")
    gshadow = read_records(root / "etc/gshadow")
    for item in manifest.get("groups", []):
        name = item.get("name", "")
        if not ACCOUNT.fullmatch(name) or any(row[0] == name for row in groups):
            raise ValueError("Invalid or duplicate setup group")
        gid = item.get("gid", max(1000, *(int(row[2]) for row in groups)) + 1)
        if not isinstance(gid, int) or not 1001 <= gid <= 60000 or any(int(row[2]) == gid for row in groups):
            raise ValueError("Setup group GID must be unique and between 1001 and 60000")
        members = item.get("members", [])
        if not isinstance(members, list) or any(not isinstance(member, str) or not ACCOUNT.fullmatch(member) for member in members):
            raise ValueError("Setup group members must be valid account names")
        groups.append([name, "x", str(gid), ",".join(members)])
        gshadow.append([name, "!", "", ""])
    for item in manifest.get("accounts", []):
        name = item.get("name", "")
        if not ACCOUNT.fullmatch(name) or any(row[0] == name for row in users):
            raise ValueError("Invalid or duplicate setup account")
        uid = item.get("uid", max(1000, *(int(row[2]) for row in users)) + 1)
        if not isinstance(uid, int) or not 1001 <= uid <= 60000 or any(int(row[2]) == uid for row in users):
            raise ValueError("Setup UID must be unique and between 1001 and 60000")
        primary = item.get("group", name)
        if not isinstance(primary, str) or not ACCOUNT.fullmatch(primary):
            raise ValueError("Invalid primary setup group")
        group = next((row for row in groups if row[0] == primary), None)
        if group is None:
            gid = max(1000, *(int(row[2]) for row in groups)) + 1
            groups.append([primary, "x", str(gid), ""])
            gshadow.append([primary, "!", "", ""])
        else:
            gid = int(group[2])
        users.append([name, "x", str(uid), str(gid), "", f"/home/{name}", "/bin/bash"])
        status = item.get("password_status", "locked")
        if status not in ("locked", "unlocked"):
            raise ValueError("Setup password_status must be locked or unlocked")
        password_hash = "!"
        if status == "unlocked":
            # A random nonpersonal fixture secret gives a genuine P state;
            # neither the secret nor its hash is logged or exposed via the API.
            if not shutil.which("openssl"):
                raise RuntimeError("An unlocked account fixture requires installed openssl")
            password_hash = subprocess.run(["openssl", "passwd", "-6", "-stdin"], input=secrets.token_urlsafe(32), text=True, capture_output=True, check=True).stdout.strip()
            if not password_hash.startswith("$6$") or ":" in password_hash or "\n" in password_hash:
                raise RuntimeError("Could not generate an unlocked account fixture")
        shadow.append([name, password_hash, "20000", "0", "99999", "7", "", "", ""])
        if not isinstance(item.get("groups", []), list):
            raise ValueError("Supplementary setup groups must be an array")
        for group_name in item.get("groups", []):
            target_group = next((row for row in groups if row[0] == group_name), None)
            if target_group is None:
                raise ValueError("Unknown supplementary setup group")
            target_group[3] = ",".join(filter(None, [target_group[3], name]))
        home = root / "home" / name
        home.mkdir(mode=0o755)
        os.chown(home, uid, gid)
    known_users = {row[0] for row in users}
    for row in groups:
        if any(member not in known_users for member in row[3].split(",") if member):
            raise ValueError("Unknown setup group member")
        next(secret for secret in gshadow if secret[0] == row[0])[3] = row[3]
    for filename, rows in (("passwd", users), ("group", groups), ("shadow", shadow), ("gshadow", gshadow)):
        save_records(root / "etc" / filename, rows)
    uid_map = {row[0]: int(row[2]) for row in users}
    gid_map = {row[0]: int(row[2]) for row in groups}
    for kind in ("directories", "files"):
        for item in manifest.get(kind, []):
            target = writable_path(root, item.get("path"), extra_writable_prefixes)
            target.parent.mkdir(parents=True, exist_ok=True)
            if kind == "directories":
                target.mkdir(exist_ok=True)
            else:
                content = item.get("content", "")
                if not isinstance(content, str) or len(content) > 1024 * 1024:
                    raise ValueError("Setup file content must be text up to 1 MiB")
                target.write_text(content, encoding="utf8")
            mode = item.get("mode", "755" if kind == "directories" else "644")
            mode = int(mode, 8) if isinstance(mode, str) else mode
            if not isinstance(mode, int) or not 0 <= mode <= 0o777:
                raise ValueError("Setup file mode must be between 000 and 777")
            target.chmod(mode)
            owner = item.get("owner", "labex:labex").split(":")
            if len(owner) != 2 or owner[0] not in uid_map or owner[1] not in gid_map:
                raise ValueError("Unknown setup file owner")
            os.chown(target, uid_map[owner[0]], gid_map[owner[1]])

    # Explicit links are created last. No subsequent manifest write may follow
    # them, and both ends stay within the private writable fixture roots.
    for item in manifest.get("symlinks", []):
        link = writable_path(root, item.get("path"), extra_writable_prefixes)
        destination = item.get("target")
        checked_destination = writable_path(root, destination, extra_writable_prefixes)
        if checked_destination == link or not checked_destination.exists():
            raise ValueError("Setup symlink needs a distinct existing private target")
        link.parent.mkdir(parents=True, exist_ok=True)
        if link.exists() or link.is_symlink():
            raise ValueError("Setup symlink must not replace an existing path")
        owner = item.get("owner", "labex:labex").split(":")
        if len(owner) != 2 or owner[0] not in uid_map or owner[1] not in gid_map:
            raise ValueError("Unknown setup symlink owner")
        os.symlink(destination, link)
        os.lchown(link, uid_map[owner[0]], gid_map[owner[1]])


def initialize(root, lab_id, manifest_path=None):
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    if root.is_symlink():
        raise ValueError("Environment state directory may not be a symlink")
    with (root / ".initialize.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if (root / ".initialized.json").exists():
            return
        # Interrupted initialization is not repaired over arbitrary learner files.
        if (root / "etc/passwd").exists():
            raise RuntimeError("Environment initialization was interrupted; create a fresh lab environment")
        for name in ("etc", "home", "tmp", "var", "run"):
            (root / name).mkdir(exist_ok=True, mode=0o755)
        (root / "tmp").chmod(0o1777)
        (root / "var/tmp").mkdir(mode=0o1777)
        for name in ("var/log", "var/log/labex", "var/mail", "var/lib", "var/lib/sudo", "run/sudo", "etc/pam.d", "etc/alternatives"):
            (root / name).mkdir(parents=True, exist_ok=True)
        write_file(root / "etc/passwd", "root:x:0:0:root:/root:/bin/bash\nlabex:x:1000:1000:Local Linux learner:/home/labex:/bin/bash\n")
        write_file(root / "etc/group", "root:x:0:\nlabex:x:1000:\nsudo:x:27:labex\n")
        write_file(root / "etc/shadow", "root:!:20000:0:99999:7:::\nlabex:!:20000:0:99999:7:::\n", 0o600)
        write_file(root / "etc/gshadow", "root:!::\nlabex:!::\nsudo:!::labex\n", 0o600)
        crontab = shutil.which("crontab")
        if crontab:
            gid = Path(crontab).stat().st_gid
            with (root / "etc/group").open("a") as groups:
                groups.write(f"crontab:x:{gid}:\n")
            with (root / "etc/gshadow").open("a") as groups:
                groups.write("crontab:!::\n")
            spool = root / "var/spool/cron/crontabs"
            spool.mkdir(parents=True)
            os.chown(spool, 0, gid)
            spool.chmod(0o1730)
            write_file(root / "etc/cron.allow", "labex\n")
        write_file(root / "etc/nsswitch.conf", "passwd: files\ngroup: files\nshadow: files\nhosts: files\n")
        write_file(root / "etc/login.defs", "UID_MIN 1001\nUID_MAX 60000\nGID_MIN 1001\nGID_MAX 60000\nUSERGROUPS_ENAB yes\nCREATE_HOME no\nENCRYPT_METHOD YESCRYPT\nPASS_MAX_DAYS 99999\nPASS_MIN_DAYS 0\nPASS_WARN_AGE 7\n")
        write_file(root / "etc/default/useradd", "GROUP=100\nHOME=/home\nINACTIVE=-1\nEXPIRE=\nSHELL=/bin/sh\nSKEL=/etc/skel\nCREATE_MAIL_SPOOL=no\n")
        (root / "etc/skel").mkdir()
        write_file(root / "etc/hosts", "127.0.0.1 localhost labex\n::1 localhost\n")
        write_file(root / "etc/shells", "/bin/bash\n/bin/sh\n")
        write_file(root / "etc/sudoers", "Defaults !lecture\n%sudo ALL=(ALL:ALL) ALL\nlabex ALL=(ALL:ALL) NOPASSWD: ALL\n", 0o440)
        write_file(root / "etc/pam.d/sudo", "auth required pam_unix.so\naccount required pam_unix.so\nsession required pam_unix.so\n")
        for command in ("su", "su-l"):
            write_file(root / "etc/pam.d" / command, "auth sufficient pam_rootok.so\nauth required pam_unix.so\naccount required pam_unix.so\nsession required pam_unix.so\n")
        for command in ("passwd", "chpasswd"):
            write_file(root / "etc/pam.d" / command, "password required pam_unix.so yescrypt\n")
        for name in ("sudo", "sudoedit"):
            traditional = Path("/usr/bin/sudo.ws")
            target = traditional if traditional.exists() else Path(shutil.which(name) or "/usr/bin/sudo").resolve()
            if target.is_file():
                (root / "etc/alternatives" / name).symlink_to(target)
        # Ubuntu commands such as awk/editor are alternatives symlinks. Copy
        # their targets into private /etc, without exposing host configuration.
        alternatives = Path("/etc/alternatives")
        if alternatives.is_dir():
            for link in alternatives.iterdir():
                target = link.resolve()
                local = root / "etc/alternatives" / link.name
                if link.is_symlink() and str(target).startswith("/usr/") and not local.exists():
                    local.symlink_to(target)
        write_file(root / "etc/labex.bashrc", BASHRC)
        journal = root / "var/log/labex/commands.tsv"
        write_file(journal, "", 0o644)
        os.chown(journal, 1000, 1000)
        for path in ("home/labex", "home/labex/project"):
            folder = root / path
            folder.mkdir(parents=True, exist_ok=True)
            os.chown(folder, 1000, 1000)
        (root / "var/run").symlink_to("../run")
        manifest_path = manifest_path or SETUPS / f"{lab_id}.json"
        manifest_digest = None
        if manifest_path.exists():
            raw = manifest_path.read_bytes()
            apply_manifest(root, json.loads(raw))
            manifest_digest = hashlib.sha256(raw).hexdigest()
        write_file(root / ".initialized.json", json.dumps({"runnerVersion": RUNNER_VERSION, "manifestSha256": manifest_digest, "labId": lab_id}))


def command_args(root, command=None):
    args = [shutil.which("unshare"), "--mount", "--propagation", "private", "--pid", "--fork", "--kill-child", "--net", "--ipc", "--uts", "--cgroup", sys.executable, str(Path(__file__).resolve()), "--inside", "--state-root", str(root), "--mode", "interactive" if command is None else "command"]
    return args + ([] if command is None else ["--command=" + command])


def enter_namespace(root, command=None):
    """Called only after unshare established a private mount/PID/network namespace."""
    if os.getpid() != 1:
        raise RuntimeError("Namespace bootstrap must run as PID 1 after unshare")
    def mount(*args):
        subprocess.run(["/usr/bin/mount", *map(str, args)], check=True, capture_output=True, text=True)
    jail = root / ".rootfs"
    jail.mkdir(exist_ok=True)
    if jail.is_symlink():
        raise ValueError("Invalid namespace root mountpoint")
    mount("-t", "tmpfs", "-o", "mode=755", "tmpfs", jail)
    (jail / "usr").mkdir()
    mount("--bind", "/usr", jail / "usr")
    mount("-o", "remount,bind,ro", jail / "usr")
    for name, target in (("bin", "usr/bin"), ("sbin", "usr/sbin"), ("lib", "usr/lib"), ("lib64", "usr/lib64")):
        if Path("/" + name).exists():
            (jail / name).symlink_to(target)
    for name in ("etc", "home", "tmp", "var", "run"):
        source = root / name
        if source.is_symlink() or not source.is_dir():
            raise ValueError("Invalid environment mount directory")
        (jail / name).mkdir()
        mount("--bind", source, jail / name)
    for name in ("root", "proc", "dev"):
        (jail / name).mkdir()
    # The ephemeral boot hook changes with the launcher, without rewriting
    # persistent learner configuration or reapplying fixture manifests.
    write_file(jail / "opt/labex/bashrc", "source /etc/labex.bashrc\nprintf '__LABEX_LOCAL_SHELL_READY_173A__\\n'\n")
    mount("-t", "proc", "-o", "nosuid,nodev,noexec", "proc", jail / "proc")
    # Read-only sysctls protect host-wide kernel settings not covered by the
    # namespace. Learner root has no SYS_ADMIN capability to undo these mounts.
    mount("--bind", jail / "proc/sys", jail / "proc/sys")
    mount("-o", "remount,bind,ro", jail / "proc/sys")
    for name in ("null", "zero", "random", "urandom", "tty"):
        (jail / "dev" / name).touch()
        mount("--bind", "/dev/" + name, jail / "dev" / name)
    for name in ("sysrq-trigger", "kcore", "keys", "timer_list"):
        if (jail / "proc" / name).exists():
            mount("--bind", "/dev/null", jail / "proc" / name)
    (jail / "dev/pts").mkdir()
    mount("-t", "devpts", "-o", "newinstance,ptmxmode=0666,mode=0620", "devpts", jail / "dev/pts")
    (jail / "dev/ptmx").symlink_to("pts/ptmx")
    (jail / "dev/shm").mkdir(mode=0o1777)
    (jail / "dev/shm").chmod(0o1777)
    for name, target in (("fd", "/proc/self/fd"), ("stdin", "/proc/self/fd/0"), ("stdout", "/proc/self/fd/1"), ("stderr", "/proc/self/fd/2")):
        (jail / "dev" / name).symlink_to(target)
    subprocess.run(["/usr/bin/hostname", "labex"], check=True)
    os.chroot(jail)
    os.chdir("/home/labex/project")
    # stdin/stdout/stderr are the intended PTY or verifier pipes. No outside
    # directory handles, sockets or namespace descriptors reach the learner.
    os.closerange(3, 65536)
    argv = ["setpriv", "--bounding-set=-all,+chown,+setuid,+setgid,+dac_override,+fowner,+fsetid", "--reuid=labex", "--regid=labex", "--init-groups", "/bin/bash", "--noprofile"]
    argv += ["--rcfile", "/opt/labex/bashrc", "-i"] if command is None else ["--norc", "-c", command]
    os.execve("/usr/bin/setpriv", argv, {"PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", "HOME": "/home/labex", "USER": "labex", "LOGNAME": "labex", "SHELL": "/bin/bash", "TERM": "xterm-256color", "LC_ALL": "C.UTF-8"})


def history(root):
    result = []
    # Learner root can edit private /var. Never follow their symlinks using the
    # host filesystem's interpretation of absolute paths.
    directory_fd = None
    try:
        directory_fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        for part in ("var", "log", "labex"):
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=directory_fd)
            os.close(directory_fd)
            directory_fd = child
        journal_fd = os.open("commands.tsv", os.O_RDONLY | os.O_NOFOLLOW, dir_fd=directory_fd)
        with os.fdopen(journal_fd, "r", errors="replace") as journal:
            journal.seek(0, os.SEEK_END)
            size = journal.tell()
            journal.seek(max(0, size - 1024 * 1024))
            lines = journal.read().splitlines()[-500:]
    except (FileNotFoundError, NotADirectoryError):
        return result
    finally:
        if directory_fd is not None:
            os.close(directory_fd)
    for line in lines:
        try:
            status, user, encoded = line.split("\t", 2)
            result.append({"command": base64.b64decode(encoded, validate=True).decode("utf8", errors="replace"), "status": int(status), "user": user})
        except (ValueError, UnicodeError):
            continue
    return result


def environment_status(root, lab_id, manifest_path=None):
    """Inspect recipe drift without initializing or modifying learner state."""
    manifest_path = manifest_path or SETUPS / f"{lab_id}.json"
    digest = hashlib.sha256(manifest_path.read_bytes()).hexdigest() if manifest_path.is_file() else None
    result = {"labId": lab_id, "initialized": False, "setup_current": False, "reset_required": False,
              "manifest_available": manifest_path.is_file(), "reason": "Environment has not been initialized."}
    if root.is_symlink():
        return {**result, "reset_required": True, "reason": "Invalid environment state path."}
    marker = root / ".initialized.json"
    if not marker.exists():
        return result
    try:
        stored = json.loads(marker.read_text())
    except (OSError, ValueError):
        return {**result, "initialized": True, "reset_required": True, "reason": "Initialization marker cannot be read; learner files were preserved."}
    current = stored.get("manifestSha256") == digest
    return {**result, "initialized": True, "setup_current": current, "reset_required": not current,
            "reason": "Environment setup is current." if current else "Setup manifest changed after initialization. Existing files were preserved; explicit reset will archive this environment before applying the new setup."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--probe", action="store_true")
    parser.add_argument("--inside", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--state-root", help=argparse.SUPPRESS)
    parser.add_argument("--state-base")
    parser.add_argument("--lab")
    parser.add_argument("--mode", choices=("interactive", "command", "history", "reset", "status"), default="command")
    parser.add_argument("--command")
    args = parser.parse_args()
    require_runtime()
    if args.inside:
        if not args.state_root or not Path(args.state_root).is_absolute():
            raise ValueError("Internal namespace state root is required")
        enter_namespace(Path(args.state_root), None if args.mode == "interactive" else args.command)
        return
    if args.probe:
        with tempfile.TemporaryDirectory(prefix="labex-namespace-probe-") as directory:
            root = Path(directory)
            initialize(root, "runtime-probe")
            result = subprocess.run(command_args(root, 'test "$(id -un)" = labex && test "$HOME" = /home/labex && test "$PWD" = /home/labex/project && test ! -e /mnt/c && sudo -n true'), text=True, capture_output=True, timeout=8)
            if result.returncode:
                raise RuntimeError("Isolated environment probe failed: " + result.stderr.strip()[:300])
        print(json.dumps({"available": True, "provider": "linux-namespaces", "shell": "/bin/bash", "label": f"Isolated Linux / {os_description()}", "osVersion": os_description(), "user": "labex", "home": "/home/labex", "cwd": "/home/labex/project", "isolated": True, "isolation": True, "network": False, "desktop": False, "webide": False, "capabilities": {"terminal": True, "files": True, "users": True, "sudo": True, "permissions": True, "shell": True, "archives": True, "desktop": False, "webide": False, "network": False, "packages": False, "persistentProcesses": False, "kernelLogs": False, "cron": False, "cronRegistration": bool(shutil.which("crontab")), "ip": bool(shutil.which("ip")), "ifconfig": bool(shutil.which("ifconfig")), "ss": bool(shutil.which("ss"))}, "lifecycle": {"persistence": "per-lab", "processes": "one namespace per terminal or verification; killed on session exit", "reset": "archives old private state; reconnect terminal afterwards", "scheduler": "crontab registration only; no persistent cron daemon"}, "setupProvenance": "Local compatibility fixtures; original image is not reproduced"}))
        return
    if not args.lab or not ID.fullmatch(args.lab) or not args.state_base:
        raise ValueError("A valid lab ID and explicit state base are required")
    base = Path(args.state_base)
    if not base.is_absolute():
        raise ValueError("State base must be absolute")
    root = base / args.lab
    if args.mode == "status":
        print(json.dumps(environment_status(root, args.lab)))
        return
    locks = base / ".locks"
    locks.mkdir(parents=True, mode=0o700, exist_ok=True)
    if locks.is_symlink():
        raise ValueError("Invalid environment lock directory")
    descriptor = os.open(locks / f"{args.lab}.lock", os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, "a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if args.mode == "reset":
            backup = None
            if root.exists():
                if root.is_symlink() or not root.is_dir():
                    raise ValueError("Invalid environment directory")
                backups = base / ".backups"
                backups.mkdir(mode=0o700, exist_ok=True)
                if backups.is_symlink():
                    raise ValueError("Invalid environment backup directory")
                backup = backups / f"{args.lab}-{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}-{uuid.uuid4().hex[:8]}"
                root.rename(backup)
            initialize(root, args.lab)
            print(json.dumps({"reset": True, "labId": args.lab, "backupCreated": backup is not None, "reconnectRequired": True}))
            return
        if args.mode == "history":
            print(json.dumps(history(root)))
            return
        initialize(root, args.lab)
    if args.mode == "command" and not args.command:
        raise ValueError("A verification command is required")
    argv = command_args(root, None if args.mode == "interactive" else args.command)
    os.execv(argv[0], argv)


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        print(f"Linux runtime: {error}", file=sys.stderr)
        raise SystemExit(78)
