import { env } from "../config/env.js";
import { GeminiProvider } from "./providers/gemini-provider.js";
import { OllamaProvider } from "./providers/ollama-provider.js";
import { OpenAiCompatibleProvider } from "./providers/openai-compatible-provider.js";
import type { LlmProvider, LlmProviderConfig } from "./types.js";
import { assertNever } from "./types.js";

export function getLlmProviderConfig(): LlmProviderConfig {
  return {
    provider: env.LLM_PROVIDER,
    baseUrl: env.LLM_BASE_URL,
    apiKey: env.LLM_API_KEY,
    model: env.LLM_MODEL,
    timeoutMs: env.LLM_TIMEOUT_MS,
  };
}

export function createLlmProvider(config: LlmProviderConfig): LlmProvider {
  switch (config.provider) {
    case "openai-compatible":
    case "openai":
      return new OpenAiCompatibleProvider(config);
    case "ollama":
      return new OllamaProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    default:
      return assertNever(config.provider);
  }
}
