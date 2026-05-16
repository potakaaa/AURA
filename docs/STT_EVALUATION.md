# STT Implementation for AURA (Expo Speech Recognition)

## 1) Current Decision

AURA now uses **`expo-speech-recognition` as the only STT provider** for mobile voice input.

- No Whisper / `whisper.cpp` runtime path
- No PCM chunking pipeline in `@aura/voice`
- No on-device model-size selection in app code

## 2) Source of Truth

Primary implementation locations:

- `packages/voice/stt/expoSpeechRecognition.ts`
- `packages/voice/stt/types.ts`
- `apps/mobile/hooks/useSpeechRecognition.ts`
- `apps/mobile/app/(tabs)/index.tsx`

## 3) Runtime Permissions

AURA requires microphone and speech recognition permissions through Expo config + runtime request flow.

Configured in mobile app config:

- iOS `NSMicrophoneUsageDescription`
- Android `android.permission.RECORD_AUDIO`
- `expo-speech-recognition` config plugin permission strings

See `apps/mobile/app.json`.

## 4) Dev Client Requirement

`expo-speech-recognition` is a native module. **Expo Go is not sufficient** for validating full STT behavior.

Use an Expo dev client build:

1. `pnpm install`
2. `pnpm --filter mobile typecheck`
3. Build/run Android or iOS dev client (`expo run:android` / `expo run:ios` or equivalent project workflow)
4. Launch the app in dev client and test mic interactions

## 5) Setup / Build / Test Commands

From repo root:

```bash
pnpm install
pnpm --filter @aura/voice build
pnpm --filter @aura/voice test
pnpm --filter mobile typecheck
```

## 6) Manual QA

Use the STT checklist:

- [STT Manual QA Checklist](issues/qa/stt-manual-qa-checklist.md)

Checklist includes:

- Start/stop/cancel behavior from voice hub orb
- Partial transcript rendering
- Final transcript propagation
- Permission denied handling
- Unsupported-device messaging

## 7) Troubleshooting

### Permission denied

Symptoms:

- Error state shown in voice UI
- Mic action disabled after denial

Actions:

1. Open device Settings and enable microphone/speech permissions for AURA.
2. Reopen app and retry voice capture.
3. Confirm permission copy in `app.json` is present and dev client is rebuilt.

### Unsupported STT device/service

Symptoms:

- `not_available` error in UI
- Mic action disabled with unsupported message

Actions:

1. Verify device has speech recognition service available.
2. Test on a different emulator/device image.
3. Confirm app runs in dev client, not Expo Go.

### No speech detected

Symptoms:

- `no_speech` error shown

Actions:

1. Retry in quieter environment.
2. Check active microphone source and OS-level mic access.
3. Verify you are tapping orb to start before speaking.
