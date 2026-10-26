# Research plan

Working notes. These will change as results come in.

## The question

Write once, call anywhere? If you define a tool once with JSON Schema and send it to different providers and gateways, how much of that schema actually gets enforced?

Broken down:

1. **Rejections.** Which keywords make which endpoints return an error?
2. **Silent drops.** Which keywords get accepted and then not enforced?
3. **Sanitizer loss.** When a gateway or SDK rewrites a schema so a provider will take it, how much meaning gets lost?
4. **Declared vs. actual.** Do published capability flags (LiteLLM's model metadata, models.dev, the AI SDK's provider flags) match what the endpoints really do?

## Why it isn't answered yet

- [JSONSchemaBench](https://arxiv.org/abs/2501.10868) measures structured-output support in constrained-decoding engines and a few APIs against ~10k real schemas. It's the closest thing, but it isn't about tool parameters, and it doesn't cover gateways.
- Mastra wrote up per-provider tool-schema problems in their [MCP tool compatibility layer post](https://mastra.ai/blog/mcp-tool-compatibility-layer) and ship fixes in [`@mastra/schema-compat`](https://www.npmjs.com/package/@mastra/schema-compat). That's a fix layer for their framework, not a public dataset that gets re-run when providers change.
- Everything else is scattered across issue trackers, one bug at a time:
  - [LiteLLM #43325](https://github.com/BerriAI/litellm/issues/43325): Gemini/Vertex tool schemas lose `enum`, `pattern`, and min/max on fields typed `["string", "null"]`.
  - [LiteLLM #37720](https://github.com/BerriAI/litellm/issues/37720): the zai provider drops `response_format`, so GLM models can't do structured output.
  - [LiteLLM #29168](https://github.com/BerriAI/litellm/issues/29168): the proxy stopped dropping `minimum`/`maximum` on Bedrock (a regression in the other direction).
  - [Composio #4518](https://github.com/ComposioHQ/composio/issues/4518): a remote MCP tool schema rejected by Vertex AI.
  - [google_workspace_mcp #1099](https://github.com/taylorwilsdon/google_workspace_mcp/issues/1099): Gemini 400s on Workspace MCP tool schemas.
  - [anthropic-sdk-python #1185](https://github.com/anthropics/anthropic-sdk-python/issues/1185): "compiled grammar is too large" on complex schemas.
  - [LibreChat #13623](https://github.com/danny-avila/LibreChat/pull/13623): a sanitizer for MCP tool schemas on Gemini/Vertex.
  - [vercel/ai #20717](https://github.com/vercel/ai/issues/20717): capability flags for Claude on Vertex out of date.

## What the first run did (2026-10-22)

The first run covers the **library layer only**: what the SDK or gateway puts on the wire. It needs no API keys, so anyone can reproduce it.

- 28 fixtures, 34 constraint cases. Each case is checked to fail only because of its own constraint (remove that keyword and the bad value passes).
- 19 targets: the AI SDK with 8 providers, LiteLLM with 7, Pydantic AI with 3, LangChain's Google package.
- Requests are caught before they leave the machine. Python sockets are blocked outright after an early version of the harness let a few requests through to OpenAI and Google with a fake key (they were rejected, and no real key or data was involved, but "probably offline" isn't good enough).
- Each library gets its own virtualenv with locked dependencies. LiteLLM and Pydantic AI can't share one (different major versions of `openai`), and Pydantic AI 2.59 breaks with `anthropic` 2.x ([pydantic-ai #10923](https://github.com/pydantic/pydantic-ai/issues/10923)), so that env pins `anthropic==1.17.0`.
- Each target gets a fresh copy of each fixture. The first version didn't, and LiteLLM's Gemini path rewrites the tool dict in place ([LiteLLM #46921](https://github.com/BerriAI/litellm/issues/46921)), so the LiteLLM targets that ran after Gemini were judged on the Gemini version. Fixed on 2026-10-26 (see the README's Corrections section). CI now re-runs every Python capture in reverse target order and fails if any request changes, which catches this kind of leak.
- Model names. Each path also runs with two or three more models per provider (72 library and model pairs). Only LiteLLM → Bedrock depends on the model: it keeps `additionalProperties: false` for Claude Sonnet 4.5 and drops it for Claude Sonnet 5.5, Nova Pro and Mistral Large. See [`results/models/by-model.md`](../results/models/by-model.md).
- CI runs the whole census from a clean checkout on every push. A weekly job runs it on the newest release of each library and fails if a score changes, so the committed results can't go stale silently.

Results are in [`results/summary.md`](../results/summary.md) and summarized in the README. The short version: the AI SDK passes schemas through untouched; every library that *converts* schemas for Gemini loses a lot (LangChain keeps 14 of 34, LiteLLM 18); and some paths make schemas stricter or unsatisfiable, which is harder to notice than a drop.

## Next

**Wave 2: does the provider honor what it receives?** The library layer is half the story. For each provider, send the schemas with real keys and a prompt that pushes toward a forbidden value, then validate the returned arguments against the original schema. Strict mode on and off where it exists. This is where the money goes, so keep it to flagship models and a few samples per cell.

**Upstream.** The two cases with no existing issue are filed, each with an offline reproduction: [pydantic-ai #11419](https://github.com/pydantic/pydantic-ai/issues/11419) (`minProperties` + `additionalProperties: false`) and [langchain-google #2085](https://github.com/langchain-ai/langchain-google/issues/2085) (type arrays become `STRING`). Still to do: add census data to the existing issues where it helps. The weekly run on the newest releases shows when a fix lands.

**More libraries.** LangChain's OpenAI and Anthropic packages, Mastra, the OpenAI Agents SDK, and Spring AI or LangChain4j if someone wants to own a JVM harness.

## Open questions

- How many samples per cell does the wave-2 behavioral check need before a difference means anything?
- Is a library dropping a keyword the provider can't handle a bug, or the right call? Probably depends on whether it tells you. Worth tracking warnings separately.
- Why does LiteLLM → Bedrock keep `additionalProperties: false` for one Claude model and not another? Probably per-model metadata in LiteLLM; worth tracing before filing anything.
- Provider terms of service for wave 2 probing. Should be fine at low volume, but check first.
