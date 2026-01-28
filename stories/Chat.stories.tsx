import type { Meta, StoryObj } from '@storybook/react';
import { ComposerStrategy } from '@/components/composer/ComposerStrategy';
import { ChatTopbar } from '@/components/layout/ChatTopbar';
import { ChatMessageList } from '@/components/messages/ChatMessageList';
import { ChannelToolsList } from '@/components/toolbar/ChannelToolsList';
import { AgentStatus } from '@/interfaces/agent.interface';
import {
  AvailableChannelTypes,
  ChannelType,
} from '@/interfaces/channel.interface';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
} from '@/interfaces/message.interface';
import { NetworkStatus } from '@/interfaces/network.interface';
import { ThemeMode } from '@/interfaces/theme.interface';
import enUSMessages from '@/locales/en-US.json';
import { I18nProvider, useTranslation } from '@/providers/I18n.provider';

const meta: Meta = {
  title: 'Chat/Components',
};

export default meta;

export const Toolbar: StoryObj = {
  render: () => (
    <ThemeSection theme="light" title="Light">
      <ChannelToolsList
        channels={AvailableChannelTypes}
        status={AgentStatus.Online}
      />
    </ThemeSection>
  ),
};

export const Topbar: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="Topbar">
      <ChatTopbar
        channels={AvailableChannelTypes}
        status={AgentStatus.Online}
        networkStatus={NetworkStatus.Connected}
        themeMode={ThemeMode.System}
        onThemeChange={console.log}
      />
    </ThemeSection>
  ),
};

export const MessageList: StoryObj = {
  render: () => (
    <ThemeSection theme="dark" title="Dark">
      <ChatMessageList
        messages={[
          {
            id: '1',
            direction: MessageDirection.Incoming,
            channelType: ChannelType.SMS,
            status: MessageStatus.Sent,
            timestamp: Date.now(),
            type: MessageType.Text,
            content: { text: 'Hello' },
          },
          {
            id: '2',
            direction: MessageDirection.Outgoing,
            channelType: ChannelType.WhatsApp,
            status: MessageStatus.Delivered,
            timestamp: Date.now(),
            type: MessageType.Image,
            content: {
              url: 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
              mimeType: 'image/png',
            },
          },
        ]}
      />
    </ThemeSection>
  ),
};

export const Composer: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="System">
      <ComposerStrategy
        channel={ChannelType.SMS}
        value=""
        onChange={() => {}}
      />
    </ThemeSection>
  ),
};

export const TranslationExample: StoryObj = {
  render: () => (
    <ThemeSection theme="light" title="Translation">
      <TranslationPreview />
    </ThemeSection>
  ),
};

const TranslationPreview = () => {
  const { t } = useTranslation();
  return (
    <div
      data-component="translation-example"
      className="rounded-xl border border-border bg-card p-4 text-sm text-text shadow-soft"
    >
      {t('Gateway.Plugin.statusChangeConfirm', {
        name: 'Demo',
        status: 'Enabled',
      })}
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
