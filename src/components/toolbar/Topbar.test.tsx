import { fireEvent, render, screen } from '@testing-library/react';
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
      render(<Topbar title="张三" subtitle="WhatsApp · 活跃" />);
      expect(screen.getByText('WhatsApp · 活跃')).toBeInTheDocument();
    });

    it('当没有标题时，应该显示默认标题', () => {
      render(<Topbar />);
      expect(screen.getByText('会话')).toBeInTheDocument();
    });
  });

  describe('renderMeta 插槽', () => {
    it('当 renderMeta 存在时，应该渲染自定义元数据', () => {
      render(
        <Topbar
          title="张三"
          renderMeta={() => (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500">(债务人)</span>
              <button type="button" className="text-xs text-blue-500">
                ASSET-2024-001
              </button>
            </div>
          )}
        />,
      );

      expect(screen.getByText('(债务人)')).toBeInTheDocument();
      expect(screen.getByText('ASSET-2024-001')).toBeInTheDocument();
    });

    it('当 renderMeta 不存在时，不应渲染额外内容', () => {
      render(<Topbar title="张三" />);
      expect(screen.queryByText('(')).not.toBeInTheDocument();
    });

    it('renderMeta 中的按钮应该可以点击', () => {
      const handleClick = vi.fn();
      render(
        <Topbar
          title="张三"
          renderMeta={() => (
            <button
              type="button"
              data-testid="asset-button"
              onClick={handleClick}
            >
              ASSET-2024-001
            </button>
          )}
        />,
      );

      const button = screen.getByTestId('asset-button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('布局顺序', () => {
    it('应该按顺序显示：标题、renderMeta、副标题', () => {
      render(
        <Topbar
          title="张三"
          subtitle="WhatsApp · 活跃"
          renderMeta={() => <span data-testid="meta-content">元数据</span>}
        />,
      );

      // 检查所有内容都存在
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByTestId('meta-content')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp · 活跃')).toBeInTheDocument();
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
