import { env } from "../config/env.js";
import {
  createLlmProvider,
  getLlmProviderConfig,
} from "../llm/provider-factory.js";
import { buildChatContext } from "../llm/context-builder.js";
import type { LlmMessage, LlmProvider } from "../llm/types.js";
import { LlmProviderError } from "../llm/types.js";

export type ChatMessage = LlmMessage;

type GenerateChatResponseOptions = {
  provider?: LlmProvider;
};

export async function generateChatResponse(
  messages: ChatMessage[],
  options: GenerateChatResponseOptions = {},
): Promise<string> {
  if (
    !options.provider &&
    env.LLM_PROVIDER === "openai-compatible" &&
    !env.LLM_API_KEY
  ) {
    throw new LlmProviderError("LLM provider is not configured.", {
      provider: env.LLM_PROVIDER,
      code: "provider_unavailable",
    });
  }

  try {
    const provider = options.provider ?? createLlmProvider(getLlmProviderConfig());
    const context = buildChatContext(messages);
    const response = await provider.chat({
      messages: context.messages,
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
