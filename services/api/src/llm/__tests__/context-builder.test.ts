import assert from "node:assert/strict";
import test from "node:test";
import { SYSTEM_PROMPT } from "@aura/ai-engine";
import { buildChatContext } from "../context-builder.js";

test("buildChatContext injects the shared AURA system prompt", () => {
  const result = buildChatContext([{ role: "user", content: "Hello" }]);

  assert.deepEqual(result.messages[0], {
    role: "system",
    content: SYSTEM_PROMPT,
  });
  assert.deepEqual(result.messages.at(-1), {
    role: "user",
    content: "Hello",
  });
});

test("buildChatContext normalizes and trims chat history before dispatch", () => {
  const result = buildChatContext(
    [
      { role: "user", content: "oversized old turn" },
      { role: "assistant", content: " recent reply " },
      { role: "user", content: " final question " },
    ],
    {
      countTokens: (text) => (text.includes("oversized") ? 4_000 : 1),
    },
  );

  assert.equal(result.droppedHistoryMessages, 1);
  assert.deepEqual(result.messages.map((message) => message.role), [
    "system",
    "assistant",
    "user",
  ]);
  assert.deepEqual(result.messages.at(-1), {
    role: "user",
    content: "final question",
  });
});

test("buildChatContext preserves histories that do not end in a user turn", () => {
  const result = buildChatContext([
    { role: "user", content: "Hello" },
    { role: "assistant", content: "Hi there" },
  ]);

  assert.deepEqual(result.messages.map((message) => message.role), [
    "system",
    "user",
    "assistant",
  ]);
  assert.equal(result.droppedHistoryMessages, 0);
});

test("buildChatContext truncates histories that do not end in a user turn", () => {
  const result = buildChatContext(
    [
      { role: "user", content: "oversized old turn" },
      { role: "assistant", content: "recent reply" },
    ],
    {
      countTokens: (text) => (text.includes("oversized") ? 4_000 : 1),
    },
  );

  assert.equal(result.droppedHistoryMessages, 1);
  assert.deepEqual(result.messages.map((message) => message.role), [
    "system",
    "assistant",
  ]);
});

test("buildChatContext truncates oversized final user content through shared context utilities", () => {
  const result = buildChatContext(
    [
      { role: "assistant", content: "old reply".repeat(1_000) },
      { role: "user", content: "N".repeat(16_000) },
    ],
    {
      countTokens: (text) => text.length,
    },
  );

  assert.equal(result.droppedHistoryMessages, 1);
  assert.equal(result.messages.at(-1)?.role, "user");
  assert.ok(result.messages.at(-1)?.content.length ?? 0 < 16_000);
  assert.ok(result.usage.totalUsed <= result.usage.totalBudget);
});
