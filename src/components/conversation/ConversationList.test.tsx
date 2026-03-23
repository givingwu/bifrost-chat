import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationList } from './ConversationList';

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/store', () => ({
  useActiveConversationId: () => null,
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
  ConversationItem: ({ conversation }: { conversation: Conversation }) => (
    <div data-testid={`conversation-item-${conversation.id}`}>
      {conversation.user.name}
    </div>
  ),
}));

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
});
