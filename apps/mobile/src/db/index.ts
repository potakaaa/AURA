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
let initializationPromise: Promise<QueryExecutor> | null = null;

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
    console.info('[agent][H3] Returning cached database instance');
    return database;
  }
  if (initializationPromise) {
    console.info('[agent][H1] Waiting for in-flight database initialization');
    return initializationPromise;
  }

  const logger = options.logger ?? console;
  const sqliteModule = options.sqliteModule ?? (await import('expo-sqlite'));
  const dbName = options.dbName ?? DEFAULT_DB_NAME;
  const useUnencryptedDb = options.useUnencryptedDb ?? false;

  initializationPromise = (async () => {
    try {
      logger.info(`[db] Opening database ${dbName}`);
      // #region agent log
      fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H1',location:'src/db/index.ts:77',message:'initDatabase start',data:{dbName,useUnencryptedDb},timestamp:Date.now()})}).catch(() => {});
      // #endregion
      const sqliteDb = await sqliteModule.openDatabaseAsync(dbName);
      logger.info('[agent][H1] openDatabaseAsync resolved');
      const executor = new ExpoSqliteExecutor(sqliteDb);

      if (useUnencryptedDb) {
        logger.warn('[db] SQLCipher disabled in dev-only mode.');
      } else {
        const keyProvider = options.keyProvider ?? getOrCreateDbKey;
        // #region agent log
        fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H1_H2',location:'src/db/index.ts:86',message:'About to read SQLCipher key',data:{provider:'secure-store'},timestamp:Date.now()})}).catch(() => {});
        // #endregion
        const key = await keyProvider();
        logger.info('[agent][H1] keyProvider resolved');
        // #region agent log
        fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H1_H2',location:'src/db/index.ts:89',message:'SQLCipher key resolved',data:{hasKey:Boolean(key)},timestamp:Date.now()})}).catch(() => {});
        // #endregion
        if (!key) {
          throw new DbKeyError('Missing SQLCipher key before database initialization.');
        }
        // #region agent log
        fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H2',location:'src/db/index.ts:93',message:'Applying SQLCipher key pragma',data:{keyLength:key.length},timestamp:Date.now()})}).catch(() => {});
        // #endregion
        await executor.exec(`PRAGMA key = '${escapeSqlString(key)}';`);
        logger.info('[agent][H2] PRAGMA key applied');
        // #region agent log
        fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e67de'},body:JSON.stringify({sessionId:'3e67de',runId:'android-white-screen',hypothesisId:'H2',location:'src/db/index.ts:95',message:'SQLCipher key pragma applied',data:{ok:true},timestamp:Date.now()})}).catch(() => {});
        // #endregion
      }

      await executor.exec('PRAGMA foreign_keys = ON;');
      logger.info('[agent][H2] PRAGMA foreign_keys applied');
      await executor.getFirst<{ table_count: number }>(
        'SELECT COUNT(*) as table_count FROM sqlite_master;'
      );
      logger.info('[agent][H2] sqlite_master probe succeeded');

      logger.info('[db] Running migration runner');
      await runMigrations(executor, logger);
      logger.info('[db] Database initialized');

      database = executor;
      return executor;
    } catch (error) {
      (options.logger ?? console).error('[agent][H1] initDatabase failed', error);
      throw new DatabaseInitializationError(
        'Failed to initialize encrypted database. This can happen after SecureStore reset or DB corruption.',
        { cause: error }
      );
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
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
  initializationPromise = null;
}
