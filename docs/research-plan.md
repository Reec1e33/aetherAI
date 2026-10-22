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

## Method (draft)

**Endpoints.** About five direct providers (OpenAI, Anthropic, Gemini, Bedrock, and one open-weight host) and three gateways (LiteLLM, OpenRouter, Vercel AI Gateway). One flagship model each, pinned by exact model ID and run date.

**Fixtures.** Two kinds:

- Per-keyword probes: `enum`, `pattern`, `minimum`/`maximum`, `minLength`/`maxLength`, `format`, `anyOf`/`oneOf`, `$ref`/`$defs`, the different ways to write a nullable field, nested arrays, `additionalProperties`.
- Fixtures copied from real issues, like the ones above.

**Classifying a result.** The hard part is telling "the endpoint dropped the constraint" apart from "the model ignored a constraint it was given". Two ways in:

- *Inspect the request.* For gateways and SDKs, capture what actually goes out to the provider (the same trick LiteLLM #43325 uses with a mocked network). If the constraint isn't in the outgoing request, that's a drop, no model call needed.
- *Check the behavior.* Use a prompt that pushes toward a value the original schema forbids, then validate the returned arguments against the original schema. Strict mode on/off where the provider has it, as a control.

**Waves.** Run once, then again after the next major model or SDK release, to see what changed.

**Budget.** Well under $500 total. Low request volume per endpoint.

## Open questions

- How many samples per cell does the behavioral check need before a difference means anything?
- Is request inspection possible for every gateway, or only the open-source ones?
- Provider terms of service for this kind of probing. Should be fine at this volume, but worth checking before wave 1.

## Rough timeline

- **Late October:** harness core, adapters for two endpoints, ~15 fixtures from real issues.
- **Mid November:** reality check. If nobody who maintains a gateway or SDK finds the fixtures or the results useful, rethink the scope before spending more.
- **November–December:** wave 1 across all endpoints, a results page, issues and PRs upstream where the data shows a bug.
- **After the next big release:** wave 2, then a short paper.
