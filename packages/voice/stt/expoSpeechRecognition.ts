import type {
  ExpoSpeechRecognitionErrorCode,
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionNativeEventMap,
  ExpoSpeechRecognitionResult,
  ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";
import { requireNativeModule } from "expo-modules-core";

import type {
  SttError,
  SttErrorCode,
  SttPermissionState,
  SttSession,
  SttSessionCallbacks,
  SttSessionCancelRequest,
  SttSessionStartRequest,
  SttSessionStatus,
  SttSessionStopRequest,
  SttTranscriptAlternative,
  SttTranscriptKind,
  SttTranscriptResult,
} from "./types";

type Subscription = { remove: () => void };
type ExpoModule = {
  addListener<K extends keyof ExpoSpeechRecognitionNativeEventMap>(
    eventName: K,
    listener: (event: ExpoSpeechRecognitionNativeEventMap[K]) => void,
  ): { remove: () => void };
  start(options: {
    lang?: string;
    interimResults?: boolean;
    maxAlternatives?: number;
    continuous?: boolean;
    requiresOnDeviceRecognition?: boolean;
  }): void;
  stop(): void;
  abort(): void;
  getPermissionsAsync(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
    status: string;
  }>;
  requestPermissionsAsync(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
    status: string;
  }>;
};

function getSpeechModule(): ExpoModule | null {
  try {
    return requireNativeModule<ExpoModule>("ExpoSpeechRecognition");
  } catch {
    return null;
  }
}

function toConfidence(value: number): number | null {
  if (typeof value !== "number" || value < 0) {
    return null;
  }

  return value;
}

function mapAlternatives(results: ExpoSpeechRecognitionResult[]): SttTranscriptAlternative[] {
  return results.map((result) => ({
    transcript: result.transcript,
    confidence: toConfidence(result.confidence),
  }));
}

function normalizeErrorCode(code: ExpoSpeechRecognitionErrorCode): SttErrorCode {
  switch (code) {
    case "not-allowed":
      return "permission_denied";
    case "service-not-allowed":
    case "language-not-supported":
    case "busy":
    case "client":
    case "bad-grammar":
    case "interrupted":
      return "not_available";
    case "audio-capture":
      return "audio_capture";
    case "no-speech":
    case "speech-timeout":
      return "no_speech";
    case "aborted":
      return "aborted";
    case "network":
      return "network";
    case "unknown":
    default:
      return "unknown";
  }
}

function isRecoverable(code: SttErrorCode): boolean {
  return code !== "permission_denied";
}

export class ExpoSpeechRecognitionSession implements SttSession {
  private status: SttSessionStatus = "idle";

  private activeSessionId: string | null = null;

  private readonly subscriptions: Subscription[] = [];
  private readonly speechModule: ExpoModule | null;

  public constructor(private readonly callbacks: SttSessionCallbacks = {}) {
    this.speechModule = getSpeechModule();
    if (!this.speechModule) {
      return;
    }

    this.subscriptions.push(
      this.speechModule.addListener("start", () => {
        this.setStatus("listening");
      }) as Subscription,
      this.speechModule.addListener("end", () => {
        if (this.status !== "canceled") {
          this.setStatus("stopped");
        }
      }) as Subscription,
      this.speechModule.addListener("result", (event: ExpoSpeechRecognitionResultEvent) => {
        this.handleResult(event);
      }) as Subscription,
      this.speechModule.addListener("error", (event: ExpoSpeechRecognitionErrorEvent) => {
        this.handleError(event);
      }) as Subscription,
    );
  }

  public getStatus(): SttSessionStatus {
    return this.status;
  }

  public async checkPermissions(): Promise<SttPermissionState> {
    if (!this.speechModule) {
      return {
        granted: false,
        canAskAgain: false,
        status: "unavailable",
      };
    }

    const response = await this.speechModule.getPermissionsAsync();

    return {
      granted: response.granted,
      canAskAgain: response.canAskAgain,
      status: response.status,
    };
  }

  public async requestPermissions(): Promise<SttPermissionState> {
    if (!this.speechModule) {
      this.emitUnavailableError();
      return {
        granted: false,
        canAskAgain: false,
        status: "unavailable",
      };
    }

    this.setStatus("requesting-permission");
    const response = await this.speechModule.requestPermissionsAsync();

    if (!response.granted) {
      this.setStatus("error");
      this.callbacks.onError?.({
        sessionId: this.activeSessionId ?? "",
        code: "permission_denied",
        message: "Microphone and speech recognition permission was denied.",
        recoverable: false,
      });
    } else {
      this.setStatus("ready");
    }

    return {
      granted: response.granted,
      canAskAgain: response.canAskAgain,
      status: response.status,
    };
  }

  public async start(request: SttSessionStartRequest): Promise<void> {
    this.activeSessionId = request.sessionId;
    if (!this.speechModule) {
      this.emitUnavailableError();
      return;
    }

    const permissions = await this.checkPermissions();
    if (!permissions.granted) {
      const next = await this.requestPermissions();
      if (!next.granted) {
        return;
      }
    } else {
      this.setStatus("ready");
    }

    this.setStatus("starting");
    this.speechModule.start({
      lang: request.locale,
      interimResults: request.interimResults,
      maxAlternatives: request.maxAlternatives,
      continuous: request.continuous,
      requiresOnDeviceRecognition: request.requiresOnDeviceRecognition,
    });
  }

  public async stop(request: SttSessionStopRequest): Promise<void> {
    if (this.activeSessionId !== request.sessionId) {
      return;
    }
    if (!this.speechModule) {
      this.emitUnavailableError();
      return;
    }

    this.setStatus("stopping");
    this.speechModule.stop();
  }

  public async cancel(request: SttSessionCancelRequest): Promise<void> {
    if (this.activeSessionId !== request.sessionId) {
      return;
    }
    if (!this.speechModule) {
      this.emitUnavailableError();
      return;
    }

    this.setStatus("canceled");
    this.speechModule.abort();
  }

  public dispose(): void {
    for (const subscription of this.subscriptions) {
      subscription.remove();
    }

    this.subscriptions.length = 0;
  }

  private setStatus(status: SttSessionStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private handleResult(event: ExpoSpeechRecognitionResultEvent): void {
    if (!this.activeSessionId) {
      return;
    }

    const transcript = event.results[0]?.transcript?.trim() ?? "";
    if (!transcript) {
      return;
    }

    const kind: SttTranscriptKind = event.isFinal ? "final" : "partial";
    const result: SttTranscriptResult = {
      sessionId: this.activeSessionId,
      kind,
      transcript,
      alternatives: mapAlternatives(event.results),
      isFinal: event.isFinal,
      timestampMs: Date.now(),
    };

    if (event.isFinal) {
      this.callbacks.onFinalTranscript?.(result);
    } else {
      this.callbacks.onPartialTranscript?.(result);
    }
  }

  private handleError(event: ExpoSpeechRecognitionErrorEvent): void {
    const normalizedCode = normalizeErrorCode(event.error);
    const error: SttError = {
      sessionId: this.activeSessionId ?? "",
      code: normalizedCode,
      message: event.message,
      recoverable: isRecoverable(normalizedCode),
      rawCode: event.error,
    };

    this.setStatus("error");
    this.callbacks.onError?.(error);
  }

  private emitUnavailableError(): void {
    const error: SttError = {
      sessionId: this.activeSessionId ?? "",
      code: "not_available",
      message:
        "Speech recognition native module is unavailable. Use an Expo dev client build (not Expo Go).",
      recoverable: false,
      rawCode: "module_unavailable",
    };

    this.setStatus("error");
    this.callbacks.onError?.(error);
  }
}
