#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { captureAiSdk } from "./capture/aisdk.js";
import type { Capture } from "./capture/types.js";
import { evaluate } from "./evaluate.js";
import { loadFixtures } from "./fixtures.js";
import { renderSummary } from "./report.js";

const USAGE = `Usage: census <command>

Commands:
  fixtures validate [dir]          Check fixture files (default dir: fixtures)
  capture ai-sdk <out.jsonl>       Capture AI SDK requests for every fixture
  evaluate <captures-dir> <out-dir> Judge captured requests, write results.json and summary.md
  help                             Show this message`;

async function fixturesOrExit() {
  const { fixtures, errors } = await loadFixtures("fixtures");
  if (errors.length > 0) {
    for (const e of errors) console.error(`${e.file}: ${e.message}`);
    process.exit(1);
  }
  return fixtures;
}

async function main(argv: string[]): Promise<number> {
  const [command, sub, ...rest] = argv;
  if (command === "fixtures" && sub === "validate") {
    const { fixtures, errors } = await loadFixtures(rest[0] ?? "fixtures");
    for (const e of errors) console.error(`${e.file}: ${e.message}`);
    console.log(`${fixtures.length} valid, ${errors.length} invalid`);
    return errors.length === 0 ? 0 : 1;
  }
  if (command === "capture" && sub === "ai-sdk" && rest[0]) {
    const captures = await captureAiSdk(await fixturesOrExit());
    await writeFile(rest[0], `${captures.map((c) => JSON.stringify(c)).join("\n")}\n`);
    console.log(`${captures.length} captures written to ${rest[0]}`);
    return 0;
  }
  if (command === "evaluate" && sub && rest[0]) {
    const fixtures = await fixturesOrExit();
    const files = (await readdir(sub)).filter((f) => f.endsWith(".jsonl")).sort();
    const captures: Capture[] = [];
    for (const f of files) {
      for (const line of (await readFile(join(sub, f), "utf8")).split("\n")) {
        if (line.trim()) captures.push(JSON.parse(line) as Capture);
      }
    }
    const report = evaluate(captures, fixtures);
    await mkdir(rest[0], { recursive: true });
    await writeFile(join(rest[0], "results.json"), `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(join(rest[0], "summary.md"), renderSummary(report, fixtures));
    console.log(
      `${report.rows.length} rows from ${files.length} capture files written to ${rest[0]}`,
    );
    return 0;
  }
  if (command === undefined || command === "help" || command === "--help") {
    console.log(USAGE);
    return 0;
  }
  console.error(USAGE);
  return 2;
}

process.exitCode = await main(process.argv.slice(2));
