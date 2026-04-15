import { migration001Initial } from './001_initial';
import { migration002AddConversationUpdatedAt } from './002_add_conversation_updated_at';
import type { Migration, QueryExecutor } from '../types';

const MIGRATIONS: Migration[] = [migration001Initial, migration002AddConversationUpdatedAt];

export const LATEST_DB_VERSION = MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 0;

type Logger = Pick<Console, 'info' | 'error'>;

export async function getUserVersion(db: QueryExecutor): Promise<number> {
  const result = await db.getFirst<{ user_version: number }>('PRAGMA user_version;');
  return result?.user_version ?? 0;
}

export async function setUserVersion(db: QueryExecutor, version: number): Promise<void> {
  await db.exec(`PRAGMA user_version = ${version};`);
}

export async function runMigrations(db: QueryExecutor, logger: Logger = console): Promise<void> {
  const currentVersion = await getUserVersion(db);
  const pendingMigrations = MIGRATIONS.filter((migration) => migration.version > currentVersion);

  for (const migration of pendingMigrations) {
    logger.info(`[db] Running migration v${migration.version} (${migration.name})`);
    await db.exec('BEGIN IMMEDIATE;');
    try {
      await migration.up(db);
      await setUserVersion(db, migration.version);
      await db.exec('COMMIT;');
      logger.info(`[db] Migration completed v${migration.version} (${migration.name})`);
    } catch (error) {
      await db.exec('ROLLBACK;');
      logger.error(`[db] Migration failed v${migration.version} (${migration.name})`, error);
      throw error;
    }
  }
}

export { MIGRATIONS };
