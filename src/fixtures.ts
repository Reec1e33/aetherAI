import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const Source = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("synthetic") }),
  z.object({ kind: z.literal("issue"), url: z.url() }),
]);

/** One tool definition to send to every endpoint, plus what must survive the trip. */
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
  expect: z.object({
    /** JSON Pointers into `tool.parameters` that a faithful endpoint must keep. */
    preserved: z.array(z.string().startsWith("/")).min(1),
  }),
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

/** Parses one fixture and checks that each `expect.preserved` pointer exists in the schema. */
export function parseFixture(data: unknown): Fixture {
  const fixture = Fixture.parse(data);
  for (const pointer of fixture.expect.preserved) {
    if (resolvePointer(fixture.tool.parameters, pointer) === undefined) {
      throw new Error(`expect.preserved pointer ${pointer} does not exist in tool.parameters`);
    }
  }
  return fixture;
}

/** Loads every `*.json` fixture in a directory. Collects errors instead of stopping at the first. */
export async function loadFixtures(
  dir: string,
): Promise<{ fixtures: Fixture[]; errors: FixtureError[] }> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const fixtures: Fixture[] = [];
  const errors: FixtureError[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    try {
      const fixture = parseFixture(JSON.parse(await readFile(join(dir, file), "utf8")));
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
