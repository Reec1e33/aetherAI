import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { isValid, makeAjv } from "./validator.js";

const Source = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("synthetic") }),
  z.object({ kind: z.literal("issue"), url: z.url() }),
]);

const Args = z.record(z.string(), z.unknown());

/** One tool definition, plus argument objects that it must accept and must reject. */
export const Fixture = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use kebab-case"),
  description: z.string().min(1),
  source: Source,
  /** JSON Schema keywords this fixture exercises, e.g. `enum`, `anyOf`, `minimum`. */
  keywords: z.array(z.string().min(1)).min(1),
  tool: z.object({
    name: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
    description: z.string().min(1),
    parameters: z.record(z.string(), z.unknown()),
  }),
  /** Arguments the schema accepts. A faithful endpoint must still accept them. */
  valid: z.array(Args).min(1),
  /** One entry per constraint under test. */
  cases: z
    .array(
      z.object({
        /** JSON Pointer into `tool.parameters` to the keyword under test. */
        constraint: z.string().startsWith("/"),
        /** Arguments that break only that constraint. */
        invalid: Args,
      }),
    )
    .min(1),
});
export type Fixture = z.infer<typeof Fixture>;

export interface FixtureError {
  readonly file: string;
  readonly message: string;
}

/** Resolves a JSON Pointer (RFC 6901) against a value. Returns `undefined` when it does not resolve. */
export function resolvePointer(value: unknown, pointer: string): unknown {
  if (pointer === "") return value;
  let current: unknown = value;
  for (const raw of pointer.slice(1).split("/")) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (current === null || typeof current !== "object" || !Object.hasOwn(current, key)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Returns a deep copy of `value` without the member that `pointer` names. */
export function removePointer(value: unknown, pointer: string): unknown {
  const copy = structuredClone(value);
  const keys = pointer
    .slice(1)
    .split("/")
    .map((k) => k.replaceAll("~1", "/").replaceAll("~0", "~"));
  const last = keys.pop();
  const parent = resolvePointer(copy, keys.length ? `/${keys.join("/")}` : "");
  if (last !== undefined && parent !== null && typeof parent === "object") {
    delete (parent as Record<string, unknown>)[last];
  }
  return copy;
}

/**
 * Parses one fixture and checks that it tests what it says it tests:
 * every `valid` entry passes, every `invalid` entry fails, and each `invalid`
 * entry passes again once its constraint is removed.
 */
export function parseFixture(data: unknown, ajv = makeAjv()): Fixture {
  const fixture = Fixture.parse(data);
  const schema = fixture.tool.parameters;
  fixture.valid.forEach((args, i) => {
    if (!isValid(ajv, schema, args)) throw new Error(`valid[${i}] is rejected by the schema`);
  });
  for (const { constraint, invalid } of fixture.cases) {
    if (resolvePointer(schema, constraint) === undefined) {
      throw new Error(`constraint ${constraint} does not exist in tool.parameters`);
    }
    if (isValid(ajv, schema, invalid)) {
      throw new Error(`invalid case for ${constraint} is accepted by the schema`);
    }
    if (!isValid(ajv, removePointer(schema, constraint), invalid)) {
      throw new Error(`invalid case for ${constraint} also breaks another constraint`);
    }
  }
  return fixture;
}

/** Loads every `*.json` fixture in a directory. Collects errors instead of stopping at the first. */
export async function loadFixtures(
  dir: string,
): Promise<{ fixtures: Fixture[]; errors: FixtureError[] }> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const ajv = makeAjv();
  const fixtures: Fixture[] = [];
  const errors: FixtureError[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    try {
      const fixture = parseFixture(JSON.parse(await readFile(join(dir, file), "utf8")), ajv);
      if (`${fixture.id}.json` !== file) throw new Error(`file name must be ${fixture.id}.json`);
      if (seen.has(fixture.id)) throw new Error(`duplicate id ${fixture.id}`);
      seen.add(fixture.id);
      fixtures.push(fixture);
    } catch (err) {
      const message = err instanceof z.ZodError ? z.prettifyError(err) : String(err);
      errors.push({ file, message });
    }
  }
  return { fixtures, errors };
}
