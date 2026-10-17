import json
import base64

path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\.system_generated\steps\415\output.txt"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

norm = data.get("normalized_result", {})
steps = norm.get("steps", [])

for s in steps:
    print(f"Step {s.get('step_id')}: status={s.get('status')}")
    if s.get("error"):
        print(f"  Error: {s.get('error')}")

# Save the final screenshot of the lab workspace!
last_step = steps[-1]
if "artifacts" in last_step and "screenshot" in last_step["artifacts"]:
    scr_val = last_step["artifacts"]["screenshot"]["value"]
    if "data_base64" in scr_val:
        out_path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\lab_workspace_screenshot.png"
        with open(out_path, "wb") as f:
            f.write(base64.b64decode(scr_val["data_base64"]))
        print(f"Saved workspace screenshot to {out_path}!")

