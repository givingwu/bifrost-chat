import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { MessageList } from '@/components/messages/MessageList';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';

/**
 * MessageList 组件 Story 文档
 *
 * 展示消息列表的各种用法：
 * - 不同数量的消息
 * - 不同消息类型
 * - 不同方向
 */

const meta: Meta<typeof MessageList> = {
  title: 'Messages/MessageList',
  component: MessageList,
  tags: ['autodocs'],
  argTypes: {
    messages: {
      control: 'object',
      description: '消息列表',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageList>;

const createMessage = (
  direction: MessageDirectionEnum,
  type: MessageTypeEnum,
  status: MessageStatusEnum,
  content: StandardMessage['content'],
  timestamp?: number,
): StandardMessage => ({
  id: `msg-${Math.random()}`,
  conversationId: 'conv-story-default',
  direction,
  channelType: ChannelTypeEnum.WhatsApp,
  status,
  timestamp: timestamp || Date.now(),
  type,
  content,
  sender: { app: 'sender-app', pin: 'sender-pin' },
  receiver: { app: 'receiver-app', pin: 'receiver-pin' },
});

const mockMessages: StandardMessage[] = [
  createMessage(
    MessageDirectionEnum.Incoming,
    MessageTypeEnum.Text,
    MessageStatusEnum.Sent,
    { text: 'Hi! How are you?' },
  ),
  createMessage(
    MessageDirectionEnum.Outgoing,
    MessageTypeEnum.Text,
    MessageStatusEnum.Read,
    { text: 'I am doing well, thanks!' },
  ),
  createMessage(
    MessageDirectionEnum.Incoming,
    MessageTypeEnum.Text,
    MessageStatusEnum.Sent,
    { text: 'Can you help me with something?' },
  ),
];

/**
 * 基础示例 - 默认消息列表
 */
export const Default = () => {
  return (
    <div className="w-96 h-96">
      <MessageList messages={mockMessages} />
    </div>
  );
};

/**
 * 空列表 - 无消息时
 */
export const Empty = () => {
  return (
    <div className="w-96 h-96">
      <MessageList messages={[]} />
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
      isIncoming
        ? MessageDirectionEnum.Incoming
        : MessageDirectionEnum.Outgoing,
      MessageTypeEnum.Text,
      MessageStatusEnum.Sent,
      { text: `Message ${i + 1}` },
      Date.now() - (20 - i) * 1000 * 60 * 5,
    );
  });

  return (
    <div className="w-96 h-96 overflow-y-auto">
      <MessageList messages={messages} />
    </div>
  );
};

/**
 * 不同类型 - 展示各种消息类型
 */
export const DifferentTypes = () => {
  const messages: StandardMessage[] = [
    createMessage(
      MessageDirectionEnum.Incoming,
      MessageTypeEnum.Text,
      MessageStatusEnum.Sent,
      { text: 'This is a text message' },
    ),
    createMessage(
      MessageDirectionEnum.Outgoing,
      MessageTypeEnum.Image,
      MessageStatusEnum.Sent,
      {
        url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=300',
        mimeType: 'image/jpeg',
      },
    ),
    createMessage(
      MessageDirectionEnum.Incoming,
      MessageTypeEnum.Text,
      MessageStatusEnum.Sent,
      { text: 'Thanks for the image!' },
    ),
  ];

  return (
    <div className="w-96 h-96 overflow-y-auto">
      <MessageList messages={messages} />
    </div>
  );
};

/**
 * 对话流 - 展示完整对话
 */
export const ConversationFlow = () => {
  const messages: StandardMessage[] = [
    createMessage(
      MessageDirectionEnum.Incoming,
      MessageTypeEnum.Text,
      MessageStatusEnum.Sent,
      { text: 'Hello! I need help with my order.' },
      Date.now() - 1000 * 60 * 60 * 2,
    ),
    createMessage(
      MessageDirectionEnum.Outgoing,
      MessageTypeEnum.Text,
      MessageStatusEnum.Read,
      { text: 'Sure! What is your order number?' },
      Date.now() - 1000 * 60 * 55,
    ),
    createMessage(
      MessageDirectionEnum.Incoming,
      MessageTypeEnum.Text,
      MessageStatusEnum.Sent,
      { text: 'It is #12345' },
      Date.now() - 1000 * 60 * 30,
    ),
    createMessage(
      MessageDirectionEnum.Outgoing,
      MessageTypeEnum.Text,
      MessageStatusEnum.Delivered,
      { text: 'Let me check that for you...' },
      Date.now() - 1000 * 60 * 5,
    ),
  ];

  return (
    <div className="w-96 h-96 overflow-y-auto">
      <MessageList messages={messages} />
    </div>
  );
};

/**
 * 按天分段 - 展示聊天记录日期分隔符
 */
export const GroupedByDay = () => {
  const messages: StandardMessage[] = [
    createMessage(
      MessageDirectionEnum.Incoming,
      MessageTypeEnum.Text,
      MessageStatusEnum.Sent,
      { text: '昨天上午的第一条咨询消息。' },
      new Date(2026, 5, 10, 9, 15, 30).getTime(),
    ),
    createMessage(
      MessageDirectionEnum.Outgoing,
      MessageTypeEnum.Text,
      MessageStatusEnum.Read,
      { text: '收到，我帮你查一下订单状态。' },
      new Date(2026, 5, 10, 9, 18, 5).getTime(),
    ),
    createMessage(
      MessageDirectionEnum.Incoming,
      MessageTypeEnum.Text,
      MessageStatusEnum.Sent,
      { text: '今天又有一个新的问题需要确认。' },
      new Date(2026, 5, 11, 14, 2, 16).getTime(),
    ),
    createMessage(
      MessageDirectionEnum.Outgoing,
      MessageTypeEnum.Text,
      MessageStatusEnum.Delivered,
      { text: '可以，下面这段会话会归到今天的日期下。' },
      new Date(2026, 5, 11, 14, 5, 42).getTime(),
    ),
  ];

  return (
    <div className="w-96 h-96 overflow-y-auto">
      <MessageList messages={messages} enableVirtualization={false} />
    </div>
  );
};

/**
 * 不同状态 - 展示各种消息状态
 */
export const DifferentStatuses = () => {
  const statuses = [
    MessageStatusEnum.Sending,
    MessageStatusEnum.Sent,
    MessageStatusEnum.Delivered,
    MessageStatusEnum.Read,
    MessageStatusEnum.Failed,
  ];

  const messages: StandardMessage[] = statuses.map((status) =>
    createMessage(MessageDirectionEnum.Outgoing, MessageTypeEnum.Text, status, {
      text: `Message status: ${status}`,
    }),
  );

  return (
    <div className="w-96 h-96 overflow-y-auto">
      <MessageList messages={messages} />
    </div>
  );
};
