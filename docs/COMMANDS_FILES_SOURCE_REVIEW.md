Review date: 2026-10-17. Implementation: `scripts/commands_course_files.py`.

The first ten lessons have 45 task positions. Titles, positions and task counts
match the retained REA section outlines. Public requirements were checked against
these official pages:

| Source ID | Tasks | Public tutorial |
| --- | ---: | --- |
| 219205 | 8 | https://labex.io/tutorials/linux-linux-ls-command-content-listing-219205 |
| 209734 | 3 | https://labex.io/tutorials/linux-linux-pwd-command-directory-displaying-209734 |
| 387844 | 1 | https://labex.io/tutorials/linux-directory-navigation-387844 |
| 209733 | 7 | https://labex.io/tutorials/linux-linux-cd-command-directory-changing-209733 |
| 209739 | 7 | https://labex.io/tutorials/linux-linux-mkdir-command-directory-creating-209739 |
| 387859 | 1 | https://labex.io/tutorials/linux-setting-up-a-new-project-structure-387859 |
| 209744 | 7 | https://labex.io/tutorials/linux-linux-cp-command-file-copying-209744 |
| 209743 | 5 | https://labex.io/tutorials/linux-linux-mv-command-file-moving-and-renaming-209743 |
| 209741 | 5 | https://labex.io/tutorials/linux-linux-rm-command-file-removing-209741 |
| 387877 | 1 | https://labex.io/tutorials/linux-organizing-files-and-directories-387877 |

Definitions include independently written EN/VI explanations, exact required
paths/options, reconstructed starter manifests, local trusted verification and
interactive smoke instructions. Published file bodies are used only where
necessary to define expected behavior; unpublished starter bodies are explicitly
reconstructed. Timestamps, directory sizes and owners in source screenshots are
examples and are not hardcoded as environment facts.

Important details: pwd compares symlink_dir against real_dir; mkdir uses the
digital_garden tree and permissions 700/750; cp includes overwrite confirmation
and metadata preservation; mv interactive confirmation is **n**; rm confirmation
is **y**. The final challenge includes both copying draft_readme.md and deleting
temp/old_stuff after organizing src/config.

Observation checks require successful learner command history. Creation,
copying, moving and deletion checks also inspect actual resulting state.
Commands are scoped to each lesson environment. Private LabEx graders and exact
private VM bytes remain unknown. This is functional requirement alignment, not
an assertion that the original prose or graders were recovered verbatim.

Local definition validation: 10 lessons / 45 tasks, all required REA positions
covered, serializable definitions, every command-history pattern matches its
smoke instruction. Course runtime verification is performed by the parent
integration run after generation; this document alone does not claim PTY passes.
