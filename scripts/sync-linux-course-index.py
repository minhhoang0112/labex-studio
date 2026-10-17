"""Fetch factual public Linux syllabi; never starts a VM or downloads lesson prose."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
ALIASES = [
    "quick-start-with-linux", "become-a-junior-system-administrator", "linux-for-noobs",
    "linux-basic-commands-practice-online", "shell-for-beginners", "comptia-linux-plus-training-labs",
    "linux-security-for-devsecops", "linux-practice-challenges",
]


def fetch_course(alias):
    url = f"https://labex.io/api/v2/courses/{alias}/labs"
    with urlopen(Request(url, headers={"User-Agent": "LabEx-Local-Syllabus-Review/1.0"}), timeout=30) as response:
        raw = json.load(response)
    stages = []
    position = 0
    for stage in raw["stages"]:
        lessons = []
        for lab in stage["labs"]:
            if lab.get("hidden"):
                continue
            position += 1
            lessons.append({"source_lab_id": lab["id"], "alias": lab["alias"], "title": lab["name"],
                            "order": position, "type": "challenge" if lab.get("type") == 1 else "lab",
                            "difficulty": lab.get("difficulty"), "estimated_minutes": lab.get("time"),
                            "source_url": f'https://labex.io/tutorials/{lab["alias"]}'})
        stages.append({"name": stage["name"], "labs": lessons})
    return {"id": alias, "source_url": f"https://labex.io/courses/{alias}", "api_url": url,
            "source_labs_count": position, "stages": stages}


def main():
    with ThreadPoolExecutor(max_workers=4) as pool:
        courses = list(pool.map(fetch_course, ALIASES))
    result = {"version": 1, "observed_at": datetime.now(timezone.utc).isoformat(),
              "source_url": "https://labex.io/learn/linux", "scope": "Public syllabus metadata only; no VM launches or private graders.",
              "source_order": ALIASES, "courses": courses}
    target = ROOT / "server/data/reference/linux-course-index.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for course in courses:
        print(f'{course["id"]}: {course["source_labs_count"]} source lessons')
    print("TOTAL", sum(c["source_labs_count"] for c in courses))


if __name__ == "__main__":
    main()
