import type {
  LlmChatRequest,
  LlmChatResponse,
  LlmProvider,
  LlmProviderConfig,
  LlmProviderName,
} from "../types.js";
import { LlmProviderError } from "../types.js";

type OpenAiCompatibleChatCompletionResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name: LlmProviderName;

  constructor(private readonly config: LlmProviderConfig) {
    this.name = config.provider;
  }

  async chat(request: LlmChatRequest): Promise<LlmChatResponse> {
    if (!this.config.apiKey) {
      throw new LlmProviderError(
        "LLM_API_KEY is required for OpenAI-compatible providers.",
        { provider: this.name },
      );
    }

    const response = await this.postChatCompletion({
      model: request.model ?? this.config.model,
      messages: request.messages,
      temperature: request.temperature,
    });

    return {
      content: response.choices?.[0]?.message?.content ?? "",
      provider: this.name,
      model: response.model ?? request.model ?? this.config.model,
      raw: response,
    };
  }

  private async postChatCompletion(
    body: unknown,
  ): Promise<OpenAiCompatibleChatCompletionResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs,
    );

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new LlmProviderError(
          `LLM request failed (${response.status}): ${sanitizeProviderErrorText(errorBody) || response.statusText}`,
          { provider: this.name, status: response.status },
        );
      }

      return (await response.json()) as OpenAiCompatibleChatCompletionResponse;
    } catch (error) {
      if (error instanceof LlmProviderError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new LlmProviderError(
          `LLM request timed out after ${this.config.timeoutMs}ms`,
          { provider: this.name },
        );
      }

      const message =
        error instanceof Error ? error.message : "Unknown LLM error occurred";
      throw new LlmProviderError(sanitizeProviderErrorText(message), {
        provider: this.name,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function sanitizeProviderErrorText(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-[REDACTED]")
    .replace(/AIza[A-Za-z0-9_-]+/g, "AIza[REDACTED]");
}
