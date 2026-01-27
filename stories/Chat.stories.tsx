import type { Meta, StoryObj } from '@storybook/react';
import { ComposerStrategy } from '../src/components/composer/ComposerStrategy';
import { ChatMessageList } from '../src/components/messages/ChatMessageList';
import { ChannelToolsList } from '../src/components/toolbar/ChannelToolsList';
import enUSMessages from '../src/locales/en-US.json';
import { I18nProvider, useTranslation } from '../src/providers/I18n.provider';

const meta: Meta = {
  title: 'Bifrost-Chat/Components',
};

export default meta;

export const Toolbar: StoryObj = {
  render: () => (
    <ThemeSection theme="light" title="Light">
      <ChannelToolsList
        channels={['sms', 'whatsapp', 'email', 'voip']}
        status="online"
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
            direction: 'inbound',
            channelType: 'sms',
            status: 'sent',
            timestamp: Date.now(),
            type: 'text',
            content: { text: 'Hello' },
          },
          {
            id: '2',
            direction: 'outbound',
            channelType: 'whatsapp',
            status: 'delivered',
            timestamp: Date.now(),
            type: 'image',
            content: { url: 'https://example.com', mimeType: 'image/png' },
          },
        ]}
      />
    </ThemeSection>
  ),
};

export const Composer: StoryObj = {
  render: () => (
    <ThemeSection theme="system" title="System">
      <ComposerStrategy channel="sms" value="" onChange={() => {}} />
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
