/** A library and provider combination under test, e.g. LiteLLM sending to Gemini. */
export interface Target {
  /** Stable id used in results, e.g. `litellm/gemini`. */
  readonly id: string;
  readonly library: string;
  /** Exact versions of the packages that built the request. */
  readonly libraryVersion: string;
  readonly provider: string;
  readonly model: string;
}

/**
 * One request caught before it left the machine. `client_error` means the library
 * refused the schema (or failed) before it sent anything.
 */
export type Capture =
  | {
      readonly target: Target;
      readonly fixtureId: string;
      readonly status: "sent";
      readonly url: string;
      readonly body: unknown;
    }
  | {
      readonly target: Target;
      readonly fixtureId: string;
      readonly status: "client_error";
      readonly error: string;
    };
