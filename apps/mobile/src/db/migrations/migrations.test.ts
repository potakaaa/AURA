import { getUserVersion, runMigrations } from './index';
import type { QueryExecutor, RunResult, SqlParams } from '../types';
import { describe, expect, it } from 'vitest';

class RecordingDb implements QueryExecutor {
  public statements: string[] = [];
  private version: number;
  private readonly failOn: string | null;

  constructor(options?: { initialVersion?: number; failOn?: string }) {
    this.version = options?.initialVersion ?? 0;
    this.failOn = options?.failOn ?? null;
  }

  async exec(sql: string): Promise<void> {
    const normalized = this.normalize(sql);
    this.statements.push(normalized);

    if (this.failOn && normalized.includes(this.failOn)) {
      throw new Error(`forced failure: ${this.failOn}`);
    }

    if (normalized.startsWith('PRAGMA USER_VERSION =')) {
      const next = Number.parseInt(normalized.split('=').pop() ?? '0', 10);
      this.version = next;
    }
  }

  async run(_sql: string, _params?: SqlParams): Promise<RunResult> {
    return { changes: 0, lastInsertRowId: 0 };
  }

  async getFirst<T>(sql: string, _params?: SqlParams): Promise<T | null> {
    if (this.normalize(sql) === 'PRAGMA USER_VERSION;') {
      return { user_version: this.version } as T;
    }
    return null;
  }

  async getAll<T>(_sql: string, _params?: SqlParams): Promise<T[]> {
    return [];
  }

  private normalize(sql: string): string {
    return sql.replaceAll(/\s+/g, ' ').trim().toUpperCase();
  }
}

describe('runMigrations', () => {
  it('applies migrations in order on first startup', async () => {
    const db = new RecordingDb({ initialVersion: 0 });

    await runMigrations(db);

    expect(await getUserVersion(db)).toBe(2);
    const migrationStarts = db.statements.filter((statement) => statement === 'BEGIN IMMEDIATE;');
    expect(migrationStarts.length).toBe(2);
  });

  it('supports backward-compatible v1 to v2 upgrades', async () => {
    const db = new RecordingDb({ initialVersion: 1 });

    await runMigrations(db);

    expect(await getUserVersion(db)).toBe(2);
    const hadAlterConversation = db.statements.some((statement) =>
      statement.includes('ALTER TABLE CONVERSATIONS')
    );
    expect(hadAlterConversation).toBe(true);
  });

  it('rolls back and throws when migration fails', async () => {
    const db = new RecordingDb({ initialVersion: 1, failOn: 'ALTER TABLE CONVERSATIONS' });

    await expect(runMigrations(db)).rejects.toThrow('forced failure');
    const rolledBack = db.statements.includes('ROLLBACK;');
    expect(rolledBack).toBe(true);
  });
});
