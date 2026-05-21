import { Router } from "express";
import { z } from "zod";
import { generateChatResponse } from "../services/llm-service.js";
import type { ChatMessage } from "../services/llm-service.js";

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
  generateChatResponse?: (messages: ChatMessage[]) => Promise<string>;
};

export function createLlmRoute(options: LlmRouteOptions = {}) {
  const route = Router();
  const generateResponse = options.generateChatResponse ?? generateChatResponse;

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
      const message =
        error instanceof Error ? error.message : "Unknown LLM error occurred";
      return res.status(502).json({ error: message });
    }
  });

  return route;
}

export const llmRoute = createLlmRoute();
