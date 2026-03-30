# Contributing Guide

This document defines how to contribute code safely and consistently in the AURA monorepo.

## Branching Strategy

1. Create feature/fix branches from the integration branch.
2. Use branch names like:
   - `feat/<issue-or-scope>`
   - `fix/<issue-or-scope>`
   - `chore/<scope>`
3. Open pull requests to the integration branch (`development` by project convention).
4. Keep branches focused to one issue or tightly related change set.

## Commit Message Convention

Use Conventional Commits for all commit messages and PR titles.

Supported types in this repo include:

- `feat`: new feature
- `fix`: bug fix
- `chore`: maintenance/tooling/config
- `docs`: documentation changes only
- `refactor`: internal code restructuring without behavior change
- `test`: test additions or updates

Examples:

```text
feat(api): add health response metadata
fix(mobile): handle missing auth token gracefully
docs(setup): clarify android sdk path setup
```

## Pull Request Template

Use the repository template at `.github/PULL_REQUEST_TEMPLATE.md`.

Expected PR body sections:

1. Description
2. Type of Change (checkboxes)
3. Related Issue
4. Checklist

Checklist expectations:

- Code follows project style and linting rules
- Self-review is completed
- Complex logic is commented where needed
- Documentation is updated when behavior changes
- No new warnings are introduced

## Code Review Expectations

### Author Responsibilities

1. Ensure local checks pass before requesting review:

```bash
pnpm lint
pnpm test
pnpm build
```

2. Keep PRs reviewable (prefer small to medium changes).
3. Add screenshots/logs for UI or behavior changes.
4. Link relevant issues and explain trade-offs in the PR description.

### Reviewer Responsibilities

1. Verify correctness and behavior against issue requirements.
2. Check API contracts/types for backward compatibility.
3. Validate error handling and edge cases.
4. Ensure tests/docs are updated when needed.
5. Request clear follow-ups when scope is intentionally deferred.

## Local Development Commands

```bash
pnpm install
pnpm dev:mobile
pnpm dev:api
pnpm test
```

## CI Expectations

Pull requests are expected to pass CI checks for:

- Lint (Turbo)
- Test (Turbo)
- Build (Turbo)
- Mobile Check (Expo, non-Gradle)
