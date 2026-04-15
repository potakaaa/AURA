import { getDatabase } from '..';
import type { QueryExecutor } from '../types';

export type ConversationRecord = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at?: string;
};

export type CreateConversationInput = {
  id: string;
  userId: string;
  title: string;
};

export type UpdateConversationInput = {
  title: string;
};

export class ConversationsRepository {
  constructor(private readonly db: QueryExecutor = getDatabase()) {}

  async create(input: CreateConversationInput): Promise<void> {
    await this.db.run('INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?);', [
      input.id,
      input.userId,
      input.title,
    ]);
  }

  async getById(id: string): Promise<ConversationRecord | null> {
    return this.db.getFirst<ConversationRecord>('SELECT * FROM conversations WHERE id = ?;', [id]);
  }

  async listByUser(userId: string): Promise<ConversationRecord[]> {
    return this.db.getAll<ConversationRecord>(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC;',
      [userId]
    );
  }

  async update(id: string, input: UpdateConversationInput): Promise<boolean> {
    const result = await this.db.run(
      'UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
      [input.title, id]
    );
    return result.changes > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM conversations WHERE id = ?;', [id]);
    return result.changes > 0;
  }
}
