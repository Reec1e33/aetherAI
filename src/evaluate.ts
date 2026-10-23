import type { Capture, Target } from "./capture/types.js";
import type { Fixture } from "./fixtures.js";
import type { Outcome } from "./types.js";
import { isValid, makeAjv, normalizeOpenApi } from "./validator.js";

export interface CaseResult {
  /** JSON Pointer to the constraint in the original schema. */
  readonly constraint: string;
  /** The keyword under test, e.g. `enum` or `maxLength`. */
  readonly keyword: string;
  /** True when the outgoing schema still rejects the invalid arguments. */
  readonly enforced: boolean;
}

export interface Row {
  readonly targetId: string;
  readonly fixtureId: string;
  readonly outcome: Outcome;
  /** Where the schema was found in the request body, e.g. `functionDeclarations[].parameters`. */
  readonly field?: string;
  readonly cases: CaseResult[];
  /** Indexes into `fixture.valid` that the outgoing schema rejects. */
  readonly validRejected: number[];
  /** The schema as it left the library, for review. */
  readonly sentSchema?: unknown;
  readonly error?: string;
}

interface Found {
  readonly schema: unknown;
  readonly field: string;
  readonly openApi: boolean;
}

/** Reads a nested member without assuming the shape of the value. */
function at(value: unknown, ...path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Finds the named tool's parameter schema anywhere in a provider request body. */
export function findToolSchema(body: unknown, name: string, url: string): Found | undefined {
  const gemini = /generativelanguage\.googleapis|aiplatform\.googleapis/.test(url);
  const visit = (node: unknown): Found | undefined => {
    if (Array.isArray(node)) {
      for (const item of node) {
        const hit = visit(item);
        if (hit) return hit;
      }
      return undefined;
    }
    if (node === null || typeof node !== "object") return undefined;
    const n = node as Record<string, unknown>;
    const fn = at(n, "function");
    if (at(fn, "name") === name && at(fn, "parameters")) {
      return { schema: at(fn, "parameters"), field: "function.parameters", openApi: false };
    }
    const spec = at(n, "toolSpec");
    const specJson = at(spec, "inputSchema", "json");
    if (at(spec, "name") === name && specJson) {
      return { schema: specJson, field: "toolSpec.inputSchema.json", openApi: false };
    }
    if (n.name === name) {
      // Google's JSON API accepts both camelCase and snake_case field names.
      const jsonSchema = n.parametersJsonSchema ?? n.parameters_json_schema;
      if (jsonSchema) return { schema: jsonSchema, field: "parametersJsonSchema", openApi: false };
      if (n.input_schema) return { schema: n.input_schema, field: "input_schema", openApi: false };
      if (n.parameters) return { schema: n.parameters, field: "parameters", openApi: gemini };
    }
    for (const value of Object.values(n)) {
      const hit = visit(value);
      if (hit) return hit;
    }
    return undefined;
  };
  return visit(body);
}

function keywordOf(pointer: string): string {
  return pointer.split("/").at(-1) ?? pointer;
}

/** Judges one captured request against its fixture. */
export function evaluateCapture(capture: Capture, fixture: Fixture, ajv = makeAjv()): Row {
  const base = { targetId: capture.target.id, fixtureId: fixture.id };
  const unjudged = fixture.cases.map((c) => ({
    constraint: c.constraint,
    keyword: keywordOf(c.constraint),
    enforced: false,
  }));
  if (capture.status === "client_error") {
    return { ...base, outcome: "reject", cases: unjudged, validRejected: [], error: capture.error };
  }
  const found = findToolSchema(capture.body, fixture.tool.name, capture.url);
  if (!found) {
    return { ...base, outcome: "missing", cases: unjudged, validRejected: [] };
  }
  const schema = found.openApi ? normalizeOpenApi(found.schema) : found.schema;
  try {
    const cases = fixture.cases.map((c) => ({
      constraint: c.constraint,
      keyword: keywordOf(c.constraint),
      enforced: !isValid(ajv, schema, c.invalid),
    }));
    const validRejected = fixture.valid.flatMap((v, i) => (isValid(ajv, schema, v) ? [] : [i]));
    const outcome: Outcome = cases.some((c) => !c.enforced)
      ? "silent_drop"
      : validRejected.length > 0
        ? "altered"
        : "accept";
    return { ...base, outcome, field: found.field, cases, validRejected, sentSchema: found.schema };
  } catch (err) {
    return {
      ...base,
      outcome: "uncompilable",
      field: found.field,
      cases: unjudged,
      validRejected: [],
      sentSchema: found.schema,
      error: String(err),
    };
  }
}

export interface Report {
  readonly targets: Target[];
  readonly fixtureCount: number;
  readonly caseCount: number;
  readonly rows: Row[];
}

export function evaluate(captures: Capture[], fixtures: Fixture[]): Report {
  const byId = new Map(fixtures.map((f) => [f.id, f]));
  const ajv = makeAjv();
  const targets = new Map<string, Target>();
  const rows: Row[] = [];
  for (const capture of captures) {
    const fixture = byId.get(capture.fixtureId);
    if (!fixture) throw new Error(`capture names unknown fixture ${capture.fixtureId}`);
    targets.set(capture.target.id, capture.target);
    rows.push(evaluateCapture(capture, fixture, ajv));
  }
  return {
    targets: [...targets.values()],
    fixtureCount: fixtures.length,
    caseCount: fixtures.reduce((n, f) => n + f.cases.length, 0),
    rows,
  };
}
