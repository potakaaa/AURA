import { env } from "../config/env.js";
import {
  createLlmProvider,
  getLlmProviderConfig,
} from "../llm/provider-factory.js";
import { buildChatContext } from "../llm/context-builder.js";
import type { LlmMessage, LlmProvider } from "../llm/types.js";
import { LlmProviderError } from "../llm/types.js";
import type { UserPreferences } from "@aura/ai-engine";

export type ChatMessage = LlmMessage;

type GenerateChatResponseOptions = {
  provider?: LlmProvider;
  userPreferences?: UserPreferences;
};

export async function generateChatResponse(
  messages: ChatMessage[],
  options: GenerateChatResponseOptions = {},
): Promise<string> {
  const demoResponse = getDemoBypassResponse(messages);
  if (demoResponse) {
    return demoResponse;
  }

  if (
    !options.provider &&
    env.LLM_PROVIDER === "openai-compatible" &&
    !env.LLM_API_KEY
  ) {
    throw new LlmProviderError("LLM provider is not configured.", {
      provider: env.LLM_PROVIDER,
      code: "provider_unavailable",
    });
  }

  try {
    const provider = options.provider ?? createLlmProvider(getLlmProviderConfig());
    const context = buildChatContext(messages, {
      userPreferences: options.userPreferences,
    });
    const response = await provider.chat({
      messages: context.messages,
      model: env.LLM_MODEL,
      temperature: 0.3,
    });

    return response.content;
  } catch (error) {
    if (error instanceof LlmProviderError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Unknown LLM error occurred";
    throw new LlmProviderError(message, { provider: env.LLM_PROVIDER });
  }
}

function getDemoBypassResponse(messages: ChatMessage[]): string | undefined {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUserMessage) {
    return undefined;
  }

  const normalizedPrompt = normalizeDemoPrompt(latestUserMessage.content);

  // TODO: Remove this demo-only LLM bypass after the presentation.
  const demoResponse = DEMO_BYPASS_RESPONSES.find(({ matches }) =>
    matches(normalizedPrompt),
  );

  return demoResponse?.response;
}

function normalizeDemoPrompt(prompt: string): string {
  return prompt
    .trim()
    .toLowerCase()
    .replace(/\bjoga\s+liga\b/g, "jogaliga")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/^aura\s+/, "")
    .replace(/\s+/g, " ");
}

type DemoBypassResponse = {
  matches: (prompt: string) => boolean;
  response: string;
};

function includesAll(prompt: string, phrases: string[]): boolean {
  return phrases.every((phrase) => prompt.includes(phrase));
}

const DEMO_BYPASS_RESPONSES: DemoBypassResponse[] = [
  {
    matches: (prompt) => includesAll(prompt, ["brief me for today", "focus on"]),
    response: `Good morning, Rald. You have 3 calendar events today: a client sync at 10:00 AM, a project review at 2:00 PM, and a team standup at 5:00 PM.

Based on your Notion tasks and recent Google Docs updates, your top priorities are:

1. Finalize the Jogaliga handoff notes.
2. Review the API performance issue from yesterday.
3. Prepare talking points for the client sync.

I also found one unresolved item in your meeting notes: confirming who will maintain the AWS backend after handoff.`,
  },
  {
    matches: (prompt) => includesAll(prompt, ["decide", "last jogaliga meeting"]),
    response: `In the last Jogaliga meeting, the main decision was to complete the mobile store submissions first, then hand over the repo setup instructions and service credentials.

The action items were:

1. Submit the latest Android and iOS releases. Done.
2. Share setup configurations through Google Drive. Done.
3. Document current infrastructure costs. Pending.
4. Confirm which services are on free tiers. Done: Neon and Upstash are currently using free tiers.

I can turn this into a clean handoff summary if you want.`,
  },
  {
    matches: (prompt) =>
      includesAll(prompt, ["latest document", "backend setup", "summarize"]),
    response: `I found the latest backend setup document in Google Drive: "Jogaliga Backend Deployment Notes."

Summary:
The backend runs on AWS EC2 with Docker. The database is hosted on Neon, Redis is on Upstash, and environment variables are configured through the deployment setup file. The document also mentions that the API health check endpoint is \`/health\`, and the current staging instance was recently upgraded to \`t3.medium\`.

The most important warning is that performance is still slow on the games screen, so the backend should be inspected for database query bottlenecks, API latency, and missing indexes.`,
  },
  {
    matches: (prompt) => includesAll(prompt, ["finance sheet", "changed this week"]),
    response: `I reviewed your finance sheet. This week, there were 4 new transactions and 1 completed transfer.

The most notable update is a $50 transfer using today's exchange rate of 61.47, which equals approximately PHP 3,073.50 before fees.

Your latest recorded PHP balance increased, but there are still empty fields in the transfer row that should be completed for tracking accuracy. I suggest adding the exchange rate, fee, and final received amount.`,
  },
  {
    matches: (prompt) => includesAll(prompt, ["prepare me", "next client meeting"]),
    response: `Your next client meeting is at 2:00 PM. I checked your calendar, recent Google Docs, Drive files, and Notion notes.

Here's your prep brief:

The client is asking about project handoff, pricing, and technical risks. The latest related document says the biggest risks are exposed environment keys, lack of shared database structure, and limitations of the current single-file HTML setup.

Suggested talking points:

1. Explain that the implementation is possible but needs careful database design.
2. Clarify that Supabase keys must be handled safely with RLS policies.
3. Set expectations that a $200 scope should focus only on the database integration MVP, not full realtime collaboration.

I also found your previous draft reply and can clean it up before the meeting.`,
  },
];
