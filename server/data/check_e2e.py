import json
import base64

path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\.system_generated\steps\433\output.txt"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

norm = data.get("normalized_result", {})
steps = norm.get("steps", [])

for s in steps:
    print(f"Step {s.get('step_id')}: status={s.get('status')}")

last_step = steps[-1]
scr_val = last_step.get("artifacts", {}).get("screenshot", {}).get("value", {})
if "data_base64" in scr_val:
    out_path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\lab_workspace_success.png"
    with open(out_path, "wb") as f:
        f.write(base64.b64decode(scr_val["data_base64"]))
    print(f"Saved full workspace screenshot to {out_path}!")

dom_text = last_step.get("artifacts", {}).get("dom", {}).get("value", {}).get("text", "")
print("Workspace DOM length:", len(dom_text))
print("Has 'bash — ubuntu@wsl2':", "bash — ubuntu@wsl2" in dom_text)
print("Has 'Labby AI Tutor':", "Labby AI Tutor" in dom_text)

