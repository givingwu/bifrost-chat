import type { StandardMessage } from '@/interfaces/chat.interface';

export interface MessageRendererFactoryProps {
  /** 标准消息 */
  message: StandardMessage;
}

/**
 * MessageRendererFactory：消息渲染工厂（Factory）。
 * - 当前为骨架实现，后续按 MessageContentType 扩展渲染组件。
 */
export const MessageRendererFactory = ({
  message,
}: MessageRendererFactoryProps) => {
  const bubbleAlignment =
    message.direction === 'outbound' ? 'ml-auto' : 'mr-auto';
  const bubbleTone =
    message.direction === 'outbound'
      ? 'bg-primary text-primary-foreground'
      : 'bg-surface text-text border border-border';

  return (
    <div
      data-component="message-bubble"
      data-type={message.type}
      className={`max-w-[75%] rounded-xl px-4 py-2 text-sm shadow-soft ${bubbleAlignment} ${bubbleTone}`}
    >
      <div className="text-xs text-text-muted">{message.channelType}</div>
      <div className="font-medium">{message.type}</div>
    </div>
  );
};
