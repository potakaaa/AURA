/**
 * AURA Voice — wake-word and STT modules.
 */
export { ExpoSpeechRecognitionSession } from "./stt";
export * as stt from "./stt";
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
