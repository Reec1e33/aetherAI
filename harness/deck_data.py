"""Write the chart data in docs/deck.html from results/results.json.

    python3 harness/deck_data.py

Replaces the JSON inside <script id="census-data">, so every number the deck
shows comes from the latest census run.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIBRARIES = {"ai-sdk": "AI SDK", "litellm": "LiteLLM", "pydantic-ai": "Pydantic AI", "langchain": "LangChain"}
PROVIDERS = {
    "openai": "OpenAI",
    "openai-chat": "OpenAI Chat",
    "anthropic": "Anthropic",
    "gemini": "Gemini",
    "bedrock": "Bedrock",
    "mistral": "Mistral",
    "groq": "Groq",
    "xai": "xAI",
}
GEMINI_PATHS = ["ai-sdk/gemini", "pydantic-ai/gemini", "litellm/gemini", "langchain/gemini"]


def label(target_id: str) -> dict:
    library, provider = target_id.split("/", 1)
    return {"library": LIBRARIES[library], "provider": PROVIDERS[provider]}


def main() -> None:
    report = json.loads((ROOT / "results/results.json").read_text())
    rows = report["rows"]
    total = report["caseCount"]

    bars = []
    for target in report["targets"]:
        mine = [r for r in rows if r["targetId"] == target["id"]]
        bars.append(
            {
                "id": target["id"],
                **label(target["id"]),
                "kept": sum(c["enforced"] for r in mine for c in r["cases"]),
                "broken": sum(1 for r in mine if r["validRejected"]),
                "version": target["libraryVersion"],
            }
        )
    bars.sort(key=lambda b: (-b["kept"], b["broken"], b["library"], b["provider"]))

    matrix = []
    by_key = {(r["targetId"], r["fixtureId"]): r for r in rows}
    fixture_ids = sorted({r["fixtureId"] for r in rows})
    for fixture_id in fixture_ids:
        first = by_key[(GEMINI_PATHS[0], fixture_id)]
        for i, case in enumerate(first["cases"]):
            matrix.append(
                {
                    "fixture": fixture_id,
                    "keyword": case["keyword"],
                    "kept": [by_key[(t, fixture_id)]["cases"][i]["enforced"] for t in GEMINI_PATHS],
                }
            )

    data = {
        "total": total,
        "fixtures": report["fixtureCount"],
        "targets": len(report["targets"]),
        "bars": bars,
        "geminiPaths": [label(t) | {"id": t} for t in GEMINI_PATHS],
        "matrix": matrix,
    }

    deck = ROOT / "docs/deck.html"
    html = deck.read_text()
    blob = json.dumps(data, separators=(",", ":"))
    html, n = re.subn(
        r'(<script id="census-data" type="application/json">)(.*?)(</script>)',
        lambda m: m.group(1) + blob + m.group(3),
        html,
        flags=re.S,
    )
    if n != 1:
        raise SystemExit("docs/deck.html has no census-data script block")
    deck.write_text(html)
    print(f"wrote {len(bars)} bars and {len(matrix)} matrix rows into {deck.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
