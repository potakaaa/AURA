import { SYSTEM_PROMPT_TOKEN_BUDGET } from "../prompts/system.js";

/**
 * Context budget strategy for AURA requests.
 *
 * Design note:
 * - These values mirror the issue constraints and intentionally reserve space
 *   for model completion/tool-loop overhead to reduce overflow failures.
 */
export const TOTAL_CONTEXT_TOKEN_BUDGET = 8_000;
export const USER_PREFERENCES_TOKEN_BUDGET = 500;
export const RESPONSE_RESERVE_TOKEN_BUDGET = 1_200;
export const TOOL_TURN_RESERVE_TOKEN_BUDGET = 400;

export const HISTORY_TOKEN_BUDGET =
  TOTAL_CONTEXT_TOKEN_BUDGET -
  SYSTEM_PROMPT_TOKEN_BUDGET -
  USER_PREFERENCES_TOKEN_BUDGET -
  RESPONSE_RESERVE_TOKEN_BUDGET -
  TOOL_TURN_RESERVE_TOKEN_BUDGET;

export type ContextRole = "system" | "user" | "assistant" | "tool";

export type ContextMessage = {
  readonly role: ContextRole;
  readonly content: string;
  readonly tokenCount?: number;
};

export type UserPreferences = {
  readonly name?: string;
  readonly timezone?: string;
  readonly preferredLanguage?: string;
  readonly frequentlyUsedApps?: readonly string[];
  readonly customInstructions?: string;
};

export type TokenCounter = (text: string) => number;

export type AssembleContextInput = {
  readonly systemPrompt: string;
  readonly userPreferences?: UserPreferences;
  readonly history: readonly ContextMessage[];
  readonly newUserMessage: string;
  readonly countTokens?: TokenCounter;
};

export type ContextWindowUsage = {
  readonly totalBudget: number;
  readonly systemTokens: number;
  readonly preferenceTokens: number;
  readonly historyTokens: number;
  readonly newMessageTokens: number;
  readonly reservedTokens: number;
  readonly totalUsed: number;
};

export type AssembleContextResult = {
  readonly messages: readonly ContextMessage[];
  readonly usage: ContextWindowUsage;
  readonly droppedHistoryMessages: number;
};

/**
 * Approximate fallback tokenizer when no model-specific tokenizer is provided.
 * 1 token ~= 4 chars is intentionally conservative for planning-level assembly.
 */
export const approximateTokenCount: TokenCounter = (text: string): number => {
  if (text.trim().length === 0) {
    return 0;
  }
  return Math.ceil(text.length / 4);
};

/**
 * Serializes preferences into a compact system-readable block.
 */
export const serializeUserPreferences = (prefs: UserPreferences): string => {
  const sections: string[] = [];

  if (prefs.name) sections.push(`name: ${prefs.name}`);
  if (prefs.timezone) sections.push(`timezone: ${prefs.timezone}`);
  if (prefs.preferredLanguage) {
    sections.push(`preferredLanguage: ${prefs.preferredLanguage}`);
  }
  if (prefs.frequentlyUsedApps && prefs.frequentlyUsedApps.length > 0) {
    sections.push(`frequentlyUsedApps: ${prefs.frequentlyUsedApps.join(", ")}`);
  }
  if (prefs.customInstructions) {
    sections.push(`customInstructions: ${prefs.customInstructions}`);
  }

  return sections.join("\n");
};

/**
 * Assembles ordered context within the 8K total target.
 *
 * Ordering decision:
 * - Keep system and preferences first (stable steering), then recent retained
 *   history, then the incoming user message as the final turn.
 */
export const assembleContextWindow = (
  input: AssembleContextInput,
): AssembleContextResult => {
  const countTokens = input.countTokens ?? approximateTokenCount;

  const systemTokens = countTokens(input.systemPrompt);
  const rawPreferences = input.userPreferences
    ? serializeUserPreferences(input.userPreferences)
    : "";
  const boundedPreferences = trimToTokenBudget(
    rawPreferences,
    USER_PREFERENCES_TOKEN_BUDGET,
    countTokens,
  );
  const preferenceTokens = countTokens(boundedPreferences);

  const historyBudget = Math.max(HISTORY_TOKEN_BUDGET, 0);
  const retainedHistory = retainRecentHistoryWithinBudget(
    input.history,
    historyBudget,
    countTokens,
  );

  const newMessageTokens = countTokens(input.newUserMessage);
  const reservedTokens =
    RESPONSE_RESERVE_TOKEN_BUDGET + TOOL_TURN_RESERVE_TOKEN_BUDGET;

  const messages: ContextMessage[] = [
    { role: "system", content: input.systemPrompt, tokenCount: systemTokens },
  ];

  if (boundedPreferences.length > 0) {
    messages.push({
      role: "system",
      content: `User preferences\n${boundedPreferences}`,
      tokenCount: preferenceTokens,
    });
  }

  messages.push(...retainedHistory.messages);
  messages.push({
    role: "user",
    content: input.newUserMessage,
    tokenCount: newMessageTokens,
  });

  const historyTokens = retainedHistory.tokens;
  const totalUsed =
    systemTokens +
    preferenceTokens +
    historyTokens +
    newMessageTokens +
    reservedTokens;

  return {
    messages,
    droppedHistoryMessages: retainedHistory.droppedCount,
    usage: {
      totalBudget: TOTAL_CONTEXT_TOKEN_BUDGET,
      systemTokens,
      preferenceTokens,
      historyTokens,
      newMessageTokens,
      reservedTokens,
      totalUsed,
    },
  };
};

const retainRecentHistoryWithinBudget = (
  history: readonly ContextMessage[],
  budget: number,
  countTokens: TokenCounter,
): { messages: ContextMessage[]; tokens: number; droppedCount: number } => {
  const retained: ContextMessage[] = [];
  let tokens = 0;

  // Keep newest messages first by traversing backwards, then restore order.
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const candidate = history[index];
    const candidateTokens = candidate.tokenCount ?? countTokens(candidate.content);
    if (tokens + candidateTokens > budget) {
      continue;
    }
    retained.push({
      ...candidate,
      tokenCount: candidateTokens,
    });
    tokens += candidateTokens;
  }

  retained.reverse();

  return {
    messages: retained,
    tokens,
    droppedCount: history.length - retained.length,
  };
};

const trimToTokenBudget = (
  text: string,
  budget: number,
  countTokens: TokenCounter,
): string => {
  if (text.length === 0 || countTokens(text) <= budget) {
    return text;
  }

  let truncated = text;
  // Iterative shrink keeps implementation tokenizer-agnostic.
  while (truncated.length > 0 && countTokens(truncated) > budget) {
    truncated = truncated.slice(0, Math.floor(truncated.length * 0.9));
  }

  return truncated.trimEnd();
};

