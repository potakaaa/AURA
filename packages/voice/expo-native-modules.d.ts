declare module "expo-modules-core" {
  export function requireNativeModule<T = unknown>(moduleName: string): T;
}

declare module "expo-speech-recognition" {
  export type ExpoSpeechRecognitionErrorCode =
    | "not-allowed"
    | "service-not-allowed"
    | "language-not-supported"
    | "busy"
    | "client"
    | "bad-grammar"
    | "interrupted"
    | "audio-capture"
    | "no-speech"
    | "speech-timeout"
    | "aborted"
    | "network"
    | "unknown";

  export type ExpoSpeechRecognitionResult = {
    transcript: string;
    confidence: number;
    segments?: unknown[];
  };

  export type ExpoSpeechRecognitionResultEvent = {
    isFinal: boolean;
    results: ExpoSpeechRecognitionResult[];
  };

  export type ExpoSpeechRecognitionErrorEvent = {
    error: ExpoSpeechRecognitionErrorCode;
    message: string;
    code?: ExpoSpeechRecognitionErrorCode;
  };

  export type ExpoSpeechRecognitionNativeEventMap = {
    start: unknown;
    end: unknown;
    result: ExpoSpeechRecognitionResultEvent;
    error: ExpoSpeechRecognitionErrorEvent;
  };
}