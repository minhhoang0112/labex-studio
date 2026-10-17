# Commands course orders 11–22

Public official tutorial requirements reviewed on 2026-10-17. Implementation:
`scripts/commands_course_content.py`, 12 lessons and 49 practical tasks.
English and Vietnamese explanations are authored locally. Exact private
LabEx grader code and VM fixture bytes were not recovered.

| Order | Source ID | Requirements retained |
|---|---:|---|
| 11 | [210986](https://labex.io/tutorials/linux-linux-cat-command-file-concatenating-210986) | daily_report.txt, sales.txt, marketing.txt, concatenation order, combined_report.txt, -n, -E |
| 12 | [214299](https://labex.io/tutorials/linux-linux-more-command-file-scrolling-214299) | weather_data.txt, +100, -10, +/2023-07-15, pager navigation |
| 13 | [214301](https://labex.io/tutorials/linux-linux-less-command-file-paging-214301) | server_log.txt, repeated pager invocations, /ERROR, -N, +/ERROR:.Database |
| 14 | [387914](https://labex.io/tutorials/linux-viewing-log-and-configuration-files-in-linux-387914) | system_overview.txt final line → answer1.txt; ERROR in large_log.txt → answer2.txt; cat and more |
| 15 | [214302](https://labex.io/tutorials/linux-linux-head-command-file-beginning-display-214302) | access.log/error.log, 5/3/15 lines, cut pipe, /admin grep pipe |
| 16 | [214303](https://labex.io/tutorials/linux-linux-tail-command-file-end-display-214303) | system.log, -n 5, -n +50, -f, -n 3 -f, actual appended entries and Ctrl+C |
| 17 | [210988](https://labex.io/tutorials/linux-linux-nl-command-line-numbering-210988) | config.txt; five exact tee output filenames; all-lines, padded, settings-only and combined formatting |
| 18 | [387930](https://labex.io/tutorials/linux-rapid-threat-detection-387930) | last20 auth_log.txt → recent_logins.txt; first15 network_traffic.txt → recent_traffic.txt; preserve originals |
| 19 | [215210](https://labex.io/tutorials/linux-linux-which-command-command-locating-215210) | gcc, python, techbuild check script, -a, custom_bin prioritydemo, executable ~/hello and PATH |
| 20 | [215211](https://labex.io/tutorials/linux-linux-whereis-command-file-and-command-finding-215211) | ls, -b grep/nonexistent, -m ssh, -bm python3, -s bash |
| 21 | [219191](https://labex.io/tutorials/linux-linux-find-command-file-searching-219191) | evidence/clue.txt, txt/log OR, >1MiB, mtime -1, -exec cat |
| 22 | [388032](https://labex.io/tutorials/linux-discover-critical-system-resources-388032) | which python3, whereis gcc, regular *.conf files under /etc → config_files.txt |

Completion checks use actual filesystem comparisons and the completed shell
command journal. Pager commands run interactively; navigation/search keystrokes
inside more/less are not captured by the existing journal, so the local checker
does not claim to prove these individual keys. The smoke scenarios do send
actual pager input. A delayed background writer gives tail a real update when
only one terminal is open.

Public log examples are illustrative/dynamic; local logs are reconstructed
and labelled accordingly. Results for /etc searches, PATH, command locations,
and manual pages reflect installed packages in the actual container. No fake
executables or manual-page output should be supplied to satisfy a check.

At authoring time: Python AST/import/build succeeded; Bash syntax validation
passed all 17 state predicates. Full PTY smoke results are recorded separately
by the integrating agent; these syntax results are not execution proof.
