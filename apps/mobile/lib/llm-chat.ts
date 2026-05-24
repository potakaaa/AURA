import { Platform } from 'react-native';

export type LlmChatRole = 'system' | 'user' | 'assistant';

export type LlmChatMessage = {
  role: LlmChatRole;
  content: string;
};

export type LlmChatResponse = {
  reply: string;
};

export type LlmChatErrorCode =
  | 'invalid_request'
  | 'provider_unavailable'
  | 'timeout'
  | 'provider_error'
  | 'unknown';

const DEFAULT_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

export const LLM_CHAT_API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  DEFAULT_API_BASE_URL ||
  'http://localhost:4000'
).replace(/\/$/, '');

function logLlmChatRequest(event: string, details: Record<string, unknown>) {
  console.info('[mobile-api] llm.chat', {
    event,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    apiBaseUrl: LLM_CHAT_API_BASE_URL,
    ...details,
  });
}

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
  readonly code: LlmChatErrorCode;

  constructor(code: LlmChatErrorCode = 'unknown') {
    super(getLlmChatErrorMessage(code));
    this.name = 'LlmChatClientError';
    this.code = code;
  }
}

function getLlmChatErrorMessage(code: LlmChatErrorCode): string {
  switch (code) {
    case 'provider_unavailable':
      return 'Aura is temporarily unavailable. Please try again in a moment.';
    case 'timeout':
      return 'Aura took too long to respond. Retry when your connection is stable.';
    case 'invalid_request':
      return 'Aura could not send that message. Try rephrasing it.';
    case 'provider_error':
    case 'unknown':
    default:
      return 'Aura could not get a response right now. Check your connection and try again.';
  }
}

function getErrorCode(status: number, body: unknown): LlmChatErrorCode {
  if (typeof body === 'object' && body !== null && 'code' in body) {
    const code = (body as { code?: unknown }).code;

    if (
      code === 'provider_unavailable' ||
      code === 'timeout' ||
      code === 'provider_error' ||
      code === 'unknown'
    ) {
      return code;
    }
  }

  if (status === 400) {
    return 'invalid_request';
  }

  if (status === 503) {
    return 'provider_unavailable';
  }

  if (status === 504) {
    return 'timeout';
  }

  if (status === 502) {
    return 'provider_error';
  }

  return 'unknown';
}

function getResponseCode(body: unknown): string | undefined {
  if (typeof body === 'object' && body !== null && 'code' in body) {
    const code = (body as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }

  return undefined;
}

export async function postLlmChat(messages: LlmChatMessage[]): Promise<LlmChatResponse> {
  const normalizedMessages = messages
    .map(normalizeMessage)
    .filter((message): message is LlmChatMessage => message !== null);

  if (normalizedMessages.length === 0) {
    throw new LlmChatClientError();
  }

  const startedAt = Date.now();
  const url = `${LLM_CHAT_API_BASE_URL}/llm/chat`;

  logLlmChatRequest('request_start', {
    url,
    messageCount: normalizedMessages.length,
    messageRoles: normalizedMessages.map((message) => message.role),
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: normalizedMessages }),
    });

    const body = (await response.json().catch(() => null)) as Partial<LlmChatResponse> | null;
    const durationMs = Date.now() - startedAt;

    logLlmChatRequest('response_received', {
      url,
      status: response.status,
      ok: response.ok,
      durationMs,
      responseCode: getResponseCode(body),
    });

    if (!response.ok) {
      throw new LlmChatClientError(getErrorCode(response.status, body));
    }

    if (
      typeof body?.reply !== 'string' ||
      !body.reply.trim() ||
      containsBackendDiagnostic(body.reply)
    ) {
      throw new LlmChatClientError('provider_error');
    }

    return { reply: body.reply.trim() };
  } catch (error) {
    if (error instanceof LlmChatClientError) {
      logLlmChatRequest('request_failed', {
        url,
        durationMs: Date.now() - startedAt,
        code: error.code,
        errorName: error.name,
      });
      throw error;
    }

    logLlmChatRequest('network_failed', {
      url,
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    throw new LlmChatClientError('provider_unavailable');
  }
}
