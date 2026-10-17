# Optional Ubuntu 22.04 container runtime

Historical design and prerequisite evidence, 2026-10-16. Installation and implementation have now been completed; the sections below preserve the earlier design and pre-install observations. Current installed paths, packages, startup and limitations are in [ROOTLESS_RUNTIME.md](ROOTLESS_RUNTIME.md); runtime proofs are in [VALIDATION.md](../server/runtime/docker/VALIDATION.md). The namespace provider remains available as a fallback.

## Current evidence

Quick Start integration passes all 47 tasks through real interactive terminals, with 47 checks that reject unfinished work. Junior integration passes 33 supported tasks and explicitly rejects 15 unsupported tasks. Reports: `.artifacts/source-course-smoke-mvamixgn.json` and `.artifacts/source-course-smoke-mvamooig.json`. Both use test-only environment IDs and confirm unchanged host account database metadata.

The current provider reuses installed Ubuntu 26.04.1 `/usr` read-only, has no outbound network, and creates a fresh PID namespace per invocation. It supports actual files, users, passwords, sudo, permissions, shell scripts and archives. It supports real private crontab registration, but runs no scheduler. Live process grading, package installation, outbound networking and firewall exercises need a different provider. Kernel log exercises need separate consideration even with containers.

Read-only WSL prerequisite probe:

| Check | Observed result |
| --- | --- |
| Subordinate UID and GID allocation | Existing default user has 65,536 IDs starting at 100000 |
| Unprivileged user and network namespaces | `unshare --user --map-root-user --net id` succeeds |
| User namespace limit | 13993 |
| Ping group range | 0 through 2147483647 |
| `newuidmap`, `newgidmap` | Missing from PATH |
| `rootlesskit`, `slirp4netns`, `pasta`, `fuse-overlayfs` | Missing from PATH |
| Docker and Podman | Missing from PATH |
| WSL networking | NAT |
| Windows D: free space | Approximately 108 GiB during probe |

## Preferred approach

Provision a version-pinned portable rootless Docker engine under the existing WSL user's private application directory. Use a pinned Ubuntu 22.04 image for each persistent lab. An Ubuntu 26.04 WSL host can run a 22.04 container userland; health must report the image's actual release. Rootless Docker runs both daemon and containers in user namespaces, but still requires `newuidmap` and `newgidmap` with appropriate privileges. Merely extracting these binaries as ordinary user-owned files cannot provide multi-UID mappings. Existing subordinate ranges do not need changing. [Docker rootless prerequisites](https://docs.docker.com/engine/security/rootless/)

The installer must obtain trusted Ubuntu `uidmap` helpers and their dependencies, place any privileged helper in a root-owned directory whose parents are not user-writable, and verify ownership, mode, dependency resolution and actual multi-UID mapping. A user-local package extraction alone is insufficient. Prefer versioned application-specific helper paths; do not modify global account ranges, firewall, sysctls or `/usr/bin`. The parent agent owns this installation decision and implementation.

Download matching pinned engine and rootless-extras archives from Docker's official static distribution. Verify available publisher checksums/signatures or record a reviewed digest before execution. Inspect archive paths and contents before extraction. Static installation needs explicit security updates and may omit functionality provided by packages. [Docker static binary installation](https://docs.docker.com/engine/install/binaries/)

Use a private runtime directory below the application directory, not `/tmp`. Launch the rootless daemon through `dockerd-rootless.sh` when not using a user systemd service; pass an explicit Unix socket and dedicated data directory. Never expose the daemon socket inside a learner container. Check the actual cgroup driver and controllers before promising memory, PID or CPU limits. [Rootless daemon and resource configuration](https://docs.docker.com/engine/security/rootless/tips/)

Illustrative application paths (resolve the actual default user's home):

```text
~/.local/share/labex-local/docker/bin/
~/.local/share/labex-local/docker/data/
~/.local/share/labex-local/docker/runtime/   # owner-only, mode 0700
~/.local/share/labex-local/docker/logs/
```

The reviewed installer should supply an application-specific wrapper, so the backend invokes a single known executable with `execFile` argument arrays. It should not depend on the user's Docker context or shell profile.

## Provider contract and lifecycle

Keep the optional provider behind an explicit configuration choice until acceptance succeeds. If selected but unavailable, return an accurate unavailable error; do not run administrative tasks on the host.

Each lab has one persistent named container, its own writable image layer and network/PID namespace. A small PID 1 reaps children and starts private cron where required. Terminal and verifier both use `docker exec` into that same container. This gives graders the real running processes and scheduled files. Learner identity remains UID/GID 1000 `labex`, HOME `/home/labex`, cwd `/home/labex/project`, with real sudo and private account files.

Seed the existing allowlisted manifests once, record their digest, and preserve learner work when manifests change. The status API reports reset required. Only an explicit reset archives the old state and replaces the environment; do not silently delete or reseed it. Keep the shell readiness marker and private command journal behavior. Verifier timeouts must terminate only the verification process, leaving the learner container alive.

Never use host PID/network mode, privileged containers, host drive mounts or Docker socket mounts. Network lessons may request `NET_ADMIN` only inside their own rootless container network namespace, after a real UFW test. Rootless networking and kernel support must be demonstrated rather than assumed. Outbound ping to the source's IP can still fail because of external network policy; report the real result.

Container `dmesg` exposes a shared kernel rather than a private Ubuntu kernel. Keep that task explicitly unsupported unless a dedicated VM supplies suitable isolated kernel logs. A different WSL distribution alone is not a sufficient firewall or kernel isolation boundary: WSL 2 distributions share the kernel and networking infrastructure. [Microsoft WSL architecture](https://learn.microsoft.com/en-us/windows/wsl/about)

## Alternatives

| Approach | Benefit | Cost / boundary |
| --- | --- | --- |
| Portable rootless Docker in existing WSL | No new distro; Ubuntu 22 image, persistent processes and package writes; user-owned daemon | Missing mapping/network helpers must be provisioned and tested; manual binary updates; rootless networking limitations |
| Rootless Podman | Daemonless persistent containers | Also requires mapping and networking prerequisites; extra provider integration; currently absent |
| Private imported Ubuntu 22 WSL distro plus rootless containers | Separate distro filesystem and package dependencies | Extra rootfs/storage and setup; still needs container networking isolation; same shared WSL kernel |
| Rootful Docker | Broad container compatibility | Daemon root privileges and host firewall changes; avoid in the learner's existing WSL distro |
| Dedicated Linux VM | Own kernel, systemd, networking and logs | More RAM/disk, VM setup and boot management; strongest match for kernel/system services |

If an imported distro is needed, obtain the official Ubuntu Base rootfs with checksum verification and use `wsl --import LabEx-Ubuntu2204 <dedicated-install-dir> <verified-rootfs.tar> --version 2`. Configure only that new distro and terminate only it when necessary; do not issue global `wsl --shutdown`. Ubuntu Base is minimal and needs actual course packages. [Microsoft import instructions](https://learn.microsoft.com/en-us/windows/wsl/use-custom-distro), [official Ubuntu 22.04 Base downloads](https://cdimage.ubuntu.com/ubuntu-base/releases/22.04/release/).

## Acceptance before enabling

1. Prove actual unprivileged multi-UID mapping and daemon `SecurityOptions` containing rootless. Record engine/image versions and digest.
2. Verify actual `/etc/os-release` is Ubuntu 22.04 in the container, learner identity and sudo behavior are correct, and host account metadata remains unchanged.
3. Run a real background CPU process from terminal; locate, inspect and kill it from a separate verifier in the same container.
4. Run `apt-get update`, install a real small package, execute it, remove it, and verify no host package/database changes.
5. Register a private cron job, wait through its actual scheduled minute, check its timestamped artifact, remove it, and confirm no host cron job was added.
6. Test outbound DNS, HTTP and source-required ping. Test UFW rule effect inside the lab and confirm host firewall metadata/rules were not changed.
7. Exercise reset/archive, manifest mismatch, reconnect, command timeout, engine unavailable and container restart paths with test-only IDs.
8. Re-run the existing 47-task and Junior supported-task scenarios against the optional provider; enable each newly supported task only after its real before/after proof succeeds.

Provisioning estimates, not measured commitments: allow roughly 200–800 MB downloads and 2–5 GB initial disk for engine, image and command-line packages, with additional writable layers per active lab. Desktop/web IDE stacks would add several GB and are separate work. Initial setup commonly takes 10–30 minutes depending on download speed; provider integration and end-to-end verification add engineering time. Existing WSL 2 works, so no Windows reboot is expected for a user-local engine. Privileged helper ownership requires WSL root; no Windows administrator operation is currently planned.
