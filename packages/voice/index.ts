/**
 * AURA Voice — wake-word and STT modules.
 */
export { ExpoSpeechRecognitionSession } from "./stt/index.js";
export * as stt from "./stt/index.js";
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
} from "./stt/index.js";
