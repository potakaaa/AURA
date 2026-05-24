export type TtsSessionStatus = "idle" | "speaking" | "stopped" | "error";

export type TtsErrorCode = "not_available" | "invalid_text" | "interrupted" | "unknown";

export interface TtsError {
  readonly utteranceId: string;
  readonly code: TtsErrorCode;
  readonly message: string;
  readonly recoverable: boolean;
  readonly cause?: unknown;
}

export interface TtsVoice {
  readonly identifier: string;
  readonly name: string;
  readonly language: string;
  readonly quality?: string;
}

export interface TtsSpeakRequest {
  readonly utteranceId: string;
  readonly text: string;
  readonly locale: string;
  readonly rate: number;
  readonly pitch: number;
  readonly voice?: string;
}

export interface TtsSessionCallbacks {
  readonly onStatusChange?: (status: TtsSessionStatus) => void;
  readonly onStart?: (utteranceId: string) => void;
  readonly onDone?: (utteranceId: string) => void;
  readonly onStopped?: (utteranceId: string) => void;
  readonly onError?: (error: TtsError) => void;
}

export interface TtsSession {
  getStatus(): TtsSessionStatus;
  speak(request: TtsSpeakRequest): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
  getAvailableVoices(): Promise<TtsVoice[]>;
  dispose(): void;
}
