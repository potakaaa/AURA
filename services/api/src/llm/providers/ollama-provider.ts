import type {
  LlmChatRequest,
  LlmChatResponse,
  LlmProvider,
  LlmProviderConfig,
} from "../types.js";
import { LlmProviderError } from "../types.js";

type OllamaChatResponse = {
  model?: string;
  message?: {
    content?: string;
  };
};

export class OllamaProvider implements LlmProvider {
  readonly name = "ollama";

  constructor(private readonly config: LlmProviderConfig) {}

  async chat(request: LlmChatRequest): Promise<LlmChatResponse> {
    const model = request.model ?? this.config.model;
    const response = await this.postChat({
      model,
      messages: request.messages,
      stream: false,
      options:
        request.temperature === undefined
          ? undefined
          : { temperature: request.temperature },
    });

    return {
      content: response.message?.content ?? "",
      provider: this.name,
      model: response.model ?? model,
      raw: response,
    };
  }

  private async postChat(body: unknown): Promise<OllamaChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs,
    );

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new LlmProviderError(
          `LLM request failed (${response.status}): ${errorBody || response.statusText}`,
          { provider: this.name, status: response.status },
        );
      }

      return (await response.json()) as OllamaChatResponse;
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
      throw new LlmProviderError(message, { provider: this.name });
    } finally {
      clearTimeout(timeout);
    }
  }
}
