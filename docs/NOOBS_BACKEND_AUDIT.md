# Noobs backend audit

> Update 2026-10-17: all 37 lessons now have complete per-lesson Docker integration evidence in `.artifacts/docker-noobs-coverage.json`: **100 tasks pass after real work, 100 pre-work negative checks, 34 explicit blocks**. This aggregates whole lessons from multiple runs; one contributing run was interrupted after completing earlier lessons and has no final host-account assertion. Reviewed VI now covers 208 sections. Regeneration preserves current EN/VI and namespace task variants; backups are archival, not rerun input. See [current repair report](FIDELITY_REPAIRS_2026-10-17.md). Historical audit wording follows.

Audit date: 2026-10-16. Source: 37 existing local Anti lesson JSON files. No new full-text source scraping was performed. Their English/Vietnamese content and source IDs are preserved. This audit does **not** establish equality with current LabEx lesson bodies or recover the original private graders.

The previous 25 practical acknowledgement checks and 38 checks based on navigation were replaced. No practical task can pass through acknowledgement. Unreviewed work is explicitly unsupported. The namespace provider remains blocked for this course pending its own integration proof.

Task IDs now use `source-<source_lab_id>-section-<position>-v3` in tasks, task sections and test scenarios. Earlier unearned acknowledgement/navigation completion IDs therefore do not satisfy this audited curriculum. Intro/summary IDs, source positions and all teaching content remain unchanged. No learner files are reset or removed.

Docker candidate coverage: **100/134 tasks**; **34 explicitly unsupported**. Candidate means authored checks, not successful integration proof. Read the generated integration report before claiming these tasks work.

Fixtures are independently reconstructed from the local instructions. Unknown original bytes are never described as recovered. Docker systemd, SSH, Zsh, raw block/loop mounts and kernel-log exercises remain unsupported where their real dependencies are missing. A command like `cd` alone never establishes successful practical work.

Artifact checks accept equivalent commands and quote styles when the required bytes, ownership, modes and behavior are correct. No first-command or redirection-to-regex heuristic is used. Explicit operation-history checks remain only where final state cannot prove the required observation/process/package/interactive action; the original hidden LabEx grader's accepted alternatives are unknown.

| Order | Local lesson | Docker candidates | Blocked |
| --- | --- | ---: | ---: |
| 1 | Getting Started with Linux | 4 | 1 |
| 2 | Save a Terminal Banner | 1 | 0 |
| 3 | Basic File Operations in Linux | 6 | 1 |
| 4 | Get Help on Linux Commands | 2 | 2 |
| 5 | Archive a Draft File | 1 | 0 |
| 6 | Linux User Group and File Permissions | 6 | 2 |
| 7 | Onboard a Practice User | 1 | 0 |
| 8 | File and Directory Operations | 8 | 0 |
| 9 | Find and Protect a Configuration File | 1 | 0 |
| 10 | Environment Variables in Linux | 4 | 1 |
| 11 | Persist a Project Environment Variable | 0 | 1 |
| 12 | File Packaging and Compression | 6 | 0 |
| 13 | Back Up a Log Directory | 1 | 0 |
| 14 | File System and Disk Management | 1 | 5 |
| 15 | Rank Directory Usage | 1 | 0 |
| 16 | Command Sequences and Pipelines | 5 | 0 |
| 17 | Select Sensor Alert Events | 1 | 0 |
| 18 | Combine and Transform Text Files | 4 | 0 |
| 19 | Normalize a PATH-Style List | 1 | 0 |
| 20 | Text Processing with Regular Expressions | 5 | 0 |
| 21 | Extract Unique Email Addresses | 1 | 0 |
| 22 | Data Stream Redirection | 6 | 0 |
| 23 | Extract Programs from Command History | 1 | 0 |
| 24 | System Information and Process Management | 5 | 2 |
| 25 | Stop a Runaway Process | 1 | 0 |
| 26 | Software Installation on Linux | 5 | 0 |
| 27 | Install a Local Monitoring Package | 1 | 0 |
| 28 | Managing Services and System Logs | 0 | 7 |
| 29 | Recover a Failed Service | 0 | 1 |
| 30 | Linux Networking and Firewall Basics | 5 | 2 |
| 31 | Correct a Service Bind Address | 0 | 1 |
| 32 | Remote Access and File Transfer with SSH | 0 | 7 |
| 33 | Upload a Configuration with SCP | 0 | 1 |
| 34 | Shell Scripting Fundamentals | 7 | 0 |
| 35 | Write a Log Error Summary Script | 1 | 0 |
| 36 | Scheduled Backup and Recovery | 7 | 0 |
| 37 | Restore a Configuration from Backup | 1 | 0 |

Regenerate with `python scripts/audit_noobs_labs.py`. First-run source copies remain in `.artifacts/noobs-before-backend-audit`; reruns use those copies and preserve teaching text.

Integration command: `node tests/source-course.smoke.mjs tests/scenarios/linux-for-noobs-docker.json --provider=docker`. This runs separate test-only lab IDs, checks tasks fail before work, performs the documented work and checks resulting state. Some unsupported dependencies are deliberately blocked rather than simulated.

FE handoff: read the backend readiness counts/reasons and show partial lessons honestly. Keep reference text readable and permit navigation to later sections without awarding a passed task. Disable grading for unsupported practical tasks; do not turn them into a Continue/acknowledgement success. Intro/summary navigation is separate from practical completion. Ignore saved completion IDs from the old section-N curriculum.
