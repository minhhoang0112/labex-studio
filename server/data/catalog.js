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
    return lab.id === id ? applySourceContent(lab) : null;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export function listLabs() {
  return fs.readdirSync(labsDirectory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => loadLab(name.slice(0, -5)))
    .filter(Boolean);
}
