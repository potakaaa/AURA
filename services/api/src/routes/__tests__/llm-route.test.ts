import assert from "node:assert/strict";
import test from "node:test";
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

test("POST /llm/chat handles provider failure with a safe 502 response", async () => {
  const response = await postJson(
    async () => {
      throw new Error("provider unavailable");
    },
    {
      messages: [{ role: "user", content: "Hello" }],
    },
  );

  assert.equal(response.status, 502);
  assert.deepEqual(response.body, { error: "provider unavailable" });
});
