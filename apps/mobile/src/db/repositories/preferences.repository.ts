import { getDatabase } from '..';
import type { QueryExecutor } from '../types';

export type PreferenceRecord = {
  id: string;
  user_id: string;
  theme: string;
  locale: string;
  inferred_memory_enabled: number;
  updated_at: string;
};

export type UpsertPreferenceInput = {
  id: string;
  userId: string;
  theme: string;
  locale: string;
  inferredMemoryEnabled?: boolean;
};

export class PreferencesRepository {
  constructor(private readonly db: QueryExecutor = getDatabase()) {}

  async upsert(input: UpsertPreferenceInput): Promise<void> {
    await this.db.run(
      `
      INSERT INTO preferences (id, user_id, theme, locale, inferred_memory_enabled, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id)
      DO UPDATE SET
        theme = excluded.theme,
        locale = excluded.locale,
        inferred_memory_enabled = excluded.inferred_memory_enabled,
        updated_at = CURRENT_TIMESTAMP;
      `,
      [
        input.id,
        input.userId,
        input.theme,
        input.locale,
        input.inferredMemoryEnabled ? 1 : 0,
      ]
    );
  }

  async getByUserId(userId: string): Promise<PreferenceRecord | null> {
    return this.db.getFirst<PreferenceRecord>('SELECT * FROM preferences WHERE user_id = ?;', [
      userId,
    ]);
  }

  async list(): Promise<PreferenceRecord[]> {
    return this.db.getAll<PreferenceRecord>('SELECT * FROM preferences ORDER BY updated_at DESC;');
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM preferences WHERE user_id = ?;', [userId]);
    return result.changes > 0;
  }

  async setInferredMemoryEnabled(userId: string, enabled: boolean): Promise<boolean> {
    const result = await this.db.run(
      'UPDATE preferences SET inferred_memory_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?;',
      [enabled ? 1 : 0, userId]
    );
    return result.changes > 0;
  }
}
