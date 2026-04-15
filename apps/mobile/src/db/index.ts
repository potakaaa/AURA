import { DatabaseInitializationError } from './errors';
import { runMigrations } from './migrations';
import type { QueryExecutor, RunResult, SqlParams } from './types';
import { DbKeyError, getOrCreateDbKey } from '../utils/crypto';

export { DatabaseInitializationError } from './errors';

const DEFAULT_DB_NAME = 'aura.db';

type SQLiteDatabaseLike = {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    ...params: ReadonlyArray<string | number | null>
  ): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T>(sql: string, ...params: ReadonlyArray<string | number | null>): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: ReadonlyArray<string | number | null>): Promise<T[]>;
};

type SQLiteLike = {
  openDatabaseAsync(name: string): Promise<SQLiteDatabaseLike>;
};

type Logger = Pick<Console, 'info' | 'error' | 'warn'>;

let database: QueryExecutor | null = null;

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}

class ExpoSqliteExecutor implements QueryExecutor {
  constructor(private readonly db: SQLiteDatabaseLike) {}

  async exec(sql: string): Promise<void> {
    await this.db.execAsync(sql);
  }

  async run(sql: string, params: SqlParams = []): Promise<RunResult> {
    const result = await this.db.runAsync(sql, ...params);
    return {
      changes: result.changes,
      lastInsertRowId: result.lastInsertRowId,
    };
  }

  async getFirst<T>(sql: string, params: SqlParams = []): Promise<T | null> {
    const row = await this.db.getFirstAsync<T>(sql, ...params);
    return row ?? null;
  }

  async getAll<T>(sql: string, params: SqlParams = []): Promise<T[]> {
    return this.db.getAllAsync<T>(sql, ...params);
  }
}

export type InitDatabaseOptions = {
  dbName?: string;
  logger?: Logger;
  sqliteModule?: SQLiteLike;
  keyProvider?: () => Promise<string>;
  useUnencryptedDb?: boolean;
};

export async function initDatabase(options: InitDatabaseOptions = {}): Promise<QueryExecutor> {
  if (database) {
    return database;
  }

  const logger = options.logger ?? console;
  const sqliteModule = options.sqliteModule ?? (await import('expo-sqlite'));
  const dbName = options.dbName ?? DEFAULT_DB_NAME;
  const useUnencryptedDb = options.useUnencryptedDb ?? false;

  try {
    logger.info(`[db] Opening database ${dbName}`);
    const sqliteDb = await sqliteModule.openDatabaseAsync(dbName);
    const executor = new ExpoSqliteExecutor(sqliteDb);

    if (useUnencryptedDb) {
      logger.warn('[db] SQLCipher disabled in dev-only mode.');
    } else {
      const keyProvider = options.keyProvider ?? getOrCreateDbKey;
      const key = await keyProvider();
      if (!key) {
        throw new DbKeyError('Missing SQLCipher key before database initialization.');
      }
      await executor.exec(`PRAGMA key = '${escapeSqlString(key)}';`);
    }

    await executor.exec('PRAGMA foreign_keys = ON;');
    await executor.getFirst<{ table_count: number }>(
      'SELECT COUNT(*) as table_count FROM sqlite_master;'
    );

    logger.info('[db] Running migration runner');
    await runMigrations(executor, logger);
    logger.info('[db] Database initialized');

    database = executor;
    return executor;
  } catch (error) {
    throw new DatabaseInitializationError(
      'Failed to initialize encrypted database. This can happen after SecureStore reset or DB corruption.',
      { cause: error }
    );
  }
}

export function getDatabase(): QueryExecutor {
  if (!database) {
    throw new DatabaseInitializationError(
      'Database has not been initialized. Call initDatabase() before using repositories.'
    );
  }
  return database;
}

export function resetDatabaseForTests(): void {
  database = null;
}
