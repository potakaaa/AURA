import { dirname } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import type { AuthSession, GoogleUserInfo, User } from './types.js'
import { ApiError } from '../errors.js'

type UpsertSessionInput = Omit<AuthSession, 'createdAt' | 'updatedAt'>
type CreateSessionInput = Omit<AuthSession, 'id' | 'createdAt' | 'updatedAt' | 'previousAccessToken'>
type UpsertUserInput = Pick<GoogleUserInfo, 'sub' | 'email' | 'name' | 'picture'>

type SessionRow = {
  session_id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: number
  created_at: number
  token_type: string
  scope: string | null
  previous_access_token: string | null
  updated_at: number
}

type UserRow = {
  user_id: string
  google_sub: string
  email: string | null
  name: string | null
  picture: string | null
  notifications_enabled: number | null
  created_at: number
  updated_at: number | null
  last_login_at: number
  deleted_at: number | null
}

type LegacySessionSeedRow = {
  google_sub: string
  email: string | null
  name: string | null
  picture: string | null
}

type LegacyLastLoginRow = {
  google_sub: string
  created_at: number
}

export class AuthSessionStore {
  private readonly dbPath: string
  private dbPromise: Promise<DatabaseSync> | null = null

  constructor(dbPath: string) {
    this.dbPath = dbPath
  }

  async findOrCreateUser(input: UpsertUserInput): Promise<User> {
    const db = await this.getDb()
    const now = Date.now()
    const statement = db.prepare(
      `
      SELECT *
      FROM users
      WHERE google_sub = ?
      LIMIT 1
      `
    )
    const existing = statement.get(input.sub) as UserRow | undefined

    if (!existing) {
      const user: User = {
        id: randomUUID(),
        email: input.email ?? null,
        name: input.name ?? null,
        picture: input.picture ?? null,
        notificationsEnabled: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        deletedAt: null
      }
      this.insertUser(
        db,
        {
          userId: user.id,
          googleSub: input.sub,
          email: user.email,
          name: user.name,
          picture: user.picture,
          notificationsEnabled: user.notificationsEnabled,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt
        },
        input.email ?? null
      )
      return user
    }

    if (existing.deleted_at !== null) {
      throw new ApiError(403, 'USER_DELETED', 'User account has been deleted', false)
    }

    const updatedEmail = input.email ?? existing.email
    const updatedName = input.name ?? existing.name
    const updatedPicture = input.picture ?? existing.picture
    const update = db.prepare(
      `
      UPDATE users
      SET
        email = ?,
        name = ?,
        picture = ?,
        updated_at = ?,
        last_login_at = ?
      WHERE google_sub = ?
      `
    )
    this.runWithDuplicateEmailGuard(
      () => update.run(updatedEmail, updatedName, updatedPicture, now, now, input.sub),
      updatedEmail
    )

    const refreshed = db
      .prepare('SELECT * FROM users WHERE google_sub = ? LIMIT 1')
      .get(input.sub) as UserRow | undefined
    if (!refreshed) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Authenticated user was not found', false)
    }

    return this.mapUserRow(refreshed)
  }

  async findUserById(userId: string): Promise<User | null> {
    const db = await this.getDb()
    const statement = db.prepare(
      'SELECT * FROM users WHERE user_id = ? AND deleted_at IS NULL LIMIT 1'
    )
    const row = statement.get(userId) as UserRow | undefined
    return row ? this.mapUserRow(row) : null
  }

  async createSession(input: CreateSessionInput): Promise<AuthSession> {
    return this.upsertSession({
      id: randomUUID(),
      userId: input.userId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresAt: input.expiresAt,
      tokenType: input.tokenType,
      scope: input.scope,
      previousAccessToken: null
    })
  }

  async upsertSession(input: UpsertSessionInput): Promise<AuthSession> {
    const db = await this.getDb()
    const now = Date.now()
    const existing = await this.findSessionById(input.id)
    const createdAt = existing?.createdAt ?? now

    const statement = db.prepare(
      `
      INSERT INTO auth_sessions (
        session_id,
        user_id,
        access_token,
        previous_access_token,
        refresh_token,
        expires_at,
        created_at,
        token_type,
        scope,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        user_id = excluded.user_id,
        access_token = excluded.access_token,
        previous_access_token = excluded.previous_access_token,
        refresh_token = excluded.refresh_token,
        expires_at = excluded.expires_at,
        token_type = excluded.token_type,
        scope = excluded.scope,
        updated_at = excluded.updated_at
      `
    )
    statement.run(
      input.id,
      input.userId,
      input.accessToken,
      input.previousAccessToken,
      input.refreshToken,
      input.expiresAt,
      createdAt,
      input.tokenType,
      input.scope,
      now
    )

    return {
      ...input,
      createdAt,
      updatedAt: now
    }
  }

  async findSessionById(sessionId: string): Promise<AuthSession | null> {
    const db = await this.getDb()
    const statement = db.prepare('SELECT * FROM auth_sessions WHERE session_id = ?')
    const row = statement.get(sessionId) as SessionRow | undefined
    return row ? this.mapSessionRow(row) : null
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<AuthSession | null> {
    const db = await this.getDb()
    const statement = db.prepare('SELECT * FROM auth_sessions WHERE refresh_token = ?')
    const row = statement.get(refreshToken) as SessionRow | undefined
    return row ? this.mapSessionRow(row) : null
  }

  async findSessionByAccessToken(accessToken: string): Promise<AuthSession | null> {
    const db = await this.getDb()
    const statement = db.prepare(
      `
      SELECT *
      FROM auth_sessions
      WHERE access_token = ? OR previous_access_token = ?
      LIMIT 1
      `
    )
    const row = statement.get(accessToken, accessToken) as SessionRow | undefined
    return row ? this.mapSessionRow(row) : null
  }

  async deleteSessionById(sessionId: string): Promise<void> {
    const db = await this.getDb()
    const statement = db.prepare('DELETE FROM auth_sessions WHERE session_id = ?')
    statement.run(sessionId)
  }

  async deleteSessionByAccessToken(accessToken: string): Promise<void> {
    const db = await this.getDb()
    const statement = db.prepare(
      `
      DELETE FROM auth_sessions
      WHERE access_token = ? OR previous_access_token = ?
      `
    )
    statement.run(accessToken, accessToken)
  }

  async updateUserProfile(input: {
    userId: string
    name: string
    notificationsEnabled: boolean
  }): Promise<User> {
    const db = await this.getDb()
    const now = Date.now()
    const update = db.prepare(
      `
      UPDATE users
      SET
        name = ?,
        notifications_enabled = ?,
        updated_at = ?
      WHERE user_id = ? AND deleted_at IS NULL
      `
    )
    update.run(input.name, input.notificationsEnabled ? 1 : 0, now, input.userId)
    const user = await this.findUserById(input.userId)
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Authenticated user was not found', false)
    }

    return user
  }

  async softDeleteUserAndSessions(userId: string): Promise<void> {
    const db = await this.getDb()
    const now = Date.now()
    const update = db.prepare(
      `
      UPDATE users
      SET
        deleted_at = COALESCE(deleted_at, ?),
        updated_at = ?
      WHERE user_id = ?
      `
    )
    update.run(now, now, userId)

    const deleteSessions = db.prepare('DELETE FROM auth_sessions WHERE user_id = ?')
    deleteSessions.run(userId)
  }

  async purgeExpiredSessions(now = Date.now()): Promise<number> {
    const db = await this.getDb()
    const statement = db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?')
    const result = statement.run(now) as { changes?: number } | undefined
    return Number(result?.changes ?? 0)
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
    db.exec('PRAGMA foreign_keys = ON;')

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        google_sub TEXT NOT NULL UNIQUE,
        email TEXT,
        name TEXT,
        picture TEXT,
        notifications_enabled INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_login_at INTEGER NOT NULL,
        deleted_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS auth_sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT,
        access_token TEXT NOT NULL,
        previous_access_token TEXT,
        refresh_token TEXT NOT NULL UNIQUE,
        expires_at INTEGER,
        created_at INTEGER,
        token_type TEXT,
        scope TEXT,
        updated_at INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_users_google_sub
      ON users(google_sub);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_access_token
      ON auth_sessions(access_token);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
      ON auth_sessions(user_id);
    `)

    this.ensureUserColumns(db)
    this.ensureAuthSessionColumns(db)
    this.migrateLegacySessions(db)
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
      ON users(email)
      WHERE email IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_deleted_at
      ON users(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at
      ON auth_sessions(expires_at);
    `)

    return db
  }

  private ensureUserColumns(db: DatabaseSync): void {
    const columns = this.getTableColumns(db, 'users')
    if (!columns.has('notifications_enabled')) {
      db.exec('ALTER TABLE users ADD COLUMN notifications_enabled INTEGER NOT NULL DEFAULT 1;')
    }
    if (!columns.has('updated_at')) {
      db.exec('ALTER TABLE users ADD COLUMN updated_at INTEGER;')
      db.exec('UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;')
    }
    if (!columns.has('deleted_at')) {
      db.exec('ALTER TABLE users ADD COLUMN deleted_at INTEGER;')
    }
  }

  private ensureAuthSessionColumns(db: DatabaseSync): void {
    const columns = this.getTableColumns(db, 'auth_sessions')
    if (!columns.has('user_id')) {
      db.exec('ALTER TABLE auth_sessions ADD COLUMN user_id TEXT;')
    }
    if (!columns.has('expires_at')) {
      db.exec('ALTER TABLE auth_sessions ADD COLUMN expires_at INTEGER;')
    }
    if (!columns.has('created_at')) {
      db.exec('ALTER TABLE auth_sessions ADD COLUMN created_at INTEGER;')
    }
    if (!columns.has('token_type')) {
      db.exec("ALTER TABLE auth_sessions ADD COLUMN token_type TEXT DEFAULT 'Bearer';")
    }
    if (!columns.has('scope')) {
      db.exec('ALTER TABLE auth_sessions ADD COLUMN scope TEXT;')
    }
    if (!columns.has('updated_at')) {
      db.exec('ALTER TABLE auth_sessions ADD COLUMN updated_at INTEGER;')
    }
    if (!columns.has('previous_access_token')) {
      db.exec('ALTER TABLE auth_sessions ADD COLUMN previous_access_token TEXT;')
    }
  }

  private migrateLegacySessions(db: DatabaseSync): void {
    const columns = this.getTableColumns(db, 'auth_sessions')
    if (!columns.has('google_sub')) {
      return
    }

    const seedUsers = db.prepare(
      `
      SELECT DISTINCT google_sub, email, name, picture
      FROM auth_sessions
      WHERE google_sub IS NOT NULL
      `
    )
    const legacyUsers = seedUsers.all() as LegacySessionSeedRow[]
    for (const user of legacyUsers) {
      const existing = db
        .prepare('SELECT user_id FROM users WHERE google_sub = ? LIMIT 1')
        .get(user.google_sub) as { user_id: string } | undefined
      if (!existing) {
        const createdAt = Date.now()
        this.insertUser(
          db,
          {
            userId: randomUUID(),
            googleSub: user.google_sub,
            email: user.email,
            name: user.name,
            picture: user.picture,
            notificationsEnabled: true,
            createdAt,
            updatedAt: createdAt,
            lastLoginAt: createdAt
          },
          user.email
        )
      }
    }

    if (columns.has('access_token_expires_at')) {
      db.exec(
        `
        UPDATE auth_sessions
        SET expires_at = access_token_expires_at
        WHERE expires_at IS NULL
        `
      )
    }

    db.exec(
      `
      UPDATE auth_sessions
      SET user_id = (
        SELECT user_id
        FROM users
        WHERE users.google_sub = auth_sessions.google_sub
      )
      WHERE user_id IS NULL AND google_sub IS NOT NULL
      `
    )

    const now = Date.now()
    db.prepare(
      `
      UPDATE auth_sessions
      SET created_at = ?
      WHERE created_at IS NULL
      `
    ).run(now)
    db.prepare(
      `
      UPDATE auth_sessions
      SET updated_at = ?
      WHERE updated_at IS NULL
      `
    ).run(now)
    db.prepare(
      `
      UPDATE auth_sessions
      SET expires_at = ?
      WHERE expires_at IS NULL
      `
    ).run(now + 3600_000)
    db.prepare(
      `
      UPDATE auth_sessions
      SET token_type = 'Bearer'
      WHERE token_type IS NULL
      `
    ).run()

    const syncLastLoginRows = db
      .prepare(
        `
        SELECT google_sub, MAX(created_at) AS created_at
        FROM auth_sessions
        WHERE google_sub IS NOT NULL
        GROUP BY google_sub
        `
      )
      .all() as LegacyLastLoginRow[]
    const syncLastLogin = db.prepare(
      `
      UPDATE users
      SET last_login_at = CASE
        WHEN last_login_at < ? THEN ?
        ELSE last_login_at
      END
      WHERE google_sub = ?
      `
    )
    for (const row of syncLastLoginRows) {
      syncLastLogin.run(row.created_at, row.created_at, row.google_sub)
    }
  }

  private getTableColumns(db: DatabaseSync, tableName: string): Set<string> {
    const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
    return new Set(rows.map((row) => row.name))
  }

  private insertUser(
    db: DatabaseSync,
    user: {
      userId: string
      googleSub: string
      email: string | null
      name: string | null
      picture: string | null
      notificationsEnabled: boolean
      createdAt: number
      updatedAt: number
      lastLoginAt: number
    },
    duplicateEmailValue: string | null
  ): void {
    const statement = db.prepare(
      `
      INSERT INTO users (
        user_id,
        google_sub,
        email,
        name,
        picture,
        notifications_enabled,
        created_at,
        updated_at,
        last_login_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    this.runWithDuplicateEmailGuard(
      () =>
        statement.run(
          user.userId,
          user.googleSub,
          user.email,
          user.name,
          user.picture,
          user.notificationsEnabled ? 1 : 0,
          user.createdAt,
          user.updatedAt,
          user.lastLoginAt
        ),
      duplicateEmailValue
    )
  }

  private mapSessionRow(row: SessionRow): AuthSession {
    return {
      id: row.session_id,
      userId: row.user_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      tokenType: row.token_type,
      scope: row.scope,
      previousAccessToken: row.previous_access_token,
      updatedAt: row.updated_at
    }
  }

  private mapUserRow(row: UserRow): User {
    return {
      id: row.user_id,
      email: row.email,
      name: row.name,
      picture: row.picture,
      notificationsEnabled: row.notifications_enabled !== 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? row.created_at,
      lastLoginAt: row.last_login_at,
      deletedAt: row.deleted_at
    }
  }

  private runWithDuplicateEmailGuard(
    operation: () => void,
    duplicateEmailValue: string | null
  ): void {
    try {
      operation()
    } catch (error) {
      if (this.isEmailConstraintError(error) && duplicateEmailValue) {
        throw new ApiError(409, 'DUPLICATE_EMAIL', 'Email is already in use', false)
      }
      throw error
    }
  }

  private isEmailConstraintError(error: unknown): boolean {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : ''
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : ''
    return (
      message.includes('UNIQUE constraint failed: users.email')
      || message.includes('idx_users_email_unique')
      || code === 'SQLITE_CONSTRAINT_UNIQUE'
    )
  }
}
