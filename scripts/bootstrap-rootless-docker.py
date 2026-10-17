"""Install/start an opt-in, private rootless Docker engine in the WSL user's home.

Official static binaries only. Host prerequisites are installed separately with
APT. This script never enables services, changes firewall rules in the host
namespace, edits shell startup files, or replaces the current learning provider.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import time
from urllib.request import urlopen

VERSION = "29.9.1"
BASE = Path.home() / ".local/share/labex-local/docker-rootless"
BIN = BASE / "versions" / VERSION / "bin"
RUN = BASE / "run"
SOCKET = RUN / "docker.sock"
SOURCE = "https://download.docker.com/linux/static/stable/x86_64"


def environment():
    return {**os.environ, "PATH": str(BIN) + os.pathsep + os.environ.get("PATH", ""),
            "XDG_RUNTIME_DIR": str(RUN), "XDG_CONFIG_HOME": str(BASE / "config"),
            "DOCKER_CONFIG": str(BASE / "cli"), "DOCKER_HOST": "unix://" + str(SOCKET),
            "DOCKERD_ROOTLESS_ROOTLESSKIT_NET": "slirp4netns",
            "DOCKERD_ROOTLESS_ROOTLESSKIT_PORT_DRIVER": "builtin"}


def docker_info():
    try:
        result = subprocess.run([str(BIN / "docker"), "info", "--format", "{{json .}}"],
                                env=environment(), text=True, capture_output=True, timeout=8)
        if result.returncode:
            return None
        data = json.loads(result.stdout)
        if not any("rootless" in option for option in data.get("SecurityOptions", [])):
            raise RuntimeError("The selected Docker daemon is not rootless; refusing to use it.")
        return {"version": data["ServerVersion"], "driver": data["Driver"],
                "rootless": True, "socket": str(SOCKET), "data_root": data["DockerRootDir"]}
    except (OSError, subprocess.TimeoutExpired):
        return None


def install():
    BASE.mkdir(parents=True, exist_ok=True, mode=0o700)
    BIN.mkdir(parents=True, exist_ok=True)
    downloads = BASE / "downloads"
    downloads.mkdir(exist_ok=True)
    records = []
    for prefix in ("docker", "docker-rootless-extras"):
        filename = f"{prefix}-{VERSION}.tgz"
        target = downloads / filename
        if not target.is_file():
            print("Downloading official " + filename, flush=True)
            temporary = target.with_suffix(".partial")
            with urlopen(SOURCE + "/" + filename, timeout=45) as source, temporary.open("wb") as output:
                shutil.copyfileobj(source, output, length=1024 * 1024)
            temporary.replace(target)
        digest = hashlib.sha256(target.read_bytes()).hexdigest()
        records.append({"url": SOURCE + "/" + filename, "bytes": target.stat().st_size, "sha256": digest})
        with tarfile.open(target, "r:gz") as archive:
            for item in archive.getmembers():
                if item.isdir():
                    continue
                parts = Path(item.name).parts
                if len(parts) != 2 or parts[0] != prefix or not item.isfile() or ".." in parts:
                    raise RuntimeError("Unexpected member in the official static archive: " + item.name)
                destination = BIN / parts[-1]
                if destination.is_symlink():
                    raise RuntimeError("Refusing to replace a symlink: " + str(destination))
                with archive.extractfile(item) as source, destination.open("wb") as output:
                    shutil.copyfileobj(source, output)
                destination.chmod(0o755)
    metadata = {"version": VERSION, "default_user_uid": os.getuid(), "bin": str(BIN),
                "socket": str(SOCKET), "artifacts": records,
                "verification": "Downloaded through official HTTPS; SHA256 recorded locally for reproducibility."}
    (BASE / "installation.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps(metadata), flush=True)


def start():
    existing = docker_info()
    if existing:
        print(json.dumps(existing), flush=True)
        return
    if not (BIN / "dockerd-rootless.sh").is_file():
        raise RuntimeError("Run the install action first.")
    missing = [tool for tool in ("newuidmap", "newgidmap", "slirp4netns", "iptables")
               if not shutil.which(tool)]
    if missing:
        raise RuntimeError("Missing host prerequisites: " + ", ".join(missing))
    RUN.mkdir(parents=True, exist_ok=True, mode=0o700)
    RUN.chmod(0o700)
    if RUN.is_symlink() or RUN.stat().st_uid != os.getuid():
        raise RuntimeError("Runtime directory must belong to the current user and must not be a symlink.")
    # The kernel boot ID changes after WSL shutdown. Rootlesskit handles stale
    # socket state; existing user containers/data are never deleted here.
    log = (BASE / "daemon.log").open("ab", buffering=0)
    child = subprocess.Popen([str(BIN / "dockerd-rootless.sh"),
                              "--host=unix://" + str(SOCKET),
                              "--data-root=" + str(BASE / "data"),
                              "--exec-root=" + str(RUN / "exec"),
                              "--pidfile=" + str(RUN / "dockerd.pid"),
                              "--storage-driver=overlay2"],
                             env=environment(), stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                             start_new_session=True, close_fds=True)
    (RUN / "launcher.pid").write_text(str(child.pid))
    deadline = time.monotonic() + 35
    while time.monotonic() < deadline:
        info = docker_info()
        if info:
            print(json.dumps(info), flush=True)
            return
        if child.poll() is not None:
            raise RuntimeError("Rootless Docker exited; inspect " + str(BASE / "daemon.log"))
        time.sleep(0.5)
    raise RuntimeError("Rootless Docker did not become ready; inspect " + str(BASE / "daemon.log"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("install", "start", "info"))
    args = parser.parse_args()
    if os.getuid() == 0:
        raise SystemExit("Run this helper as the normal WSL user, never as root.")
    try:
        if args.action == "install":
            install()
        elif args.action == "start":
            start()
        else:
            print(json.dumps(docker_info()), flush=True)
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        raise SystemExit(str(error))
