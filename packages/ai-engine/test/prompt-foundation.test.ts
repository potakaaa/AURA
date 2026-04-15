import assert from "node:assert/strict";
import test from "node:test";

import { OUTPUT_FORMAT_SCHEMAS } from "../prompts/formats.js";
import { SYSTEM_PROMPT, SYSTEM_PROMPT_TOKEN_BUDGET } from "../prompts/system.js";
import { CLAUDE_TOOLS } from "../prompts/tools.js";
import {
  HISTORY_TOKEN_BUDGET,
  TOTAL_CONTEXT_TOKEN_BUDGET,
  assembleContextWindow,
} from "../context/window.js";

test("registers the expected MVP tool names", () => {
  const toolNames = CLAUDE_TOOLS.map((tool) => tool.name);
  assert.deepEqual(toolNames, [
    "read_calendar",
    "create_event",
    "search_drive",
    "read_email",
    "execute_action",
  ]);
});

test("exports strict output format schemas", () => {
  assert.equal(OUTPUT_FORMAT_SCHEMAS.action_plan.type, "object");
  assert.equal(OUTPUT_FORMAT_SCHEMAS.summary.type, "object");
  assert.equal(OUTPUT_FORMAT_SCHEMAS.confirmation.type, "object");

  assert.equal(OUTPUT_FORMAT_SCHEMAS.action_plan.additionalProperties, false);
  assert.equal(OUTPUT_FORMAT_SCHEMAS.summary.additionalProperties, false);
  assert.equal(OUTPUT_FORMAT_SCHEMAS.confirmation.additionalProperties, false);
});

test("context assembler truncates oldest history when budget is tight", () => {
  const perCharCounter = (text: string): number => text.length;
  const oversized = "x".repeat(HISTORY_TOKEN_BUDGET + 50);
  const stillLarge = "y".repeat(HISTORY_TOKEN_BUDGET + 25);

  const history = [
    { role: "user" as const, content: oversized },
    { role: "assistant" as const, content: stillLarge },
    { role: "user" as const, content: "recent-user" },
  ];

  const result = assembleContextWindow({
    systemPrompt: "S",
    userPreferences: { timezone: "UTC" },
    history,
    newUserMessage: "N",
    countTokens: perCharCounter,
  });

  // Budget invariants should hold regardless of tokenizer strategy.
  assert.equal(TOTAL_CONTEXT_TOKEN_BUDGET, 8_000);
  assert.equal(SYSTEM_PROMPT_TOKEN_BUDGET, 2_000);
  assert.ok(HISTORY_TOKEN_BUDGET > 0);

  // At least one older message is expected to be dropped with this setup.
  assert.ok(result.droppedHistoryMessages >= 1);
  assert.ok(result.messages.some((message) => message.content === "recent-user"));
  assert.ok(
    result.messages.some((message) => message.role === "user" && message.content === "N"),
  );
});

test("system prompt includes core behavior constraints", () => {
  assert.match(SYSTEM_PROMPT, /voice-first, privacy-aware/i);
  assert.match(SYSTEM_PROMPT, /never invent/i);
  assert.match(SYSTEM_PROMPT, /confirmation preview/i);
});

