# AURA — Agent Instructions

> **Purpose:** This file provides persistent context for Cursor's AI Agent. Refer to it at the start of every session and when making decisions that affect the project.

---

## Project Overview

**AURA** (Ambient Unified Reasoning Assistant) is a voice-first personal AI that combines LLM reasoning with system assistant capabilities. It operates as an always-available, privacy-focused digital companion.

- **Repository:** [potakaaa/AURA](https://github.com/potakaaa/AURA)
- **Stack:** React Native (Expo) mobile app, TypeScript API (Hono), monorepo with pnpm

---

## Codebase Structure

```
AURA/
├── apps/mobile/          # React Native (Expo) mobile app
├── services/api/         # Hono backend API
├── docs/
│   └── issues/           # GitHub Issues Registry, MVP planning
└── package.json          # Root workspace scripts
```

**Key docs to reference:**
- `docs/issues/AURA_Issues_Registry.md` — MVP roadmap, issues, acceptance criteria
- `docs/AURA/aura-context.md` — Product vision, architecture, strategy
- `docs/AURA/06_development/` — Dev setup, coding guidelines, API design

---

## Conventions

### Pull Requests
- **Base branch:** `development` (always)
- **Title:** Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat:`, `fix:`, `chore:`)
- **Assignee:** `potakaaa`

### Commits & Pre-commit
- Run pre-commit scripts before committing
- Never bypass linters; fix issues to pass checks

### Code Quality
- Follow existing linter rules (ESLint, Prettier, etc.)
- Keep rules under 500 lines where applicable

---

## Development Workflow

- **Mobile dev:** `pnpm dev:mobile` or `pnpm --filter mobile start`
- **API dev:** `pnpm dev:api` or `pnpm --filter api dev`
- **Install deps:** `pnpm install` from root

---

## MVP Timeline

- **9 weeks:** Mar 16 — May 17, 2026
- **40 issues:** P0 (31), P1 (9)
- Use `docs/issues/AURA_Issues_Registry.md` for task details and acceptance criteria
