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
  inferred_memory_enabled: number;
  updated_at: string;
};
type PreferenceMemoryRow = {
  id: string;
  user_id: string;
  key: string;
  value: string;
  source: 'explicit' | 'inferred';
  confidence: number;
  updated_at: string;
};

export class MemoryQueryExecutor implements QueryExecutor {
  private readonly users = new Map<string, UserRow>();
  private readonly conversations = new Map<string, ConversationRow>();
  private readonly messages = new Map<string, MessageRow>();
  private readonly preferencesByUser = new Map<string, PreferenceRow>();
  private readonly preferenceMemories = new Map<string, PreferenceMemoryRow>();
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
      const existing = this.conversations.get(id);
      this.conversations.set(id, {
        id,
        user_id: userId,
        title,
        created_at: existing?.created_at ?? this.now(),
        updated_at: this.now(),
      });
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

    if (normalized.startsWith('UPDATE CONVERSATIONS SET UPDATED_AT')) {
      const [id] = params as [string];
      const existing = this.conversations.get(id);
      if (!existing) {
        return { changes: 0, lastInsertRowId: 0 };
      }
      this.conversations.set(id, { ...existing, updated_at: this.now() });
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('DELETE FROM CONVERSATIONS')) {
      if (params.length === 0) {
        const changes = this.conversations.size;
        this.conversations.clear();
        this.messages.clear();
        return { changes, lastInsertRowId: 0 };
      }
      const [id] = params as [string];
      const removed = this.conversations.delete(id);
      for (const [messageId, message] of this.messages.entries()) {
        if (message.conversation_id === id) {
          this.messages.delete(messageId);
        }
      }
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
      if (params.length === 0) {
        const changes = this.messages.size;
        this.messages.clear();
        return { changes, lastInsertRowId: 0 };
      }
      const [id] = params as [string];
      if (normalized.includes('WHERE CONVERSATION_ID =')) {
        let changes = 0;
        for (const [messageId, message] of this.messages.entries()) {
          if (message.conversation_id === id) {
            this.messages.delete(messageId);
            changes += 1;
          }
        }
        return { changes, lastInsertRowId: 0 };
      }
      const removed = this.messages.delete(id);
      return { changes: removed ? 1 : 0, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('INSERT INTO PREFERENCES')) {
      const [id, userId, theme, locale, inferredMemoryEnabled] = params as [
        string,
        string,
        string,
        string,
        number,
      ];
      this.preferencesByUser.set(userId, {
        id,
        user_id: userId,
        theme,
        locale,
        inferred_memory_enabled: inferredMemoryEnabled,
        updated_at: this.now(),
      });
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('UPDATE PREFERENCES SET INFERRED_MEMORY_ENABLED')) {
      const [enabled, userId] = params as [number, string];
      const existing = this.preferencesByUser.get(userId);
      if (!existing) {
        return { changes: 0, lastInsertRowId: 0 };
      }
      this.preferencesByUser.set(userId, {
        ...existing,
        inferred_memory_enabled: enabled,
        updated_at: this.now(),
      });
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('DELETE FROM PREFERENCES')) {
      const [userId] = params as [string];
      const removed = this.preferencesByUser.delete(userId);
      return { changes: removed ? 1 : 0, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('INSERT INTO PREFERENCE_MEMORIES')) {
      const [id, userId, key, value, source, confidence] = params as [
        string,
        string,
        string,
        string,
        PreferenceMemoryRow['source'],
        number,
      ];
      const existing = Array.from(this.preferenceMemories.values()).find(
        (memory) => memory.user_id === userId && memory.key === key && memory.source === source
      );
      const memoryId = existing?.id ?? id;
      this.preferenceMemories.set(memoryId, {
        id: memoryId,
        user_id: userId,
        key,
        value,
        source,
        confidence,
        updated_at: this.now(),
      });
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('DELETE FROM PREFERENCE_MEMORIES')) {
      const [id] = params as [string];
      if (normalized.includes('WHERE USER_ID =')) {
        let changes = 0;
        for (const [memoryId, memory] of this.preferenceMemories.entries()) {
          if (memory.user_id === id) {
            this.preferenceMemories.delete(memoryId);
            changes += 1;
          }
        }
        return { changes, lastInsertRowId: 0 };
      }
      const removed = this.preferenceMemories.delete(id);
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

    if (normalized.startsWith('SELECT * FROM ( SELECT * FROM MESSAGES WHERE CONVERSATION_ID =')) {
      const [conversationId, limit] = params as [string, number];
      return Array.from(this.messages.values())
        .filter((item) => item.conversation_id === conversationId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .slice(-limit) as T[];
    }

    if (normalized.startsWith('SELECT * FROM PREFERENCES')) {
      return Array.from(this.preferencesByUser.values()) as T[];
    }

    if (normalized.startsWith('SELECT * FROM PREFERENCE_MEMORIES WHERE USER_ID =')) {
      const [userId] = params as [string];
      return Array.from(this.preferenceMemories.values())
        .filter((memory) => memory.user_id === userId)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)) as T[];
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
