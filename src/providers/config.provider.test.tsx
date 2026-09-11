import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import { useChatStore } from '@/store';
import { ConfigProvider } from './config.provider';

describe('ConfigProvider', () => {
  it('应将配置作为 store 初始化值注入', () => {
    render(
      <ConfigProvider
        config={{
          language: { code: LanguageCodeEnum.ZhCN },
          strategy: {
            allowedChannels: [ChannelTypeEnum.WhatsApp],
            activeChannel: ChannelTypeEnum.WhatsApp,
          },
        }}
      >
        <ChatContainer>
          {(state) => (
            <div data-testid="state">
              {state.language.code}|{state.strategy.activeChannel}
            </div>
          )}
        </ChatContainer>
      </ConfigProvider>,
    );

    expect(screen.getByTestId('state').textContent).toBe('zh-CN|whatsapp');
  });

  it('配置语义变化时应重新初始化 store', () => {
    const { rerender } = render(
      <ConfigProvider
        config={{
          language: { code: LanguageCodeEnum.ZhCN },
          strategy: {
            allowedChannels: [ChannelTypeEnum.WhatsApp],
            activeChannel: ChannelTypeEnum.WhatsApp,
          },
        }}
      >
        <ChatContainer>
          {(state) => (
            <div data-testid="state">
              {state.language.code}|{state.strategy.activeChannel}
            </div>
          )}
        </ChatContainer>
      </ConfigProvider>,
    );

    expect(screen.getByTestId('state').textContent).toBe('zh-CN|whatsapp');

    rerender(
      <ConfigProvider
        config={{
          language: { code: LanguageCodeEnum.EnUS },
          strategy: {
            allowedChannels: [ChannelTypeEnum.SMS],
            activeChannel: ChannelTypeEnum.SMS,
          },
        }}
      >
        <ChatContainer>
          {(state) => (
            <div data-testid="state">
              {state.language.code}|{state.strategy.activeChannel}
            </div>
          )}
        </ChatContainer>
      </ConfigProvider>,
    );

    expect(screen.getByTestId('state').textContent).toBe('en-US|sms');
  });

  it('相同配置重复渲染时不应覆盖运行时交互态', () => {
    const initialConfig = {
      language: { code: LanguageCodeEnum.ZhCN },
      strategy: {
        allowedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.SMS],
        activeChannel: ChannelTypeEnum.WhatsApp,
      },
    };

    const { rerender } = render(
      <ConfigProvider config={initialConfig}>
        <ChatContainer>
          {(state) => (
            <div data-testid="state">
              {state.language.code}|{state.strategy.activeChannel}
            </div>
          )}
        </ChatContainer>
      </ConfigProvider>,
    );

    act(() => {
      useChatStore.getState().actions.setActiveChannel(ChannelTypeEnum.SMS);
    });

    expect(screen.getByTestId('state').textContent).toBe('zh-CN|sms');

    rerender(
      <ConfigProvider
        config={{
          language: { code: LanguageCodeEnum.ZhCN },
          strategy: {
            allowedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.SMS],
            activeChannel: ChannelTypeEnum.WhatsApp,
          },
        }}
      >
        <ChatContainer>
          {(state) => (
            <div data-testid="state">
              {state.language.code}|{state.strategy.activeChannel}
            </div>
          )}
        </ChatContainer>
      </ConfigProvider>,
    );

    expect(screen.getByTestId('state').textContent).toBe('zh-CN|sms');
  });
});
