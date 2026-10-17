"""Generate Junior course from user-provided source text and audited local checks.

Only the ten Junior lesson IDs, their setup manifests and own integration scenarios
are written. Backups are preserved on first run. Original private graders are unknown.
"""
import hashlib
import copy
import json
from pathlib import Path
import re
import shutil
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from junior_docker_variants import variants as docker_variants

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "server" / "data"
PLANS = json.loads(r'''[
  {
    "setup": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [],
      "groups": [],
      "provenance": {
        "fixture_fidelity": "reconstructed_fixture",
        "original_bytes_recovered": false,
        "note": "Names and requirements from user-provided official tutorial JSON; unspecified fixture content independently authored locally."
      }
    },
    "tasks": [
      {
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*whoami\\s*$"
            ],
            [
              "^\\s*uname\\s*$"
            ]
          ]
        },
        "commands": [
          "whoami",
          "uname"
        ],
        "required_capabilities": [
          "terminal"
        ]
      },
      {
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*uname\\s+-a\\s*$"
            ],
            [
              "^\\s*uptime\\s*$"
            ]
          ]
        },
        "commands": [
          "uname -a",
          "uptime"
        ],
        "required_capabilities": [
          "terminal"
        ]
      },
      {
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*id\\s*$"
            ]
          ]
        },
        "commands": [
          "id"
        ],
        "required_capabilities": [
          "terminal"
        ]
      },
      {
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*top\\s*$"
            ]
          ]
        },
        "commands": [
          {
            "command": "top",
            "input": [
              {
                "wait_for": "PID",
                "text": "q",
                "raw": true
              }
            ]
          }
        ],
        "required_capabilities": [
          "terminal"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -f /home/labex/project/system_report.txt && test \"$(sed -n '1p' /home/labex/project/system_report.txt)\" = \"$(whoami)\" && test \"$(sed -n '2p' /home/labex/project/system_report.txt)\" = \"$(uname -a)\" && sed -n '3p' /home/labex/project/system_report.txt | grep -Eq 'up .*(load average|load averages):.*[0-9]'"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*whoami\\s*>\\s*(?:~/project/|/home/labex/project/)?system_report\\.txt\\s*$"
                ],
                [
                  "^\\s*uname\\s+-a\\s*>>\\s*(?:~/project/|/home/labex/project/)?system_report\\.txt\\s*$"
                ],
                [
                  "^\\s*uptime\\s*>>\\s*(?:~/project/|/home/labex/project/)?system_report\\.txt\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "whoami > system_report.txt",
          "uname -a >> system_report.txt",
          "uptime >> system_report.txt"
        ],
        "required_capabilities": [
          "terminal",
          "files"
        ]
      }
    ]
  },
  {
    "setup": {
      "version": 1,
      "directories": [
        {
          "path": "/home/labex/project/phoenix_project",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/shared_docs",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/logs",
          "owner": "labex:labex"
        }
      ],
      "files": [
        {
          "path": "/home/labex/project/phoenix_project/main_app.py",
          "content": "print('Phoenix local practice')\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/phoenix_project/config.json",
          "content": "{\"environment\":\"practice\",\"port\":8000}\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/phoenix_project/README.md",
          "content": "# Phoenix practice project\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/shared_docs/api_spec.doc",
          "content": "Local API fixture: GET /health\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/shared_docs/team_guidelines.txt",
          "content": "Keep changes documented.\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/logs/app_2023-01-15.log",
          "content": "2023 application fixture\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/logs/db_2023-02-20.log",
          "content": "2023 database fixture\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/logs/app_2024-05-01.log",
          "content": "2024 application fixture to preserve\n",
          "owner": "labex:labex",
          "mode": "0644"
        }
      ],
      "accounts": [],
      "groups": [],
      "provenance": {
        "fixture_fidelity": "reconstructed_fixture",
        "original_bytes_recovered": false,
        "note": "Names and requirements from user-provided official tutorial JSON; unspecified fixture content independently authored locally."
      }
    },
    "tasks": [
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -d /home/labex/project/phoenix_project/src && test -d /home/labex/project/phoenix_project/config && test -d /home/labex/project/phoenix_project/docs"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*mkdir\\s+(?:-p\\s+)?src\\s+config\\s+docs\\s*$"
                ],
                [
                  "^\\s*cd\\s+(?:~/project/phoenix_project|/home/labex/project/phoenix_project|phoenix_project)/?\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "cd ~/project/phoenix_project",
          "mkdir src config docs"
        ],
        "required_capabilities": [
          "terminal",
          "files"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "cmp -s '/home/labex/project/phoenix_project/src/main_app.py' <(printf '%s' 'print('\\''Phoenix local practice'\\'')\n') && cmp -s '/home/labex/project/phoenix_project/config/config.json' <(printf '%s' '{\"environment\":\"practice\",\"port\":8000}\n') && cmp -s '/home/labex/project/phoenix_project/docs/README.md' <(printf '%s' '# Phoenix practice project\n') && test ! -e /home/labex/project/phoenix_project/main_app.py && test ! -e /home/labex/project/phoenix_project/config.json && test ! -e /home/labex/project/phoenix_project/README.md"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*mv\\s+main_app\\.py\\s+src/\\s*$"
                ],
                [
                  "^\\s*mv\\s+config\\.json\\s+config/\\s*$"
                ],
                [
                  "^\\s*mv\\s+README\\.md\\s+docs/\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "mv main_app.py src/",
          "mv config.json config/",
          "mv README.md docs/"
        ],
        "required_capabilities": [
          "terminal",
          "files"
        ]
      },
      {
        "verification": {
          "kind": "state",
          "command": "test -s /home/labex/project/phoenix_project/config/config.json && cmp -s /home/labex/project/phoenix_project/config/config.json /home/labex/project/phoenix_project/config/config.json.bak"
        },
        "commands": [
          "cp config/config.json config/config.json.bak"
        ],
        "required_capabilities": [
          "terminal",
          "files"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test ! -e /home/labex/project/shared_docs && cmp -s '/home/labex/project/phoenix_project/docs/shared_docs/api_spec.doc' <(printf '%s' 'Local API fixture: GET /health\n') && cmp -s '/home/labex/project/phoenix_project/docs/shared_docs/team_guidelines.txt' <(printf '%s' 'Keep changes documented.\n')"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*mv\\s+~/project/shared_docs\\s+~/project/phoenix_project/docs/\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "mv ~/project/shared_docs ~/project/phoenix_project/docs/"
        ],
        "required_capabilities": [
          "terminal",
          "files"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "gzip -t /home/labex/project/logs/old_logs.tar.gz && cmp -s <(tar -tzf /home/labex/project/logs/old_logs.tar.gz | LC_ALL=C sort) <(printf 'app_2023-01-15.log\\ndb_2023-02-20.log\\n') && cmp -s <(tar -xOzf /home/labex/project/logs/old_logs.tar.gz app_2023-01-15.log) <(printf '%s' '2023 application fixture\n') && cmp -s <(tar -xOzf /home/labex/project/logs/old_logs.tar.gz db_2023-02-20.log) <(printf '%s' '2023 database fixture\n') && test ! -e /home/labex/project/logs/app_2023-01-15.log && test ! -e /home/labex/project/logs/db_2023-02-20.log && cmp -s '/home/labex/project/logs/app_2024-05-01.log' <(printf '%s' '2024 application fixture to preserve\n')"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*tar\\s+[^\\n;]*old_logs\\.tar\\.gz[^\\n;]*2023[^\\n;]*$"
                ],
                [
                  "^\\s*rm\\s+[^\\n;]*2023[^\\n;]*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "cd ~/project/logs",
          "tar -czf old_logs.tar.gz *2023*.log",
          "rm -- *2023*.log"
        ],
        "required_capabilities": [
          "terminal",
          "files",
          "archives"
        ]
      }
    ]
  },
  {
    "setup": {
      "version": 1,
      "directories": [
        {
          "path": "/home/labex/project/logs",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/config/staging",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/config/production",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/server1_files",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/server2_files",
          "owner": "labex:labex"
        }
      ],
      "files": [
        {
          "path": "/home/labex/project/logs/app.log",
          "content": "[2023-10-26 10:00:01] INFO: Started local fixture.\n[2023-10-26 10:00:03] ERROR: Failed to process payment transaction #12345.\n[2023-10-26 10:00:05] ERROR: NullPointerException at com.innovatech.Billing.process(Billing.java:101).\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/config/nginx.conf",
          "content": "events {}\nworker_processes 4;\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/config/staging/app.conf",
          "content": "## Staging Configuration\ndatabase.url=jdbc:mysql://staging-db:3306/nexus\napi.key=staging_key_abc123\nfeature.flag.new_dashboard=true\ntimeout.ms=3000\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/config/production/app.conf",
          "content": "## Production Configuration\ndatabase.url=jdbc:mysql://prod-db:3306/nexus\napi.key=prod_key_xyz789\nfeature.flag.new_dashboard=false\ntimeout.ms=5000\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/server1_files/asset1.js",
          "content": "// shared asset\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/server2_files/asset1.js",
          "content": "// shared asset\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/server1_files/asset2.js",
          "content": "// source-only asset\n",
          "owner": "labex:labex",
          "mode": "0644"
        }
      ],
      "accounts": [],
      "groups": [],
      "provenance": {
        "fixture_fidelity": "reconstructed_fixture",
        "original_bytes_recovered": false,
        "note": "Names and requirements from user-provided official tutorial JSON; unspecified fixture content independently authored locally."
      }
    },
    "tasks": [
      {
        "verification": {
          "kind": "state",
          "command": "cmp -s '/home/labex/project/error_report.txt' <(printf '%s' '[2023-10-26 10:00:03] ERROR: Failed to process payment transaction #12345.\n[2023-10-26 10:00:05] ERROR: NullPointerException at com.innovatech.Billing.process(Billing.java:101).\n')"
        },
        "commands": [
          "grep 'ERROR' ~/project/logs/app.log > ~/project/error_report.txt"
        ],
        "required_capabilities": [
          "terminal",
          "files"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Bài yêu cầu dmesg thật. Môi trường hiện không cấp quyền đọc kernel log (CAP_SYSLOG), nên chưa hỗ trợ kiểm tra bước này."
        },
        "commands": [],
        "required_capabilities": [
          "kernel-log"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "cmp -s '/home/labex/project/error_report.txt' <(printf '%s' '[2023-10-26 10:00:03] ERROR: Failed to process payment transaction #12345.\n[2023-10-26 10:00:05] ERROR: NullPointerException at com.innovatech.Billing.process(Billing.java:101).\nworker_processes 4;\n')"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*grep\\s+[^\\n;]*worker_processes[^\\n;]*nginx\\.conf\\s*>>\\s*[^\\n;]*error_report\\.txt\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "grep 'worker_processes' ~/project/config/nginx.conf >> ~/project/error_report.txt"
        ],
        "required_capabilities": [
          "terminal",
          "files"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -s /home/labex/project/config_diff.txt && cmp -s /home/labex/project/config_diff.txt <(diff /home/labex/project/config/staging/app.conf /home/labex/project/config/production/app.conf)"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0,
                1
              ],
              "groups": [
                [
                  "^\\s*diff\\s+[^\\n;]*staging/app\\.conf\\s+[^\\n;]*production/app\\.conf\\s*>\\s*[^\\n;]*config_diff\\.txt\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          {
            "command": "diff ~/project/config/staging/app.conf ~/project/config/production/app.conf > ~/project/config_diff.txt",
            "allowed_status": [
              1
            ]
          }
        ],
        "required_capabilities": [
          "terminal",
          "files"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -s /home/labex/project/missing_files.txt && cmp -s /home/labex/project/missing_files.txt <(diff /home/labex/project/server1_files /home/labex/project/server2_files)"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0,
                1
              ],
              "groups": [
                [
                  "^\\s*diff\\s+(?:-r\\s+)?/home/labex/project/server1_files\\s+/home/labex/project/server2_files\\s*>\\s*/home/labex/project/missing_files\\.txt\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          {
            "command": "diff /home/labex/project/server1_files /home/labex/project/server2_files > /home/labex/project/missing_files.txt",
            "allowed_status": [
              1
            ]
          }
        ],
        "required_capabilities": [
          "terminal",
          "files"
        ]
      }
    ]
  },
  {
    "setup": {
      "version": 1,
      "directories": [
        {
          "path": "/home/labex/project/phoenix_project",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/phoenix_project/src",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/phoenix_project/docs",
          "owner": "labex:labex"
        }
      ],
      "files": [
        {
          "path": "/home/labex/project/phoenix_project/docs/README.txt",
          "content": "Source requirement fixture for recursive ownership.\n",
          "owner": "labex:labex",
          "mode": "0644"
        }
      ],
      "accounts": [
        {
          "name": "dev_lead",
          "uid": 1001,
          "group": "developers"
        }
      ],
      "groups": [
        {
          "name": "developers",
          "gid": 1001,
          "members": [
            "labex",
            "dev_lead"
          ]
        }
      ],
      "provenance": {
        "fixture_fidelity": "reconstructed_fixture",
        "original_bytes_recovered": false,
        "note": "Names and requirements from user-provided official tutorial JSON; unspecified fixture content independently authored locally."
      }
    },
    "tasks": [
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -f /home/labex/project/phoenix_project/project_keys.txt && test ! -s /home/labex/project/phoenix_project/project_keys.txt && test \"$(stat -c '%a' /home/labex/project/phoenix_project/project_keys.txt)\" = 600"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*(?:sudo\\s+)?chmod\\s+600\\s+(?:~/project/phoenix_project/|/home/labex/project/phoenix_project/)?project_keys\\.txt\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "touch ~/project/phoenix_project/project_keys.txt",
          "chmod 600 ~/project/phoenix_project/project_keys.txt"
        ],
        "required_capabilities": [
          "terminal",
          "files",
          "permissions"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -d /home/labex/project/phoenix_project && test -z \"$(sudo find /home/labex/project/phoenix_project \\( ! -user dev_lead -o ! -group developers \\) -print -quit)\""
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*sudo\\s+chown\\s+-R\\s+dev_lead:developers\\s+[^\\n;]*phoenix_project/?\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "sudo chown -R dev_lead:developers ~/project/phoenix_project"
        ],
        "required_capabilities": [
          "terminal",
          "files",
          "users",
          "sudo",
          "permissions"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test \"$(sudo stat -c '%a:%U:%G' /home/labex/project/phoenix_project)\" = 750:dev_lead:developers"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*sudo\\s+chmod\\s+750\\s+[^\\n;]*phoenix_project/?\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "sudo chmod 750 ~/project/phoenix_project"
        ],
        "required_capabilities": [
          "terminal",
          "sudo",
          "permissions"
        ]
      },
      {
        "verification": {
          "kind": "state",
          "command": "test \"$(sudo stat -c '%a:%G' /home/labex/project/phoenix_project/src)\" = 2770:developers && probe=$(mktemp /home/labex/project/phoenix_project/src/inheritance-XXXXXX) && group=$(sudo stat -c '%G' \"$probe\") && sudo rm -- \"$probe\" && test \"$group\" = developers"
        },
        "commands": [
          "sudo chmod 2770 ~/project/phoenix_project/src"
        ],
        "required_capabilities": [
          "terminal",
          "sudo",
          "permissions"
        ]
      }
    ]
  },
  {
    "setup": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [
        {
          "name": "j.doe",
          "uid": 1001,
          "password_status": "unlocked"
        }
      ],
      "groups": [
        {
          "name": "developers",
          "gid": 1002
        }
      ],
      "provenance": {
        "fixture_fidelity": "reconstructed_fixture",
        "original_bytes_recovered": false,
        "note": "Names and requirements from user-provided official tutorial JSON; unspecified fixture content independently authored locally."
      }
    },
    "tasks": [
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "getent passwd b.smith >/dev/null"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*sudo\\s+useradd\\s+b\\.smith\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "sudo useradd b.smith"
        ],
        "required_capabilities": [
          "terminal",
          "users",
          "sudo"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -d /home/b.smith && test \"$(stat -c '%U' /home/b.smith)\" = b.smith && test \"$(getent passwd b.smith | cut -d: -f6)\" = /home/b.smith"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*sudo\\s+useradd\\s+(?:(?:-m|--create-home)\\s+b\\.smith|b\\.smith\\s+(?:-m|--create-home))\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "sudo userdel b.smith",
          "sudo useradd -m b.smith"
        ],
        "required_capabilities": [
          "terminal",
          "users",
          "sudo",
          "files"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test \"$(sudo passwd -S b.smith | awk '{print $2}')\" = P"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*sudo\\s+passwd\\s+b\\.smith\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          {
            "command": "sudo passwd b.smith",
            "input": [
              "ephemeral-test-only",
              "ephemeral-test-only"
            ]
          }
        ],
        "required_capabilities": [
          "terminal",
          "users",
          "sudo"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "id -nG b.smith | tr ' ' '\\n' | grep -Fxq developers"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*sudo\\s+usermod\\s+-aG\\s+developers\\s+b\\.smith\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "sudo usermod -aG developers b.smith"
        ],
        "required_capabilities": [
          "terminal",
          "users",
          "sudo"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "getent passwd j.doe >/dev/null && test -d /home/j.doe && test \"$(sudo passwd -S j.doe | awk '{print $2}')\" = L"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*sudo\\s+passwd\\s+-l\\s+j\\.doe\\s*$",
                  "^\\s*sudo\\s+usermod\\s+-L\\s+j\\.doe\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "sudo passwd -l j.doe"
        ],
        "required_capabilities": [
          "terminal",
          "users",
          "sudo",
          "files"
        ]
      }
    ]
  },
  {
    "setup": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [],
      "groups": [],
      "provenance": {
        "fixture_fidelity": "reconstructed_fixture",
        "original_bytes_recovered": false,
        "note": "Names and requirements from user-provided official tutorial JSON; unspecified fixture content independently authored locally."
      }
    },
    "tasks": [
      {
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*ps\\s+aux\\s*$",
              "^\\s*ps\\s+-aux\\s*$"
            ]
          ]
        },
        "commands": [
          "ps aux"
        ],
        "required_capabilities": [
          "terminal"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Cần các process mẫu và vòng đời PID namespace dùng chung xuyên phiên terminal/bộ kiểm tra. Runtime hiện chưa có supervisor cho kịch bản này."
        },
        "commands": [],
        "required_capabilities": [
          "persistent-process-fixtures"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Cần các process mẫu và vòng đời PID namespace dùng chung xuyên phiên terminal/bộ kiểm tra. Runtime hiện chưa có supervisor cho kịch bản này."
        },
        "commands": [],
        "required_capabilities": [
          "persistent-process-fixtures"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Cần các process mẫu và vòng đời PID namespace dùng chung xuyên phiên terminal/bộ kiểm tra. Runtime hiện chưa có supervisor cho kịch bản này."
        },
        "commands": [],
        "required_capabilities": [
          "persistent-process-fixtures"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Cần các process mẫu và vòng đời PID namespace dùng chung xuyên phiên terminal/bộ kiểm tra. Runtime hiện chưa có supervisor cho kịch bản này."
        },
        "commands": [],
        "required_capabilities": [
          "persistent-process-fixtures"
        ]
      }
    ]
  },
  {
    "setup": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [],
      "groups": [],
      "provenance": {
        "fixture_fidelity": "reconstructed_fixture",
        "original_bytes_recovered": false,
        "note": "Names and requirements from user-provided official tutorial JSON; unspecified fixture content independently authored locally."
      }
    },
    "tasks": [
      {
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*ip\\s+addr\\s*$"
            ]
          ]
        },
        "commands": [
          "ip addr"
        ],
        "required_capabilities": [
          "terminal"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Bước yêu cầu ifconfig nhưng runtime hiện chưa có net-tools/ifconfig. Không dùng ip addr để tự động chấm thay yêu cầu này."
        },
        "commands": [],
        "required_capabilities": [
          "ifconfig-tool"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Bước yêu cầu ping -c 3 8.8.8.8. Network namespace hiện không có đường ra Internet hoặc quyền ICMP cần thiết."
        },
        "commands": [],
        "required_capabilities": [
          "internet-icmp"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Chưa có portal TCP8000 trong namespace dùng chung để quan sát và kiểm tra đúng kịch bản bằng ss."
        },
        "commands": [],
        "required_capabilities": [
          "portal-network-fixture"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Chưa hỗ trợ UFW thực trong network namespace riêng có NET_ADMIN và cấu hình firewall riêng."
        },
        "commands": [],
        "required_capabilities": [
          "private-firewall"
        ]
      }
    ]
  },
  {
    "setup": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [],
      "groups": [],
      "provenance": {
        "fixture_fidelity": "reconstructed_fixture",
        "original_bytes_recovered": false,
        "note": "Names and requirements from user-provided official tutorial JSON; unspecified fixture content independently authored locally."
      }
    },
    "tasks": [
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Bài cần apt/dpkg và /usr ghi được trong image riêng, repository/network cùng trạng thái package mẫu. Runtime hiện bind /usr chỉ đọc, nên chưa hỗ trợ thao tác package thật."
        },
        "commands": [],
        "required_capabilities": [
          "private-package-image"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Bài cần apt/dpkg và /usr ghi được trong image riêng, repository/network cùng trạng thái package mẫu. Runtime hiện bind /usr chỉ đọc, nên chưa hỗ trợ thao tác package thật."
        },
        "commands": [],
        "required_capabilities": [
          "private-package-image"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Bài cần apt/dpkg và /usr ghi được trong image riêng, repository/network cùng trạng thái package mẫu. Runtime hiện bind /usr chỉ đọc, nên chưa hỗ trợ thao tác package thật."
        },
        "commands": [],
        "required_capabilities": [
          "private-package-image"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Bài cần apt/dpkg và /usr ghi được trong image riêng, repository/network cùng trạng thái package mẫu. Runtime hiện bind /usr chỉ đọc, nên chưa hỗ trợ thao tác package thật."
        },
        "commands": [],
        "required_capabilities": [
          "private-package-image"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Bài cần apt/dpkg và /usr ghi được trong image riêng, repository/network cùng trạng thái package mẫu. Runtime hiện bind /usr chỉ đọc, nên chưa hỗ trợ thao tác package thật."
        },
        "commands": [],
        "required_capabilities": [
          "private-package-image"
        ]
      }
    ]
  },
  {
    "setup": {
      "version": 1,
      "directories": [
        {
          "path": "/home/labex/project/data",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/config",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/logs",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/project/backups",
          "owner": "labex:labex"
        }
      ],
      "files": [
        {
          "path": "/home/labex/project/data/transactions.csv",
          "content": "id,amount\nT1,100\nT2,250\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/config/app.conf",
          "content": "database=localhost\napi_key=practice-only\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/logs/app.log",
          "content": "INFO local backup fixture\n",
          "owner": "labex:labex",
          "mode": "0644"
        }
      ],
      "accounts": [],
      "groups": [],
      "provenance": {
        "fixture_fidelity": "reconstructed_fixture",
        "original_bytes_recovered": false,
        "note": "Names and requirements from user-provided official tutorial JSON; unspecified fixture content independently authored locally."
      }
    },
    "tasks": [
      {
        "verification": {
          "kind": "state",
          "command": "cmp -s '/home/labex/project/backup-list.txt' <(printf '%s' 'data\nconfig\nlogs\n')"
        },
        "commands": [
          "printf 'data\\nconfig\\nlogs\\n' > backup-list.txt"
        ],
        "required_capabilities": [
          "terminal",
          "files"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "gzip -t /home/labex/project/backups/system-backup.tar.gz && cmp -s <(tar -tzf /home/labex/project/backups/system-backup.tar.gz | LC_ALL=C sort) <(printf 'config/\\nconfig/app.conf\\ndata/\\ndata/transactions.csv\\nlogs/\\nlogs/app.log\\n') && cmp -s <(tar -xOzf /home/labex/project/backups/system-backup.tar.gz 'data/transactions.csv') <(printf '%s' 'id,amount\nT1,100\nT2,250\n') && cmp -s <(tar -xOzf /home/labex/project/backups/system-backup.tar.gz 'config/app.conf') <(printf '%s' 'database=localhost\napi_key=practice-only\n') && cmp -s <(tar -xOzf /home/labex/project/backups/system-backup.tar.gz 'logs/app.log') <(printf '%s' 'INFO local backup fixture\n')"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*tar\\s+[^\\n;]*system-backup\\.tar\\.gz\\s+[^\\n;]*-T\\s+(?:/home/labex/project/|~/project/)?backup-list\\.txt\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "tar -czf backups/system-backup.tar.gz -T backup-list.txt"
        ],
        "required_capabilities": [
          "terminal",
          "files",
          "archives"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -s /home/labex/project/backup-contents.txt && { cmp -s /home/labex/project/backup-contents.txt <(tar -tzf /home/labex/project/backups/system-backup.tar.gz) || cmp -s /home/labex/project/backup-contents.txt <(tar -tvzf /home/labex/project/backups/system-backup.tar.gz); }"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*tar\\s+-[a-zA-Z]*t[a-zA-Z]*\\s+[^\\n;]*system-backup\\.tar\\.gz\\s*>\\s*(?:/home/labex/project/|~/project/)?backup-contents\\.txt\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "tar -tzf backups/system-backup.tar.gz > backup-contents.txt"
        ],
        "required_capabilities": [
          "terminal",
          "files",
          "archives"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "cmp -s '/home/labex/project/config/app.conf' <(printf '%s' 'database=localhost\napi_key=practice-only\n')"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*rm\\s+config/app\\.conf\\s*$"
                ],
                [
                  "^\\s*tar\\s+-xzf\\s+backups/system-backup\\.tar\\.gz\\s+config/app\\.conf\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "rm config/app.conf",
          "tar -xzf backups/system-backup.tar.gz config/app.conf"
        ],
        "required_capabilities": [
          "terminal",
          "files",
          "archives"
        ]
      },
      {
        "verification": {
          "kind": "unsupported",
          "reason": "Chưa xác nhận private crontab và daemon tồn tại xuyên phiên để chạy backup mỗi phút. Không dùng một lệnh tar thay cho tác vụ cron."
        },
        "commands": [],
        "required_capabilities": [
          "private-cron"
        ]
      }
    ]
  },
  {
    "setup": {
      "version": 1,
      "directories": [
        {
          "path": "/home/labex/project/app_logs",
          "owner": "labex:labex"
        }
      ],
      "files": [
        {
          "path": "/home/labex/project/app_logs/access.log",
          "content": "access fixture\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/app_logs/debug.log",
          "content": "debug fixture\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/app_logs/error.log",
          "content": "error fixture\n",
          "owner": "labex:labex",
          "mode": "0644"
        },
        {
          "path": "/home/labex/project/app_logs/notes.txt",
          "content": "not a log\n",
          "owner": "labex:labex",
          "mode": "0644"
        }
      ],
      "accounts": [],
      "groups": [],
      "provenance": {
        "fixture_fidelity": "reconstructed_fixture",
        "original_bytes_recovered": false,
        "note": "Names and requirements from user-provided official tutorial JSON; unspecified fixture content independently authored locally."
      }
    },
    "tasks": [
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -f /home/labex/project/log_manager.sh && test -x /home/labex/project/log_manager.sh && test \"$(head -n1 /home/labex/project/log_manager.sh)\" = '#!/bin/bash' && bash -n /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*echo[[:space:]]' /home/labex/project/log_manager.sh && cmp -s <(timeout 5 bash /home/labex/project/log_manager.sh) <(printf 'Log Manager Initialized.\\n')"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*chmod\\s+\\+x\\s+(?:/home/labex/project/|~/project/)?log_manager\\.sh\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "cat > log_manager.sh <<'JUNIOR_SCRIPT'\n#!/bin/bash\necho \"Log Manager Initialized.\"\nJUNIOR_SCRIPT",
          "chmod +x log_manager.sh",
          "./log_manager.sh"
        ],
        "required_capabilities": [
          "terminal",
          "files",
          "shell",
          "permissions"
        ]
      },
      {
        "verification": {
          "kind": "state",
          "command": "test -f /home/labex/project/log_manager.sh && test -x /home/labex/project/log_manager.sh && test \"$(head -n1 /home/labex/project/log_manager.sh)\" = '#!/bin/bash' && bash -n /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*echo[[:space:]]' /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*LOG_DIR=[\"\\x27]?/home/labex/project/app_logs[\"\\x27]?[[:space:]]*$' /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*read[[:space:]]+(-r[[:space:]]+)?BACKUP_FILENAME[[:space:]]*$' /home/labex/project/log_manager.sh && probe_label=\"runtime-$RANDOM-$RANDOM\" && output=$(printf '%s\\n' \"$probe_label\" | timeout 5 bash /home/labex/project/log_manager.sh) && printf '%s\\n' \"$output\" | grep -Fxq 'Log Manager Initialized.' && printf '%s\\n' \"$output\" | grep -Fq 'Enter the backup filename:' && printf '%s\\n' \"$output\" | grep -Fxq \"Backing up logs to: $probe_label\""
        },
        "commands": [
          "cat > log_manager.sh <<'JUNIOR_SCRIPT'\n#!/bin/bash\necho \"Log Manager Initialized.\"\nLOG_DIR=/home/labex/project/app_logs\necho \"Enter the backup filename: \"\nread -r BACKUP_FILENAME\necho \"Backing up logs to: $BACKUP_FILENAME\"\nJUNIOR_SCRIPT",
          {
            "command": "./log_manager.sh",
            "input": [
              {
                "wait_for": "Enter the backup filename:",
                "text": "practice-label"
              }
            ]
          }
        ],
        "required_capabilities": [
          "terminal",
          "files",
          "shell"
        ]
      },
      {
        "verification": {
          "kind": "state",
          "command": "test -f /home/labex/project/log_manager.sh && test -x /home/labex/project/log_manager.sh && test \"$(head -n1 /home/labex/project/log_manager.sh)\" = '#!/bin/bash' && bash -n /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*echo[[:space:]]' /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*LOG_DIR=[\"\\x27]?/home/labex/project/app_logs[\"\\x27]?[[:space:]]*$' /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*read[[:space:]]+(-r[[:space:]]+)?BACKUP_FILENAME[[:space:]]*$' /home/labex/project/log_manager.sh && probe_label=\"runtime-$RANDOM-$RANDOM\" && output=$(printf '%s\\n' \"$probe_label\" | timeout 5 bash /home/labex/project/log_manager.sh) && printf '%s\\n' \"$output\" | grep -Fxq 'Log Manager Initialized.' && printf '%s\\n' \"$output\" | grep -Fq 'Enter the backup filename:' && printf '%s\\n' \"$output\" | grep -Fxq \"Backing up logs to: $probe_label\" && { work=$(mktemp -d /tmp/junior-script-XXXXXX) && mv /home/labex/project/app_logs \"$work/app_logs\" && trap 'if [ -d \"$work/app_logs\" ] && [ ! -e \"/home/labex/project/app_logs\" ]; then mv \"$work/app_logs\" \"/home/labex/project/app_logs\"; fi; rmdir \"$work\" 2>/dev/null' EXIT; output=$(timeout 5 bash /home/labex/project/log_manager.sh </dev/null 2>&1); status=$?; mv \"$work/app_logs\" /home/labex/project/app_logs; rmdir \"$work\"; trap - EXIT; test \"$status\" -eq 1 && printf '%s\\n' \"$output\" | grep -Fxq 'Error: Log directory not found.' && ! printf '%s\\n' \"$output\" | grep -Fq 'Enter the backup filename:'; }"
        },
        "commands": [
          "cat > log_manager.sh <<'JUNIOR_SCRIPT'\n#!/bin/bash\necho \"Log Manager Initialized.\"\nLOG_DIR=/home/labex/project/app_logs\nif [ -d \"$LOG_DIR\" ]; then\n  echo \"Enter the backup filename: \"\n  read -r BACKUP_FILENAME\n  echo \"Backing up logs to: $BACKUP_FILENAME\"\nelse\n  echo \"Error: Log directory not found.\"\n  exit 1\nfi\nJUNIOR_SCRIPT",
          {
            "command": "./log_manager.sh",
            "input": [
              {
                "wait_for": "Enter the backup filename:",
                "text": "practice-label"
              }
            ]
          }
        ],
        "required_capabilities": [
          "terminal",
          "files",
          "shell"
        ]
      },
      {
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -f /home/labex/project/log_manager.sh && test -x /home/labex/project/log_manager.sh && test \"$(head -n1 /home/labex/project/log_manager.sh)\" = '#!/bin/bash' && bash -n /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*echo[[:space:]]' /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*LOG_DIR=[\"\\x27]?/home/labex/project/app_logs[\"\\x27]?[[:space:]]*$' /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*read[[:space:]]+(-r[[:space:]]+)?BACKUP_FILENAME[[:space:]]*$' /home/labex/project/log_manager.sh && test -d /home/labex/project/backups && cmp -s /home/labex/project/app_logs/access.log /home/labex/project/backups/access.log && cmp -s /home/labex/project/app_logs/debug.log /home/labex/project/backups/debug.log && cmp -s /home/labex/project/app_logs/error.log /home/labex/project/backups/error.log && grep -Eq '^[[:space:]]*for[[:space:]]' /home/labex/project/log_manager.sh && grep -Eq '^[[:space:]]*cp[[:space:]]' /home/labex/project/log_manager.sh && probe=$(mktemp --suffix=.log /home/labex/project/app_logs/parity-check-XXXXXX) && printf 'dynamic probe\\n' > \"$probe\" && copied=/home/labex/project/backups/$(basename \"$probe\") && trap 'rm -f -- \"$probe\" \"$copied\"' EXIT && output=$(printf 'dynamic-label\\n' | timeout 5 bash /home/labex/project/log_manager.sh) && cmp -s \"$probe\" \"$copied\" && { printf '%s\\n' \"$output\" | grep -Fq \"Copied $probe\" || printf '%s\\n' \"$output\" | grep -Fq \"Copied $(basename \"$probe\")\"; }"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*mkdir\\s+-p\\s+~/project/backups\\s*$"
                ]
              ]
            }
          ]
        },
        "commands": [
          "mkdir -p ~/project/backups",
          "cat > log_manager.sh <<'JUNIOR_SCRIPT'\n#!/bin/bash\necho \"Log Manager Initialized.\"\nLOG_DIR=/home/labex/project/app_logs\nif [ -d \"$LOG_DIR\" ]; then\n  echo \"Enter the backup filename: \"\n  read -r BACKUP_FILENAME\n  echo \"Backing up logs to: $BACKUP_FILENAME\"\n  for log in \"$LOG_DIR\"/*.log; do\n    cp \"$log\" /home/labex/project/backups/\n    echo \"Copied $log\"\n  done\nelse\n  echo \"Error: Log directory not found.\"\n  exit 1\nfi\nJUNIOR_SCRIPT",
          {
            "command": "./log_manager.sh",
            "input": [
              {
                "wait_for": "Enter the backup filename:",
                "text": "practice-label"
              }
            ]
          }
        ],
        "required_capabilities": [
          "terminal",
          "files",
          "shell"
        ]
      }
    ]
  }
]''')

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def excerpt(text, heading):
    match = re.search(r"### " + heading + r"(.*?)(?=\n### |\Z)", text, re.S)
    return match.group(1).strip() if match else ""

def main():
    sources = sorted((DATA / "reference/junior-sysadmin").glob("*.json"), key=lambda p: int(p.name.split("-")[2]))
    if len(sources) != 10:
        raise ValueError("Expected exactly ten Junior raw references")
    backup = ROOT / ".artifacts/junior-before-audit"
    backup.mkdir(parents=True, exist_ok=True)
    scenarios = {"version": 1, "course_id": "become-a-junior-system-administrator", "expected_tasks": 48,
                 "provenance": "Own test solution commands; original hidden solutions not recovered.", "lessons": []}
    docker_rules, docker_setups = docker_variants(PLANS)
    docker_scenarios = {**copy.deepcopy(scenarios), "provider": "docker", "lessons": []}
    total = 0
    supported = 0
    for index, source_file in enumerate(sources):
        raw_bytes = source_file.read_bytes()
        raw = json.loads(raw_bytes)
        lesson_id = source_file.stem
        source_id = raw["tutorial"]["id"]
        plan = PLANS[index]
        target = DATA / "labs" / (lesson_id + ".json")
        saved = backup / target.name
        if target.exists() and not saved.exists():
            shutil.copyfile(target, saved)
        sections = []
        tasks = []
        scenario_steps = []
        docker_scenario_steps = []
        task_index = 0
        for source in raw["steps"]:
            graded = bool(source.get("need_verify"))
            position = source["position"]
            kind = "task" if graded else "introduction" if position == 0 else "summary"
            section = {"id": f"source-{source_id}-section-{position}-v2", "title": source["title"],
                       "position": position, "kind": kind, "layout": source.get("layout"),
                       "need_verify": graded, "has_solution": bool(source.get("has_solution")),
                       "content": source.get("text", "")}
            if graded:
                rule = plan["tasks"][task_index]
                task_index += 1
                section.update(task=excerpt(section["content"], "Tasks"), hint=excerpt(section["content"], "Hints") or "Read Tasks and Requirements; check the exact names and paths.",
                               verification=rule["verification"], required_capabilities=rule["required_capabilities"])
                tasks.append(section)
                scenario_step = {"id": section["id"], "commands": rule["commands"]}
                if rule["verification"]["kind"] == "unsupported":
                    scenario_step.update(unsupported=True, reason=rule["verification"]["reason"])
                else:
                    supported += 1
                scenario_steps.append(scenario_step)
                docker_step = copy.deepcopy(scenario_step)
                variant = docker_rules.get((index, task_index - 1))
                if variant:
                    section["verification_by_provider"] = {"docker": variant["verification"]}
                    section["required_capabilities_by_provider"] = {"docker": variant["required_capabilities"]}
                    docker_step = {"id": section["id"], "commands": variant["commands"]}
                    if variant.get("wait_for_pass_ms"):
                        docker_step["wait_for_pass_ms"] = variant["wait_for_pass_ms"]
                docker_scenario_steps.append(docker_step)
            sections.append(section)
        if task_index != len(plan["tasks"]):
            raise ValueError(f"Plan task count mismatch: {lesson_id}")
        source_url = "https://labex.io/tutorials/" + lesson_id
        lab = {"id": lesson_id, "course_id": "become-a-junior-system-administrator", "order": index + 1,
               "title": raw["tutorial"]["name"], "type": "challenge", "difficulty": raw["tutorial"].get("difficulty", "Beginner"),
               "estimated_time": str(raw["tutorial"].get("time", 25)) + " mins",
               "curriculum_version": 2, "overview": raw["steps"][0].get("text", "").split("\n\n")[1],
               "source_url": source_url, "source_lab_id": source_id,
               "source": {"provider": "LabEx", "url": source_url, "observed_at": "2026-10-16",
                          "reference_path": source_file.relative_to(ROOT).as_posix(), "reference_sha256": hashlib.sha256(raw_bytes).hexdigest(),
                          "fidelity": {"content": "user-provided-source-text-preserved", "section_outline": "user-provided-official-API-reference",
                                       "original_private_checks": "unknown", "fixtures": "requirement-derived-and-reconstructed",
                                       "live_outline": "matched-all-ten", "live_body": "intro-only-visible" if index >= 5 else "known-formatting-difference" if index == 2 else "format-normalized-match"},
                          "limitation": "Local independently authored checks and fixture content; incompatible runtime tasks explicitly unsupported."},
               "environment_setup": f"server/data/environment-setups/{lesson_id}.json", "sections": sections, "steps": tasks}
        write(target, lab)
        write(DATA / "environment-setups" / (lesson_id + ".json"), plan["setup"])
        if index in docker_setups:
            write(DATA / "environment-setups/docker" / (lesson_id + ".json"), docker_setups[index])
        scenarios["lessons"].append({"lab_id": lesson_id, "source_lab_id": source_id,
                                    "setup_manifest": lab["environment_setup"], "steps": scenario_steps})
        docker_scenarios["lessons"].append({"lab_id": lesson_id, "source_lab_id": source_id,
                                           "setup_manifest": lab["environment_setup"], "steps": docker_scenario_steps})
        total += len(tasks)
        print(f"{lesson_id}: {len(sections)} sections, {len(tasks)} tasks")
    write(ROOT / "tests/scenarios/junior-course.json", scenarios)
    write(ROOT / "tests/scenarios/junior-docker-course.json", docker_scenarios)
    print(f"Generated 10 lessons: {total} tasks, {supported} supported checks, {total-supported} explicitly unsupported. First backups preserved.")
    print(f"Docker variants: {len(docker_rules)} capability-gated checks; 47 task candidates, kernel log remains unsupported.")

if __name__ == "__main__":
    main()

