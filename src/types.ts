/**
 * What happened to one fixture's schema on its way out of one library.
 *
 * - `accept`: every constraint is still enforced, and every valid example still passes.
 * - `reject`: the library refused the schema, or failed, before it sent a request.
 * - `silent_drop`: the request went out, but at least one constraint is no longer enforced.
 * - `altered`: every constraint survived, but the outgoing schema now rejects a valid example.
 * - `missing`: the request went out without the tool.
 * - `uncompilable`: the outgoing schema is not a schema the validator can read.
 */
export type Outcome = "accept" | "reject" | "silent_drop" | "altered" | "missing" | "uncompilable";
