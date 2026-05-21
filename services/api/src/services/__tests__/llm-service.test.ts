import assert from "node:assert/strict";
import test from "node:test";
import { MockLlmProvider } from "../../llm/__tests__/mock-llm-provider.js";
import { LlmProviderError } from "../../llm/types.js";
import { generateChatResponse } from "../llm-service.js";

const messages = [{ role: "user" as const, content: "Hello" }];

test("generateChatResponse works with a mock LlmProvider", async () => {
  const provider = new MockLlmProvider({ content: "Provider reply" });

  const response = await generateChatResponse(messages, { provider });

  assert.equal(response, "Provider reply");
  assert.equal(provider.lastRequest?.messages[0].role, "system");
  assert.match(provider.lastRequest?.messages[0].content ?? "", /You are AURA/);
  assert.deepEqual(provider.lastRequest?.messages.at(-1), messages[0]);
  assert.equal(provider.lastRequest?.model, "gpt-4o-mini");
  assert.equal(provider.lastRequest?.temperature, 0.3);
});

test("service depends on normalized content, not OpenAI choices", async () => {
  const provider = new MockLlmProvider({
    content: "Interface reply",
    raw: {
      choices: [{ message: { content: "Vendor-specific reply" } }],
    },
  });

  const response = await generateChatResponse(messages, { provider });

  assert.equal(response, "Interface reply");
});

test("empty model responses are handled safely", async () => {
  const provider = new MockLlmProvider({ content: "" });

  const response = await generateChatResponse(messages, { provider });

  assert.equal(response, "");
});

test("unknown provider errors are transformed into LlmProviderError", async () => {
  const provider = new MockLlmProvider({
    error: new Error("socket disconnected"),
  });

  await assert.rejects(
    generateChatResponse(messages, { provider }),
    (error) => {
      assert.ok(error instanceof LlmProviderError);
      assert.equal(error.provider, "openai-compatible");
      assert.equal(error.message, "socket disconnected");
      return true;
    },
  );
});

test("provider errors pass through with normalized provider context", async () => {
  const provider = new MockLlmProvider({
    error: new LlmProviderError("provider unavailable", {
      provider: "ollama",
      status: 503,
    }),
  });

  await assert.rejects(
    generateChatResponse(messages, { provider }),
    (error) => {
      assert.ok(error instanceof LlmProviderError);
      assert.equal(error.provider, "ollama");
      assert.equal(error.status, 503);
      assert.equal(error.message, "provider unavailable");
      return true;
    },
  );
});
