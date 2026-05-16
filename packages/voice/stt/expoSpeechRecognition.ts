import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import type {
  ExpoSpeechRecognitionErrorCode,
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResult,
  ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";

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
} from "./types.js";

type Subscription = { remove: () => void };

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

  public constructor(private readonly callbacks: SttSessionCallbacks = {}) {
    this.subscriptions.push(
      ExpoSpeechRecognitionModule.addListener("start", () => {
        this.setStatus("listening");
      }) as Subscription,
      ExpoSpeechRecognitionModule.addListener("end", () => {
        if (this.status !== "canceled") {
          this.setStatus("stopped");
        }
      }) as Subscription,
      ExpoSpeechRecognitionModule.addListener("result", (event) => {
        this.handleResult(event);
      }) as Subscription,
      ExpoSpeechRecognitionModule.addListener("error", (event) => {
        this.handleError(event);
      }) as Subscription,
    );
  }

  public getStatus(): SttSessionStatus {
    return this.status;
  }

  public async checkPermissions(): Promise<SttPermissionState> {
    const response = await ExpoSpeechRecognitionModule.getPermissionsAsync();

    return {
      granted: response.granted,
      canAskAgain: response.canAskAgain,
      status: response.status,
    };
  }

  public async requestPermissions(): Promise<SttPermissionState> {
    this.setStatus("requesting-permission");
    const response = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

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
    ExpoSpeechRecognitionModule.start({
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

    this.setStatus("stopping");
    ExpoSpeechRecognitionModule.stop();
  }

  public async cancel(request: SttSessionCancelRequest): Promise<void> {
    if (this.activeSessionId !== request.sessionId) {
      return;
    }

    this.setStatus("canceled");
    ExpoSpeechRecognitionModule.abort();
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
}
