# Google OAuth2 Authentication (Backend)

This document describes the Google OAuth2 flow implemented in `services/api` for MVP.
It is the authentication prerequisite for Google Calendar, Drive, and Gmail integrations.

## Overview

The backend exposes two auth endpoints:

- `POST /auth/google` exchanges a Google authorization code for access and refresh tokens.
- `POST /auth/token` exchanges a refresh token for a new access token.

Tokens are stored server-side in SQLite and associated with a generated session id.
Protected route middleware validates bearer access tokens, and expired tokens are
automatically refreshed through the stored refresh token.

## OAuth2 Flow

1. Mobile app starts Google OAuth consent with scopes `openid email profile`.
2. Google redirects with an authorization `code`.
3. Client sends `code` to `POST /auth/google`.
4. Backend exchanges `code` at Google token endpoint and fetches user profile.
5. Backend stores session + Google tokens in SQLite and returns token payload.
6. Client calls protected routes using `Authorization: Bearer <accessToken>`.
7. Middleware validates token against server-side session state.
8. If token is expired, middleware refreshes it automatically and sets
   `x-refreshed-access-token` in the response.

## Required Environment Variables

Set these in `services/api/.env` (and keep `services/api/.env.example` as template):

- `GOOGLE_CLIENT_ID`: OAuth client id from Google Cloud Console.
- `GOOGLE_CLIENT_SECRET`: OAuth client secret from Google Cloud Console.
- `GOOGLE_REDIRECT_URI`: redirect URI registered in OAuth credentials.
- `GOOGLE_OAUTH_SCOPES`: default `openid email profile`.
- `GOOGLE_TOKEN_ENDPOINT`: default `https://oauth2.googleapis.com/token`.
- `GOOGLE_USERINFO_ENDPOINT`: default `https://openidconnect.googleapis.com/v1/userinfo`.
- `AUTH_DB_PATH`: SQLite path for auth/session persistence.
- `AUTH_ACCESS_TOKEN_EXPIRY_SKEW_MS`: optional expiry skew buffer in milliseconds.

## API Contracts

### `POST /auth/google`

Request:

```json
{
  "code": "google-authorization-code",
  "redirectUri": "aura://oauth2redirect/google",
  "codeVerifier": "optional-pkce-code-verifier"
}
```

Response `200`:

```json
{
  "sessionId": "uuid",
  "accessToken": "google-access-token",
  "refreshToken": "google-refresh-token",
  "tokenType": "Bearer",
  "scope": "openid email profile",
  "expiresIn": 3600,
  "user": {
    "sub": "google-subject",
    "email": "user@example.com",
    "name": "AURA User",
    "picture": "https://..."
  }
}
```

### `POST /auth/token`

Request:

```json
{
  "refreshToken": "google-refresh-token"
}
```

Response `200`:

```json
{
  "sessionId": "uuid",
  "accessToken": "new-google-access-token",
  "tokenType": "Bearer",
  "scope": "openid email profile",
  "expiresIn": 3600
}
```

Error response example (`401 Unauthorized`):

```json
{
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token is invalid or revoked",
    "retryable": false
  }
}
```

## Google Cloud Console Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable OAuth consent screen and configure app details.
4. Add scopes: `openid`, `email`, `profile`.
5. Create OAuth client credentials.
6. Add your mobile redirect URI (`aura://oauth2redirect/google`) and any web callback URIs.
7. Copy client id and secret into `services/api/.env`.

## Notes

- Keep credentials in environment variables only (never hardcode in source).
- Additional Google integration scopes are intentionally deferred to W7.
