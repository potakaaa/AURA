# AURA

AURA (Ambient Unified Reasoning Assistant) is a voice-first personal AI assistant for turning natural language into useful action. The project combines a React Native mobile app, a TypeScript API, shared reasoning packages, and voice/STT modules in one pnpm monorepo.

The long-term goal is an always-available, privacy-focused companion that can listen, understand context, summarize information, and execute cross-app workflows while keeping users in control of their data.

## What is in this repo

```text
AURA/
|-- apps/
|   `-- mobile/          Expo React Native app
|-- services/
|   `-- api/             TypeScript Express API
|-- packages/
|   |-- ai-engine/       Prompting, context, and reasoning helpers
|   |-- shared/          Shared types and utilities
|   `-- voice/           Voice and speech-to-text modules
|-- docs/                Product, architecture, setup, and issue docs
|-- infra/               CI and infrastructure notes
|-- pnpm-workspace.yaml  Workspace package layout
`-- turbo.json           Turborepo task pipeline
```

## Current stack

- Mobile: Expo SDK 54, React Native 0.81, Expo Router, NativeWind, React Native Reusables
- Voice: `expo-speech-recognition` through `@aura/voice`
- API: TypeScript, Express, Zod, OpenAI-compatible LLM proxy settings
- Tooling: pnpm workspaces, Turborepo, TypeScript, Vitest, pre-commit hooks
- Storage and auth foundations: Expo SecureStore, Expo SQLite, Supabase client scaffolding

## Quick start

### Prerequisites

- Node.js 22.x
- pnpm 10.x
- JDK 17+
- Android Studio, Android SDK, and at least one emulator image for Android development

The repo pins pnpm in `package.json` and expects Node 22 via `.nvmrc`.

### Install

```bash
git clone https://github.com/potakaaa/AURA.git
cd AURA
pnpm install
```

### Configure the API

```bash
cp services/api/.env.example services/api/.env
```

Then set the values you need:

```bash
PORT=4000
NODE_ENV=development
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=
LLM_MODEL=gpt-4o-mini
```

If `LLM_API_KEY` is empty, the API can still run, but LLM responses will use the service fallback.

### Run the app and API

In separate terminals:

```bash
pnpm dev:api
pnpm dev:mobile
```

The API defaults to `http://localhost:4000`. The mobile command starts the Expo dev server with a clean cache.

For native voice/STT validation, use an Expo development client rather than Expo Go.

```bash
pnpm --filter mobile android
```

## Common commands

```bash
# Run all dev tasks through Turborepo
pnpm dev

# Start one workspace
pnpm dev:mobile
pnpm dev:api

# Build, test, and lint all workspaces
pnpm build
pnpm test
pnpm lint

# Mobile-specific checks
pnpm --filter mobile typecheck
pnpm --filter mobile test

# Voice package checks
pnpm --filter @aura/voice build
pnpm --filter @aura/voice test
```

## API endpoints

The API service currently exposes:

- `GET /` - service metadata and endpoint list
- `GET /health` - health check
- `POST /llm/chat` - OpenAI-compatible chat proxy scaffold
- `GET /supabase/status` - Supabase integration status scaffold

Run it locally with:

```bash
pnpm --filter api dev
```

## Mobile notes

The mobile app is an Expo Router application with native modules for local storage, secure key handling, and speech recognition.

Important development notes:

- Expo Go is not enough for all native-module validation.
- Use a development client for STT and encrypted local database work.
- `EXPO_PUBLIC_DB_UNENCRYPTED=true` can be used only in development to disable SQLCipher for local debugging.
- Supabase client setup expects `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when auth features are enabled.

See [apps/mobile/README.md](apps/mobile/README.md) for more mobile-specific details.

## Documentation

Start here:

- [Developer Setup](docs/SETUP.md)
- [Documentation Index](docs/README.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [AURA Context and Vision](docs/AURA/aura-context.md)
- [MVP Issues Registry](docs/issues/AURA_Issues_Registry.md)
- [STT Evaluation](docs/STT_EVALUATION.md)
- [Contributing Guide](docs/CONTRIBUTING.md)

## Development workflow

1. Create a focused branch from `development`.
2. Install dependencies from the repository root with `pnpm install`.
3. Make changes in the relevant workspace.
4. Run the smallest useful validation first, then broader checks before opening a PR.
5. Run pre-commit hooks before committing.

Pull requests should target `development`, use Conventional Commit style titles, and assign `potakaaa`.

## Quality checks

The root scripts fan out through Turborepo:

```bash
pnpm lint
pnpm test
pnpm build
```

Install and run pre-commit hooks:

```bash
pre-commit install --hook-type pre-commit --hook-type pre-push
pre-commit run --all-files
pre-commit run --hook-stage pre-push --all-files
```

## Product direction

AURA is being built around a few durable principles:

- Voice-first interaction for fast capture and delegation
- Reasoning before action, with clear user confirmation where needed
- Privacy-first architecture with local-first voice and storage foundations
- Modular integrations for calendar, email, files, messaging, and productivity tools
- Transparent behavior so users can understand what AURA accessed and why

The active roadmap and acceptance criteria live in [docs/issues/AURA_Issues_Registry.md](docs/issues/AURA_Issues_Registry.md).
