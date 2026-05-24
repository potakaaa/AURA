import assert from "node:assert/strict";
import test from "node:test";
import { env } from "../../config/env.js";
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
  assert.equal(provider.lastRequest?.model, env.LLM_MODEL);
  assert.equal(provider.lastRequest?.temperature, 0.3);
});

test("demo prompts bypass the LLM provider", async () => {
  const provider = new MockLlmProvider({ content: "Provider reply" });

  const response = await generateChatResponse(
    [
      {
        role: "user",
        content: "AURA, brief me for today. What should I focus on?",
      },
    ],
    { provider },
  );

  assert.match(response, /Good morning, Rald/);
  assert.match(response, /Finalize the Jogaliga handoff notes/);
  assert.equal(provider.lastRequest, undefined);
});

test("demo prompt bypass tolerates spoken punctuation differences", async () => {
  const provider = new MockLlmProvider({ content: "Provider reply" });

  const response = await generateChatResponse(
    [
      {
        role: "user",
        content: "what did we decide in the last Joga Liga meeting",
      },
    ],
    { provider },
  );

  assert.match(response, /In the last Jogaliga meeting/);
  assert.match(response, /Document current infrastructure costs\. Pending/);
  assert.equal(provider.lastRequest, undefined);
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

test("generateChatResponse injects optional user preferences before provider dispatch", async () => {
  const provider = new MockLlmProvider({ content: "Preference-aware reply" });

  await generateChatResponse(messages, {
    provider,
    userPreferences: {
      name: "AURA Tester",
      timezone: "Asia/Manila",
    },
  });

  assert.deepEqual(provider.lastRequest?.messages.map((message) => message.role), [
    "system",
    "system",
    "user",
  ]);
  assert.match(provider.lastRequest?.messages[1].content ?? "", /User preferences/);
  assert.match(provider.lastRequest?.messages[1].content ?? "", /name: AURA Tester/);
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
      assert.equal(error.provider, env.LLM_PROVIDER);
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
