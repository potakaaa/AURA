import type { Migration } from '../types';

export const migration003AddPreferenceMemories: Migration = {
  version: 3,
  name: '003_add_preference_memories',
  async up(db) {
    await db.exec(`
      ALTER TABLE preferences
      ADD COLUMN inferred_memory_enabled INTEGER NOT NULL DEFAULT 0;
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS preference_memories (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        source TEXT NOT NULL CHECK(source IN ('explicit', 'inferred')),
        confidence REAL NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, key, source)
      );
    `);
  },
};
