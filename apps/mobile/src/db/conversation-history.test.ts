import { describe, expect, it } from 'vitest';

import {
  clearLocalConversationData,
  loadRecentVoiceHubMessages,
  saveVoiceHubExchange,
} from './conversation-history';
import { MemoryQueryExecutor } from './__tests__/helpers/memory-db';
import {
  ConversationsRepository,
  MessagesRepository,
  UsersRepository,
} from './repositories';

function createTestRepositories() {
  const db = new MemoryQueryExecutor();
  return {
    users: new UsersRepository(db),
    conversations: new ConversationsRepository(db),
    messages: new MessagesRepository(db),
  };
}

describe('conversation history', () => {
  it('saves and restores recent Voice Hub exchanges', async () => {
    const repositories = createTestRepositories();

    await saveVoiceHubExchange(
      { userContent: ' Summarize my day ', assistantContent: 'Here is the summary.' },
      repositories
    );

    await saveVoiceHubExchange(
      { userContent: 'What is next?', assistantContent: 'Your next task is planning.' },
      repositories
    );

    await expect(loadRecentVoiceHubMessages(3, repositories)).resolves.toEqual([
      { role: 'assistant', content: 'Here is the summary.' },
      { role: 'user', content: 'What is next?' },
      { role: 'assistant', content: 'Your next task is planning.' },
    ]);
  });

  it('clears local Voice Hub conversation data', async () => {
    const repositories = createTestRepositories();

    await saveVoiceHubExchange(
      { userContent: 'Hello', assistantContent: 'Hi there' },
      repositories
    );
    await clearLocalConversationData(repositories);

    await expect(loadRecentVoiceHubMessages(24, repositories)).resolves.toEqual([]);
  });
});
