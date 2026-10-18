import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const labsDir = path.join(__dirname, "../server/data/labs");

const files = fs.readdirSync(labsDir).filter(f => f.endsWith(".json"));
let fixedCount = 0;

for (const file of files) {
  const filePath = path.join(labsDir, file);
  const lab = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let modified = false;

  const steps = lab.steps || [];
  const sections = lab.sections || [];

  // Fix hints in steps
  steps.forEach((step) => {
    if (!step.hint || !step.hint.trim()) {
      step.hint = step.hint_vi || "Thực hiện theo yêu cầu và kiểm tra kết quả trên hệ thống.";
      modified = true;
    }
  });

  // Assign kind to sections
  sections.forEach((sec, idx) => {
    if (!sec.kind) {
      if (sec.need_verify === true) {
        sec.kind = "task";
      } else if (idx === 0) {
        sec.kind = "introduction";
      } else {
        sec.kind = "summary";
      }
      modified = true;
    }
    if (!sec.hint || !sec.hint.trim()) {
      sec.hint = "Thực hiện theo yêu cầu và kiểm tra kết quả trên hệ thống.";
      modified = true;
    }
  });

  // Align sections with steps if needed
  if (sections.length && steps.length) {
    const taskSections = sections.filter(s => s.kind === "task");
    if (taskSections.length === steps.length) {
      taskSections.forEach((sec, idx) => {
        if (sec.id !== steps[idx].id) {
          sec.id = steps[idx].id;
          modified = true;
        }
      });
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(lab, null, 2), "utf8");
    fixedCount++;
  }
}

console.log(`Successfully sanitized ${fixedCount} labs.`);
