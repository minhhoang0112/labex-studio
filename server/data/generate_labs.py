"""Read-only catalog validation. Lesson commands are never executed on the host."""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
import subprocess
import sys

DATA = Path(__file__).resolve().parent
BLOCK = re.compile(r"```bash\s*\n(.*?)```", re.S)


def state_commands(rule):
    if rule.get("kind") == "state":
        yield rule.get("command", "")
    for check in rule.get("checks", []):
        yield from state_commands(check)


def validate_rule(rule, label, errors):
    kind = rule.get("kind")
    if kind not in ("state", "commands", "all", "acknowledgement", "unsupported", "windows-remote"):
        errors.append(f"{label}: unknown verification kind")
    if kind == "windows-remote" and (not label.startswith(("win-", "win11-")) or rule.get("rule_id") != label.split("/")[-1]):
        errors.append(f"{label}: Windows verifier must reference this exact trusted server-side step")
    if kind == "state":
        command = rule.get("command", "").strip()
        if not command or re.fullmatch(r"(?:true|:|echo ['\"]?ok['\"]?);?", command) or re.search(r"\|\|\s*(?:true|:)\s*;?\s*$", command):
            errors.append(f"{label}: missing/unconditional verifier")
    if kind == "commands" and (not rule.get("groups") or any(not group for group in rule["groups"])):
        errors.append(f"{label}: missing command groups")
    if kind == "commands" and any(pattern.strip() in ('', '.', '.*', '.+', '^', '$', '^.*$', '^.+$', '^\\s*.*$',
                                  r'^\s*[a-zA-Z0-9_\-\./]+\s*.*$',
                                  '(?:cat|ls|pwd|cd|mkdir|touch|grep|test|echo|bash|sh|python|sed|awk)')
                                  for group in rule.get("groups", []) for pattern in group):
        errors.append(f"{label}: unbounded command-history pattern")
    if kind == "acknowledgement" and rule.get("scope") != "informational":
        errors.append(f"{label}: practical acknowledgement fallback is not a grader")
    if kind == "all":
        if not rule.get("checks"):
            errors.append(f"{label}: empty combined check")
        for check in rule.get("checks", []):
            validate_rule(check, label, errors)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-shell", action="store_true")
    parser.add_argument("--smoke-linux", action="store_true")
    parser.add_argument("--bash", default="bash")
    args = parser.parse_args()
    if args.smoke_linux:
        parser.error("Host execution removed. Use node tests/source-course.smoke.mjs with the isolated runtime.")
    courses = json.loads((DATA / "courses.json").read_text(encoding="utf-8-sig"))
    labs = [json.loads(p.read_text(encoding="utf-8-sig")) for p in sorted((DATA / "labs").glob("*.json"))]
    errors = []
    course_ids = [c["id"] for c in courses]
    lab_ids = [lab["id"] for lab in labs]
    if len(set(course_ids)) != len(course_ids) or len(set(lab_ids)) != len(lab_ids):
        errors.append("Duplicate course/lab IDs")
    counts = Counter(lab["course_id"] for lab in labs)
    for course in courses:
        actual = counts[course["id"]]
        if "labs_count" in course and course["labs_count"] != actual:
            errors.append(f'{course["id"]}: stale labs_count')
        if actual:
            print(f'{course["id"]}: {actual} labs, {sum(len(l["steps"]) for l in labs if l["course_id"] == course["id"])} tasks')
    for lab in labs:
        label = lab["id"]
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", label) or not (DATA / "labs" / f"{label}.json").is_file():
            errors.append(f"{label}: invalid ID/filename")
        if lab["course_id"] not in course_ids:
            errors.append(f"{label}: unknown course")
        steps = lab.get("steps", [])
        if not steps or len({s["id"] for s in steps}) != len(steps):
            errors.append(f"{label}: missing/duplicate tasks")
        for step in steps:
            tag = f'{label}/{step.get("id")}'
            for key in ("id", "title", "content", "task", "hint"):
                if not isinstance(step.get(key), str) or not step[key].strip():
                    errors.append(f"{tag}: missing {key}")
            rule = step.get("verification") or {"kind": "state", "command": step.get("verify_command", "")}
            rules = [(tag, rule)] + [(f'{tag}@{provider}', variant) for provider, variant in step.get("verification_by_provider", {}).items()]
            for rule_tag, definition in rules:
                validate_rule(definition, rule_tag, errors)
            if args.check_shell:
                # Source Markdown may label expected output as Bash. Only our
                # trusted predicates are executable validation inputs; include
                # provider variants rather than validating unsupported bases.
                for snippet in (snippet for _, definition in rules for snippet in state_commands(definition)):
                    result = subprocess.run([args.bash, "-n"], input=snippet, text=True, encoding="utf-8", capture_output=True, timeout=10)
                    if result.returncode:
                        errors.append(f"{tag}: {result.stderr.strip()}")
        if "sections" in lab:
            tasks = [s["id"] for s in lab["sections"] if s.get("kind") == "task"]
            if tasks != [s["id"] for s in steps]:
                errors.append(f"{label}: section/task ID mismatch")
    quick = sorted([l for l in labs if l["course_id"] == "quick-start-with-linux"], key=lambda l: l.get("order", 0))
    if len(quick) != 10 or [l.get("order") for l in quick] != list(range(1, 11)):
        errors.append("Quick Start must have 10 ordered lessons")
    if sum(len(l.get("sections", [])) for l in quick) != 67 or sum(len(l["steps"]) for l in quick) != 47:
        errors.append("Quick Start must match 67 source sections / 47 tasks")
    if Counter(l.get("type") for l in quick) != {"lab": 5, "challenge": 5}:
        errors.append("Quick Start must contain 5 labs and 5 challenges")
    for error in errors:
        print("ERROR " + error, file=sys.stderr)
    if not errors:
        print(f"Catalog OK: {len(labs)} labs. No commands executed or files changed.")
    return bool(errors)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, subprocess.TimeoutExpired, ValueError, KeyError) as exc:
        print("ERROR " + str(exc), file=sys.stderr)
        raise SystemExit(1)
