import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
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
          '用于一次性初始化全局 Chat Store 的 Provider。' +
          '仅首次挂载时生效，后续 config 变更不会覆盖已有状态。',
      },
    },
  },
  argTypes: {
    config: {
      control: false,
      description: 'Store 初始化配置（静态）',
    },
    children: {
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfigProvider>;

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

const renderWithSnapshot = (
  config: ChatStoreInitialState,
  locale?: LanguageCodeEnum,
) => {
  return (
    <ConfigProvider config={config}>
      <ChatContainer locale={locale}>
        {(state) => <StoreSnapshot state={state} />}
      </ChatContainer>
    </ConfigProvider>
  );
};

/**
 * 静态初始化：在首次挂载时把 config 合并进 store。
 */
export const StaticInitialization: Story = {
  render: () =>
    renderWithSnapshot({
      language: { code: LanguageCodeEnum.ZhCN },
      strategy: {
        allowedChannels: [ChannelTypeEnum.Waba, ChannelTypeEnum.SMS],
        activeChannel: ChannelTypeEnum.Waba,
      },
      theme: { mode: ThemeModeEnum.Light },
    }),
};

/**
 * locale 优先级：ChatContainer locale 会覆盖 config.language。
 */
export const LocaleOverride: Story = {
  render: () =>
    renderWithSnapshot(
      {
        language: { code: LanguageCodeEnum.ZhCN },
        strategy: {
          allowedChannels: [ChannelTypeEnum.WhatsApp],
          activeChannel: ChannelTypeEnum.WhatsApp,
        },
      },
      LanguageCodeEnum.EnUS,
    ),
};

/**
 * 静态行为：更新 config prop 不会触发重新初始化。
 */
export const ConfigIsStaticAfterMount: Story = {
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
                <StoreSnapshot state={state} />
              </div>
            )}
          </ChatContainer>
        </ConfigProvider>
      </div>
    );
  },
};
