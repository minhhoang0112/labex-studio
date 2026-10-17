import re
import json

file_path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\.system_generated\steps\2734\content.md"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

matches = set(re.findall(r"/labex-labs/quick-start-with-linux/(?:tree|blob)/[^\"\'\s<>]+", text))
print("Matched links count:", len(matches))
for m in sorted(matches):
    print(" -", m)

# Also check for JSON payload in script tag
json_matches = re.findall(r'(\{\"payload\":\{.*?\"\})<\/script>', text)
print("JSON payload matches:", len(json_matches))

