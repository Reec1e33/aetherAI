"""Compare the scores in two results.json files and print a Markdown table.

    python3 harness/compare_scores.py OLD.json NEW.json

Exits 1 if any target's score changed, or a target is missing from either file.
Version strings are shown but not compared, so a new release with the same
behavior still passes.
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path


def scores(path: Path) -> tuple[dict[str, tuple[int, int]], dict[str, str], int]:
    report = json.loads(path.read_text())
    kept: dict[str, int] = defaultdict(int)
    altered: dict[str, int] = defaultdict(int)
    for r in report["rows"]:
        kept[r["targetId"]] += sum(c["enforced"] for c in r["cases"])
        altered[r["targetId"]] += 1 if r["validRejected"] else 0
    versions = {t["id"]: t["libraryVersion"] for t in report["targets"]}
    return {t: (kept[t], altered[t]) for t in versions}, versions, report["caseCount"]


def main(old_path: str, new_path: str) -> int:
    old, old_versions, total = scores(Path(old_path))
    new, new_versions, _ = scores(Path(new_path))
    changed = 0
    lines = [
        f"| Target | Committed, of {total} | Newest, of {total} | Newest versions |",
        "| --- | --- | --- | --- |",
    ]
    for target in sorted(old.keys() | new.keys()):
        a, b = old.get(target), new.get(target)
        same = a == b
        changed += 0 if same else 1
        fmt = lambda s: "missing" if s is None else f"{s[0]} kept, {s[1]} stricter"  # noqa: E731
        mark = "" if same else " **changed**"
        lines.append(f"| `{target}` | {fmt(a)} | {fmt(b)}{mark} | {new_versions.get(target, '')} |")
    head = "No score changed." if changed == 0 else f"{changed} target(s) changed. Update the committed results."
    print(f"## Census on the newest releases\n\n{head}\n\n" + "\n".join(lines))
    return 0 if changed == 0 else 1


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: compare_scores.py OLD.json NEW.json")
    sys.exit(main(sys.argv[1], sys.argv[2]))
