import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const labsDir = path.join(__dirname, "../server/data/labs");

const WINDOWS_LABS = [
  // --- KHÓA 1: WINDOWS POWERSHELL FOR SYSADMINS ---
  {
    id: "win-powershell-basics",
    course_id: "windows-powershell-for-sysadmins",
    order: 1,
    title: "PowerShell Fundamentals & Cmdlet Architecture",
    title_vi: "Làm Quen Với PowerShell & Kiến Trúc Cmdlet",
    type: "lab",
    difficulty: "Beginner",
    estimated_time: "20 mins",
    overview: "Khám phá kiến trúc Verb-Noun độc đáo của PowerShell, sử dụng Get-Command, Get-Help và làm việc với đối tượng thay vì chuỗi văn bản thuần túy.",
    sections: [
      {
        id: "win-ps-01-sec-0",
        title: "Introduction to PowerShell",
        title_vi: "Giới thiệu về PowerShell",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## Welcome to PowerShell for System Administrators\n\nPowerShell is an object-oriented automation engine and scripting language designed specifically for system administrators. Unlike traditional Linux shells or Windows Command Prompt (cmd.exe) that pass plain text, PowerShell passes rich .NET objects through the pipeline.\n\nIn this lab, you will learn:\n- The Verb-Noun cmdlet naming convention (e.g. `Get-Process`, `Set-Service`).\n- How to discover commands with `Get-Command`.\n- How to read built-in documentation with `Get-Help`.\n- How to inspect object properties with `Get-Member`.\n",
        content_vi: "## Chào mừng bạn đến với PowerShell dành cho Quản trị viên Hệ thống\n\nPowerShell là một engine tự động hóa và ngôn ngữ kịch bản hướng đối tượng được thiết kế riêng cho các kỹ sư quản trị hệ thống. Khác với shell Linux truyền thống hay cmd.exe vốn chỉ truyền các dòng text phẳng, PowerShell truyền toàn bộ đối tượng .NET qua đường ống (pipeline).\n\nTrong bài lab này, bạn sẽ học:\n- Quy ước đặt tên cmdlet Động từ - Danh từ (Verb-Noun) như `Get-Process`, `Set-Service`.\n- Cách tìm kiếm lệnh nhanh chóng với `Get-Command`.\n- Cách tra cứu tài liệu và ví dụ mẫu với `Get-Help`.\n- Cách xem các thuộc tính và phương thức của đối tượng với `Get-Member`."
      },
      {
        id: "win-ps-01-sec-1",
        title: "Discovering Cmdlets with Get-Command",
        title_vi: "Khám phá Lệnh với Get-Command",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Use Get-Command to discover cmdlets matching the Service noun, then find the PowerShell version.",
        task_vi: "Sử dụng lệnh Get-Command để tìm các cmdlet liên quan đến Service, sau đó kiểm tra phiên bản PowerShell hiện tại.",
        hint: "Run: Get-Command *-Service and inspect $PSVersionTable",
        hint_vi: "Chạy lệnh: Get-Command *-Service và kiểm tra biến $PSVersionTable",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Get-Command|PSVersionTable|get-command)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Discovering Cmdlets\n\nRun the following command to find all cmdlets that manage Windows Services:\n\n```powershell\nGet-Command *-Service\n```\n\nNext, inspect your current PowerShell environment:\n\n```powershell\n$PSVersionTable.PSVersion\n```\n",
        content_vi: "### Khám phá các Cmdlet\n\nChạy lệnh sau để tìm tất cả các lệnh quản lý Dịch vụ Windows:\n\n```powershell\nGet-Command *-Service\n```\n\nTiếp theo, hãy kiểm tra phiên bản PowerShell đang chạy:\n\n```powershell\n$PSVersionTable.PSVersion\n```"
      },
      {
        id: "win-ps-01-sec-2",
        title: "Inspecting Objects with Get-Member",
        title_vi: "Kiểm tra Thuộc tính Đối tượng với Get-Member",
        position: 2,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Pipe Get-Process to Get-Member to see available properties and methods.",
        task_vi: "Chuyển tiếp kết quả Get-Process sang Get-Member để xem các thuộc tính (Properties) và phương thức (Methods) của tiến trình.",
        hint: "Run: Get-Process | Get-Member",
        hint_vi: "Chạy lệnh: Get-Process | Get-Member",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Get-Member|get-member|Get-Process)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Working with Objects\n\nPass processes to `Get-Member`:\n\n```powershell\nGet-Process | Get-Member\n```\n\nNotice that the output shows `TypeName: System.Diagnostics.Process` with properties like `CPU`, `Id`, `ProcessName`, and methods like `Kill()`.\n",
        content_vi: "### Làm việc với Đối tượng\n\nChuyển tiếp danh sách tiến trình sang `Get-Member`:\n\n```powershell\nGet-Process | Get-Member\n```\n\nKết quả sẽ hiển thị `TypeName: System.Diagnostics.Process` cùng các thuộc tính như `CPU`, `Id`, `ProcessName` và các phương thức như `Kill()`."
      }
    ]
  },
  {
    id: "win-manage-services-processes",
    course_id: "windows-powershell-for-sysadmins",
    order: 2,
    title: "Managing Windows Services and Processes",
    title_vi: "Quản Trị Dịch Vụ và Tiến Trình Windows",
    type: "lab",
    difficulty: "Beginner",
    estimated_time: "25 mins",
    overview: "Học cách giám sát tiến trình chiếm tài nguyên, lọc danh sách dịch vụ đang chạy (Running) và dừng/khởi động lại các Windows Services.",
    sections: [
      {
        id: "win-ps-02-sec-0",
        title: "Introduction",
        title_vi: "Giới thiệu",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## Managing Services and Processes in Windows\n\nAs a Windows SysAdmin, monitoring system health and restarting stuck background services is a daily operational task. PowerShell provides fast, scriptable cmdlets (`Get-Process`, `Stop-Process`, `Get-Service`, `Restart-Service`).\n",
        content_vi: "## Quản trị Dịch vụ và Tiến trình trong Windows\n\nLà một quản trị viên hệ thống Windows, việc giám sát tài nguyên và xử lý các dịch vụ bị treo (stuck services) là công việc hàng ngày. PowerShell cung cấp các cmdlet mạnh mẽ giúp thao tác tức thì và tự động hóa (`Get-Process`, `Stop-Process`, `Get-Service`, `Restart-Service`)."
      },
      {
        id: "win-ps-02-sec-1",
        title: "Filtering Running Services",
        title_vi: "Lọc Danh sách Dịch vụ Đang Chạy",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Query all services with Status equal to 'Running' and sort by DisplayName.",
        task_vi: "Truy vấn danh sách tất cả các dịch vụ có trạng thái 'Running' và sắp xếp theo tên hiển thị (DisplayName).",
        hint: "Run: Get-Service | Where-Object Status -eq 'Running'",
        hint_vi: "Chạy lệnh: Get-Service | Where-Object Status -eq 'Running'",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Get-Service|Where-Object|Select-Object)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Filtering Services\n\n```powershell\nGet-Service | Where-Object Status -eq 'Running' | Select-Object -First 10 Name, DisplayName, Status\n```\n",
        content_vi: "### Lọc Dịch vụ\n\n```powershell\nGet-Service | Where-Object Status -eq 'Running' | Select-Object -First 10 Name, DisplayName, Status\n```"
      },
      {
        id: "win-ps-02-sec-2",
        title: "Locating Top CPU Processes",
        title_vi: "Tìm Tiến Trình Chiếm Nhiều CPU Nhất",
        position: 2,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Sort processes by CPU descending and display the top 5 resource consumers.",
        task_vi: "Sắp xếp tiến trình giảm dần theo CPU và hiển thị 5 tiến trình tiêu tốn nhiều tài nguyên nhất.",
        hint: "Run: Get-Process | Sort-Object CPU -Descending | Select-Object -First 5",
        hint_vi: "Chạy lệnh: Get-Process | Sort-Object CPU -Descending | Select-Object -First 5",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Sort-Object|Get-Process|Select-Object)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Resource Inspection\n\n```powershell\nGet-Process | Sort-Object CPU -Descending | Select-Object -First 5 ProcessName, Id, CPU, WorkingSet64\n```\n",
        content_vi: "### Kiểm tra Tài nguyên\n\n```powershell\nGet-Process | Sort-Object CPU -Descending | Select-Object -First 5 ProcessName, Id, CPU, WorkingSet64\n```"
      }
    ]
  },
  {
    id: "win-file-system-ntfs",
    course_id: "windows-powershell-for-sysadmins",
    order: 3,
    title: "Windows File System & NTFS Permissions",
    title_vi: "Hệ Thống Tệp Windows & Phân Quyền NTFS",
    type: "lab",
    difficulty: "Beginner",
    estimated_time: "25 mins",
    overview: "Quản lý tệp tin, ổ đĩa và phân quyền bảo mật Access Control Lists (ACLs) với Get-Acl và Set-Acl.",
    sections: [
      {
        id: "win-fs-03-sec-0",
        title: "Introduction to NTFS Security",
        title_vi: "Giới thiệu về Bảo mật NTFS",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## NTFS Access Control Lists (ACL)\n\nNTFS security governs file and folder access in Windows environments. Each file has a Security Descriptor containing Discretionary Access Control Lists (DACLs) specifying which Users or Groups have Read, Write, Modify, or FullControl rights.\n",
        content_vi: "## Danh sách Kiểm soát Truy cập NTFS (ACL)\n\nBảo mật NTFS là nền tảng quản lý truy cập tệp và thư mục trong hệ thống Windows. Mỗi tệp chứa một Security Descriptor gồm các DACL quy định rõ Người dùng (User) hoặc Nhóm (Group) nào có quyền Đọc (Read), Ghi (Write), Sửa (Modify) hay Toàn quyền (FullControl)."
      },
      {
        id: "win-fs-03-sec-1",
        title: "Creating Directory Structure & Inspecting ACL",
        title_vi: "Tạo Cấu Trúc Thư Mục & Xem Phân Quyền ACL",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Create a project directory structure and check its NTFS permissions using Get-Acl.",
        task_vi: "Tạo cấu trúc thư mục dự án và kiểm tra quyền bảo mật NTFS bằng Get-Acl.",
        hint: "Run: New-Item -ItemType Directory -Path ./FinanceDocs -Force; Get-Acl ./FinanceDocs",
        hint_vi: "Chạy lệnh: New-Item -ItemType Directory -Path ./FinanceDocs -Force; Get-Acl ./FinanceDocs",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:New-Item|Get-Acl|get-acl|mkdir)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Inspecting Permissions\n\n```powershell\nNew-Item -ItemType Directory -Path ./FinanceDocs -Force\n(Get-Acl ./FinanceDocs).Access | Format-Table IdentityReference, FileSystemRights, AccessControlType\n```\n",
        content_vi: "### Kiểm tra Phân quyền\n\n```powershell\nNew-Item -ItemType Directory -Path ./FinanceDocs -Force\n(Get-Acl ./FinanceDocs).Access | Format-Table IdentityReference, FileSystemRights, AccessControlType\n```"
      }
    ]
  },
  {
    id: "win-event-log-analysis",
    course_id: "windows-powershell-for-sysadmins",
    order: 4,
    title: "Windows Event Log Querying & Analysis",
    title_vi: "Truy Vấn và Phân Tích Windows Event Logs",
    type: "lab",
    difficulty: "Intermediate",
    estimated_time: "30 mins",
    overview: "Sử dụng Get-WinEvent và Get-EventLog để điều tra nhật ký sự kiện Application, System và Security.",
    sections: [
      {
        id: "win-el-04-sec-0",
        title: "Introduction to Windows Event Logs",
        title_vi: "Giới thiệu về Windows Event Logs",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## The Heart of Windows Troubleshooting\n\nWindows records all critical operating system, driver, security and application activities in structured Event Logs. Cmdlet `Get-WinEvent` is the modern standard to query these logs with high performance using XPath or FilterHashtables.\n",
        content_vi: "## Trái tim của việc Chẩn đoán Sự cố Windows\n\nWindows ghi nhận toàn bộ hoạt động của hệ điều hành, driver, bảo mật và ứng dụng vào các tệp Event Log có cấu trúc. Lệnh `Get-WinEvent` là chuẩn hiện đại giúp truy vấn log tốc độ cao với FilterHashtable."
      },
      {
        id: "win-el-04-sec-1",
        title: "Filtering Error Events in the System Log",
        title_vi: "Lọc Sự Kiện Lỗi (Error) Trong System Log",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Query the latest 5 Error-level events from the System log.",
        task_vi: "Truy vấn 5 sự kiện cấp độ Lỗi (Error) gần nhất từ nhật ký System.",
        hint: "Run: Get-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 5",
        hint_vi: "Chạy lệnh: Get-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 5",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Get-WinEvent|Get-EventLog|FilterHashtable)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Querying System Errors\n\n```powershell\nGet-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 5 | Format-Table TimeCreated, Id, ProviderName, Message\n```\n",
        content_vi: "### Lọc Lỗi Hệ Thống\n\n```powershell\nGet-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 5 | Format-Table TimeCreated, Id, ProviderName, Message\n```"
      }
    ]
  },
  {
    id: "win-powershell-scripting-automation",
    course_id: "windows-powershell-for-sysadmins",
    order: 5,
    title: "PowerShell Scripting for Daily Automation",
    title_vi: "Viết Kịch Bản Tự Động Hóa Quản Trị Hàng Ngày",
    type: "challenge",
    difficulty: "Intermediate",
    estimated_time: "30 mins",
    overview: "Tạo kịch bản script .ps1 tự động thu thập báo cáo hệ thống: dung lượng ổ đĩa, trạng thái dịch vụ quan trọng và gửi cảnh báo.",
    sections: [
      {
        id: "win-sc-05-sec-0",
        title: "Introduction",
        title_vi: "Giới thiệu",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## Automating Repetitive SysAdmin Tasks\n\nWriting clean PowerShell scripts with functions, error handling (`try/catch`), and parameter blocks turns hours of manual work into scheduled single-second tasks.\n",
        content_vi: "## Tự động hóa các Tác vụ Quản trị Lặp lại\n\nViết kịch bản PowerShell với hàm (functions), xử lý lỗi (`try/catch`) và tham số (parameters) giúp biến hàng giờ làm việc thủ công thành các tác vụ chạy tự động trong tích tắc."
      },
      {
        id: "win-sc-05-sec-1",
        title: "Generate a Server Health Summary Report",
        title_vi: "Tạo Báo Cáo Tổng Hợp Sức Khỏe Máy Chủ",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Write a PowerShell one-liner or script to output disk space and save to health_report.txt.",
        task_vi: "Chạy lệnh trích xuất thông tin dung lượng ổ đĩa và xuất ra tệp health_report.txt.",
        hint: "Run: Get-CimInstance Win32_LogicalDisk | Out-File health_report.txt",
        hint_vi: "Chạy lệnh: Get-CimInstance Win32_LogicalDisk | Out-File health_report.txt",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:health_report|Get-CimInstance|Get-WmiObject|Get-PSDrive)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Generating Report\n\n```powershell\nGet-CimInstance Win32_LogicalDisk | Select-Object DeviceID, FreeSpace, Size | Out-File health_report.txt\nGet-Content health_report.txt\n```\n",
        content_vi: "### Tạo Báo Cáo\n\n```powershell\nGet-CimInstance Win32_LogicalDisk | Select-Object DeviceID, FreeSpace, Size | Out-File health_report.txt\nGet-Content health_report.txt\n```"
      }
    ]
  },

  // --- KHÓA 2: WINDOWS SERVER ADMINISTRATION & ACTIVE DIRECTORY ---
  {
    id: "win-server-ad-users-groups",
    course_id: "windows-server-administration-essentials",
    order: 1,
    title: "Active Directory Identity Management: Users, Groups & OUs",
    title_vi: "Quản Trị Danh Tính Active Directory: User, Group & OU",
    type: "lab",
    difficulty: "Intermediate",
    estimated_time: "35 mins",
    overview: "Thiết kế cây Đơn vị Tổ chức (Organizational Units), tạo tài khoản người dùng hàng loạt, quản lý nhóm bảo mật và cấp phát quyền hạn chuẩn doanh nghiệp.",
    sections: [
      {
        id: "win-ad-01-sec-0",
        title: "Active Directory Architecture",
        title_vi: "Kiến trúc Active Directory",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## Active Directory Domain Services (AD DS)\n\nActive Directory is the backbone of corporate enterprise networks. It centralizes user identity, password policies, computer authentication, and access control across thousands of servers and workstations.\n\nKey Concepts:\n- **Domain Controller (DC)**: The server responding to security authentication requests.\n- **Organizational Unit (OU)**: Logical containers for applying Group Policies and delegating permissions.\n- **Security Groups**: Used to assign permissions to resources (printers, folders, databases).\n",
        content_vi: "## Dịch Vụ Miền Active Directory (AD DS)\n\nActive Directory là xương sống của các mạng doanh nghiệp. Nó tập trung hóa việc quản lý danh tính người dùng, chính sách mật khẩu, xác thực máy trạm và phân quyền tài nguyên trên hàng nghìn máy chủ.\n\nCác khái niệm cốt lõi:\n- **Domain Controller (DC)**: Máy chủ quản lý và phản hồi các yêu cầu xác thực bảo mật.\n- **Đơn vị Tổ chức (OU)**: Thư mục logic chứa Users, Computers để áp dụng chính sách Group Policy.\n- **Security Groups**: Nhóm bảo mật dùng để gán quyền truy cập thư mục, máy in, ứng dụng."
      },
      {
        id: "win-ad-01-sec-1",
        title: "Managing Users & Groups with PowerShell AD Module",
        title_vi: "Quản Trị Người Dùng & Nhóm Qua Module Active Directory",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Explore AD User cmdlets (New-ADUser, Get-ADUser, Add-ADGroupMember).",
        task_vi: "Khám phá và sử dụng các cmdlet quản trị tài khoản AD (New-ADUser, Get-ADUser, Add-ADGroupMember).",
        hint: "Run: Get-Command *ADUser*",
        hint_vi: "Chạy lệnh: Get-Command *ADUser*",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:ADUser|aduser|Get-Command)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### AD Management\n\n```powershell\nGet-Command *ADUser*\nGet-Command *ADGroup*\n```\n",
        content_vi: "### Quản Trị AD\n\n```powershell\nGet-Command *ADUser*\nGet-Command *ADGroup*\n```"
      }
    ]
  },
  {
    id: "win-server-group-policy",
    course_id: "windows-server-administration-essentials",
    order: 2,
    title: "Group Policy Objects (GPO) Deployment & Troubleshooting",
    title_vi: "Triển Khai & Xử Lý Sự Cố Group Policy (GPO)",
    type: "lab",
    difficulty: "Intermediate",
    estimated_time: "30 mins",
    overview: "Cấu hình chính sách bảo mật máy tính, khóa màn hình, vô hiệu hóa USB, ép buộc cập nhật chính sách với gpupdate /force và kiểm tra với gpresult.",
    sections: [
      {
        id: "win-gpo-02-sec-0",
        title: "Introduction to Group Policy",
        title_vi: "Giới thiệu về Group Policy",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## Centralized Management with Group Policy\n\nGroup Policy allows administrators to define security configurations and user environments once, enforcing them automatically across thousands of domain-joined PCs and servers.\n",
        content_vi: "## Quản Trị Tập Trung Với Group Policy\n\nGroup Policy cho phép quản trị viên định nghĩa cấu hình bảo mật một lần và tự động áp dụng bắt buộc lên hàng nghìn máy tính thành viên trong Domain."
      },
      {
        id: "win-gpo-02-sec-1",
        title: "Refreshing and Inspecting Applied Policies",
        title_vi: "Làm Mới & Kiểm Tra Chính Sách Đã Áp Dụng",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Use gpresult to inspect the Resultant Set of Policy (RSoP) on the system.",
        task_vi: "Sử dụng công cụ gpresult để kiểm tra các chính sách thực tế đang có hiệu lực trên máy tính.",
        hint: "Run: gpresult /r or gpresult /?",
        hint_vi: "Chạy lệnh: gpresult /r hoặc gpresult /?",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:gpresult|gpupdate)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Checking GPO Status\n\n```powershell\ngpresult /r\n```\n",
        content_vi: "### Kiểm tra Trạng thái GPO\n\n```powershell\ngpresult /r\n```"
      }
    ]
  },
  {
    id: "win-server-dns-dhcp",
    course_id: "windows-server-administration-essentials",
    order: 3,
    title: "Windows Server Core Networking: DNS & DHCP Roles",
    title_vi: "Hạ Tầng Mạng Máy Chủ: Dịch Vụ DNS & DHCP",
    type: "lab",
    difficulty: "Intermediate",
    estimated_time: "30 mins",
    overview: "Cấu hình Forward/Reverse Lookup Zones, tạo bản ghi A/CNAME/MX, quản lý DHCP Scopes, Address Reservations và phân giải tên miền.",
    sections: [
      {
        id: "win-net-03-sec-0",
        title: "Introduction to DNS & DHCP",
        title_vi: "Giới thiệu DNS và DHCP",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## Core Infrastructure Services\n\nWithout DNS, Active Directory cannot locate Domain Controllers. Without DHCP, clients cannot obtain IP addresses automatically. Mastering DNS and DHCP management is mandatory for every system engineer.\n",
        content_vi: "## Các Dịch Vụ Hạ Tầng Cốt Lõi\n\nKhông có DNS, Active Directory không thể định vị máy chủ điều khiển miền. Không có DHCP, các máy trạm không thể nhận địa chỉ IP tự động. Nắm vững quản trị DNS và DHCP là yêu cầu bắt buộc của mọi kỹ sư hệ thống."
      },
      {
        id: "win-net-03-sec-1",
        title: "Querying DNS Records with Resolve-DnsName",
        title_vi: "Truy Vấn Bản Ghi DNS Với Resolve-DnsName",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Use Resolve-DnsName to query DNS records and test name resolution.",
        task_vi: "Sử dụng Resolve-DnsName để kiểm tra bản ghi phân giải tên miền trên máy chủ.",
        hint: "Run: Resolve-DnsName localhost or Resolve-DnsName -Name google.com",
        hint_vi: "Chạy lệnh: Resolve-DnsName localhost hoặc Resolve-DnsName -Name google.com",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Resolve-DnsName|nslookup|ipconfig)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### DNS Testing\n\n```powershell\nResolve-DnsName localhost\n```\n",
        content_vi: "### Kiểm tra DNS\n\n```powershell\nResolve-DnsName localhost\n```"
      }
    ]
  },
  {
    id: "win-server-file-storage-share",
    course_id: "windows-server-administration-essentials",
    order: 4,
    title: "File Server Management, SMB Shares & Storage Spaces",
    title_vi: "Quản Trị File Server, Chia Sẻ SMB & Storage Spaces",
    type: "lab",
    difficulty: "Intermediate",
    estimated_time: "25 mins",
    overview: "Cấu hình thư mục chia sẻ SMB (`New-SmbShare`), cấp quyền Share Permissions kết hợp phân quyền NTFS, thiết lập hạn ngạch dung lượng Quota.",
    sections: [
      {
        id: "win-fs-04-sec-0",
        title: "Introduction",
        title_vi: "Giới thiệu",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## Enterprise File Services\n\nFile Server is one of the most critical server roles in any enterprise, hosting financial documents, team shares, and department data stores with SMB 3.0 encryption.\n",
        content_vi: "## Dịch Vụ Tệp Doanh Nghiệp\n\nMáy chủ File Server là dịch vụ thiết yếu nhất trong mọi công ty, lưu trữ dữ liệu phòng ban, tài liệu kế toán và chia sẻ tệp qua giao thức SMB 3.0 an toàn."
      },
      {
        id: "win-fs-04-sec-1",
        title: "Inspecting SMB Shares with Get-SmbShare",
        title_vi: "Kiểm Tra Các Thư Mục Chia Sẻ SMB",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Query all active SMB shares on the server using Get-SmbShare.",
        task_vi: "Truy vấn danh sách tất cả các thư mục đang được chia sẻ mạng bằng Get-SmbShare.",
        hint: "Run: Get-SmbShare",
        hint_vi: "Chạy lệnh: Get-SmbShare",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Get-SmbShare|net\\s+share|get-smbshare)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### SMB Shares\n\n```powershell\nGet-SmbShare\n```\n",
        content_vi: "### Danh sách Thư mục Chia sẻ\n\n```powershell\nGet-SmbShare\n```"
      }
    ]
  },
  {
    id: "win-server-iis-web",
    course_id: "windows-server-administration-essentials",
    order: 5,
    title: "IIS Web Server Hosting & SSL Certificate Configuration",
    title_vi: "Triển Khai Máy Chủ Web IIS & Cấu Hình Chứng Chỉ SSL",
    type: "challenge",
    difficulty: "Intermediate",
    estimated_time: "35 mins",
    overview: "Triển khai dịch vụ Internet Information Services (IIS), tạo Website mới, cấu hình Application Pool và thiết lập HTTPS binding bảo mật.",
    sections: [
      {
        id: "win-iis-05-sec-0",
        title: "Introduction to IIS",
        title_vi: "Giới thiệu về IIS",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## Microsoft Internet Information Services (IIS)\n\nIIS is Microsoft's production web server, powering enterprise ASP.NET, PHP, and static web portals with robust Application Pools and worker process isolation.\n",
        content_vi: "## Dịch Vụ Máy Chủ Web IIS\n\nIIS là máy chủ web tiêu chuẩn của Microsoft, phục vụ các ứng dụng doanh nghiệp ASP.NET, website nội bộ và dịch vụ API với cơ chế cô lập tiến trình Application Pool mạnh mẽ."
      },
      {
        id: "win-iis-05-sec-1",
        title: "Inspecting Web Administration Cmdlets",
        title_vi: "Khám Phá Các Lệnh Quản Trị Web IIS",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Explore WebAdministration cmdlets for managing IIS sites and app pools.",
        task_vi: "Kiểm tra các lệnh quản trị IIS và xem cổng lắng nghe mạng của máy chủ web.",
        hint: "Run: Get-Command *IIS* or Get-NetTCPConnection -LocalPort 80, 443",
        hint_vi: "Chạy lệnh: Get-Command *IIS* hoặc Get-NetTCPConnection -LocalPort 80, 443",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Get-Command|Get-NetTCPConnection|netstat)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Checking IIS Commands\n\n```powershell\nGet-Command *Website*\nGet-NetTCPConnection -LocalPort 80, 443 -ErrorAction SilentlyContinue\n```\n",
        content_vi: "### Kiểm tra Lệnh IIS\n\n```powershell\nGet-Command *Website*\nGet-NetTCPConnection -LocalPort 80, 443 -ErrorAction SilentlyContinue\n```"
      }
    ]
  },

  // --- KHÓA 3: WINDOWS SERVER TROUBLESHOOTING & INCIDENT RESPONSE ---
  {
    id: "win-troubleshoot-event-ids",
    course_id: "windows-troubleshooting-and-incident-response",
    order: 1,
    title: "Mastering Event Viewer & Critical SysAdmin Event IDs",
    title_vi: "Làm Chủ Event Viewer & Các Mã Lỗi Event ID Quan Trọng",
    type: "lab",
    difficulty: "Intermediate",
    estimated_time: "30 mins",
    overview: "Kỹ năng phân tích nguyên nhân gốc rễ (RCA): Giải mã các mã Event ID 4625 (Đăng nhập thất bại), 7000/7001 (Lỗi dịch vụ), 1000/1002 (Ứng dụng sập), 41 (Kernel-Power tắt đột ngột).",
    sections: [
      {
        id: "win-tr-01-sec-0",
        title: "Introduction to Event ID Triage",
        title_vi: "Giới thiệu về Phân Loại Mã Lỗi Event ID",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## The Essential Event IDs Every Windows Admin Must Know\n\nWhen a server misbehaves, the senior admin doesn't guess—they open Event Viewer. Here are the universal Event IDs:\n- **Event ID 4625**: An account failed to log on (potential brute-force attack or expired service account password).\n- **Event ID 7000 / 7034**: A service failed to start or terminated unexpectedly.\n- **Event ID 1000 / 1002**: Application crash or hang.\n- **Event ID 41**: The system has rebooted without cleanly shutting down first (unexpected power loss or BSOD).\n",
        content_vi: "## Các Mã Lỗi Event ID Mà Mọi Quản Trị Viên Phải Nắm\n\nKhi máy chủ gặp sự cố, kỹ sư quản trị không phỏng đoán mò mẫm—họ mở ngay Event Viewer. Dưới đây là các Event ID kinh điển:\n- **Event ID 4625**: Đăng nhập thất bại (dấu hiệu tấn công dò mật khẩu hoặc tài khoản dịch vụ bị đổi pass).\n- **Event ID 7000 / 7034**: Dịch vụ hệ thống không thể khởi động hoặc bị crash đột ngột.\n- **Event ID 1000 / 1002**: Ứng dụng bị sập (crash) hoặc bị treo không phản hồi (hang).\n- **Event ID 41**: Máy chủ bị mất nguồn đột ngột hoặc màn hình xanh (BSOD) tự khởi động lại."
      },
      {
        id: "win-tr-01-sec-1",
        title: "Investigating Service Failures (Event 7000 Series)",
        title_vi: "Điều Tra Sự Cố Dịch Vụ (Dãy Event 7000)",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Search System event log for Service Control Manager events (Event ID 7000/7001/7034).",
        task_vi: "Tìm kiếm trong System log các sự kiện do Service Control Manager ghi nhận (Event ID 7000, 7001, 7034).",
        hint: "Run: Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Service Control Manager'} -MaxEvents 5 -ErrorAction SilentlyContinue",
        hint_vi: "Chạy lệnh: Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Service Control Manager'} -MaxEvents 5 -ErrorAction SilentlyContinue",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Get-WinEvent|Get-EventLog|Service Control Manager)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Investigating Service Crashes\n\n```powershell\nGet-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Service Control Manager'} -MaxEvents 5 -ErrorAction SilentlyContinue | Format-List TimeCreated, Id, Message\n```\n",
        content_vi: "### Điều tra Sự cố Dịch vụ\n\n```powershell\nGet-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Service Control Manager'} -MaxEvents 5 -ErrorAction SilentlyContinue | Format-List TimeCreated, Id, Message\n```"
      }
    ]
  },
  {
    id: "win-troubleshoot-failed-services",
    course_id: "windows-troubleshooting-and-incident-response",
    order: 2,
    title: "Diagnosing & Recovering Failed Windows Services",
    title_vi: "Chẩn Đoán & Khôi Phục Dịch Vụ Windows Bị Lỗi",
    type: "lab",
    difficulty: "Intermediate",
    estimated_time: "30 mins",
    overview: "Khắc phục lỗi Logon Failure của Service Account, sửa đường dẫn nhị phân bị hỏng trong ImagePath Registry, và cấu hình Service Recovery Actions.",
    sections: [
      {
        id: "win-tr-02-sec-0",
        title: "Introduction",
        title_vi: "Giới thiệu",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## Why Do Services Fail to Start?\n\nIn real production environments, 90% of service startup failures stem from:\n1. **Logon Failure**: The service account password expired or lost the 'Log on as a service' right.\n2. **Dependency Failure**: A prerequisite service is disabled or failed to start.\n3. **Port Conflict**: Another program is already listening on the required TCP port.\n4. **Corrupt Configuration**: Faulty settings in the registry or app config file.\n",
        content_vi: "## Tại Sao Dịch Vụ Không Thể Khởi Động?\n\nTrong thực tế doanh nghiệp, 90% lỗi khởi động dịch vụ bắt nguồn từ:\n1. **Lỗi Đăng nhập (Logon Failure)**: Mật khẩu của tài khoản dịch vụ bị hết hạn hoặc mất quyền 'Log on as a service'.\n2. **Lỗi Phụ thuộc (Dependency Failure)**: Dịch vụ tiền đề (prerequisite) bị tắt hoặc không chạy.\n3. **Xung đột Cổng mạng**: Một ứng dụng khác đang chiếm dụng cổng TCP mà dịch vụ cần.\n4. **Cấu hình Sai**: Thông số trong Registry hoặc tệp cấu hình bị hỏng."
      },
      {
        id: "win-tr-02-sec-1",
        title: "Inspecting Service Startup Type & Dependencies",
        title_vi: "Kiểm Tra Kiểu Khởi Động & Phụ Thuộc Của Dịch Vụ",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Query Spooler or Winmgmt service configuration, its start type and dependent services.",
        task_vi: "Truy vấn cấu hình dịch vụ Spooler hoặc Winmgmt, kiểu khởi động (StartType) và các dịch vụ phụ thuộc.",
        hint: "Run: Get-Service Spooler -DependentServices",
        hint_vi: "Chạy lệnh: Get-Service Spooler -DependentServices",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Get-Service|DependentServices|RequiredServices)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Service Deep Dive\n\n```powershell\nGet-Service Spooler | Select-Object Name, Status, StartType, RequiredServices\n```\n",
        content_vi: "### Phân tích Dịch Vụ\n\n```powershell\nGet-Service Spooler | Select-Object Name, Status, StartType, RequiredServices\n```"
      }
    ]
  },
  {
    id: "win-troubleshoot-network-connectivity",
    course_id: "windows-troubleshooting-and-incident-response",
    order: 3,
    title: "Windows Network Connectivity & Port Troubleshooting",
    title_vi: "Khắc Phục Sự Cố Kết Nối Mạng & Kiểm Tra Cổng Dịch Vụ",
    type: "lab",
    difficulty: "Intermediate",
    estimated_time: "25 mins",
    overview: "Sử dụng Test-NetConnection (thay thế ping/telnet), Get-NetTCPConnection, chẩn đoán quy tắc Windows Firewall và phân giải tên miền.",
    sections: [
      {
        id: "win-tr-03-sec-0",
        title: "Introduction",
        title_vi: "Giới thiệu",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## The Modern Network Troubleshooting Toolkit\n\nForget `ping` and `telnet`—PowerShell's `Test-NetConnection` (`tnc`) tests ICMP, TCP Port reachability, and trace route all in a single structured command.\n",
        content_vi: "## Bộ Công Cụ Chẩn Đoán Mạng Hiện Đại\n\n`Test-NetConnection` (`tnc`) của PowerShell là công cụ tối thượng: kiểm tra ICMP ping, kiểm tra cổng TCP dịch vụ cụ thể và dò đường định tuyến (trace route) trong một lệnh duy nhất."
      },
      {
        id: "win-tr-03-sec-1",
        title: "Testing TCP Port Reachability with Test-NetConnection",
        title_vi: "Kiểm Tra Thông Cổng TCP Với Test-NetConnection",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Use Test-NetConnection to test localhost TCP port 80 or 443.",
        task_vi: "Sử dụng lệnh Test-NetConnection để kiểm tra tính khả dụng của cổng TCP trên máy chủ.",
        hint: "Run: Test-NetConnection -ComputerName localhost -Port 80",
        hint_vi: "Chạy lệnh: Test-NetConnection -ComputerName localhost -Port 80",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Test-NetConnection|tnc|Get-NetTCPConnection)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Port Testing\n\n```powershell\nTest-NetConnection -ComputerName localhost -Port 80 -WarningAction SilentlyContinue\n```\n",
        content_vi: "### Kiểm tra Cổng Mạng\n\n```powershell\nTest-NetConnection -ComputerName localhost -Port 80 -WarningAction SilentlyContinue\n```"
      }
    ]
  },
  {
    id: "win-troubleshoot-registry-recovery",
    course_id: "windows-troubleshooting-and-incident-response",
    order: 4,
    title: "Windows Registry Inspection & System Recovery",
    title_vi: "Kiểm Tra Cấu Hình Registry & Khôi Phục Hệ Thống",
    type: "lab",
    difficulty: "Advanced",
    estimated_time: "30 mins",
    overview: "Khám phá cấu trúc HKLM, HKCU, truy vấn Registry keys với Get-ItemProperty, backup xuất khóa .reg an toàn và sửa các giá trị cấu hình hệ thống.",
    sections: [
      {
        id: "win-tr-04-sec-0",
        title: "Introduction to Windows Registry",
        title_vi: "Giới thiệu về Windows Registry",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## The Central Database of Windows Configuration\n\nThe Windows Registry contains hardware settings, OS configurations, installed software paths, and user profiles. PowerShell exposes Registry hives as standard PSDrives (`HKLM:`, `HKCU:`), allowing you to navigate them just like file directories.\n",
        content_vi: "## Cơ Sở Dữ Liệu Cấu Hình Trung Tâm Của Windows\n\nWindows Registry lưu trữ cấu hình phần cứng, thiết lập hệ điều hành, đường dẫn phần mềm và profile người dùng. PowerShell ánh xạ các nhánh Registry thành ổ đĩa logic (`HKLM:`, `HKCU:`), cho phép bạn điều hướng giống như thư mục tệp."
      },
      {
        id: "win-tr-04-sec-1",
        title: "Navigating and Querying Registry Keys",
        title_vi: "Điều Hướng & Truy Vấn Khóa Registry",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Query the Windows NT CurrentVersion registry key using Get-ItemProperty.",
        task_vi: "Truy vấn thông tin phiên bản Windows trong nhánh Registry CurrentVersion bằng Get-ItemProperty.",
        hint: "Run: Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion'",
        hint_vi: "Chạy lệnh: Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion'",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Get-ItemProperty|Get-Item|HKLM|CurrentVersion)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Querying Registry\n\n```powershell\nGet-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion' | Select-Object ProductName, CurrentBuild, ReleaseId\n```\n",
        content_vi: "### Truy vấn Registry\n\n```powershell\nGet-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion' | Select-Object ProductName, CurrentBuild, ReleaseId\n```"
      }
    ]
  },
  {
    id: "win-performance-monitoring-bottlenecks",
    course_id: "windows-troubleshooting-and-incident-response",
    order: 5,
    title: "Performance Monitoring: Isolating CPU, RAM & Disk Bottlenecks",
    title_vi: "Giám Sát Hiệu Năng: Cách Ly Điểm Nghẽn CPU, RAM & Ổ Đĩa",
    type: "challenge",
    difficulty: "Advanced",
    estimated_time: "35 mins",
    overview: "Sử dụng Performance Counters (`Get-Counter`), phân tích hàng đợi Disk Queue Length, tỷ lệ Page Faults/sec và phát hiện rò rỉ bộ nhớ (Memory Leak).",
    sections: [
      {
        id: "win-tr-05-sec-0",
        title: "Introduction",
        title_vi: "Giới thiệu",
        position: 0,
        kind: "introduction",
        layout: "doc-fullscreen",
        need_verify: false,
        content: "## Identifying System Bottlenecks\n\nWhen users report 'the server is slow', a sysadmin measures four pillars:\n1. **Processor**: % Processor Time (sustained >85% indicates CPU bottleneck).\n2. **Memory**: Available MBytes (<10% indicates memory starvation) and Pages/sec.\n3. **Disk**: Avg. Disk Queue Length (>2 per physical spindle indicates disk saturation).\n4. **Network**: Bytes Total/sec.\n",
        content_vi: "## Nhận Diện Điểm Nghẽn Hệ Thống\n\nKhi người dùng phàn nàn 'máy chủ bị chậm', quản trị viên đo đạc 4 trụ cột tài nguyên:\n1. **Bộ vi xử lý (CPU)**: % Processor Time (liên tục >85% là nghẽn CPU).\n2. **Bộ nhớ (RAM)**: Available MBytes (<10% là cạn kiệt RAM) và Pages/sec.\n3. **Ổ đĩa (Disk)**: Avg. Disk Queue Length (>2 là ổ đĩa bị quá tải đọc/ghi).\n4. **Mạng (Network)**: Bytes Total/sec đo lượng băng thông truyền tải."
      },
      {
        id: "win-tr-05-sec-1",
        title: "Querying Live Performance Counters",
        title_vi: "Đo Đạc Bộ Đếm Hiệu Năng Thực Tế (Performance Counters)",
        position: 1,
        kind: "task",
        layout: "doc-workbench-split",
        need_verify: true,
        task: "Query the current processor performance counter using Get-Counter.",
        task_vi: "Sử dụng Get-Counter để lấy chỉ số % sử dụng CPU tức thì của máy chủ.",
        hint: "Run: Get-Counter '\\Processor(_Total)\\% Processor Time'",
        hint_vi: "Chạy lệnh: Get-Counter '\\Processor(_Total)\\% Processor Time'",
        verification: {
          kind: "commands",
          user: "labex",
          groups: [["(?:Get-Counter|Processor Time|Get-Process)"]],
          allowed_status: [0, 1]
        },
        required_capabilities: ["terminal", "files", "shell"],
        content: "### Live Performance Counter\n\n```powershell\nGet-Counter '\\Processor(_Total)\\% Processor Time'\n```\n",
        content_vi: "### Lấy Chỉ Số Hiệu Năng Tức Thì\n\n```powershell\nGet-Counter '\\Processor(_Total)\\% Processor Time'\n```"
      }
    ]
  }
];

let generated = 0;
for (const lab of WINDOWS_LABS) {
  const steps = lab.sections
    .filter(s => s.kind === "task")
    .map(s => ({
      id: s.id,
      title: s.title,
      title_vi: s.title_vi,
      action: s.action,
      content: s.content,
      content_vi: s.content_vi,
      task: s.task,
      task_vi: s.task_vi,
      hint: s.hint,
      hint_vi: s.hint_vi,
      verification: s.verification,
      required_capabilities: s.required_capabilities,
      verification_by_provider: {
        docker: s.verification,
        namespace: s.verification
      },
      required_capabilities_by_provider: {
        docker: s.required_capabilities,
        namespace: s.required_capabilities
      }
    }));

  const fullLab = {
    ...lab,
    required_capabilities: ['windows'],
    curriculum_version: 1,
    steps
  };

  const filePath = path.join(labsDir, `${lab.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(fullLab, null, 2), "utf8");
  generated++;
  console.log(`Generated Windows lab: ${lab.id}`);
}

console.log(`\nSuccessfully created ${generated} authentic Windows labs!`);
