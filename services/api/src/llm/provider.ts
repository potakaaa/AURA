import type {
  LlmChatRequest,
  LlmChatResponse,
  LlmProvider,
  LlmProviderConfig,
} from "./types.js";
import { LlmProviderError } from "./types.js";

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export class GeminiProvider implements LlmProvider {
  readonly name = "gemini";

  constructor(private readonly config: LlmProviderConfig) {}

  async chat(request: LlmChatRequest): Promise<LlmChatResponse> {
    if (!this.config.apiKey) {
      throw new LlmProviderError("LLM_API_KEY is required for Gemini.", {
        provider: this.name,
      });
    }

    const systemMessages = request.messages.filter(
      (message) => message.role === "system",
    );
    const conversationMessages = request.messages.filter(
      (message) => message.role !== "system",
    );
    const model = request.model ?? this.config.model;
    const modelPath = model.startsWith("models/") ? model : `models/${model}`;
    const url = `${this.config.baseUrl}/${modelPath}:generateContent?key=${this.config.apiKey}`;

    const data = await postJson<GeminiGenerateContentResponse>(
      url,
      {
        contents: conversationMessages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        systemInstruction:
          systemMessages.length === 0
            ? undefined
            : {
                parts: systemMessages.map((message) => ({
                  text: message.content,
                })),
              },
        generationConfig:
          request.temperature === undefined
            ? undefined
            : { temperature: request.temperature },
      },
      this.config.timeoutMs,
      this.name,
    );

    return {
      content:
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("") ?? "",
      provider: this.name,
      model,
      raw: data,
    };
  }
}

async function postJson<TResponse>(
  url: string,
  body: unknown,
  timeoutMs: number,
  provider: string,
  headers: Record<string, string> = {},
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new LlmProviderError(
        `LLM request failed (${response.status}): ${errorBody || response.statusText}`,
        { provider, status: response.status },
      );
    }

    return (await response.json()) as TResponse;
  } catch (error) {
    if (error instanceof LlmProviderError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new LlmProviderError(
        `LLM request timed out after ${timeoutMs}ms`,
        { provider },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unknown LLM error occurred";
    throw new LlmProviderError(message, { provider });
  } finally {
    clearTimeout(timeout);
  }
}
