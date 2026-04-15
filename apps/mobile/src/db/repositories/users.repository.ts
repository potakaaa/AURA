import { getDatabase } from '..';
import type { QueryExecutor } from '../types';

export type UserRecord = {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
};

export type CreateUserInput = {
  id: string;
  name: string;
  email?: string | null;
};

export type UpdateUserInput = {
  name?: string;
  email?: string | null;
};

export class UsersRepository {
  constructor(private readonly db: QueryExecutor = getDatabase()) {}

  async create(input: CreateUserInput): Promise<void> {
    await this.db.run('INSERT INTO users (id, name, email) VALUES (?, ?, ?);', [
      input.id,
      input.name,
      input.email ?? null,
    ]);
  }

  async getById(id: string): Promise<UserRecord | null> {
    return this.db.getFirst<UserRecord>('SELECT * FROM users WHERE id = ?;', [id]);
  }

  async list(): Promise<UserRecord[]> {
    return this.db.getAll<UserRecord>('SELECT * FROM users ORDER BY created_at DESC;');
  }

  async update(id: string, input: UpdateUserInput): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      return false;
    }

    await this.db.run('UPDATE users SET name = ?, email = ? WHERE id = ?;', [
      input.name ?? existing.name,
      input.email ?? existing.email,
      id,
    ]);
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM users WHERE id = ?;', [id]);
    return result.changes > 0;
  }
}
