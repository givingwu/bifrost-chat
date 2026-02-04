import type { Meta, StoryObj } from '@storybook/react';
import { ChatMessageList } from '@/components/messages/ChatMessageList';
import { ChannelType } from '@/interfaces/channel.interface';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
  type StandardMessage,
} from '@/interfaces/message.interface';

/**
 * ChatMessageList 组件 Story 文档
 *
 * 展示消息列表的各种用法：
 * - 不同数量的消息
 * - 不同消息类型
 * - 不同方向
 */

const meta: Meta<typeof ChatMessageList> = {
  title: 'Messages/ChatMessageList',
  component: ChatMessageList,
  tags: ['autodocs'],
  argTypes: {
    messages: {
      control: 'object',
      description: '消息列表',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatMessageList>;

const createMessage = (
  direction: MessageDirection,
  type: MessageType,
  status: MessageStatus,
  content: StandardMessage['content'],
  timestamp?: number,
): StandardMessage => ({
  id: `msg-${Math.random()}`,
  direction,
  channelType: ChannelType.WhatsApp,
  status,
  timestamp: timestamp || Date.now(),
  type,
  content,
});

const mockMessages: StandardMessage[] = [
  createMessage(
    MessageDirection.Incoming,
    MessageType.Text,
    MessageStatus.Sent,
    { text: 'Hi! How are you?' },
  ),
  createMessage(
    MessageDirection.Outgoing,
    MessageType.Text,
    MessageStatus.Read,
    { text: 'I am doing well, thanks!' },
  ),
  createMessage(
    MessageDirection.Incoming,
    MessageType.Text,
    MessageStatus.Sent,
    { text: 'Can you help me with something?' },
  ),
];

/**
 * 基础示例 - 默认消息列表
 */
export const Default = () => {
  return (
    <div className="w-96 h-96">
      <ChatMessageList messages={mockMessages} />
    </div>
  );
};

/**
 * 空列表 - 无消息时
 */
export const Empty = () => {
  return (
    <div className="w-96 h-96">
      <ChatMessageList messages={[]} />
    </div>
  );
};

/**
 * 长列表 - 展示多条消息
 */
export const LongList = () => {
  const messages: StandardMessage[] = Array.from({ length: 20 }, (_, i) => {
    const isIncoming = i % 2 === 0;
    return createMessage(
      isIncoming ? MessageDirection.Incoming : MessageDirection.Outgoing,
      MessageType.Text,
      MessageStatus.Sent,
      { text: `Message ${i + 1}` },
      Date.now() - (20 - i) * 1000 * 60 * 5,
    );
  });

  return (
    <div className="w-96 h-96 overflow-y-auto">
      <ChatMessageList messages={messages} />
    </div>
  );
};

/**
 * 不同类型 - 展示各种消息类型
 */
export const DifferentTypes = () => {
  const messages: StandardMessage[] = [
    createMessage(
      MessageDirection.Incoming,
      MessageType.Text,
      MessageStatus.Sent,
      { text: 'This is a text message' },
    ),
    createMessage(
      MessageDirection.Outgoing,
      MessageType.Image,
      MessageStatus.Sent,
      {
        url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=300',
        mimeType: 'image/jpeg',
      },
    ),
    createMessage(
      MessageDirection.Incoming,
      MessageType.Text,
      MessageStatus.Sent,
      { text: 'Thanks for the image!' },
    ),
  ];

  return (
    <div className="w-96 h-96 overflow-y-auto">
      <ChatMessageList messages={messages} />
    </div>
  );
};

/**
 * 对话流 - 展示完整对话
 */
export const ConversationFlow = () => {
  const messages: StandardMessage[] = [
    createMessage(
      MessageDirection.Incoming,
      MessageType.Text,
      MessageStatus.Sent,
      { text: 'Hello! I need help with my order.' },
      Date.now() - 1000 * 60 * 60 * 2,
    ),
    createMessage(
      MessageDirection.Outgoing,
      MessageType.Text,
      MessageStatus.Read,
      { text: 'Sure! What is your order number?' },
      Date.now() - 1000 * 60 * 55,
    ),
    createMessage(
      MessageDirection.Incoming,
      MessageType.Text,
      MessageStatus.Sent,
      { text: 'It is #12345' },
      Date.now() - 1000 * 60 * 30,
    ),
    createMessage(
      MessageDirection.Outgoing,
      MessageType.Text,
      MessageStatus.Delivered,
      { text: 'Let me check that for you...' },
      Date.now() - 1000 * 60 * 5,
    ),
  ];

  return (
    <div className="w-96 h-96 overflow-y-auto">
      <ChatMessageList messages={messages} />
    </div>
  );
};

/**
 * 不同状态 - 展示各种消息状态
 */
export const DifferentStatuses = () => {
  const statuses = [
    MessageStatus.Sending,
    MessageStatus.Sent,
    MessageStatus.Delivered,
    MessageStatus.Read,
    MessageStatus.Failed,
  ];

  const messages: StandardMessage[] = statuses.map((status) =>
    createMessage(MessageDirection.Outgoing, MessageType.Text, status, {
      text: `Message status: ${status}`,
    }),
  );

  return (
    <div className="w-96 h-96 overflow-y-auto">
      <ChatMessageList messages={messages} />
    </div>
  );
};
