import type { Meta, StoryObj } from '@storybook/react';
import { ComposerToolbar } from '@/components/composer/ComposerToolbar';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ContextPanel } from '@/components/layout/ContextPanel';
import { ConversationList } from '@/components/layout/ConversationList';
import { ChatMessageList } from '@/components/messages/ChatMessageList';
import {
  AvailableChannelTypes,
  ChannelType,
} from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { LanguageCode } from '@/interfaces/language.interface';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
} from '@/interfaces/message.interface';
import enUSMessages from '@/locales/en-US.json';
import zhCNMessages from '@/locales/zh-CN.json';
import { I18nProvider } from '@/providers/I18n.provider';
import { useChatStore } from '@/store';
import '@/styles/theme.css';
import type { AgentStatus } from '@/interfaces/agent.interface';

const meta: Meta = {
  title: 'Chat',
};

export default meta;

const languageMessages = {
  [LanguageCode.EnUS]: enUSMessages,
  [LanguageCode.ZhCN]: zhCNMessages,
};

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    user: {
      id: 'user-1',
      name: 'Liam Walker',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      status: 'online' as AgentStatus,
    },
    lastMessage: 'Thanks for the update! 👋',
    lastMessageTime: '09:42 AM',
    unreadCount: 2,
    channel: ChannelType.WhatsApp,
    isActive: true,
  },
  {
    id: 'conv-2',
    user: {
      id: 'user-2',
      name: 'Sophia Reed',
      avatarUrl: 'https://i.pravatar.cc/150?img=48',
      status: 'busy' as AgentStatus,
    },
    lastMessage: 'Need help with my order.',
    lastMessageTime: '09:10 AM',
    unreadCount: 0,
    channel: ChannelType.SMS,
  },
  {
    id: 'conv-3',
    user: {
      id: 'user-3',
      name: 'Evelyn Carter',
      avatarUrl: 'https://i.pravatar.cc/150?img=16',
      status: 'offline' as AgentStatus,
    },
    lastMessage: 'Invoice sent via email.',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
    channel: ChannelType.Email,
  },
];

const mockMessages = [
  {
    id: 'msg-1',
    direction: MessageDirection.Incoming,
    channelType: ChannelType.WhatsApp,
    status: MessageStatus.Sent,
    timestamp: Date.now() - 1000 * 60 * 60,
    type: MessageType.Text,
    content: { text: 'Hi! I need help with my order.' },
  },
  {
    id: 'msg-2',
    direction: MessageDirection.Outgoing,
    channelType: ChannelType.WhatsApp,
    status: MessageStatus.Delivered,
    timestamp: Date.now() - 1000 * 60 * 45,
    type: MessageType.Text,
    content: { text: 'Sure! Can you share your order ID?' },
  },
  {
    id: 'msg-3',
    direction: MessageDirection.Outgoing,
    channelType: ChannelType.WhatsApp,
    status: MessageStatus.Read,
    timestamp: Date.now() - 1000 * 60 * 30,
    type: MessageType.Template,
    content: {
      text: JSON.stringify({
        title: 'Order Update',
        description: 'Your order has been shipped via FedEx.',
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
        buttons: ['Track Package', 'View Details'],
      }),
    },
  },
  {
    id: 'msg-4',
    direction: MessageDirection.Incoming,
    channelType: ChannelType.WhatsApp,
    status: MessageStatus.Sent,
    timestamp: Date.now() - 1000 * 60 * 20,
    type: MessageType.Text,
    content: { text: 'Thanks! That helps a lot.' },
  },
];

const mockProfile = {
  name: 'Liam Walker',
  avatarUrl: 'https://i.pravatar.cc/150?img=12',
  role: 'Customer',
  email: 'liam.walker@example.com',
  phone: '+1 (555) 123-4567',
  localTime: '10:45 AM',
};

export const CompositionExample: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="Composition">
      <ChatContainer
        locale={LanguageCode.EnUS}
        messages={languageMessages}
        channels={AvailableChannelTypes}
        onThemeChange={console.log}
        onLanguageChange={console.log}
        conversationList={
          <ConversationList conversations={mockConversations} />
        }
        contextPanel={<ContextPanel profile={mockProfile} />}
        composer={
          <ComposerToolbar
            channel={ChannelType.WhatsApp}
            value=""
            onChange={() => {}}
          />
        }
      >
        <ChatMessageList messages={mockMessages} />
        <ThemeModePreview />
        <LanguagePreview />
      </ChatContainer>
    </ThemeSection>
  ),
};

export const FullChat: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="Chat">
      <ChatLayout
        conversation={<ConversationList conversations={mockConversations} />}
        messages={<ChatMessageList messages={mockMessages} />}
        composer={
          <ComposerToolbar
            channel={ChannelType.WhatsApp}
            value=""
            onChange={() => {}}
          />
        }
        contextPanel={<ContextPanel profile={mockProfile} />}
      />
    </ThemeSection>
  ),
};

const ThemeModePreview = () => {
  const themeMode = useChatStore((state) => state.theme.mode);
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-text-muted">
      Current theme: {themeMode}
    </div>
  );
};

const LanguagePreview = () => {
  const language = useChatStore((state) => state.language.code);
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-text-muted">
      Current language: {language}
    </div>
  );
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
