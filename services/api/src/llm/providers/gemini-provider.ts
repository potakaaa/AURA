import type {
  LlmChatRequest,
  LlmChatResponse,
  LlmMessage,
  LlmProvider,
  LlmProviderConfig,
} from "../types.js";
import { LlmProviderError } from "../types.js";

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
    safetyRatings?: unknown;
  }>;
  promptFeedback?: unknown;
  usageMetadata?: unknown;
};

type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
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

    const model = request.model ?? this.config.model;
    const response = await this.generateContent(model, {
      contents: toGeminiContents(request.messages),
      systemInstruction: toGeminiSystemInstruction(request.messages),
      generationConfig:
        request.temperature === undefined
          ? undefined
          : { temperature: request.temperature },
    });

    return {
      content: extractGeminiText(response),
      provider: this.name,
      model,
      raw: response,
    };
  }

  private async generateContent(
    model: string,
    body: unknown,
  ): Promise<GeminiGenerateContentResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs,
    );
    const modelPath = model.startsWith("models/") ? model : `models/${model}`;

    try {
      const response = await fetch(
        `${this.config.baseUrl}/${modelPath}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.config.apiKey ?? "",
          },
          signal: controller.signal,
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new LlmProviderError(
          `LLM request failed (${response.status}): ${sanitizeGeminiErrorText(errorBody) || response.statusText}`,
          { provider: this.name, status: response.status },
        );
      }

      return (await response.json()) as GeminiGenerateContentResponse;
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
      throw new LlmProviderError(sanitizeGeminiErrorText(message), {
        provider: this.name,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function toGeminiContents(messages: LlmMessage[]): GeminiContent[] {
  const contents = messages
    .filter((message) => message.role !== "system")
    .map(
      (message): GeminiContent => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }),
    );

  if (contents.length > 0) {
    return contents;
  }

  return [{ role: "user", parts: [{ text: "" }] }];
}

function toGeminiSystemInstruction(messages: LlmMessage[]) {
  const systemMessages = messages.filter((message) => message.role === "system");

  if (systemMessages.length === 0) {
    return undefined;
  }

  return {
    parts: systemMessages.map((message) => ({ text: message.content })),
  };
}

function extractGeminiText(response: GeminiGenerateContentResponse): string {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? ""
  );
}

function sanitizeGeminiErrorText(text: string): string {
  return text
    .replace(/AIza[A-Za-z0-9_-]+/g, "AIza[REDACTED]")
    .replace(/key=([^&\s"]+)/gi, "key=[REDACTED]")
    .replace(/x-goog-api-key["':\s]+[A-Za-z0-9_-]+/gi, "x-goog-api-key [REDACTED]");
}
