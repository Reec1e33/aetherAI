import { describe, expect, it } from "vitest";
import type { Capture } from "../src/capture/types.js";
import { evaluateCapture, findToolSchema } from "../src/evaluate.js";
import { parseFixture } from "../src/fixtures.js";
import { normalizeOpenApi } from "../src/validator.js";

const params = {
  type: "object",
  required: ["unit"],
  properties: { unit: { type: "string", enum: ["c", "f"] } },
};
const fixture = parseFixture({
  id: "unit-enum",
  description: "Enum.",
  source: { kind: "synthetic" },
  keywords: ["enum"],
  tool: { name: "set_unit", description: "Set the unit.", parameters: params },
  valid: [{ unit: "c" }],
  cases: [{ constraint: "/properties/unit/enum", invalid: { unit: "k" } }],
});
const target = {
  id: "test/x",
  library: "test",
  libraryVersion: "0",
  provider: "x",
  model: "m",
};
const sent = (url: string, body: unknown): Capture => ({
  target,
  fixtureId: "unit-enum",
  status: "sent",
  url,
  body,
});

describe("findToolSchema", () => {
  it("finds OpenAI chat, Anthropic, Bedrock and Gemini tool shapes", () => {
    const u = "https://api.example.com";
    expect(
      findToolSchema({ tools: [{ function: { name: "t", parameters: params } }] }, "t", u)?.field,
    ).toBe("function.parameters");
    expect(findToolSchema({ tools: [{ name: "t", input_schema: params }] }, "t", u)?.field).toBe(
      "input_schema",
    );
    expect(
      findToolSchema(
        { toolConfig: { tools: [{ toolSpec: { name: "t", inputSchema: { json: params } } }] } },
        "t",
        u,
      )?.field,
    ).toBe("toolSpec.inputSchema.json");
    const gemini = "https://generativelanguage.googleapis.com/v1beta/models/m:generateContent";
    const decl = (d: object) => ({ tools: [{ functionDeclarations: [{ name: "t", ...d }] }] });
    expect(findToolSchema(decl({ parameters: params }), "t", gemini)?.openApi).toBe(true);
    expect(findToolSchema(decl({ parameters_json_schema: params }), "t", gemini)?.openApi).toBe(
      false,
    );
  });

  it("returns undefined when the tool is not in the body", () => {
    expect(findToolSchema({ tools: [] }, "t", "https://x")).toBeUndefined();
  });
});

describe("normalizeOpenApi", () => {
  it("lower-cases types and turns nullable into a null type", () => {
    expect(normalizeOpenApi({ type: "STRING", nullable: true, enum: ["a"] })).toEqual({
      type: ["string", "null"],
      enum: ["a", null],
    });
  });
});

describe("evaluateCapture", () => {
  const u = "https://api.example.com";
  const body = (schema: unknown) => ({
    tools: [{ function: { name: "set_unit", parameters: schema } }],
  });

  it("accepts an unchanged schema", () => {
    expect(evaluateCapture(sent(u, body(params)), fixture).outcome).toBe("accept");
  });

  it("reports a silent drop when the enum is gone", () => {
    const weak = { type: "object", required: ["unit"], properties: { unit: { type: "string" } } };
    const row = evaluateCapture(sent(u, body(weak)), fixture);
    expect(row.outcome).toBe("silent_drop");
    expect(row.cases[0]?.enforced).toBe(false);
  });

  it("reports an altered schema when a valid value is rejected", () => {
    const narrow = { ...params, properties: { unit: { type: "string", enum: ["f"] } } };
    const row = evaluateCapture(sent(u, body(narrow)), fixture);
    expect(row.outcome).toBe("altered");
    expect(row.validRejected).toEqual([0]);
  });

  it("reports a client-side failure as reject and a missing tool as missing", () => {
    const failed: Capture = { target, fixtureId: "unit-enum", status: "client_error", error: "x" };
    expect(evaluateCapture(failed, fixture).outcome).toBe("reject");
    expect(evaluateCapture(sent(u, { tools: [] }), fixture).outcome).toBe("missing");
  });
});
