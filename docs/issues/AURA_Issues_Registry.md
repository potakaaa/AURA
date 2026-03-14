# AURA MVP — GitHub Issues Registry

> **Repository:** [potakaaa/AURA](https://github.com/potakaaa/AURA)
> **Total Issues:** 40 | **P0:** 31 | **P1:** 9
> **Timeline:** Mar 16 — May 17, 2026 (9 weeks)
> **Naming Convention:** `[W{n} | {date_range} | P{priority}] Title`

---

## Summary

| Week | Date Range | Issues | P0 | P1 |
|------|------------|--------|----|----|
| W1 | Mar 16-22 | #1, #2, #3, #4, #5 | 5 | 0 |
| W2 | Mar 23-29 | #6, #7, #8, #9, #10 | 5 | 0 |
| W3 | Mar 30-Apr 5 | #11, #12, #13, #14 | 4 | 0 |
| W4 | Apr 7-12 | #15, #16, #17, #18 | 4 | 0 |
| W5 | Apr 14-19 | #19, #20, #21, #22 | 3 | 1 |
| W6 | Apr 21-26 | #23, #24, #25, #26 | 3 | 1 |
| W7 | Apr 28-May 3 | #27, #28, #29, #30 | 2 | 2 |
| W8 | May 5-10 | #31, #32, #33, #34 | 0 | 4 |
| W9 | May 12-17 | #35, #48, #49, #50, #51, #52 | 5 | 1 |
| **Total** | | **40 issues** | **31** | **9** |

---

## W1 — Foundation & Setup (Mar 16–22)

### Issue #1
**[[W1 | Mar 16-22 | P0] Monorepo setup with Turborepo and package structure](https://github.com/potakaaa/AURA/issues/1)**

**Labels:** `P0` `setup` `infra`

## Description

Initialize the AURA monorepo using Turborepo with the full package structure defined in the architecture document. This is the foundational scaffolding that all other work depends on.

### Target Structure
```
aura/
├── apps/
│   └── android/
│       ├── src/main/kotlin/
│       └── build.gradle.kts
├── packages/
│   ├── backend/
│   │   └── src/ (routes/, services/)
│   ├── ai-engine/
│   │   └── prompts/, context/
│   ├── voice/
│   │   └── wake-word/, stt/
│   └── shared/
│       └── types/, utils/
├── infra/
│   └── docker/, ci/
├── docs/
├── turbo.json
└── package.json
```

## Acceptance Criteria

- [ ] `turbo.json` configured with pipeline for `build`, `test`, `lint`, `dev` tasks
- [ ] Root `package.json` with workspaces pointing to `apps/*` and `packages/*`
- [ ] `packages/backend` initialized as a TypeScript Node package with `tsconfig.json`
- [ ] `packages/ai-engine` initialized with placeholder prompt and context directories
- [ ] `packages/voice` initialized with `wake-word/` and `stt/` subdirectories
- [ ] `packages/shared` initialized with `types/` and `utils/` subdirectories, exporting shared TypeScript types
- [ ] `infra/docker/` contains a base `Dockerfile` for the backend service
- [ ] `infra/ci/` contains placeholder for CI config
- [ ] `docs/` directory with a root `README.md` explaining the repo structure
- [ ] `turbo.json` caching is verified — running `turbo run build` twice shows cache hits
- [ ] `.gitignore` properly excludes `node_modules`, `dist`, `.turbo`, build artifacts
- [ ] `.nvmrc` or `.node-version` pinning Node.js version (≥18 LTS)
- [ ] All packages can be installed from root with a single `npm install` / `yarn install`

---

### Issue #2
**[[W1 | Mar 16-22 | P0] Android project setup — Kotlin + Jetpack Compose + Navigation](https://github.com/potakaaa/AURA/issues/2)**

**Labels:** `P0` `setup` `android`

## Description

Set up the Android application project under `apps/android/` using Kotlin, Jetpack Compose, and the Navigation component. This is the mobile app foundation that will host the voice UI, chat interface, and integration screens.

## Acceptance Criteria

- [ ] Android project created under `apps/android/` with `build.gradle.kts` (Kotlin DSL)
- [ ] `minSdk = 26`, `targetSdk = 34`, `compileSdk = 34`
- [ ] Jetpack Compose BOM configured with latest stable version
- [ ] Navigation-Compose dependency added and a `NavHost` with placeholder routes: `home`, `chat`, `settings`
- [ ] Material 3 theme scaffolded with AURA brand colors (primary, secondary, surface)
- [ ] `MainActivity.kt` launches the Compose navigation graph
- [ ] App builds and runs on an emulator (API 34) with no errors
- [ ] ProGuard/R8 rules file exists (can be empty for now)
- [ ] App manifest includes required permissions placeholders: `INTERNET`, `RECORD_AUDIO`
- [ ] Base Gradle version catalog (`libs.versions.toml`) used for dependency management
- [ ] Unit test target compiles and runs a trivial placeholder test

---

### Issue #3
**[[W1 | Mar 16-22 | P0] Hono backend scaffolding with health check and auth routes](https://github.com/potakaaa/AURA/issues/3)**

**Labels:** `P0` `setup` `backend`

## Description

Set up the Hono (TypeScript) backend under `packages/backend/`. This service will act as the central orchestration layer proxying LLM calls, managing auth tokens, and providing REST APIs for the Android client.

## Acceptance Criteria

- [ ] Hono app initialized in `packages/backend/src/index.ts`
- [ ] `GET /health` endpoint returns `{ status: "ok", version: "0.1.0", timestamp: <ISO> }`
- [ ] `POST /auth/google` route stubbed with placeholder handler (returns 501)
- [ ] `POST /auth/token` route stubbed with placeholder handler (returns 501)
- [ ] CORS middleware configured for development (permissive) and production (restricted)
- [ ] JSON body parsing middleware applied globally
- [ ] Error handling middleware returns standardized error format: `{ error: { code, message, retryable } }`
- [ ] TypeScript strict mode enabled; `tsconfig.json` configured with `"strict": true`
- [ ] `npm run dev` starts the server with hot-reload (e.g., `tsx watch`)
- [ ] `npm run build` compiles to `dist/`
- [ ] At least 1 integration test hitting `/health` and asserting response structure
- [ ] Environment variables loaded via `.env` file with a `.env.example` template committed

---

### Issue #4
**[[W1 | Mar 16-22 | P0] CI/CD pipeline — GitHub Actions for lint, test, build](https://github.com/potakaaa/AURA/issues/4)**

**Labels:** `P0` `infra` `ci-cd`

## Description

Create a GitHub Actions CI/CD pipeline that runs on every push and PR. The pipeline must lint, test, and build all packages in the monorepo using Turborepo for caching and task orchestration.

## Acceptance Criteria

- [ ] `.github/workflows/ci.yml` triggers on `push` to `main`/`develop` and on all PRs
- [ ] Pipeline installs dependencies from root (`npm ci` or `yarn --frozen-lockfile`)
- [ ] `turbo run lint` runs ESLint across all TypeScript packages
- [ ] `turbo run test` runs unit tests for backend and shared packages
- [ ] `turbo run build` compiles all TypeScript packages
- [ ] Android project: `./gradlew assembleDebug` compiles successfully
- [ ] Android project: `./gradlew testDebugUnitTest` runs Kotlin unit tests
- [ ] Turborepo remote caching enabled (or local cache via artifact upload) to speed up CI
- [ ] Pipeline fails on lint errors, test failures, or build errors (non-zero exit)
- [ ] Total CI time < 10 minutes on a clean run
- [ ] Status checks are visible on PRs (required for branch protection later)

---

### Issue #5
**[[W1 | Mar 16-22 | P0] Development environment documentation](https://github.com/potakaaa/AURA/issues/5)**

**Labels:** `P0` `setup` `docs`

## Description

Write comprehensive developer onboarding documentation so any team member can set up the development environment from scratch and start contributing.

## Acceptance Criteria

- [ ] `docs/SETUP.md` covers: prerequisites (Node.js, JDK, Android SDK, env vars), clone & install, running backend locally, running Android app on emulator, running tests
- [ ] `docs/ARCHITECTURE.md` provides a high-level overview of the monorepo structure, package responsibilities, and data flow between layers
- [ ] `docs/CONTRIBUTING.md` covers: branching strategy (e.g., `feature/*`, `fix/*`), commit message conventions, PR template, code review expectations
- [ ] Root `README.md` links to all docs and includes a quick-start section (≤5 commands to build & run)
- [ ] `.env.example` files exist for backend and any package needing env vars, with descriptions for each variable
- [ ] All commands in the docs have been tested end-to-end by running them in a clean environment

---

## W2 — Foundation (Mar 23–29)

### Issue #6
**[[W2 | Mar 23-29 | P0] Android app shell — Navigation, theming, and base components](https://github.com/potakaaa/AURA/issues/6)**

**Labels:** `P0` `android` `ui`

## Description

Build the foundational Android app shell with full navigation structure, AURA brand theming (Material 3), and reusable base Compose components. This establishes the UI framework for all future screens.

## Acceptance Criteria

- [ ] Bottom navigation bar with 3 tabs: Home, Chat, Settings (icons + labels)
- [ ] `NavHost` correctly routes to each tab's screen composable
- [ ] Material 3 dynamic color theme with AURA brand overrides (light + dark mode)
- [ ] Typography scale defined: Display, Headline, Title, Body, Label
- [ ] Reusable components created: `AuraTopBar`, `AuraButton`, `AuraTextField`, `AuraCard`
- [ ] Splash screen implemented using the Android 12+ SplashScreen API
- [ ] Dark mode toggle works and persists via `DataStore` preferences
- [ ] App icon and adaptive icon configured with AURA branding
- [ ] Screen transitions use Compose animations (fade or slide)
- [ ] All base components have `@Preview` composables for quick visual verification

---

### Issue #7
**[[W2 | Mar 23-29 | P0] Backend auth — OAuth2 Google authentication flow](https://github.com/potakaaa/AURA/issues/7)**

**Labels:** `P0` `backend` `auth` `security`

## Description

Implement the full Google OAuth2 authentication flow in the Hono backend. This is a P0 prerequisite for all third-party Google integrations (Calendar, Drive, Gmail).

## Acceptance Criteria

- [ ] `POST /auth/google` accepts a Google authorization code and exchanges it for access + refresh tokens
- [ ] `POST /auth/token` accepts a refresh token and returns a new access token
- [ ] Tokens are stored server-side associated with a user session (in-memory store or SQLite for MVP)
- [ ] Access tokens are validated on protected routes via a reusable auth middleware
- [ ] Expired access tokens trigger automatic refresh using the stored refresh token
- [ ] Invalid or revoked tokens return `401 Unauthorized` with a clear error body
- [ ] Google OAuth client ID and secret are loaded from environment variables (never hardcoded)
- [ ] Scopes requested: `openid`, `email`, `profile` (minimal; integration scopes added in W7)
- [ ] Integration tests cover: successful auth, token refresh, invalid code, expired token scenarios
- [ ] `docs/AUTH.md` documents the flow, required env vars, and how to obtain Google OAuth credentials

---

### Issue #8
**[[W2 | Mar 23-29 | P0] Backend API — User management and session handling](https://github.com/potakaaa/AURA/issues/8)**

**Labels:** `P0` `backend` `api`

## Description

Implement user management and session handling endpoints. After OAuth2 login, the backend needs to create/retrieve user records and manage their sessions.

## Acceptance Criteria

- [ ] User model defined with fields: `id` (UUID), `email`, `name`, `picture`, `createdAt`, `lastLoginAt`
- [ ] `POST /auth/google` creates a new user record on first login, retrieves existing on subsequent
- [ ] Session model: `id`, `userId`, `accessToken`, `refreshToken`, `expiresAt`, `createdAt`
- [ ] Sessions are invalidated on explicit logout (`POST /auth/logout`)
- [ ] Auth middleware extracts `userId` from session and attaches to request context
- [ ] `GET /user/me` returns the authenticated user's profile
- [ ] Rate limiting middleware: 100 req/min per user on general endpoints, 20 req/min on auth endpoints
- [ ] All endpoints return standardized error format from Issue #3
- [ ] Unit tests for user creation, session management, and rate limiting logic
- [ ] Database schema documented in `docs/SCHEMA.md`

---

### Issue #9
**[[W2 | Mar 23-29 | P0] Android API client layer — Retrofit + error handling](https://github.com/potakaaa/AURA/issues/9)**

**Labels:** `P0` `android` `networking`

## Description

Build the API client layer for the Android app using Retrofit, enabling all future network calls to the Hono backend with consistent error handling, auth token injection, and response parsing.

## Acceptance Criteria

- [ ] Retrofit client configured with base URL (configurable via BuildConfig for dev/staging/prod)
- [ ] OkHttp interceptor automatically attaches `Authorization: Bearer <token>` to requests
- [ ] OkHttp interceptor handles 401 responses: attempts token refresh, retries original request once
- [ ] Centralized error handling: network errors, HTTP errors, and parsing errors map to sealed `ApiResult<T>` type (`Success`, `Error`, `Loading`)
- [ ] Moshi or Kotlinx Serialization configured for JSON parsing
- [ ] `AuthApiService` interface with `login(code)`, `refreshToken()`, `logout()` methods
- [ ] `UserApiService` interface with `getMe()` method
- [ ] Logging interceptor enabled in debug builds (disabled in release)
- [ ] Connection timeout: 30s, read timeout: 30s, write timeout: 30s
- [ ] Unit tests for error mapping logic; integration test against a mock server for auth flow

---

### Issue #10
**[[W2 | Mar 23-29 | P0] Prompt design — System prompts and output format specification](https://github.com/potakaaa/AURA/issues/10)**

**Labels:** `P0` `ai-engine`

## Description

Design the initial system prompts, tool definitions, and output format specifications for the AURA AI engine. This is foundational R&D that directly feeds into the Claude API integration in W5.

## Acceptance Criteria

- [ ] `packages/ai-engine/prompts/system.ts` — Main system prompt defining AURA's persona, capabilities, and behavioral constraints
- [ ] `packages/ai-engine/prompts/tools.ts` — Tool definitions for: `read_calendar`, `create_event`, `search_drive`, `read_email`, `execute_action`
- [ ] `packages/ai-engine/prompts/formats.ts` — Output format schemas (JSON) for structured responses: action plans, summaries, confirmations
- [ ] `packages/ai-engine/context/window.ts` — Context window management strategy: system prompt + recent history + user preferences (with token counting)
- [ ] Each prompt file includes inline comments explaining design decisions
- [ ] A `README.md` in `packages/ai-engine/` documenting the prompt architecture and how context is assembled
- [ ] At least 5 example conversations (input/output pairs) stored in `packages/ai-engine/prompts/examples/` for future testing
- [ ] Token budget calculations documented: system prompt ≤ 2K tokens, context window ≤ 8K total

---

## W3 — Core Infrastructure (Mar 30 — Apr 5)

### Issue #11
**[[W3 | Mar 30-Apr 5 | P0] Encrypted SQLite setup on Android with Room + SQLCipher](https://github.com/potakaaa/AURA/issues/11)**

**Labels:** `P0` `android` `security` `data`

## Description

Set up the local encrypted database on Android using Room (ORM) with SQLCipher encryption. This is the foundation for all local data storage including conversation history, user preferences, and cached content.

## Acceptance Criteria

- [ ] Room database configured with SQLCipher encryption via `SQLCipherOpenHelperFactory`
- [ ] Encryption key derived from Android Keystore (hardware-backed if available)
- [ ] Database includes initial tables: `users`, `conversations`, `messages`, `preferences`
- [ ] Room DAOs for CRUD operations on each table
- [ ] Database migration strategy in place (Room auto-migration or manual `Migration` objects)
- [ ] `@TypeConverter` for `Date`/`Instant` and `UUID` fields
- [ ] Database inspector works in debug builds (with decrypted access)
- [ ] Instrumented tests verify: insert, query, update, delete on each table
- [ ] Encryption verified: raw `.db` file is not readable without the key
- [ ] Database version starts at `1`; schema exported to `schemas/` directory for migration tracking

---

### Issue #12
**[[W3 | Mar 30-Apr 5 | P0] Backend user management API — Full CRUD + session endpoints](https://github.com/potakaaa/AURA/issues/12)**

**Labels:** `P0` `backend` `api`

## Description

Complete the user management and session handling API with persistent storage (SQLite for MVP backend), building on the auth scaffold from W2.

## Acceptance Criteria

- [ ] Backend SQLite database initialized with `users` and `sessions` tables
- [ ] `GET /user/me` returns authenticated user profile (id, email, name, picture)
- [ ] `PUT /user/me` allows updating user preferences (name, notification settings)
- [ ] `DELETE /user/me` soft-deletes user and invalidates all sessions (GDPR compliance)
- [ ] `POST /auth/logout` invalidates the current session
- [ ] Session cleanup job: expired sessions are purged on a schedule (or on-demand)
- [ ] All mutations are idempotent where applicable
- [ ] Request validation using Zod schemas on all endpoints
- [ ] Integration tests for all CRUD operations and edge cases (duplicate email, missing fields)
- [ ] Postman/Thunder Client collection exported to `docs/api/` for manual testing

---

### Issue #13
**[[W3 | Mar 30-Apr 5 | P0] Android app settings and permissions management UI](https://github.com/potakaaa/AURA/issues/13)**

**Labels:** `P0` `android` `ui` `settings`

## Description

Build the Settings screen with app configuration options and runtime permission management. Users need to grant microphone permission for voice features and manage their data/privacy preferences.

## Acceptance Criteria

- [ ] Settings screen accessible from bottom navigation
- [ ] Sections: Account (email, logout), Voice (wake word toggle, STT language), Privacy (data retention, delete data), About (version, licenses)
- [ ] Runtime permission flow for `RECORD_AUDIO`: request on first voice feature access, explain rationale if denied, deep-link to system settings if permanently denied
- [ ] Data retention preference: session-only, 7 days, 30 days, manual (persisted in Room)
- [ ] "Delete All Data" button with confirmation dialog — wipes local DB and cached content
- [ ] Logout button clears auth tokens, navigates to login screen
- [ ] Settings state managed via Jetpack DataStore (Preferences)
- [ ] All settings persist across app restarts
- [ ] UI matches AURA theming from Issue #6
- [ ] Unit tests for preference read/write logic

---

### Issue #14
**[[W3 | Mar 30-Apr 5 | P0] STT evaluation and selection — Whisper integration research](https://github.com/potakaaa/AURA/issues/14)**

**Labels:** `P0` `voice` `research`

## Description

Evaluate speech-to-text options and finalize the Whisper integration approach for AURA. Determine whether to use on-device Whisper (via whisper.cpp or ONNX) or a cloud fallback, and benchmark accuracy and latency.

## Acceptance Criteria

- [ ] Evaluation document in `docs/STT_EVALUATION.md` comparing: Whisper on-device (whisper.cpp/ONNX), Whisper API (cloud), Google Speech-to-Text, Android built-in STT
- [ ] Benchmarks recorded for each option: accuracy (WER on 20+ test utterances), latency (p50, p95), model size, battery impact estimate
- [ ] Recommended approach documented with rationale (on-device preferred for privacy)
- [ ] Proof-of-concept Android code in `packages/voice/stt/` that captures audio and produces transcription using the chosen approach
- [ ] POC handles: English input, short commands (< 15 seconds), quiet and noisy environments (basic test)
- [ ] Decision on model size (tiny, base, small) with accuracy/latency trade-off documented
- [ ] Multilingual support feasibility assessed (relevant for future; English-only for MVP)

---

## W4 — Voice Engine (Apr 7–12)

### Issue #15
**[[W4 | Apr 7-12 | P0] Wake word detection integration — On-device, low-power](https://github.com/potakaaa/AURA/issues/15)**

**Labels:** `P0` `android` `voice`

## Description

Integrate an on-device wake word detection engine so AURA can be activated hands-free with a custom wake word. Evaluate Porcupine (Picovoice) or a custom solution, prioritizing low power consumption and privacy (no audio sent to cloud during listening).

## Acceptance Criteria

- [ ] Wake word engine runs as a foreground service on Android, listening continuously when enabled
- [ ] Detection latency < 500ms from utterance end to callback
- [ ] False positive rate < 1 per 8 hours of ambient listening in a quiet environment
- [ ] Wake word: "Hey AURA" or "AURA" (configurable)
- [ ] Battery impact: < 5% per hour of continuous listening (benchmarked on a reference device)
- [ ] Audio is processed entirely on-device; no network calls during wake word listening
- [ ] Notification shown when wake word service is active (Android foreground service requirement)
- [ ] Service survives app backgrounding and screen-off
- [ ] Kill switch in Settings to disable wake word listening
- [ ] Integration test: simulated wake word audio triggers the callback

---

### Issue #16
**[[W4 | Apr 7-12 | P0] Whisper STT integration — Audio capture to transcription pipeline](https://github.com/potakaaa/AURA/issues/16)**

**Labels:** `P0` `android` `voice`

## Description

Build the full audio capture → transcription pipeline. After wake word detection triggers, the system captures the user's voice command and transcribes it using the Whisper model selected in W3.

## Acceptance Criteria

- [ ] Audio capture starts automatically after wake word detection
- [ ] Voice Activity Detection (VAD) detects end-of-speech and stops capture (silence threshold: 1.5s)
- [ ] Audio format: 16kHz mono PCM (Whisper's expected input)
- [ ] Noise reduction applied before transcription (basic spectral gating or Android's built-in noise suppressor)
- [ ] Transcription completes within 2 seconds for a 5-second utterance (on-device target)
- [ ] Transcription result delivered as a string to the AI reasoning pipeline
- [ ] Confidence score included with transcription (if supported by the chosen STT engine)
- [ ] Error handling: microphone busy, audio capture failure, transcription timeout — all surface user-friendly messages
- [ ] Fallback to text input if STT consistently fails (3 consecutive failures → prompt user to type)
- [ ] Audio buffers are cleared from memory immediately after transcription (privacy)

---

### Issue #17
**[[W4 | Apr 7-12 | P0] Voice UI — Listening indicator, transcription display, and feedback](https://github.com/potakaaa/AURA/issues/17)**

**Labels:** `P0` `android` `ui` `voice`

## Description

Build the voice interaction UI overlay that gives the user visual feedback during voice interactions: listening state, transcription in progress, and final result display.

## Acceptance Criteria

- [ ] Animated listening indicator (waveform or pulsing orb) appears when wake word is detected
- [ ] Real-time transcription text appears as words are recognized (if streaming STT is available, else after completion)
- [ ] Visual states: Idle → Listening → Processing → Result → Idle (with smooth transitions)
- [ ] Haptic feedback on wake word detection (short vibration)
- [ ] Sound feedback: subtle chime on activation (can be disabled in settings)
- [ ] Manual activation: mic FAB button on the chat screen as an alternative to wake word
- [ ] Cancel gesture: swipe down or tap outside to cancel listening
- [ ] Error state: shows "I didn't catch that" with retry button
- [ ] UI is a semi-transparent overlay that doesn't block the underlying screen
- [ ] Accessibility: listening state announced to TalkBack; cancel button has content description

---

### Issue #18
**[[W4 | Apr 7-12 | P0] Backend API proxy setup for LLM calls](https://github.com/potakaaa/AURA/issues/18)**

**Labels:** `P0` `backend` `ai-engine`

## Description

Build the backend proxy layer that will sit between the Android client and the Claude API. All LLM calls must route through the backend for rate limiting, cost control, caching, and API key security.

## Acceptance Criteria

- [ ] `POST /chat/message` accepts `{ message: string, conversationId?: string }` and proxies to Claude API
- [ ] Claude API key stored as an environment variable, never exposed to the client
- [ ] Server-Sent Events (SSE) streaming: tokens streamed to the client in real-time as Claude generates them
- [ ] Per-user rate limiting: configurable limit (default: 50 requests/hour for free tier)
- [ ] Request logging: user ID, token count (input + output), latency, model used — stored for cost tracking
- [ ] Timeout handling: 30s timeout on Claude API calls; returns a graceful error if exceeded
- [ ] Retry logic: 1 automatic retry on 5xx errors from Claude, with exponential backoff
- [ ] Response format: `{ id, conversationId, content, model, usage: { inputTokens, outputTokens } }`
- [ ] Prompt caching: cache system prompt template to reduce token usage (via Claude's prompt caching feature)
- [ ] Integration test: mock Claude API, verify streaming output, rate limiting, and error scenarios

---

## W5 — AI Core (Apr 14–19)

### Issue #19
**[[W5 | Apr 14-19 | P0] Claude API integration — Full reasoning pipeline](https://github.com/potakaaa/AURA/issues/19)**

**Labels:** `P0` `backend` `ai-engine`

## Description

Complete the Claude API integration with full prompt assembly, tool definitions, and output parsing. This connects the prompt design work from W2 with the proxy layer from W4 to create a functional AI reasoning pipeline.

## Acceptance Criteria

- [ ] System prompt from `packages/ai-engine/prompts/system.ts` injected as the `system` parameter
- [ ] Tool definitions from `packages/ai-engine/prompts/tools.ts` registered as Claude tools
- [ ] Conversation history (up to context window limit) included in messages array
- [ ] Context window management: truncate oldest messages when approaching token limit (8K target)
- [ ] Structured output parsing: extract action plans, summaries, and plain text from Claude's responses
- [ ] Tool use handling: when Claude invokes a tool, the backend executes it and returns the result in the conversation
- [ ] Model selection: use `claude-sonnet-4-20250514` for standard queries (cost-effective)
- [ ] Graceful degradation: if Claude API is down, return a cached "service unavailable" response
- [ ] Logging: full prompt + response logged (in debug mode) for prompt iteration
- [ ] End-to-end test: send a natural language query → receive a structured AI response with reasoning

---

### Issue #20
**[[W5 | Apr 14-19 | P0] Android chat UI with streaming response display](https://github.com/potakaaa/AURA/issues/20)**

**Labels:** `P0` `android` `ui` `chat`

## Description

Build the core chat interface on Android that displays the conversation between the user and AURA, with real-time streaming of AI responses.

## Acceptance Criteria

- [ ] Chat screen with a scrollable message list (LazyColumn) and a text input bar at the bottom
- [ ] Messages rendered as chat bubbles: user messages right-aligned, AURA responses left-aligned
- [ ] SSE streaming: AURA's response tokens appear in real-time (word by word) as they arrive
- [ ] Typing indicator (animated dots) shown while waiting for the first token
- [ ] Voice input button (mic icon) in the input bar triggers the voice pipeline from W4
- [ ] Send button enabled only when input is non-empty
- [ ] Auto-scroll to bottom on new messages; manual scroll-up pauses auto-scroll
- [ ] Markdown rendering in AI responses: bold, italic, lists, code blocks (using a Compose markdown library)
- [ ] Copy-to-clipboard on long-press of any message
- [ ] Empty state: welcome message with suggested prompts ("Try saying: 'Summarize my emails'")
- [ ] Error state: retry button on failed messages
- [ ] Keyboard handling: input bar stays above keyboard, no content overlap

---

### Issue #21
**[[W5 | Apr 14-19 | P0] Conversation management — Multi-turn context and history truncation](https://github.com/potakaaa/AURA/issues/21)**

**Labels:** `P0` `backend` `ai-engine`

## Description

Implement multi-turn conversation management on the backend so Claude maintains context across messages within a session, with intelligent truncation when the context window fills up.

## Acceptance Criteria

- [ ] Each conversation has a unique `conversationId` (UUID); messages are ordered by timestamp
- [ ] Conversation history stored in backend DB: `conversations` table + `messages` table (role, content, timestamp, tokenCount)
- [ ] On each new message, full conversation history (up to limit) is sent to Claude
- [ ] Truncation strategy: when total tokens > 6K (leaving 2K for system prompt + response), drop oldest user/assistant message pairs
- [ ] Summary injection: when truncating, generate a 1-paragraph summary of dropped messages and prepend it as context
- [ ] New conversation created automatically after 30 minutes of inactivity
- [ ] `GET /chat/history?conversationId=X&page=1&limit=20` returns paginated message history
- [ ] `GET /chat/conversations` lists all conversations for the user (id, title, lastMessageAt, messageCount)
- [ ] Conversation title auto-generated from the first user message (first 50 chars or Claude-generated title)
- [ ] Unit tests for truncation logic, pagination, and conversation lifecycle

---

### Issue #22
**[[W5 | Apr 14-19 | P1] Error handling — Rate limits, fallbacks, and timeout management](https://github.com/potakaaa/AURA/issues/22)**

**Labels:** `P1` `backend` `reliability`

## Description

Implement comprehensive error handling across the AI reasoning pipeline to ensure a robust user experience when things go wrong (Claude API issues, rate limits, network failures).

## Acceptance Criteria

- [ ] Rate limit exceeded (user tier): return `429` with `retryAfter` timestamp and a friendly message
- [ ] Rate limit exceeded (Claude API): queue the request and retry after the `Retry-After` header value
- [ ] Claude API timeout (30s): return a fallback message: "I'm taking longer than usual. Please try again."
- [ ] Claude API 5xx error: retry once with exponential backoff; if still fails, return service error
- [ ] Claude API 4xx error (bad request): log the full request for debugging, return generic error to user
- [ ] Network failure (backend → Claude): circuit breaker pattern — after 5 consecutive failures in 60s, short-circuit for 30s
- [ ] All errors include: `errorCode` (enum), `message` (user-friendly), `retryable` (boolean), `retryAfter` (optional timestamp)
- [ ] Android client handles all error codes: shows appropriate UI (retry button, wait message, offline state)
- [ ] Error rates logged and exposed via `/health` endpoint (error count in last 5 minutes)
- [ ] Integration tests for each error scenario using Claude API mocks

---

## W6 — Memory & Context (Apr 21–26)

### Issue #23
**[[W6 | Apr 21-26 | P0] Conversation persistence — Store and retrieve chat history in SQLite](https://github.com/potakaaa/AURA/issues/23)**

**Labels:** `P0` `android` `data`

## Description

Persist all conversations and messages to the encrypted local SQLite database on Android, enabling offline access to chat history and providing the foundation for context memory.

## Acceptance Criteria

- [ ] `ConversationEntity`: id, title, createdAt, lastMessageAt, messageCount, isActive
- [ ] `MessageEntity`: id, conversationId, role (user/assistant/system), content, timestamp, tokenCount
- [ ] Room DAOs: insert message, get messages by conversationId (paginated), get all conversations (sorted by lastMessageAt), delete conversation, search messages by keyword
- [ ] Messages saved to local DB immediately after sending (user) and after full response received (assistant)
- [ ] Offline indicator: if backend is unreachable, show cached conversation history with "offline" badge
- [ ] Sync strategy: local DB is the source of truth; backend history is fetched on first load and on pull-to-refresh
- [ ] Conversation list screen shows: title, last message preview (truncated), timestamp, unread indicator
- [ ] Swipe-to-delete on conversations (with undo snackbar, 5s window)
- [ ] Data retention enforcement: background job deletes conversations older than the user's retention preference (from Settings)
- [ ] Instrumented tests for all DAO operations, including pagination and search

---

### Issue #24
**[[W6 | Apr 21-26 | P0] Context injection — Feed relevant history into LLM prompts](https://github.com/potakaaa/AURA/issues/24)**

**Labels:** `P0` `backend` `ai-engine`

## Description

Build the context injection system that assembles the optimal context window for each LLM call. This includes recent conversation history, user preferences, and relevant prior context to make AURA's responses personalized and contextually aware.

## Acceptance Criteria

- [ ] Context assembler function: `assembleContext(userId, conversationId, newMessage) → messages[]`
- [ ] Context window budget: system prompt (≤2K tokens) + user preferences (≤500 tokens) + conversation history (≤5K tokens) + new message
- [ ] User preferences injected as a structured block: name, timezone, preferred language, frequently used apps, custom instructions
- [ ] Relevant prior context: if user references a past conversation (e.g., "that budget doc we discussed"), search message history and inject relevant snippets
- [ ] Token counting: use `tiktoken` or Claude's token counting to stay within budget
- [ ] Context prioritization: most recent messages > user preferences > prior conversation snippets
- [ ] Empty conversation handling: first message includes a welcome context that guides Claude's initial response
- [ ] Unit tests verifying: context stays within budget, truncation preserves recent messages, preferences are correctly formatted
- [ ] Performance: context assembly completes in < 100ms

---

### Issue #25
**[[W6 | Apr 21-26 | P0] User preference learning — Detect and store patterns](https://github.com/potakaaa/AURA/issues/25)**

**Labels:** `P0` `ai-engine` `data`

## Description

Implement a basic user preference detection system that learns from user interactions and stores preferences for future context injection. This is deterministic pattern matching for MVP (no ML).

## Acceptance Criteria

- [ ] Preferences stored in `user_preferences` table: key, value, confidence, source (explicit/inferred), updatedAt
- [ ] Explicit preferences: extracted from direct user statements ("I prefer morning meetings", "My timezone is EST")
- [ ] Inferred preferences: detected from usage patterns (e.g., user always asks for email summaries at 9 AM → store "morning routine: email summary")
- [ ] Preference categories: scheduling (preferred times, timezone), communication (formality, verbosity), tools (most used integrations), tasks (recurring requests)
- [ ] Claude prompted to extract preferences from conversations using a structured output format
- [ ] Preferences exposed via `GET /context/memory` and manually editable via `POST /context/memory`
- [ ] Preference conflicts resolved by recency (newer preference overwrites older)
- [ ] Privacy: all preferences stored locally in encrypted SQLite; cloud sync only if user opts in
- [ ] Maximum 50 preferences stored per user (oldest low-confidence entries pruned)
- [ ] Unit tests for preference extraction, conflict resolution, and pruning logic

---

### Issue #26
**[[W6 | Apr 21-26 | P1] Memory UI — Conversation history view, search, and delete](https://github.com/potakaaa/AURA/issues/26)**

**Labels:** `P1` `android` `ui`

## Description

Build the conversation history management UI where users can browse, search, and manage their past conversations with AURA.

## Acceptance Criteria

- [ ] Conversation list screen: vertically scrollable list of all conversations, sorted by most recent
- [ ] Each item shows: auto-generated title, last message preview (50 chars), relative timestamp ("2h ago"), message count badge
- [ ] Search bar at the top: full-text search across message content (debounced, 300ms)
- [ ] Search results highlight matching text snippets with the conversation title
- [ ] Tap conversation → opens full chat history in the chat screen (read-only for past, active for current)
- [ ] Swipe-to-delete with undo (5s snackbar)
- [ ] "Clear All History" in Settings with double-confirmation dialog
- [ ] Pull-to-refresh syncs with backend conversation list
- [ ] Empty state: "No conversations yet. Start by saying 'Hey AURA'!"
- [ ] Loading state: shimmer/skeleton placeholders while fetching history
- [ ] Accessibility: all interactive elements have content descriptions; list announces item count

---

## W7 — Integrations (Apr 28 — May 3)

### Issue #27
**[[W7 | Apr 28-May 3 | P0] Google Calendar integration — Read events, create events, schedule follow-ups](https://github.com/potakaaa/AURA/issues/27)**

**Labels:** `P0` `backend` `integration`

## Description

Integrate Google Calendar via the Google Calendar API, enabling AURA to read the user's schedule, create new events, and schedule follow-ups — all triggered by natural language commands through Claude's tool use.

## Acceptance Criteria

- [ ] OAuth2 scope added: `https://www.googleapis.com/auth/calendar` (requested during auth flow)
- [ ] `GET /actions/calendar` returns events for a date range (default: today + 7 days)
- [ ] `POST /actions/calendar` creates a new event with: title, start/end time, description, attendees (optional)
- [ ] Claude tool definition: `read_calendar` — fetches events and returns them in a structured format for summarization
- [ ] Claude tool definition: `create_event` — creates an event based on natural language (e.g., "Schedule a meeting with Alex tomorrow at 3 PM")
- [ ] Date/time parsing: handles relative references ("tomorrow", "next Monday", "in 2 hours") via Claude's reasoning
- [ ] Conflict detection: when creating an event, check for overlapping events and warn the user
- [ ] Action confirmation: before creating/modifying events, return a preview to the user for approval
- [ ] Error handling: invalid date, calendar API errors, permission denied — all return user-friendly messages
- [ ] Integration tests with mocked Google Calendar API responses

---

### Issue #28
**[[W7 | Apr 28-May 3 | P1] Google Drive integration — Search files, read documents, summarize](https://github.com/potakaaa/AURA/issues/28)**

**Labels:** `P1` `backend` `integration`

## Description

Integrate Google Drive API to allow AURA to search the user's files, read document content, and generate summaries on demand.

## Acceptance Criteria

- [ ] OAuth2 scope added: `https://www.googleapis.com/auth/drive.readonly`
- [ ] `GET /actions/drive?q=<search>` searches files by name/content, returns: id, name, mimeType, modifiedTime, webViewLink
- [ ] `GET /actions/drive/:fileId` reads file content (supports Google Docs, Sheets as exported text, PDFs as extracted text)
- [ ] Claude tool definition: `search_drive` — searches files and returns metadata
- [ ] Claude tool definition: `read_document` — fetches and returns document content for Claude to summarize
- [ ] Content size limit: documents > 50K chars are truncated with a note to the user
- [ ] Summary caching: document summaries cached by fileId + modifiedTime to avoid re-processing
- [ ] File type support for MVP: Google Docs, Google Sheets (as CSV), PDF (text extraction), plain text
- [ ] Error handling: file not found, permission denied, unsupported format — clear user messages
- [ ] Integration tests with mocked Drive API responses

---

### Issue #29
**[[W7 | Apr 28-May 3 | P1] Action confirmation UI — Preview actions before execution](https://github.com/potakaaa/AURA/issues/29)**

**Labels:** `P1` `android` `ui`

## Description

Build the action confirmation UI component that displays a preview of any action AURA is about to take (create event, send message, etc.) and requires explicit user approval before execution.

## Acceptance Criteria

- [ ] Action confirmation card rendered inline in the chat: shows action type icon, title, and key details
- [ ] For calendar events: shows date, time, duration, title, attendees in a structured card
- [ ] For drive actions: shows file name, action (share, summarize), target
- [ ] Two action buttons: "Confirm" (primary) and "Cancel" (secondary)
- [ ] "Edit" option: tapping opens a quick-edit sheet to modify details before confirming
- [ ] Confirmed actions execute via the backend and show a success/failure result in chat
- [ ] Cancelled actions show "Action cancelled" in chat and AURA acknowledges
- [ ] Timeout: unconfirmed actions expire after 5 minutes with a "This action has expired" message
- [ ] Multiple pending actions supported (queued, not concurrent)
- [ ] Animation: card slides in with a subtle emphasis animation to draw attention
- [ ] Accessibility: confirm/cancel buttons have clear labels; card content is readable by TalkBack

---

### Issue #30
**[[W7 | Apr 28-May 3 | P0] Claude tool use prompts — Integration tool definitions and orchestration](https://github.com/potakaaa/AURA/issues/30)**

**Labels:** `P0` `ai-engine`

## Description

Finalize and test Claude tool use definitions for all MVP integrations. Claude must reliably select the right tool, extract the correct parameters, and handle multi-tool scenarios.

## Acceptance Criteria

- [ ] Tool definitions updated in `packages/ai-engine/prompts/tools.ts` for: `read_calendar`, `create_event`, `search_drive`, `read_document`, `read_email`, `draft_reply`
- [ ] Each tool has: `name`, `description`, `input_schema` (JSON Schema), and `examples` in the description
- [ ] Tool selection tested on 20+ natural language queries — Claude selects the correct tool ≥ 90% of the time
- [ ] Parameter extraction tested: dates, names, search queries, file references — accuracy ≥ 85%
- [ ] Multi-tool scenarios handled: "Summarize my emails and block time for follow-ups" → triggers `read_email` then `create_event`
- [ ] Tool error responses formatted for Claude to retry or inform the user gracefully
- [ ] Prompt includes clear instructions for when NOT to use tools (general conversation, opinions, non-actionable queries)
- [ ] Test suite in `packages/ai-engine/prompts/__tests__/` with the 20+ test queries and expected tool calls
- [ ] Documentation in `packages/ai-engine/README.md` updated with tool use architecture and testing instructions

---

## W8 — Actions (May 5–10)

### Issue #31
**[[W8 | May 5-10 | P1] Gmail integration — Fetch emails, summarize threads, draft replies](https://github.com/potakaaa/AURA/issues/31)**

**Labels:** `P1` `backend` `integration`

## Description

Integrate the Gmail API to enable AURA to read, summarize, and draft replies to emails. This is one of the highest-value integrations for knowledge workers.

## Acceptance Criteria

- [ ] OAuth2 scope added: `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.compose`
- [ ] `GET /actions/email?q=<query>&maxResults=10` fetches email threads matching the query (default: latest 10 unread)
- [ ] `GET /actions/email/:threadId` returns full thread with: subject, participants, message bodies (plain text), timestamps
- [ ] Claude tool definition: `read_email` — fetches and returns email content for summarization
- [ ] Claude tool definition: `draft_reply` — generates a reply draft (stored as Gmail draft, not sent)
- [ ] Email summarization: Claude produces a concise summary with: key topics, action items, urgency level
- [ ] Draft replies: Claude generates a contextually appropriate response; user reviews via action confirmation UI
- [ ] HTML email bodies converted to plain text for Claude processing (strip tags, preserve structure)
- [ ] Pagination: "Show more emails" loads the next page
- [ ] Error handling: auth expired, quota exceeded, thread not found — user-friendly messages
- [ ] Integration tests with mocked Gmail API responses

---

### Issue #32
**[[W8 | May 5-10 | P1] Android Intent execution — Open apps, share content, set alarms](https://github.com/potakaaa/AURA/issues/32)**

**Labels:** `P1` `android` `integration`

## Description

Build the Android Intent execution layer that allows AURA to interact with other apps on the device: opening apps, sharing content, setting alarms/reminders, and launching deep links.

## Acceptance Criteria

- [ ] Action executor service handles structured action plans from Claude
- [ ] Supported intents: open URL, open app by package name, share text/image, set alarm, set timer, create reminder, open maps with address
- [ ] Claude tool definition: `execute_intent` — specifies intent type and parameters
- [ ] Intent execution requires user confirmation via the action confirmation UI (Issue #29)
- [ ] Fallback: if target app is not installed, offer to open the Play Store listing
- [ ] "Set a reminder for 3 PM to call Alex" → creates an Android alarm/reminder
- [ ] "Open Google Maps to the nearest coffee shop" → launches Maps with a query
- [ ] "Share this summary to Slack" → opens Android share sheet with the text pre-filled
- [ ] Error handling: ActivityNotFoundException, SecurityException — caught and reported to user
- [ ] Unit tests for intent construction; manual test checklist for 10 common intent scenarios

---

### Issue #33
**[[W8 | May 5-10 | P1] Multi-step workflow chaining — Sequential action execution](https://github.com/potakaaa/AURA/issues/33)**

**Labels:** `P1` `backend` `ai-engine`

## Description

Enable AURA to execute multi-step workflows where the output of one action feeds into the next. Example: "Summarize today's emails and schedule follow-ups for anything urgent."

## Acceptance Criteria

- [ ] `POST /actions/execute` accepts an action plan: `{ steps: [{ tool, params, dependsOn?: stepId }] }`
- [ ] Sequential execution: steps run in order; each step's output is available to subsequent steps
- [ ] Dependency resolution: steps with `dependsOn` wait for the referenced step to complete
- [ ] Claude generates action plans using a structured output format: array of steps with tool + params
- [ ] User confirmation: the full action plan is previewed in the chat before execution begins
- [ ] Per-step status updates streamed to the client: "Step 1/3: Reading emails... ✓", "Step 2/3: Creating event..."
- [ ] Failure handling: if a step fails, pause execution and ask the user whether to skip or abort
- [ ] Maximum 5 steps per workflow (MVP limit to control complexity and cost)
- [ ] Example workflows tested end-to-end: email → calendar, drive search → summarize → share
- [ ] Integration tests with mocked tool responses for 3 multi-step scenarios

---

### Issue #34
**[[W8 | May 5-10 | P1] Webhook bridge for third-party service automation](https://github.com/potakaaa/AURA/issues/34)**

**Labels:** `P1` `backend` `integration`

## Description

Build a generic webhook bridge that allows AURA to trigger actions on third-party services via configurable webhooks. This provides extensibility for services not directly integrated (e.g., Slack, Notion — P2 features) and enables power users to connect custom automations.

## Acceptance Criteria

- [ ] `POST /actions/webhook` accepts: `{ url, method, headers, body, timeout }`
- [ ] Outbound webhook calls are proxied through the backend (user's device never calls external services directly)
- [ ] Webhook URLs must be registered/whitelisted by the user in settings before use (security)
- [ ] HMAC signature option: user can provide a secret to sign webhook payloads
- [ ] Timeout: 10s per webhook call; retry once on 5xx
- [ ] Response handling: webhook response body is returned to Claude for interpretation
- [ ] Claude tool definition: `trigger_webhook` — uses a registered webhook by alias (e.g., "slack-notify")
- [ ] User can register up to 5 webhooks in the MVP
- [ ] Webhook management UI in Settings: add, edit, delete, test (sends a ping)
- [ ] Audit log: all webhook calls logged with timestamp, URL, status code, response time

---

## W9 — Polish & Testing (May 12–17)

### Issue #35
**[[W9 | May 12-17 | P0] End-to-end integration testing across all features](https://github.com/potakaaa/AURA/issues/35)**

**Labels:** `P0` `testing` `quality`

## Description

Write and execute end-to-end integration tests that exercise the full user journey: voice input → AI reasoning → action execution → result display. This is the final quality gate before beta.

## Acceptance Criteria

- [ ] E2E test suite covers 10 critical user journeys:
  1. Voice wake → ask question → receive answer
  2. Text input → receive streaming answer
  3. "What's on my calendar today?" → shows events
  4. "Create a meeting tomorrow at 2 PM" → confirms → creates event
  5. "Summarize my latest emails" → shows summaries
  6. "Find the budget doc in Drive" → searches → summarizes
  7. Multi-step: "Summarize emails and schedule follow-ups" → executes both
  8. Conversation history: start chat → close app → reopen → history preserved
  9. Error recovery: API timeout → retry → success
  10. Settings: change retention → data older than retention is deleted
- [ ] All 10 journeys pass on a physical Android device (API 34)
- [ ] Test execution documented with screenshots/recordings in `docs/testing/`
- [ ] Bug tracker: all discovered issues filed as GitHub Issues with severity labels
- [ ] Zero P0 bugs remaining; P1 bugs triaged for fix-before-beta or known-issue

---

### Issue #48
**[[W9 | May 12-17 | P0] UI/UX polish — Animations, transitions, empty states, error states](https://github.com/potakaaa/AURA/issues/48)**

**Labels:** `P0` `android` `ui` `polish`

## Description

Polish the entire Android app UI for beta readiness: smooth animations, consistent transitions, proper empty states, and informative error states across all screens.

## Acceptance Criteria

- [ ] Screen transitions: shared element transitions where applicable; consistent fade/slide patterns
- [ ] Loading states: shimmer skeletons on chat history, conversation list, and integration results
- [ ] Empty states with illustration + CTA for: no conversations, no search results, no calendar events, no emails
- [ ] Error states with retry button for: network error, API error, timeout
- [ ] Pull-to-refresh on all list screens with Material 3 refresh indicator
- [ ] Snackbar notifications for: action confirmed, action cancelled, data deleted, sync complete
- [ ] App-wide consistent spacing, typography, and color usage (audit against design system)
- [ ] Dark mode verified on all screens — no contrast issues, no hardcoded colors
- [ ] Keyboard handling verified on all input screens — no overlap, proper insets
- [ ] Performance: all animations run at 60fps (no jank); verified with Android Studio profiler

---

### Issue #49
**[[W9 | May 12-17 | P0] Performance optimization — Cold start, voice latency, API response times](https://github.com/potakaaa/AURA/issues/49)**

**Labels:** `P0` `android` `backend` `performance`

## Description

Optimize key performance metrics to meet beta-readiness targets. Users will churn quickly if voice interaction feels sluggish or the app takes too long to start.

## Acceptance Criteria

- [ ] Cold start time: < 2 seconds to interactive on a mid-range device (Pixel 6a or equivalent)
- [ ] Wake word → first AI response token: < 4 seconds (wake word + STT + network + Claude first token)
- [ ] Text input → first AI response token: < 2 seconds
- [ ] Streaming response: tokens render with < 50ms inter-token latency in the UI
- [ ] Chat history load: < 500ms for 100 messages
- [ ] App size: APK < 50MB (split APKs for architecture-specific native libs)
- [ ] Memory usage: < 200MB RAM during active voice listening + chat
- [ ] Backend response times: p50 < 500ms, p95 < 2s for non-LLM endpoints
- [ ] Backend LLM proxy: time-to-first-token < 1.5s (p50)
- [ ] Performance benchmarks documented in `docs/PERFORMANCE.md` with baseline numbers and targets

---

### Issue #50
**[[W9 | May 12-17 | P0] Security audit — Encryption, API key management, permission scoping](https://github.com/potakaaa/AURA/issues/50)**

**Labels:** `P0` `security` `audit`

## Description

Conduct a security audit of the full stack before beta launch. This covers data encryption, API key management, OAuth scopes, and permission handling.

## Acceptance Criteria

- [ ] All API keys (Claude, Google) stored in environment variables, never in code or version control
- [ ] Android app: no hardcoded secrets; API key for backend access derived from OAuth session
- [ ] SQLCipher encryption verified: database file is unreadable without key (tested with hex editor)
- [ ] HTTPS enforced on all backend endpoints; certificate pinning implemented in the Android client
- [ ] OAuth2 scopes reviewed: each integration requests only the minimum required scope
- [ ] Token storage: access tokens encrypted at rest on both Android (EncryptedSharedPreferences) and backend
- [ ] Rate limiting verified: cannot exceed per-user limits via direct API calls
- [ ] Input validation: all user inputs sanitized on both client and server (SQL injection, XSS, prompt injection basic checks)
- [ ] Dependency audit: `npm audit` and Gradle dependency scan — no critical vulnerabilities
- [ ] Security checklist documented in `docs/SECURITY_AUDIT.md` with pass/fail for each item
- [ ] Privacy dashboard functional: user can see all data access logs from the last 7 days

---

### Issue #51
**[[W9 | May 12-17 | P1] Accessibility review — Screen reader, contrast, touch targets](https://github.com/potakaaa/AURA/issues/51)**

**Labels:** `P1` `android` `accessibility`

## Description

Ensure the app meets basic accessibility standards (WCAG 2.1 AA equivalent for mobile) before beta.

## Acceptance Criteria

- [ ] All interactive elements have `contentDescription` for TalkBack
- [ ] TalkBack navigation: user can complete core journey (open app → send message → read response) using only TalkBack
- [ ] Color contrast: all text meets WCAG AA (4.5:1 for normal text, 3:1 for large text) — verified with Accessibility Scanner
- [ ] Touch targets: all tappable elements ≥ 48dp × 48dp
- [ ] Focus order: logical tab order on all screens
- [ ] No information conveyed by color alone (icons/text labels always accompany color indicators)
- [ ] Dynamic text size: app respects system font size settings (tested at 200% scale)
- [ ] Voice UI: listening state and results announced to TalkBack
- [ ] Error messages readable by screen reader with appropriate `liveRegion` announcements
- [ ] Accessibility Scanner report generated and attached — zero critical issues

---

### Issue #52
**[[W9 | May 12-17 | P0] Privacy dashboard — Transparent data access logs](https://github.com/potakaaa/AURA/issues/52)**

**Labels:** `P0` `android` `security` `privacy`

## Description

Build the privacy dashboard screen where users can see exactly what data AURA has accessed, when, and why. This is a core differentiator and trust-building feature.

## Acceptance Criteria

- [ ] Privacy dashboard accessible from Settings → Privacy → "Data Access Log"
- [ ] Log entries for every data access: calendar reads, email fetches, drive searches, webhook calls
- [ ] Each entry shows: timestamp, data type (calendar/email/drive), action (read/create/search), summary (e.g., "Read 5 calendar events for Apr 28")
- [ ] Filterable by: data type, date range
- [ ] Log stored locally in SQLite; entries older than 30 days auto-pruned
- [ ] "Export My Data" button: generates a JSON file of all stored data (conversations, preferences, access logs) — GDPR compliance
- [ ] "Delete All My Data" button: wipes all local data + sends deletion request to backend — with double confirmation
- [ ] Log is append-only from the app's perspective (no user editing)
- [ ] Empty state: "No data accessed yet — AURA will log all data access here for your transparency"
- [ ] Integration tested: perform calendar read → verify log entry appears within 5 seconds

---
