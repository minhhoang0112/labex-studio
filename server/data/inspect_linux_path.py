import json
from bs4 import BeautifulSoup

path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\.system_generated\steps\568\output.txt"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

norm = data.get("normalized_result", {})
dom_text = norm["steps"][1]["artifacts"]["dom"]["value"]["text"]
soup = BeautifulSoup(dom_text, "html.parser")
pre = soup.find("pre")
raw_json = pre.get_text() if pre else dom_text

try:
    resp = json.loads(raw_json)
    print("Linux Path API Keys:", list(resp.keys()))
    with open(r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\scratch\linux_path_api.json", "w", encoding="utf-8") as f:
        json.dump(resp, f, indent=2)
    print("Saved linux_path_api.json!")
    # inspect stages / courses
    path_info = resp.get("path", {})
    print("Path name:", path_info.get("name"), "description:", path_info.get("description")[:100])
    stages = resp.get("stages", [])
    print(f"Total stages in Linux Path: {len(stages)}")
    for s in stages:
        print(f"Stage {s.get('id')}: {s.get('name')}")
        courses = s.get("courses", [])
        print(f"  Courses ({len(courses)}): {[c.get('name') for c in courses]}")
except Exception as e:
    print("Parse error:", e, raw_json[:300])

