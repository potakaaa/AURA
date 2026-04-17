## Description

This PR adds the first-run **welcome / onboarding** experience in the mobile app: a dedicated `welcome` screen with hero imagery, gradient headline typography (`GradientText`), feature-style cards, and primary navigation actions. It introduces shared UI pieces (`AppTopBar`), theme and raw color tokens for consistent dark UI, and wires Expo Router (`Stack`) so users land on onboarding as appropriate. The Android native project is included for local builds, with Metro and app config updates. Local persistence and startup flow are aligned with SQLite init and theme hydration from stored preferences. CI and pre-commit gain a check to discourage hardcoded colors outside the approved palette.

## Type of Change

- [x] `feat`: New feature
- [ ] `fix`: Bug fix
- [x] `chore`: Maintenance, config, or tooling
- [ ] `docs`: Documentation only
- [ ] `refactor`: Code change that neither fixes a bug nor adds a feature
- [x] `test`: Adding or updating tests

## Related Issue

<!-- Link a registry issue when filed, e.g. Closes #NNN -->

## Checklist

- [x] Code follows project coding guidelines (ESLint, Prettier)
- [x] Self-review completed
- [x] Comments added for complex logic where needed
- [ ] Documentation updated if applicable
- [x] No new warnings introduced
