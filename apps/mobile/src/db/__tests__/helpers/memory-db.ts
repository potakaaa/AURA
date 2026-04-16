import type { QueryExecutor, RunResult, SqlParams } from '../../types';

type UserRow = { id: string; name: string; email: string | null; created_at: string };
type ConversationRow = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at?: string;
};
type MessageRow = {
  id: string;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at: string;
};
type PreferenceRow = {
  id: string;
  user_id: string;
  theme: string;
  locale: string;
  updated_at: string;
};

export class MemoryQueryExecutor implements QueryExecutor {
  private readonly users = new Map<string, UserRow>();
  private readonly conversations = new Map<string, ConversationRow>();
  private readonly messages = new Map<string, MessageRow>();
  private readonly preferencesByUser = new Map<string, PreferenceRow>();
  private version = 0;

  async exec(sql: string): Promise<void> {
    const normalized = this.normalize(sql);
    if (normalized.startsWith('PRAGMA USER_VERSION =')) {
      const nextVersion = Number.parseInt(normalized.split('=').pop()?.trim() ?? '0', 10);
      this.version = nextVersion;
      return;
    }
  }

  async run(sql: string, params: SqlParams = []): Promise<RunResult> {
    const normalized = this.normalize(sql);

    if (normalized.startsWith('INSERT INTO USERS')) {
      const [id, name, email] = params as [string, string, string | null];
      this.users.set(id, { id, name, email, created_at: this.now() });
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('UPDATE USERS SET')) {
      const [name, email, id] = params as [string, string | null, string];
      const existing = this.users.get(id);
      if (!existing) {
        return { changes: 0, lastInsertRowId: 0 };
      }
      this.users.set(id, { ...existing, name, email });
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('DELETE FROM USERS')) {
      const [id] = params as [string];
      const removed = this.users.delete(id);
      return { changes: removed ? 1 : 0, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('INSERT INTO CONVERSATIONS')) {
      const [id, userId, title] = params as [string, string, string];
      this.conversations.set(id, { id, user_id: userId, title, created_at: this.now() });
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('UPDATE CONVERSATIONS SET')) {
      const [title, id] = params as [string, string];
      const existing = this.conversations.get(id);
      if (!existing) {
        return { changes: 0, lastInsertRowId: 0 };
      }
      this.conversations.set(id, { ...existing, title, updated_at: this.now() });
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('DELETE FROM CONVERSATIONS')) {
      const [id] = params as [string];
      const removed = this.conversations.delete(id);
      return { changes: removed ? 1 : 0, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('INSERT INTO MESSAGES')) {
      const [id, conversationId, role, content] = params as [
        string,
        string,
        MessageRow['role'],
        string,
      ];
      this.messages.set(id, {
        id,
        conversation_id: conversationId,
        role,
        content,
        created_at: this.now(),
      });
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('UPDATE MESSAGES SET')) {
      const [content, id] = params as [string, string];
      const existing = this.messages.get(id);
      if (!existing) {
        return { changes: 0, lastInsertRowId: 0 };
      }
      this.messages.set(id, { ...existing, content });
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('DELETE FROM MESSAGES')) {
      const [id] = params as [string];
      const removed = this.messages.delete(id);
      return { changes: removed ? 1 : 0, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('INSERT INTO PREFERENCES')) {
      const [id, userId, theme, locale] = params as [string, string, string, string];
      this.preferencesByUser.set(userId, {
        id,
        user_id: userId,
        theme,
        locale,
        updated_at: this.now(),
      });
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('DELETE FROM PREFERENCES')) {
      const [userId] = params as [string];
      const removed = this.preferencesByUser.delete(userId);
      return { changes: removed ? 1 : 0, lastInsertRowId: 0 };
    }

    return { changes: 0, lastInsertRowId: 0 };
  }

  async getFirst<T>(sql: string, params: SqlParams = []): Promise<T | null> {
    const normalized = this.normalize(sql);

    if (normalized === 'PRAGMA USER_VERSION;') {
      return { user_version: this.version } as T;
    }

    if (normalized.startsWith('SELECT * FROM USERS WHERE ID =')) {
      const [id] = params as [string];
      return (this.users.get(id) ?? null) as T | null;
    }

    if (normalized.startsWith('SELECT * FROM CONVERSATIONS WHERE ID =')) {
      const [id] = params as [string];
      return (this.conversations.get(id) ?? null) as T | null;
    }

    if (normalized.startsWith('SELECT * FROM MESSAGES WHERE ID =')) {
      const [id] = params as [string];
      return (this.messages.get(id) ?? null) as T | null;
    }

    if (normalized.startsWith('SELECT * FROM PREFERENCES WHERE USER_ID =')) {
      const [userId] = params as [string];
      return (this.preferencesByUser.get(userId) ?? null) as T | null;
    }

    return null;
  }

  async getAll<T>(sql: string, params: SqlParams = []): Promise<T[]> {
    const normalized = this.normalize(sql);

    if (normalized.startsWith('SELECT * FROM USERS')) {
      return Array.from(this.users.values()) as T[];
    }

    if (normalized.startsWith('SELECT * FROM CONVERSATIONS WHERE USER_ID =')) {
      const [userId] = params as [string];
      return Array.from(this.conversations.values()).filter((item) => item.user_id === userId) as T[];
    }

    if (normalized.startsWith('SELECT * FROM MESSAGES WHERE CONVERSATION_ID =')) {
      const [conversationId] = params as [string];
      return Array.from(this.messages.values()).filter(
        (item) => item.conversation_id === conversationId
      ) as T[];
    }

    if (normalized.startsWith('SELECT * FROM PREFERENCES')) {
      return Array.from(this.preferencesByUser.values()) as T[];
    }

    return [];
  }

  private normalize(sql: string): string {
    return sql.replaceAll(/\s+/g, ' ').trim().toUpperCase();
  }

  private now(): string {
    return new Date().toISOString();
  }
}
