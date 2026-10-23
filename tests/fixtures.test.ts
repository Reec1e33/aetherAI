import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadFixtures, parseFixture, removePointer, resolvePointer } from "../src/fixtures.js";

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
      required: ["level"],
      properties: { level: { type: "integer", minimum: 0, maximum: 10 } },
    },
  },
  valid: [{ level: 5 }],
  cases: [
    { constraint: "/properties/level/minimum", invalid: { level: -1 } },
    { constraint: "/properties/level/maximum", invalid: { level: 11 } },
  ],
};

describe("resolvePointer and removePointer", () => {
  it("resolves nested keys and RFC 6901 escapes", () => {
    const doc = { a: { "b/c": { "d~e": 1 } } };
    expect(resolvePointer(doc, "/a/b~1c/d~0e")).toBe(1);
    expect(resolvePointer(doc, "")).toBe(doc);
    expect(resolvePointer({ a: 1 }, "/a/b")).toBeUndefined();
  });

  it("removes a member without touching the original", () => {
    const doc = { a: { b: 1, c: 2 } };
    expect(removePointer(doc, "/a/b")).toEqual({ a: { c: 2 } });
    expect(doc.a.b).toBe(1);
  });
});

describe("parseFixture", () => {
  it("accepts a fixture whose cases each test one constraint", () => {
    expect(parseFixture(valid).cases).toHaveLength(2);
  });

  it("rejects a valid example that the schema rejects", () => {
    expect(() => parseFixture({ ...valid, valid: [{ level: 99 }] })).toThrow(/valid\[0\]/);
  });

  it("rejects an invalid example that the schema accepts", () => {
    const cases = [{ constraint: "/properties/level/minimum", invalid: { level: 3 } }];
    expect(() => parseFixture({ ...valid, cases })).toThrow(/accepted by the schema/);
  });

  it("rejects an invalid example that also breaks another constraint", () => {
    const cases = [{ constraint: "/properties/level/minimum", invalid: { level: "x" } }];
    expect(() => parseFixture({ ...valid, cases })).toThrow(/another constraint/);
  });

  it("rejects a constraint pointer that is not in the schema", () => {
    const cases = [{ constraint: "/properties/level/pattern", invalid: { level: -1 } }];
    expect(() => parseFixture({ ...valid, cases })).toThrow(/does not exist/);
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
