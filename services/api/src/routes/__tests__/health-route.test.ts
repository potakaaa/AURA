import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../../app.js";

type JsonObject = Record<string, unknown>;
type AppHandler = {
  handle(req: unknown, res: unknown, next: (error?: unknown) => void): void;
};

test("GET /health remains available without loading LLM provider config", async () => {
  const previousProvider = process.env.LLM_PROVIDER;
  process.env.LLM_PROVIDER = "invalid-provider";

  try {
    const app = createApp() as unknown as AppHandler;
    const response = await new Promise<{ status: number; body: JsonObject }>(
      (resolve, reject) => {
        let status = 200;
        const req = {
          method: "GET",
          url: "/health",
          originalUrl: "/health",
          headers: {},
        };
        const res = {
          setHeader() {
            return this;
          },
          getHeader() {
            return undefined;
          },
          end(payload?: string) {
            if (payload) {
              resolve({ status, body: JSON.parse(payload) as JsonObject });
            }
            return this;
          },
          status(code: number) {
            status = code;
            return this;
          },
          json(payload: JsonObject) {
            resolve({ status, body: payload });
            return this;
          },
        };

        app.handle(req, res, reject);
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true, service: "api" });
  } finally {
    if (previousProvider === undefined) {
      delete process.env.LLM_PROVIDER;
    } else {
      process.env.LLM_PROVIDER = previousProvider;
    }
  }
});
