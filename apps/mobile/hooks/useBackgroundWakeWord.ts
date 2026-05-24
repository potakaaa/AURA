import { LLM_CHAT_API_BASE_URL } from '@/lib/llm-chat';
import { useCallback, useMemo } from 'react';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

type RunningResult = {
  readonly running: boolean;
};

type NotificationPermissionResult = {
  readonly granted: boolean;
  readonly canAskAgain?: boolean;
};

type AuraBackgroundWakeWordModule = {
  configure?: (options: { apiBaseUrl: string }) => Promise<{ configured: boolean }>;
  start?: () => Promise<RunningResult>;
  stop?: () => Promise<RunningResult>;
  isRunning?: () => Promise<RunningResult>;
  setListeningEnabled?: (enabled: boolean) => Promise<RunningResult>;
  requestNotificationPermission?: () => Promise<NotificationPermissionResult>;
};

function getModule(): AuraBackgroundWakeWordModule | null {
  if (Platform.OS !== 'android') {
    return null;
  }

  return (NativeModules.AuraBackgroundWakeWord as AuraBackgroundWakeWordModule | undefined) ?? null;
}

export function useBackgroundWakeWord() {
  const nativeModule = getModule();
  const isSupported = Boolean(nativeModule);

  const start = useCallback(async () => {
    await nativeModule?.configure?.({ apiBaseUrl: LLM_CHAT_API_BASE_URL });
    return (await nativeModule?.start?.()) ?? { running: false };
  }, [nativeModule]);

  const stop = useCallback(async () => {
    return (await nativeModule?.stop?.()) ?? { running: false };
  }, [nativeModule]);

  const isRunning = useCallback(async () => {
    return (await nativeModule?.isRunning?.()) ?? { running: false };
  }, [nativeModule]);

  const requestPermission = useCallback(async () => {
    return (await nativeModule?.requestNotificationPermission?.()) ?? {
      granted: Platform.OS !== 'android',
      canAskAgain: false,
    };
  }, [nativeModule]);

  const requestMicrophonePermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return { granted: true, canAskAgain: false };
    }

    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    if (alreadyGranted) {
      return { granted: true, canAskAgain: false };
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );

    return {
      granted: result === PermissionsAndroid.RESULTS.GRANTED,
      canAskAgain: result !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
    };
  }, []);

  const setListeningEnabled = useCallback(
    async (enabled: boolean) => {
      return (await nativeModule?.setListeningEnabled?.(enabled)) ?? { running: false };
    },
    [nativeModule]
  );

  return useMemo(
    () => ({
      isSupported,
      start,
      stop,
      isRunning,
      requestPermission,
      requestMicrophonePermission,
      setListeningEnabled,
    }),
    [
      isRunning,
      isSupported,
      requestMicrophonePermission,
      requestPermission,
      setListeningEnabled,
      start,
      stop,
    ]
  );
}
