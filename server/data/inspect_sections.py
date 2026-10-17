from bs4 import BeautifulSoup
import json

path = r"C:\Users\HP VICTUS\.gemini\antigravity\brain\58c2ac8b-3865-4dbe-81f4-725a716efe04\scratch\step_wait_short.html"
with open(path, "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")

for s in soup.find_all("section"):
    h = s.find(["h1", "h2", "h3"])
    h_text = h.get_text(strip=True) if h else ""
    print(f"\nSection: '{h_text}' (class: {' '.join(s.get('class', []))})")
    cards = s.find_all("a")
    print(f"  Total links/cards: {len(cards)}")
    for a in cards[:6]:
        print(f"    - href: {a.get('href')} | text: {a.get_text(' ', strip=True)[:70]}")

