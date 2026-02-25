import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { MessageActions } from '@/components/messages/MessageActions';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';

const meta: Meta<typeof MessageActions> = {
  title: 'Messages/MessageActions',
  component: MessageActions,
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'object',
      description: '消息对象',
    },
    conversationId: {
      control: 'text',
      description: '会话 ID',
    },
    className: {
      control: 'text',
      description: '自定义类名',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageActions>;

// 基础示例
export const Default: Story = {
  args: {
    message: {
      id: 'msg-1',
      tempId: 'temp-1',
      direction: MessageDirectionEnum.Outgoing,
      channelType: 'whatsapp' as any,
      status: MessageStatusEnum.Failed,
      timestamp: Date.now(),
      type: MessageTypeEnum.Text,
      content: { text: '这是一条发送失败的消息' },
      sender: { app: 'bifrost-chat-sdk', pin: 'user-1' },
      receiver: { app: 'bifrost-chat-sdk', pin: 'user-2' },
      _source: 'local',
      _offlineMessageId: 'offline-1',
      error: '网络连接失败',
    },
    conversationId: 'conv-123',
  },
};

// 带错误信息
export const WithError: Story = {
  args: {
    message: {
      id: 'msg-2',
      tempId: 'temp-2',
      direction: MessageDirectionEnum.Outgoing,
      channelType: 'whatsapp' as any,
      status: MessageStatusEnum.Failed,
      timestamp: Date.now(),
      type: MessageTypeEnum.Text,
      content: { text: '这是一条发送失败的消息' },
      sender: { app: 'bifrost-chat-sdk', pin: 'user-1' },
      receiver: { app: 'bifrost-chat-sdk', pin: 'user-2' },
      _source: 'local',
      _offlineMessageId: 'offline-2',
      error: '超时：请求在 30 秒内未完成',
    },
    conversationId: 'conv-123',
  },
};

// 无错误信息
export const WithoutError: Story = {
  args: {
    message: {
      id: 'msg-3',
      tempId: 'temp-3',
      direction: MessageDirectionEnum.Outgoing,
      channelType: 'whatsapp' as any,
      status: MessageStatusEnum.Failed,
      timestamp: Date.now(),
      type: MessageTypeEnum.Text,
      content: { text: '这是一条发送失败的消息' },
      sender: { app: 'bifrost-chat-sdk', pin: 'user-1' },
      receiver: { app: 'bifrost-chat-sdk', pin: 'user-2' },
      _source: 'local',
      _offlineMessageId: 'offline-3',
    },
    conversationId: 'conv-123',
  },
};

// 非本地失败消息（不显示按钮）
export const NotLocalFailed: Story = {
  args: {
    message: {
      id: 'msg-4',
      tempId: 'temp-4',
      direction: MessageDirectionEnum.Outgoing,
      channelType: 'whatsapp' as any,
      status: MessageStatusEnum.Failed,
      timestamp: Date.now(),
      type: MessageTypeEnum.Text,
      content: { text: '这是一条服务端失败的消息' },
      sender: { app: 'bifrost-chat-sdk', pin: 'user-1' },
      receiver: { app: 'bifrost-chat-sdk', pin: 'user-2' },
      _source: 'server',
      error: '服务端错误',
    },
    conversationId: 'conv-123',
  },
};

// 无 conversationId（不显示按钮）
export const WithoutConversationId: Story = {
  args: {
    message: {
      id: 'msg-5',
      tempId: 'temp-5',
      direction: MessageDirectionEnum.Outgoing,
      channelType: 'whatsapp' as any,
      status: MessageStatusEnum.Failed,
      timestamp: Date.now(),
      type: MessageTypeEnum.Text,
      content: { text: '这是一条发送失败的消息' },
      sender: { app: 'bifrost-chat-sdk', pin: 'user-1' },
      receiver: { app: 'bifrost-chat-sdk', pin: 'user-2' },
      _source: 'local',
      _offlineMessageId: 'offline-5',
      error: '网络连接失败',
    },
    conversationId: undefined,
  },
};

// 非失败状态（不显示按钮）
export const NotFailedStatus: Story = {
  args: {
    message: {
      id: 'msg-6',
      tempId: 'temp-6',
      direction: MessageDirectionEnum.Outgoing,
      channelType: 'whatsapp' as any,
      status: MessageStatusEnum.Sent,
      timestamp: Date.now(),
      type: MessageTypeEnum.Text,
      content: { text: '这是一条已发送的消息' },
      sender: { app: 'bifrost-chat-sdk', pin: 'user-1' },
      receiver: { app: 'bifrost-chat-sdk', pin: 'user-2' },
    },
    conversationId: 'conv-123',
  },
};
