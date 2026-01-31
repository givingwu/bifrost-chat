import type { Meta, StoryObj } from '@storybook/react';
import { ComposerToolbar } from '@/components/composer/ComposerToolbar';
import { ConversationList } from '@/components/conversation/ConversationList';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ChatMessageList } from '@/components/messages/ChatMessageList';
import {
  AvailableChannelTypes,
  ChannelType,
} from '@/interfaces/channel.interface';
import { LanguageCode } from '@/interfaces/language.interface';
import enUSMessages from '@/locales/en-US.json';
import { I18nProvider } from '@/providers/I18n.provider';
import '@/styles/theme.css';
import { ConversationHeader } from '@/components/conversation/ConversationHeader';
import { ConversationPanel } from '@/components/conversation/ConversationPanel';
import { ChannelFilter } from '@/components/toolbar/ChannelFilter';
import { useChatStore } from '@/store';

const meta: Meta = {
  title: 'Chat',
};

export default meta;

const useStoryChatStore = () => {
  const { conversation } = useChatStore();

  return {
    conversations: conversation.conversations,
    messages: conversation.messages,
  };
};

export const ChatPreview: StoryObj = {
  render: () => {
    const { conversations, messages } = useStoryChatStore();

    return (
      <ThemeSection theme="system" title="Composition">
        <ChatContainer
          locale={LanguageCode.EnUS}
          onThemeChange={console.log}
          onLanguageChange={console.log}
          conversationPanel={
            <ConversationPanel
              header={
                <ConversationHeader title="Messages">
                  <ChannelFilter
                    channels={AvailableChannelTypes}
                    activeChannel={ChannelType.SMS}
                    onChannelClick={(channel) =>
                      console.log('Channel clicked:', channel)
                    }
                  />
                </ConversationHeader>
              }
            >
              <ConversationList conversations={conversations} />
            </ConversationPanel>
          }
        >
          <ChatMessageList messages={messages} />
        </ChatContainer>
      </ThemeSection>
    );
  },
};

export const ChatLayoutPreview: StoryObj = {
  render: () => {
    const { conversations, messages } = useStoryChatStore();

    return (
      <ThemeSection theme="system" title="Chat">
        <ChatLayout
          conversationPanel={
            <ConversationPanel
              header={
                <ConversationHeader title="Messages">
                  <ChannelFilter
                    channels={AvailableChannelTypes}
                    activeChannel={ChannelType.SMS}
                  />
                </ConversationHeader>
              }
            >
              <ConversationList conversations={conversations} />
            </ConversationPanel>
          }
          composer={
            <ComposerToolbar
              channel={ChannelType.WhatsApp}
              value=""
              onChange={() => {}}
            />
          }
        >
          <ChatMessageList messages={messages} />
          <ComposerToolbar
            channel={ChannelType.WhatsApp}
            value=""
            onChange={() => {}}
          />
        </ChatLayout>
      </ThemeSection>
    );
  },
};

const ThemeSection = ({
  theme,
  title,
  children,
}: {
  theme: 'light' | 'dark' | 'system';
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <I18nProvider locale="en-US" messages={enUSMessages}>
      <div
        data-theme={theme}
        className="rounded-xl border border-border bg-surface p-6 text-text shadow-soft"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-text-muted">
            {theme}
          </span>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </I18nProvider>
  );
};
