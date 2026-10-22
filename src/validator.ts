import { Ajv2020 } from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";

// ajv-formats is CommonJS; under NodeNext its default export arrives wrapped.
const addFormats = (addFormatsModule as unknown as { default: (ajv: Ajv2020) => Ajv2020 }).default;

/** A JSON Schema 2020-12 validator with format checks on. Unknown keywords and formats are ignored. */
export function makeAjv(): Ajv2020 {
  const ajv = new Ajv2020({
    strict: false,
    allErrors: false,
    validateFormats: true,
    logger: false,
  });
  addFormats(ajv);
  return ajv;
}

export function isValid(ajv: Ajv2020, schema: unknown, instance: unknown): boolean {
  const validate = ajv.compile(stripMeta(schema) as object);
  return validate(instance) as boolean;
}

/** Removes `$schema` and `$id`, which name other drafts or collide between compiles. */
function stripMeta(schema: unknown): unknown {
  if (schema === null || typeof schema !== "object" || Array.isArray(schema)) return schema;
  const { $schema: _s, $id: _i, ...rest } = schema as Record<string, unknown>;
  return rest;
}

/**
 * Converts the OpenAPI 3.0 subset that Gemini's `parameters` field uses into JSON Schema,
 * so the same validator can judge it. Upper-case type names become lower case, and
 * `nullable: true` becomes a `null` member of `type`.
 */
export function normalizeOpenApi(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(normalizeOpenApi);
  if (schema === null || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "type" && typeof value === "string") out.type = value.toLowerCase();
    else if (key === "nullable" || key === "propertyOrdering") continue;
    else out[key] = normalizeOpenApi(value);
  }
  if ((schema as Record<string, unknown>).nullable === true && typeof out.type === "string") {
    out.type = [out.type, "null"];
    if (Array.isArray(out.enum) && !out.enum.includes(null)) out.enum = [...out.enum, null];
  }
  return out;
}
