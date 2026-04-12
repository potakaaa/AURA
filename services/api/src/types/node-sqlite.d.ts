declare module 'node:sqlite' {
  class StatementSync {
    run(...params: unknown[]): unknown
    get(...params: unknown[]): unknown
  }

  export class DatabaseSync {
    constructor(path: string)
    exec(sql: string): void
    prepare(sql: string): StatementSync
  }
}
