import type {
  LlmChatRequest,
  LlmChatResponse,
  LlmProvider,
  LlmProviderName,
} from "../types.js";

type MockLlmProviderOptions = {
  content?: string;
  error?: Error;
  model?: string;
  name?: LlmProviderName;
  raw?: unknown;
};

export class MockLlmProvider implements LlmProvider {
  readonly name: LlmProviderName;
  lastRequest?: LlmChatRequest;

  constructor(private readonly options: MockLlmProviderOptions = {}) {
    this.name = options.name ?? "openai-compatible";
  }

  async chat(request: LlmChatRequest): Promise<LlmChatResponse> {
    this.lastRequest = request;

    if (this.options.error) {
      throw this.options.error;
    }

    return {
      content: this.options.content ?? "mock reply",
      provider: this.name,
      model: request.model ?? this.options.model ?? "mock-model",
      raw: this.options.raw,
    };
  }
}
