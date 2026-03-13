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
import {
  seedConversationCache,
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
    expect(updatedConversation?.supportedChannels).toEqual([
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.Email,
    ]);
    expect(updatedConversation?.metadata).toEqual({
      synthetic: false,
      owner: 'agent-1',
    });
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
});
