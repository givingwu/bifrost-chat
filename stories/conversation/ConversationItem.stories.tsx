import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ConversationItem } from '@/components/conversation/ConversationItem';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import '@/styles/theme.css';

/**
 * ConversationItem 组件 Story 文档
 *
 * 展示会话列表项的各种用法：
 * - 激活/非激活状态
 * - 不同渠道
 * - 未读消息数
 * - 不同用户状态
 */

const meta: Meta<typeof ConversationItem> = {
  title: 'Conversation/ConversationItem',
  component: ConversationItem,
  tags: ['autodocs'],
  argTypes: {
    conversation: {
      control: 'object',
      description: '会话对象',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConversationItem>;

const mockConversation: Conversation = {
  id: '1',
  user: {
    id: 'user-1',
    name: 'Liam Walker',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    status: AgentStatusEnum.Online,
  },
  lastMessage: 'Thanks for the update! 👋',
  lastMessageTime: '09:42 AM',
  unreadCount: 2,
  channel: ChannelTypeEnum.WhatsApp,
  isActive: false,
};

/**
 * 基础示例 - 非激活状态
 */
export const Default = () => {
  return (
    <div className="w-80">
      <ConversationItem
        conversation={mockConversation}
        onSelect={(id) => console.log('Selected:', id)}
      />
    </div>
  );
};

/**
 * 激活状态
 */
export const Active = () => {
  const activeConversation: Conversation = {
    ...mockConversation,
    isActive: true,
  };

  return (
    <div className="w-80">
      <ConversationItem
        conversation={activeConversation}
        onSelect={(id) => console.log('Selected:', id)}
      />
    </div>
  );
};

/**
 * 不同渠道 - 展示 SMS/WhatsApp/Email
 */
export const DifferentChannels = () => {
  const conversations: Conversation[] = [
    {
      id: '1',
      user: {
        id: 'user-1',
        name: 'Alice Smith',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        status: AgentStatusEnum.Online,
      },
      lastMessage: 'Hello via SMS',
      lastMessageTime: '10:30 AM',
      unreadCount: 0,
      channel: ChannelTypeEnum.SMS,
    },
    {
      id: '2',
      user: {
        id: 'user-2',
        name: 'Bob Johnson',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
        status: AgentStatusEnum.Busy,
      },
      lastMessage: 'WhatsApp message here',
      lastMessageTime: '10:15 AM',
      unreadCount: 3,
      channel: ChannelTypeEnum.WhatsApp,
    },
    {
      id: '3',
      user: {
        id: 'user-3',
        name: 'Carol Williams',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
        status: AgentStatusEnum.Offline,
      },
      lastMessage: 'Email received',
      lastMessageTime: 'Yesterday',
      unreadCount: 1,
      channel: ChannelTypeEnum.Email,
    },
  ];

  return (
    <div className="w-80 space-y-2">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          onSelect={(id) => console.log('Selected:', id)}
        />
      ))}
    </div>
  );
};

/**
 * 未读消息 - 展示不同未读数
 */
export const UnreadCounts = () => {
  const conversations: Conversation[] = [
    {
      ...mockConversation,
      id: '1',
      unreadCount: 1,
    },
    {
      ...mockConversation,
      id: '2',
      unreadCount: 5,
    },
    {
      ...mockConversation,
      id: '3',
      unreadCount: 99,
    },
  ];

  return (
    <div className="w-80 space-y-2">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          onSelect={(id) => console.log('Selected:', id)}
        />
      ))}
    </div>
  );
};

/**
 * 用户状态 - 展示不同在线状态
 */
export const UserStatuses = () => {
  const conversations: Conversation[] = [
    {
      ...mockConversation,
      id: '1',
      user: {
        ...mockConversation.user,
        status: AgentStatusEnum.Online,
      },
    },
    {
      ...mockConversation,
      id: '2',
      user: {
        ...mockConversation.user,
        status: AgentStatusEnum.Busy,
      },
    },
    {
      ...mockConversation,
      id: '3',
      user: {
        ...mockConversation.user,
        status: AgentStatusEnum.Offline,
      },
    },
  ];

  return (
    <div className="w-80 space-y-2">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          onSelect={(id) => console.log('Selected:', id)}
        />
      ))}
    </div>
  );
};

/**
 * 交互示例 - 点击选择
 */
export const Interactive = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const conversations: Conversation[] = [
    {
      ...mockConversation,
      id: '1',
      isActive: selectedId === '1',
    },
    {
      ...mockConversation,
      id: '2',
      isActive: selectedId === '2',
    },
    {
      ...mockConversation,
      id: '3',
      isActive: selectedId === '3',
    },
  ];

  return (
    <div className="w-80 space-y-2">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          onSelect={setSelectedId}
        />
      ))}
      <p className="text-sm text-text-muted mt-4">
        已选择: {selectedId || '无'}
      </p>
    </div>
  );
};

/**
 * 长消息 - 测试消息截断
 */
export const LongMessage = () => {
  const longMessageConversation: Conversation = {
    ...mockConversation,
    lastMessage:
      'This is a very long message that should be truncated with line-clamp-2 to show how the component handles overflow text content properly.',
  };

  return (
    <div className="w-80">
      <ConversationItem
        conversation={longMessageConversation}
        onSelect={(id) => console.log('Selected:', id)}
      />
    </div>
  );
};
