# Android whisper.cpp bridge (POC)

This folder contains a native Android scaffold for on-device Whisper STT integration.

## Responsibilities

- Capture microphone audio with `AudioRecord` at 16 kHz mono PCM.
- Buffer short commands (< 15 seconds).
- Pass PCM buffer to whisper.cpp JNI bindings.
- Return transcript and latency metrics to JavaScript bridge.

## Integration notes

- This is intended for Expo prebuild + dev client (or bare React Native).
- JavaScript expects a native module registration that exposes:
  - `startCapture(...)`
  - `stopCapture()`
  - `readCapturedPcm16kMono()`
  - `transcribe(...)`

## whisper.cpp JNI expectation

`WhisperJniBridge.transcribe(...)` is intentionally a placeholder contract in this POC.
Wire it to your chosen whisper.cpp Android JNI package during native integration.
