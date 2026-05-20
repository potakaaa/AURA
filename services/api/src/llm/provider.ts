import type { LlmChatRequest, LlmChatResponse, LlmProvider } from "./types.js";
import { LlmProviderError } from "./types.js";

type OpenAiCompatibleChatCompletionResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type OpenAiCompatibleProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name = "openai-compatible";

  constructor(private readonly config: OpenAiCompatibleProviderConfig) {}

  async chat(request: LlmChatRequest): Promise<LlmChatResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model ?? this.config.model,
        messages: request.messages,
        temperature: request.temperature,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new LlmProviderError(
        `LLM request failed (${response.status}): ${errorBody || response.statusText}`,
        { provider: this.name, status: response.status },
      );
    }

    const data =
      (await response.json()) as OpenAiCompatibleChatCompletionResponse;

    return {
      content: data.choices?.[0]?.message?.content ?? "",
      provider: this.name,
      model: data.model ?? request.model ?? this.config.model,
      raw: data,
    };
  }
}
