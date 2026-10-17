// Independently authored implementation of publicly observed LabEx course facts.
// Does not download lesson prose, solutions or graders. Only this course is regenerated.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const definitions = [
  {
    "id": "linux-your-first-linux-lab",
    "source_lab_id": 270253,
    "title": "Your First Linux Lab",
    "type": "lab",
    "slug": "linux-your-first-linux-lab",
    "overview": "Làm quen terminal, lời chào, tài khoản và nhóm; phân biệt lệnh kiểm tra với thao tác tiếp tục đọc.",
    "tasks": [
      {
        "task": "Chạy echo để hiện đúng lời chào Hello LabEx.",
        "commands": [
          "echo \"Hello LabEx\""
        ],
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*echo\\s+(?:\"Hello LabEx\"|'Hello LabEx'|Hello\\s+LabEx)\\s*$"
            ]
          ]
        },
        "notes": "Bash phân biệt chữ hoa/thường; kết quả xuất hiện ngay trên terminal."
      },
      {
        "task": "Hiện tên tài khoản hiện tại bằng whoami.",
        "commands": [
          "whoami"
        ],
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*whoami\\s*$"
            ]
          ]
        },
        "notes": "Môi trường riêng chạy bằng tài khoản labex."
      },
      {
        "task": "Chạy id để đọc UID, GID và nhóm; có thể thử thêm id root.",
        "commands": [
          "id",
          "id root"
        ],
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
        "notes": "Các ID là dữ liệu của môi trường, không cần ghi ra file."
      },
      {
        "task": "Chạy id -un để lấy riêng tên người dùng.",
        "commands": [
          "id -un"
        ],
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*id\\s+-un\\s*$"
            ]
          ]
        },
        "notes": "id -un chỉ lấy tên ứng với UID hiện tại."
      },
      {
        "task": "Đọc cách học bằng thực hành rồi bấm Tiếp tục để xác nhận đã đọc.",
        "commands": [],
        "verification": {
          "kind": "acknowledgement", "scope": "informational"
        },
        "notes": "Sau khi đọc, dùng nút Tiếp tục để chuyển sang phần tổng kết."
      }
    ],
    "manifest": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [],
      "groups": []
    },
    "fixture_facts": []
  },
  {
    "id": "linux-display-user-and-group-information",
    "source_lab_id": 8718,
    "title": "Display User and Group Information",
    "type": "challenge",
    "slug": "linux-display-user-and-group-information",
    "overview": "Hai thử thách nhận diện tài khoản và nhóm; không yêu cầu tạo file đầu ra.",
    "tasks": [
      {
        "task": "Hiện riêng tên tài khoản đang chạy shell.",
        "commands": [
          "whoami"
        ],
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*whoami\\s*$",
              "^\\s*id\\s+-un\\s*$"
            ]
          ]
        },
        "notes": "Áp dụng lệnh nhận diện đã học."
      },
      {
        "task": "Hiện thông tin gồm UID, GID và các nhóm của tài khoản.",
        "commands": [
          "id"
        ],
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
        "notes": "Đọc trực tiếp kết quả trên terminal."
      }
    ],
    "manifest": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [],
      "groups": []
    },
    "fixture_facts": []
  },
  {
    "id": "linux-basic-files-operations",
    "source_lab_id": 270248,
    "title": "Basic Files Operations",
    "type": "lab",
    "slug": "linux-basic-files-operations",
    "overview": "Phân biệt HOME với project; điều hướng, tạo, sao chép, di chuyển và xóa dữ liệu mẫu.",
    "tasks": [
      {
        "task": "Kiểm tra vị trí hiện tại và HOME; liệt kê project và HOME.",
        "commands": [
          "pwd",
          "echo ~",
          "ls",
          "ls ~"
        ],
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*pwd\\s*$"
            ],
            [
              "^\\s*echo\\s+~\\s*$"
            ],
            [
              "^\\s*ls\\s*$"
            ],
            [
              "^\\s*ls\\s+~\\s*$"
            ]
          ]
        },
        "notes": "Shell bắt đầu tại /home/labex/project, còn ~ là /home/labex."
      },
      {
        "task": "Đi lên HOME, trở lại project, thử ~ rồi quay về project bằng đường dẫn tuyệt đối.",
        "commands": [
          "pwd",
          "ls",
          "cd ..",
          "pwd",
          "cd project",
          "cd ~",
          "pwd",
          "cd /home/labex/project"
        ],
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0
          ],
          "groups": [
            [
              "^\\s*cd\\s+\\.\\.\\s*$"
            ],
            [
              "^\\s*cd\\s+project\\s*$"
            ],
            [
              "^\\s*cd\\s+~\\s*$"
            ],
            [
              "^\\s*cd\\s+/home/labex/project\\s*$"
            ]
          ]
        },
        "notes": ".. chỉ thư mục cha; đường dẫn bắt đầu bằng / là tuyệt đối."
      },
      {
        "task": "Tạo file1.txt rỗng, file2.txt chứa Hello, Linux, .hiddenfile chứa Hidden file và thư mục testdir; thực hành các kiểu ls.",
        "commands": [
          "touch file1.txt",
          "echo \"Hello, Linux\" > file2.txt",
          "echo \"Hidden file\" > .hiddenfile",
          "mkdir testdir",
          "ls",
          "ls -l",
          "ls -a",
          "ls -la",
          "ls -l testdir"
        ],
        "verification": {
          "kind": "state",
          "command": "test -f \"$HOME/project/file1.txt\" && test ! -s \"$HOME/project/file1.txt\" && cmp -s \"$HOME/project/file2.txt\" <(printf 'Hello, Linux\\n') && cmp -s \"$HOME/project/.hiddenfile\" <(printf 'Hidden file\\n') && test -d \"$HOME/project/testdir\""
        },
        "notes": "Tên bắt đầu bằng dấu chấm bị ẩn trong ls thông thường."
      },
      {
        "task": "Copy file1 thành file1_copy.txt, copy file2 vào testdir rồi copy cả testdir thành testdir_copy.",
        "commands": [
          "cp file1.txt file1_copy.txt",
          "cp file2.txt testdir/",
          "cp -r testdir testdir_copy"
        ],
        "verification": {
          "kind": "state",
          "command": "test -f \"$HOME/project/file1.txt\" && cmp -s \"$HOME/project/file1.txt\" \"$HOME/project/file1_copy.txt\" && cmp -s \"$HOME/project/file2.txt\" \"$HOME/project/testdir/file2.txt\" && cmp -s \"$HOME/project/file2.txt\" \"$HOME/project/testdir_copy/file2.txt\""
        },
        "notes": "cp -r sao chép cả cây thư mục."
      },
      {
        "task": "Đổi file1.txt thành newname.txt, chuyển vào testdir, đổi testdir_copy thành new_testdir; chuyển newname trở lại project với tên original_file1.txt.",
        "commands": [
          "mv file1.txt newname.txt",
          "mv newname.txt testdir/",
          "mv testdir_copy new_testdir",
          "mv testdir/newname.txt ./original_file1.txt"
        ],
        "verification": {
          "kind": "state",
          "command": "test ! -e \"$HOME/project/file1.txt\" && test ! -e \"$HOME/project/newname.txt\" && test ! -e \"$HOME/project/testdir/newname.txt\" && test ! -e \"$HOME/project/testdir_copy\" && test -f \"$HOME/project/original_file1.txt\" && test -f \"$HOME/project/new_testdir/file2.txt\""
        },
        "notes": "mv dùng để đổi tên và chuyển vị trí."
      },
      {
        "task": "Xóa original_file1.txt, file2.txt, testdir và .hiddenfile. Thử rmdir với các thư mục còn file; tạo rồi xóa đệ quy temp_dir. Giữ file1_copy.txt và new_testdir/file2.txt.",
        "commands": [
          "rm original_file1.txt",
          {
            "command": "rm -i file2.txt",
            "input": [
              {
                "wait_for": "?",
                "text": "y"
              }
            ]
          },
          {
            "command": "rmdir new_testdir",
            "allowed_status": [
              1
            ]
          },
          {
            "command": "rmdir testdir",
            "allowed_status": [
              1
            ]
          },
          "rm -r testdir",
          "rm .hiddenfile",
          "mkdir temp_dir",
          "touch temp_dir/temp_file.txt",
          "ls -R temp_dir",
          "rm -rf temp_dir"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -f \"$HOME/project/file1_copy.txt\" && test -f \"$HOME/project/new_testdir/file2.txt\" && test ! -e \"$HOME/project/original_file1.txt\" && test ! -e \"$HOME/project/file2.txt\" && test ! -e \"$HOME/project/testdir\" && test ! -e \"$HOME/project/.hiddenfile\" && test ! -e \"$HOME/project/temp_dir\""
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*rm\\s+original_file1\\.txt\\s*$"
                ],
                [
                  "^\\s*rm\\s+-i\\s+file2\\.txt\\s*$",
                  "^\\s*rm\\s+file2\\.txt\\s*$"
                ],
                [
                  "^\\s*rm\\s+-r\\s+testdir\\s*$"
                ],
                [
                  "^\\s*rm\\s+\\.hiddenfile\\s*$"
                ],
                [
                  "^\\s*rm\\s+-rf\\s+temp_dir\\s*$"
                ],
                [
                  "^\\s*mkdir\\s+temp_dir\\s*$"
                ],
                [
                  "^\\s*touch\\s+temp_dir/temp_file\\.txt\\s*$"
                ]
              ]
            }
          ]
        },
        "notes": "Kiểm tra đường dẫn trước khi xóa; mọi tệp của bài nằm trong môi trường Linux riêng."
      }
    ],
    "manifest": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [],
      "groups": []
    },
    "fixture_facts": []
  },
  {
    "id": "linux-files-and-directories",
    "source_lab_id": 270246,
    "title": "Files and Directories",
    "type": "challenge",
    "slug": "linux-files-and-directories",
    "overview": "Copy, đổi tên rồi xóa các bản trên Desktop; giữ nguyên nguồn .zshrc và Code.",
    "tasks": [
      {
        "task": "Copy ~/.zshrc thành ~/Desktop/zshrc-copy và copy cả ~/Code vào ~/Desktop.",
        "commands": [
          "cp ~/.zshrc ~/Desktop/zshrc-copy",
          "cp -r ~/Code ~/Desktop/"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "cmp -s \"$HOME/.zshrc\" \"$HOME/Desktop/zshrc-copy\" && test -d \"$HOME/Desktop/Code\" && diff -r \"$HOME/Code\" \"$HOME/Desktop/Code\" >/dev/null"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*cp\\s+[^;\\n]*\\.zshrc\\s+[^;\\n]*zshrc-copy\\s*$"
                ],
                [
                  "^\\s*cp\\s+-[rR]\\s+[^;\\n]*Code\\s+[^;\\n]*Desktop/?\\s*$"
                ]
              ]
            }
          ]
        },
        "notes": "Bản nguồn được chuẩn bị sẵn. Dùng cp -r để sao chép thư mục kèm nội dung."
      },
      {
        "task": "Đổi tên bản sao thành zshrc-move và Code-move trong Desktop.",
        "commands": [
          "mv ~/Desktop/zshrc-copy ~/Desktop/zshrc-move",
          "mv ~/Desktop/Code ~/Desktop/Code-move"
        ],
        "verification": {
          "kind": "state",
          "command": "test ! -e \"$HOME/Desktop/zshrc-copy\" && test ! -e \"$HOME/Desktop/Code\" && cmp -s \"$HOME/.zshrc\" \"$HOME/Desktop/zshrc-move\" && diff -r \"$HOME/Code\" \"$HOME/Desktop/Code-move\" >/dev/null"
        },
        "notes": "Dùng mv trên các bản sao."
      },
      {
        "task": "Xóa ~/Desktop/zshrc-move và ~/Desktop/Code-move bằng rm.",
        "commands": [
          "rm ~/Desktop/zshrc-move",
          "rm -r ~/Desktop/Code-move"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test ! -e \"$HOME/Desktop/zshrc-move\" && test ! -e \"$HOME/Desktop/Code-move\" && test -f \"$HOME/.zshrc\" && test -d \"$HOME/Code\""
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*rm\\s+[^;\\n]*zshrc-move\\s*$"
                ],
                [
                  "^\\s*rm\\s+-[rR]\\s+[^;\\n]*Code-move\\s*$"
                ]
              ]
            }
          ]
        },
        "notes": "Nguồn .zshrc và Code cần giữ nguyên."
      }
    ],
    "manifest": {
      "version": 1,
      "directories": [
        {
          "path": "/home/labex/Desktop",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/Code",
          "owner": "labex:labex"
        }
      ],
      "files": [
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/.zshrc",
          "content": "# Local practice fixture; original LabEx bytes not recovered.\n",
          "fidelity": "reconstructed_fixture"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/Code/example.txt",
          "content": "Local source directory fixture.\n",
          "fidelity": "reconstructed_fixture"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/Desktop/code.desktop",
          "content": "[Desktop Entry]\nName=code\nType=Application\nExec=true\n",
          "fidelity": "reconstructed_fixture"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/Desktop/gedit.desktop",
          "content": "[Desktop Entry]\nName=gedit\nType=Application\nExec=true\n",
          "fidelity": "reconstructed_fixture"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/Desktop/gvim.desktop",
          "content": "[Desktop Entry]\nName=gvim\nType=Application\nExec=true\n",
          "fidelity": "reconstructed_fixture"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/Desktop/xfce4-terminal.desktop",
          "content": "[Desktop Entry]\nName=xfce4-terminal\nType=Application\nExec=true\n",
          "fidelity": "reconstructed_fixture"
        }
      ],
      "accounts": [],
      "groups": []
    },
    "fixture_facts": [
      {
        "path": "/home/labex/.zshrc",
        "baseline_content": null,
        "fixture_fidelity": "reconstructed_fixture",
        "local_content": "# Local practice fixture; original LabEx bytes not recovered.\n",
        "unknown": "Original fixture bytes not recovered; local practice data is independently authored."
      },
      {
        "path": "/home/labex/Code/example.txt",
        "baseline_content": null,
        "fixture_fidelity": "reconstructed_fixture",
        "local_content": "Local source directory fixture.\n",
        "unknown": "Original fixture bytes not recovered; local practice data is independently authored."
      },
      {
        "path": "/home/labex/Desktop/code.desktop",
        "baseline_content": null,
        "fixture_fidelity": "reconstructed_fixture",
        "local_content": "[Desktop Entry]\nName=code\nType=Application\nExec=true\n",
        "unknown": "Original fixture bytes not recovered; local practice data is independently authored."
      },
      {
        "path": "/home/labex/Desktop/gedit.desktop",
        "baseline_content": null,
        "fixture_fidelity": "reconstructed_fixture",
        "local_content": "[Desktop Entry]\nName=gedit\nType=Application\nExec=true\n",
        "unknown": "Original fixture bytes not recovered; local practice data is independently authored."
      },
      {
        "path": "/home/labex/Desktop/gvim.desktop",
        "baseline_content": null,
        "fixture_fidelity": "reconstructed_fixture",
        "local_content": "[Desktop Entry]\nName=gvim\nType=Application\nExec=true\n",
        "unknown": "Original fixture bytes not recovered; local practice data is independently authored."
      },
      {
        "path": "/home/labex/Desktop/xfce4-terminal.desktop",
        "baseline_content": null,
        "fixture_fidelity": "reconstructed_fixture",
        "local_content": "[Desktop Entry]\nName=xfce4-terminal\nType=Application\nExec=true\n",
        "unknown": "Original fixture bytes not recovered; local practice data is independently authored."
      }
    ]
  },
  {
    "id": "linux-file-contents-and-comparing",
    "source_lab_id": 270251,
    "title": "File Contents and Comparing",
    "type": "lab",
    "slug": "linux-file-contents-and-comparing",
    "overview": "Đọc file theo dòng/byte và so sánh file, thư mục; dùng dữ liệu có sẵn, không tự tạo thêm bài tập.",
    "tasks": [
      {
        "task": "In toàn bộ /tmp/hello.",
        "commands": [
          "cat /tmp/hello"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*cat\\s+/tmp/hello\\s*$"
                ]
              ]
            },
            {
              "kind": "state",
              "command": "cmp -s /tmp/hello <(printf 'Hi,\\nI am Labby!\\n')"
            }
          ]
        },
        "notes": "cat đọc file đã có."
      },
      {
        "task": "Hiện nội dung /tmp/hello kèm số dòng.",
        "commands": [
          "cat -n /tmp/hello"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*cat\\s+-n\\s+/tmp/hello\\s*$"
                ]
              ]
            },
            {
              "kind": "state",
              "command": "cmp -s /tmp/hello <(printf 'Hi,\\nI am Labby!\\n')"
            }
          ]
        },
        "notes": "-n đánh số từng dòng."
      },
      {
        "task": "In dòng đầu của /tmp/hello.",
        "commands": [
          "head -n1 /tmp/hello"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*head\\s+-n1\\s+/tmp/hello\\s*$",
                  "^\\s*head\\s+-n\\s+1\\s+/tmp/hello\\s*$"
                ]
              ]
            },
            {
              "kind": "state",
              "command": "cmp -s /tmp/hello <(printf 'Hi,\\nI am Labby!\\n')"
            }
          ]
        },
        "notes": "head -n chọn số dòng."
      },
      {
        "task": "In byte đầu của /tmp/hello.",
        "commands": [
          "head -c1 /tmp/hello"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*head\\s+-c1\\s+/tmp/hello\\s*$",
                  "^\\s*head\\s+-c\\s+1\\s+/tmp/hello\\s*$"
                ]
              ]
            },
            {
              "kind": "state",
              "command": "cmp -s /tmp/hello <(printf 'Hi,\\nI am Labby!\\n')"
            }
          ]
        },
        "notes": "-c đếm byte, không phải số dòng."
      },
      {
        "task": "In dòng cuối của /tmp/hello.",
        "commands": [
          "tail -n1 /tmp/hello"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*tail\\s+-n1\\s+/tmp/hello\\s*$",
                  "^\\s*tail\\s+-n\\s+1\\s+/tmp/hello\\s*$"
                ]
              ]
            },
            {
              "kind": "state",
              "command": "cmp -s /tmp/hello <(printf 'Hi,\\nI am Labby!\\n')"
            }
          ]
        },
        "notes": "tail đọc từ cuối file."
      },
      {
        "task": "Thử byte cuối rồi hai byte cuối của /tmp/hello.",
        "commands": [
          "tail -c1 /tmp/hello",
          "tail -c2 /tmp/hello"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*tail\\s+-c1\\s+/tmp/hello\\s*$",
                  "^\\s*tail\\s+-c\\s+1\\s+/tmp/hello\\s*$"
                ],
                [
                  "^\\s*tail\\s+-c2\\s+/tmp/hello\\s*$",
                  "^\\s*tail\\s+-c\\s+2\\s+/tmp/hello\\s*$"
                ]
              ]
            },
            {
              "kind": "state",
              "command": "cmp -s /tmp/hello <(printf 'Hi,\\nI am Labby!\\n')"
            }
          ]
        },
        "notes": "Byte cuối là xuống dòng nên thường không có ký tự nhìn thấy."
      },
      {
        "task": "So sánh file1 với file2 trong ~/project.",
        "commands": [
          "cd ~/project",
          "diff file1 file2"
        ],
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0,
            1
          ],
          "groups": [
            [
              "^\\s*diff\\s+file1\\s+file2\\s*$"
            ]
          ]
        },
        "notes": "diff trả mã 1 khi hai file khác nhau; đây là kết quả mong đợi, không phải lỗi chạy lệnh."
      },
      {
        "task": "So sánh đệ quy ~/Desktop và ~/Code.",
        "commands": [
          "diff -r ~/Desktop ~/Code"
        ],
        "verification": {
          "kind": "commands",
          "user": "labex",
          "allowed_status": [
            0,
            1
          ],
          "groups": [
            [
              "^\\s*diff\\s+-r\\s+~/Desktop\\s+~/Code\\s*$"
            ]
          ]
        },
        "notes": "diff -r so sánh cả các thư mục con; đọc tên các mục chỉ xuất hiện ở một bên."
      }
    ],
    "manifest": {
      "version": 1,
      "directories": [
        {
          "path": "/home/labex/Desktop",
          "owner": "labex:labex"
        },
        {
          "path": "/home/labex/Code",
          "owner": "labex:labex"
        }
      ],
      "files": [
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/tmp/hello",
          "content": "Hi,\nI am Labby!\n",
          "fidelity": "observed_content"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/project/file1",
          "content": "this is file1\n",
          "fidelity": "public_example_content"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/project/file2",
          "content": "this is file2\n",
          "fidelity": "public_example_content"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/Desktop/code.desktop",
          "content": "[Desktop Entry]\nName=code\nType=Application\nExec=true\n",
          "fidelity": "reconstructed_fixture"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/Desktop/gedit.desktop",
          "content": "[Desktop Entry]\nName=gedit\nType=Application\nExec=true\n",
          "fidelity": "reconstructed_fixture"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/Desktop/gvim.desktop",
          "content": "[Desktop Entry]\nName=gvim\nType=Application\nExec=true\n",
          "fidelity": "reconstructed_fixture"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/Desktop/xfce4-terminal.desktop",
          "content": "[Desktop Entry]\nName=xfce4-terminal\nType=Application\nExec=true\n",
          "fidelity": "reconstructed_fixture"
        }
      ],
      "accounts": [],
      "groups": []
    },
    "fixture_facts": [
      {
        "path": "/tmp/hello",
        "baseline_content": "Hi,\nI am Labby!\n",
        "fixture_fidelity": "observed_content"
      },
      {
        "path": "/home/labex/project/file1",
        "baseline_content": "this is file1\n",
        "fixture_fidelity": "public_example_content"
      },
      {
        "path": "/home/labex/project/file2",
        "baseline_content": "this is file2\n",
        "fixture_fidelity": "public_example_content"
      },
      {
        "path": "/home/labex/Desktop",
        "baseline_content": null,
        "fixture_fidelity": "reconstructed_fixture"
      },
      {
        "path": "/home/labex/Code",
        "baseline_content": null,
        "fixture_fidelity": "reconstructed_fixture"
      }
    ]
  },
  {
    "id": "linux-the-manuscript-mystery",
    "source_lab_id": 384742,
    "title": "The Manuscript Mystery",
    "type": "challenge",
    "slug": "linux-the-manuscript-mystery",
    "overview": "Khảo sát hai bản thảo bằng cat, head, tail rồi dùng diff tìm thay đổi; không sửa nội dung.",
    "tasks": [
      {
        "task": "Dùng cat xem manuscript_v1.txt; head xem hai dòng đầu manuscript_v2.txt; tail xem dòng cuối cả hai file trong /home/labex/project.",
        "commands": [
          "cat /home/labex/project/manuscript_v1.txt",
          "head -n2 /home/labex/project/manuscript_v2.txt",
          "tail -n1 /home/labex/project/manuscript_v1.txt",
          "tail -n1 /home/labex/project/manuscript_v2.txt"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*cat\\s+(?:/home/labex/project/|~/project/)?manuscript_v1\\.txt\\s*$"
                ],
                [
                  "^\\s*head\\s+-n\\s*2\\s+(?:/home/labex/project/|~/project/)?manuscript_v2\\.txt\\s*$"
                ],
                [
                  "^\\s*tail\\s+-n\\s*1\\s+(?:/home/labex/project/|~/project/)?manuscript_v1\\.txt(?:\\s+(?:/home/labex/project/|~/project/)?manuscript_v2\\.txt)?\\s*$"
                ],
                [
                  "^\\s*tail\\s+-n\\s*1\\s+(?:(?:/home/labex/project/|~/project/)?manuscript_v1\\.txt\\s+)?(?:/home/labex/project/|~/project/)?manuscript_v2\\.txt\\s*$"
                ]
              ]
            },
            {
              "kind": "state",
              "command": "cmp -s \"$HOME/project/manuscript_v1.txt\" <(printf 'The room fell silent.\\nA shadow moved across the room.\\nThe mystery continued.\\n') && cmp -s \"$HOME/project/manuscript_v2.txt\" <(printf 'The room fell silent.\\nA figure darted behind the curtains.\\nThe mystery continued.\\n')"
            }
          ]
        },
        "notes": "Không sửa các file có sẵn."
      },
      {
        "task": "Dùng diff so sánh hai bản thảo và đọc thay đổi ở dòng 2.",
        "commands": [
          "diff /home/labex/project/manuscript_v1.txt /home/labex/project/manuscript_v2.txt"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0,
                1
              ],
              "groups": [
                [
                  "^\\s*diff\\s+(?:/home/labex/project/|~/project/)?manuscript_v1\\.txt\\s+(?:/home/labex/project/|~/project/)?manuscript_v2\\.txt\\s*$"
                ]
              ]
            },
            {
              "kind": "state",
              "command": "cmp -s \"$HOME/project/manuscript_v1.txt\" <(printf 'The room fell silent.\\nA shadow moved across the room.\\nThe mystery continued.\\n') && cmp -s \"$HOME/project/manuscript_v2.txt\" <(printf 'The room fell silent.\\nA figure darted behind the curtains.\\nThe mystery continued.\\n')"
            }
          ]
        },
        "notes": "Không cần tạo diff_report.txt."
      }
    ],
    "manifest": {
      "version": 1,
      "directories": [],
      "files": [
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/project/manuscript_v1.txt",
          "content": "The room fell silent.\nA shadow moved across the room.\nThe mystery continued.\n",
          "fidelity": "reconstructed_fixture"
        },
        {
          "owner": "labex:labex",
          "mode": "0644",
          "path": "/home/labex/project/manuscript_v2.txt",
          "content": "The room fell silent.\nA figure darted behind the curtains.\nThe mystery continued.\n",
          "fidelity": "reconstructed_fixture"
        }
      ],
      "accounts": [],
      "groups": []
    },
    "fixture_facts": [
      {
        "path": "/home/labex/project/manuscript_v1.txt",
        "baseline_content": null,
        "local_content": "The room fell silent.\nA shadow moved across the room.\nThe mystery continued.\n",
        "known_lines": {
          "2": "A shadow moved across the room."
        },
        "fixture_fidelity": "reconstructed_fixture",
        "unknown": "Source file full bytes unavailable; lines 1 and 3 authored locally."
      },
      {
        "path": "/home/labex/project/manuscript_v2.txt",
        "baseline_content": null,
        "local_content": "The room fell silent.\nA figure darted behind the curtains.\nThe mystery continued.\n",
        "known_lines": {
          "2": "A figure darted behind the curtains."
        },
        "fixture_fidelity": "reconstructed_fixture",
        "unknown": "Source file full bytes unavailable; lines 1 and 3 authored locally."
      }
    ]
  },
  {
    "id": "linux-permissions-of-files",
    "source_lab_id": 270252,
    "title": "Permissions of Files",
    "type": "lab",
    "slug": "linux-permissions-of-files",
    "overview": "Tạo file, đổi chủ file/cây thư mục và đặt quyền bằng số, ký hiệu trong Linux riêng.",
    "tasks": [
      {
        "task": "Vào ~/project và tạo example.txt rỗng.",
        "commands": [
          "cd ~/project",
          "touch example.txt",
          "ls"
        ],
        "verification": {
          "kind": "state",
          "command": "test -f \"$HOME/project/example.txt\" && test ! -s \"$HOME/project/example.txt\""
        },
        "notes": "touch tạo file mới hoặc cập nhật timestamp."
      },
      {
        "task": "Xem chi tiết rồi đổi chủ và nhóm example.txt thành root:root.",
        "commands": [
          "ls -l example.txt",
          "sudo chown root:root example.txt",
          "ls -l example.txt"
        ],
        "verification": {
          "kind": "state",
          "command": "test \"$(stat -c '%u:%g' \"$HOME/project/example.txt\")\" = 0:0"
        },
        "notes": "sudo ở đây chỉ tác động môi trường bài riêng."
      },
      {
        "task": "Tạo new-dir/subdir với file1.txt, file2.txt như mẫu, rồi đổi toàn bộ cây sang root:root.",
        "commands": [
          "mkdir -p new-dir/subdir",
          "echo \"Hello, world\" > new-dir/file1.txt",
          "echo \"Another file\" > new-dir/subdir/file2.txt",
          "sudo chown -R root:root new-dir",
          "ls -lR new-dir"
        ],
        "verification": {
          "kind": "state",
          "command": "test -d \"$HOME/project/new-dir/subdir\" && test -f \"$HOME/project/new-dir/file1.txt\" && test -f \"$HOME/project/new-dir/subdir/file2.txt\" && test -z \"$(find \"$HOME/project/new-dir\" \\( ! -uid 0 -o ! -gid 0 \\) -print -quit)\" && cmp -s \"$HOME/project/new-dir/file1.txt\" <(printf 'Hello, world\\n') && cmp -s \"$HOME/project/new-dir/subdir/file2.txt\" <(printf 'Another file\\n')"
        },
        "notes": "chown -R đổi cả các phần tử bên trong."
      },
      {
        "task": "Đặt example.txt thành mode 700.",
        "commands": [
          "sudo chmod 700 example.txt",
          "ls -l example.txt"
        ],
        "verification": {
          "kind": "state",
          "command": "test \"$(stat -c '%a' \"$HOME/project/example.txt\")\" = 700 && test \"$(stat -c '%u:%g' \"$HOME/project/example.txt\")\" = 0:0"
        },
        "notes": "7=rwx; 0 không cấp quyền."
      },
      {
        "task": "Tạo ~/test-dir, thử 700 rồi đổi thành 755.",
        "commands": [
          "mkdir ~/test-dir",
          "chmod 700 ~/test-dir",
          "ls -ld ~/test-dir",
          "chmod -R 755 ~/test-dir",
          "ls -ld ~/test-dir"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -d \"$HOME/test-dir\" && test \"$(stat -c '%a' \"$HOME/test-dir\")\" = 755"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*chmod\\s+700\\s+~/test-dir\\s*$"
                ],
                [
                  "^\\s*chmod\\s+-R\\s+755\\s+~/test-dir\\s*$",
                  "^\\s*chmod\\s+755\\s+~/test-dir\\s*$"
                ]
              ]
            }
          ]
        },
        "notes": "x trên thư mục cho phép đi qua/tham chiếu nội dung."
      },
      {
        "task": "Tạo script.sh in Hello, World; thêm quyền chạy cho chủ bằng chmod u+x rồi chạy script.",
        "commands": [
          "cd ~/project",
          "printf '#!/bin/bash\\necho \"Hello, World\"\\n' > script.sh",
          "chmod u+x script.sh",
          "./script.sh"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "test -f \"$HOME/project/script.sh\" && test -x \"$HOME/project/script.sh\" && test \"$(stat -c '%u' \"$HOME/project/script.sh\")\" = \"$(id -u)\" && cmp -s <(bash \"$HOME/project/script.sh\") <(printf 'Hello, World\\n')"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*chmod\\s+u\\+x\\s+script\\.sh\\s*$"
                ],
                [
                  "^\\s*\\./script\\.sh\\s*$"
                ]
              ]
            }
          ]
        },
        "notes": "Một file văn bản cần quyền x để gọi trực tiếp bằng ./script.sh."
      }
    ],
    "manifest": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [],
      "groups": []
    },
    "fixture_facts": []
  },
  {
    "id": "shell-change-file-ownership",
    "source_lab_id": 270254,
    "title": "Change File Ownership",
    "type": "challenge",
    "slug": "shell-change-file-ownership",
    "overview": "Tạo target_file, giao owner/group theo yêu cầu rồi đặt quyền 760.",
    "tasks": [
      {
        "task": "Dùng touch tạo ~/project/target_file.",
        "commands": [
          "touch ~/project/target_file"
        ],
        "verification": {
          "kind": "state",
          "command": "test -f \"$HOME/project/target_file\""
        },
        "notes": "Đích nằm trong project."
      },
      {
        "task": "Đổi owner target_file thành user1 và group thành group1.",
        "commands": [
          "sudo chown user1:group1 ~/project/target_file"
        ],
        "verification": {
          "kind": "state",
          "command": "test \"$(stat -c '%U:%G' \"$HOME/project/target_file\")\" = user1:group1"
        },
        "notes": "user1 và group1 được chuẩn bị trong môi trường riêng."
      },
      {
        "task": "Đặt target_file thành -rwxrw----, tức 760.",
        "commands": [
          "sudo chmod 760 ~/project/target_file"
        ],
        "verification": {
          "kind": "state",
          "command": "test \"$(stat -c '%a' \"$HOME/project/target_file\")\" = 760 && test \"$(stat -c '%U:%G' \"$HOME/project/target_file\")\" = user1:group1"
        },
        "notes": "File đã thuộc user1 nên cần sudo để đổi quyền."
      }
    ],
    "manifest": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [
        {
          "name": "user1",
          "uid": 1001,
          "group": "group1"
        }
      ],
      "groups": [
        {
          "name": "group1",
          "gid": 1001
        }
      ]
    },
    "fixture_facts": [
      {
        "account": "user1",
        "group": "group1",
        "fixture_fidelity": "requirement_derived",
        "unknown": "Original numerical UID/GID not recovered; local values are explicitly selected."
      }
    ]
  },
  {
    "id": "linux-user-account-management",
    "source_lab_id": 49,
    "title": "User Account Management",
    "type": "lab",
    "slug": "linux-user-account-management",
    "overview": "Tạo, đổi thông tin, đặt mật khẩu, thêm nhóm, khóa/mở và xóa tài khoản; chỉ chạy trong môi trường bài riêng.",
    "tasks": [
      {
        "task": "Tạo người dùng joker và tra bản ghi passwd.",
        "commands": [
          "sudo useradd joker",
          "getent passwd joker"
        ],
        "verification": {
          "kind": "state",
          "command": "getent passwd joker >/dev/null"
        },
        "notes": "useradd tạo bản ghi tài khoản; -m ở bước sau tạo HOME rõ ràng."
      },
      {
        "task": "Tạo bob kèm HOME bằng useradd -m.",
        "commands": [
          "sudo useradd -m bob",
          "ls -ld /home/bob"
        ],
        "verification": {
          "kind": "state",
          "command": "getent passwd bob >/dev/null && test -d /home/bob && test \"$(stat -c '%U' /home/bob)\" = bob"
        },
        "notes": "Không dùng tài khoản có sẵn của máy host."
      },
      {
        "task": "Đặt mật khẩu thực hành cho joker bằng passwd; nhập hai lần khi được hỏi.",
        "commands": [
          {
            "command": "sudo passwd joker",
            "input": [
              "ephemeral-test-only",
              "ephemeral-test-only"
            ]
          }
        ],
        "verification": {
          "kind": "state",
          "command": "test \"$(sudo passwd -S joker | awk '{print $2}')\" = P"
        },
        "notes": "Terminal không hiện ký tự mật khẩu. Nhập cùng một mật khẩu thực hành hai lần; không dùng mật khẩu cá nhân."
      },
      {
        "task": "Đổi trường HOME của joker thành /home/wayne.",
        "commands": [
          "sudo usermod -d /home/wayne joker",
          "getent passwd joker"
        ],
        "verification": {
          "kind": "state",
          "command": "test \"$(getent passwd joker | cut -d: -f6)\" = /home/wayne"
        },
        "notes": "-d đổi đường dẫn đăng ký; không có -m thì không tự chuyển dữ liệu."
      },
      {
        "task": "Đổi shell đăng nhập của joker thành /bin/bash.",
        "commands": [
          "sudo usermod -s /bin/bash joker",
          "getent passwd joker"
        ],
        "verification": {
          "kind": "state",
          "command": "test \"$(getent passwd joker | cut -d: -f7)\" = /bin/bash"
        },
        "notes": "Xem trường cuối bản ghi passwd."
      },
      {
        "task": "Thêm joker vào nhóm sudo, xem groups rồi đăng nhập bằng su để thử một lệnh cần quyền quản trị.",
        "commands": [
          "sudo usermod -aG sudo joker",
          "groups joker",
          {
            "command": "su - joker -c 'sudo -S cat /etc/shadow'",
            "input": [
              {
                "wait_for": "Password:",
                "text": "ephemeral-test-only"
              },
              {
                "wait_for": "password for joker:",
                "text": "ephemeral-test-only"
              }
            ]
          }
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "id -nG joker | tr ' ' '\\n' | grep -Fxq sudo"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*su\\s+-\\s+joker\\s+-c\\s+['\"]sudo\\s+(?:-S\\s+)?cat\\s+/etc/shadow['\"]\\s*$",
                  "^\\s*su\\s+-\\s+joker\\s*$"
                ]
              ]
            }
          ]
        },
        "notes": "Nhập mật khẩu joker khi su hỏi, rồi nhập lại nếu sudo hỏi. -c chạy lệnh rồi quay lại shell ban đầu; sudo -S đọc mật khẩu qua đầu vào của phiên này."
      },
      {
        "task": "Khóa rồi mở mật khẩu joker bằng passwd -l/-u; thử đăng nhập ở từng trạng thái.",
        "commands": [
          "sudo passwd -l joker",
          "sudo passwd -S joker",
          {
            "command": "su - joker -c 'whoami'",
            "input": [
              "ephemeral-test-only"
            ],
            "allowed_status": [
              1
            ]
          },
          "sudo passwd -u joker",
          "sudo passwd -S joker",
          {
            "command": "su - joker -c 'whoami'",
            "input": [
              "ephemeral-test-only"
            ]
          }
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*sudo\\s+passwd\\s+-l\\s+joker\\s*$"
                ],
                [
                  "^\\s*sudo\\s+passwd\\s+-u\\s+joker\\s*$"
                ]
              ]
            },
            {
              "kind": "state",
              "command": "test \"$(sudo passwd -S joker | awk '{print $2}')\" = P"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                1
              ],
              "groups": [
                [
                  "^\\s*su\\s+-\\s+joker(?:\\s+-c\\s+['\"]whoami['\"])?\\s*$"
                ]
              ]
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*su\\s+-\\s+joker(?:\\s+-c\\s+['\"]whoami['\"])?\\s*$"
                ]
              ]
            }
          ]
        },
        "notes": "Khi bị khóa, đăng nhập bằng mật khẩu thất bại. Sau thử su, thoát về labex trước khi tiếp tục."
      },
      {
        "task": "Xóa bob cùng HOME bằng userdel -r.",
        "commands": [
          "sudo userdel -r bob"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "! getent passwd bob >/dev/null && test ! -e /home/bob"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*sudo\\s+userdel\\s+-r\\s+bob\\s*$"
                ]
              ]
            }
          ]
        },
        "notes": "Xóa tài khoản và HOME là hai tác động cần phân biệt."
      }
    ],
    "manifest": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [],
      "groups": []
    },
    "fixture_facts": []
  },
  {
    "id": "linux-the-jokers-trick",
    "source_lab_id": 270247,
    "title": "The Joker's Trick",
    "type": "challenge",
    "slug": "linux-the-joker-s-trick",
    "overview": "Áp dụng vòng đời tài khoản với joker và batman, HOME tùy chỉnh và cách xóa giữ hoặc bỏ HOME.",
    "tasks": [
      {
        "task": "Tạo joker với HOME và batman với HOME tại /home/gotham bằng useradd.",
        "commands": [
          "sudo useradd -m joker",
          "sudo useradd -m -d /home/gotham batman"
        ],
        "verification": {
          "kind": "state",
          "command": "getent passwd joker >/dev/null && getent passwd batman >/dev/null && test \"$(getent passwd joker | cut -d: -f6)\" = /home/joker && test \"$(getent passwd batman | cut -d: -f6)\" = /home/gotham && test -d /home/joker && test -d /home/gotham"
        },
        "notes": "Hai người dùng phải có thư mục riêng khi tạo."
      },
      {
        "task": "Dùng passwd đặt mật khẩu thực hành cho joker và batman.",
        "commands": [
          {
            "command": "sudo passwd joker",
            "input": [
              "ephemeral-test-only",
              "ephemeral-test-only"
            ]
          },
          {
            "command": "sudo passwd batman",
            "input": [
              "ephemeral-test-only",
              "ephemeral-test-only"
            ]
          }
        ],
        "verification": {
          "kind": "state",
          "command": "test \"$(sudo passwd -S joker | awk '{print $2}')\" = P && test \"$(sudo passwd -S batman | awk '{print $2}')\" = P"
        },
        "notes": "Nhập mật khẩu hai lần; không dùng mật khẩu cá nhân."
      },
      {
        "task": "Đổi HOME joker thành /home/arkham và shell batman thành /bin/bash.",
        "commands": [
          "sudo usermod -d /home/arkham joker",
          "sudo usermod -s /bin/bash batman"
        ],
        "verification": {
          "kind": "state",
          "command": "test \"$(getent passwd joker | cut -d: -f6)\" = /home/arkham && test \"$(getent passwd batman | cut -d: -f7)\" = /bin/bash"
        },
        "notes": "Thay thông tin bằng usermod."
      },
      {
        "task": "Xóa joker nhưng giữ HOME; xóa batman và /home/gotham.",
        "commands": [
          "sudo userdel joker",
          "sudo userdel -r batman"
        ],
        "verification": {
          "kind": "all",
          "checks": [
            {
              "kind": "state",
              "command": "! getent passwd joker >/dev/null && ! getent passwd batman >/dev/null && test ! -e /home/gotham && test -d /home/joker"
            },
            {
              "kind": "commands",
              "user": "labex",
              "allowed_status": [
                0
              ],
              "groups": [
                [
                  "^\\s*sudo\\s+userdel\\s+joker\\s*$"
                ],
                [
                  "^\\s*sudo\\s+userdel\\s+-r\\s+batman\\s*$"
                ]
              ]
            }
          ]
        },
        "notes": "usermod -d không di chuyển thư mục nếu thiếu -m; trong chuỗi lệnh mẫu, /home/joker vẫn được giữ."
      }
    ],
    "manifest": {
      "version": 1,
      "directories": [],
      "files": [],
      "accounts": [],
      "groups": []
    },
    "fixture_facts": []
  }
];
const outlinePath = path.join(root, 'server/data/reference/quick-start-live-outline.json');
const observed = JSON.parse(fs.readFileSync(outlinePath, 'utf8'));
const backupDir = path.join(root, '.artifacts/quick-start-before-parity');
const data = path.join(root, 'server/data');
const write = (file, value) => { fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, JSON.stringify(value, null, 2)+'\n', 'utf8'); };
fs.mkdirSync(backupDir, {recursive:true});
const reference = {version:1,course_id:'quick-start-with-linux',observed_at:observed.observed_at,evidence_id:observed.evidence_id,
  course_url:'https://labex.io/courses/quick-start-with-linux',
  repository_url:'https://github.com/labex-labs/quick-start-with-linux',
  licensing:{full_lesson_source_license:null,repository_observation:'README indexes only; no full lesson source or LICENSE observed in root listing.'},
  environment:{distribution:'Ubuntu 22.04',source_ui:'VNC desktop with Terminal and WebIDE views',user:'labex',home:'/home/labex',cwd:'/home/labex/project',local_runtime:'isolated Linux namespaces and private account database; not original LabEx VM image'},
  fidelity:{section_outline:'observed authenticated API',task_facts:'public official tutorials plus authenticated outline',text:'independently authored concise Vietnamese summary',original_private_graders:'unknown',original_vm_image:'not recovered'},lessons:[]};
const scenarios={version:1,course_id:'quick-start-with-linux',notes:'Own solution commands for integration tests; no original hidden solution recovered.',lessons:[]};
let total=0;
for(const [index,def] of definitions.entries()){
  const live=observed.lessons.find(item=>item.source_lab_id===def.source_lab_id);
  if(!live) throw Error('Missing outline '+def.id);
  const graded=live.sections.filter(s=>s.need_verify);
  if(graded.length!==def.tasks.length) throw Error('Task count mismatch '+def.id);
  const current=path.join(data,'labs',def.id+'.json');
  const existing=fs.existsSync(current)?JSON.parse(fs.readFileSync(current,'utf8')):null;
  const backup=path.join(backupDir,def.id+'.json');
  if(fs.existsSync(current)&&!fs.existsSync(backup)) fs.copyFileSync(current,backup,fs.constants.COPYFILE_EXCL);
  const sourceUrl='https://labex.io/tutorials/'+def.slug+'-'+def.source_lab_id;
  let cursor=0;
  const sections=live.sections.map(section=>{
    const id='source-'+def.source_lab_id+'-section-'+section.position;
    const common={id,title:section.title,position:section.position,kind:section.need_verify?'task':section.position===0?'introduction':'summary',
      layout:section.layout,need_verify:section.need_verify,has_solution:section.has_solution};
    if(!section.need_verify) return {...common,content:section.position===0?def.overview:'Bạn đã thực hành: '+def.tasks.map(task=>task.task).join(' ')};
    const task=def.tasks[cursor++];
    const fence=String.fromCharCode(96).repeat(3);
    const examples=def.type==='lab'?task.commands.map(entry=>{
      const command=typeof entry==='string'?entry:entry.command;
      let prompt='';
      if(typeof entry==='object' && entry.allowed_status?.includes(1)) prompt='Lệnh sau dự kiến báo lỗi khi điều kiện chưa cho phép; quan sát thông báo rồi tiếp tục.\n\n';
      if(command.startsWith('sudo passwd ') && !command.startsWith('sudo passwd -')) prompt='Nhập mật khẩu thực hành hai lần ở hai lời nhắc; ký tự nhập sẽ không hiển thị.\n\n';
      if(command.startsWith('rm -i ')) prompt='Khi terminal hỏi xác nhận xóa, nhập y rồi nhấn Enter.\n\n';
      if(command.startsWith('su ')) prompt+=(entry.allowed_status?.includes(1)?'Mật khẩu đang bị khóa: lần đăng nhập này phải thất bại.':'Nhập mật khẩu joker khi được hỏi; nếu sudo hỏi mật khẩu, nhập lại mật khẩu đó.')+'\n\n';
      return prompt+fence+'bash\n'+command+'\n'+fence;
    }).join('\n\n'):'';
    const content=task.task+'\n\n'+task.notes+(examples?'\n\n'+examples:'');
    return {...common,content,task:task.task,hint:task.notes,verification:task.verification,...(task.verification.kind==='acknowledgement'?{action:'continue'}:{})};
  });
  // Anti may have supplied richer lesson bodies/translations after this
  // generator was written. Regenerating trusted graders must preserve those
  // bodies; match source position and title, never a possibly obsolete task ID.
  for (const section of sections) {
    const previous=existing?.sections?.find(item=>item.position===section.position&&item.title===section.title);
    if (!previous) continue;
    for (const key of ['content','content_vi','title_vi','task_vi','hint_vi']) {
      if (typeof previous[key]==='string'&&previous[key].trim()) section[key]=previous[key];
    }
  }
  const fixturesPartial=def.fixture_facts.some(f=>f.fixture_fidelity==='reconstructed_fixture');
  const lab={id:def.id,course_id:'quick-start-with-linux',order:index+1,title:def.title,type:def.type,difficulty:'Beginner',estimated_time:'25 mins',overview:def.overview,
    source_url:sourceUrl,source_lab_id:def.source_lab_id,
    source:{provider:'LabEx',url:sourceUrl,outline_evidence_id:observed.evidence_id,observed_at:observed.observed_at,
      fidelity:{section_outline:'observed',content_summary:true,original_prose_copied:false,original_private_checks:'unknown',fixtures:fixturesPartial?'partial-reconstructed':'requirement-derived-or-observed'},limitation:'Local independently authored summary and graders; not a claim of original course source or original VM fidelity.'},
    environment_setup:'server/data/environment-setups/'+def.id+'.json',sections,steps:sections.filter(s=>s.kind==='task')};
  if (existing) {
    for (const key of ['title_vi','overview_vi']) if (typeof existing[key]==='string') lab[key]=existing[key];
    lab.source.fidelity.content='existing-workspace-bodies-preserved';
    lab.source.fidelity.content_summary=false;
    delete lab.source.fidelity.original_prose_copied;
    lab.source.limitation='Existing workspace lesson bodies and independently authored local graders; original private grader and VM image are unknown.';
  }
  write(current,lab);
  write(path.join(data,'environment-setups',def.id+'.json'),{...def.manifest,provenance:{source_url:sourceUrl,original_vm_image_recovered:false,fixture_facts:def.fixture_facts}});
  reference.lessons.push({local_id:def.id,source_lab_id:def.source_lab_id,order:index+1,type:def.type,title:def.title,source_url:sourceUrl,
    overview:def.overview,sections:sections.map(({id,title,position,kind,layout,need_verify})=>({id,title,position,kind,layout,need_verify})),
    tasks:sections.filter(s=>s.kind==='task').map(({id,task,verification})=>({section_id:id,requirement:task,local_verification_kind:verification.kind,original_verification:'unknown'})),
    fixture_facts:def.fixture_facts,setup_manifest:lab.environment_setup});
  scenarios.lessons.push({lab_id:def.id,source_lab_id:def.source_lab_id,setup_manifest:lab.environment_setup,
    steps:graded.map((section,i)=>({id:'source-'+def.source_lab_id+'-section-'+section.position,commands:def.tasks[i].commands,...(def.tasks[i].verification.kind==='acknowledgement'?{acknowledge:true}:{})}))});
  total+=lab.steps.length;
}
write(path.join(data,'reference/quick-start-with-linux.reference.json'),reference);
write(path.join(root,'tests/scenarios/source-course.json'),scenarios);
console.log('Generated '+definitions.length+' source-aligned lessons, '+total+' graded tasks; backups preserved in '+backupDir);

