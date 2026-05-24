import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ExpoCrypto from 'expo-crypto';
import { ExpoTextToSpeechSession, type TtsError, type TtsSessionStatus } from '@aura/voice';

export type TextToSpeechStatus = TtsSessionStatus;

export interface UseTextToSpeechOptions {
  readonly locale?: string;
  readonly rate?: number;
  readonly pitch?: number;
  readonly voice?: string;
  readonly initiallyMuted?: boolean;
}

export interface UseTextToSpeechResult {
  readonly status: TextToSpeechStatus;
  readonly isSpeaking: boolean;
  readonly isMuted: boolean;
  readonly error: TtsError | null;
  readonly speakReply: (text: string) => Promise<void>;
  readonly stopSpeaking: () => Promise<void>;
  readonly toggleMuted: () => void;
}

const DEFAULT_OPTIONS: Required<Omit<UseTextToSpeechOptions, 'voice'>> = {
  locale: 'en-US',
  rate: 0.96,
  pitch: 1,
  initiallyMuted: false,
};

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechResult {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const [status, setStatus] = useState<TextToSpeechStatus>('idle');
  const [isMuted, setIsMuted] = useState(merged.initiallyMuted);
  const [error, setError] = useState<TtsError | null>(null);
  const mutedRef = useRef(merged.initiallyMuted);

  const session = useMemo(
    () =>
      new ExpoTextToSpeechSession({
        onStatusChange: setStatus,
        onError: setError,
      }),
    []
  );

  useEffect(() => {
    mutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    return () => {
      session.dispose();
    };
  }, [session]);

  const stopSpeaking = useCallback(async () => {
    await session.stop();
  }, [session]);

  const speakReply = useCallback(
    async (text: string) => {
      const reply = text.trim();

      if (!reply || mutedRef.current) {
        return;
      }

      setError(null);
      await session.speak({
        utteranceId: ExpoCrypto.randomUUID(),
        text: reply,
        locale: merged.locale,
        rate: merged.rate,
        pitch: merged.pitch,
        voice: merged.voice,
      });
    },
    [merged.locale, merged.pitch, merged.rate, merged.voice, session]
  );

  const toggleMuted = useCallback(() => {
    setIsMuted((previous) => {
      const next = !previous;
      mutedRef.current = next;

      if (next) {
        void session.stop().catch(() => {});
      }

      return next;
    });
  }, [session]);

  return {
    status,
    isSpeaking: status === 'speaking',
    isMuted,
    error,
    speakReply,
    stopSpeaking,
    toggleMuted,
  };
}
