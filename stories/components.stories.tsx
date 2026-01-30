import type { Meta, StoryObj } from '@storybook/react';
import { ComposerToolbar } from '@/components/composer/ComposerToolbar';
import { ContextPanel } from '@/components/context/ContextPanel';
import { ConversationList } from '@/components/conversation/ConversationList';
import { ChatTopbar } from '@/components/layout/ChatTopbar';
import { ChatMessageList } from '@/components/messages/ChatMessageList';
import { ChannelFilter } from '@/components/toolbar/ChannelFilter';
import { NetworkStatus } from '@/components/toolbar/NetworkStatus';
import { AgentStatus } from '@/interfaces/agent.interface';
import {
  AvailableChannelTypes,
  ChannelType,
} from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
} from '@/interfaces/message.interface';
import { NetworkStatus as NetworkStatusEnum } from '@/interfaces/network.interface';
import enUSMessages from '@/locales/en-US.json';
import { I18nProvider } from '@/providers/I18n.provider';
import {
  useActions,
  useLanguage,
  useNetwork,
  useStrategy,
  useTheme,
} from '@/store';
import '@/styles/theme.css';
import { LanguageSwitcher } from '@/components/toolbar/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/toolbar/ThemeSwitcher';

const meta: Meta = {
  title: 'Chat/Components',
};

export default meta;

const mockConversations: Conversation[] = [
  {
    id: '1',
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
    id: '2',
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
    id: '3',
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

export const ToolsList = () => {
  const { activeChannel } = useStrategy();
  const { setActiveChannel } = useActions();

  return (
    <ThemeSection theme="light" title="Light">
      <ChannelFilter
        activeChannel={activeChannel}
        onChannelClick={setActiveChannel}
        channels={AvailableChannelTypes}
        status={AgentStatus.Online}
      />
    </ThemeSection>
  );
};

export const Topbar: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="Topbar">
      <ChatTopbar
        title="Liam Walker"
        subtitle="via WhatsApp"
        avatarUrl="https://i.pravatar.cc/150?img=12"
      />
    </ThemeSection>
  ),
};

export const MessageList: StoryObj = {
  render: () => (
    <ThemeSection theme="dark" title="Dark">
      <ChatMessageList messages={mockMessages} />
    </ThemeSection>
  ),
};

export const Composer: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="System">
      <ComposerToolbar channel={ChannelType.SMS} value="" onChange={() => {}} />
    </ThemeSection>
  ),
};

export const Conversations: StoryObj = {
  render: () => (
    <ThemeSection theme="light" title="Conversations">
      <div className="h-[520px]">
        <ConversationList conversations={mockConversations} />
      </div>
    </ThemeSection>
  ),
};

export const ContextPanels: StoryObj = {
  render: () => (
    <ThemeSection theme="light" title="Context Panel">
      <div className="h-[520px]">
        <ContextPanel
          profile={mockProfile}
          onTemplateClick={(template) => console.log(template)}
        />
      </div>
    </ThemeSection>
  ),
};

export const NetworkStatusPreview: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="Network Status">
      <NetStatusPreview />
    </ThemeSection>
  ),
};

export const LanguageSwitcherPreview: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="Language">
      <LanguagePreview />
    </ThemeSection>
  ),
};

export const ThemePreview: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="Theme/Language">
      <ThemeModePreview />
    </ThemeSection>
  ),
};

const NetStatusPreview = () => {
  const network = useNetwork();

  return (
    <div className="flex gap-2 items-center rounded-lg border border-border bg-card px-3 py-2 text-xs">
      <div className="flex flex-col gap-4">
        <NetworkStatus status={NetworkStatusEnum.Connected} />
        <NetworkStatus status={NetworkStatusEnum.Connecting} />
        <NetworkStatus status={NetworkStatusEnum.Disconnected} />
      </div>
      <div>Network status: {network.status}</div>
    </div>
  );
};

const ThemeModePreview = () => {
  const theme = useTheme();
  const { setTheme } = useActions();

  return (
    <div className="flex gap-2 items-center rounded-lg border border-border bg-card px-3 py-2 text-xs">
      <ThemeSwitcher value={theme.mode} onChange={setTheme} />
      <div>Current theme: {theme.mode}</div>
    </div>
  );
};

const LanguagePreview = () => {
  const language = useLanguage();
  const { setLanguage } = useActions();

  return (
    <div className="flex gap-2 items-center rounded-lg border border-border bg-card px-3 py-2 text-xs text-text-muted">
      <LanguageSwitcher value={language.code} onChange={setLanguage} />
      <div>Current language: {language.code}</div>
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
