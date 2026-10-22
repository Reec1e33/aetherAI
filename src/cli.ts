#!/usr/bin/env node
import { loadFixtures } from "./fixtures.js";

const USAGE = `Usage: census <command>

Commands:
  fixtures validate [dir]   Check fixture files (default dir: fixtures)
  help                      Show this message`;

async function main(argv: string[]): Promise<number> {
  const [command, sub, arg] = argv;
  if (command === "fixtures" && sub === "validate") {
    const { fixtures, errors } = await loadFixtures(arg ?? "fixtures");
    for (const e of errors) console.error(`${e.file}: ${e.message}`);
    console.log(`${fixtures.length} valid, ${errors.length} invalid`);
    return errors.length === 0 ? 0 : 1;
  }
  if (command === undefined || command === "help" || command === "--help") {
    console.log(USAGE);
    return 0;
  }
  console.error(USAGE);
  return 2;
}

process.exitCode = await main(process.argv.slice(2));
