import json
from bs4 import BeautifulSoup

path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\.system_generated\steps\405\output.txt"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

norm = data.get("normalized_result", {})
dom_text = norm["steps"][1]["artifacts"]["dom"]["value"]["text"]
soup = BeautifulSoup(dom_text, "html.parser")

print("Title:", soup.title.string if soup.title else None)
print("H1s:", [h.get_text(strip=True) for h in soup.find_all("h1")])
print("H2s:", [h.get_text(strip=True) for h in soup.find_all("h2")])
print("Course cards found in DOM:", len(soup.find_all("h3")))
for h3 in soup.find_all("h3")[:6]:
    print(" - Course:", h3.get_text(strip=True))

