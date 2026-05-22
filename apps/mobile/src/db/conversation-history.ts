import {
  ConversationsRepository,
  MessagesRepository,
  UsersRepository,
  type MessageRole,
} from './repositories';

export type LocalConversationMessage = {
  role: Exclude<MessageRole, 'system'>;
  content: string;
};

export type LocalConversationSummary = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messageCount: number;
};

const LOCAL_USER_ID = 'local-voice-hub-user';
export const VOICE_HUB_CONVERSATION_ID = 'voice-hub-mvp';
const VOICE_HUB_CONVERSATION_TITLE = 'Voice Hub';
const RECENT_MESSAGE_LIMIT = 24;

type ConversationHistoryRepositories = {
  users: UsersRepository;
  conversations: ConversationsRepository;
  messages: MessagesRepository;
};

export async function loadRecentVoiceHubMessages(
  limit = RECENT_MESSAGE_LIMIT,
  repositories = createRepositories()
): Promise<LocalConversationMessage[]> {
  return loadConversationMessages(VOICE_HUB_CONVERSATION_ID, limit, repositories);
}

export async function loadConversationMessages(
  conversationId: string,
  limit = RECENT_MESSAGE_LIMIT,
  repositories = createRepositories()
): Promise<LocalConversationMessage[]> {
  await ensureConversation(repositories, conversationId);

  const messages = await repositories.messages.listRecentByConversation(conversationId, limit);

  return messages
    .filter(
      (message): message is typeof message & { role: LocalConversationMessage['role'] } =>
        message.role !== 'system'
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export async function saveVoiceHubExchange(input: {
  userContent: string;
  assistantContent: string;
  conversationId?: string;
}, repositories = createRepositories()): Promise<void> {
  const userContent = input.userContent.trim();
  const assistantContent = input.assistantContent.trim();
  const conversationId = input.conversationId ?? VOICE_HUB_CONVERSATION_ID;

  if (!userContent || !assistantContent) {
    return;
  }

  await ensureConversation(repositories, conversationId);

  const messages = repositories.messages;
  await messages.create({
    id: createLocalId(),
    conversationId,
    role: 'user',
    content: userContent,
  });
  await messages.create({
    id: createLocalId(),
    conversationId,
    role: 'assistant',
    content: assistantContent,
  });
  await repositories.conversations.touch(conversationId);
}

function createLocalId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random()}`;
}

export async function clearLocalConversationData(
  repositories = createRepositories()
): Promise<void> {
  await repositories.messages.deleteAll();
  await repositories.conversations.deleteAll();
}

export async function listLocalConversationSummaries(
  repositories = createRepositories()
): Promise<LocalConversationSummary[]> {
  await ensureLocalUser(repositories);

  const conversations = await repositories.conversations.listByUser(LOCAL_USER_ID);
  const summaries = await Promise.all(
    conversations.map(async (conversation) => {
      const messages = await repositories.messages.listByConversation(conversation.id);
      const visibleMessages = messages.filter((message) => message.role !== 'system');
      const firstUserMessage = visibleMessages.find((message) => message.role === 'user');
      const lastMessage = visibleMessages.at(-1);
      const preview = lastMessage?.content.trim() ?? '';
      const title = firstUserMessage?.content.trim() || conversation.title || 'Conversation';

      return {
        id: conversation.id,
        title: truncate(title, 56),
        preview: truncate(preview, 90),
        updatedAt: conversation.updated_at ?? lastMessage?.created_at ?? conversation.created_at,
        messageCount: visibleMessages.length,
      };
    })
  );

  return summaries
    .filter((summary) => summary.messageCount > 0)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteLocalConversation(
  conversationId: string,
  repositories = createRepositories()
): Promise<void> {
  await repositories.messages.deleteByConversation(conversationId);
  await repositories.conversations.delete(conversationId);
}

function createRepositories(): ConversationHistoryRepositories {
  return {
    users: new UsersRepository(),
    conversations: new ConversationsRepository(),
    messages: new MessagesRepository(),
  };
}

async function ensureConversation(
  repositories: ConversationHistoryRepositories,
  conversationId: string
): Promise<void> {
  await ensureLocalUser(repositories);

  const existingConversation = await repositories.conversations.getById(conversationId);
  if (existingConversation) {
    return;
  }

  await repositories.conversations.upsert({
    id: conversationId,
    userId: LOCAL_USER_ID,
    title:
      conversationId === VOICE_HUB_CONVERSATION_ID ? VOICE_HUB_CONVERSATION_TITLE : 'Conversation',
  });
}

async function ensureLocalUser(
  repositories: ConversationHistoryRepositories
): Promise<void> {
  const existingUser = await repositories.users.getById(LOCAL_USER_ID);
  if (!existingUser) {
    await repositories.users.create({
      id: LOCAL_USER_ID,
      name: 'Local Voice Hub User',
      email: null,
    });
  }
}

function truncate(value: string, maxLength: number): string {
  const trimmed = value.replaceAll(/\s+/g, ' ').trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 3)}...` : trimmed;
}
