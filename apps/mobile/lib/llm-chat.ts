import { Platform } from 'react-native';

export type LlmChatRole = 'system' | 'user' | 'assistant';

export type LlmChatMessage = {
  role: LlmChatRole;
  content: string;
};

export type LlmChatResponse = {
  reply: string;
};

const DEFAULT_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  DEFAULT_API_BASE_URL ||
  'http://localhost:4000'
).replace(/\/$/, '');

function normalizeMessage(message: LlmChatMessage): LlmChatMessage | null {
  const content = message.content.trim();

  if (!content) {
    return null;
  }

  return {
    role: message.role,
    content,
  };
}

function containsBackendDiagnostic(reply: string): boolean {
  return /\b(api[_-]?key|stack trace|llm_provider|llm_api_key|provider error)\b/i.test(reply);
}

export class LlmChatClientError extends Error {
  constructor() {
    super('Aura could not reach the assistant service. Please try again.');
    this.name = 'LlmChatClientError';
  }
}

export async function postLlmChat(messages: LlmChatMessage[]): Promise<LlmChatResponse> {
  const normalizedMessages = messages
    .map(normalizeMessage)
    .filter((message): message is LlmChatMessage => message !== null);

  if (normalizedMessages.length === 0) {
    throw new LlmChatClientError();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: normalizedMessages }),
    });

    const body = (await response.json().catch(() => null)) as Partial<LlmChatResponse> | null;

    if (
      !response.ok ||
      typeof body?.reply !== 'string' ||
      !body.reply.trim() ||
      containsBackendDiagnostic(body.reply)
    ) {
      throw new LlmChatClientError();
    }

    return { reply: body.reply.trim() };
  } catch (error) {
    if (error instanceof LlmChatClientError) {
      throw error;
    }

    throw new LlmChatClientError();
  }
}
