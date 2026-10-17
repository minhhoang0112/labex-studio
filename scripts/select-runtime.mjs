import fs from "node:fs";
import { fileURLToPath } from "node:url";

const provider = process.argv[2];
if (!["namespace", "docker"].includes(provider)) throw new Error("Use namespace or docker.");
const target = fileURLToPath(new URL("../.env", import.meta.url));
if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) throw new Error("Configure the linked .env explicitly.");
let content = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "PORT=5000\nHOST=127.0.0.1\nWSL_DISTRO=Ubuntu\n";
const key = /^[\t ]*LABEX_RUNTIME_PROVIDER[\t ]*=.*$/gm;
content = key.test(content) ? content.replace(key, "LABEX_RUNTIME_PROVIDER=" + provider)
  : content.replace(/\s*$/, "") + "\nLABEX_RUNTIME_PROVIDER=" + provider + "\n";
fs.writeFileSync(target, content, { mode: 0o600 });
console.log("Selected " + provider + ". Run run.bat or scripts/start-local.ps1 -Restart to apply.");
