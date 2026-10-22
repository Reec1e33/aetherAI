import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadFixtures, parseFixture, resolvePointer } from "../src/fixtures.js";

const valid = {
  id: "min-max",
  description: "Numeric bounds.",
  source: { kind: "synthetic" },
  keywords: ["minimum", "maximum"],
  tool: {
    name: "set_volume",
    description: "Set the volume.",
    parameters: {
      type: "object",
      properties: { level: { type: "integer", minimum: 0, maximum: 10 } },
    },
  },
  expect: { preserved: ["/properties/level/minimum", "/properties/level/maximum"] },
};

describe("resolvePointer", () => {
  it("resolves nested keys and RFC 6901 escapes", () => {
    const doc = { a: { "b/c": { "d~e": 1 } } };
    expect(resolvePointer(doc, "/a/b~1c/d~0e")).toBe(1);
    expect(resolvePointer(doc, "")).toBe(doc);
  });

  it("returns undefined for a missing path", () => {
    expect(resolvePointer({ a: 1 }, "/b")).toBeUndefined();
    expect(resolvePointer({ a: 1 }, "/a/b")).toBeUndefined();
  });
});

describe("parseFixture", () => {
  it("accepts a valid fixture", () => {
    expect(parseFixture(valid).id).toBe("min-max");
  });

  it("rejects a preserved pointer that is not in the schema", () => {
    const bad = { ...valid, expect: { preserved: ["/properties/level/pattern"] } };
    expect(() => parseFixture(bad)).toThrow(/does not exist/);
  });

  it("rejects an id that is not kebab-case", () => {
    expect(() => parseFixture({ ...valid, id: "Min_Max" })).toThrow();
  });
});

describe("loadFixtures", () => {
  it("loads the repository fixtures without errors", async () => {
    const { fixtures, errors } = await loadFixtures("fixtures");
    expect(errors).toEqual([]);
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it("reports a file whose name does not match its id", async () => {
    const dir = await mkdtemp(join(tmpdir(), "census-"));
    await writeFile(join(dir, "wrong-name.json"), JSON.stringify(valid));
    const { errors } = await loadFixtures(dir);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/min-max\.json/);
  });
});
