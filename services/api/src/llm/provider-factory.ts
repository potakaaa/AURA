import { env } from "../config/env.js";
import { OpenAiCompatibleProvider } from "./provider.js";
import type { LlmProvider } from "./types.js";
import { LlmProviderError } from "./types.js";

export function createLlmProvider(): LlmProvider {
  if (!env.LLM_API_KEY) {
    throw new LlmProviderError(
      "LLM_API_KEY is not set. Add it to use real model responses.",
      { provider: env.LLM_PROVIDER },
    );
  }

  switch (env.LLM_PROVIDER) {
    case "openai-compatible":
      return new OpenAiCompatibleProvider({
        baseUrl: env.LLM_BASE_URL,
        apiKey: env.LLM_API_KEY,
        model: env.LLM_MODEL,
      });
  }
}
