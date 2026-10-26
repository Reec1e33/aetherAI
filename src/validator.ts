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
 * Gemini's Schema message also takes its proto field names, and some SDKs (LangChain via
 * google-genai) send those. Map them to the JSON Schema keyword with the same meaning.
 */
const PROTO_NAMES: Readonly<Record<string, string>> = {
  any_of: "anyOf",
  min_items: "minItems",
  max_items: "maxItems",
  min_length: "minLength",
  max_length: "maxLength",
  min_properties: "minProperties",
  max_properties: "maxProperties",
  property_ordering: "propertyOrdering",
};

/** Keywords whose value maps names to subschemas. The names are data, not keywords. */
const SCHEMA_MAPS = new Set(["properties", "$defs", "definitions", "patternProperties"]);

/** Keywords whose value is data. It is copied as-is, never read as a schema. */
const DATA_KEYWORDS = new Set(["enum", "const", "default", "example", "examples", "required"]);

/**
 * Converts the OpenAPI 3.0 subset that Gemini's `parameters` field uses into JSON Schema,
 * so the same validator can judge it. Upper-case type names become lower case, proto
 * field names become their JSON Schema keyword, and `nullable: true` becomes a `null`
 * member of `type`.
 */
export function normalizeOpenApi(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(normalizeOpenApi);
  if (schema === null || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [rawKey, value] of Object.entries(schema)) {
    const key = PROTO_NAMES[rawKey] ?? rawKey;
    if (key === "type" && typeof value === "string") out.type = value.toLowerCase();
    else if (key === "nullable" || key === "propertyOrdering") continue;
    else if (DATA_KEYWORDS.has(key)) out[key] = value;
    else if (SCHEMA_MAPS.has(key) && isPlainObject(value)) {
      out[key] = Object.fromEntries(
        Object.entries(value).map(([name, sub]) => [name, normalizeOpenApi(sub)]),
      );
    } else out[key] = normalizeOpenApi(value);
  }
  if ((schema as Record<string, unknown>).nullable === true && typeof out.type === "string") {
    out.type = [out.type, "null"];
    if (Array.isArray(out.enum) && !out.enum.includes(null)) out.enum = [...out.enum, null];
  }
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
