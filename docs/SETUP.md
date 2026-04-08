# Developer Setup

This guide covers local setup for the AURA monorepo (API + Expo mobile app).

## Prerequisites

1. Node.js 20.x (matches `.nvmrc` = `20`)
2. pnpm 10.x (repo uses `pnpm@10.32.1`)
3. JDK 17+ (required by Android tooling/emulator workflows)
4. Android Studio (latest stable)
5. Android SDK + at least one emulator image (for example API 34)

## Required Environment Variables

Set these on your machine for Android tooling:

```powershell
# Windows PowerShell example
$env:ANDROID_SDK_ROOT = "C:\Users\<you>\AppData\Local\Android\Sdk"
$env:ANDROID_HOME = $env:ANDROID_SDK_ROOT
```

Add these SDK folders to your PATH (user or system PATH):

1. `%ANDROID_SDK_ROOT%\platform-tools`
2. `%ANDROID_SDK_ROOT%\emulator`
3. `%ANDROID_SDK_ROOT%\cmdline-tools\latest\bin`

Backend runtime env vars live in `services/api/.env.example`.

## Clone and Install

```bash
git clone https://github.com/potakaaa/AURA.git
cd AURA
pnpm install
```

## Install Local Git Hooks (CI-aligned)

Install `pre-commit` (choose one):

```bash
pipx install pre-commit
```

```bash
pip install pre-commit
```

Register both hook stages:

```bash
pre-commit install --hook-type pre-commit --hook-type pre-push
```

Run hooks manually any time:

```bash
pre-commit run --all-files
pre-commit run --hook-stage pre-push --all-files
```

## Run Backend Locally

From repository root (uses root script):

```bash
pnpm dev:api
```

Equivalent direct workspace command:

```bash
pnpm --filter api dev
```

API defaults to `http://localhost:3000` unless `PORT` is set.

## Run Android App on Emulator

AURA mobile is currently Expo-managed. There is no committed Android Gradle project in this repo yet.

1. Start an Android emulator from Android Studio Device Manager.
2. In a new terminal from repo root, run:

```bash
pnpm --filter mobile android
```

Equivalent mobile workspace script:

```bash
pnpm --filter mobile run android
```

If you only want the dev server first:

```bash
pnpm dev:mobile
```

## Run Tests

Run all workspace tests through Turborepo:

```bash
pnpm test
```

Run only API tests:

```bash
pnpm --filter api test
```

Current mobile/package test scripts are placeholders (`echo 'No tests'`) and will pass without executing real test suites.

## Useful Commands

```bash
pnpm build
pnpm lint
pnpm dev
```
