import * as Speech from "expo-speech";

import type {
  TtsError,
  TtsSession,
  TtsSessionCallbacks,
  TtsSessionStatus,
  TtsSpeakRequest,
  TtsVoice,
} from "./types";

type ExpoVoice = {
  identifier?: string;
  name?: string;
  language?: string;
  quality?: string;
};

function toTtsVoice(voice: ExpoVoice): TtsVoice | null {
  if (!voice.identifier || !voice.name || !voice.language) {
    return null;
  }

  return {
    identifier: voice.identifier,
    name: voice.name,
    language: voice.language,
    quality: voice.quality,
  };
}

function getSpeechTextLimit(): number {
  return typeof Speech.maxSpeechInputLength === "number" ? Speech.maxSpeechInputLength : 0;
}

function normalizeSpeechError(utteranceId: string, cause: unknown): TtsError {
  const message = cause instanceof Error ? cause.message : "Text-to-speech failed.";
  const isInterrupted = /interrupted|canceled|cancelled|stopped/i.test(message);

  return {
    utteranceId,
    code: isInterrupted ? "interrupted" : "unknown",
    message,
    recoverable: true,
    cause,
  };
}

export class ExpoTextToSpeechSession implements TtsSession {
  private status: TtsSessionStatus = "idle";

  private activeUtteranceId: string | null = null;

  public constructor(private readonly callbacks: TtsSessionCallbacks = {}) {}

  public getStatus(): TtsSessionStatus {
    return this.status;
  }

  public async speak(request: TtsSpeakRequest): Promise<void> {
    const text = request.text.trim();
    const limit = getSpeechTextLimit();

    if (!text || (limit > 0 && text.length > limit)) {
      const error: TtsError = {
        utteranceId: request.utteranceId,
        code: "invalid_text",
        message: !text
          ? "Text-to-speech requires non-empty text."
          : `Text-to-speech input exceeds the ${limit} character limit.`,
        recoverable: true,
      };
      this.setStatus("error");
      this.callbacks.onError?.(error);
      throw new Error(error.message);
    }

    await this.stop();
    this.activeUtteranceId = request.utteranceId;

    Speech.speak(text, {
      language: request.locale,
      pitch: request.pitch,
      rate: request.rate,
      voice: request.voice,
      onStart: () => {
        if (this.activeUtteranceId !== request.utteranceId) {
          return;
        }
        this.setStatus("speaking");
        this.callbacks.onStart?.(request.utteranceId);
      },
      onDone: () => {
        if (this.activeUtteranceId !== request.utteranceId) {
          return;
        }
        this.activeUtteranceId = null;
        this.setStatus("stopped");
        this.callbacks.onDone?.(request.utteranceId);
      },
      onStopped: () => {
        if (this.activeUtteranceId !== request.utteranceId) {
          return;
        }
        this.activeUtteranceId = null;
        this.setStatus("stopped");
        this.callbacks.onStopped?.(request.utteranceId);
      },
      onError: (error: unknown) => {
        if (this.activeUtteranceId !== request.utteranceId) {
          return;
        }
        this.activeUtteranceId = null;
        const normalizedError = normalizeSpeechError(request.utteranceId, error);
        this.setStatus("error");
        this.callbacks.onError?.(normalizedError);
      },
    });
  }

  public async stop(): Promise<void> {
    const utteranceId = this.activeUtteranceId;
    try {
      await Speech.stop();
      this.activeUtteranceId = null;
      if (utteranceId) {
        this.setStatus("stopped");
        this.callbacks.onStopped?.(utteranceId);
      }
    } catch (cause) {
      const error: TtsError = {
        utteranceId: utteranceId ?? "",
        code: "interrupted",
        message: cause instanceof Error ? cause.message : "Unable to stop text-to-speech.",
        recoverable: true,
        cause,
      };
      this.setStatus("error");
      this.callbacks.onError?.(error);
      throw cause;
    }
  }

  public async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }

  public async getAvailableVoices(): Promise<TtsVoice[]> {
    try {
      const voices = (await Speech.getAvailableVoicesAsync()) as ExpoVoice[];
      return voices.map(toTtsVoice).filter((voice): voice is TtsVoice => voice !== null);
    } catch (cause) {
      const error: TtsError = {
        utteranceId: "",
        code: "not_available",
        message: cause instanceof Error ? cause.message : "Text-to-speech voices are unavailable.",
        recoverable: false,
        cause,
      };
      this.setStatus("error");
      this.callbacks.onError?.(error);
      return [];
    }
  }

  public dispose(): void {
    void this.stop().catch(() => {});
  }

  private setStatus(status: TtsSessionStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }
}
