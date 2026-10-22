/**
 * How an endpoint handled one tool definition.
 *
 * - `accept`: the endpoint took the schema and the model's call respected every keyword.
 * - `reject`: the endpoint returned an error for the schema.
 * - `silent_drop`: the endpoint returned success but ignored part of the schema.
 * - `semantic_loss`: a sanitizer rewrote the schema into a weaker one (e.g. `anyOf` cut to its first member).
 */
export type Outcome = "accept" | "reject" | "silent_drop" | "semantic_loss";

/** A provider API or gateway that the census sends probes to. */
export interface Endpoint {
  /** Stable id used in results, e.g. `openai`, `litellm->vertex`. */
  readonly id: string;
  /** The model id pinned for this run. */
  readonly model: string;
}

export interface ProbeResult {
  readonly fixtureId: string;
  readonly endpointId: string;
  readonly model: string;
  readonly outcome: Outcome;
  /** ISO 8601 time of the request. */
  readonly ranAt: string;
  /** Raw evidence (status code, error text, returned arguments) for later review. */
  readonly evidence: unknown;
}
