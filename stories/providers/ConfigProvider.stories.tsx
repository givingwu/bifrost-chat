import { useMemo, useState } from 'react';
import type { Meta } from 'storybook-react-rsbuild';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import { MessageTypeEnum } from '@/interfaces/message.interface';
import { MessageTypeDisplayStrategy } from '@/interfaces/message-type-config.interface';
import { ThemeModeEnum } from '@/interfaces/theme.interface';
import { ConfigProvider } from '@/providers/config.provider';
import type { ChatStoreInitialState, ChatStoreState } from '@/store';
import '@/styles/theme.css';

const meta: Meta<typeof ConfigProvider> = {
  title: 'Providers/ConfigProvider',
  component: ConfigProvider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '用于注入并维护全局 Chat Store 配置的 Provider。' +
          '当 config 语义变化时，会重置并重新初始化 store。',
      },
    },
  },
  argTypes: {
    config: {
      control: false,
      description: 'Store 初始化配置',
    },
    children: {
      control: false,
    },
  },
};

export default meta;

const StoreSnapshot = ({ state }: { state: ChatStoreState }) => {
  return (
    <div className="w-[560px] rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-base font-semibold text-text">Store Snapshot</h3>
      <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs text-text">
        {JSON.stringify(
          {
            language: state.language,
            strategy: state.strategy,
            theme: state.theme,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
};

const renderWithSnapshot = (config: ChatStoreInitialState) => {
  return (
    <ConfigProvider config={config}>
      <ChatContainer>
        {(state) => <StoreSnapshot state={state} />}
      </ChatContainer>
    </ConfigProvider>
  );
};

/**
 * 初始化：在首次挂载时把 config 写入 store。
 */
export const StaticInitialization: Story = {
  render: () =>
    renderWithSnapshot({
      language: { code: LanguageCodeEnum.ZhCN },
      strategy: {
        allowedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.SMS],
        activeChannel: ChannelTypeEnum.WhatsApp,
      },
      theme: { mode: ThemeModeEnum.Light },
    }),
};

/**
 * ConfigProvider 初始化语言
 */
export const LocaleOverride: Story = {
  render: () =>
    renderWithSnapshot({
      language: { code: LanguageCodeEnum.EnUS },
      strategy: {
        allowedChannels: [ChannelTypeEnum.WhatsApp],
        activeChannel: ChannelTypeEnum.WhatsApp,
      },
    }),
};

/**
 * 同步行为：更新 config prop 会触发重新初始化。
 */
export const ConfigSyncAfterMount: Story = {
  render: () => {
    const [nextLanguage, setNextLanguage] = useState(false);

    const dynamicConfig = useMemo<ChatStoreInitialState>(() => {
      return {
        language: {
          code: nextLanguage ? LanguageCodeEnum.EnUS : LanguageCodeEnum.ZhCN,
        },
        strategy: {
          allowedChannels: [ChannelTypeEnum.SMS, ChannelTypeEnum.Email],
          activeChannel: ChannelTypeEnum.SMS,
        },
      };
    }, [nextLanguage]);

    return (
      <div className="space-y-3">
        <button
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          type="button"
          onClick={() => setNextLanguage((prev) => !prev)}
        >
          切换 config.language:
          {nextLanguage ? ' en-US' : ' zh-CN'}
        </button>
        <ConfigProvider config={dynamicConfig}>
          <ChatContainer>
            {(state) => (
              <div className="space-y-2">
                <p className="text-sm text-text">
                  当前 config.language 目标值：
                  {dynamicConfig.language?.code}
                </p>
                <p className="text-sm text-text-muted">
                  当前 store 会随 config 语义变化重置并同步。
                </p>
                <StoreSnapshot state={state} />
              </div>
            )}
          </ChatContainer>
        </ConfigProvider>
      </div>
    );
  },
};

/**
 * 消息类型配置：基本配置
 */
export const MessageTypeConfigBasic: Story = {
  render: () =>
    renderWithSnapshot({
      strategy: {
        activeChannel: ChannelTypeEnum.WhatsApp,
        allowedMessageTypes: [
          MessageTypeEnum.Text,
          MessageTypeEnum.Image,
          MessageTypeEnum.Video,
        ],
        messageDisplayStrategy: MessageTypeDisplayStrategy.ShowUnsupported,
        unsupportedMessage: '此消息类型暂不支持',
      },
    }),
};

/**
 * 消息类型配置：按渠道配置
 */
export const MessageTypeConfigByChannel: Story = {
  render: () =>
    renderWithSnapshot({
      strategy: {
        activeChannel: ChannelTypeEnum.WhatsApp,
        channelMessageTypeConfigs: {
          [ChannelTypeEnum.SMS]: {
            allowedTypes: [MessageTypeEnum.Text],
            displayStrategy: MessageTypeDisplayStrategy.ShowUnsupported,
            unsupportedMessage: '短信仅支持文本消息',
          },
          [ChannelTypeEnum.WhatsApp]: {
            allowedTypes: [
              MessageTypeEnum.Text,
              MessageTypeEnum.Image,
              MessageTypeEnum.Video,
              MessageTypeEnum.Audio,
              MessageTypeEnum.File,
              MessageTypeEnum.Template,
              MessageTypeEnum.Location,
            ],
            displayStrategy: MessageTypeDisplayStrategy.ShowUnsupported,
          },
          [ChannelTypeEnum.Email]: {
            allowedTypes: [
              MessageTypeEnum.Text,
              MessageTypeEnum.Image,
              MessageTypeEnum.File,
            ],
            displayStrategy: MessageTypeDisplayStrategy.ShowUnsupported,
          },
        },
      },
    }),
};

/**
 * 消息类型配置：隐藏不支持的消息
 */
export const MessageTypeConfigHideUnsupported: Story = {
  render: () =>
    renderWithSnapshot({
      strategy: {
        activeChannel: ChannelTypeEnum.SMS,
        allowedMessageTypes: [MessageTypeEnum.Text],
        messageDisplayStrategy: MessageTypeDisplayStrategy.Hide,
      },
    }),
};

/**
 * 消息类型配置：组合配置
 */
export const MessageTypeConfigCombined: Story = {
  render: () =>
    renderWithSnapshot({
      strategy: {
        activeChannel: ChannelTypeEnum.WhatsApp,
        allowedChannels: [
          ChannelTypeEnum.SMS,
          ChannelTypeEnum.WhatsApp,
          ChannelTypeEnum.WhatsApp,
        ],
        allowedMessageTypes: [
          MessageTypeEnum.Text,
          MessageTypeEnum.Image,
          MessageTypeEnum.Video,
          MessageTypeEnum.Audio,
          MessageTypeEnum.File,
          MessageTypeEnum.Template,
        ],
        messageDisplayStrategy: MessageTypeDisplayStrategy.ShowUnsupported,
        channelMessageTypeConfigs: {
          [ChannelTypeEnum.SMS]: {
            allowedTypes: [MessageTypeEnum.Text],
            unsupportedMessage: '短信仅支持文本消息',
          },
        },
      },
      theme: {
        mode: ThemeModeEnum.Light,
      },
      language: {
        code: LanguageCodeEnum.ZhCN,
      },
    }),
};
