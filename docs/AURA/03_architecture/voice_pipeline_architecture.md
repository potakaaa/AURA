# Voice Pipeline Architecture

## Overview

AURA mobile voice input uses an Expo-native speech recognition session wrapped by `@aura/voice`.

Flow:

1. User taps the voice hub orb in `apps/mobile/app/(tabs)/index.tsx`.
2. `useSpeechRecognition` starts a new STT session.
3. `ExpoSpeechRecognitionSession` requests/checks permission and starts recognition.
4. Partial transcript events are emitted while speaking.
5. Final transcript event is emitted when recognition finalizes.
6. UI consumes normalized status/error/transcript state.

## Architecture Layers

### App UI layer (`apps/mobile`)

- Hook: `apps/mobile/hooks/useSpeechRecognition.ts`
- UI integration: voice hub orb and state section
- Responsibilities:
  - map interaction controls (start/stop/cancel)
  - display partial/final transcript
  - render user-facing error states

### Voice package layer (`packages/voice`)

- Session implementation: `packages/voice/stt/expoSpeechRecognition.ts`
- Types: `packages/voice/stt/types.ts`
- Responsibilities:
  - wrap Expo speech-recognition APIs
  - normalize errors and session states
  - provide reusable STT API for app consumers

### Native layer (Expo module)

- Provider: `expo-speech-recognition`
- Responsibilities:
  - platform speech recognition bindings
  - permission APIs
  - runtime events (`result`, `error`, `start`, `end`)

## Non-Goals (Current)

- No Whisper / `whisper.cpp` pipeline
- No PCM chunk splitting / overlap logic
- No model artifact management in app
