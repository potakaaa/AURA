# AURA

AURA (Ambient Unified Reasoning Assistant) is a voice-first personal AI monorepo containing an Expo mobile app, a TypeScript API, and shared domain packages.

## Quick Start

```bash
git clone https://github.com/potakaaa/AURA.git
cd AURA
pnpm install
pnpm build
pnpm dev
```

## Documentation

- [Developer Setup](docs/SETUP.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Contributing Guide](docs/CONTRIBUTING.md)
- [Documentation Index](docs/README.md)

## Repository Structure

```text
apps/mobile     Expo React Native app
services/api    Hono TypeScript API
packages/shared Shared types/utilities
packages/ai-engine AI context/prompt package
packages/voice Voice and STT package
infra           Docker and CI infrastructure
docs            Product and engineering docs
```

## Common Commands

```bash
pnpm dev:mobile
pnpm dev:api
pnpm lint
pnpm test
```
