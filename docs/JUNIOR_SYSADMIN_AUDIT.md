# Junior System Administrator audit

Audit date: 2026-10-16. Inputs: ten user-provided raw tutorial/steps JSON files under `server/data/reference/junior-sysadmin/`, ten current lesson JSON files, `scripts/generate_junior_labs.py`, and the current namespace runner. This is a review of local source facts; the original private graders and VM fixtures were not recovered.

The source-shaped section content was retained by the existing generator, but generated checks do not establish functional parity. There are **10 challenges, 68 sections and 48 graded tasks**. Source filenames and task positions identify each requirement. [Machine-readable requirements](../server/data/reference/junior-requirements.json) list all48 tasks, expected fixtures and suggested checks.

The coordinating agent later compared the live authenticated source API: all ten outlines match. The first five lessons expose all sections' text to the current account; the last five expose Introduction text only. Those last five task bodies remain user-provided references, not independently verified live bodies. Heading/fence normalization matches the first five except a Day3 diff example: the stored text uses `## Staging Configuration` / `## Production Configuration`, while the live example uses one heading marker. Raw supplied text is retained rather than silently rewritten. See [junior-live-comparison.json](../server/data/reference/junior-live-comparison.json).

## Critical findings

1. Day5 source accounts are **b.smith** and **j.doe**. The generator checks **alex**, **devuser** or any UID matching100x instead. Both onboarding and HOME steps reuse that unrelated check. Merely having a developers group passes the membership task.
2. Day9's first condition `'Creating a Full' in title or 'Backup' in title` matches **every task title**. All five tasks are currently checked by a generic tar-create matcher. Later list/restore/cron branches are unreachable.
3. No Junior-specific setup manifests exist at audit time. The files, directories, users, groups, logs, long-running processes and package state described by the source are absent.
4. Day7 and8 cannot be implemented by accepting broad commands in the current runtime: network namespace has no external route and no NET_ADMIN/NET_RAW; /usr is read-only and apt/dpkg configuration is not a private writable image.
5. Day3 boot inspection requires real dmesg. CAP_SYSLOG is not in the runtime bounding set. journalctl or a fabricated text file is not equivalent to the stated task.
6. The namespace is created per invocation, and its children are killed when the invocation ends. A verifier in a sibling PID namespace cannot inspect interactive-shell workers, and nohup cannot survive destruction of that namespace. Persistent process tasks need a supervisor and shared namespace lifecycle.
7. The generator contains fallback `groups: [["."]]`, accepting any successful completed command. No current48 task is known to reach that fallback; it remains unsafe for unmatched future titles.
8. Display-only command matchers are mostly unanchored and ignore target operands. State matchers frequently ignore required paths, content, mode and outcome. Script grading checks mere keywords, including comments.
9. The current `fixtures: standard_linux_cli` fidelity claim obscures scenario-specific fixture requirements and runtime limits.

## Per-day review

### Day1: Khảo sát danh tính, kernel, uptime, nhóm, top và báo cáo hệ thống.

- Section1: Hiện username bằng whoami và tên kernel bằng uname. Current gap: Matcher uname chưa giới hạn tên kernel; id -un được chấp nhận dù nguồn yêu cầu whoami. Suggested check: Trace hai lệnh cụ thể. Support: `supported`.
- Section2: Chạy uname -a và uptime. Current gap: Uptime matcher không neo cuối; chưa phân biệt đối số ngoài yêu cầu. Suggested check: Trace uname -a, uptime hoàn tất. Support: `supported`.
- Section3: Chạy id xem UID/GID và nhóm. Current gap: Check đúng lệnh cơ bản. Suggested check: Trace id chính xác, không hard-code UID ví dụ. Support: `supported`.
- Section4: Mở top tương tác, quan sát rồi thoát bằng q. Current gap: top batch cũng qua matcher hiện tại. Suggested check: Trace top tương tác và hoàn tất; PTY test gửi q. Support: `supported`.
- Section5: Tạo ~/project/system_report.txt gồm output whoami, uname -a, uptime bằng > và >>. Current gap: File chứa bất kỳ labex và Linux là đủ; không cần uptime hoặc output thật. Suggested check: Kiểm ba phần nội dung và trace redirection của đủ ba lệnh. Support: `supported`.

Fixtures: No scenario-specific files required.

### Day2: Tổ chức Phoenix, sao lưu config, chuyển shared_docs và nén/xóa chỉ log 2023.

- Section1: Trong phoenix_project, tạo src/config/docs bằng một lệnh. Current gap: Chỉ kiểm thư mục, bỏ điều kiện một lệnh. Suggested check: State ba thư mục + trace mkdir tạo đồng thời. Support: `needs_fixture`.
- Section2: Dùng mv chuyển main_app.py/config.json/README.md vào src/config/docs tương ứng. Current gap: Chỉ main_app.py HOẶC app.py tự bịa là đủ; thiếu hai file còn lại và yêu cầu move. Suggested check: Kiểm đủ ba file, nội dung giữ nguyên và nguồn biến mất; trace mv. Support: `needs_fixture`.
- Section3: Sao lưu config/config.json thành config/config.json.bak. Current gap: Cho phép config.bak sai vị trí/tên; không so nội dung. Suggested check: cmp bản sao với nguồn, đúng đường dẫn. Support: `needs_fixture`.
- Section4: Chuyển nguyên ~/project/shared_docs vào phoenix_project/docs. Current gap: Bất kỳ một file guidelines.md/api_spec.md bịa cũng qua. Suggested check: Kiểm cả cây, đủ file gốc, nguồn không còn. Support: `needs_fixture`.
- Section5: Tạo logs/old_logs.tar.gz chứa log tên có 2023, xóa log nguồn2023; giữ nguyên app_2024-05-01.log. Current gap: Bất kỳ .tar.gz ở project/logs cũng qua; không mở archive hay kiểm năm2024. Suggested check: gzip integrity, danh sách/nội dung archive, nguồn2023 mất và2024 không đổi. Support: `needs_fixture`.

Fixtures: ~/project/phoenix_project/{main_app.py,config.json,README.md}; ~/project/shared_docs/{api_spec.doc,team_guidelines.txt}; ~/project/logs/{app_2023-01-15.log,db_2023-02-20.log,app_2024-05-01.log}

### Day3: Lọc ERROR, dmesg fail/error, append nginx directive và lưu diff file/thư mục.

- Section1: Lọc mọi dòng ERROR trong logs/app.log thành error_report.txt. Current gap: Đọc bất kỳ tên có log bằng cat/less/tail/grep/head cũng qua, không cần artifact. Suggested check: So output chính xác với ERROR nguồn và baseline. Support: `needs_fixture`.
- Section2: Dùng dmesg tìm fail/error không phân biệt hoa/thường, lưu boot_issues.txt. Current gap: journalctl hoặc cat/var/log được chấp nhận dù nguồn bắt dmesg; không kiểm output. Suggested check: Hiện unsupported: namespace không có CAP_SYSLOG; không giả kernel log. Support: `unsupported`.
- Section3: Lấy dòng worker_processes từ config/nginx.conf và append vào error_report.txt. Current gap: Chỉ đọc bất kỳ conf/nginx/apache là qua; không kiểm append. Suggested check: So file gồm ERROR gốc rồi đúng directive; kiểm >> nếu nguồn yêu cầu phương thức. Support: `needs_fixture`.
- Section4: diff staging/app.conf với production/app.conf, lưu config_diff.txt. Current gap: diff bất kỳ cặp nào cũng qua; không cần file kết quả. Suggested check: So nội dung diff thật đúng operands; chấp nhận status1 cho khác biệt. Support: `needs_fixture`.
- Section5: diff server1_files/server2_files, lưu complete comparison trong missing_files.txt. Current gap: ls bất kỳ cũng qua, trái yêu cầu diff. Suggested check: So diff thật đúng thư mục; file chứa asset2.js chỉ ở server1. Support: `needs_fixture`.

Fixtures: ~/project/logs/app.log; ~/project/config/nginx.conf; ~/project/config/{staging,production}/app.conf; ~/project/server1_files/asset2.js; ~/project/server2_files

### Day4: File khóa600, owner dev_lead:developers đệ quy, project750, src setgid2770.

- Section1: Tạo phoenix_project/project_keys.txt rỗng, dùng chmod numeric đặt600. Current gap: Bất kỳ *.txt/key/conf đủ; không kiểm path, rỗng hay quyền. Suggested check: Exact file/empty/mode600 + numeric chmod trace. Support: `needs_fixture`.
- Section2: chown toàn bộ phoenix_project sang dev_lead:developers. Current gap: chown/chgrp bất kỳ là đủ. Suggested check: sudo find kiểm không có phần tử sai UID/GID + chown-R trace. Support: `needs_fixture`.
- Section3: Đặt riêng phoenix_project mode750, không recursive. Current gap: Bất kỳ chmod được chấp nhận. Suggested check: Exact directory mode750, owner/group, command không-R. Support: `needs_fixture`.
- Section4: Đặt src setgid và owner/group rwx, othersnone =>2770, file mới kế thừa developers. Current gap: Matcher chấp nhận cả2771..2775 sai quyền others; không kiểm target, owner/group hoặc kế thừa. Suggested check: Exact2770 + groupdevelopers; probe tạo file tạm bằng dev_lead rồi kiểm kế thừa. Support: `needs_fixture`.

Fixtures: ~/project/phoenix_project/{src,docs}; account dev_lead; group developers

### Day5: Tạo b.smith, HOME, mật khẩu, nhóm developers; khóa j.doe nhưng giữ account/HOME.

- Section1: useradd tạo đúng người dùng b.smith. Current gap: Checks alex/devuser/UID100x không liên quan b.smith. Suggested check: getent b.smith + exact useradd trace. Support: `needs_runtime_extension`.
- Section2: Tạo /home/b.smith bằng useradd -m/--create-home; có thể xóa/recreate account trước. Current gap: Dùng lại check account bất kỳ; không cần HOME hay-m. Suggested check: HOME tồn tại/đúng owner, trace useradd với-m hoặc longflag. Support: `needs_runtime_extension`.
- Section3: passwd đặt mật khẩu b.smith bằng hai prompt. Current gap: passwd bất kỳ người dùng cũng qua. Suggested check: passwd -S b.smith cóP + completed passwd b.smith. Support: `needs_runtime_extension`.
- Section4: Thêm b.smith vào developers, giữ nhóm cũ. Current gap: Chỉ cần dòng developers tồn tại là qua từ fixture. Suggested check: Membership của b.smith, primarygroup và trace append semantics. Support: `needs_runtime_extension`.
- Section5: Khóa j.doe, không xóa account hoặc HOME. Current gap: Lock bất kỳ tài khoản là đủ; fixturej.doe chưa có. Suggested check: getent j.doe, HOME giữ nguyên, trạng tháiL; fixture ban đầuP. Support: `needs_runtime_extension`.

Fixtures: account j.doe initially unlocked; /home/j.doe; group developers

### Day6: ps aux/top, pgrep critical_service, pkill resource_hog, nohup data_processor có2>&1&.

- Section1: Hiện mọi process, user-oriented có CPU/memory/fullcommand. Current gap: ps bất kỳ đối số cũng qua, kể cả chỉ ownprocess hoặc thiếucột. Suggested check: Trace ps aux hoặc format tương đương đã xác nhận. Support: `supported`.
- Section2: Mở monitor tương tác, nhận diện script dùngCPU cao nhất rồi thoát. Current gap: top/htop bất kỳ qua dù không có resource_hog fixture. Suggested check: Cần process fixtures trong namespace sống xuyên bước; chưa hỗ trợ. Support: `unsupported`.
- Section3: Dùng pgrep tìm PID critical_service.sh đang chạy. Current gap: pidof/psgrep hoặc pgrep khôngđích cũng qua. Suggested check: Cần pgrep đúng tên và process hiện hữu trong cùngPIDnamespace. Support: `unsupported`.
- Section4: Dùng pkill dừng resource_hog.sh. Current gap: kill/killall được chấp nhận dù nguồn bắtpkill; không target/check còn sống. Suggested check: Cần fixture ban đầu sống, pkill đúng process, criticalservice vẫn sống. Support: `unsupported`.
- Section5: Từ project, nohup data_processor.sh >processor.log 2>&1 & và process còn sống sau hangup. Current gap: jobs/bg/fg hay bất kỳ & cũng qua; không log/target/nohup. Suggested check: Cần namespace/supervisor tồn tại ngoài PTY, marker process và output2streams. Support: `unsupported`.

Fixtures: critical_service.sh running; resource_hog.sh running and consumingCPU; data_processor.sh

### Day7: ip addr, ifconfig, ping đúng3 gói8.8.8.8, ss listeningTCP8000 và UFW8000/22 enabled.

- Section1: Dùng ip addr hiện interfaces. Current gap: ifconfig/iplink vẫn qua dù khác yêu cầu. Suggested check: Trace ip addr chính xác; môi trường có thể chỉlo, không giảIP. Support: `supported`.
- Section2: Dùng ifconfig hiện cấu hình IP. Current gap: Lặp checkipaddr cho stepnày: chưa chạyifconfig đã cóthểqua. Suggested check: Trace ifconfig, kiểm tool available. Support: `supported`.
- Section3: ping gửi đúng3 ICMP tới8.8.8.8. Current gap: curl/nc/traceroute hoặc pingđíchkhác/countkhác đềuqua. Suggested check: Không có routeInternet, NET_RAW. Không đổi sanglocalhost vàclaimparity. Support: `unsupported`.
- Section4: ss kiểm listeningTCP port8000. Current gap: netstat/lsof hay ss bất kỳ qua. Suggested check: Cần ss listenTCP đúng8000 và portalfixture; processnamespace hiện chưaseed. Support: `unsupported`.
- Section5: sudo ufw allow8000, allow22 rồi enable. Current gap: iptables hoặc ufwstatus cũngqua; thiếu cả2rules/enabledstate. Suggested check: Cần netnamespace riêng cóNET_ADMIN và UFW config riêng; hiện không có. Support: `unsupported`.

Fixtures: network tools ip,ifconfig,ping,ss,ufw; reachable8.8.8.8; portal TCP8000; private firewall ruleset

### Day8: sudo apt update/installneofetch; queryversion; removefiglet; autoremove.

- Section1: sudo apt update configuredsources. Current gap: apt update cóthểzero khi khôngsources, regexkhôngsudo hoặcindexstate. Suggested check: Cần imagepackage manager riêng, repo/network vàindexproof. Support: `unsupported`.
- Section2: sudo apt install neofetch. Current gap: Install bất kỳ package cũng qua. Suggested check: Cần neofetch thựcinstalled dpkgstate/toolfiles riêng. Support: `unsupported`.
- Section3: Query installed neofetch details includingversion. Current gap: which bất kỳ binary cũngqua;khôngpackage/version. Suggested check: Cần query neofetch metadata +actualinstalledstate. Support: `unsupported`.
- Section4: sudo apt remove figlet. Current gap: purge/autoremove/removebấtkỳcùngmatcher;noconditioninitialfiglet. Suggested check: Cần figlet fixturetrướcexists vàsauabsent. Support: `unsupported`.
- Section5: sudo apt autoremove unneeded dependencies. Current gap: Checkcopyremove bấtkỳ, khôngautoremovespecific. Suggested check: Cần orphan dependencyfixture, actualautoremove outcome. Support: `unsupported`.

Fixtures: private writable usr/dpkg/apt database; configured package repositories and network; figlet initially installed; orphan automatic dependency

### Day9: Manifest data/config/logs, tar-Tgzip, listreport, restoreonlyapp.conf và crontab-e timestampmỗi phút.

- Section1: Tạo backup-list.txt gồm đúngdata/config/logs mỗi dòng. Current gap: Bị broadBackupbranch biến thànhchecktar-create, saihoàntoàn. Suggested check: cmp exactmanifest. Support: `needs_fixture`.
- Section2: Tạo backups/system-backup.tar.gz bằngtar-z và-Tbackup-list.txt. Current gap: Chỉ bất kỳtarcreate, khôngpath/manifest/nộidung. Suggested check: gzip+exactentries/content+trace-T đúngmanifest. Support: `needs_fixture`.
- Section3: tar listkhôngextract, lưu outputbackup-contents.txt. Current gap: BroadBackupbranch chấmcreate-thaylist; nhánhlistkhôngbao giờtới. Suggested check: Report khớptar-t/tvarchive, commandhistory listoption. Support: `needs_fixture`.
- Section4: Xóa config/app.conf rồi extractduynhất file đó vềgốc. Current gap: BroadBackupbranch chấmcreate-thayrestore. Suggested check: Trace rm vàtar-x chỉmộtentry +cmprestoredbytes; khôngchoautopassfilecósẵn. Support: `needs_fixture`.
- Section5: crontab-e schedule* * * * *, absoluteoutdir,timestamp, backdata/config/logs. Current gap: BroadBackupbranch bỏquacron, nhánhSchedulingkhôngtới. Suggested check: Đọcprivatecrontab, exactschedule/commandscope/timestamp; daemonneededđểclaimactualrun. Support: `needs_runtime_extension`.

Fixtures: ~/project/{data,config,logs,backups}; data/transactions.csv; config/app.conf; logs/app.log; private crontab spool and daemon

### Day10: log_manager.sh shebang/echo, LOG_DIR/readBACKUP_FILENAME, missingdirif-exit1, forlogcopy.

- Section1: log_manager.sh shebang#!/bin/bash, echo Log Manager Initialized., executable. Current gap: Bất kỳ*.sh executablequa; khôngtarget/output/shebang. Suggested check: Exactpath/shebang/x; executebehavioroutput. Support: `needs_fixture`.
- Section2: LOG_DIR=/home/labex/project/app_logs; prompt/readBACKUP_FILENAME rồi echo giátrị. Current gap: grep read|$1 trongbấtkỳscript/comment làđủ. Suggested check: Exactvariables +dynamicstdin token observedoutput, timeout. Support: `needs_fixture`.
- Section3: if -d LOG_DIR; missingdir echoexacterror vàexit1 ngaykhôngprompt. Current gap: Từif/elif/else trongcomment cũngqua. Suggested check: Runwithdirpresent; isolate temporarilymissingfixture; assertstatus1/error/noinputprompt, restorealways. Support: `needs_fixture`.
- Section4: mkdirbackups; for *.log trongLOG_DIR, cp từngfile, echoCopiedfilename. Current gap: grep for|while trongbấtkỳfile/commentqua; khôngcopy hoặcfilter. Suggested check: Actualfilescopiedbyteidentical +freshlogprobe prevents hardcodednames; structuralfor/cp plusbehavior. Support: `needs_fixture`.

Fixtures: ~/project/app_logs/{access.log,debug.log,error.log}; a non-log fixture to testfilter

## Runtime details and implementation boundaries

The current runner exposes a private account database and writable /home, /tmp, /var. /usr is a read-only bind mount. It starts a new network/PID namespace per invocation and removes SYS_ADMIN, SYSLOG, NET_ADMIN and NET_RAW from the bounding set. Actual tool availability must be probed; a command name in lesson prose does not prove its binary is installed.

The manifest loader initially accepts only simple account names, rejecting dots. Supporting the source j.doe fixture requires a narrowly validated dotted username extension. The source departing employee must start unlocked so locking is an actual state transition, while the HOME must remain present. Password fixtures must be generated locally and contain no personal credentials.

Day4 needs careful traversal and verification after ownership and750 changes: checks should use private-runtime sudo when labex cannot enter a dev_lead-owned directory. Mode2770 and actual group inheritance should be tested, not inferred from a chmod text match. Whether the current reduced capabilities support the required setgid behavior must be exercised in the isolated runtime.

Day1 uptime/kernel/memory observations describe the shared kernel and the selected namespace; they will not have the same numeric values as the source VM examples. Checks should enforce the requested observations and report structure, not those example numbers.

Day6's source scripts must be controlled fixture processes with bounded resource use and test-specific lifetimes. Do not run a CPU hog on the host or claim nohup durability from a single command journal entry.

Day7 must retain the exact internet destination8.8.8.8, ICMP count3, ports8000/22 and UFW semantics if implemented. A localhost simulator or iptables-only substitute must be labeled a different exercise, not a pass for the original requirement.

Day8 requires a separate writable package image/database and network/repository access. Installing packages into the host to satisfy a lesson is outside this implementation. Package names neofetch and figlet are specific source requirements; replacing them silently changes the exercise.

Day9 can verify archive generation, listing and single-file restoration with the current filesystem model after fixtures are supplied. Cron registration requires private spool and crontab support. Claiming automatic execution also requires an actual scheduler lifecycle across invocations, or an explicit unsupported status for execution.

Day10 should run behavior tests with dynamic stdin, both directory branches and changed log input. Tests must restore moved fixtures even on failure, avoid executing on the host, and preserve learner data. The input BACKUP_FILENAME is a display label in this challenge, not a request to implement a tar filename; inventing archive semantics would add a task.

## Recommended acceptance gates

- Back up the existing ten lesson JSON files before corrections and keep raw user-provided references unchanged.
- Map verification by source ID and position, not ambiguous title substrings.
- Missing capability returns an explicit unsupported result, never a generic successful command fallback.
- A fresh environment must fail each actionable check before the work, except when the source legitimately permits a previous operation to satisfy a later step; document that dependency.
- Run positive and meaningful negative cases using private temporary test IDs.
- Archive checks validate paths, entries, bytes and exclusions. Account checks validate the requested account. Permission checks validate mode and owner. Script checks validate behavior.
- Expose supported/unsupported task counts and capability reasons to the frontend so a user is not offered false completion.
- New independently reconstructed fixtures carry explicit provenance; source fixture bytes remain unknown unless evidenced in the supplied reference.

## Corrections prepared after the audit

The coordinating agent authorized corrections after reviewing the initial findings. The generator now maps checks by source ID and position, preserves all supplied section text, and writes explicit setup manifests. The first pre-audit lesson snapshots are retained under `.artifacts/junior-before-audit/`.

The corrected plan has 33 supported checks and 15 explicitly unsupported tasks; this is a capability plan, not a claim that integration testing has passed. Unsupported items cover real kernel logs, persistent process fixtures, missing ifconfig, network/firewall scenarios, a writable package image and cron execution. A runtime probe confirmed ip and ss are available, ifconfig is absent, and private crontab registration works; actual cron execution remains unsupported because no persistent scheduler is running. Runtime work may enable additional narrowly tested capabilities.

Targeted runtime work confirmed dotted account names and an initially unlocked j.doe fixture. The setgid probe initially exposed missing FSETID in the reduced capability set; the runtime agent added that filesystem capability inside the private environment and confirmed mode2770 plus inherited developers group. This does not enable network administration, kernel-log access or host filesystem writes.

New task IDs end in `-v2`, invalidating completion from the earlier incorrect checks. Locally authored positive scenarios live in `tests/scenarios/junior-course.json` and run against private temporary test environments. Source-specific fixture bytes are reconstructed unless the supplied examples establish their content. The findings above describe the pre-audit snapshot and remain useful evidence of what was corrected; the verified supported scope is recorded below.

## Completed local runtime validation

The full private-runtime integration run completed across all ten lessons: **33 supported tasks passed, all33 failed before the work, and15 incompatible tasks remained explicitly blocked**. Real account/password operations, dotted usernames, recursive ownership, setgid inheritance, archive contents/restoration and script behavior were exercised. Host account-database metadata remained unchanged. The proof artifact is `.artifacts/source-course-smoke-mvamooig.json` with `complete: true`.

This validates the supported local tasks. It does not certify all48 tasks as runnable, prove equivalence to private LabEx graders, or recover unknown VM fixture bytes. Cron registration was separately demonstrated, but the every-minute execution task remains blocked until an actual persistent scheduler is provided.

