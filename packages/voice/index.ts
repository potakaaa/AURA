/**
 * AURA Voice — wake-word, STT, and TTS modules.
 */
export { ExpoSpeechRecognitionSession } from "./stt";
export { ExpoTextToSpeechSession } from "./tts";
export * as stt from "./stt";
export * as tts from "./tts";
export type {
  SttError,
  SttErrorCode,
  SttPermissionState,
  SttSession,
  SttSessionCancelRequest,
  SttSessionCallbacks,
  SttSessionControlRequest,
  SttSessionStartRequest,
  SttSessionStatus,
  SttSessionStopRequest,
  SttTranscriptAlternative,
  SttTranscriptKind,
  SttTranscriptResult,
} from "./stt";
export type {
  TtsError,
  TtsErrorCode,
  TtsSession,
  TtsSessionCallbacks,
  TtsSessionStatus,
  TtsSpeakRequest,
  TtsVoice,
} from "./tts";
