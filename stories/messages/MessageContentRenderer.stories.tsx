import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { MessageContentRenderer } from '@/components/messages/MessageContentRenderer';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import '@/styles/theme.css';

/**
 * MessageContentRenderer 组件 Story 文档
 *
 * 展示消息内容渲染器的各种用法：
 * - 根据消息类型渲染对应组件
 * - 处理各种消息内容格式
 */

const meta: Meta<typeof MessageContentRenderer> = {
  title: 'Messages/MessageContentRenderer',
  component: MessageContentRenderer,
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: false,
      description: '标准消息对象',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageContentRenderer>;

const baseMessage = {
  conversationId: 'conv-story-default',
  direction: MessageDirectionEnum.Incoming,
  channelType: ChannelTypeEnum.WhatsApp,
  status: MessageStatusEnum.Read,
  timestamp: Date.now(),
  sender: { app: 'sender-app', pin: 'sender-pin' },
  receiver: { app: 'receiver-app', pin: 'receiver-pin' },
};

/**
 * 文本消息
 */
export const TextContent = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageContentRenderer
        message={{
          ...baseMessage,
          id: '1',
          type: MessageTypeEnum.Text,
          content: { text: '这是一条文本消息' },
        }}
      />
    </div>
  );
};

/**
 * 图片消息
 */
export const ImageContent = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageContentRenderer
        message={{
          ...baseMessage,
          id: '2',
          type: MessageTypeEnum.Image,
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
export const VideoContent = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageContentRenderer
        message={{
          ...baseMessage,
          id: '3',
          type: MessageTypeEnum.Video,
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
export const FileContent = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageContentRenderer
        message={{
          ...baseMessage,
          id: '4',
          type: MessageTypeEnum.File,
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
export const LocationContent = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageContentRenderer
        message={{
          ...baseMessage,
          id: '5',
          type: MessageTypeEnum.Location,
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
      <MessageContentRenderer
        message={{
          ...baseMessage,
          id: '6',
          type: MessageTypeEnum.Template,
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
export const RichMediaContent = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageContentRenderer
        message={{
          ...baseMessage,
          id: '7',
          type: MessageTypeEnum.RichMedia,
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
export const AudioContent = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageContentRenderer
        message={{
          ...baseMessage,
          id: '8',
          type: MessageTypeEnum.Audio,
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
 * 不支持的消息类型
 */
export const UnsupportedType = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <MessageContentRenderer
        message={{
          ...baseMessage,
          id: '9',
          type: MessageTypeEnum.Other,
          content: { text: 'Unknown content' },
        }}
      />
    </div>
  );
};
