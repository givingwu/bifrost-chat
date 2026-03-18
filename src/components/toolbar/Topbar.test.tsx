import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Topbar } from './Topbar';

// Mock useTranslation hook
vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'conversation.title': '会话',
      };
      return translations[key] || key;
    },
  }),
}));

describe('Topbar', () => {
  describe('基础渲染', () => {
    it('应该渲染标题', () => {
      render(<Topbar title="张三" />);
      expect(screen.getByText('张三')).toBeInTheDocument();
    });

    it('应该渲染副标题', () => {
      render(<Topbar title="张三" subTitle="WhatsApp · 活跃" />);
      expect(screen.getByText('WhatsApp · 活跃')).toBeInTheDocument();
    });

    it('当没有标题时，应该显示默认标题', () => {
      render(<Topbar />);
      expect(screen.getByText('会话')).toBeInTheDocument();
    });
  });

  describe('extra 内容', () => {
    it('应该渲染 extra 内容', () => {
      render(
        <Topbar
          title="张三"
          extra={<div data-testid="extra-content">工具栏</div>}
        />,
      );

      expect(screen.getByTestId('extra-content')).toBeInTheDocument();
    });
  });
});
