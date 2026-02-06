import { memo, type ReactElement, useMemo } from 'react';
import {
  type MessageContent,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { AudioMessage } from './AudioMessage';
import { FileMessage } from './FileMessage';
import { ImageMessage } from './ImageMessage';
import { LocationMessage } from './LocationMessage';
import { RichMediaMessage } from './RichMediaMessage';
import { TextMessage } from './TextMessage';
import { UnsupportedMessage } from './UnsupportedMessage';
import { VideoMessage } from './VideoMessage';
import { WhatsAppMessage } from './WhatsAppMessage';

export interface MessageContentRendererProps {
  /** 标准消息 */
  message: StandardMessage;
}

/**
 * 消息内容组件类型定义
 * 允许返回 null，因为某些消息组件可能返回 null
 */
type MessageContentComponent = (props: {
  content: MessageContent;
}) => ReactElement | null;

/**
 * 消息类型到组件的映射表
 * - 使用工厂模式，便于扩展新的消息类型
 * - 映射表在模块初始化时创建，避免每次渲染时重新创建
 */
const MESSAGE_COMPONENT_MAP: Record<MessageTypeEnum, MessageContentComponent> =
  {
    [MessageTypeEnum.Text]: TextMessage,
    [MessageTypeEnum.Image]: ImageMessage,
    [MessageTypeEnum.Audio]: AudioMessage,
    [MessageTypeEnum.Video]: VideoMessage,
    [MessageTypeEnum.File]: FileMessage,
    [MessageTypeEnum.Template]: WhatsAppMessage,
    [MessageTypeEnum.Location]: LocationMessage,
    [MessageTypeEnum.RichMedia]: RichMediaMessage,
    [MessageTypeEnum.Other]: UnsupportedMessage,
  } as const;

/**
 * 验证消息对象是否有效
 */
const isValidMessage = (message: unknown): message is StandardMessage => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const msg = message as Partial<StandardMessage>;
  return (
    typeof msg.id === 'string' &&
    typeof msg.type === 'string' &&
    msg.content !== undefined
  );
};

/**
 * MessageContentRenderer：消息内容渲染器。
 * - 根据消息类型选择对应的组件进行渲染。
 * - 使用工厂模式，便于扩展新的消息类型。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 添加消息验证和错误处理。
 */
export const MessageContentRenderer = memo(
  ({ message }: MessageContentRendererProps) => {
    // 先调用 useMemo，确保 hooks 在相同顺序调用
    const Component = useMemo(() => {
      const component = MESSAGE_COMPONENT_MAP[message.type];
      if (!component) {
        console.warn(
          `[MessageContentRenderer] Unknown message type: ${message.type}`,
        );
        return UnsupportedMessage;
      }
      return component;
    }, [message.type]);

    // 验证消息对象的有效性
    if (!isValidMessage(message)) {
      console.error(
        '[MessageContentRenderer] Invalid message object:',
        message,
      );
      return <UnsupportedMessage />;
    }

    // 验证消息内容的有效性
    if (!message.content) {
      console.warn(
        `[MessageContentRenderer] Message content is empty for message ${message.id}`,
      );
      return <UnsupportedMessage />;
    }

    return <Component content={message.content} />;
  },
);

MessageContentRenderer.displayName = 'MessageContentRenderer';
