import json

with open(r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\scratch\linux_path_api.json", "r", encoding="utf-8") as f:
    data = json.load(f)

path_obj = data.get("path", {})
print("Path keys:", list(path_obj.keys()))
for k, v in path_obj.items():
    if isinstance(v, (list, dict)):
        print(f"  {k} (len {len(v)}): {str(v)[:150]}")
    else:
        print(f"  {k}: {str(v)[:100]}")

