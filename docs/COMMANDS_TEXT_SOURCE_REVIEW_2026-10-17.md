Public-source review for Linux Commands Practice Online, orders 23–41.

Implementation: `scripts/commands_course_text.py`, 19 lessons, 87 practical tasks. All verified section positions match the previously observed source outlines. EN/VI explanations are independently authored, not a verbatim copy of LabEx prose. The private VM images and graders were not recovered. Input datasets are reconstructed, with source filenames and task requirements preserved. Illustrated source counts are not hard-coded as answers.

| Source ID | Public page / requirements checked |
|---|---|
| 219192 | [grep](https://labex.io/tutorials/linux-linux-grep-command-pattern-searching-219192): logs/server.log, error counts, case folding, multiple files, date regex, context, inverse matching |
| 388109 | [Needle](https://labex.io/tutorials/linux-needle-in-the-haystack-388109): four task output files; ERROR counts, POST, warning query, authentication; immutable original log inputs |
| 219200 | [wc](https://labex.io/tutorials/linux-linux-wc-command-text-counting-219200): requirements/source lines, document words, code characters, combined README counts |
| 219187 | [cut](https://labex.io/tutorials/linux-linux-cut-command-text-cutting-219187): customers/books CSV, fields 2 / 2,3 / 1–3, fixed-width columns 11–25, price filter |
| 219196 | [sort](https://labex.io/tutorials/linux-linux-sort-command-text-sorting-219196): names, numeric ages, descending grades, multiple keys, unique clubs |
| 219199 | [uniq](https://labex.io/tutorials/linux-linux-uniq-command-duplicate-filtering-219199): sorted/unique/count/repeat customer purchase files |
| 219198 | [tr](https://labex.io/tutorials/linux-linux-tr-command-character-translating-219198): uppercase, punctuation deletion, shifted alphabet, digit class, squeezing spaces |
| 219189 | [diff](https://labex.io/tutorials/linux-linux-diff-command-file-comparing-219189): text, Python scripts, unified format, whitespace, directory recursion |
| 219193 | [join](https://labex.io/tutorials/linux-linux-join-command-file-joining-219193): employees/salaries, output ordering, unmatched Alex, department key |
| 219201 | [xargs](https://labex.io/tutorials/linux-linux-xargs-command-command-building-219201): fruits, book touch, batches of two, three parallel workers, combined options |
| 388493 | [awk](https://labex.io/tutorials/linux-linux-awk-command-text-processing-388493): log fields, POST/errors, status aggregates, HTML total/error-rate/top-IP/resource report |
| 388125 | [Word Count and Sorting](https://labex.io/tutorials/linux-word-count-and-sorting-388125): access-log count, five IPs without counts, total document words, top ten numbers |
| 388132 | [Employees](https://labex.io/tutorials/linux-processing-employees-data-388132): join employees/departments, AWK formatting, sorted employee_departments.txt |
| 388500 | [top](https://labex.io/tutorials/linux-linux-top-command-real-time-system-monitoring-388500): live terminal, memory sorting, one-second refresh, user filtering, idle filtering |
| 388496 | [free](https://labex.io/tutorials/linux-linux-free-command-monitoring-system-memory-388496): normal/human/MiB units, five samples three seconds apart, totals |
| 219188 | [df](https://labex.io/tutorials/linux-linux-df-command-disk-space-reporting-219188): sizes/types/inodes, root/home, tmpfs exclusion, totals |
| 219190 | [du](https://labex.io/tutorials/linux-linux-du-command-file-space-estimating-219190): recursion, depth, size sorting, top five files, depth-two report |
| 388099 | [Disk Usage Detective](https://labex.io/tutorials/linux-disk-usage-detective-388099): disk_usage.txt, home_size.txt, largest_subdir.txt from actual container measurements |
| 219197 | [time](https://labex.io/tutorials/linux-linux-time-command-command-timing-219197): read test_file.txt, process_logs.sh, CPU/I/O/mixed command timing |

Local compatibility decisions:

- The source's different-field join example uses inputs that are not sorted by the new join key. The local instructions sort both inputs first, so GNU join succeeds reliably.
- `top -o %MEM` selects the same memory ordering as interactive `M`, while leaving a distinct, completed command that the local checker can verify. All top exercises run the real interactive program and finish with `q`.
- The log report uses portable AWK array iteration to select the top five entries; GNU-specific `asort` is unnecessary. The report still includes totals, error rate, IPs and requested resources.
- The timing script uses the available Bash interpreter instead of a hard-coded Zsh path. Timing output and resource numbers vary with the real runtime.
- `diff` status 1 is accepted as a valid comparison result. A reported difference is not treated as failure to execute.
- The disk report includes its own output file in the measured directory. Its checker validates actual execution, meaningful rows and descending order instead of comparing unstable byte totals against a second measurement.

Static validation: Python module compilation, 87 generated task command patterns matched by their actual scenario commands, and complete source verify-position coverage. Full runtime smoke evidence is maintained by the root agent; this document does not claim those runtime checks passed before they finish.
