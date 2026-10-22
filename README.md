# aether-census

Does your tool schema survive the trip to the model?

You write one JSON Schema for a tool, then send it through OpenAI, Anthropic, Gemini, Bedrock, or a gateway like LiteLLM or OpenRouter. Somewhere along the way it can get rejected, which is the easy case because you get an error. Or it can get quietly rewritten, which is the bad case.

A real example from LiteLLM ([#43325](https://github.com/BerriAI/litellm/issues/43325)). This nullable field:

```json
{ "type": ["string", "null"], "enum": ["open", "closed"], "maxLength": 6 }
```

goes out to Gemini as:

```json
{ "anyOf": [{ "type": "string" }, { "type": "null" }] }
```

The enum and the length limit are gone. Nothing errors, nothing gets logged, and nothing on the provider side stops the model from sending `"status": "archived"`.

Issue trackers are full of one-off reports like this (a list is in [docs/research-plan.md](docs/research-plan.md)). What I couldn't find is a systematic answer to: across the main providers and gateways, which schema keywords make it through, which get rejected, and which get dropped without a word? That's what this repo is for.

## What it records

For every fixture and endpoint pair, one of:

| Outcome | Meaning |
| --- | --- |
| `accept` | The schema went through and the model's arguments respected it. |
| `reject` | The endpoint returned an error for the schema. |
| `silent_drop` | The endpoint returned success but ignored part of the schema. |
| `semantic_loss` | Something rewrote the schema into a weaker one, e.g. `anyOf` cut down to its first branch. |

## Status

Early. The fixture format, its validation, and a small CLI are done. The probe runner and the provider adapters are next. There are no results yet, and none will go up until they can be reproduced from this repo.

## Try it

Needs Node 22+ and pnpm.

```sh
pnpm install
pnpm test
pnpm census fixtures validate
```

## Fixtures

Each file in [`fixtures/`](fixtures/) is one tool definition plus the constraints that should still hold on the other side:

```json
{
  "id": "nullable-type-array-enum",
  "source": { "kind": "issue", "url": "https://github.com/BerriAI/litellm/issues/43325" },
  "keywords": ["type-array", "enum", "maxLength"],
  "tool": { "name": "set_status", "parameters": { "...": "..." } },
  "expect": { "preserved": ["/properties/status/enum", "/properties/status/maxLength"] }
}
```

`expect.preserved` is a list of JSON Pointers into the schema. The validator checks that each one exists, so a typo can't turn into a fake pass.

If you've hit a provider or gateway mangling a tool schema, a fixture for it is the most useful thing you can contribute. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Background

This repo used to be AetherAI, a SpartaHack X project that Tanzil Zubair Bin Zaman and I built in February 2025. It rewrote your prompt with GPT-4 and showed both answers side by side, along with a "time saved" number that was really just the ratio of the two answer lengths times 20 seconds. That number didn't measure anything. The old code is at the [`spartahack-2025`](https://github.com/Reec1e33/aetherAI/tree/spartahack-2025) tag.

## License

MIT
