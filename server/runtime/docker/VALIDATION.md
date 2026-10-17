# Optional Docker provider

The Docker provider uses an application-owned rootless daemon under the default
WSL user's `~/.local/share/labex-local/docker-rootless`. It never mounts the host
filesystem or daemon socket into a learner container. Learner identity is
`labex`, HOME `/home/labex`, working directory `/home/labex/project`.

The base image supplies genuine Ubuntu 22.04 userspace, real APT, sudo, account
tools, cron, procps and UFW. It does not supply a dedicated kernel, desktop,
noVNC or WebIDE. `dmesg` remains unsupported. TCP port 22 firewall checks prove
traffic enforcement, not SSH authentication.

## Verification commands

Run Python integration tests as the normal WSL user, not WSL root:

```powershell
wsl --distribution Ubuntu --exec /usr/bin/python3 /mnt/d/Project/LabEx/tests/runtime.docker-smoke.py
wsl --distribution Ubuntu --exec /usr/bin/python3 /mnt/d/Project/LabEx/tests/runtime.docker-network-smoke.py
wsl --distribution Ubuntu --exec /usr/bin/python3 /mnt/d/Project/LabEx/tests/runtime.docker-lifecycle-smoke.py
node tests/source-course.smoke.mjs --provider=docker
node tests/source-course.smoke.mjs tests/scenarios/junior-docker-course.json --provider=docker
```

Every smoke uses fresh test-only environment IDs. Network/lifecycle tests remove
only their exact labelled disposable containers. Course smoke stops its test
containers and preserves them for inspection; it never resets learner IDs.
Course reports are durable `.artifacts/source-course-smoke-<runId>.json` files.
Only a report with `complete: true` is a completed course run.
The aggregation validator accepts only fully exercised lessons from its source
reports and records interruptions explicitly. Current coverage artifacts are
`.artifacts/docker-quick-start-coverage.json` (47 passed tasks) and
`.artifacts/docker-junior-coverage.json` (47 passed tasks, one unsupported kernel
log task). These establish complete lesson coverage across runs, not one
uninterrupted whole-course run.

## Actual checks passed

- Real background processes survive separate terminal/verifier execs.
- Real APT update/install/removal/autoremove changes the container writable layer.
- A real cron daemon executes a learner crontab across a scheduled minute.
- Source-required external ICMP to `8.8.8.8` succeeds in the tested network.
- Two disposable peers on an internal private bridge demonstrate TCP 22/8000
  default denial, selective allow, rule deletion and firewall disable effects.
- History/status reads do not create or start a learner container.
- Stopped containers restart with learner work intact; changed manifests report
  reset required without replacing files.
- Explicit reset stops and renames the old container as an archive before
  initializing the replacement.
- Noninteractive verification has an inner five-second process-group deadline
  with one-second forced cleanup. A timed-out verifier leaves no test process.
  Interactive learner commands and persistent services remain unbounded by this
  verifier deadline.

External connectivity depends on the machine's actual network. These local
checks do not establish parity with LabEx's undisclosed grader, VM image or
private backend. Resource limits must not be promised without actual cgroup
controller support. Provider selection and public API readiness are handled by
the backend configuration; changing provider does not migrate existing work.
