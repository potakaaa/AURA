import assert from "node:assert/strict";
import test from "node:test";
import { LlmProviderError } from "../../llm/types.js";
import { createLlmRoute } from "../llm-route.js";
import type { LlmRouteOptions } from "../llm-route.js";

type JsonObject = Record<string, unknown>;
type RouteHandler = {
  handle(
    req: unknown,
    res: unknown,
    next: (error?: unknown) => void,
  ): void;
};

async function postJson(
  generateChatResponse: NonNullable<LlmRouteOptions["generateChatResponse"]>,
  body: JsonObject,
) {
  const route = createLlmRoute({ generateChatResponse }) as unknown as RouteHandler;

  return await new Promise<{ status: number; body: JsonObject }>(
    (resolve, reject) => {
      let status = 200;
      const req = {
        method: "POST",
        url: "/chat",
        originalUrl: "/llm/chat",
        body,
        headers: {},
      };
      const res = {
        status(code: number) {
          status = code;
          return this;
        },
        json(payload: JsonObject) {
          resolve({ status, body: payload });
          return this;
        },
      };

      route.handle(req, res, reject);
    },
  );
}

test("POST /llm/chat validates invalid request bodies", async () => {
  const response = await postJson(
    async () => {
      throw new Error("should not be called");
    },
    { messages: [] },
  );

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid request body");
  assert.ok(response.body.details);
});

test("POST /llm/chat returns normalized replies", async () => {
  const response = await postJson(
    async (messages) => {
      assert.deepEqual(messages, [{ role: "user", content: "Hello" }]);
      return "Normalized route reply";
    },
    {
      messages: [{ role: "user", content: "Hello" }],
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { reply: "Normalized route reply" });
});

test("POST /llm/chat handles provider failure with a safe 503 response", async () => {
  const response = await postJson(
    async () => {
      throw new LlmProviderError(
        "LLM request failed (503): Authorization: Bearer sk-secret",
        { provider: "openai-compatible", status: 503 },
      );
    },
    {
      messages: [{ role: "user", content: "Hello" }],
    },
  );

  assert.equal(response.status, 503);
  assert.deepEqual(response.body, {
    error: "The assistant service is temporarily unavailable.",
    code: "provider_unavailable",
  });
});

test("POST /llm/chat handles provider timeout with a safe 504 response", async () => {
  const response = await postJson(
    async () => {
      throw new LlmProviderError("LLM request timed out after 10ms", {
        provider: "ollama",
        code: "timeout",
      });
    },
    {
      messages: [{ role: "user", content: "Hello" }],
    },
  );

  assert.equal(response.status, 504);
  assert.deepEqual(response.body, {
    error: "The assistant took too long to respond. Please try again.",
    code: "timeout",
  });
});

test("POST /llm/chat handles provider API errors with a safe 502 response", async () => {
  const response = await postJson(
    async () => {
      throw new LlmProviderError("provider raw parse failure with x-goog-api-key secret", {
        provider: "gemini",
        status: 400,
      });
    },
    {
      messages: [{ role: "user", content: "Hello" }],
    },
  );

  assert.equal(response.status, 502);
  assert.deepEqual(response.body, {
    error: "The assistant could not complete the request.",
    code: "provider_error",
  });
});

test("POST /llm/chat handles unknown failures with a safe 500 response", async () => {
  const response = await postJson(
    async () => {
      throw new Error("stack trace with API key sk-secret");
    },
    {
      messages: [{ role: "user", content: "Hello" }],
    },
  );

  assert.equal(response.status, 500);
  assert.deepEqual(response.body, {
    error: "The assistant could not complete the request.",
    code: "unknown",
  });
});
