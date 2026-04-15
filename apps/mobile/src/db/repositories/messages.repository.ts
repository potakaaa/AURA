import { getDatabase } from '..';
import type { QueryExecutor } from '../types';

export type MessageRole = 'system' | 'user' | 'assistant';

export type MessageRecord = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
};

export type CreateMessageInput = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
};

export type UpdateMessageInput = {
  content: string;
};

export class MessagesRepository {
  constructor(private readonly db: QueryExecutor = getDatabase()) {}

  async create(input: CreateMessageInput): Promise<void> {
    await this.db.run(
      'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?);',
      [input.id, input.conversationId, input.role, input.content]
    );
  }

  async getById(id: string): Promise<MessageRecord | null> {
    return this.db.getFirst<MessageRecord>('SELECT * FROM messages WHERE id = ?;', [id]);
  }

  async listByConversation(conversationId: string): Promise<MessageRecord[]> {
    return this.db.getAll<MessageRecord>(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC;',
      [conversationId]
    );
  }

  async update(id: string, input: UpdateMessageInput): Promise<boolean> {
    const result = await this.db.run('UPDATE messages SET content = ? WHERE id = ?;', [
      input.content,
      id,
    ]);
    return result.changes > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM messages WHERE id = ?;', [id]);
    return result.changes > 0;
  }
}
