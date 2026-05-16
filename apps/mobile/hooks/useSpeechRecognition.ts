import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExpoSpeechRecognitionSession } from "@aura/voice";

export interface SpeechRecognitionError {
  readonly sessionId: string;
  readonly code:
    | "permission_denied"
    | "not_available"
    | "audio_capture"
    | "no_speech"
    | "aborted"
    | "network"
    | "timeout"
    | "unknown";
  readonly message: string;
  readonly recoverable: boolean;
  readonly rawCode?: string;
}

export type SpeechRecognitionStatus =
  | "idle"
  | "requesting_permission"
  | "listening"
  | "processing"
  | "error";

export interface UseSpeechRecognitionOptions {
  readonly locale?: string;
  readonly interimResults?: boolean;
  readonly continuous?: boolean;
  readonly maxAlternatives?: number;
  readonly requiresOnDeviceRecognition?: boolean;
}

export interface UseSpeechRecognitionResult {
  readonly status: SpeechRecognitionStatus;
  readonly isListening: boolean;
  readonly partialTranscript: string;
  readonly finalTranscript: string;
  readonly transcript: string;
  readonly error: SpeechRecognitionError | null;
  readonly startListening: () => Promise<void>;
  readonly stopListening: () => Promise<void>;
  readonly cancelListening: () => Promise<void>;
  readonly resetTranscript: () => void;
}

const DEFAULT_OPTIONS: Required<UseSpeechRecognitionOptions> = {
  locale: "en-US",
  interimResults: true,
  continuous: false,
  maxAlternatives: 1,
  requiresOnDeviceRecognition: false,
};

function mapStatus(status: string): SpeechRecognitionStatus {
  switch (status) {
    case "requesting-permission":
      return "requesting_permission";
    case "starting":
    case "listening":
      return "listening";
    case "stopping":
      return "processing";
    case "error":
      return "error";
    case "ready":
    case "stopped":
    case "canceled":
    case "idle":
    default:
      return "idle";
  }
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionResult {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<SpeechRecognitionError | null>(null);

  const sessionIdRef = useRef<string | null>(null);

  const session = useMemo(
    () =>
      new ExpoSpeechRecognitionSession({
        onStatusChange: (nextStatus) => {
          setStatus(mapStatus(nextStatus));
        },
        onPartialTranscript: (result) => {
          setPartialTranscript(result.transcript);
        },
        onFinalTranscript: (result) => {
          setFinalTranscript(result.transcript);
          setPartialTranscript("");
          setStatus("idle");
        },
        onError: (nextError) => {
          setError(nextError);
          setStatus("error");
        },
      }),
    [],
  );

  useEffect(() => {
    return () => {
      session.dispose();
    };
  }, [session]);

  const startListening = useCallback(async () => {
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;

    setError(null);
    setPartialTranscript("");

    await session.start({
      action: "start",
      sessionId,
      locale: merged.locale,
      interimResults: merged.interimResults,
      continuous: merged.continuous,
      maxAlternatives: merged.maxAlternatives,
      requiresOnDeviceRecognition: merged.requiresOnDeviceRecognition,
    });
  }, [session, merged]);

  const stopListening = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      return;
    }

    await session.stop({ action: "stop", sessionId });
  }, [session]);

  const cancelListening = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      return;
    }

    await session.cancel({ action: "cancel", sessionId });
    sessionIdRef.current = null;
    setPartialTranscript("");
  }, [session]);

  const resetTranscript = useCallback(() => {
    setPartialTranscript("");
    setFinalTranscript("");
    setError(null);
    setStatus("idle");
  }, []);

  return {
    status,
    isListening: status === "listening",
    partialTranscript,
    finalTranscript,
    transcript: partialTranscript || finalTranscript,
    error,
    startListening,
    stopListening,
    cancelListening,
    resetTranscript,
  };
}
