# AURA STT (POC)

This folder contains the MVP STT POC for Android using on-device `whisper.cpp`.

## Included

- TypeScript transcription session and chunking pipeline
- Android native module scaffold (`android/WhisperSttModule.kt`)
- Benchmark harness (`benchmarks/`)
- Quiet/noisy smoke checks (`smoke/`)

## Core assumptions

- English only for MVP
- Short commands under 15 seconds
- 16 kHz mono PCM input
- 1-2 second chunk windows with overlap

## Planned production hardening

- Replace JNI placeholder with real whisper.cpp binding
- Add timestamp-based overlap deduplication
- Add confidence and partial transcript streaming support
