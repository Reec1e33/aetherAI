# Contributing

Thanks for taking a look. The project is early, so small, concrete contributions help the most.

## Setup

Needs Node 22+, pnpm, and Python 3.12+.

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
./harness/run.sh   # re-run every capture and rebuild results/
```

`pnpm format` fixes formatting.

## Adding a fixture

This is the best first contribution. If you've seen a provider or gateway reject or quietly change a tool schema:

1. Cut the tool definition down to the smallest one that still shows the problem.
2. Save it as `fixtures/<id>.json`. The id is kebab-case and matches the file name.
3. Set `source` to `{ "kind": "issue", "url": "..." }`, pointing at a public issue or discussion.
4. Add `valid`: one or more argument objects the schema accepts.
5. Add `cases`: for each constraint under test, a JSON Pointer to it and an argument object that breaks only that constraint.
6. Run `pnpm census fixtures validate`. It tells you if a bad object also breaks something else.

Please don't paste schemas from private codebases.

## Adding a library

Captures live in `src/capture/` (TypeScript) and `harness/capture.py` (Python). A new target needs to build a real request for each fixture without touching the network, and record it in the shared capture format (`src/capture/types.ts`). Python libraries get their own lockfile in `harness/requirements/`. Each target lists its models: the first is the headline model, the rest run with `--all-models`. Open an issue first so we can agree on which code path and models to use.

## Bigger changes

Open an issue first for anything beyond a fixture or a small fix: new endpoint adapters, changes to how outcomes get classified, anything that would change results. It saves both of us time.

## Pull requests

- One change per PR, with tests.
- CI runs lint, typecheck, tests, and the whole census offline (`./harness/run.sh --check`). If your change moves a result, commit the new captures and results with it. CI never makes paid API calls.
- Live probes run on your machine with your own keys. Commit the run config and the raw results, never the keys.
- Results you don't like get reported too. A run doesn't get dropped because it came out "wrong".

## Security

If you find a silent drop with security impact in a provider or gateway, report it to that project privately first. For problems in this repo, see [SECURITY.md](SECURITY.md).

## AI tools

Fine to use. You're responsible for understanding and testing everything you submit, and please write your own replies in review.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).

## License

Contributions are licensed under [MIT](LICENSE).
