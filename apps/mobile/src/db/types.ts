export type SqlParams = ReadonlyArray<string | number | null>;

export type RunResult = {
  changes: number;
  lastInsertRowId: number;
};

export interface QueryExecutor {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlParams): Promise<RunResult>;
  getFirst<T>(sql: string, params?: SqlParams): Promise<T | null>;
  getAll<T>(sql: string, params?: SqlParams): Promise<T[]>;
}

export type Migration = {
  version: number;
  name: string;
  up: (db: QueryExecutor) => Promise<void>;
};
