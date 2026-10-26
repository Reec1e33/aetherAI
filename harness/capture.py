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


# --- Targets -----------------------------------------------------------------
#
# Each target is (provider, model names, make), where make(name) returns a function
# that sends one fixture. The first name is the headline model; the others are only
# used with --all-models, to check whether the library changes the schema by model.

Send = Callable[[dict], None]
TargetSpec = tuple[str, list[str], Callable[[str], Send]]


# --- LiteLLM -----------------------------------------------------------------

LITELLM_MODELS = {
    "openai": ("openai/", ["gpt-5", "gpt-4.1", "o3", "gpt-5.2"]),
    "anthropic": ("anthropic/", ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-sonnet-5-5", "claude-opus-5-5"]),
    "gemini": ("gemini/", ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-3.1-pro-preview", "gemini-3.8-flash"]),
    "bedrock": (
        "bedrock/converse/",
        [
            "anthropic.claude-sonnet-4-5-20250929-v1:0",
            "anthropic.claude-sonnet-5-5",
            "amazon.nova-pro-v1:0",
            "mistral.mistral-large-2407-v1:0",
        ],
    ),
    "mistral": ("mistral/", ["mistral-large-latest", "mistral-small-latest", "codestral-latest", "magistral-medium-latest"]),
    "groq": ("groq/", ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]),
    "xai": ("xai/", ["grok-4", "grok-4.20", "grok-4.7"]),
}


def litellm_targets() -> list[TargetSpec]:
    import litellm

    def make_for(prefix: str) -> Callable[[str], Send]:
        def make(name: str) -> Send:
            def send(fx: dict) -> None:
                litellm.completion(
                    model=prefix + name,
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

        return make

    return [(p, names, make_for(prefix)) for p, (prefix, names) in LITELLM_MODELS.items()]


def litellm_model_field(provider: str, name: str) -> str:
    return LITELLM_MODELS[provider][0] + name


# --- Pydantic AI -------------------------------------------------------------

PYDANTIC_AI_MODELS = {
    "openai-chat": ["gpt-5", "gpt-4.1", "o3", "gpt-5.2"],
    "anthropic": ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-sonnet-5-5", "claude-opus-5-5"],
    "gemini": ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-3.1-pro-preview", "gemini-3.8-flash"],
}


def pydantic_ai_targets() -> list[TargetSpec]:
    from pydantic_ai import Agent, Tool
    from pydantic_ai.models.anthropic import AnthropicModel
    from pydantic_ai.models.google import GoogleModel
    from pydantic_ai.models.openai import OpenAIChatModel
    from pydantic_ai.providers.anthropic import AnthropicProvider
    from pydantic_ai.providers.google import GoogleProvider
    from pydantic_ai.providers.openai import OpenAIProvider

    builders: dict[str, Callable[[str], Any]] = {
        "openai-chat": lambda m: OpenAIChatModel(m, provider=OpenAIProvider(api_key=KEY)),
        "anthropic": lambda m: AnthropicModel(m, provider=AnthropicProvider(api_key=KEY)),
        "gemini": lambda m: GoogleModel(m, provider=GoogleProvider(api_key=KEY)),
    }

    def make_for(build_model: Callable[[str], Any]) -> Callable[[str], Send]:
        def make(name: str) -> Send:
            def send(fx: dict) -> None:
                t = fx["tool"]
                tool = Tool.from_schema(lambda **_: None, name=t["name"], description=t["description"], json_schema=t["parameters"])
                Agent(build_model(name), tools=[tool]).run_sync(PROMPT)

            return send

        return make

    return [(p, PYDANTIC_AI_MODELS[p], make_for(b)) for p, b in builders.items()]


# --- LangChain ---------------------------------------------------------------

LANGCHAIN_MODELS = {
    "gemini": ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-3.1-pro-preview", "gemini-3.8-flash"],
}


def langchain_targets() -> list[TargetSpec]:
    from langchain_google_genai import ChatGoogleGenerativeAI

    def make(name: str) -> Send:
        def send(fx: dict) -> None:
            llm = ChatGoogleGenerativeAI(model=name, google_api_key=KEY, max_retries=0)
            llm.bind_tools([{"type": "function", "function": fx["tool"]}]).invoke(PROMPT)

        return send

    return [("gemini", LANGCHAIN_MODELS["gemini"], make)]


LIBRARIES = {
    "litellm": (litellm_targets, ("litellm",)),
    "pydantic-ai": (pydantic_ai_targets, ("pydantic-ai-slim", "google-genai", "openai", "anthropic")),
    "langchain": (langchain_targets, ("langchain-google-genai", "langchain-core", "google-genai")),
}


def capture(library: str, out_path: Path, all_models: bool = False, reverse: bool = False) -> None:
    """Capture every fixture for every target of one library.

    all_models: also run the extra models, with the model name in the target id.
    reverse: run the targets in reverse order. The output must not change (apart
    from line order); CI checks this, so state can't leak from one target to the next.
    """
    block_network()
    record_http()
    build, packages = LIBRARIES[library]
    version = versions(*packages)
    fixtures = [json.loads(p.read_text()) for p in sorted(FIXTURES.glob("*.json"))]
    runs = [(provider, name, make) for provider, names, make in build() for name in (names if all_models else names[:1])]
    if reverse:
        runs.reverse()
    out = out_path.open("w")
    for provider, name, make in runs:
        send = make(name)
        target = {
            "id": f"{library}/{provider}@{name}" if all_models else f"{library}/{provider}",
            "library": library,
            "libraryVersion": version,
            "provider": provider,
            "model": litellm_model_field(provider, name) if library == "litellm" else name,
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
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    if len(args) != 2 or args[0] not in LIBRARIES or not flags <= {"--all-models", "--reverse"}:
        sys.exit(f"usage: capture.py {{{','.join(LIBRARIES)}}} OUT.jsonl [--all-models] [--reverse]")
    capture(args[0], Path(args[1]), all_models="--all-models" in flags, reverse="--reverse" in flags)
