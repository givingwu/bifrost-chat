import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import zhCN from '@/locales/zh-CN.json';
import { I18nProvider } from '@/providers/I18n.provider';
import { ConversationItem } from './ConversationItem';

// Mock useLanguage hook
vi.mock('@/store', () => ({
  useLanguage: () => ({ code: 'zh-CN' }),
}));

// Mock useConversationUnread：在测试中直接回退到基线 unreadCount
vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks');
  return {
    ...actual,
    useConversationUnread: (_conversationId: string, baseUnreadCount: number) =>
      baseUnreadCount,
  };
});

// Mock formatRelativeTime
vi.mock('@/utils/time.util', () => ({
  formatRelativeTime: () => '刚刚',
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale={LanguageCodeEnum.ZhCN} messages={zhCN}>
      {children}
    </I18nProvider>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: Wrapper });
}

const createMockConversation = (
  overrides?: Partial<Conversation>,
): Conversation => ({
  id: 'conv-1',
  user: {
    id: 'user-1',
    name: '张三',
    status: AgentStatusEnum.Online,
  },
  lastMessage: '这是最后一条消息',
  lastMessageTime: '2024-01-01T10:30:00Z',
  unreadCount: 0,
  channel: ChannelTypeEnum.WhatsApp,
  ...overrides,
});

describe('ConversationItem', () => {
  describe('基础渲染', () => {
    it('应该渲染用户名', () => {
      const conversation = createMockConversation();
      renderWithProviders(<ConversationItem conversation={conversation} />);

      expect(screen.getByText('张三')).toBeInTheDocument();
    });

    it('应该渲染最后一条消息', () => {
      const conversation = createMockConversation();
      renderWithProviders(<ConversationItem conversation={conversation} />);

      expect(screen.getByText('这是最后一条消息')).toBeInTheDocument();
    });
  });

  describe('renderMeta 插槽', () => {
    it('当 renderMeta 存在时，应该渲染自定义元数据', () => {
      const conversation = createMockConversation({
        metadata: {
          relationship: '债务人',
          assetItemNumber: 'ASSET-2024-001',
        },
      });

      renderWithProviders(
        <ConversationItem
          conversation={conversation}
          renderMeta={(conv) => {
            const meta = conv.metadata as Record<string, string>;
            return (
              <div className="text-xs text-gray-500">
                <span>({meta?.relationship})</span>
                <span>{meta?.assetItemNumber}</span>
              </div>
            );
          }}
        />,
      );

      expect(screen.getByText('(债务人)')).toBeInTheDocument();
      expect(screen.getByText('ASSET-2024-001')).toBeInTheDocument();
    });

    it('当 renderMeta 不存在时，不应渲染额外内容', () => {
      const conversation = createMockConversation();
      renderWithProviders(<ConversationItem conversation={conversation} />);

      // 只有人名和最后消息，没有其他内容
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('这是最后一条消息')).toBeInTheDocument();
    });

    it('renderMeta 接收完整的 conversation 对象', () => {
      const conversation = createMockConversation({
        metadata: {
          customField: 'custom-value',
        },
      });

      renderWithProviders(
        <ConversationItem
          conversation={conversation}
          renderMeta={(conv) => {
            const meta = conv.metadata as Record<string, string>;
            return <span data-testid="custom-meta">{meta?.customField}</span>;
          }}
        />,
      );

      expect(screen.getByTestId('custom-meta')).toBeInTheDocument();
      expect(screen.getByText('custom-value')).toBeInTheDocument();
    });
  });

  describe('交互', () => {
    it('点击时应该调用 onSelect 回调', async () => {
      const conversation = createMockConversation();
      const onSelect = vi.fn();

      const { container } = renderWithProviders(
        <ConversationItem conversation={conversation} onSelect={onSelect} />,
      );

      const button = container.querySelector('button');
      button?.click();

      expect(onSelect).toHaveBeenCalledWith('conv-1');
    });
  });

  describe('未读消息', () => {
    it('当有未读消息且非激活状态时，应该显示未读徽章', () => {
      const conversation = createMockConversation({
        unreadCount: 5,
        isActive: false,
      });
      renderWithProviders(<ConversationItem conversation={conversation} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('当未读数超过99时，应该显示 99+', () => {
      const conversation = createMockConversation({
        unreadCount: 100,
        isActive: false,
      });
      renderWithProviders(<ConversationItem conversation={conversation} />);

      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});
