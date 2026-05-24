# Android Background Wake-Word Prototype

This prototype adds Android-only background wake-word listening through a native foreground service.
iOS remains foreground-only through the existing Expo speech recognition flow.

## Current Behavior

- Android starts `AuraWakeWordService` only after the user is authenticated and the app is visible.
- The service shows a persistent notification on channel `aura_wake_word`.
- The foreground JS voice recognizer remains the active path while the app is visible.
- When the app backgrounds, the native service enables Android `SpeechRecognizer` and listens for `AURA`.
- When `AURA` is detected in a transcript, the service plays the native wake cue.
- If the final transcript contains a command, for example "AURA summarize my notes", the service sends that command directly to `/llm/chat`, updates the persistent notification, and speaks the assistant reply through Android `TextToSpeech`.
- If the final transcript is only the wake word, the service waits for the next non-empty final transcript and sends that as the command.

## Prototype Limits

- This is not a production low-power hotword engine. It uses Android `SpeechRecognizer` transcript matching.
- Background commands are handled natively while React Native is suspended. Replies are spoken and shown in the service notification, but they are not persisted into the Voice Hub conversation history until a dedicated native persistence bridge is added.
- Android 14+ treats `RECORD_AUDIO` as a while-in-use permission. A microphone foreground service must be started while the app is visible unless a platform exemption applies.
- Boot autostart is intentionally out of scope. Starting a microphone foreground service from boot is not reliable or compliant for this prototype.
- OEM battery optimization may stop long-running listening.
- Android 13+ notification drawer visibility depends on `POST_NOTIFICATIONS`. Foreground service task-manager visibility can still differ from drawer visibility if notification permission is denied.
- Speech recognition quality and availability vary by Android image, OEM, language model, and installed recognition service.

## Manual QA

1. Install a fresh Android debug build.
2. Grant microphone permission.
3. On Android 13+, grant notification permission when requested.
4. Sign in and wait for the persistent AURA wake-word notification.
5. Background the app.
6. Say "AURA what is my schedule?".
7. Confirm the wake cue plays, the notification changes to an AURA thinking/responded state, and Android speaks the reply.
8. Say only "AURA", wait for the wake cue, then say "summarize my notes"; confirm the second phrase is sent as the command.
9. Return to foreground and confirm the normal Voice Mode UI still works.

## Production Follow-Up

Replace transcript-based detection with a dedicated on-device wake-word model such as Porcupine or an equivalent low-power engine. That follow-up should include an explicit user setting, battery guidance, and device/OEM QA coverage.
