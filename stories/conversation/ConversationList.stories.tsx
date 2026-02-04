import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ConversationList } from '@/components/conversation/ConversationList';
import { AgentStatus } from '@/interfaces/agent.interface';
import { ChannelType } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import '@/styles/theme.css';

/**
 * ConversationList 组件 Story 文档
 *
 * 展示会话列表的各种用法：
 * - 不同数量的会话
 * - 不同渠道的会话
 * - 激活状态
 * - 未读消息数
 */

const meta: Meta<typeof ConversationList> = {
  title: 'Conversation/ConversationList',
  component: ConversationList,
  tags: ['autodocs'],
  argTypes: {
    conversations: {
      control: 'object',
      description: '会话列表',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConversationList>;

const mockConversations: Conversation[] = [
  {
    id: '1',
    user: {
      id: 'user-1',
      name: 'Liam Walker',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      status: AgentStatus.Online,
    },
    lastMessage: 'Thanks for the update! 👋',
    lastMessageTime: '09:42 AM',
    unreadCount: 2,
    channel: ChannelType.WhatsApp,
    isActive: true,
  },
  {
    id: '2',
    user: {
      id: 'user-2',
      name: 'Sophia Reed',
      avatarUrl: 'https://i.pravatar.cc/150?img=48',
      status: AgentStatus.Busy,
    },
    lastMessage: 'Need help with my order.',
    lastMessageTime: '09:10 AM',
    unreadCount: 0,
    channel: ChannelType.SMS,
  },
  {
    id: '3',
    user: {
      id: 'user-3',
      name: 'Evelyn Carter',
      avatarUrl: 'https://i.pravatar.cc/150?img=16',
      status: AgentStatus.Offline,
    },
    lastMessage: 'Invoice sent via email.',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
    channel: ChannelType.Email,
  },
];

/**
 * 基础示例 - 默认会话列表
 */
export const Default = () => {
  return (
    <div className="w-80 h-96">
      <ConversationList conversations={mockConversations} />
    </div>
  );
};

/**
 * 空列表 - 无会话时
 */
export const Empty = () => {
  return (
    <div className="w-80 h-96">
      <ConversationList conversations={[]} />
    </div>
  );
};

/**
 * 长列表 - 展示多个会话
 */
export const LongList = () => {
  const conversations: Conversation[] = Array.from({ length: 10 }, (_, i) => ({
    id: `conv-${i + 1}`,
    user: {
      id: `user-${i + 1}`,
      name: `User ${i + 1}`,
      avatarUrl: `https://i.pravatar.cc/150?img=${i + 1}`,
      status: AgentStatus.Online,
    },
    lastMessage: `Message ${i + 1}`,
    lastMessageTime: `${10 - i}:00 AM`,
    unreadCount: i % 3,
    channel: [ChannelType.SMS, ChannelType.WhatsApp, ChannelType.Email][i % 3],
    isActive: i === 0,
  }));

  return (
    <div className="w-80 h-96 overflow-y-auto">
      <ConversationList conversations={conversations} />
    </div>
  );
};

/**
 * 不同渠道 - 展示混合渠道
 */
export const MixedChannels = () => {
  const conversations: Conversation[] = [
    {
      id: '1',
      user: {
        id: 'user-1',
        name: 'Alice (SMS)',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        status: AgentStatus.Online,
      },
      lastMessage: 'SMS message here',
      lastMessageTime: '10:30 AM',
      unreadCount: 0,
      channel: ChannelType.SMS,
    },
    {
      id: '2',
      user: {
        id: 'user-2',
        name: 'Bob (WhatsApp)',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
        status: AgentStatus.Busy,
      },
      lastMessage: 'WhatsApp message here',
      lastMessageTime: '10:15 AM',
      unreadCount: 3,
      channel: ChannelType.WhatsApp,
    },
    {
      id: '3',
      user: {
        id: 'user-3',
        name: 'Carol (Email)',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
        status: AgentStatus.Offline,
      },
      lastMessage: 'Email received',
      lastMessageTime: 'Yesterday',
      unreadCount: 1,
      channel: ChannelType.Email,
    },
  ];

  return (
    <div className="w-80 h-96">
      <ConversationList conversations={conversations} />
    </div>
  );
};

/**
 * 交互示例 - 点击选择
 */
export const Interactive = () => {
  const [selectedId, setSelectedId] = useState<string>('1');

  const conversations: Conversation[] = mockConversations.map((conv) => ({
    ...conv,
    isActive: conv.id === selectedId,
  }));

  return (
    <div className="w-80 h-96">
      <ConversationList
        conversations={conversations}
        onSelect={setSelectedId}
      />
      <p className="text-xs text-text-muted mt-2">已选择: {selectedId}</p>
    </div>
  );
};

/**
 * 有未读消息 - 展示未读数
 */
export const WithUnread = () => {
  const conversations: Conversation[] = [
    {
      id: '1',
      user: {
        id: 'user-1',
        name: 'User 1',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        status: AgentStatus.Online,
      },
      lastMessage: 'New message',
      lastMessageTime: '10:30 AM',
      unreadCount: 5,
      channel: ChannelType.WhatsApp,
    },
    {
      id: '2',
      user: {
        id: 'user-2',
        name: 'User 2',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
        status: AgentStatus.Busy,
      },
      lastMessage: 'Another message',
      lastMessageTime: '10:00 AM',
      unreadCount: 99,
      channel: ChannelType.SMS,
    },
  ];

  return (
    <div className="w-80 h-96">
      <ConversationList conversations={conversations} />
    </div>
  );
};
