import {
  assembleContextWindow,
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

  if (
    lastUserMessageIndex === -1 ||
    normalizedMessages.at(-1)?.role !== "user"
  ) {
    return {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...normalizedMessages.map(toLlmMessage),
      ],
      droppedHistoryMessages: 0,
      usage: assembleContextWindow({
        systemPrompt: SYSTEM_PROMPT,
        userPreferences: options.userPreferences,
        history: normalizedMessages,
        newUserMessage: "",
        countTokens: options.countTokens,
      }).usage,
    };
  }

  const assembled = assembleContextWindow({
    systemPrompt: SYSTEM_PROMPT,
    userPreferences: options.userPreferences,
    history: normalizedMessages.slice(0, lastUserMessageIndex),
    newUserMessage: normalizedMessages[lastUserMessageIndex].content,
    countTokens: options.countTokens,
  });

  return {
    messages: assembled.messages.map(toLlmMessage),
    droppedHistoryMessages:
      assembled.droppedHistoryMessages +
      normalizedMessages.length -
      lastUserMessageIndex -
      1,
    usage: assembled.usage,
  };
};

const normalizeChatHistory = (
  messages: readonly LlmMessage[],
): ContextMessage[] =>
  messages
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0);

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
