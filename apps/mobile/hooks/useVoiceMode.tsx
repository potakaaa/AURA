import { useAuthSession } from '@/hooks/use-auth-session';
import {
  VoiceModeStateMachine,
  type VoiceModeCommand,
  type VoiceModeSnapshot,
  type VoiceModeStatus,
} from '@/src/voice-mode/state-machine';
import { ExpoSpeechRecognitionSession, type SttError, type SttSessionStatus } from '@aura/voice';
import * as ExpoCrypto from 'expo-crypto';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, NativeModules, Platform, type AppStateStatus } from 'react-native';

export type { VoiceModeCommand, VoiceModeStatus };

export interface VoiceModeContextValue {
  readonly status: VoiceModeStatus;
  readonly isListening: boolean;
  readonly wakeDetected: boolean;
  readonly partialTranscript: string;
  readonly lastCommand: VoiceModeCommand | null;
  readonly error: SttError | null;
  readonly wakeSignalId: number;
  readonly start: () => Promise<void>;
  readonly stop: () => Promise<void>;
  readonly resetError: () => void;
  readonly completeProcessing: () => void;
}

const RESTART_DELAY_MS = 250;
const PARTIAL_COMMAND_DISPATCH_DELAY_MS = 1_200;
const START_OPTIONS = {
  locale: 'en-US',
  interimResults: true,
  continuous: Platform.OS === 'android',
  maxAlternatives: 1,
  requiresOnDeviceRecognition: false,
};

const INITIAL_SNAPSHOT: VoiceModeSnapshot = {
  status: 'idle',
  partialTranscript: '',
  lastCommand: null,
  error: null,
  wakeSignalId: 0,
};

const VoiceModeContext = createContext<VoiceModeContextValue | null>(null);

function shouldRestartAfterSnapshot(snapshot: VoiceModeSnapshot): boolean {
  return snapshot.status !== 'error' && snapshot.error === null;
}

function playWakeWordCue() {
  try {
    const wakeCue = NativeModules.AuraWakeCue as { play?: () => void } | undefined;
    if (wakeCue?.play) {
      wakeCue.play();
      return;
    }

    const soundManager = NativeModules.SoundManager as
      | { playTouchSound?: () => void }
      | undefined;
    soundManager?.playTouchSound?.();
  } catch {
    // Audio feedback is non-critical.
  }
}

export function VoiceModeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthSession();
  const machineRef = useRef(new VoiceModeStateMachine());
  const sessionRef = useRef<ExpoSpeechRecognitionSession | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partialCommandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStartingRef = useRef(false);
  const shouldRunRef = useRef(false);
  const isAppActiveRef = useRef(AppState.currentState === 'active');
  const isAuthenticatedRef = useRef(false);
  const [snapshot, setSnapshot] = useState<VoiceModeSnapshot>(INITIAL_SNAPSHOT);

  const publish = useCallback((nextSnapshot: VoiceModeSnapshot) => {
    setSnapshot({ ...nextSnapshot });
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const clearPartialCommandTimer = useCallback(() => {
    if (partialCommandTimerRef.current) {
      clearTimeout(partialCommandTimerRef.current);
      partialCommandTimerRef.current = null;
    }
  }, []);

  const canRun = useCallback(() => {
    return shouldRunRef.current && isAppActiveRef.current && isAuthenticatedRef.current;
  }, []);

  const schedulePartialCommandDispatch = useCallback(() => {
    clearPartialCommandTimer();
    partialCommandTimerRef.current = setTimeout(() => {
      partialCommandTimerRef.current = null;
      publish(machineRef.current.promotePartialTranscriptToCommand());
    }, PARTIAL_COMMAND_DISPATCH_DELAY_MS);
  }, [clearPartialCommandTimer, publish]);

  const startRecognition = useCallback(async () => {
    if (!canRun() || isStartingRef.current || sessionIdRef.current) {
      return;
    }

    clearRestartTimer();
    isStartingRef.current = true;

    const sessionId = ExpoCrypto.randomUUID();
    sessionIdRef.current = sessionId;
    publish(machineRef.current.startListening());

    try {
      await sessionRef.current?.start({
        action: 'start',
        sessionId,
        ...START_OPTIONS,
      });
    } catch (error) {
      sessionIdRef.current = null;
      const nextSnapshot = machineRef.current.handleError({
        sessionId,
        code: 'unknown',
        message: error instanceof Error ? error.message : 'Unable to start voice recognition.',
        recoverable: true,
      });
      publish(nextSnapshot);
    } finally {
      isStartingRef.current = false;
    }
  }, [canRun, clearRestartTimer, publish]);

  const scheduleRestart = useCallback(() => {
    if (!canRun() || machineRef.current.getSnapshot().status === 'error') {
      return;
    }

    clearRestartTimer();
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      void startRecognition();
    }, RESTART_DELAY_MS);
  }, [canRun, clearRestartTimer, startRecognition]);

  const stopActiveSession = useCallback(async () => {
    clearRestartTimer();
    clearPartialCommandTimer();
    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    isStartingRef.current = false;

    if (!sessionId) {
      return;
    }

    try {
      await sessionRef.current?.cancel({ action: 'cancel', sessionId });
    } catch {
      // Stopping voice mode should not surface a user-facing error.
    }
  }, [clearPartialCommandTimer, clearRestartTimer]);

  useEffect(() => {
    sessionRef.current = new ExpoSpeechRecognitionSession({
      onStatusChange: (nextStatus: SttSessionStatus) => {
        if (nextStatus === 'stopped' || nextStatus === 'canceled' || nextStatus === 'idle') {
          sessionIdRef.current = null;
          clearPartialCommandTimer();
          if (nextStatus !== 'canceled') {
            const promotedSnapshot = machineRef.current.promotePartialTranscriptToCommand();
            if (promotedSnapshot.status === 'processing') {
              publish(promotedSnapshot);
              return;
            }
          }

          const nextSnapshot = machineRef.current.handleRecognitionEnd();
          publish(nextSnapshot);
          if (shouldRestartAfterSnapshot(nextSnapshot)) {
            scheduleRestart();
          }
        }
      },
      onPartialTranscript: (result) => {
        const nextSnapshot = machineRef.current.receivePartialTranscript(result.transcript);
        publish(nextSnapshot);
        if (nextSnapshot.status === 'listening' || nextSnapshot.status === 'wake-detected') {
          schedulePartialCommandDispatch();
        }
      },
      onFinalTranscript: (result) => {
        clearPartialCommandTimer();
        publish(machineRef.current.receiveFinalTranscript(result.transcript));
      },
      onError: (nextError) => {
        sessionIdRef.current = null;
        clearPartialCommandTimer();
        const nextSnapshot = machineRef.current.handleError(nextError);
        publish(nextSnapshot);
        if (shouldRestartAfterSnapshot(nextSnapshot)) {
          scheduleRestart();
        }
      },
    });

    return () => {
      clearRestartTimer();
      clearPartialCommandTimer();
      sessionRef.current?.dispose();
      sessionRef.current = null;
    };
  }, [
    clearPartialCommandTimer,
    clearRestartTimer,
    publish,
    schedulePartialCommandDispatch,
    scheduleRestart,
  ]);

  const start = useCallback(async () => {
    shouldRunRef.current = true;
    publish(machineRef.current.resetError());
    await startRecognition();
  }, [publish, startRecognition]);

  const stop = useCallback(async () => {
    shouldRunRef.current = false;
    await stopActiveSession();
    publish(machineRef.current.stop());
  }, [publish, stopActiveSession]);

  const resetError = useCallback(() => {
    publish(machineRef.current.resetError());
  }, [publish]);

  const completeProcessing = useCallback(() => {
    clearPartialCommandTimer();
    const nextSnapshot = machineRef.current.completeProcessing();
    publish(nextSnapshot);
    if (shouldRestartAfterSnapshot(nextSnapshot)) {
      scheduleRestart();
    }
  }, [clearPartialCommandTimer, publish, scheduleRestart]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;

    if (isLoading) {
      return;
    }

    if (isAuthenticated) {
      shouldRunRef.current = true;
      void startRecognition();
      return;
    }

    shouldRunRef.current = false;
    void stopActiveSession();
    publish(machineRef.current.stop());
  }, [isAuthenticated, isLoading, publish, startRecognition, stopActiveSession]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      isAppActiveRef.current = nextState === 'active';

      if (nextState === 'active') {
        void startRecognition();
        return;
      }

      void stopActiveSession();
      publish(machineRef.current.stop());
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [publish, startRecognition, stopActiveSession]);

  useEffect(() => {
    if (snapshot.wakeSignalId > 0) {
      playWakeWordCue();
    }
  }, [snapshot.wakeSignalId]);

  const value = useMemo<VoiceModeContextValue>(
    () => ({
      status: snapshot.status,
      isListening: snapshot.status === 'listening' || snapshot.status === 'wake-detected',
      wakeDetected: snapshot.status === 'wake-detected',
      partialTranscript: snapshot.partialTranscript,
      lastCommand: snapshot.lastCommand,
      error: snapshot.error,
      wakeSignalId: snapshot.wakeSignalId,
      start,
      stop,
      resetError,
      completeProcessing,
    }),
    [completeProcessing, resetError, snapshot, start, stop]
  );

  return <VoiceModeContext.Provider value={value}>{children}</VoiceModeContext.Provider>;
}

export function useVoiceMode(): VoiceModeContextValue {
  const context = useContext(VoiceModeContext);
  if (!context) {
    throw new Error('useVoiceMode must be used within VoiceModeProvider');
  }

  return context;
}
