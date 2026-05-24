import {
  VoiceHubFloatingTranscript,
  VoiceHubOrb,
  VoiceHubQuickAction,
  VoiceHubQuickActionsRow,
  VoiceHubRadialBackground,
  VoiceHubStateSection,
  VOICE_HUB_TAB_CONTENT_INSET,
} from '@/components/voice-hub';
import { AuthenticatedAppTopBar, appTopBarOffsetTop } from '@/components/common';
import { AuraScreen } from '@/components/ui/aura-screen';
import { toast } from '@/components/ui/toaster';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { LlmChatClientError, postLlmChat, type LlmChatMessage } from '@/lib/llm-chat';
import {
  loadConversationMessages,
  saveVoiceHubExchange,
  VOICE_HUB_CONVERSATION_ID,
} from '@/src/db/conversation-history';
import { THEME } from '@/lib/theme';
import { GradientText } from '@/components/welcome/gradient-text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, History, Mail } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = THEME.dark.surfaceDim;
const SYSTEM_PROMPT =
  'You are Aura, a concise voice-first personal assistant. Answer clearly and keep replies useful for a mobile chat.';

function getSpeechErrorMessage(code: string, fallback?: string) {
  if (code === 'permission_denied') {
    return 'Microphone access is required for voice capture. Enable it in Settings to continue.';
  }

  if (code === 'not_available') {
    return 'Speech recognition is unavailable on this device.';
  }

  if (code === 'no_speech') {
    return 'No speech was detected. Try speaking closer to your microphone.';
  }

  return fallback || 'Speech recognition failed. Please try again.';
}

function isSpeechWarning(code: string) {
  return code === 'permission_denied' || code === 'not_available' || code === 'no_speech';
}

export default function VoiceHubScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const topPad = appTopBarOffsetTop(insets.top);
  const bottomPad = Math.max(VOICE_HUB_TAB_CONTENT_INSET + insets.bottom - 52, 0);
  const activeConversationId = params.conversationId || VOICE_HUB_CONVERSATION_ID;
  const [draftMessage, setDraftMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<LlmChatMessage[]>([]);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastSentTranscriptRef = useRef('');
  const lastFailedUserMessageRef = useRef<string | null>(null);
  const lastSpeechErrorKeyRef = useRef<string | null>(null);
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

  const micDisabled = error?.code === 'permission_denied' || error?.code === 'not_available';
  const floatingTranscript =
    partialTranscript || (isListening || status === 'processing' ? finalTranscript : '');

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    const scrollToComposer = () => {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    };

    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      scrollToComposer();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrateConversationHistory() {
      try {
        const recentMessages = await loadConversationMessages(activeConversationId);
        if (isMounted && recentMessages.length > 0) {
          setChatMessages(recentMessages);
        } else if (isMounted) {
          setChatMessages([]);
        }
      } catch (error) {
        console.warn('[voice-hub] Unable to load local conversation history.', error);
        if (isMounted) {
          toast.warning({
            title: 'Unable to load local history',
            description: 'Recent Voice Hub messages may not appear right now.',
          });
        }
      }
    }

    void hydrateConversationHistory();

    return () => {
      isMounted = false;
    };
  }, [activeConversationId]);

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
          conversationId: activeConversationId,
        }).catch((storageError) => {
          console.warn('[voice-hub] Unable to save local conversation exchange.', storageError);
          toast.warning({
            title: 'Unable to save conversation',
            description: 'This exchange may not appear in local history.',
          });
        });
        setChatMessages([...nextMessages, { role: 'assistant', content: response.reply }]);
      } catch (error) {
        lastFailedUserMessageRef.current = userContent;
        toast.error({
          title: 'Aura could not respond',
          description:
            error instanceof LlmChatClientError
              ? error.message
              : 'Aura could not get a response right now. Check your connection and try again.',
        });
      } finally {
        setIsAssistantThinking(false);
      }
    },
    [activeConversationId, isAssistantThinking]
  );

  useEffect(() => {
    const transcript = finalTranscript.trim();

    if (!transcript || transcript === lastSentTranscriptRef.current) {
      return;
    }

    lastSentTranscriptRef.current = transcript;
    void sendMessage(transcript);
  }, [finalTranscript, sendMessage]);

  useEffect(() => {
    if (!error) {
      lastSpeechErrorKeyRef.current = null;
      return;
    }

    const errorKey = `${error.code}:${error.message}`;
    if (lastSpeechErrorKeyRef.current === errorKey) {
      return;
    }

    lastSpeechErrorKeyRef.current = errorKey;
    const input = {
      title: isSpeechWarning(error.code)
        ? 'Voice capture needs attention'
        : 'Speech recognition failed',
      description: getSpeechErrorMessage(error.code, error.message),
    };

    if (isSpeechWarning(error.code)) {
      toast.warning(input);
    } else {
      toast.error(input);
    }
  }, [error]);

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
    if (micDisabled) {
      toast.warning({
        title: 'Voice capture unavailable',
        description:
          error?.code === 'permission_denied'
            ? 'Microphone access is required to start voice capture. Enable it in Settings to continue.'
            : 'Speech recognition is unavailable on this device.',
      });
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
        toast.error({
          title: 'Unable to start voice capture',
          description: 'Check microphone permission.',
        });
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

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={topPad}>
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: bottomPad + keyboardHeight,
              paddingHorizontal: 24,
            }}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View className="w-full max-w-2xl gap-8 self-center">
              <View className="items-center gap-7">
                <View className="relative w-full items-center pt-24">
                  <VoiceHubFloatingTranscript
                    transcript={floatingTranscript}
                    isListening={isListening}
                  />
                  <VoiceHubOrb
                    onPress={handleOrbPress}
                    disabled={micDisabled}
                    isListening={isListening}
                    isProcessing={status === 'processing'}
                  />
                </View>

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
                      label="View history"
                      icon={History}
                      iconClassName="text-tertiary"
                      onPress={() => router.push('/(tabs)/chat')}
                    />
                  </VoiceHubQuickActionsRow>
                </View>
              </View>

              <VoiceHubStateSection
                speechStatus={status}
                partialTranscript={partialTranscript}
                finalTranscript={finalTranscript}
                chatMessages={chatMessages}
                draftMessage={draftMessage}
                isAssistantThinking={isAssistantThinking}
                canRetryAssistantMessage={Boolean(lastFailedUserMessageRef.current)}
                onDraftMessageChange={setDraftMessage}
                onSendDraftMessage={handleSendDraftMessage}
                onRetryAssistantMessage={handleRetryAssistantMessage}
              />
              <View className="h-2" />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </AuraScreen>
  );
}
