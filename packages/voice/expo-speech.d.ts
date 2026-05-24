declare module "expo-speech" {
  export type SpeechOptions = {
    language?: string;
    pitch?: number;
    rate?: number;
    voice?: string;
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (error: unknown) => void;
  };

  export const maxSpeechInputLength: number | undefined;

  export function speak(text: string, options?: SpeechOptions): void;
  export function stop(): Promise<void>;
  export function isSpeakingAsync(): Promise<boolean>;
  export function getAvailableVoicesAsync(): Promise<unknown[]>;
}