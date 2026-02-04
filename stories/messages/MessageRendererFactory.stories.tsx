import type { Meta, StoryObj } from '@storybook/react';
import { MessageRendererFactory } from '@/components/messages/MessageRendererFactory';
import { ChannelType } from '@/interfaces/channel.interface';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
} from '@/interfaces/message.interface';
import '@/styles/theme.css';

/**
 * MessageRendererFactory 组件 Story 文档
 *
 * 展示消息渲染工厂的各种用法：
 * - 根据消息类型和方向渲染对应组件
 * - 处理消息状态和时间戳
 */

const meta: Meta<typeof MessageRendererFactory> = {
  title: 'Messages/MessageRendererFactory',
  component: MessageRendererFactory,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MessageRendererFactory>;

const baseMessage = {
  direction: MessageDirection.Incoming,
  channelType: ChannelType.WhatsApp,
  status: MessageStatus.Read,
  timestamp: Date.now(),
};

/**
 * 文本消息（接收）
 */
export const IncomingText = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '1',
          type: MessageType.Text,
          content: { text: '这是一条接收的文本消息' },
        }}
      />
    </div>
  );
};

/**
 * 文本消息（发送）
 */
export const OutgoingText = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '2',
          direction: MessageDirection.Outgoing,
          type: MessageType.Text,
          content: { text: '这是一条发送的文本消息' },
        }}
      />
    </div>
  );
};

/**
 * 图片消息
 */
export const ImageMessage = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '3',
          type: MessageType.Image,
          content: {
            url: 'https://picsum.photos/400/300',
            mimeType: 'image/jpeg',
          },
        }}
      />
    </div>
  );
};

/**
 * 视频消息
 */
export const VideoMessage = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '4',
          type: MessageType.Video,
          content: {
            url: 'https://example.com/video.mp4',
            mimeType: 'video/mp4',
          },
        }}
      />
    </div>
  );
};

/**
 * 文件消息
 */
export const FileMessage = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '5',
          type: MessageType.File,
          content: {
            url: 'https://example.com/document.pdf',
            mimeType: 'application/pdf',
          },
        }}
      />
    </div>
  );
};

/**
 * 位置消息
 */
export const LocationMessage = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '6',
          type: MessageType.Location,
          content: {
            text: JSON.stringify({
              latitude: 37.7749,
              longitude: -122.4194,
              address: 'San Francisco, CA',
            }),
          },
        }}
      />
    </div>
  );
};

/**
 * WhatsApp 模板消息
 */
export const WhatsAppTemplate = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '7',
          type: MessageType.Template,
          content: {
            text: JSON.stringify({
              title: '问候模板',
              description: '您好，感谢您的咨询！',
            }),
          },
        }}
      />
    </div>
  );
};

/**
 * 富媒体消息
 */
export const RichMediaMessage = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '8',
          type: MessageType.RichMedia,
          content: {
            text: JSON.stringify({
              title: '产品推荐',
              description: 'iPhone 15 Pro Max',
              image: 'https://picsum.photos/400/300',
            }),
          },
        }}
      />
    </div>
  );
};

/**
 * 语音消息
 */
export const AudioMessage = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '9',
          type: MessageType.Audio,
          content: {
            url: 'https://example.com/audio.mp3',
            mimeType: 'audio/mpeg',
          },
        }}
      />
    </div>
  );
};

/**
 * 不同状态的消息
 */
export const DifferentStatuses = () => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '10',
          direction: MessageDirection.Outgoing,
          type: MessageType.Text,
          status: MessageStatus.Created,
          content: { text: '创建状态' },
        }}
      />
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '11',
          direction: MessageDirection.Outgoing,
          type: MessageType.Text,
          status: MessageStatus.Sending,
          content: { text: '发送中' },
        }}
      />
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '12',
          direction: MessageDirection.Outgoing,
          type: MessageType.Text,
          status: MessageStatus.Sent,
          content: { text: '已发送' },
        }}
      />
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '13',
          direction: MessageDirection.Outgoing,
          type: MessageType.Text,
          status: MessageStatus.Delivered,
          content: { text: '已送达' },
        }}
      />
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '14',
          direction: MessageDirection.Outgoing,
          type: MessageType.Text,
          status: MessageStatus.Read,
          content: { text: '已读' },
        }}
      />
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '15',
          direction: MessageDirection.Outgoing,
          type: MessageType.Text,
          status: MessageStatus.Failed,
          content: { text: '发送失败' },
        }}
      />
    </div>
  );
};

/**
 * 对话流示例
 */
export const ConversationFlow = () => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg max-w-md">
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '16',
          direction: MessageDirection.Incoming,
          type: MessageType.Text,
          content: { text: '你好，请问有什么可以帮您的？' },
        }}
      />
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '17',
          direction: MessageDirection.Outgoing,
          type: MessageType.Text,
          content: { text: '我想了解一下产品信息' },
        }}
      />
      <MessageRendererFactory
        message={{
          ...baseMessage,
          id: '18',
          direction: MessageDirection.Incoming,
          type: MessageType.Image,
          content: {
            url: 'https://picsum.photos/400/300',
            mimeType: 'image/jpeg',
          },
        }}
      />
    </div>
  );
};
