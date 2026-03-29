# AURA Documentation

**AURA** (Ambient Unified Reasoning Assistant) is a voice-first personal AI that combines LLM reasoning with system assistant capabilities. It operates as an always-available, privacy-focused digital companion.

## Repository Structure

```
AURA/
├── apps/              # Applications
│   └── mobile/       # React Native (Expo) mobile app
├── packages/         # Shared packages
│   ├── ai-engine/    # Prompts and context for LLM reasoning
│   ├── voice/        # Wake-word and STT modules
│   └── shared/       # Shared types and utilities
├── services/         # Backend services
│   └── api/          # Hono API (TypeScript)
├── infra/            # Infrastructure
│   ├── docker/       # Docker config for API
│   └── ci/           # CI/CD config placeholders
└── docs/             # Documentation (this folder)
    ├── AURA/         # Product, architecture, and strategy
    └── issues/       # GitHub Issues Registry, MVP planning
```

## Quick Start

```bash
# Install dependencies (from repo root)
pnpm install

# Run mobile app
pnpm dev:mobile

# Run API
pnpm dev:api

# Build, test, lint (via Turborepo)
pnpm build
pnpm test
pnpm lint
```

## Documentation Index

- [AURA Context & Vision](AURA/aura-context.md)
- [MVP Issues Registry](issues/AURA_Issues_Registry.md)
- [Development Setup](AURA/06_development/dev_setup.md)
- [API Design](AURA/06_development/api_design.md)
- [CI/CD Pipeline](AURA/06_development/ci_cd_pipeline.md)
