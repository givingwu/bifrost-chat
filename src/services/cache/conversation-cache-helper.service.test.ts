import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ConversationStatusEnum } from '@/interfaces/conversation.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import {
  seedConversationCache,
  seedConversationPages,
  seedPendingConversationCache,
} from '@/test-utils/conversation-cache.test-util';
import { ConversationCacheHelper } from './conversation-cache-helper.service';

function createMessage(
  id: string,
  overrides?: Partial<StandardMessage>,
): StandardMessage {
  return {
    id,
    conversationId: 'conv-1',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Sent,
    timestamp: 1_770_000_000_000,
    type: MessageTypeEnum.Text,
    content: { text: `message-${id}` },
    sender: { app: 'customer-app', pin: '13800000000' },
    receiver: { app: 'agent-app', pin: 'agent-1' },
    ...overrides,
  };
}

describe('ConversationCacheHelper', () => {
  it('应基于消息构造最小可渲染的临时会话', () => {
    const message = createMessage('msg-1', {
      conversationId: 'conv-new',
      timestamp: 1_770_000_001_000,
      content: { text: '客户发来新消息' },
      metadata: {
        senderName: '李四',
        senderAvatarUrl: 'https://example.com/avatar.png',
      },
    });

    const conversation =
      ConversationCacheHelper.buildSyntheticConversation(message);

    expect(conversation).toEqual({
      id: 'conv-new',
      user: {
        id: '13800000000',
        name: '李四',
        avatarUrl: 'https://example.com/avatar.png',
        status: AgentStatusEnum.Offline,
        email: undefined,
        phone: '13800000000',
      },
      lastMessage: '客户发来新消息',
      lastMessageTime: new Date(1_770_000_001_000).toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
      isActive: false,
      status: ConversationStatusEnum.Active,
      createdAt: new Date(1_770_000_001_000).toISOString(),
      updatedAt: new Date(1_770_000_001_000).toISOString(),
      supportedChannels: [ChannelTypeEnum.WhatsApp],
      metadata: {
        synthetic: true,
        source: 'websocket',
        seedMessageId: 'msg-1',
        peerApp: 'customer-app',
        peerPin: '13800000000',
      },
    });
  });

  it('应插入陌生会话到顶部', () => {
    const queryClient = new QueryClient();
    const message = createMessage('msg-2', {
      conversationId: 'conv-new',
      content: { text: '新的陌生会话' },
    });

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-old',
        user: {
          id: 'old-user',
          name: '旧会话',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '旧消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 3,
        channel: ChannelTypeEnum.SMS,
      },
    ]);

    ConversationCacheHelper.upsertConversationFromMessage(queryClient, message);

    const conversations = ConversationCacheHelper.getConversations(
      queryClient,
      ChannelTypeEnum.WhatsApp,
    );

    expect(conversations.map((item) => item.id)).toEqual([
      'conv-new',
      'conv-old',
    ]);
  });

  it('应更新已有会话摘要并保留更丰富的用户信息', () => {
    const queryClient = new QueryClient();
    const message = createMessage('msg-3', {
      conversationId: 'conv-existing',
      channelType: ChannelTypeEnum.Email,
      timestamp: 1_770_000_002_000,
      content: { text: '最新邮件消息' },
      sender: { app: 'mail-app', pin: 'customer@example.com' },
    });

    seedConversationCache(queryClient, ChannelTypeEnum.Email, [
      {
        id: 'conv-other',
        user: {
          id: 'other-user',
          name: '其他会话',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '其他消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.SMS,
      },
      {
        id: 'conv-existing',
        user: {
          id: 'customer@example.com',
          name: '已存在客户',
          avatarUrl: 'https://example.com/existing-avatar.png',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '老消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 8,
        channel: ChannelTypeEnum.WhatsApp,
        supportedChannels: [ChannelTypeEnum.WhatsApp],
        metadata: {
          synthetic: false,
          owner: 'agent-1',
        },
      },
    ]);

    ConversationCacheHelper.upsertConversationFromMessage(queryClient, message);

    const conversations = ConversationCacheHelper.getConversations(
      queryClient,
      ChannelTypeEnum.Email,
    );
    const updatedConversation = conversations[0];

    expect(updatedConversation?.id).toBe('conv-existing');
    expect(updatedConversation?.user.name).toBe('已存在客户');
    expect(updatedConversation?.user.avatarUrl).toBe(
      'https://example.com/existing-avatar.png',
    );
    expect(updatedConversation?.user.status).toBe(AgentStatusEnum.Online);
    expect(updatedConversation?.lastMessage).toBe('最新邮件消息');
    expect(updatedConversation?.lastMessageTime).toBe(
      new Date(1_770_000_002_000).toISOString(),
    );
    expect(updatedConversation?.unreadCount).toBe(8);
    expect(updatedConversation?.channel).toBe(ChannelTypeEnum.Email);
    expect(updatedConversation?.supportedChannels).toEqual(
      expect.arrayContaining([ChannelTypeEnum.Email, ChannelTypeEnum.WhatsApp]),
    );
    expect(updatedConversation?.metadata).toEqual({
      synthetic: false,
      owner: 'agent-1',
      peerApp: 'mail-app',
      peerPin: 'customer@example.com',
      seedMessageId: 'msg-3',
      source: 'websocket',
    });
  });

  it('权威详情更新应覆盖 user.status 与 unreadCount=0', () => {
    const queryClient = new QueryClient();

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-authoritative-detail',
        user: {
          id: 'detail-user',
          name: '原始详情',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '旧详情',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 5,
        channel: ChannelTypeEnum.WhatsApp,
      },
    ]);

    ConversationCacheHelper.cacheConversation(queryClient, {
      id: 'conv-authoritative-detail',
      user: {
        id: 'detail-user',
        name: '权威详情',
        status: AgentStatusEnum.Online,
      },
      lastMessage: '新详情',
      lastMessageTime: new Date(1_770_000_100_000).toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
    });

    const fromList = ConversationCacheHelper.getConversations(
      queryClient,
      ChannelTypeEnum.WhatsApp,
    )[0];
    const fromDetail = ConversationCacheHelper.getConversationDetail(
      queryClient,
      'conv-authoritative-detail',
    );

    expect(fromList).toMatchObject({
      id: 'conv-authoritative-detail',
      unreadCount: 0,
      user: {
        status: AgentStatusEnum.Online,
      },
    });
    expect(fromDetail).toMatchObject({
      id: 'conv-authoritative-detail',
      unreadCount: 0,
      user: {
        status: AgentStatusEnum.Online,
      },
    });
  });

  it('权威详情返回空 supportedChannels 时不应回退到旧缓存值', () => {
    const queryClient = new QueryClient();

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-empty-supported-channels',
        user: {
          id: 'detail-user',
          name: '原始详情',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '旧详情',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 5,
        channel: ChannelTypeEnum.WhatsApp,
        supportedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.Email],
      },
    ]);

    ConversationCacheHelper.cacheConversation(queryClient, {
      id: 'conv-empty-supported-channels',
      user: {
        id: 'detail-user',
        name: '权威详情',
        status: AgentStatusEnum.Online,
      },
      lastMessage: '新详情',
      lastMessageTime: new Date(1_770_000_100_000).toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
      supportedChannels: [],
    });

    const fromList = ConversationCacheHelper.getConversations(
      queryClient,
      ChannelTypeEnum.WhatsApp,
    )[0];
    const fromDetail = ConversationCacheHelper.getConversationDetail(
      queryClient,
      'conv-empty-supported-channels',
    );

    expect(fromList?.supportedChannels).toEqual([]);
    expect(fromDetail?.supportedChannels).toEqual([]);
  });

  it('已有空 supportedChannels 时消息投影不应自动补回当前渠道', () => {
    const queryClient = new QueryClient();

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-empty-supported-channels',
        user: {
          id: 'customer@example.com',
          name: '已存在客户',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '老消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 8,
        channel: ChannelTypeEnum.WhatsApp,
        supportedChannels: [],
      },
    ]);

    const message = createMessage('msg-empty-supported', {
      conversationId: 'conv-empty-supported-channels',
      channelType: ChannelTypeEnum.WhatsApp,
      timestamp: 1_770_000_002_000,
      content: { text: '最新消息' },
      sender: { app: 'mail-app', pin: 'customer@example.com' },
    });

    ConversationCacheHelper.upsertConversationFromMessage(queryClient, message);

    const updatedConversation = ConversationCacheHelper.getConversations(
      queryClient,
      ChannelTypeEnum.WhatsApp,
    )[0];

    expect(updatedConversation?.supportedChannels).toEqual([]);
  });

  it('列表 metadata 空字符串不应覆盖详情拉取的非空字段', () => {
    const queryClient = new QueryClient();

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-merge-meta',
        user: {
          id: 'pin-1',
          name: '列表名',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: 'hi',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 1,
        channel: ChannelTypeEnum.WhatsApp,
        metadata: {
          name: '',
          assetFromApp: '',
          owner: 'kept-from-list',
        },
      },
    ]);

    ConversationCacheHelper.cacheConversation(queryClient, {
      id: 'conv-merge-meta',
      user: {
        id: 'pin-1',
        name: '详情名',
        status: AgentStatusEnum.Offline,
      },
      lastMessage: 'hi',
      lastMessageTime: new Date(1_770_000_000_000).toISOString(),
      unreadCount: 1,
      channel: ChannelTypeEnum.WhatsApp,
      metadata: {
        name: '张三',
        assetFromApp: 'example.chat',
        customerPin: 'pin-1',
      },
    });

    const fromList = ConversationCacheHelper.getConversations(
      queryClient,
      ChannelTypeEnum.WhatsApp,
    )[0];
    const fromDetail = ConversationCacheHelper.getConversationDetail(
      queryClient,
      'conv-merge-meta',
    );

    expect(fromList?.metadata).toMatchObject({
      name: '张三',
      assetFromApp: 'example.chat',
      customerPin: 'pin-1',
      owner: 'kept-from-list',
    });
    expect(fromDetail?.metadata).toEqual(fromList?.metadata);
  });

  it('应支持直接增加和清空会话未读数', () => {
    const queryClient = new QueryClient();

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-unread',
        user: {
          id: 'user-unread',
          name: '未读会话',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '未读消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 2,
        channel: ChannelTypeEnum.WhatsApp,
      },
    ]);

    ConversationCacheHelper.incrementUnread(
      queryClient,
      'conv-unread',
      ChannelTypeEnum.WhatsApp,
    );
    expect(
      ConversationCacheHelper.getConversations(
        queryClient,
        ChannelTypeEnum.WhatsApp,
      )[0]?.unreadCount,
    ).toBe(3);

    ConversationCacheHelper.clearUnread(
      queryClient,
      'conv-unread',
      ChannelTypeEnum.WhatsApp,
    );
    expect(
      ConversationCacheHelper.getConversations(
        queryClient,
        ChannelTypeEnum.WhatsApp,
      )[0]?.unreadCount,
    ).toBe(0);
  });

  it('权威单会话更新应覆盖现有 unreadCount', () => {
    const queryClient = new QueryClient();

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-authoritative',
        user: {
          id: 'authoritative-user',
          name: '原会话',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '旧摘要',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 6,
        channel: ChannelTypeEnum.WhatsApp,
      },
    ]);

    ConversationCacheHelper.replaceConversation(
      queryClient,
      {
        id: 'conv-authoritative',
        user: {
          id: 'authoritative-user',
          name: '原会话',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '新摘要',
        lastMessageTime: new Date(1_770_000_100_000).toISOString(),
        unreadCount: 1,
        channel: ChannelTypeEnum.Email,
      },
      ChannelTypeEnum.WhatsApp,
    );

    expect(
      ConversationCacheHelper.getConversations(
        queryClient,
        ChannelTypeEnum.WhatsApp,
      )[0],
    ).toMatchObject({
      id: 'conv-authoritative',
      unreadCount: 1,
      lastMessage: '新摘要',
      channel: ChannelTypeEnum.Email,
    });
  });

  it('多页会话置顶时不应残留后续页副本', () => {
    const queryClient = new QueryClient();

    seedConversationPages(queryClient, ChannelTypeEnum.WhatsApp, [
      [
        {
          id: 'conv-a',
          user: {
            id: 'user-a',
            name: '会话A',
            status: AgentStatusEnum.Offline,
          },
          lastMessage: 'A',
          lastMessageTime: new Date(1_770_000_000_000).toISOString(),
          unreadCount: 1,
          channel: ChannelTypeEnum.WhatsApp,
        },
        {
          id: 'conv-b',
          user: {
            id: 'user-b',
            name: '会话B',
            status: AgentStatusEnum.Offline,
          },
          lastMessage: 'B',
          lastMessageTime: new Date(1_770_000_001_000).toISOString(),
          unreadCount: 2,
          channel: ChannelTypeEnum.WhatsApp,
        },
      ],
      [
        {
          id: 'conv-c',
          user: {
            id: 'user-c',
            name: '会话C',
            status: AgentStatusEnum.Offline,
          },
          lastMessage: 'C',
          lastMessageTime: new Date(1_770_000_002_000).toISOString(),
          unreadCount: 3,
          channel: ChannelTypeEnum.WhatsApp,
        },
        {
          id: 'conv-d',
          user: {
            id: 'user-d',
            name: '会话D',
            status: AgentStatusEnum.Offline,
          },
          lastMessage: 'D',
          lastMessageTime: new Date(1_770_000_003_000).toISOString(),
          unreadCount: 4,
          channel: ChannelTypeEnum.WhatsApp,
        },
      ],
    ]);

    ConversationCacheHelper.replaceConversation(
      queryClient,
      {
        id: 'conv-c',
        user: {
          id: 'user-c',
          name: '会话C',
          status: AgentStatusEnum.Online,
        },
        lastMessage: 'C-最新',
        lastMessageTime: new Date(1_770_000_100_000).toISOString(),
        unreadCount: 3,
        channel: ChannelTypeEnum.WhatsApp,
      },
      ChannelTypeEnum.WhatsApp,
    );

    const listData = queryClient.getQueryData<any>(
      queryKeys.conversations.list(ChannelTypeEnum.WhatsApp),
    );
    const flattenedIds = listData.pages.flatMap(
      (page: { items: { id: string }[] }) =>
        page.items.map((conversation) => conversation.id),
    );

    expect(flattenedIds).toEqual(['conv-c', 'conv-a', 'conv-b', 'conv-d']);
    expect(new Set(flattenedIds).size).toBe(flattenedIds.length);
    expect(
      listData.pages[0].items.map((item: { id: string }) => item.id),
    ).toEqual(['conv-c', 'conv-a']);
    expect(
      listData.pages[1].items.map((item: { id: string }) => item.id),
    ).toEqual(['conv-b', 'conv-d']);
  });

  it('新增会话应只插入第一页一次', () => {
    const queryClient = new QueryClient();

    seedConversationPages(queryClient, ChannelTypeEnum.WhatsApp, [
      [
        {
          id: 'conv-a',
          user: {
            id: 'user-a',
            name: '会话A',
            status: AgentStatusEnum.Offline,
          },
          lastMessage: 'A',
          lastMessageTime: new Date(1_770_000_000_000).toISOString(),
          unreadCount: 1,
          channel: ChannelTypeEnum.WhatsApp,
        },
      ],
      [
        {
          id: 'conv-b',
          user: {
            id: 'user-b',
            name: '会话B',
            status: AgentStatusEnum.Offline,
          },
          lastMessage: 'B',
          lastMessageTime: new Date(1_770_000_001_000).toISOString(),
          unreadCount: 2,
          channel: ChannelTypeEnum.WhatsApp,
        },
      ],
    ]);

    ConversationCacheHelper.replaceConversation(
      queryClient,
      {
        id: 'conv-new',
        user: {
          id: 'user-new',
          name: '新会话',
          status: AgentStatusEnum.Online,
        },
        lastMessage: 'new',
        lastMessageTime: new Date(1_770_000_100_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
      },
      ChannelTypeEnum.WhatsApp,
    );

    const listData = queryClient.getQueryData<any>(
      queryKeys.conversations.list(ChannelTypeEnum.WhatsApp),
    );
    const flattenedIds = listData.pages.flatMap(
      (page: { items: { id: string }[] }) =>
        page.items.map((conversation) => conversation.id),
    );

    expect(flattenedIds).toEqual(['conv-new', 'conv-a', 'conv-b']);
    expect(new Set(flattenedIds).size).toBe(flattenedIds.length);
    expect(
      listData.pages[0].items.map((item: { id: string }) => item.id),
    ).toEqual(['conv-new']);
    expect(
      listData.pages[1].items.map((item: { id: string }) => item.id),
    ).toEqual(['conv-a', 'conv-b']);
  });

  it('应将 pending 会话写入独立缓存并合并到展示列表顶部', () => {
    const queryClient = new QueryClient();

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-server',
        user: {
          id: 'server-user',
          name: '服务端会话',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '服务端消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
      },
    ]);

    ConversationCacheHelper.upsertPendingConversation(
      queryClient,
      {
        id: 'conv-pending',
        user: {
          id: 'pending-user',
          name: '待确认会话',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '',
        lastMessageTime: new Date(1_770_000_010_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
        metadata: {
          debtorId: 'debtor-1',
          contactId: 'contact-1',
        },
      },
      ChannelTypeEnum.WhatsApp,
    );

    expect(
      ConversationCacheHelper.getPendingConversations(
        queryClient,
        ChannelTypeEnum.WhatsApp,
      ),
    ).toEqual([
      expect.objectContaining({
        id: 'conv-pending',
        metadata: expect.objectContaining({
          localState: 'pending_create',
          pendingSource: 'create',
          debtorId: 'debtor-1',
          contactId: 'contact-1',
        }),
      }),
    ]);

    expect(
      ConversationCacheHelper.getMergedConversations(
        queryClient,
        ChannelTypeEnum.WhatsApp,
      ).map((conversation) => conversation.id),
    ).toEqual(['conv-pending', 'conv-server']);
  });

  it('服务端列表确认后应移除对应 pending 会话', () => {
    const queryClient = new QueryClient();

    seedPendingConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-confirmed',
        user: {
          id: 'pending-user',
          name: '待确认会话',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '',
        lastMessageTime: new Date(1_770_000_010_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
        metadata: {
          localState: 'pending_create',
          pendingSince: new Date(1_770_000_010_000).toISOString(),
          pendingSource: 'create',
        },
      },
    ]);

    ConversationCacheHelper.replaceConversationList(
      queryClient,
      [
        {
          id: 'conv-confirmed',
          user: {
            id: 'server-user',
            name: '正式会话',
            status: AgentStatusEnum.Offline,
          },
          lastMessage: '服务端消息',
          lastMessageTime: new Date(1_770_000_020_000).toISOString(),
          unreadCount: 1,
          channel: ChannelTypeEnum.WhatsApp,
        },
      ],
      ChannelTypeEnum.WhatsApp,
    );

    expect(
      ConversationCacheHelper.getPendingConversations(
        queryClient,
        ChannelTypeEnum.WhatsApp,
      ),
    ).toEqual([]);
    expect(
      ConversationCacheHelper.getMergedConversations(
        queryClient,
        ChannelTypeEnum.WhatsApp,
      ),
    ).toEqual([
      expect.objectContaining({
        id: 'conv-confirmed',
        lastMessage: '服务端消息',
      }),
    ]);
  });

  it('replaceConversationList 应重置为第一页快照并保持 pages/pageParams 一致', () => {
    const queryClient = new QueryClient();

    seedConversationPages(queryClient, ChannelTypeEnum.WhatsApp, [
      [
        {
          id: 'conv-old-a',
          user: {
            id: 'user-old-a',
            name: '旧A',
            status: AgentStatusEnum.Offline,
          },
          lastMessage: '旧A',
          lastMessageTime: new Date(1_770_000_000_000).toISOString(),
          unreadCount: 1,
          channel: ChannelTypeEnum.WhatsApp,
        },
      ],
      [
        {
          id: 'conv-old-b',
          user: {
            id: 'user-old-b',
            name: '旧B',
            status: AgentStatusEnum.Offline,
          },
          lastMessage: '旧B',
          lastMessageTime: new Date(1_770_000_001_000).toISOString(),
          unreadCount: 2,
          channel: ChannelTypeEnum.WhatsApp,
        },
      ],
    ]);

    ConversationCacheHelper.replaceConversationList(
      queryClient,
      [
        {
          id: 'conv-new-a',
          user: {
            id: 'user-new-a',
            name: '新A',
            status: AgentStatusEnum.Online,
          },
          lastMessage: '新A',
          lastMessageTime: new Date(1_770_000_100_000).toISOString(),
          unreadCount: 0,
          channel: ChannelTypeEnum.WhatsApp,
        },
        {
          id: 'conv-new-b',
          user: {
            id: 'user-new-b',
            name: '新B',
            status: AgentStatusEnum.Offline,
          },
          lastMessage: '新B',
          lastMessageTime: new Date(1_770_000_101_000).toISOString(),
          unreadCount: 3,
          channel: ChannelTypeEnum.WhatsApp,
        },
      ],
      ChannelTypeEnum.WhatsApp,
    );

    const listData = queryClient.getQueryData<any>(
      queryKeys.conversations.list(ChannelTypeEnum.WhatsApp),
    );

    expect(listData).toEqual({
      pages: [
        {
          items: [
            expect.objectContaining({ id: 'conv-new-a' }),
            expect.objectContaining({ id: 'conv-new-b' }),
          ],
          nextCursor: undefined,
        },
      ],
      pageParams: [1],
    });
    expect(
      ConversationCacheHelper.getConversationDetail(queryClient, 'conv-new-a'),
    ).toMatchObject({ id: 'conv-new-a', unreadCount: 0 });
  });

  it('重复写入同一个 pending 会话时应保持该会话位于顶部', () => {
    const queryClient = new QueryClient();

    seedPendingConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-other',
        user: {
          id: 'other-user',
          name: '其他待确认会话',
          status: AgentStatusEnum.Offline,
        },
        lastMessage: '',
        lastMessageTime: new Date(1_770_000_005_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
        metadata: {
          localState: 'pending_create',
          pendingSince: new Date(1_770_000_005_000).toISOString(),
          pendingSource: 'create',
        },
      },
      {
        id: 'conv-active',
        user: {
          id: 'active-user',
          name: '当前活跃 pending',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '',
        lastMessageTime: new Date(1_770_000_001_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
        metadata: {
          localState: 'pending_create',
          pendingSince: new Date(1_770_000_001_000).toISOString(),
          pendingSource: 'create',
          debtorId: 'debtor-1',
          contactId: 'contact-1',
        },
      },
    ]);

    ConversationCacheHelper.upsertPendingConversation(
      queryClient,
      {
        id: 'conv-active',
        user: {
          id: 'active-user',
          name: '当前活跃 pending',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '',
        lastMessageTime: new Date(1_770_000_100_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
        metadata: {
          debtorId: 'debtor-1',
          contactId: 'contact-1',
        },
      },
      ChannelTypeEnum.WhatsApp,
    );

    expect(
      ConversationCacheHelper.getPendingConversations(
        queryClient,
        ChannelTypeEnum.WhatsApp,
      ).map((conversation) => conversation.id),
    ).toEqual(['conv-active', 'conv-other']);
  });
});
