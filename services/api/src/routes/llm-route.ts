import { Router } from "express";
import { z } from "zod";
import { LlmProviderError } from "../llm/types.js";
import type { LlmMessage } from "../llm/types.js";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

export type LlmRouteOptions = {
  generateChatResponse?: (messages: LlmMessage[]) => Promise<string>;
};

export function createLlmRoute(options: LlmRouteOptions = {}) {
  const route = Router();
  const generateResponse = options.generateChatResponse ?? defaultGenerateChatResponse;

  route.post("/chat", async (req, res) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    try {
      const reply = await generateResponse(parsed.data.messages);
      return res.json({ reply });
    } catch (error) {
      const safeError = toSafeLlmRouteError(error);
      return res.status(safeError.status).json({
        error: safeError.message,
        code: safeError.code,
      });
    }
  });

  return route;
}

export const llmRoute = createLlmRoute();

async function defaultGenerateChatResponse(messages: LlmMessage[]): Promise<string> {
  const { generateChatResponse } = await import("../services/llm-service.js");
  return await generateChatResponse(messages);
}

function toSafeLlmRouteError(error: unknown): {
  status: number;
  code: "provider_unavailable" | "timeout" | "provider_error" | "unknown";
  message: string;
} {
  if (error instanceof LlmProviderError) {
    if (error.code === "timeout") {
      return {
        status: 504,
        code: "timeout",
        message: "The assistant took too long to respond. Please try again.",
      };
    }

    if (error.code === "provider_unavailable") {
      return {
        status: 503,
        code: "provider_unavailable",
        message: "The assistant service is temporarily unavailable.",
      };
    }

    return {
      status: 502,
      code: "provider_error",
      message: "The assistant could not complete the request.",
    };
  }

  return {
    status: 500,
    code: "unknown",
    message: "The assistant could not complete the request.",
  };
}
