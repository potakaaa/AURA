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

## Ollama

Set `LLM_PROVIDER=ollama` to use the native Ollama `/api/chat` endpoint. The
API process must be able to reach the Ollama host configured in `LLM_BASE_URL`;
this is separate from what the mobile app can reach. For Android emulator
testing, the mobile app's `localhost` is not the Mac host, but Ollama is called
from `services/api`, so configure the API server's network path to Ollama.
