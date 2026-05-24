import { useCallback, useMemo } from 'react';
import { NativeModules, Platform } from 'react-native';

type RunningResult = {
  readonly running: boolean;
};

type NotificationPermissionResult = {
  readonly granted: boolean;
  readonly canAskAgain?: boolean;
};

type AuraBackgroundWakeWordModule = {
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
      setListeningEnabled,
    }),
    [isRunning, isSupported, requestPermission, setListeningEnabled, start, stop]
  );
}
