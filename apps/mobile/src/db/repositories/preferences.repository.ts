import { getDatabase } from '..';
import type { QueryExecutor } from '../types';

export type PreferenceRecord = {
  id: string;
  user_id: string;
  theme: string;
  locale: string;
  updated_at: string;
};

export type UpsertPreferenceInput = {
  id: string;
  userId: string;
  theme: string;
  locale: string;
};

export class PreferencesRepository {
  constructor(private readonly db: QueryExecutor = getDatabase()) {}

  async upsert(input: UpsertPreferenceInput): Promise<void> {
    await this.db.run(
      `
      INSERT INTO preferences (id, user_id, theme, locale, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id)
      DO UPDATE SET
        theme = excluded.theme,
        locale = excluded.locale,
        updated_at = CURRENT_TIMESTAMP;
      `,
      [input.id, input.userId, input.theme, input.locale]
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
}
