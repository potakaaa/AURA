import {
  VoiceHubOrb,
  VoiceHubQuickAction,
  VoiceHubQuickActionsRow,
  VoiceHubRadialBackground,
  VoiceHubStateSection,
  VOICE_HUB_TAB_CONTENT_INSET,
} from '@/components/voice-hub';
import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraScreen } from '@/components/ui/aura-screen';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { LlmChatClientError, postLlmChat, type LlmChatMessage } from '@/lib/llm-chat';
import {
  loadRecentVoiceHubMessages,
  saveVoiceHubExchange,
} from '@/src/db/conversation-history';
import { THEME } from '@/lib/theme';
import { GradientText } from '@/components/welcome/gradient-text';
import { Calendar, FileText, Mail } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = THEME.dark.surfaceDim;
const SYSTEM_PROMPT =
  'You are Aura, a concise voice-first personal assistant. Answer clearly and keep replies useful for a mobile chat.';

export default function VoiceHubScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const topPad = appTopBarOffsetTop(insets.top);
  const bottomPad = VOICE_HUB_TAB_CONTENT_INSET + insets.bottom;
  const [micPermissionMessage, setMicPermissionMessage] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<LlmChatMessage[]>([]);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [assistantErrorMessage, setAssistantErrorMessage] = useState<string | null>(null);
  const lastSentTranscriptRef = useRef('');
  const lastFailedUserMessageRef = useRef<string | null>(null);
  const chatMessagesRef = useRef<LlmChatMessage[]>([]);
  const {
    status,
    isListening,
    partialTranscript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    cancelListening,
  } = useSpeechRecognition();

  const speechErrorMessage = useMemo(() => {
    if (!error) {
      return null;
    }

    if (error.code === 'permission_denied') {
      return 'Microphone access is required for voice capture. Enable it in Settings to continue.';
    }

    if (error.code === 'not_available') {
      return 'Speech recognition is unavailable on this device.';
    }

    if (error.code === 'no_speech') {
      return 'No speech was detected. Try speaking closer to your microphone.';
    }

    return error.message || 'Speech recognition failed. Please try again.';
  }, [error]);

  const micDisabled = error?.code === 'permission_denied' || error?.code === 'not_available';

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateConversationHistory() {
      try {
        const recentMessages = await loadRecentVoiceHubMessages();
        if (isMounted && recentMessages.length > 0) {
          setChatMessages(recentMessages);
        }
      } catch (error) {
        console.warn('[voice-hub] Unable to load local conversation history.', error);
      }
    }

    void hydrateConversationHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const sendMessage = useCallback(
    async (rawMessage: string, options: { appendUserMessage?: boolean } = {}) => {
      const appendUserMessage = options.appendUserMessage ?? true;
      const userContent = rawMessage.trim();

      if (!userContent || isAssistantThinking) {
        return;
      }

      const nextMessages: LlmChatMessage[] = appendUserMessage
        ? [...chatMessagesRef.current, { role: 'user', content: userContent }]
        : chatMessagesRef.current;

      setChatMessages(nextMessages);
      setDraftMessage('');
      setAssistantErrorMessage(null);
      setIsAssistantThinking(true);
      lastFailedUserMessageRef.current = null;

      try {
        const response = await postLlmChat([
          { role: 'system', content: SYSTEM_PROMPT },
          ...nextMessages,
        ]);

        void saveVoiceHubExchange({
          userContent,
          assistantContent: response.reply,
        }).catch((storageError) => {
          console.warn('[voice-hub] Unable to save local conversation exchange.', storageError);
        });
        setChatMessages([...nextMessages, { role: 'assistant', content: response.reply }]);
      } catch (error) {
        lastFailedUserMessageRef.current = userContent;
        setAssistantErrorMessage(
          error instanceof LlmChatClientError
            ? error.message
            : 'Aura could not get a response right now. Check your connection and try again.'
        );
      } finally {
        setIsAssistantThinking(false);
      }
    },
    [isAssistantThinking]
  );

  useEffect(() => {
    const transcript = finalTranscript.trim();

    if (!transcript || transcript === lastSentTranscriptRef.current) {
      return;
    }

    lastSentTranscriptRef.current = transcript;
    void sendMessage(transcript);
  }, [finalTranscript, sendMessage]);

  const handleSendDraftMessage = useCallback(() => {
    void sendMessage(draftMessage);
  }, [draftMessage, sendMessage]);

  const handleRetryAssistantMessage = useCallback(() => {
    const failedMessage = lastFailedUserMessageRef.current;

    if (!failedMessage || isAssistantThinking) {
      return;
    }

    void sendMessage(failedMessage, { appendUserMessage: false });
  }, [isAssistantThinking, sendMessage]);

  const handleOrbPress = useCallback(async () => {
    setMicPermissionMessage(null);

    if (micDisabled) {
      setMicPermissionMessage(
        error?.code === 'permission_denied'
          ? 'Microphone access is required to start voice capture. Enable it in Settings to continue.'
          : 'Speech recognition is unavailable on this device.'
      );
      return;
    }

    if (isListening) {
      await stopListening();
      return;
    }

    if (status === 'processing') {
      await cancelListening();
      return;
    }

    try {
      await startListening();
    } catch {
      if (Platform.OS === 'android') {
        setMicPermissionMessage('Unable to start voice capture. Check microphone permission.');
      }
    }
  }, [
    cancelListening,
    error?.code,
    isListening,
    micDisabled,
    startListening,
    status,
    stopListening,
  ]);

  return (
    <AuraScreen>
      <View className="flex-1" style={{ backgroundColor: BG }}>
        <VoiceHubRadialBackground width={width} height={height} />

        <AuthenticatedAppTopBar backgroundColor={BG} />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: topPad,
            paddingBottom: bottomPad,
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="w-full max-w-2xl gap-8 self-center">
            <View className="items-center gap-7">
              <VoiceHubOrb
                onPress={handleOrbPress}
                disabled={micDisabled}
                isListening={isListening}
                isProcessing={status === 'processing'}
              />

              <View className="w-full items-center gap-6">
                <GradientText
                  variant="surfaceHeadline"
                  className="text-center text-[34px] font-extrabold leading-tight tracking-tight"
                  outerClassName="self-center px-1"
                  textStyle={{ fontFamily: 'Manrope_800ExtraBold' }}>
                  What should Aura help with next?
                </GradientText>

                <VoiceHubQuickActionsRow>
                  <VoiceHubQuickAction
                    label="Summarize emails"
                    icon={Mail}
                    iconClassName="text-primary"
                  />
                  <VoiceHubQuickAction
                    label="Schedule my day"
                    icon={Calendar}
                    iconClassName="text-secondary"
                  />
                  <VoiceHubQuickAction
                    label="Generate briefing"
                    icon={FileText}
                    iconClassName="text-tertiary"
                  />
                </VoiceHubQuickActionsRow>
              </View>
            </View>

            <VoiceHubStateSection
              micPermissionMessage={micPermissionMessage}
              speechStatus={status}
              partialTranscript={partialTranscript}
              finalTranscript={finalTranscript}
              speechErrorMessage={speechErrorMessage}
              chatMessages={chatMessages}
              draftMessage={draftMessage}
              isAssistantThinking={isAssistantThinking}
              assistantErrorMessage={assistantErrorMessage}
              canRetryAssistantMessage={Boolean(lastFailedUserMessageRef.current)}
              onDraftMessageChange={setDraftMessage}
              onSendDraftMessage={handleSendDraftMessage}
              onRetryAssistantMessage={handleRetryAssistantMessage}
            />
            <View className="h-2" />
          </View>
        </ScrollView>
      </View>
    </AuraScreen>
  );
}
