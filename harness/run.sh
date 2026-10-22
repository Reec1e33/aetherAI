#!/usr/bin/env bash
# Re-run every capture and the evaluation. Offline: no API keys, no network calls to providers.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p captures
pnpm -s census capture ai-sdk captures/ai-sdk.jsonl

export PYDANTIC_AI_NO_BANNER=1
for lib in litellm pydantic-ai langchain; do
  if [ ! -x ".venv-$lib/bin/python" ]; then
    python3 -m venv ".venv-$lib"
    ".venv-$lib/bin/pip" install -q -r "harness/requirements/$lib.lock"
  fi
  ".venv-$lib/bin/python" harness/capture.py "$lib" "captures/$lib.jsonl" > /dev/null
  echo "captured $lib"
done

pnpm -s census evaluate captures results
