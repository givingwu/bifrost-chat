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
import {
  applyMessageProjection,
  buildSyntheticConversation,
  buildSyntheticUser,
  getPreviewText,
} from './conversation-projection.service';

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

function createConversation(
  id: string,
  overrides?: Partial<Conversation>,
): Conversation {
  return {
    id,
    user: {
      id: `${id}-user`,
      name: `${id}-name`,
      status: AgentStatusEnum.Offline,
      ...(overrides?.user ?? {}),
    },
    lastMessage: `${id}-last-message`,
    lastMessageTime: new Date(1_770_000_000_000).toISOString(),
    unreadCount: 0,
    channel: ChannelTypeEnum.WhatsApp,
    ...overrides,
  };
}

describe('conversationProjection', () => {
  it('buildSyntheticUser 应根据消息方向选择正确的参与方', () => {
    const incomingUser = buildSyntheticUser(
      createMessage('incoming', {
        direction: MessageDirectionEnum.Incoming,
        sender: { app: 'customer-app', pin: '13800000000' },
        receiver: { app: 'agent-app', pin: 'agent-1' },
        metadata: {
          senderName: '张三',
          senderAvatarUrl: 'https://example.com/sender.png',
        },
      }),
    );

    expect(incomingUser).toEqual({
      id: '13800000000',
      name: '张三',
      avatarUrl: 'https://example.com/sender.png',
      status: AgentStatusEnum.Offline,
      email: undefined,
      phone: '13800000000',
    });

    const outgoingUser = buildSyntheticUser(
      createMessage('outgoing', {
        direction: MessageDirectionEnum.Outgoing,
        sender: { app: 'agent-app', pin: 'agent-1' },
        receiver: { app: 'customer-app', pin: 'customer@example.com' },
        metadata: {
          receiverName: '李四',
          receiverAvatarUrl: 'https://example.com/receiver.png',
        },
      }),
    );

    expect(outgoingUser).toEqual({
      id: 'customer@example.com',
      name: '李四',
      avatarUrl: 'https://example.com/receiver.png',
      status: AgentStatusEnum.Offline,
      email: 'customer@example.com',
      phone: undefined,
    });
  });

  it('getPreviewText 应在缺少正文时使用类型兜底文案', () => {
    expect(
      getPreviewText(
        createMessage('preview', {
          type: MessageTypeEnum.Image,
          content: { text: '   ', address: '', desc: '' },
        }),
      ),
    ).toBe('[image]');
  });

  it('buildSyntheticConversation 应生成可直接渲染的临时会话', () => {
    const message = createMessage('synthetic-message', {
      conversationId: 'conv-synthetic',
      timestamp: 1_770_000_001_000,
      content: { text: '客户发来新消息' },
      metadata: {
        senderName: '李四',
        senderAvatarUrl: 'https://example.com/avatar.png',
      },
    });

    expect(buildSyntheticConversation(message)).toEqual({
      id: 'conv-synthetic',
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
        seedMessageId: 'synthetic-message',
        peerApp: 'customer-app',
        peerPin: '13800000000',
      },
    });
  });

  it('applyMessageProjection 应保留更丰富的用户和元数据并更新摘要', () => {
    const existingConversation = createConversation('conv-existing', {
      user: {
        id: 'customer@example.com',
        name: '已存在客户',
        avatarUrl: 'https://example.com/existing-avatar.png',
        status: AgentStatusEnum.Online,
        email: 'customer@example.com',
        phone: '13800000000',
        role: 'vip',
        tags: ['gold'],
      },
      unreadCount: 8,
      supportedChannels: [ChannelTypeEnum.WhatsApp],
      metadata: {
        synthetic: false,
        owner: 'agent-1',
      },
    });

    const projected = applyMessageProjection(
      existingConversation,
      createMessage('msg-projection', {
        conversationId: 'conv-existing',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.Email,
        timestamp: 1_770_000_002_000,
        content: { text: '最新邮件消息' },
        sender: { app: 'mail-app', pin: 'agent-1' },
        receiver: { app: 'mail-app', pin: 'customer@example.com' },
        metadata: {
          receiverName: '客户新名字',
          receiverAvatarUrl: 'https://example.com/new-avatar.png',
        },
      }),
    );

    expect(projected.moveToTop).toBe(true);
    expect(projected.conversation).toMatchObject({
      id: 'conv-existing',
      user: {
        id: 'customer@example.com',
        name: '已存在客户',
        avatarUrl: 'https://example.com/existing-avatar.png',
        status: AgentStatusEnum.Online,
        email: 'customer@example.com',
        phone: '13800000000',
        role: 'vip',
        tags: ['gold'],
      },
      lastMessage: '最新邮件消息',
      lastMessageTime: new Date(1_770_000_002_000).toISOString(),
      unreadCount: 8,
      channel: ChannelTypeEnum.Email,
      supportedChannels: expect.arrayContaining([
        ChannelTypeEnum.Email,
        ChannelTypeEnum.WhatsApp,
      ]),
      metadata: {
        synthetic: false,
        owner: 'agent-1',
        peerApp: 'mail-app',
        peerPin: 'customer@example.com',
        seedMessageId: 'msg-projection',
        source: 'websocket',
      },
    });
  });

  it('applyMessageProjection 应在明确配置时允许不置顶', () => {
    const projected = applyMessageProjection(
      createConversation('conv-move', {
        unreadCount: 2,
      }),
      createMessage('msg-move', {
        conversationId: 'conv-move',
        content: { text: '新消息' },
      }),
      {
        moveToTop: false,
      },
    );

    expect(projected.moveToTop).toBe(false);
    expect(projected.conversation.id).toBe('conv-move');
    expect(projected.conversation.lastMessage).toBe('新消息');
  });
});
