import type { QueryExecutor, RunResult, SqlParams } from './types';
import { DatabaseInitializationError } from './errors';

export { DatabaseInitializationError } from './errors';

type Logger = Pick<Console, 'info' | 'error' | 'warn'>;

let database: QueryExecutor | null = null;

/**
 * Web/static export does not bundle native SQLCipher or expo-sqlite WASM.
 * This stub keeps the app shell working; use iOS/Android dev builds for real local DB.
 */
class WebStubExecutor implements QueryExecutor {
  async exec(): Promise<void> {
    return undefined;
  }

  async run(_sql: string, _params?: SqlParams): Promise<RunResult> {
    return { changes: 0, lastInsertRowId: 0 };
  }

  async getFirst<T>(_sql: string, _params?: SqlParams): Promise<T | null> {
    return null;
  }

  async getAll<T>(_sql: string, _params?: SqlParams): Promise<T[]> {
    return [];
  }
}

export type InitDatabaseOptions = {
  dbName?: string;
  logger?: Logger;
  useUnencryptedDb?: boolean;
};

export async function initDatabase(options: InitDatabaseOptions = {}): Promise<QueryExecutor> {
  if (database) {
    return database;
  }

  const logger = options.logger ?? console;
  logger.warn(
    '[db] Web build: encrypted SQLite is not available. Using an in-memory no-op database layer.'
  );

  database = new WebStubExecutor();
  return database;
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
