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

const LOCAL_USER_ID = 'local-voice-hub-user';
const VOICE_HUB_CONVERSATION_ID = 'voice-hub-mvp';
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
  await ensureVoiceHubConversation(repositories);

  const messages = await repositories.messages.listRecentByConversation(
    VOICE_HUB_CONVERSATION_ID,
    limit
  );

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
}, repositories = createRepositories()): Promise<void> {
  const userContent = input.userContent.trim();
  const assistantContent = input.assistantContent.trim();

  if (!userContent || !assistantContent) {
    return;
  }

  await ensureVoiceHubConversation(repositories);

  const messages = repositories.messages;
  await messages.create({
    id: createLocalId(),
    conversationId: VOICE_HUB_CONVERSATION_ID,
    role: 'user',
    content: userContent,
  });
  await messages.create({
    id: createLocalId(),
    conversationId: VOICE_HUB_CONVERSATION_ID,
    role: 'assistant',
    content: assistantContent,
  });
  await repositories.conversations.touch(VOICE_HUB_CONVERSATION_ID);
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

function createRepositories(): ConversationHistoryRepositories {
  return {
    users: new UsersRepository(),
    conversations: new ConversationsRepository(),
    messages: new MessagesRepository(),
  };
}

async function ensureVoiceHubConversation(
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

  await repositories.conversations.upsert({
    id: VOICE_HUB_CONVERSATION_ID,
    userId: LOCAL_USER_ID,
    title: VOICE_HUB_CONVERSATION_TITLE,
  });
}
