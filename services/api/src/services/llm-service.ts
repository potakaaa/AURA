import { env } from "../config/env.js";
import {
  createLlmProvider,
  getLlmProviderConfig,
} from "../llm/provider-factory.js";
import type { LlmMessage } from "../llm/types.js";
import { LlmProviderError } from "../llm/types.js";

export type ChatMessage = LlmMessage;

export async function generateChatResponse(
  messages: ChatMessage[],
): Promise<string> {
  if (env.LLM_PROVIDER === "openai-compatible" && !env.LLM_API_KEY) {
    return "LLM_API_KEY is not set. Add it to use real model responses.";
  }

  try {
    const provider = createLlmProvider(getLlmProviderConfig());
    const response = await provider.chat({
      messages,
      model: env.LLM_MODEL,
      temperature: 0.3,
    });

    return response.content;
  } catch (error) {
    if (error instanceof LlmProviderError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Unknown LLM error occurred";
    throw new LlmProviderError(message, { provider: env.LLM_PROVIDER });
  }
}
