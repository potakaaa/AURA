import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppColorScheme = 'light' | 'dark' | 'system';

const COLOR_SCHEME_KEY = 'aura:color-scheme';

export async function loadStoredColorScheme(): Promise<AppColorScheme> {
  const value = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  return 'dark';
}

export async function persistColorScheme(value: AppColorScheme): Promise<void> {
  await AsyncStorage.setItem(COLOR_SCHEME_KEY, value);
}
