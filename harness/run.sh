#!/usr/bin/env bash
# Re-run every capture and the evaluation. Offline: no API keys, no network calls to providers.
#
#   ./harness/run.sh            headline run (captures/, results/) and the model sweep
#                               (captures/models/, results/models/)
#   ./harness/run.sh --check    also re-run each Python library with its targets in
#                               reverse order, and fail if any request changes
set -euo pipefail
cd "$(dirname "$0")/.."

PYTHON="${PYTHON:-python3}"
LIBS=(litellm pydantic-ai langchain)
export PYDANTIC_AI_NO_BANNER=1

for lib in "${LIBS[@]}"; do
  if [ ! -x ".venv-$lib/bin/python" ]; then
    "$PYTHON" -m venv ".venv-$lib"
    ".venv-$lib/bin/pip" install -q -r "harness/requirements/$lib.lock"
  fi
done

mkdir -p captures/models
pnpm -s census capture ai-sdk captures/ai-sdk.jsonl
pnpm -s census capture ai-sdk captures/models/ai-sdk.jsonl --all-models
for lib in "${LIBS[@]}"; do
  ".venv-$lib/bin/python" harness/capture.py "$lib" "captures/$lib.jsonl" > /dev/null
  ".venv-$lib/bin/python" harness/capture.py "$lib" "captures/models/$lib.jsonl" --all-models > /dev/null
  echo "captured $lib"
done

pnpm -s census evaluate captures results
pnpm -s census evaluate captures/models results/models
"$PYTHON" harness/model_table.py

if [ "${1:-}" = "--check" ]; then
  tmp="$(mktemp -d)"
  for lib in "${LIBS[@]}"; do
    ".venv-$lib/bin/python" harness/capture.py "$lib" "$tmp/$lib.jsonl" --reverse > /dev/null
    if ! diff -q <(sort "captures/$lib.jsonl") <(sort "$tmp/$lib.jsonl") > /dev/null; then
      echo "$lib: requests change when the targets run in reverse order" >&2
      exit 1
    fi
  done
  echo "target order does not change any request"
fi
