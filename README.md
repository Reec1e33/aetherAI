# Aether census

A tool definition that works with one LLM provider can fail with another. Sometimes the provider rejects the schema. Sometimes a gateway removes part of the schema, for example an `enum` or a `minimum`, and still returns HTTP 200. The application then gets arguments that the schema does not permit.

Aether census measures this. It sends the same tool definitions to several providers and gateways and records the result for each one:

| Outcome         | Meaning                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `accept`        | The endpoint took the schema, and the model's call obeyed every keyword.                       |
| `reject`        | The endpoint returned an error for the schema.                                                 |
| `silent_drop`   | The endpoint returned success but ignored part of the schema.                                  |
| `semantic_loss` | A sanitizer changed the schema into a weaker one, for example `anyOf` cut to its first member. |

## Status

Pre-alpha. The fixture format and the fixture checks work. The probe runner and the endpoint adapters do not exist yet. This project has no results yet.

## Use

Node 22 or later and pnpm are necessary.

```sh
pnpm install
pnpm test
pnpm census fixtures validate
```

## Fixtures

Each file in [`fixtures/`](fixtures/) holds one tool definition and the parts of its schema that must survive. `expect.preserved` lists JSON Pointers into `tool.parameters`. The checks make sure that each pointer exists.

```json
{
  "id": "enum-string",
  "description": "A string parameter limited by enum.",
  "source": { "kind": "synthetic" },
  "keywords": ["enum"],
  "tool": { "name": "get_weather", "description": "...", "parameters": { "...": "..." } },
  "expect": { "preserved": ["/properties/unit/enum"] }
}
```

A fixture from a real failure uses `"source": { "kind": "issue", "url": "https://github.com/..." }`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## History

This repository started as AetherAI, a SpartaHack X hackathon project from February 2025, by Reece Roskam and Tanzil Zubair Bin Zaman. The v1 code is at the [`spartahack-2025`](https://github.com/Reec1e33/aetherAI/tree/spartahack-2025) tag. v1 showed a "time saved" value: the ratio of two answer lengths, multiplied by 20 seconds. That value did not measure saved time, and it is not valid.

## License

MIT. See [LICENSE](LICENSE).
