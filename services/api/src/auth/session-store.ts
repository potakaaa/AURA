import { dirname } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import type { AuthSession } from './types.js'

type UpsertSessionInput = Omit<AuthSession, 'createdAt' | 'updatedAt'>

type SessionRow = {
  session_id: string
  google_sub: string
  email: string | null
  name: string | null
  picture: string | null
  access_token: string
  previous_access_token: string | null
  refresh_token: string
  scope: string | null
  token_type: string
  access_token_expires_at: number
  created_at: number
  updated_at: number
}

export class AuthSessionStore {
  private readonly dbPath: string
  private dbPromise: Promise<DatabaseSync> | null = null

  constructor(dbPath: string) {
    this.dbPath = dbPath
  }

  async upsertSession(input: UpsertSessionInput): Promise<AuthSession> {
    const db = await this.getDb()
    const now = Date.now()
    const existing = await this.findBySessionId(input.sessionId)
    const createdAt = existing?.createdAt ?? now

    const statement = db.prepare(`
      INSERT INTO auth_sessions (
        session_id,
        google_sub,
        email,
        name,
        picture,
        access_token,
        previous_access_token,
        refresh_token,
        scope,
        token_type,
        access_token_expires_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        google_sub = excluded.google_sub,
        email = excluded.email,
        name = excluded.name,
        picture = excluded.picture,
        access_token = excluded.access_token,
        previous_access_token = excluded.previous_access_token,
        refresh_token = excluded.refresh_token,
        scope = excluded.scope,
        token_type = excluded.token_type,
        access_token_expires_at = excluded.access_token_expires_at,
        updated_at = excluded.updated_at
    `)
    statement.run(
      input.sessionId,
      input.googleSub,
      input.email,
      input.name,
      input.picture,
      input.accessToken,
      input.previousAccessToken,
      input.refreshToken,
      input.scope,
      input.tokenType,
      input.accessTokenExpiresAt,
      createdAt,
      now
    )

    return {
      ...input,
      createdAt,
      updatedAt: now
    }
  }

  async findBySessionId(sessionId: string): Promise<AuthSession | null> {
    const db = await this.getDb()
    const statement = db.prepare('SELECT * FROM auth_sessions WHERE session_id = ?')
    const row = statement.get(sessionId) as SessionRow | undefined
    return row ? this.mapRow(row) : null
  }

  async findByRefreshToken(refreshToken: string): Promise<AuthSession | null> {
    const db = await this.getDb()
    const statement = db.prepare('SELECT * FROM auth_sessions WHERE refresh_token = ?')
    const row = statement.get(refreshToken) as SessionRow | undefined
    return row ? this.mapRow(row) : null
  }

  async findByAccessToken(accessToken: string): Promise<AuthSession | null> {
    const db = await this.getDb()
    const statement = db.prepare(
      `
      SELECT * FROM auth_sessions
      WHERE access_token = ? OR previous_access_token = ?
      LIMIT 1
      `
    )
    const row = statement.get(accessToken, accessToken) as SessionRow | undefined
    return row ? this.mapRow(row) : null
  }

  private async getDb(): Promise<DatabaseSync> {
    if (!this.dbPromise) {
      this.dbPromise = this.initialize()
    }

    return this.dbPromise
  }

  private async initialize(): Promise<DatabaseSync> {
    await mkdir(dirname(this.dbPath), { recursive: true })
    const db = new DatabaseSync(this.dbPath)

    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        session_id TEXT PRIMARY KEY,
        google_sub TEXT NOT NULL,
        email TEXT,
        name TEXT,
        picture TEXT,
        access_token TEXT NOT NULL,
        previous_access_token TEXT,
        refresh_token TEXT NOT NULL UNIQUE,
        scope TEXT,
        token_type TEXT NOT NULL,
        access_token_expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_access_token
      ON auth_sessions(access_token);
    `)

    return db
  }

  private mapRow(row: SessionRow): AuthSession {
    return {
      sessionId: row.session_id,
      googleSub: row.google_sub,
      email: row.email,
      name: row.name,
      picture: row.picture,
      accessToken: row.access_token,
      previousAccessToken: row.previous_access_token,
      refreshToken: row.refresh_token,
      scope: row.scope,
      tokenType: row.token_type,
      accessTokenExpiresAt: row.access_token_expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}
