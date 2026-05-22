import { getDatabase } from '..';
import type { QueryExecutor } from '../types';

export type PreferenceMemorySource = 'explicit' | 'inferred';

export type PreferenceMemoryRecord = {
  id: string;
  user_id: string;
  key: string;
  value: string;
  source: PreferenceMemorySource;
  confidence: number;
  updated_at: string;
};

export type UpsertPreferenceMemoryInput = {
  id: string;
  userId: string;
  key: string;
  value: string;
  source: PreferenceMemorySource;
  confidence: number;
};

export class PreferenceMemoriesRepository {
  constructor(private readonly db: QueryExecutor = getDatabase()) {}

  async upsert(input: UpsertPreferenceMemoryInput): Promise<void> {
    await this.db.run(
      `
      INSERT INTO preference_memories (id, user_id, key, value, source, confidence, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, key, source)
      DO UPDATE SET
        value = excluded.value,
        confidence = excluded.confidence,
        updated_at = CURRENT_TIMESTAMP;
      `,
      [input.id, input.userId, input.key, input.value, input.source, input.confidence]
    );
  }

  async listByUser(userId: string): Promise<PreferenceMemoryRecord[]> {
    return this.db.getAll<PreferenceMemoryRecord>(
      'SELECT * FROM preference_memories WHERE user_id = ? ORDER BY updated_at DESC;',
      [userId]
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM preference_memories WHERE id = ?;', [id]);
    return result.changes > 0;
  }

  async deleteByUser(userId: string): Promise<number> {
    const result = await this.db.run('DELETE FROM preference_memories WHERE user_id = ?;', [
      userId,
    ]);
    return result.changes;
  }
}
