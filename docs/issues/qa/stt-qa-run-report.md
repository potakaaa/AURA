# STT QA Run Report (Expo Speech Recognition)

Date: YYYY-MM-DD  
Branch: `development`  
Build: `<commit-sha>`  
Tester: `<name>`

## Environment Matrix

| Platform | Device | OS | App Build | Result |
| --- | --- | --- | --- | --- |
| Android physical | `<device>` | `<version>` | Dev Client | ⬜ Pass / ⬜ Fail |
| Android emulator | `<image>` | `<version>` | Dev Client | ⬜ Pass / ⬜ Fail / ⬜ Not Supported |
| iOS physical | `<device>` | `<version>` | Dev Client | ⬜ Pass / ⬜ Fail / ⬜ N/A |

## Checklist Results

- [ ] Permission allowed flow
- [ ] Permission denied flow
- [ ] Start listening
- [ ] Stop listening
- [ ] Cancel listening
- [ ] Partial transcript display
- [ ] Final transcript display
- [ ] No speech detected behavior
- [ ] App background and foreground behavior
- [ ] Bluetooth microphone / AirPods behavior

## Detailed Notes

### Android physical

- Result:
- Notes:
- Failures/Bugs:

### Android emulator

- Result:
- Notes:
- Failures/Bugs:

### iOS physical

- Result:
- Notes:
- Failures/Bugs:

## Platform Limitations (Observed)

- Android emulator STT may fail or be unavailable depending on image/service packages.
- Speech recognition availability can vary by OEM/service configuration.
- STT testing requires Expo dev client (Expo Go is not sufficient for native module validation).

## Blocking Bugs

- Bug ID:
- Severity:
- Repro steps:
- Expected:
- Actual:
- Platform:

## Release Recommendation

- [ ] Stable enough to replace Whisper/CPP STT
- [ ] Needs fixes before full replacement

Rationale:

