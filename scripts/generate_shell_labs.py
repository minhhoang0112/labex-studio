"""Generate Shell lessons from reviewed public functional requirements.

Explanations and graders are locally authored; private source graders are unknown.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def generate():
    from shell_reviewed_early import generate as early
    from shell_reviewed_later import generate as later
    early()
    later()
    subsets = []
    for name in ("early", "later"):
        file = ROOT / f"tests/scenarios/shell-reviewed-{name}.json"
        plan = json.loads(file.read_text(encoding="utf-8"))
        plan["source_plan"] = "tests/scenarios/shell-reviewed-course.json"
        file.write_text(json.dumps(plan, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
        subsets.append(plan)
    canonical = {"version": 1, "course_id": "shell-for-beginners", "provider": "docker",
                 "expected_tasks": sum(p["expected_tasks"] for p in subsets),
                 "lessons": [lesson for p in subsets for lesson in p["lessons"]]}
    (ROOT / "tests/scenarios/shell-reviewed-course.json").write_text(
        json.dumps(canonical, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"Reviewed Shell: {len(canonical['lessons'])} lessons / {canonical['expected_tasks']} tasks.")


if __name__ == "__main__":
    generate()
