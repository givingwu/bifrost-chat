import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationList } from './ConversationList';

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({
    count,
    estimateSize,
    gap = 0,
  }: {
    count: number;
    estimateSize: (index: number) => number;
    gap?: number;
  }) => {
    const virtualItems = Array.from({ length: count }, () => null).reduce<
      Array<{ index: number; key: number; start: number; size: number }>
    >((items, _, index) => {
      const size = estimateSize(index);
      const start =
        index === 0 ? 0 : items[index - 1].start + items[index - 1].size + gap;

      items.push({
        index,
        key: index,
        start,
        size,
      });

      return items;
    }, []);

    return {
      getVirtualItems: () => virtualItems,
      getTotalSize: () =>
        virtualItems.length > 0
          ? virtualItems[virtualItems.length - 1].start +
            virtualItems[virtualItems.length - 1].size
          : 0,
      measure: vi.fn(),
      measureElement: vi.fn(),
      scrollToIndex: vi.fn(),
    };
  },
}));

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/store', () => ({
  useActiveConversationId: () => null,
  useConversation: () => ({
    pinnedConversationIds: new Set<string>(),
  }),
}));

vi.mock('@/hooks/use-conversations.hook', () => ({
  useConversations: () => ({
    data: [],
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
  }),
}));

vi.mock('./ConversationItem', () => ({
  ConversationItem: ({
    conversation,
    renderMeta,
  }: {
    conversation: Conversation;
    renderMeta?: (conversation: Conversation) => ReactNode;
  }) => {
    const meta = renderMeta?.(conversation);

    return (
      <div
        data-testid={`conversation-item-${conversation.id}`}
        style={{ height: meta ? '160px' : '78px' }}
      >
        <div>{conversation.user.name}</div>
        {meta}
      </div>
    );
  },
}));

function createConversation(index: number): Conversation {
  return {
    id: `conv-${index}`,
    user: {
      id: `user-${index}`,
      name: `会话 ${index}`,
      status: AgentStatusEnum.Online,
    },
    lastMessage: `最后消息 ${index}`,
    lastMessageTime: new Date(1_770_000_000_000 + index * 1_000).toISOString(),
    unreadCount: 0,
    channel: ChannelTypeEnum.WhatsApp,
  };
}

describe('ConversationList', () => {
  it('当会话处于 creating 状态时应渲染 skeleton 占位项', () => {
    const conversations: Conversation[] = [
      {
        id: 'creating:whatsapp:1',
        user: {
          id: 'creating-user',
          name: '',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
        metadata: {
          localState: 'creating',
          pendingSource: 'create',
        },
      },
      {
        id: 'conv-1',
        user: {
          id: 'user-1',
          name: '真实会话',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '最后一条消息',
        lastMessageTime: new Date(1_770_000_010_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
      },
    ];

    render(
      <ConversationList
        autoFetch={false}
        enableVirtualization={false}
        conversations={conversations}
      />,
    );

    expect(
      screen.getByTestId('conversation-item-skeleton'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('conversation-item-conv-1')).toBeInTheDocument();
  });

  it('长列表启用虚拟滚动且 renderItemMeta 显著增高时，后续项间距不应仍按固定 78px 估算', () => {
    const conversations = Array.from({ length: 20 }, (_, index) =>
      createConversation(index + 1),
    );

    render(
      <ConversationList
        autoFetch={false}
        conversations={conversations}
        enableVirtualization={true}
        renderItemMeta={(conversation) =>
          conversation.id === 'conv-1' ? (
            <div>
              <div>第一行 meta</div>
              <div>第二行 meta</div>
              <div>第三行 meta</div>
              <div>第四行 meta</div>
            </div>
          ) : null
        }
      />,
    );

    const firstItem = screen.getByTestId('conversation-item-conv-1');
    const secondItem = screen.getByTestId('conversation-item-conv-2');

    const firstWrapper = firstItem.parentElement;
    const secondWrapper = secondItem.parentElement;

    expect(firstWrapper).not.toBeNull();
    expect(secondWrapper).not.toBeNull();

    const firstHeight = Number.parseInt(firstItem.style.height, 10);
    const secondTranslateY = Number.parseInt(
      secondWrapper?.style.transform.match(/translateY\((\d+)px\)/)?.[1] ?? '0',
      10,
    );

    expect(firstHeight).toBeGreaterThan(78);
    expect(secondTranslateY).toBeGreaterThanOrEqual(firstHeight + 4);
  });
});
