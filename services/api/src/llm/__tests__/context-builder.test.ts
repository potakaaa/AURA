import assert from "node:assert/strict";
import test from "node:test";
import { SYSTEM_PROMPT } from "@aura/ai-engine";
import { buildChatContext } from "../context-builder.js";

test("buildChatContext returns only the shared system prompt for empty history", () => {
  const result = buildChatContext([]);

  assert.deepEqual(result.messages, [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ]);
  assert.equal(result.droppedHistoryMessages, 0);
});

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

test("buildChatContext keeps multi-turn history before the latest user turn", () => {
  const result = buildChatContext([
    { role: "user", content: "First question" },
    { role: "assistant", content: "First answer" },
    { role: "user", content: "Follow-up" },
  ]);

  assert.deepEqual(result.messages.map((message) => message.role), [
    "system",
    "user",
    "assistant",
    "user",
  ]);
  assert.deepEqual(
    result.messages.map((message) => message.content),
    [SYSTEM_PROMPT, "First question", "First answer", "Follow-up"],
  );
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

test("buildChatContext filters empty messages before dispatch", () => {
  const result = buildChatContext([
    { role: "system", content: " " },
    { role: "user", content: "\n" },
    { role: "assistant", content: " useful prior answer " },
    { role: "user", content: " final question " },
  ]);

  assert.deepEqual(result.messages.map((message) => message.role), [
    "system",
    "assistant",
    "user",
  ]);
  assert.deepEqual(result.messages.at(1), {
    role: "assistant",
    content: "useful prior answer",
  });
  assert.deepEqual(result.messages.at(-1), {
    role: "user",
    content: "final question",
  });
});

test("buildChatContext injects optional user preferences through shared context utilities", () => {
  const result = buildChatContext([{ role: "user", content: "Plan my morning" }], {
    userPreferences: {
      name: "AURA Tester",
      timezone: "Asia/Manila",
      preferredLanguage: "en-US",
    },
  });

  assert.deepEqual(result.messages.map((message) => message.role), [
    "system",
    "system",
    "user",
  ]);
  assert.match(result.messages[1].content, /User preferences/);
  assert.match(result.messages[1].content, /timezone: Asia\/Manila/);
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
