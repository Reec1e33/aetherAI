# Contribute to AetherAI

Thank you for your interest in AetherAI. This document tells you how to report a bug, suggest a change, and send a pull request.

## Project status

AetherAI started as a [SpartaHack X](https://spartahack.com) project in February 2025. The project is now in a full rewrite as an open-source research project. The setup steps for the new code will go in this document when the new code is on `main`.

## Code of conduct

This project uses the [Contributor Covenant](CODE_OF_CONDUCT.md). When you take part in this project, you agree to obey its rules.

## Report a bug

> **Caution:** Do not report a security vulnerability in a public issue. Use the process in [SECURITY.md](SECURITY.md).

1. Search the [open issues](https://github.com/Reec1e33/aetherAI/issues). Make sure that nobody reported the same bug.
2. Open a new issue with the **Bug report** form.
3. Give the steps to reproduce the bug, the expected result, and the actual result.

## Suggest a change

- For a small fix, send a pull request directly. Examples of a small fix are a typo, a broken link, or a one-line bug fix.
- For a large change, open an issue first. Examples of a large change are a new feature, a new experiment, or a change to the evaluation method.
- Wait for agreement on the issue before you write the code. This step prevents work that the project cannot accept.

## Send a pull request

1. Fork the repository.
2. Make a branch from `main`. Give the branch a short name that tells its purpose, for example `fix/empty-query`.
3. Make one logical change in each pull request.
4. Add or update the tests for the change.
5. Run the tests and the linters on your machine. Make sure that they pass.
6. Open the pull request against `main`, and fill in the pull request template.
7. Link the related issue, for example `Closes #12`.

The maintainer reviews each pull request. All CI checks must pass before the merge.

## Research contributions

AetherAI is a research project. Each change to an experiment must be reproducible.

- Record the model names and versions, the prompts, the random seeds, and the dataset version.
- Put the experiment configuration in the repository. Do not put it only in the pull request text.
- Report all results, including negative results. Do not remove a run because its result is bad.

> **Caution:** Do not commit API keys, `.env` files, or private data.

## Commit messages

- Write the subject line as a command, for example "Add judge retry". Do not write "Added judge retry".
- Use a maximum of 72 characters in the subject line.
- Use the commit body to tell why you made the change.

## License

When you send a contribution, you agree to license it under the [MIT License](LICENSE).
