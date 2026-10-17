import json
import base64

path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\.system_generated\steps\405\output.txt"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

norm = data.get("normalized_result", {})
scr = norm["steps"][1]["artifacts"]["screenshot"]["value"]["data_base64"]
out_img = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\labex_local_screenshot.png"
with open(out_img, "wb") as f:
    f.write(base64.b64decode(scr))

print(f"Saved local screenshot to {out_img}")

