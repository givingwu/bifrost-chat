import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatContainer } from '@/components/layout/ChatContainer';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import { useChatStore } from '@/store';

vi.mock('@/store', () => ({
  useChatStore: vi.fn(),
  useActions: vi.fn(() => ({
    setLanguage: vi.fn(),
    setSystemPrefersDark: vi.fn(),
  })),
  useLanguage: vi.fn(() => ({
    code: LanguageCodeEnum.EnUS,
  })),
  useTheme: vi.fn(() => ({
    mode: 'light',
    systemPrefersDark: false,
  })),
}));

describe('ChatContainer', () => {
  const mockStore = {
    theme: { mode: 'light', systemPrefersDark: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useChatStore as unknown as Mock).mockReturnValue(mockStore);
  });

  const TestChildComponent = () => {
    return <div data-testid="child">Child Component</div>;
  };

  it('应该渲染子组件', () => {
    render(
      <ChatContainer locale={LanguageCodeEnum.EnUS}>
        <TestChildComponent />
      </ChatContainer>,
    );

    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('应该设置正确的 data-language 属性', () => {
    render(
      <ChatContainer locale={LanguageCodeEnum.EnUS}>
        <TestChildComponent />
      </ChatContainer>,
    );

    const container = screen
      .getByTestId('child')
      .closest('[data-component="chat-container"]');
    expect(container?.getAttribute('data-language')).toBe('en-US');
  });

  it('应该设置正确的 data-theme 属性', () => {
    render(
      <ChatContainer locale={LanguageCodeEnum.EnUS}>
        <TestChildComponent />
      </ChatContainer>,
    );

    const container = screen
      .getByTestId('child')
      .closest('[data-component="chat-container"]');
    expect(container?.getAttribute('data-theme')).toBe('light');
    expect(container?.getAttribute('data-theme-resolved')).toBe('light');
  });

  it('应该支持 render props 模式', () => {
    render(
      <ChatContainer locale={LanguageCodeEnum.EnUS}>
        {(store) => (
          <div data-testid="render-props">
            <span data-testid="theme-mode">{store.theme.mode}</span>
          </div>
        )}
      </ChatContainer>,
    );

    expect(screen.getByTestId('render-props')).toBeDefined();
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
  });
});
