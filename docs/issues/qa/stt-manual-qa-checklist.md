# STT Manual QA Checklist (Expo Speech Recognition)

## Preconditions

- Dev client build installed (Android and/or iOS)
- App launched from dev client (not Expo Go)
- Device has working microphone

## Setup Verification

- [ ] `pnpm install` succeeds from repo root
- [ ] `pnpm --filter @aura/voice build` succeeds
- [ ] `pnpm --filter @aura/voice test` succeeds
- [ ] `pnpm --filter mobile typecheck` succeeds

## Functional Checks

### Start / partial transcript

- [ ] Tap voice orb once to start listening
- [ ] Voice status changes to listening
- [ ] Partial transcript appears while speaking

### Stop / final transcript

- [ ] Tap orb again while listening to stop
- [ ] Voice status transitions through processing/idle
- [ ] Final transcript is displayed and preserved for assistant flow

### Cancel flow

- [ ] Start listening
- [ ] Trigger cancel state (when processing)
- [ ] Session cancels without crash and returns to idle/error-safe state

## Permission Handling

### First-run permission request

- [ ] Permission dialog appears when needed
- [ ] Granting permission enables continued STT usage

### Permission denied

- [ ] Denying permission shows clear user-facing message
- [ ] App does not crash
- [ ] Mic button/orb is disabled when permission remains denied

## Unsupported Device / Service Handling

- [ ] Simulate or test unsupported recognizer service
- [ ] UI shows unsupported-device/service message
- [ ] App remains stable and interactive

## Regression Checks

- [ ] Voice hub screen remains responsive during repeated start/stop cycles
- [ ] No stale transcript leaks between separate recognition sessions when reset flow is used
- [ ] No unhandled promise errors in Metro logs during voice interactions
