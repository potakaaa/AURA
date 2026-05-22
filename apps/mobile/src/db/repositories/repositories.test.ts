import {
  ConversationsRepository,
  MessagesRepository,
  PreferenceMemoriesRepository,
  PreferencesRepository,
  UsersRepository,
} from './index';
import { MemoryQueryExecutor } from '../__tests__/helpers/memory-db';
import { describe, expect, it } from 'vitest';

describe('repositories', () => {
  it('supports user CRUD operations', async () => {
    const db = new MemoryQueryExecutor();
    const users = new UsersRepository(db);

    await users.create({ id: 'u1', name: 'AURA User', email: 'user@aura.app' });
    expect(await users.getById('u1')).toMatchObject({ id: 'u1', name: 'AURA User' });

    await users.update('u1', { name: 'Renamed User' });
    expect(await users.getById('u1')).toMatchObject({ name: 'Renamed User' });

    expect(await users.delete('u1')).toBe(true);
    expect(await users.getById('u1')).toBeNull();
  });

  it('supports conversations CRUD operations', async () => {
    const db = new MemoryQueryExecutor();
    const conversations = new ConversationsRepository(db);

    await conversations.create({ id: 'c1', userId: 'u1', title: 'Daily planning' });
    expect(await conversations.getById('c1')).toMatchObject({ title: 'Daily planning' });

    await conversations.update('c1', { title: 'Daily recap' });
    expect(await conversations.getById('c1')).toMatchObject({ title: 'Daily recap' });

    expect((await conversations.listByUser('u1')).length).toBe(1);
    expect(await conversations.delete('c1')).toBe(true);
  });

  it('supports messages CRUD operations', async () => {
    const db = new MemoryQueryExecutor();
    const messages = new MessagesRepository(db);

    await messages.create({
      id: 'm1',
      conversationId: 'c1',
      role: 'user',
      content: 'Hello world',
    });
    expect(await messages.getById('m1')).toMatchObject({ content: 'Hello world' });

    await messages.update('m1', { content: 'Updated content' });
    expect(await messages.getById('m1')).toMatchObject({ content: 'Updated content' });

    expect((await messages.listByConversation('c1')).length).toBe(1);
    expect(await messages.delete('m1')).toBe(true);
  });

  it('supports preferences upsert/read/delete operations', async () => {
    const db = new MemoryQueryExecutor();
    const preferences = new PreferencesRepository(db);

    await preferences.upsert({ id: 'p1', userId: 'u1', theme: 'dark', locale: 'en-US' });
    expect(await preferences.getByUserId('u1')).toMatchObject({
      theme: 'dark',
      locale: 'en-US',
      inferred_memory_enabled: 0,
    });

    await preferences.upsert({
      id: 'p2',
      userId: 'u1',
      theme: 'light',
      locale: 'en-PH',
      inferredMemoryEnabled: true,
    });
    expect(await preferences.getByUserId('u1')).toMatchObject({
      theme: 'light',
      locale: 'en-PH',
      inferred_memory_enabled: 1,
    });

    await preferences.setInferredMemoryEnabled('u1', false);
    expect(await preferences.getByUserId('u1')).toMatchObject({
      inferred_memory_enabled: 0,
    });

    expect(await preferences.deleteByUserId('u1')).toBe(true);
    expect(await preferences.getByUserId('u1')).toBeNull();
  });

  it('supports preference memory create/update/list/delete operations', async () => {
    const db = new MemoryQueryExecutor();
    const memories = new PreferenceMemoriesRepository(db);

    await memories.upsert({
      id: 'pm1',
      userId: 'u1',
      key: 'timezone',
      value: 'Asia/Manila',
      source: 'explicit',
      confidence: 1,
    });
    expect(await memories.listByUser('u1')).toMatchObject([
      { id: 'pm1', key: 'timezone', value: 'Asia/Manila', source: 'explicit', confidence: 1 },
    ]);

    await memories.upsert({
      id: 'pm2',
      userId: 'u1',
      key: 'timezone',
      value: 'UTC',
      source: 'explicit',
      confidence: 0.9,
    });
    expect(await memories.listByUser('u1')).toMatchObject([
      { id: 'pm1', key: 'timezone', value: 'UTC', source: 'explicit', confidence: 0.9 },
    ]);

    expect(await memories.delete('pm1')).toBe(true);
    expect(await memories.listByUser('u1')).toEqual([]);
  });
});
