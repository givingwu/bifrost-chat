import {
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { MessageBubble } from './MessageBubble';

export interface MessageRendererFactoryProps {
  /** 标准消息 */
  message: StandardMessage;
  /** 会话 ID */
  conversationId?: string;
  /** 消息进入视口时触发 */
  onInViewport?: (message: StandardMessage) => void;
}

/**
 * MessageRendererFactory：消息渲染工厂（Factory）。
 * - 根据 MessageTypeEnum 选择不同的渲染方式。
 * - 使用组合模式，将消息气泡、系统消息等组件组合在一起。
 */
export const MessageRendererFactory = ({
  message,
  conversationId,
  onInViewport,
}: MessageRendererFactoryProps) => {
  // 系统消息（如 Other 类型）居中显示
  if (message.type === MessageTypeEnum.Other && 'text' in message.content) {
    return (
      <div className="my-4 flex justify-center">
        <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {message.content.text}
        </span>
      </div>
    );
  }

  // 普通消息使用 MessageBubble 组件
  return (
    <MessageBubble
      message={message}
      conversationId={conversationId}
      onInViewport={onInViewport}
    />
  );
};
