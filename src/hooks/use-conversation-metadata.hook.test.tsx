import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { useConversationMetadata } from './use-conversation-metadata.hook';

const { detailQueryRef, findConversationMock, queryClientRef } = vi.hoisted(
  () => ({
    detailQueryRef: {
      current: {
        data: undefined as Conversation | null | undefined,
        isLoading: false,
      },
    },
    findConversationMock: vi.fn(),
    queryClientRef: {
      current: {},
    },
  }),
);

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );

  return {
    ...actual,
    useQueryClient: () => queryClientRef.current,
  };
});

vi.mock('@/services/cache/conversation-cache-helper.service', () => ({
  ConversationCacheHelper: {
    findConversation: findConversationMock,
  },
}));

vi.mock('./use-conversation-detail.hook', () => ({
  useConversationDetail: () => detailQueryRef.current,
}));

function createConversation(overrides?: Partial<Conversation>): Conversation {
  return {
    id: 'conv-1',
    user: {
      id: 'user-1',
      name: '张三',
      status: AgentStatusEnum.Online,
    },
    lastMessage: 'hello',
    lastMessageTime: new Date('2026-03-26T09:00:00.000Z').toISOString(),
    unreadCount: 0,
    channel: ChannelTypeEnum.WhatsApp,
    metadata: {},
    ...overrides,
  };
}

describe('useConversationMetadata', () => {
  beforeEach(() => {
    detailQueryRef.current = {
      data: undefined,
      isLoading: false,
    };
    findConversationMock.mockReset();
  });

  it('应保留详情接口明确返回的空 supportedChannels', () => {
    detailQueryRef.current = {
      data: createConversation({
        supportedChannels: [],
      }),
      isLoading: false,
    };

    const { result } = renderHook(() => useConversationMetadata('conv-1'));

    expect(result.current.data?.supportedChannels).toEqual([]);
  });

  it('详情未返回前应忽略列表缓存中的空 supportedChannels', () => {
    detailQueryRef.current = {
      data: undefined,
      isLoading: true,
    };
    findConversationMock.mockReturnValue(
      createConversation({
        supportedChannels: [],
      }),
    );

    const { result } = renderHook(() => useConversationMetadata('conv-1'));

    expect(result.current.data?.supportedChannels).toBeUndefined();
  });

  it('详情未返回前应忽略列表缓存中的非空 supportedChannels', () => {
    detailQueryRef.current = {
      data: undefined,
      isLoading: true,
    };
    findConversationMock.mockReturnValue(
      createConversation({
        supportedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.Email],
        metadata: {
          customerName: '缓存里的张三',
        },
      }),
    );

    const { result } = renderHook(() => useConversationMetadata('conv-1'));

    expect(result.current.data).toMatchObject({
      customerName: '缓存里的张三',
      supportedChannels: undefined,
    });
  });
});
