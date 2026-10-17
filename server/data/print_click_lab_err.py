import json

path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\.system_generated\steps\443\output.txt"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

for s in data["normalized_result"]["steps"]:
    if s.get("step_id") == "click_lab":
        print("click_lab error:", s.get("error"))

