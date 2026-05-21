export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmChatRequest = {
  messages: LlmMessage[];
  model?: string;
  temperature?: number;
};

export type LlmChatResponse = {
  content: string;
  provider: string;
  model: string;
  raw?: unknown;
};

export type LlmProviderName =
  | "openai-compatible"
  | "openai"
  | "ollama"
  | "gemini";

export type LlmProviderConfig = {
  provider: LlmProviderName;
  baseUrl: string;
  apiKey?: string;
  model: string;
  timeoutMs: number;
};

export interface LlmProvider {
  readonly name: LlmProviderName;
  chat(request: LlmChatRequest): Promise<LlmChatResponse>;
}

export class LlmProviderError extends Error {
  readonly provider: string;
  readonly status?: number;

  constructor(message: string, options: { provider: string; status?: number }) {
    super(message);
    this.name = "LlmProviderError";
    this.provider = options.provider;
    this.status = options.status;
  }
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled LLM provider: ${String(value)}`);
}
