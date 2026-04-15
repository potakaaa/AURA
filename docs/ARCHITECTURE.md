# Architecture Overview

AURA is a pnpm + Turborepo monorepo organized into apps, services, and shared packages.

## Monorepo Layout

```text
AURA/
├── apps/
│   └── mobile/       # Expo React Native client
├── services/
│   └── api/          # Hono HTTP API (TypeScript)
├── packages/
│   ├── shared/       # Shared types and utilities
│   ├── ai-engine/    # AI context/prompt package (scaffolded)
│   └── voice/        # Voice/STT package (scaffolded)
├── infra/            # Docker + CI infrastructure assets
└── docs/             # Product and engineering documentation
```

## Workspace Orchestration

- Package manager: `pnpm` workspaces
- Task runner: `turbo`
- Root tasks fan out to workspaces via scripts:
1. `pnpm build` -> `turbo run build`
2. `pnpm test` -> `turbo run test`
3. `pnpm lint` -> `turbo run lint`
4. `pnpm dev` -> `turbo run dev`

## Layer Responsibilities

### Client Layer (`apps/mobile`)

- Expo Router React Native app
- UI rendering, navigation, and client interactions
- Android/iOS/Web dev entrypoints through Expo scripts

### API Layer (`services/api`)

- Hono HTTP server
- Entrypoint in `src/index.ts` loads dotenv and starts server
- App composition in `src/app.ts`:
1. CORS policy (development permissive, production restricted by `CORS_ORIGINS`)
2. JSON payload validation middleware
3. Health endpoint (`GET /health`)
4. Auth endpoint stubs (`POST /auth/google`, `POST /auth/token`)
5. Not-found and global error handling

### Shared/Domain Packages (`packages/*`)

- `shared`: reusable cross-package types/utilities
- `ai-engine`: intended home for prompts/context and LLM orchestration interfaces (currently scaffolded)
- `voice`: intended home for wake-word/STT domain modules (currently scaffolded)

## Data Flow (Current State)

1. Mobile app issues HTTP requests to API endpoints.
2. API receives request in Hono route pipeline.
3. Middleware handles CORS and JSON validation.
4. Route handler returns JSON response payload.
5. Client consumes response and updates UI state.

## Data Flow (Target Layering)

1. `apps/mobile` captures user intent (voice/text interaction).
2. `services/api` authenticates, validates, and orchestrates use-cases.
3. `packages/voice` handles voice pipeline primitives.
4. `packages/ai-engine` handles prompt/context assembly for model calls.
5. `packages/shared` provides common contracts used by both client and server.

This structure keeps UI, transport, and domain logic decoupled while preserving a single repository workflow.
