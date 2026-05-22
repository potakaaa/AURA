import { describe, expect, it } from 'vitest';

import {
  buildLocalAiEngineUserPreferences,
  clearPreferenceMemories,
  getPreferenceMemorySettings,
  listPreferenceMemories,
  rememberPreference,
  setInferredPreferenceMemoryEnabled,
} from './preference-memory';
import { MemoryQueryExecutor } from './__tests__/helpers/memory-db';
import {
  PreferenceMemoriesRepository,
  PreferencesRepository,
  UsersRepository,
} from './repositories';

function createTestRepositories() {
  const db = new MemoryQueryExecutor();
  return {
    users: new UsersRepository(db),
    preferences: new PreferencesRepository(db),
    memories: new PreferenceMemoriesRepository(db),
  };
}

describe('preference memory', () => {
  it('keeps inferred memory storage disabled until opt-in', async () => {
    const repositories = createTestRepositories();

    await expect(getPreferenceMemorySettings(repositories)).resolves.toEqual({
      inferredMemoryEnabled: false,
    });

    await expect(
      rememberPreference(
        { key: 'timezone', value: 'Asia/Manila', source: 'inferred', confidence: 0.7 },
        repositories
      )
    ).resolves.toBe(false);
    await expect(listPreferenceMemories(repositories)).resolves.toEqual([]);

    await setInferredPreferenceMemoryEnabled(true, repositories);
    await expect(
      rememberPreference(
        { key: 'timezone', value: 'Asia/Manila', source: 'inferred', confidence: 0.7 },
        repositories
      )
    ).resolves.toBe(true);
    await expect(listPreferenceMemories(repositories)).resolves.toMatchObject([
      { key: 'timezone', value: 'Asia/Manila', source: 'inferred', confidence: 0.7 },
    ]);
  });

  it('stores explicit memories without inferred-memory opt-in', async () => {
    const repositories = createTestRepositories();

    await expect(
      rememberPreference(
        { key: 'preferredLanguage', value: 'en-US', source: 'explicit' },
        repositories
      )
    ).resolves.toBe(true);

    await expect(listPreferenceMemories(repositories)).resolves.toMatchObject([
      { key: 'preferredLanguage', value: 'en-US', source: 'explicit', confidence: 1 },
    ]);
  });

  it('builds provider-agnostic user preferences for context injection', async () => {
    const repositories = createTestRepositories();

    await rememberPreference({ key: 'name', value: 'AURA Tester', source: 'explicit' }, repositories);
    await rememberPreference(
      { key: 'frequentlyUsedApps', value: 'Calendar, Mail', source: 'explicit' },
      repositories
    );
    await rememberPreference(
      { key: 'briefingStyle', value: 'Prefer concise morning briefings', source: 'explicit' },
      repositories
    );

    await expect(buildLocalAiEngineUserPreferences(repositories)).resolves.toEqual({
      name: 'AURA Tester',
      frequentlyUsedApps: ['Calendar', 'Mail'],
      customInstructions: 'briefingStyle: Prefer concise morning briefings',
    });
  });

  it('clears stored memories', async () => {
    const repositories = createTestRepositories();

    await rememberPreference({ key: 'name', value: 'AURA Tester', source: 'explicit' }, repositories);
    await expect(clearPreferenceMemories(repositories)).resolves.toBe(1);
    await expect(listPreferenceMemories(repositories)).resolves.toEqual([]);
  });
});
