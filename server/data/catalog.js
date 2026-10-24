import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { applySourceContent } from '../services/sourceContent.js';

const labsDirectory = fileURLToPath(new URL("./labs/", import.meta.url));

export function isValidId(value) {
  return typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(value);
}

export function loadLab(id) {
  if (!isValidId(id)) return null;
  try {
    const lab = JSON.parse(fs.readFileSync(`${labsDirectory}/${id}.json`, "utf8"));
    return lab.id === id ? synchronizeTaskPresentation(applySourceContent(lab)) : null;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

// The reader renders sections; verification and task upgrades use steps.
// Documents come from sections, while task requirements and private grading
// come from steps. Serve both views from that same joined contract.
export function synchronizeTaskPresentation(lab) {
  if (!Array.isArray(lab.sections) || !Array.isArray(lab.steps)) return lab;
  const sections = new Map(lab.sections.map(section => [section.id, section]));
  const documentFields = ['title', 'title_vi', 'content', 'content_vi'];
  const taskFields = ['task', 'task_vi', 'hint', 'hint_vi', 'verification', 'verify_command', 'verification_by_provider'];
  const steps = lab.steps.map(step => {
    const section = sections.get(step.id);
    if (!section) return step;
    const result = { ...step };
    for (const field of documentFields) {
      if (Object.hasOwn(section, field)) result[field] = section[field];
      else delete result[field];
    }
    return result;
  });
  const tasks = new Map(steps.map(step => [step.id, step]));
  return { ...lab, steps, sections: lab.sections.map(section => {
    const step = tasks.get(section.id);
    if (!step) return section;
    const result = { ...section };
    for (const field of taskFields) {
      if (Object.hasOwn(step, field)) result[field] = step[field];
      else delete result[field];
    }
    return result;
  }) };
}

export function listLabs() {
  return fs.readdirSync(labsDirectory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => loadLab(name.slice(0, -5)))
    .filter(Boolean);
}
