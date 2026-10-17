# Quick Start with Linux: factual parity and remaining gaps

Observed 2026-10-16. This document records the implemented contract and remaining differences. It does not claim to recover the original lesson source, private graders, hidden solutions or VM image.

## Evidence and scope

- Course syllabus and environment: https://labex.io/courses/quick-start-with-linux
- Official public index: https://github.com/labex-labs/quick-start-with-linux
- Authenticated section outline: [quick-start-live-outline.json](../server/data/reference/quick-start-live-outline.json), REA evidence `ev_2987a1f8d0e50c98e0c112111e84a87c469f7fc4362016b74a1e84a167e9adcc`.
- Factual machine-readable contract: [quick-start-with-linux.reference.json](../server/data/reference/quick-start-with-linux.reference.json).
- Original grader execution was not observed. A source VM session could not be started because the source daily VM quota was exhausted.
- The official repository root listing showed translated README indexes only. No full lesson source or LICENSE was observed there. Public visibility does not establish a license for copying complete lesson prose.
- The local lessons use original short section titles and independently authored Vietnamese summaries. Full source prose and private solution bodies are not stored.
- The source lists Ubuntu 22.04 with a VNC desktop. The local runtime is an isolated Linux environment using private account/filesystem state; it is not the original VM image.

## Before and after

The previous `scripts/generate_authentic_labs.mjs` inferred tasks from titles. It is retained as an old artifact and must not be run to regenerate this course. The current [generate-source-aligned-labs.mjs](../scripts/generate-source-aligned-labs.mjs) writes only these ten lesson IDs, their setup manifests, reference facts and integration scenarios. Before the first replacement it copied existing lesson JSON into `.artifacts/quick-start-before-parity/`; repeat runs preserve that first backup.

| # | Lesson and primary source | Observed structure | Previous local discrepancy | Current implementation and limits |
|---|---|---|---|---|
| 1 | [Your First Linux Lab](https://labex.io/tutorials/linux-your-first-linux-lab-270253) | 7 sections, 5 tasks | Three tasks; unconditional fallback success; omitted id -un and Learn By Doing. | Completed-command checks for identity commands, explicit acknowledgement for Learn By Doing. Original intentional failed inspection and Labby AI are not implemented. |
| 2 | [Display User and Group Information](https://labex.io/tutorials/linux-display-user-and-group-information-8718) | 4 sections, 2 tasks | Invented user_info.txt task. | Two display tasks, no file creation requirement. Identity numbers are environment-dependent. |
| 3 | [Basic Files Operations](https://labex.io/tutorials/linux-basic-files-operations-270248) | 8 sections, 6 tasks | Invented project/docs and app log files. | Source names and operations restored, including interactive removal, expected rmdir failure, retained new_testdir and temporary temp_dir cleanup. |
| 4 | [Files and Directories](https://labex.io/tutorials/linux-files-and-directories-270246) | 5 sections, 3 tasks | Invented workspace/src exercise. | Copies .zshrc and Code to Desktop, renames copies, then removes copies. Source fixture bytes were not recovered; seeded local examples are explicitly reconstructed. |
| 5 | [File Contents and Comparing](https://labex.io/tutorials/linux-file-contents-and-comparing-270251) | 10 sections, 8 tasks | Only two tasks using invented sample files. | Covers cat -n, head/tail by lines and bytes, file diff and recursive directory diff. /tmp/hello content observed; file1/file2 use public example content; Desktop/Code fixtures are reconstructed. |
| 6 | [The Manuscript Mystery](https://labex.io/tutorials/linux-the-manuscript-mystery-384742) | 4 sections, 2 tasks | Required learner-created manuscripts and diff_report.txt. | Read-only cat/head/tail/diff requirements restored. Only the second line of each manuscript was available; other lines are authored reconstruction and clearly marked. |
| 7 | [Permissions of Files](https://labex.io/tutorials/linux-permissions-of-files-270252) | 8 sections, 6 tasks | Omitted root ownership and recursive ownership tasks. | Actual root:root ownership, recursive tree change, numeric modes and executable script checked inside private Linux runtime. Exact original grader unknown. |
| 8 | [Change File Ownership](https://labex.io/tutorials/shell-change-file-ownership-270254) | 5 sections, 3 tasks | secret.txt mode600 substituted for ownership challenge. | target_file, owner user1, group group1, mode760. Fixture account/group are requirement-derived; original numeric IDs unknown. |
| 9 | [User Account Management](https://labex.io/tutorials/linux-user-account-management-49) | 10 sections, 8 tasks | Read-only account lookups and unconditional success substituted for administration. | Real useradd/passwd/usermod/group/lock/unlock/userdel within private account database. Local guide is concise and does not reproduce original explanation or authenticate the original private grader. |
| 10 | [The Joker's Trick](https://labex.io/tutorials/linux-the-joker-s-trick-270247) | 6 sections, 4 tasks | Invented batman.txt content/permissions exercise. | Actual joker/batman account lifecycle, /home/gotham and /home/arkham, passwords, shell and deletion semantics. No fictional text artifact required. |

Total: **67 sections, 47 tasks**, five labs and five challenges. Section counts include Introduction and Summary. The reference outline was obtained from the source API, not guessed from the old lesson data.

## Verification contract

The local checks are authored from observed requirements, not extracted from LabEx graders:

- `state`: trusted backend Bash predicate over the private lesson filesystem/account database.
- `commands`: groups of regex alternatives, matched against completed shell commands by user `labex`; default exit status0. Diff explicitly accepts0 or1.
- `all`: every nested check must pass.
- `acknowledgement`: explicit Continue action for Learn By Doing; this records acknowledgement, not an automatically graded Linux skill.
- Introduction and Summary are reading sections and do not increase graded-task count.
- New IDs `source-<source_lab_id>-section-<position>` replace the old grading IDs, preventing previous false positives from being mistaken for new task completion.

State is used when the task changes files/accounts. Command history is used for display-only tasks because an already existing readable file does not prove the learner ran the requested command. There is no `|| true` fallback and no extra output file required merely to make grading easier.

Command checks deliberately recognize a limited set of source-aligned forms. They are not a general shell semantic analyzer; equivalent command syntaxes may require additional alternatives. Some intermediate demonstrations are confirmed by command history together with the final state instead of snapshotting every transition. Original server-side checks remain unknown.

## Fixture fidelity

Manifests live in `server/data/environment-setups/<local-id>.json`. Every source-specific fixture has a fidelity annotation in the manifest provenance and reference contract.

- `observed_content`: /tmp/hello contains two newline-terminated lines, `Hi,` and `I am Labby!`.
- `public_example_content`: project/file1 and file2 use the text shown in the public diff example; this does not prove the exact original VM bytes.
- `requirement_derived`: user1/group1 are required by the ownership challenge. Local numeric IDs are selected for the local runtime.
- `reconstructed_fixture`: .zshrc, Desktop launchers, Code examples and manuscript lines other than the known second lines are authored practice substitutes. Original full bytes are unknown; `baseline_content` is null where appropriate.
- The four launcher names on Desktop follow the displayed source example. Their local .desktop bodies are inert illustrative data rather than recovered application launchers.

The course requires a full private Linux account database and sudo for account/ownership tasks. Merely changing HOME on a host shell cannot provide this parity. Setup manifests must be loaded only by the isolated runtime; these files are not instructions to alter the host account database.

## Frontend handoff

The UI should render `lab.sections` in source position order. `kind` is exactly `introduction`, `task`, or `summary`; each task section has the same ID as its graded item in `lab.steps`. The latter contains tasks only.

Use section counts for the document navigator and task counts for grading/progress. Display challenge/lab types separately. Fullscreen reading sections do not need a terminal. Task sections use the workbench split layout. `action: "continue"` with an acknowledgement verification requires the explicit acknowledgement request; it must not auto-complete during rendering.

Show source attribution and the concise-summary/partial-fixture fidelity notice. Do not label the text as a recovered original lesson. Deep Inspection, source VM Desktop/WebIDE fidelity and AI solutions remain separate gaps; do not fabricate source AI responses.

Backend verification definitions are private and must be stripped from public payloads; the API may expose a verification kind for rendering. The parent implementation owns route filtering and acknowledgement handling. See [ANTIGRAVITY_BACKEND_CONTRACT.md](ANTIGRAVITY_BACKEND_CONTRACT.md) for the consolidated API handoff.

## Reproducible integration data

- Generator: `node scripts/generate-source-aligned-labs.mjs`
- Own integration scenarios: `tests/scenarios/source-course.json`
- Runtime integration runner: `node tests/source-course.smoke.mjs tests/scenarios/source-course.json`

The scenarios contain locally authored solution commands and ephemeral test-only password input for the private test environments. They are not original hidden solutions. Test execution should use distinct temporary test IDs and must not reset learner environments.

The runtime agent completed all47 tasks across10 private test environments, with all47 checks failing before the work and passing afterward. Real su/sudo password prompts, failed authentication while locked, successful authentication after unlocking, account deletion and file ownership were exercised. Host account-database metadata remained unchanged. The complete local proof artifact is `.artifacts/source-course-smoke-mvamixgn.json`; it validates the local implementation, not the original LabEx private graders.

