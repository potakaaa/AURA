## Description

This PR implements the full Google OAuth2 authentication flow in the Hono API (`services/api`). It adds `POST /auth/google` (authorization code exchange for access and refresh tokens), `POST /auth/token` (refresh access token), SQLite-backed server-side session and token storage, reusable auth middleware with automatic refresh when access tokens expire, and integration tests with mocked Google endpoints. The API is modularized into `routes/`, `middleware/`, and `auth/` modules so `app.ts` only composes the app. Developer documentation is added at `docs/AUTH.md`, and `services/api/.env.example` documents required OAuth and database variables.

## Type of Change

- [x] `feat`: New feature
- [ ] `fix`: Bug fix
- [ ] `chore`: Maintenance, config, or tooling
- [ ] `docs`: Documentation only
- [ ] `refactor`: Code change that neither fixes a bug nor adds a feature
- [x] `test`: Adding or updating tests

## Related Issue

<!-- Link to the GitHub issue when available, e.g. Closes #1 — Backend auth (OAuth2 Google) / W2 -->

## Checklist

- [x] Code follows project coding guidelines (ESLint, Prettier)
- [x] Self-review completed
- [x] Comments added for complex logic where needed
- [x] Documentation updated if applicable
- [x] No new warnings introduced
