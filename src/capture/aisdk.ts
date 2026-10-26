import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { generateText, jsonSchema, type LanguageModel, tool } from "ai";
import type { Fixture } from "../fixtures.js";
import type { Capture, Target } from "./types.js";

type FetchFn = typeof globalThis.fetch;

interface AiSdkTarget {
  provider: string;
  pkg: string;
  /** The first model is the headline target. The rest are only used by `--all-models`. */
  models: string[];
  make: (fetch: FetchFn, model: string) => LanguageModel;
}

const key = "census-offline";

const TARGETS: AiSdkTarget[] = [
  {
    provider: "openai",
    pkg: "@ai-sdk/openai",
    models: ["gpt-5", "gpt-4.1", "o3", "gpt-5.2"],
    make: (fetch, model) => createOpenAI({ apiKey: key, fetch })(model),
  },
  {
    provider: "openai-chat",
    pkg: "@ai-sdk/openai",
    models: ["gpt-5", "gpt-4.1", "o3", "gpt-5.2"],
    make: (fetch, model) => createOpenAI({ apiKey: key, fetch }).chat(model),
  },
  {
    provider: "anthropic",
    pkg: "@ai-sdk/anthropic",
    models: ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-sonnet-5-5", "claude-opus-5-5"],
    make: (fetch, model) => createAnthropic({ apiKey: key, fetch })(model),
  },
  {
    provider: "gemini",
    pkg: "@ai-sdk/google",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-3.1-pro-preview", "gemini-3.8-flash"],
    make: (fetch, model) => createGoogleGenerativeAI({ apiKey: key, fetch })(model),
  },
  {
    provider: "bedrock",
    pkg: "@ai-sdk/amazon-bedrock",
    models: [
      "anthropic.claude-sonnet-4-5-20250929-v1:0",
      "anthropic.claude-sonnet-5-5",
      "amazon.nova-pro-v1:0",
      "mistral.mistral-large-2407-v1:0",
    ],
    make: (fetch, model) =>
      createAmazonBedrock({
        region: "us-east-1",
        accessKeyId: key,
        secretAccessKey: key,
        fetch,
      })(model),
  },
  {
    provider: "mistral",
    pkg: "@ai-sdk/mistral",
    models: [
      "mistral-large-latest",
      "mistral-small-latest",
      "codestral-latest",
      "magistral-medium-latest",
    ],
    make: (fetch, model) => createMistral({ apiKey: key, fetch })(model),
  },
  {
    provider: "groq",
    pkg: "@ai-sdk/groq",
    models: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"],
    make: (fetch, model) => createGroq({ apiKey: key, fetch })(model),
  },
  {
    provider: "xai",
    pkg: "@ai-sdk/xai",
    models: ["grok-4", "grok-4.20", "grok-4.7"],
    make: (fetch, model) => createXai({ apiKey: key, fetch })(model),
  },
];

const require = createRequire(import.meta.url);

async function versionOf(pkg: string): Promise<string> {
  const path = require.resolve(`${pkg}/package.json`);
  return (JSON.parse(await readFile(path, "utf8")) as { version: string }).version;
}

/**
 * Sends each fixture through each AI SDK provider. A custom `fetch` records the request
 * and answers with HTTP 400, so nothing leaves the machine and nothing is retried.
 */
export async function captureAiSdk(
  fixtures: Fixture[],
  options: { allModels?: boolean } = {},
): Promise<Capture[]> {
  const aiVersion = await versionOf("ai");
  const captures: Capture[] = [];
  for (const t of TARGETS) {
    for (const model of options.allModels ? t.models : t.models.slice(0, 1)) {
      captures.push(...(await captureTarget(t, model, fixtures, aiVersion, options.allModels)));
    }
  }
  return captures;
}

async function captureTarget(
  t: AiSdkTarget,
  model: string,
  fixtures: Fixture[],
  aiVersion: string,
  modelInId = false,
): Promise<Capture[]> {
  const target: Target = {
    id: modelInId ? `ai-sdk/${t.provider}@${model}` : `ai-sdk/${t.provider}`,
    library: "ai-sdk",
    libraryVersion: `ai@${aiVersion} ${t.pkg}@${await versionOf(t.pkg)}`,
    provider: t.provider,
    model,
  };
  const captures: Capture[] = [];
  for (const fixture of fixtures) {
    let request: { url: string; body: unknown } | undefined;
    const fetch: FetchFn = async (input, init) => {
      request = { url: String(input), body: JSON.parse(String(init?.body)) };
      return new Response(JSON.stringify({ error: { message: "captured offline" } }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    };
    let error: string | undefined;
    try {
      await generateText({
        model: t.make(fetch, model),
        prompt: "Call the tool.",
        maxRetries: 0,
        tools: {
          [fixture.tool.name]: tool({
            description: fixture.tool.description,
            inputSchema: jsonSchema(fixture.tool.parameters as Parameters<typeof jsonSchema>[0]),
          }),
        },
      });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    captures.push(
      request
        ? { target, fixtureId: fixture.id, status: "sent", url: request.url, body: request.body }
        : { target, fixtureId: fixture.id, status: "client_error", error: error ?? "no request" },
    );
  }
  return captures;
}
