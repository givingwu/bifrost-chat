import type { Meta, StoryObj } from '@storybook/react';
import { ComposerStrategy } from '@/components/composer/ComposerStrategy';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { ChatTopbar } from '@/components/layout/ChatTopbar';
import { ChatMessageList } from '@/components/messages/ChatMessageList';
import { ChannelToolsList } from '@/components/toolbar/ChannelToolsList';
import { AgentStatus } from '@/interfaces/agent.interface';
import {
  AvailableChannelTypes,
  ChannelType,
} from '@/interfaces/channel.interface';
import { LanguageCode } from '@/interfaces/language.interface';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
} from '@/interfaces/message.interface';
import { NetworkStatus } from '@/interfaces/network.interface';
import { ThemeMode } from '@/interfaces/theme.interface';
import enUSMessages from '@/locales/en-US.json';
import zhCNMessages from '@/locales/zh-CN.json';
import { I18nProvider, useTranslation } from '@/providers/I18n.provider';
import { useChatStore } from '@/store';

const meta: Meta = {
  title: 'Chat/Components',
};

export default meta;

const languageMessages = {
  [LanguageCode.EnUS]: enUSMessages,
  [LanguageCode.ZhCN]: zhCNMessages,
};

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
        language={LanguageCode.EnUS}
        onThemeChange={console.log}
        onLanguageChange={console.log}
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

export const CompositionExample: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="Composition">
      <ChatContainer
        locale={LanguageCode.EnUS}
        messages={languageMessages}
        channels={AvailableChannelTypes}
        onThemeChange={console.log}
        onLanguageChange={console.log}
      >
        <div className="space-y-4">
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
          <ComposerStrategy
            channel={ChannelType.SMS}
            value=""
            onChange={() => {}}
          />
        </div>
        <ThemeModePreview />
        <LanguagePreview />
      </ChatContainer>
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
