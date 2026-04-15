import {
  DatabaseInitializationError,
  initDatabase,
  resetDatabaseForTests,
} from './index';
import { beforeEach, describe, expect, it } from 'vitest';

type StubDatabaseOptions = {
  failOnExec?: string;
  failOnFirstQuery?: boolean;
};

class StubDatabase {
  constructor(private readonly options: StubDatabaseOptions = {}) {}

  async execAsync(sql: string): Promise<void> {
    if (this.options.failOnExec && sql.includes(this.options.failOnExec)) {
      throw new Error(`exec failed for ${this.options.failOnExec}`);
    }
  }

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    if (this.options.failOnFirstQuery && sql.includes('sqlite_master')) {
      throw new Error('file is encrypted or is not a database');
    }
    if (sql.includes('PRAGMA user_version')) {
      return { user_version: 0 } as T;
    }
    if (sql.includes('sqlite_master')) {
      return { table_count: 0 } as T;
    }
    return null;
  }

  async getAllAsync<T>(): Promise<T[]> {
    return [];
  }

  async runAsync(): Promise<{ changes: number; lastInsertRowId: number }> {
    return { changes: 0, lastInsertRowId: 0 };
  }
}

describe('initDatabase', () => {
  beforeEach(() => {
    resetDatabaseForTests();
  });

  it('fails fast when key provider returns missing key', async () => {
    await expect(
      initDatabase({
        keyProvider: async () => '',
        sqliteModule: {
          openDatabaseAsync: async () => new StubDatabase() as never,
        },
      })
    ).rejects.toBeInstanceOf(DatabaseInitializationError);
  });

  it('throws clear error for corrupted database state', async () => {
    await expect(
      initDatabase({
        keyProvider: async () => 'abc123',
        sqliteModule: {
          openDatabaseAsync: async () => new StubDatabase({ failOnFirstQuery: true }) as never,
        },
      })
    ).rejects.toBeInstanceOf(DatabaseInitializationError);
  });

  it('throws when migration execution fails', async () => {
    await expect(
      initDatabase({
        keyProvider: async () => 'abc123',
        sqliteModule: {
          openDatabaseAsync: async () =>
            (new StubDatabase({ failOnExec: 'CREATE TABLE IF NOT EXISTS users' }) as never),
        },
      })
    ).rejects.toBeInstanceOf(DatabaseInitializationError);
  });
});
