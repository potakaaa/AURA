import assert from "node:assert/strict";
import test from "node:test";
import { createLlmProvider } from "../provider-factory.js";
import { GeminiProvider } from "../providers/gemini-provider.js";
import { OllamaProvider } from "../providers/ollama-provider.js";
import { OpenAiCompatibleProvider } from "../providers/openai-compatible-provider.js";
import type { LlmProviderConfig, LlmProviderName } from "../types.js";

function config(provider: LlmProviderName): LlmProviderConfig {
  return {
    provider,
    baseUrl: "http://localhost:11434",
    apiKey: "test-key",
    model: "test-model",
    timeoutMs: 1000,
  };
}

test("provider factory selects OpenAI-compatible providers", () => {
  const openAiCompatible = createLlmProvider(config("openai-compatible"));
  const openAi = createLlmProvider(config("openai"));

  assert.ok(openAiCompatible instanceof OpenAiCompatibleProvider);
  assert.equal(openAiCompatible.name, "openai-compatible");
  assert.ok(openAi instanceof OpenAiCompatibleProvider);
  assert.equal(openAi.name, "openai");
});

test("provider factory selects Ollama provider", () => {
  const provider = createLlmProvider(config("ollama"));

  assert.ok(provider instanceof OllamaProvider);
  assert.equal(provider.name, "ollama");
});

test("provider factory selects Gemini provider", () => {
  const provider = createLlmProvider(config("gemini"));

  assert.ok(provider instanceof GeminiProvider);
  assert.equal(provider.name, "gemini");
});
