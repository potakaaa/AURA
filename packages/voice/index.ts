/**
 * AURA Voice — wake-word and STT modules.
 */
export * as stt from "./stt/index.js";
export type {
  SttError,
  SttErrorCode,
  SttSessionCancelRequest,
  SttSessionControlRequest,
  SttSessionStartRequest,
  SttSessionStatus,
  SttSessionStopRequest,
  SttTranscriptAlternative,
  SttTranscriptKind,
  SttTranscriptResult,
} from "./stt/index.js";
