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
  model: string;
  make: (fetch: FetchFn) => LanguageModel;
}

const key = "census-offline";

const TARGETS: AiSdkTarget[] = [
  {
    provider: "openai",
    pkg: "@ai-sdk/openai",
    model: "gpt-5",
    make: (fetch) => createOpenAI({ apiKey: key, fetch })("gpt-5"),
  },
  {
    provider: "openai-chat",
    pkg: "@ai-sdk/openai",
    model: "gpt-5",
    make: (fetch) => createOpenAI({ apiKey: key, fetch }).chat("gpt-5"),
  },
  {
    provider: "anthropic",
    pkg: "@ai-sdk/anthropic",
    model: "claude-sonnet-4-5",
    make: (fetch) => createAnthropic({ apiKey: key, fetch })("claude-sonnet-4-5"),
  },
  {
    provider: "gemini",
    pkg: "@ai-sdk/google",
    model: "gemini-2.5-pro",
    make: (fetch) => createGoogleGenerativeAI({ apiKey: key, fetch })("gemini-2.5-pro"),
  },
  {
    provider: "bedrock",
    pkg: "@ai-sdk/amazon-bedrock",
    model: "anthropic.claude-sonnet-4-5-20250929-v1:0",
    make: (fetch) =>
      createAmazonBedrock({
        region: "us-east-1",
        accessKeyId: key,
        secretAccessKey: key,
        fetch,
      })("anthropic.claude-sonnet-4-5-20250929-v1:0"),
  },
  {
    provider: "mistral",
    pkg: "@ai-sdk/mistral",
    model: "mistral-large-latest",
    make: (fetch) => createMistral({ apiKey: key, fetch })("mistral-large-latest"),
  },
  {
    provider: "groq",
    pkg: "@ai-sdk/groq",
    model: "openai/gpt-oss-120b",
    make: (fetch) => createGroq({ apiKey: key, fetch })("openai/gpt-oss-120b"),
  },
  {
    provider: "xai",
    pkg: "@ai-sdk/xai",
    model: "grok-4",
    make: (fetch) => createXai({ apiKey: key, fetch })("grok-4"),
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
export async function captureAiSdk(fixtures: Fixture[]): Promise<Capture[]> {
  const aiVersion = await versionOf("ai");
  const captures: Capture[] = [];
  for (const t of TARGETS) {
    const target: Target = {
      id: `ai-sdk/${t.provider}`,
      library: "ai-sdk",
      libraryVersion: `ai@${aiVersion} ${t.pkg}@${await versionOf(t.pkg)}`,
      provider: t.provider,
      model: t.model,
    };
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
          model: t.make(fetch),
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
  }
  return captures;
}
