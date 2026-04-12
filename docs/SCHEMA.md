# Database Schema

This document describes the authentication data model used by the API service.

## `users`

Stores one profile per Google identity.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `user_id` | `TEXT` | `PRIMARY KEY` | Internal UUID for the user. |
| `google_sub` | `TEXT` | `NOT NULL`, `UNIQUE` | Google subject identifier from userinfo. |
| `email` | `TEXT` | nullable | Latest known user email. |
| `name` | `TEXT` | nullable | Latest known display name. |
| `picture` | `TEXT` | nullable | Latest known profile image URL. |
| `created_at` | `INTEGER` | `NOT NULL` | Creation time in Unix milliseconds. |
| `last_login_at` | `INTEGER` | `NOT NULL` | Last successful OAuth login in Unix milliseconds. |

## `auth_sessions`

Stores API session credentials linked to a user.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `session_id` | `TEXT` | `PRIMARY KEY` | Session UUID. |
| `user_id` | `TEXT` | `FOREIGN KEY` -> `users.user_id` | Owning user ID. |
| `access_token` | `TEXT` | `NOT NULL` | Current active OAuth access token. |
| `previous_access_token` | `TEXT` | nullable | Previous token retained for rotation grace. |
| `refresh_token` | `TEXT` | `NOT NULL`, `UNIQUE` | Refresh token for Google token refresh flow. |
| `expires_at` | `INTEGER` | nullable during migration | Access token expiry time in Unix milliseconds. |
| `created_at` | `INTEGER` | nullable during migration | Session creation time in Unix milliseconds. |
| `token_type` | `TEXT` | nullable during migration | OAuth token type (`Bearer`). |
| `scope` | `TEXT` | nullable | Granted OAuth scope string. |
| `updated_at` | `INTEGER` | nullable during migration | Last session update in Unix milliseconds. |

## Indexes

- `idx_users_google_sub` on `users(google_sub)`
- `idx_auth_sessions_access_token` on `auth_sessions(access_token)`
- `idx_auth_sessions_user_id` on `auth_sessions(user_id)`

## Migration Notes

The API runs migration-safe startup SQL in `services/api/src/auth/session-store.ts`:

- Creates `users` and `auth_sessions` tables if missing.
- Adds required columns to older `auth_sessions` schemas if needed.
- Backfills `users` from legacy `auth_sessions.google_sub`.
- Backfills `auth_sessions.user_id`, `expires_at`, and timestamp defaults.
