export type SttSessionStatus =
  | "idle"
  | "requesting-permission"
  | "ready"
  | "starting"
  | "listening"
  | "stopping"
  | "stopped"
  | "canceled"
  | "error";

export interface SttSessionStartRequest {
  readonly action: "start";
  readonly sessionId: string;
  readonly locale: string;
  readonly interimResults: boolean;
  readonly maxAlternatives?: number;
  readonly continuous?: boolean;
  readonly requiresOnDeviceRecognition?: boolean;
}

export interface SttSessionStopRequest {
  readonly action: "stop";
  readonly sessionId: string;
}

export interface SttSessionCancelRequest {
  readonly action: "cancel";
  readonly sessionId: string;
}

export type SttSessionControlRequest =
  | SttSessionStartRequest
  | SttSessionStopRequest
  | SttSessionCancelRequest;

export type SttTranscriptKind = "partial" | "final";

export interface SttTranscriptAlternative {
  readonly transcript: string;
  readonly confidence: number | null;
}

export interface SttTranscriptResult {
  readonly sessionId: string;
  readonly kind: SttTranscriptKind;
  readonly transcript: string;
  readonly alternatives: readonly SttTranscriptAlternative[];
  readonly isFinal: boolean;
  readonly timestampMs: number;
}

export type SttErrorCode =
  | "permission_denied"
  | "not_available"
  | "audio_capture"
  | "no_speech"
  | "aborted"
  | "network"
  | "timeout"
  | "unknown";

export interface SttError {
  readonly sessionId: string;
  readonly code: SttErrorCode;
  readonly message: string;
  readonly recoverable: boolean;
  readonly rawCode?: string;
}

export interface SttPermissionState {
  readonly granted: boolean;
  readonly canAskAgain: boolean;
  readonly status: string;
}

export interface SttSessionCallbacks {
  readonly onStatusChange?: (status: SttSessionStatus) => void;
  readonly onPartialTranscript?: (result: SttTranscriptResult) => void;
  readonly onFinalTranscript?: (result: SttTranscriptResult) => void;
  readonly onError?: (error: SttError) => void;
}

export interface SttSession {
  getStatus(): SttSessionStatus;
  checkPermissions(): Promise<SttPermissionState>;
  requestPermissions(): Promise<SttPermissionState>;
  start(request: SttSessionStartRequest): Promise<void>;
  stop(request: SttSessionStopRequest): Promise<void>;
  cancel(request: SttSessionCancelRequest): Promise<void>;
  dispose(): void;
}
