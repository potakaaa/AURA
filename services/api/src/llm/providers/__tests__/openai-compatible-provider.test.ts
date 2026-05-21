import assert from "node:assert/strict";
import test from "node:test";
import { GeminiProvider } from "../gemini-provider.js";
import { OllamaProvider } from "../ollama-provider.js";
import { OpenAiCompatibleProvider } from "../openai-compatible-provider.js";
import { LlmProviderError } from "../../types.js";
import type { LlmProviderConfig } from "../../types.js";

const userMessage = { role: "user" as const, content: "Hello" };

function config(overrides: Partial<LlmProviderConfig> = {}): LlmProviderConfig {
  return {
    provider: "openai-compatible",
    baseUrl: "http://llm.test/v1",
    apiKey: "test-key",
    model: "test-model",
    timeoutMs: 1000,
    ...overrides,
  };
}

async function withMockFetch<T>(
  fetchImpl: typeof fetch,
  run: () => Promise<T>,
): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;

  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("OpenAI-compatible adapter parses success responses", async () => {
  let requestBody: unknown;

  await withMockFetch(
    (async (_input, init) => {
      requestBody = JSON.parse(String(init?.body));

      return new Response(
        JSON.stringify({
          model: "gpt-test",
          choices: [{ message: { content: "Normalized OpenAI reply" } }],
        }),
        { status: 200 },
      );
    }) as typeof fetch,
    async () => {
      const provider = new OpenAiCompatibleProvider(config());
      const response = await provider.chat({
        messages: [userMessage],
        temperature: 0.3,
      });

      assert.equal(response.content, "Normalized OpenAI reply");
      assert.equal(response.provider, "openai-compatible");
      assert.equal(response.model, "gpt-test");
      assert.deepEqual(requestBody, {
        model: "test-model",
        messages: [userMessage],
        temperature: 0.3,
      });
    },
  );
});

test("OpenAI-compatible adapter normalizes API errors", async () => {
  await withMockFetch(
    (async () =>
      new Response("bad key sk-testsecret", {
        status: 401,
        statusText: "Unauthorized",
      })) as typeof fetch,
    async () => {
      const provider = new OpenAiCompatibleProvider(config());

      await assert.rejects(
        provider.chat({ messages: [userMessage] }),
        (error) => {
          assert.ok(error instanceof LlmProviderError);
          assert.equal(error.provider, "openai-compatible");
          assert.equal(error.status, 401);
          assert.match(error.message, /LLM request failed \(401\)/);
          assert.doesNotMatch(error.message, /sk-testsecret/);
          assert.match(error.message, /sk-\[REDACTED\]/);
          return true;
        },
      );
    },
  );
});

test("Ollama adapter normalizes native Ollama responses", async () => {
  let url = "";
  let requestBody: unknown;

  await withMockFetch(
    (async (input, init) => {
      url = String(input);
      requestBody = JSON.parse(String(init?.body));

      return new Response(
        JSON.stringify({
          model: "llama3.2",
          message: { content: "Ollama reply" },
        }),
        { status: 200 },
      );
    }) as typeof fetch,
    async () => {
      const provider = new OllamaProvider(
        config({ provider: "ollama", model: "llama3.1" }),
      );
      const response = await provider.chat({
        messages: [userMessage],
        temperature: 0.2,
      });

      assert.equal(url, "http://llm.test/v1/api/chat");
      assert.equal(response.content, "Ollama reply");
      assert.equal(response.provider, "ollama");
      assert.equal(response.model, "llama3.2");
      assert.deepEqual(requestBody, {
        model: "llama3.1",
        messages: [userMessage],
        stream: false,
        options: { temperature: 0.2 },
      });
    },
  );
});

test("Ollama adapter normalizes API errors", async () => {
  await withMockFetch(
    (async () =>
      new Response("model not found", {
        status: 404,
        statusText: "Not Found",
      })) as typeof fetch,
    async () => {
      const provider = new OllamaProvider(config({ provider: "ollama" }));

      await assert.rejects(
        provider.chat({ messages: [userMessage] }),
        (error) => {
          assert.ok(error instanceof LlmProviderError);
          assert.equal(error.provider, "ollama");
          assert.equal(error.status, 404);
          assert.match(error.message, /model not found/);
          return true;
        },
      );
    },
  );
});

test("Gemini adapter normalizes native Gemini responses", async () => {
  let url = "";
  let requestBody: unknown;

  await withMockFetch(
    (async (input, init) => {
      url = String(input);
      requestBody = JSON.parse(String(init?.body));

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "Gemini " }, { text: "reply" }],
              },
            },
          ],
        }),
        { status: 200 },
      );
    }) as typeof fetch,
    async () => {
      const provider = new GeminiProvider(
        config({ provider: "gemini", model: "gemini-test" }),
      );
      const response = await provider.chat({
        messages: [
          { role: "system", content: "Be concise." },
          userMessage,
          { role: "assistant", content: "Prior reply" },
        ],
        temperature: 0.4,
      });

      assert.equal(
        url,
        "http://llm.test/v1/models/gemini-test:generateContent",
      );
      assert.equal(response.content, "Gemini reply");
      assert.equal(response.provider, "gemini");
      assert.equal(response.model, "gemini-test");
      assert.deepEqual(requestBody, {
        contents: [
          { role: "user", parts: [{ text: "Hello" }] },
          { role: "model", parts: [{ text: "Prior reply" }] },
        ],
        systemInstruction: {
          parts: [{ text: "Be concise." }],
        },
        generationConfig: { temperature: 0.4 },
      });
    },
  );
});

test("Gemini adapter normalizes API errors", async () => {
  await withMockFetch(
    (async () =>
      new Response("bad key AIzaSensitiveKey", {
        status: 403,
        statusText: "Forbidden",
      })) as typeof fetch,
    async () => {
      const provider = new GeminiProvider(
        config({ provider: "gemini", model: "gemini-test" }),
      );

      await assert.rejects(
        provider.chat({ messages: [userMessage] }),
        (error) => {
          assert.ok(error instanceof LlmProviderError);
          assert.equal(error.provider, "gemini");
          assert.equal(error.status, 403);
          assert.match(error.message, /LLM request failed \(403\)/);
          assert.doesNotMatch(error.message, /AIzaSensitiveKey/);
          assert.match(error.message, /AIza\[REDACTED\]/);
          return true;
        },
      );
    },
  );
});

test("timeout behavior normalizes aborts consistently", async () => {
  await withMockFetch(
    ((_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      })) as typeof fetch,
    async () => {
      const providers = [
        new OpenAiCompatibleProvider(config({ timeoutMs: 1 })),
        new OllamaProvider(config({ provider: "ollama", timeoutMs: 1 })),
        new GeminiProvider(config({ provider: "gemini", timeoutMs: 1 })),
      ];

      for (const provider of providers) {
        await assert.rejects(
          provider.chat({ messages: [userMessage] }),
          (error) => {
            assert.ok(error instanceof LlmProviderError);
            assert.equal(error.provider, provider.name);
            assert.match(error.message, /timed out after 1ms/);
            return true;
          },
        );
      }
    },
  );
});
