import type { Migration } from '../types';

export const migration002AddConversationUpdatedAt: Migration = {
  version: 2,
  name: '002_add_conversation_updated_at',
  async up(db) {
    await db.exec(`
      ALTER TABLE conversations
      ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);
  },
};
