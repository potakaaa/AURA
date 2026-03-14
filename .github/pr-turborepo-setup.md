## Description

Initialize the AURA monorepo using Turborepo with the full package structure defined in the architecture document. This is the foundational scaffolding that all other work depends on (Issue #1).

## Type of Change

- [ ] `feat`: New feature
- [ ] `fix`: Bug fix
- [x] `chore`: Maintenance, config, or tooling
- [ ] `docs`: Documentation only
- [ ] `refactor`: Code change that neither fixes a bug nor adds a feature
- [ ] `test`: Adding or updating tests

## Related Issue

Closes #1

## Summary of Changes

- **Workspace config**: `pnpm-workspace.yaml` with `apps/*`, `packages/*`, `services/*`; `turbo.json` with `build`, `test`, `lint`, `dev` pipeline; root `package.json` scripts
- **packages/ai-engine**: Initialized with `prompts/`, `context/` dirs, placeholder exports
- **packages/voice**: Initialized with `wake-word/`, `stt/` subdirectories
- **packages/shared**: Initialized with `types/`, `utils/` exporting shared TypeScript types (`UserId`, `noop`)
- **apps/mobile**: Renamed to `mobile`, added `build`, `lint`, `test`, `start` for Turbo
- **services/api**: Added `lint`, `test` scripts for Turbo
- **infra/docker**: Base `Dockerfile` for API (Node 20 Alpine, multi-stage)
- **infra/ci**: Placeholder README for CI config
- **Config**: `.nvmrc` (Node 20), `.gitignore` (.turbo, dist), `docs/README.md` (repo structure)
- **Verification**: Turborepo cache verified — `turbo run build` twice shows 5/5 cache hits on second run

## Checklist

- [x] Code follows project coding guidelines (ESLint, Prettier)
- [x] Self-review completed
- [x] Comments added for complex logic where needed
- [x] Documentation updated if applicable
- [x] No new warnings introduced
