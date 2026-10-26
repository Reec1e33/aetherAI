"""Capture the requests that Python LLM libraries build from each fixture.

Every request that goes through httpx or httpx2 is recorded and answered with
HTTP 400. Sockets are blocked too, so a request that takes any other path fails
instead of leaving the machine. Run one library per virtualenv, because LiteLLM and
Pydantic AI need different major versions of the openai package:

    .venv-litellm/bin/python harness/capture.py litellm captures/litellm.jsonl
"""

from __future__ import annotations

import copy
import importlib
import importlib.metadata
import json
import os
import socket
import sys
import traceback
from pathlib import Path
from typing import Any, Callable

os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"
KEY = "census-offline"
PROMPT = "Call the tool."


def block_network() -> None:
    def refuse(*args: Any, **kwargs: Any) -> Any:
        raise ConnectionRefusedError(f"census: network blocked {args[1:2] or args[:1]}")

    socket.socket.connect = refuse  # type: ignore[method-assign]
    socket.socket.connect_ex = refuse  # type: ignore[method-assign]
    socket.create_connection = refuse  # type: ignore[assignment]
    socket.getaddrinfo = refuse  # type: ignore[assignment]


SENT: list[Any] = []
ERROR_BODY = {"error": {"message": "captured offline"}}


def record_http() -> None:
    """Replace the httpx and httpx2 transports with a recorder that answers HTTP 400."""
    for name in ("httpx", "httpx2"):
        try:
            mod = importlib.import_module(name)
        except ImportError:
            continue

        def handle(self: Any, request: Any, mod: Any = mod) -> Any:
            SENT.append(request)
            return mod.Response(400, json=ERROR_BODY, request=request)

        async def handle_async(self: Any, request: Any, mod: Any = mod) -> Any:
            SENT.append(request)
            return mod.Response(400, json=ERROR_BODY, request=request)

        mod.HTTPTransport.handle_request = handle
        mod.AsyncHTTPTransport.handle_async_request = handle_async


def body_of(request: Any) -> bytes:
    try:
        return request.read()
    except Exception:
        return bytes(request.content)


def versions(*packages: str) -> str:
    return " ".join(f"{p}=={importlib.metadata.version(p)}" for p in packages)


# --- LiteLLM -----------------------------------------------------------------

LITELLM_MODELS = {
    "openai": "openai/gpt-5",
    "anthropic": "anthropic/claude-sonnet-4-5",
    "gemini": "gemini/gemini-2.5-pro",
    "bedrock": "bedrock/converse/anthropic.claude-sonnet-4-5-20250929-v1:0",
    "mistral": "mistral/mistral-large-latest",
    "groq": "groq/openai/gpt-oss-120b",
    "xai": "xai/grok-4",
}


def litellm_targets() -> list[tuple[str, str, Callable[[dict], None]]]:
    import litellm

    def make(model: str) -> Callable[[dict], None]:
        def send(fx: dict) -> None:
            litellm.completion(
                model=model,
                messages=[{"role": "user", "content": PROMPT}],
                tools=[{"type": "function", "function": fx["tool"]}],
                api_key=KEY,
                aws_access_key_id=KEY,
                aws_secret_access_key=KEY,
                aws_region_name="us-east-1",
                num_retries=0,
                max_retries=0,
            )

        return send

    return [(p, m, make(m)) for p, m in LITELLM_MODELS.items()]


# --- Pydantic AI -------------------------------------------------------------


def pydantic_ai_targets() -> list[tuple[str, str, Callable[[dict], None]]]:
    from pydantic_ai import Agent, Tool
    from pydantic_ai.models.anthropic import AnthropicModel
    from pydantic_ai.models.google import GoogleModel
    from pydantic_ai.models.openai import OpenAIChatModel
    from pydantic_ai.providers.anthropic import AnthropicProvider
    from pydantic_ai.providers.google import GoogleProvider
    from pydantic_ai.providers.openai import OpenAIProvider

    def make(build_model: Callable[[], Any]) -> Callable[[dict], None]:
        def send(fx: dict) -> None:
            t = fx["tool"]
            tool = Tool.from_schema(lambda **_: None, name=t["name"], description=t["description"], json_schema=t["parameters"])
            Agent(build_model(), tools=[tool]).run_sync(PROMPT)

        return send

    return [
        ("openai-chat", "gpt-5", make(lambda: OpenAIChatModel("gpt-5", provider=OpenAIProvider(api_key=KEY)))),
        ("anthropic", "claude-sonnet-4-5", make(lambda: AnthropicModel("claude-sonnet-4-5", provider=AnthropicProvider(api_key=KEY)))),
        ("gemini", "gemini-2.5-pro", make(lambda: GoogleModel("gemini-2.5-pro", provider=GoogleProvider(api_key=KEY)))),
    ]


# --- LangChain ---------------------------------------------------------------


def langchain_targets() -> list[tuple[str, str, Callable[[dict], None]]]:
    from langchain_google_genai import ChatGoogleGenerativeAI

    def send(fx: dict) -> None:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", google_api_key=KEY, max_retries=0)
        llm.bind_tools([{"type": "function", "function": fx["tool"]}]).invoke(PROMPT)

    return [("gemini", "gemini-2.5-pro", send)]


LIBRARIES = {
    "litellm": (litellm_targets, ("litellm",)),
    "pydantic-ai": (pydantic_ai_targets, ("pydantic-ai-slim", "google-genai", "openai", "anthropic")),
    "langchain": (langchain_targets, ("langchain-google-genai", "langchain-core", "google-genai")),
}


def capture(library: str, out_path: Path) -> None:
    block_network()
    record_http()
    build, packages = LIBRARIES[library]
    version = versions(*packages)
    fixtures = [json.loads(p.read_text()) for p in sorted(FIXTURES.glob("*.json"))]
    out = out_path.open("w")
    for provider, model, send in build():
        target = {
            "id": f"{library}/{provider}",
            "library": library,
            "libraryVersion": version,
            "provider": provider,
            "model": model,
        }
        for fx in fixtures:
            SENT.clear()
            error = None
            try:
                # A fresh copy per target: LiteLLM's Gemini path rewrites the tool dict in
                # place (BerriAI/litellm#46921), which would leak into every later target.
                send(copy.deepcopy(fx))
            except Exception as exc:  # the 400 always raises; keep the text for client-side failures
                error = "".join(traceback.format_exception_only(exc)).strip()

            sent = next((r for r in SENT if body_of(r).strip().startswith(b"{")), None)
            if sent is not None:
                line = {"target": target, "fixtureId": fx["id"], "status": "sent", "url": str(sent.url), "body": json.loads(body_of(sent))}
            else:
                line = {"target": target, "fixtureId": fx["id"], "status": "client_error", "error": error or "no request"}
            out.write(json.dumps(line) + "\n")
    out.close()


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in LIBRARIES:
        sys.exit(f"usage: capture.py {{{','.join(LIBRARIES)}}} OUT.jsonl")
    capture(sys.argv[1], Path(sys.argv[2]))
