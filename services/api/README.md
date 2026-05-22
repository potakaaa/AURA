# AURA API (Express)

Small Express backend scaffold for:

- LLM endpoint integration (`/llm/chat`)
- Future Supabase integration (`/supabase/status`)

## Quick start

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies from repo root.
3. Start development server:

```bash
pnpm --filter api dev
```

## Conversation context

`POST /llm/chat` currently accepts `{ "messages": [{ "role": "user", "content": "..." }] }`
and returns `{ "reply": "..." }`. Keep this request shape until the mobile app
is ready to send conversation or session identifiers.

For the MVP, mobile owns short-term conversation restore by keeping the visible
turns in local UI state and, when persistence is enabled, saving the latest
bounded turns in local storage before replaying them as `messages` on the next
request. The API treats `messages` as provider-agnostic AURA chat history with
shared `system`, `user`, and `assistant` roles.

Prompt and context policy lives in `@aura/ai-engine`: `SYSTEM_PROMPT` defines
AURA's base behavior and `assembleContextWindow(...)` owns history truncation,
user preference injection, and context ordering. The API applies that policy in
`src/llm/context-builder.ts` before provider dispatch. Provider adapters receive
already-normalized, bounded `LlmMessage[]` values and should only translate that
shape to their transport format.

## Ollama

Set `LLM_PROVIDER=ollama` to use the native Ollama `/api/chat` endpoint. The
API process must be able to reach the Ollama host configured in `LLM_BASE_URL`;
this is separate from what the mobile app can reach. For Android emulator
testing, the mobile app's `localhost` is not the Mac host, but Ollama is called
from `services/api`, so configure the API server's network path to Ollama.

## Gemini

Set `LLM_PROVIDER=gemini` to use Gemini's native `generateContent` API. This
mode maps AURA `system`, `user`, and `assistant` messages into Gemini's native
request format and sends the API key with the `x-goog-api-key` header.

Use `LLM_PROVIDER=openai-compatible` with
`LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai` only
when you intentionally want Gemini's OpenAI-compatible API surface.
