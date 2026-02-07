import type { Meta, StoryObj } from '@storybook/react';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { I18nProvider, zhCNMessages } from '@/index';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';

/**
 * MessageBubble 组件 Story 文档
 *
 * 展示消息气泡的各种用法：
 * - 发送/接收方向
 * - 不同消息类型
 * - 不同消息状态
 * - 时间戳显示
 */

const meta: Meta<typeof MessageBubble> = {
  title: 'Messages/MessageBubble',
  component: MessageBubble,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <I18nProvider locale={LanguageCodeEnum.ZhCN} messages={zhCNMessages}>
        <Story />
      </I18nProvider>
    ),
  ],
  argTypes: {
    message: {
      control: 'object',
      description: '标准消息对象',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageBubble>;

const createMessage = (
  direction: MessageDirectionEnum,
  type: MessageTypeEnum,
  status: MessageStatusEnum,
  content: StandardMessage['content'],
): StandardMessage => ({
  id: 'msg-1',
  direction,
  channelType: ChannelTypeEnum.WhatsApp,
  status,
  timestamp: Date.now(),
  type,
  content,
});

/**
 * 发送的消息
 */
export const Outgoing = () => {
  const message = createMessage(
    MessageDirectionEnum.Outgoing,
    MessageTypeEnum.Text,
    MessageStatusEnum.Sent,
    { text: 'Hello! How are you?' },
  );

  return (
    <div className="w-96 p-4 bg-muted rounded-lg">
      <MessageBubble message={message} />
    </div>
  );
};

/**
 * 接收的消息
 */
export const Incoming = () => {
  const message = createMessage(
    MessageDirectionEnum.Incoming,
    MessageTypeEnum.Text,
    MessageStatusEnum.Sent,
    { text: 'Hi! I am doing well, thank you!' },
  );

  return (
    <div className="w-96 p-4 bg-muted rounded-lg">
      <MessageBubble message={message} />
    </div>
  );
};

/**
 * 不同状态 - 展示所有消息状态
 */
export const MessageStatusEnumes = () => {
  const statuses: MessageStatusEnum[] = [
    MessageStatusEnum.Created,
    MessageStatusEnum.Sending,
    MessageStatusEnum.Sent,
    MessageStatusEnum.Delivered,
    MessageStatusEnum.Read,
    MessageStatusEnum.Failed,
  ];

  return (
    <div className="w-96 space-y-4">
      {statuses.map((status) => {
        const message = createMessage(
          MessageDirectionEnum.Outgoing,
          MessageTypeEnum.Text,
          status,
          { text: `Message status: ${status}` },
        );
        return (
          <div key={status} className="p-4 bg-muted rounded-lg">
            <MessageBubble message={message} />
          </div>
        );
      })}
    </div>
  );
};

/**
 * 消息对话 - 展示完整的对话流
 */
export const Conversation = () => {
  const messages: StandardMessage[] = [
    createMessage(
      MessageDirectionEnum.Incoming,
      MessageTypeEnum.Text,
      MessageStatusEnum.Sent,
      { text: 'Hi! Can you help me with my order?' },
    ),
    createMessage(
      MessageDirectionEnum.Outgoing,
      MessageTypeEnum.Text,
      MessageStatusEnum.Read,
      { text: 'Sure! What is your order number?' },
    ),
    createMessage(
      MessageDirectionEnum.Incoming,
      MessageTypeEnum.Text,
      MessageStatusEnum.Sent,
      { text: 'It is #12345' },
    ),
    createMessage(
      MessageDirectionEnum.Outgoing,
      MessageTypeEnum.Text,
      MessageStatusEnum.Delivered,
      { text: 'Let me check that for you...' },
    ),
  ];

  // 为每条消息添加不同的时间戳
  messages.forEach((msg, index) => {
    msg.timestamp = Date.now() - (messages.length - index) * 1000 * 60 * 5;
  });

  return (
    <div className="w-96 p-4 bg-muted rounded-lg space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
};

/**
 * 图片消息
 */
export const ImageMessage = () => {
  const message = createMessage(
    MessageDirectionEnum.Incoming,
    MessageTypeEnum.Image,
    MessageStatusEnum.Sent,
    {
      url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=300',
      mimeType: 'image/jpeg',
    },
  );

  return (
    <div className="w-96 p-4 bg-muted rounded-lg">
      <MessageBubble message={message} />
    </div>
  );
};

/**
 * 模板消息
 */
export const TemplateMessage = () => {
  const message = createMessage(
    MessageDirectionEnum.Outgoing,
    MessageTypeEnum.Template,
    MessageStatusEnum.Read,
    {
      text: JSON.stringify({
        title: 'Order Update',
        description: 'Your order has been shipped',
        image:
          'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300',
      }),
      templateId: 'order_update',
      params: {},
    },
  );

  return (
    <div className="w-96 p-4 bg-muted rounded-lg">
      <MessageBubble message={message} />
    </div>
  );
};

/**
 * 失败消息 - 带重试提示
 */
export const FailedMessage = () => {
  const message = createMessage(
    MessageDirectionEnum.Outgoing,
    MessageTypeEnum.Text,
    MessageStatusEnum.Failed,
    { text: 'This message failed to send' },
  );

  return (
    <div className="w-96 p-4 bg-muted rounded-lg">
      <MessageBubble message={message} />
    </div>
  );
};

/**
 * 长消息 - 测试消息换行
 */
export const LongMessage = () => {
  const message = createMessage(
    MessageDirectionEnum.Incoming,
    MessageTypeEnum.Text,
    MessageStatusEnum.Sent,
    {
      text: 'This is a very long message that should wrap properly within the message bubble. It demonstrates how the component handles text content that exceeds the normal width of a message bubble.',
    },
  );

  return (
    <div className="w-96 p-4 bg-muted rounded-lg">
      <MessageBubble message={message} />
    </div>
  );
};

/**
 * 不同渠道 - 展示不同渠道的消息
 */
export const DifferentChannels = () => {
  const channels = [
    { type: ChannelTypeEnum.SMS, name: 'SMS' },
    { type: ChannelTypeEnum.WhatsApp, name: 'WhatsApp' },
    { type: ChannelTypeEnum.Email, name: 'Email' },
  ];

  return (
    <div className="w-96 space-y-4">
      {channels.map((channel) => {
        const message = createMessage(
          MessageDirectionEnum.Outgoing,
          MessageTypeEnum.Text,
          MessageStatusEnum.Sent,
          { text: `Message via ${channel.name}` },
        );
        message.channelType = channel.type;
        return (
          <div key={channel.type} className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-text-muted mb-2">{channel.name}</p>
            <MessageBubble message={message} />
          </div>
        );
      })}
    </div>
  );
};
