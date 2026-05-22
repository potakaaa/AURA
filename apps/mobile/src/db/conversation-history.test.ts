import { describe, expect, it } from 'vitest';

import {
  clearLocalConversationData,
  deleteLocalConversation,
  listLocalConversationSummaries,
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

  it('lists local conversation summaries from stored messages', async () => {
    const repositories = createTestRepositories();

    await saveVoiceHubExchange(
      { userContent: 'Summarize my morning standup', assistantContent: 'You have three actions.' },
      repositories
    );

    await expect(listLocalConversationSummaries(repositories)).resolves.toMatchObject([
      {
        title: 'Summarize my morning standup',
        preview: 'You have three actions.',
        messageCount: 2,
      },
    ]);
  });

  it('deletes a single local conversation', async () => {
    const repositories = createTestRepositories();

    await saveVoiceHubExchange(
      { userContent: 'Hello', assistantContent: 'Hi there' },
      repositories
    );

    const [conversation] = await listLocalConversationSummaries(repositories);
    await deleteLocalConversation(conversation.id, repositories);

    await expect(listLocalConversationSummaries(repositories)).resolves.toEqual([]);
  });
});
