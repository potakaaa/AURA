import { env } from "../config/env.js";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string | null };
    finish_reason: string | null;
  }>;
};

export async function generateChatResponse(
  messages: ChatMessage[],
): Promise<string> {
  if (!env.LLM_API_KEY) {
    return "LLM_API_KEY is not set. Add it to use real model responses.";
  }

  const response = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `LLM request failed (${response.status}): ${errorBody || response.statusText}`,
    );
  }

  const data = (await response.json()) as ChatCompletionResponse;
  return data.choices[0]?.message?.content ?? "";
}
