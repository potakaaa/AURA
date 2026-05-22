import {
  PreferenceMemoriesRepository,
  PreferencesRepository,
  UsersRepository,
  type PreferenceMemoryRecord,
  type PreferenceMemorySource,
} from './repositories';

export type PreferenceMemorySettings = {
  inferredMemoryEnabled: boolean;
};

export type RememberPreferenceInput = {
  key: string;
  value: string;
  source: PreferenceMemorySource;
  confidence?: number;
};

export type AiEngineUserPreferences = {
  name?: string;
  timezone?: string;
  preferredLanguage?: string;
  frequentlyUsedApps?: readonly string[];
  customInstructions?: string;
};

const LOCAL_USER_ID = 'local-voice-hub-user';
const DEFAULT_THEME = 'dark';
const DEFAULT_LOCALE = 'en-US';

type PreferenceMemoryRepositories = {
  users: UsersRepository;
  preferences: PreferencesRepository;
  memories: PreferenceMemoriesRepository;
};

export async function getPreferenceMemorySettings(
  repositories = createRepositories()
): Promise<PreferenceMemorySettings> {
  await ensureLocalPreferenceUser(repositories);
  const preferences = await repositories.preferences.getByUserId(LOCAL_USER_ID);

  return {
    inferredMemoryEnabled: Boolean(preferences?.inferred_memory_enabled),
  };
}

export async function setInferredPreferenceMemoryEnabled(
  enabled: boolean,
  repositories = createRepositories()
): Promise<void> {
  await ensureLocalPreferenceUser(repositories);
  const updated = await repositories.preferences.setInferredMemoryEnabled(LOCAL_USER_ID, enabled);

  if (!updated) {
    await repositories.preferences.upsert({
      id: createLocalId(),
      userId: LOCAL_USER_ID,
      theme: DEFAULT_THEME,
      locale: DEFAULT_LOCALE,
      inferredMemoryEnabled: enabled,
    });
  }
}

export async function rememberPreference(
  input: RememberPreferenceInput,
  repositories = createRepositories()
): Promise<boolean> {
  const key = input.key.trim();
  const value = input.value.trim();

  if (!key || !value) {
    return false;
  }

  await ensureLocalPreferenceUser(repositories);

  if (input.source === 'inferred') {
    const settings = await getPreferenceMemorySettings(repositories);
    if (!settings.inferredMemoryEnabled) {
      return false;
    }
  }

  await repositories.memories.upsert({
    id: createLocalId(),
    userId: LOCAL_USER_ID,
    key,
    value,
    source: input.source,
    confidence: clampConfidence(input.confidence ?? (input.source === 'explicit' ? 1 : 0.6)),
  });
  return true;
}

export async function listPreferenceMemories(
  repositories = createRepositories()
): Promise<PreferenceMemoryRecord[]> {
  await ensureLocalPreferenceUser(repositories);
  return repositories.memories.listByUser(LOCAL_USER_ID);
}

export async function deletePreferenceMemory(
  id: string,
  repositories = createRepositories()
): Promise<boolean> {
  return repositories.memories.delete(id);
}

export async function clearPreferenceMemories(
  repositories = createRepositories()
): Promise<number> {
  await ensureLocalPreferenceUser(repositories);
  return repositories.memories.deleteByUser(LOCAL_USER_ID);
}

export async function buildLocalAiEngineUserPreferences(
  repositories = createRepositories()
): Promise<AiEngineUserPreferences> {
  const memories = await listPreferenceMemories(repositories);
  const result: AiEngineUserPreferences = {};
  const customInstructions: string[] = [];

  for (const memory of memories) {
    if (memory.key === 'name') {
      result.name = memory.value;
    } else if (memory.key === 'timezone') {
      result.timezone = memory.value;
    } else if (memory.key === 'preferredLanguage') {
      result.preferredLanguage = memory.value;
    } else if (memory.key === 'frequentlyUsedApps') {
      result.frequentlyUsedApps = memory.value
        .split(',')
        .map((app) => app.trim())
        .filter(Boolean);
    } else {
      customInstructions.push(`${memory.key}: ${memory.value}`);
    }
  }

  if (customInstructions.length > 0) {
    result.customInstructions = customInstructions.join('\n');
  }

  return result;
}

function createRepositories(): PreferenceMemoryRepositories {
  return {
    users: new UsersRepository(),
    preferences: new PreferencesRepository(),
    memories: new PreferenceMemoriesRepository(),
  };
}

async function ensureLocalPreferenceUser(
  repositories: PreferenceMemoryRepositories
): Promise<void> {
  const existingUser = await repositories.users.getById(LOCAL_USER_ID);
  if (!existingUser) {
    await repositories.users.create({
      id: LOCAL_USER_ID,
      name: 'Local Voice Hub User',
      email: null,
    });
  }

  const existingPreferences = await repositories.preferences.getByUserId(LOCAL_USER_ID);
  if (!existingPreferences) {
    await repositories.preferences.upsert({
      id: createLocalId(),
      userId: LOCAL_USER_ID,
      theme: DEFAULT_THEME,
      locale: DEFAULT_LOCALE,
      inferredMemoryEnabled: false,
    });
  }
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function createLocalId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random()}`;
}
