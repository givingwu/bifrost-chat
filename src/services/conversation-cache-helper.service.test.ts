import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  type Conversation,
  ConversationStatusEnum,
} from '@/interfaces/conversation.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
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

    queryClient.setQueryData<Conversation[]>(queryKeys.conversations.list(), [
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

    const conversations = queryClient.getQueryData<Conversation[]>(
      queryKeys.conversations.list(),
    );

    expect(conversations?.map((item) => item.id)).toEqual([
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

    queryClient.setQueryData<Conversation[]>(queryKeys.conversations.list(), [
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

    const conversations = queryClient.getQueryData<Conversation[]>(
      queryKeys.conversations.list(),
    );
    const updatedConversation = conversations?.[0];

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
});
