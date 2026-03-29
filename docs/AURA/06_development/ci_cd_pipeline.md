# CI/CD Pipeline

This repository uses GitHub Actions and Turborepo to run monorepo CI on every relevant
branch update and pull request.

## Workflow Location

- Workflow file: `.github/workflows/ci.yml`
- CI scope: monorepo root (`apps/*`, `services/*`, `packages/*`)
- Package manager in CI: pnpm (`pnpm install --frozen-lockfile`)

## Triggers

The CI workflow runs on:

- `push` to:
  - `main`
  - `develop`
- all `pull_request` events

This ensures status checks are visible on PRs and can be enforced via branch protection.

## Pipeline Jobs

The workflow is split into independent jobs so each appears as a dedicated status check.

### `Lint (Turbo)`

- Installs dependencies from repo root
- Restores local Turbo cache (`.turbo`)
- Runs:

```bash
pnpm turbo run lint
```

### `Test (Turbo)`

- Installs dependencies from repo root
- Restores local Turbo cache (`.turbo`)
- Runs:

```bash
pnpm turbo run test
```

### `Build (Turbo)`

- Installs dependencies from repo root
- Restores local Turbo cache (`.turbo`)
- Runs:

```bash
pnpm turbo run build
```

### `Mobile Check (Expo, non-Gradle)`

Current mobile app setup is Expo-managed (`apps/mobile`) and does not include a committed
native Android Gradle wrapper yet. This job currently runs:

```bash
pnpm --filter mobile lint
pnpm --filter mobile test
```

It also includes a TODO reminder for future Android native CI:

- `./gradlew assembleDebug`
- `./gradlew testDebugUnitTest`

## Caching Strategy

CI uses two cache layers:

1. **pnpm dependency cache**
   - Enabled through `actions/setup-node` with `cache: pnpm`
2. **Turbo local task cache**
   - Restored via `actions/cache` on `.turbo`
   - Keyed by OS + branch + lockfile + turbo config

Optional remote cache wiring is supported with:

- `TURBO_TOKEN` (GitHub secret)
- `TURBO_TEAM` (GitHub secret)

If these are present, Turbo can use remote cache in addition to local cache restore.

## Performance Controls

- `concurrency` is enabled to cancel stale, in-progress runs for the same ref
- Job timeouts are set to avoid hanging workers
- Cache restore keys allow partial cache reuse across branch runs

These controls are aimed at keeping CI under the project target runtime for clean runs.

## Failure Behavior

Pipeline jobs fail automatically when any command exits non-zero:

- lint errors fail `Lint (Turbo)`
- test failures fail `Test (Turbo)`
- compile/build failures fail `Build (Turbo)`

Because jobs are separated, PR checks clearly show which stage failed.

## Frontend and Backend Coverage

Coverage is achieved from root-level Turbo orchestration:

- frontend app: `apps/mobile`
- backend service: `services/api`
- shared packages: `packages/*`

Running Turbo from the root allows dependency graph-aware task execution across all
workspace packages.

## GitHub Branch Protection Setup

Recommended required checks:

- `Lint (Turbo)`
- `Test (Turbo)`
- `Build (Turbo)`
- `Mobile Check (Expo, non-Gradle)`

Configure these in GitHub branch protection rules for `main` and `develop` when ready.

## Future Android Native CI Enablement

When a committed Android Gradle project exists (for example `apps/mobile/android/gradlew`
or a dedicated `apps/android/gradlew`), add a new `android` job with:

1. Java setup
2. Android SDK setup
3. Gradle cache setup
4. Native build and test commands:
   - `./gradlew assembleDebug`
   - `./gradlew testDebugUnitTest`

Until then, CI intentionally keeps mobile checks at Expo/JS level.

## Troubleshooting

### Cache misses after lockfile changes

Expected behavior. Updating `pnpm-lock.yaml` invalidates dependency and Turbo cache keys.

### Turbo command appears to skip expected packages

Check:

- package scripts in each workspace (`lint`, `test`, `build`)
- `turbo.json` task definitions
- package naming/filter assumptions

### Mobile lint/test passes without real checks

Some scripts are currently placeholders (`echo ...`). Replace them with real lint/test
commands in workspace `package.json` files as those checks are implemented.
