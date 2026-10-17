import json

path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\.system_generated\steps\433\output.txt"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

norm = data.get("normalized_result", {})
steps = norm.get("steps", [])

for s in steps:
    print(f"Step {s.get('step_id')}: status={s.get('status')}, error={s.get('error')}")

