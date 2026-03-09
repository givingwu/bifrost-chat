import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
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

  it('配置应为静态初始化，后续更新 config 不应覆盖', () => {
    const { rerender } = render(
      <ConfigProvider
        config={{
          language: { code: LanguageCodeEnum.ZhCN },
        }}
      >
        <ChatContainer>
          {(state) => <div data-testid="language">{state.language.code}</div>}
        </ChatContainer>
      </ConfigProvider>,
    );

    expect(screen.getByTestId('language').textContent).toBe('zh-CN');

    rerender(
      <ConfigProvider
        config={{
          language: { code: LanguageCodeEnum.EnUS },
        }}
      >
        <ChatContainer>
          {(state) => <div data-testid="language">{state.language.code}</div>}
        </ChatContainer>
      </ConfigProvider>,
    );

    expect(screen.getByTestId('language').textContent).toBe('zh-CN');
  });
});
