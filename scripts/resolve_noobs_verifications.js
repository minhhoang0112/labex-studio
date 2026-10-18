import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const labsDir = path.join(__dirname, "../server/data/labs");

const LAB_UPDATES = {
  "linux-basic-file-operations-in-linux-18001": {
    "source-18001-section-7-v3": {
      verification: {
        kind: "all",
        checks: [
          { kind: "state", command: "test -f /home/labex/project/file-basics/shortcuts-complete.txt || test -f /home/labex/project/file-basics/workspace/docs/guide.txt" },
          { kind: "commands", user: "labex", groups: [["(?:shortcuts-complete|cat|tail|cd)"]], allowed_status: [0, 1, 130] }
        ]
      },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-getting-started-with-linux-446315": {
    "source-446315-section-2-v3": {
      verification: {
        kind: "all",
        checks: [
          { kind: "state", command: "test -f /home/labex/today.txt || test -f /home/labex/project/today.txt || test -f today.txt" },
          { kind: "commands", user: "labex", groups: [["(?:today\\.txt|date|cal)"]], allowed_status: [0] }
        ]
      },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-configure-linux-environment-variables-437861": {
    "source-437861-section-1-v3": {
      verification: {
        kind: "state",
        command: "grep -E 'PROJECT_DIR=' /home/labex/.zshrc 2>/dev/null || grep -E 'PROJECT_DIR=' /home/labex/.bashrc 2>/dev/null || test -f /home/labex/project/project-variable.txt"
      },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-environment-variables-in-linux-385274": {
    "source-385274-section-5-v3": {
      verification: {
        kind: "state",
        command: "grep -q 'PROJECT_DIR' /home/labex/.zshrc 2>/dev/null || grep -q 'PROJECT_DIR' /home/labex/.bashrc 2>/dev/null || test -f /home/labex/project/environment-lab/future-shell.txt"
      },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-get-help-on-linux-commands-18000": {
    "source-18000-section-3-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:man\\s+ls|help|info)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-18000-section-4-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:apropos|whatis|man\\s+-k)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-system-information-and-process-management-725419": {
    "source-725419-section-5-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:jobs|bg|fg|sleep|ps)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725419-section-7-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:dmesg|uname|uptime|hostname)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-linux-user-group-and-file-permissions-18002": {
    "source-18002-section-4-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:passwd|usermod|getent\\s+shadow)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-18002-section-8-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:newgrp|groups|id)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-file-system-and-disk-management-17999": {
    "source-17999-section-1-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:lsblk|df|fdisk)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-17999-section-3-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:mkfs|dumpe2fs|tune2fs|lsblk)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-17999-section-4-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:mount|umount|mkdir)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-17999-section-5-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:fdisk|parted|gdisk|lsblk)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-17999-section-6-v3": {
      verification: {
        kind: "commands",
        user: "labex",
        groups: [["(?:fstab|cat|grep)"]],
        allowed_status: [0, 1]
      },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-remote-access-and-file-transfer-with-ssh-725416": {
    "source-725416-section-1-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:ssh|cat|cd)"]], allowed_status: [0, 1] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725416-section-2-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:ssh\\s+)"]], allowed_status: [0, 1, 255] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725416-section-3-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:ssh\\s+)"]], allowed_status: [0, 1, 255] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725416-section-4-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:scp\\s+)"]], allowed_status: [0, 1, 255] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725416-section-5-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:scp\\s+-r)"]], allowed_status: [0, 1, 255] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725416-section-6-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:ssh-keygen)"]], allowed_status: [0, 1] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725416-section-7-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:ssh-copy-id|ssh)"]], allowed_status: [0, 1, 255] },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-upload-a-configuration-with-scp-725408": {
    "source-725408-section-1-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:scp|ssh|rsync)"]], allowed_status: [0, 1, 255] },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-managing-services-and-system-logs-725415": {
    "source-725415-section-1-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:systemctl|service|ps)"]], allowed_status: [0, 1, 3] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725415-section-2-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:systemctl\\s+status|cat|systemctl\\s+cat)"]], allowed_status: [0, 1, 3] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725415-section-3-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:systemctl\\s+(?:start|stop|restart)|service)"]], allowed_status: [0, 1, 3] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725415-section-4-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:systemctl\\s+(?:is-enabled|enable|disable))"]], allowed_status: [0, 1, 3] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725415-section-5-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:journalctl)"]], allowed_status: [0, 1] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725415-section-6-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:tail|cat|less|grep)"]], allowed_status: [0, 1] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725415-section-7-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:systemctl|service|journalctl)"]], allowed_status: [0, 1, 3] },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-correct-a-service-bind-address-725411": {
    "source-725411-section-1-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:systemctl|service|netstat|ss|curl|sed|nano|vim)"]], allowed_status: [0, 1, 3] },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-recover-a-failed-service-725413": {
    "source-725413-section-1-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:systemctl|service|journalctl)"]], allowed_status: [0, 1, 3] },
      required_capabilities: ["terminal", "files", "shell"]
    }
  },
  "linux-linux-networking-and-firewall-basics-725414": {
    "source-725414-section-1-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:hostname|uname|ip|ifconfig)"]], allowed_status: [0, 1] },
      required_capabilities: ["terminal", "files", "shell"]
    },
    "source-725414-section-6-v3": {
      verification: { kind: "commands", user: "labex", groups: [["(?:ss|netstat|lsof|curl)"]], allowed_status: [0, 1] },
      required_capabilities: ["terminal", "files", "shell"]
    }
  }
};

let updatedCount = 0;
for (const [labId, stepRules] of Object.entries(LAB_UPDATES)) {
  const filePath = path.join(labsDir, `${labId}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    continue;
  }
  const lab = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let labModified = false;

  for (const [stepId, rule] of Object.entries(stepRules)) {
    // Update in sections
    const section = (lab.sections || []).find(s => s.id === stepId);
    if (section) {
      section.verification = rule.verification;
      section.required_capabilities = rule.required_capabilities;
      section.verification_by_provider = {
        docker: rule.verification,
        namespace: rule.verification
      };
      section.required_capabilities_by_provider = {
        docker: rule.required_capabilities,
        namespace: rule.required_capabilities
      };
      labModified = true;
    }
    // Update in steps
    const step = (lab.steps || []).find(s => s.id === stepId);
    if (step) {
      step.verification = rule.verification;
      step.required_capabilities = rule.required_capabilities;
      step.verification_by_provider = {
        docker: rule.verification,
        namespace: rule.verification
      };
      step.required_capabilities_by_provider = {
        docker: rule.required_capabilities,
        namespace: rule.required_capabilities
      };
      labModified = true;
    }
  }

  if (labModified) {
    fs.writeFileSync(filePath, JSON.stringify(lab, null, 2), "utf8");
    updatedCount++;
    console.log(`Updated lab: ${labId}`);
  }
}

console.log(`Successfully updated ${updatedCount} labs in linux-for-noobs.`);

