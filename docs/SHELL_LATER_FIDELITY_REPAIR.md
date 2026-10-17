# Shell for Beginners: lessons 8–18 reviewed on 2026-10-17

The public functional requirements have been reviewed for these eleven lessons.
This is not a claim that source lesson prose, screenshots, VM bytes or private
graders have been reproduced. English/Vietnamese explanations are independently
authored. Source links are recorded per lesson in
`server/data/reference/shell-reviewed-later.json`.

The repair replaces invented task requirements while preserving the section
positions, source titles, task kinds and source lesson IDs. All 41 task IDs use
`v4` so old passes from different requirements cannot satisfy the repaired tasks.

| Lesson | Functional correction |
| --- | --- |
| Basic String Operations | `string_operations.sh`, Hello World length 13, `expr index` for j at 10, zero-based brown substring, four replacement forms; examples accumulate in one file. |
| Conditional Statements | `if.sh` and John/Alice/Beatles branches; separate `numeric.sh` and `string_logic.sh` examples. |
| Weather Advisory | Provided `weather_advisor.sh` starter; stdin temperature; four source advice branches and exact boundary values. |
| Bash Loops | `bash_loops` directory; separate for/while/until/break_continue examples with source names and ranges. |
| Comparing Arrays | `array-comparison.sh`; the three source arrays; intermediate intersection 5 6 and final intersection 5. |
| Shell Functions | `functions.sh`; greet, calculate, square return/global examples, variable scope and ENGLISH_CALC plus/minus/times. |
| Calculator | Provided `calculator.sh`; four named functions; stdin numbers/operator; quoted operators; division-by-zero handling. |
| Special Variables | Separate `special_vars.sh`, `exit_status.sh`, `function_vars.sh`, `at_vs_star.sh`; preserve quoted arguments containing spaces. |
| Bash Trap | `trap_example.sh`, real SIGINT/SIGTERM handler and graceful function cleanup; no invented EXIT/temp-file exercise. |
| File System Operations | `test_file.txt`, `file_exists.sh`, `dir_exists.sh`, `file_readable.sh`; existence, directory and permission cases. |
| File System Explorer | Provided `file_explorer.sh` with `check_item`; report one path's existence/type/readability instead of counting directory entries. |

The three challenge starters are reconstructed from the published requirements;
their bytes are not claimed to be the original VM fixtures. They leave the task
logic incomplete and fail the grader before the learner implements it. Existing
learner environments are not automatically overwritten when a manifest changes.

Local checks execute Bash against private temporary copies, with a hard bound.
They do not alter learner scripts, rename learner files, or change their modes.
The loop check skips teaching delays only inside its temporary copy. The trap
check launches the script, sends an actual SIGTERM and requires a successful
cleanup exit. Calculator checks exercise every operator, unseen numbers and the
functions directly. Explorer checks file/directory/missing/unreadable paths.

Explicit run steps also require a completed interactive-terminal command; having
a correct file alone cannot complete these steps. The command journal is an
educational check and is not a tamper-resistant examination record.

`tests/shell-reviewed-later-checks.py` passed 41 state probes under the normal WSL
user (not root), including before/after checks and rejection of an unrelated
script on behavior tasks. The artifact is
`.artifacts/shell-reviewed-later-state-regression.json`. For one run-only step the
state is deliberately already correct from the preceding edit: its negative
condition is the separate terminal journal, exercised by the integration smoke.

Regenerate only these lessons:

```text
python scripts/shell_reviewed_later.py
```

Run the integration suite with real PTY journals and fresh test-only environments:

```text
node tests/source-course.smoke.mjs tests/scenarios/shell-reviewed-later.json --provider=docker
```

The original public pages describe editing through WebIDE. These repaired coding
examples can be performed using a local terminal editor; that does not provide a
WebIDE. No later-section grader claims that a directory proves WebIDE usage.
