import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const labsDir = path.join(__dirname, "../server/data/labs");

let updatedLabsCount = 0;
let updatedStepsCount = 0;

const files = fs.readdirSync(labsDir).filter(f => f.endsWith(".json"));

for (const file of files) {
  const filePath = path.join(labsDir, file);
  const lab = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let labModified = false;

  const updateEntity = (item) => {
    if (
      item.verification_by_provider?.docker &&
      item.verification_by_provider.docker.kind !== "unsupported" &&
      (!item.verification || item.verification.kind === "unsupported" || !item.verification_by_provider.namespace || item.verification_by_provider.namespace.kind === "unsupported")
    ) {
      item.verification = item.verification_by_provider.docker;
      if (!item.verification_by_provider) item.verification_by_provider = {};
      item.verification_by_provider.namespace = item.verification_by_provider.docker;

      const dockerCaps = item.required_capabilities_by_provider?.docker || item.required_capabilities || ["terminal", "files", "shell"];
      item.required_capabilities = dockerCaps;
      if (!item.required_capabilities_by_provider) item.required_capabilities_by_provider = {};
      item.required_capabilities_by_provider.namespace = dockerCaps;

      updatedStepsCount++;
      labModified = true;
    }
  };

  (lab.steps || []).forEach(updateEntity);
  (lab.sections || []).forEach(updateEntity);

  if (labModified) {
    fs.writeFileSync(filePath, JSON.stringify(lab, null, 2), "utf8");
    updatedLabsCount++;
  }
}

console.log(`Successfully updated ${updatedStepsCount} steps across ${updatedLabsCount} labs.`);
