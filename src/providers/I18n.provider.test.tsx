import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider, useTranslation } from '@/providers/I18n.provider';

// 测试组件
const TestComponent = () => {
  const { t } = useTranslation();
  return (
    <div>
      <span data-testid="simple">{t('title')}</span>
      <span data-testid="nested">{t('toolbar.channel.sms')}</span>
      <span data-testid="params">
        {t('composer.placeholder.channel', { channel: 'SMS' })}
      </span>
    </div>
  );
};

describe('I18nProvider', () => {
  const mockMessages = {
    title: 'Test Title',
    toolbar: {
      channel: {
        sms: 'SMS Channel',
      },
    },
    composer: {
      placeholder: {
        channel: 'Enter {{channel}} message',
      },
    },
  };

  describe('基本翻译功能', () => {
    it('应该能够翻译简单的键', () => {
      render(
        <I18nProvider locale="en" messages={mockMessages}>
          <TestComponent />
        </I18nProvider>,
      );

      expect(screen.getByTestId('simple').textContent).toBe('Test Title');
    });

    it('应该能够翻译嵌套的键', () => {
      render(
        <I18nProvider locale="en" messages={mockMessages}>
          <TestComponent />
        </I18nProvider>,
      );

      expect(screen.getByTestId('nested').textContent).toBe('SMS Channel');
    });

    it('应该支持参数化翻译', () => {
      render(
        <I18nProvider locale="en" messages={mockMessages}>
          <TestComponent />
        </I18nProvider>,
      );

      expect(screen.getByTestId('params').textContent).toBe(
        'Enter SMS message',
      );
    });

    it('当键不存在时应该返回键本身', () => {
      const TestMissingKey = () => {
        const { t } = useTranslation();
        return <span>{t('nonexistent.key')}</span>;
      };

      const { container } = render(
        <I18nProvider locale="en" messages={mockMessages}>
          <TestMissingKey />
        </I18nProvider>,
      );

      expect(container.textContent).toBe('nonexistent.key');
    });

    it('当值不是字符串时应该返回键本身', () => {
      const messagesWithObject = {
        ...mockMessages,
        objectValue: { nested: 'value' },
      };

      const TestObjectValue = () => {
        const { t } = useTranslation();
        return <span>{t('objectValue')}</span>;
      };

      const { container } = render(
        <I18nProvider locale="en" messages={messagesWithObject}>
          <TestObjectValue />
        </I18nProvider>,
      );

      expect(container.textContent).toBe('objectValue');
    });
  });

  describe('语言切换回调', () => {
    it('应该调用 onChangeLanguage 回调', () => {
      const handleChange = vi.fn();

      const TestLanguageChange = () => {
        const { i18n } = useTranslation();
        return (
          <button type="button" onClick={() => i18n.changeLanguage('zh-CN')}>
            Change Language
          </button>
        );
      };

      render(
        <I18nProvider
          locale="en"
          messages={mockMessages}
          onChangeLanguage={handleChange}
        >
          <TestLanguageChange />
        </I18nProvider>,
      );

      const button = screen.getByText('Change Language');
      button.click();

      expect(handleChange).toHaveBeenCalledWith('zh-CN');
    });

    it('当没有 onChangeLanguage 时不应该抛出错误', () => {
      const TestLanguageChange = () => {
        const { i18n } = useTranslation();
        return (
          <button type="button" onClick={() => i18n.changeLanguage('zh-CN')}>
            Change Language
          </button>
        );
      };

      expect(() => {
        render(
          <I18nProvider locale="en" messages={mockMessages}>
            <TestLanguageChange />
          </I18nProvider>,
        );

        const button = screen.getByText('Change Language');
        button.click();
      }).not.toThrow();
    });
  });

  describe('useTranslation hook', () => {
    it('应该返回正确的 locale', () => {
      const TestLocale = () => {
        const { i18n } = useTranslation();
        return <span>{i18n.language}</span>;
      };

      const { container } = render(
        <I18nProvider locale="zh-CN" messages={mockMessages}>
          <TestLocale />
        </I18nProvider>,
      );

      expect(container.textContent).toBe('zh-CN');
    });

    it('应该返回 t 函数', () => {
      const TestTFunction = () => {
        const { t } = useTranslation();
        return <span>{typeof t}</span>;
      };

      const { container } = render(
        <I18nProvider locale="en" messages={mockMessages}>
          <TestTFunction />
        </I18nProvider>,
      );

      expect(container.textContent).toBe('function');
    });

    it('当不在 I18nProvider 内部使用时应该抛出错误', () => {
      // 抑制控制台错误输出
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTranslation must be used within I18nProvider');

      consoleError.mockRestore();
    });
  });

  describe('参数化翻译的高级功能', () => {
    it('应该支持多个参数', () => {
      const messagesWithMultipleParams = {
        greeting: 'Hello {{name}}, you have {{count}} messages',
      };

      const TestMultipleParams = () => {
        const { t } = useTranslation();
        return <span>{t('greeting', { name: 'Alice', count: '5' })}</span>;
      };

      const { container } = render(
        <I18nProvider locale="en" messages={messagesWithMultipleParams}>
          <TestMultipleParams />
        </I18nProvider>,
      );

      expect(container.textContent).toBe('Hello Alice, you have 5 messages');
    });

    it('应该正确处理参数中的特殊字符', () => {
      const messagesWithSpecialChars = {
        message: 'Price: ${{price}}',
      };

      const TestSpecialChars = () => {
        const { t } = useTranslation();
        return <span>{t('message', { price: '100' })}</span>;
      };

      const { container } = render(
        <I18nProvider locale="en" messages={messagesWithSpecialChars}>
          <TestSpecialChars />
        </I18nProvider>,
      );

      expect(container.textContent).toBe('Price: $100');
    });

    it('应该处理未提供的参数', () => {
      const messagesWithParams = {
        message: 'Hello {{name}}',
      };

      const TestMissingParam = () => {
        const { t } = useTranslation();
        return <span>{t('message', {})}</span>;
      };

      const { container } = render(
        <I18nProvider locale="en" messages={messagesWithParams}>
          <TestMissingParam />
        </I18nProvider>,
      );

      // 未提供的参数应该保持原样
      expect(container.textContent).toBe('Hello {{name}}');
    });
  });

  describe('Context 值更新', () => {
    it('当 locale 改变时应该更新 context', () => {
      const messagesEn = { title: 'English Title' };
      const messagesZh = { title: '中文标题' };

      const TestComponentWithUpdate = ({
        locale,
        messages,
      }: {
        locale: string;
        messages: Record<string, unknown>;
      }) => {
        const { t } = useTranslation();
        return <span>{t('title')}</span>;
      };

      const { rerender } = render(
        <I18nProvider locale="en" messages={messagesEn}>
          <TestComponentWithUpdate locale="en" messages={messagesEn} />
        </I18nProvider>,
      );

      expect(screen.getByText('English Title')).toBeDefined();

      rerender(
        <I18nProvider locale="zh-CN" messages={messagesZh}>
          <TestComponentWithUpdate locale="zh-CN" messages={messagesZh} />
        </I18nProvider>,
      );

      expect(screen.getByText('中文标题')).toBeDefined();
    });
  });
});
