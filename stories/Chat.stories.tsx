import type { Meta, StoryObj } from '@storybook/react';
import { ComposerToolbar } from '@/components/composer/ComposerToolbar';
import { ConversationList } from '@/components/conversation/ConversationList';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { ChatLayout as CustomChatLayout } from '@/components/layout/ChatLayout';
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
import { DefaultTools } from '@/components/layout/DefaultChatLayout';
import { Profile } from '@/components/profile/Profile';
import { ChannelFilter } from '@/components/toolbar/ChannelFilter';
import { ChatTopbar, DefaultChatLayout as DefaultChat } from '@/index';
import { useConversation } from '@/store';

const meta: Meta = {
  title: 'Chat',
};

export default meta;

export const DefaultChatLayout: StoryObj = {
  render: () => {
    const { messages } = useConversation();

    return (
      <ThemeSection theme="system" title="Composition">
        <ChatContainer locale={LanguageCode.EnUS}>
          <DefaultChat>
            <ChatMessageList messages={messages} />
          </DefaultChat>
        </ChatContainer>
      </ThemeSection>
    );
  },
};

export const ChatLayout: StoryObj = {
  render: () => {
    const { conversations, messages } = useConversation();

    return (
      <ThemeSection theme="system" title="Chat">
        <CustomChatLayout
          topbar={<ChatTopbar extra={<DefaultTools />} />}
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
          composer={<ComposerToolbar channel={ChannelType.WhatsApp} />}
          profilePanel={<Profile />}
        >
          <ChatMessageList messages={messages} />
        </CustomChatLayout>
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
