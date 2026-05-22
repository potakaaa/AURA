import {
  assembleContextWindow,
  normalizeContextHistory,
  SYSTEM_PROMPT,
} from "@aura/ai-engine";
import type {
  ContextMessage,
  TokenCounter,
  UserPreferences,
} from "@aura/ai-engine";
import type { LlmMessage } from "./types.js";

export type BuildChatContextOptions = {
  readonly countTokens?: TokenCounter;
  readonly userPreferences?: UserPreferences;
};

export type BuildChatContextResult = {
  readonly messages: LlmMessage[];
  readonly droppedHistoryMessages: number;
  readonly usage: ReturnType<typeof assembleContextWindow>["usage"];
};

export const buildChatContext = (
  messages: readonly LlmMessage[],
  options: BuildChatContextOptions = {},
): BuildChatContextResult => {
  const normalizedMessages = normalizeChatHistory(messages);
  const lastUserMessageIndex = findLastUserMessageIndex(normalizedMessages);
  const history =
    lastUserMessageIndex >= 0 && lastUserMessageIndex === normalizedMessages.length - 1
      ? normalizedMessages.slice(0, lastUserMessageIndex)
      : normalizedMessages;
  const newUserMessage =
    lastUserMessageIndex >= 0 && lastUserMessageIndex === normalizedMessages.length - 1
      ? normalizedMessages[lastUserMessageIndex].content
      : undefined;

  const assembled = assembleContextWindow({
    systemPrompt: SYSTEM_PROMPT,
    userPreferences: options.userPreferences,
    history,
    newUserMessage,
    countTokens: options.countTokens,
  });

  return {
    messages: assembled.messages.map(toLlmMessage),
    droppedHistoryMessages:
      assembled.droppedHistoryMessages +
      (newUserMessage ? normalizedMessages.length - lastUserMessageIndex - 1 : 0),
    usage: assembled.usage,
  };
};

const normalizeChatHistory = (
  messages: readonly LlmMessage[],
): ContextMessage[] =>
  normalizeContextHistory(messages);

const findLastUserMessageIndex = (
  messages: readonly ContextMessage[],
): number => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return index;
    }
  }

  return -1;
};

const toLlmMessage = (message: ContextMessage): LlmMessage => ({
  role: message.role === "tool" ? "assistant" : message.role,
  content: message.content,
});
