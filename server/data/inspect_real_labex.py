import json
from bs4 import BeautifulSoup

# Inspect skill_trees.json
with open(r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\scratch\skill_trees.json", "r", encoding="utf-8") as f:
    skill_trees_data = json.load(f)

paths = skill_trees_data.get("paths", [])
print(f"Total Skill Trees / Paths: {len(paths)}")
for p in paths[:15]:
    print(f"- {p.get('name')} (alias: {p.get('alias')}, courses: {p.get('course_count')}, labs: {p.get('labs_count')}, hours: {p.get('hours')})")

# Inspect labex_learn.html sections
with open(r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\scratch\labex_learn.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")

print("\n--- Sections in labex.io/learn ---")
for s in soup.find_all("section"):
    h = s.find(["h1", "h2", "h3"])
    h_text = h.get_text(strip=True) if h else ""
    print(f"Section heading: '{h_text}', class: '{' '.join(s.get('class', []))}'")

# Look at Section 1: Featured Skill Trees
sec1 = soup.find(lambda tag: tag.name == "section" and tag.find(lambda t: t.name == "h2" and "Featured Skill Trees" in t.get_text()))
if sec1:
    print("\n--- Featured Skill Trees in HTML ---")
    for a in sec1.find_all("a"):
        print("Link:", a.get("href"), "| Text:", a.get_text(" - ", strip=True)[:100])

# Look at Section 2: Certification Prep
sec2 = soup.find(lambda tag: tag.name == "section" and tag.find(lambda t: t.name == "h2" and "Certification" in t.get_text()))
if sec2:
    print("\n--- Certification Prep in HTML ---")
    for a in sec2.find_all("a"):
        print("Link:", a.get("href"), "| Text:", a.get_text(" - ", strip=True)[:100])

