import { AlertCircle, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import {
  type MessageContent,
  MessageDirection,
  MessageStatus,
  MessageType,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { cn } from '@/utils/class.util';

export interface MessageRendererFactoryProps {
  /** 标准消息 */
  message: StandardMessage;
}

/**
 * MessageRendererFactory：消息渲染工厂（Factory）。
 * - 当前为骨架实现，后续按 MessageContentType 扩展渲染组件。
 */
const StatusIndicator = ({ status }: { status?: MessageStatus }) => {
  if (!status) {
    return null;
  }
  if (status === MessageStatus.Sending) {
    return <Loader2 className="h-3 w-3 animate-spin text-white/70" />;
  }
  if (status === MessageStatus.Failed) {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  if (status === MessageStatus.Read) {
    return <CheckCheck className="h-4 w-4 text-blue-300" />;
  }
  if (status === MessageStatus.Delivered) {
    return <CheckCheck className="h-4 w-4 text-white/50" />;
  }
  if (status === MessageStatus.Sent) {
    return <Check className="h-4 w-4 text-white/50" />;
  }
  return null;
};

const WhatsAppTemplate = ({ content }: { content: MessageContent }) => {
  if (!('text' in content)) {
    return <div className="p-3 text-xs">Template payload missing.</div>;
  }

  let data: {
    title?: string;
    description?: string;
    image?: string;
    buttons?: string[];
  } | null = null;

  try {
    data = JSON.parse(content.text);
  } catch {
    data = null;
  }

  if (!data) {
    return <div className="p-3 text-xs">Template payload error.</div>;
  }

  return (
    <div className="flex max-w-sm flex-col overflow-hidden">
      {data.image && (
        <div className="h-32 w-full">
          <img
            src={data.image}
            alt="Template"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="space-y-2 p-3">
        <div>
          <h4 className="text-sm font-semibold text-text">
            {data.title ?? 'Template'}
          </h4>
          <p className="text-xs text-text-muted">{data.description}</p>
        </div>
        <div className="space-y-2">
          {data.buttons?.map((btn) => (
            <button
              key={btn}
              className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-muted"
              type="button"
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const MessageContentRenderer = ({ message }: { message: StandardMessage }) => {
  if (message.type === MessageType.Template) {
    return <WhatsAppTemplate content={message.content} />;
  }
  if (message.type === MessageType.Image) {
    if ('url' in message.content) {
      return (
        <img
          src={message.content.url}
          alt="message"
          className="h-40 w-56 rounded-xl object-cover"
        />
      );
    }
  }
  if ('text' in message.content) {
    return <p className="leading-relaxed">{message.content.text}</p>;
  }
  return <p className="text-xs text-text-muted">Unsupported message.</p>;
};

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * MessageRendererFactory：消息渲染工厂（Factory）。
 * - 按 MessageType 映射 DEMO 风格气泡。
 */
export const MessageRendererFactory = ({
  message,
}: MessageRendererFactoryProps) => {
  const isMe = message.direction === MessageDirection.Outgoing;
  const timestamp = useMemo(
    () => formatTimestamp(message.timestamp),
    [message.timestamp],
  );

  if (message.type === MessageType.Other && 'text' in message.content) {
    return (
      <div className="my-4 flex justify-center">
        <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
          {message.content.text}
        </span>
      </div>
    );
  }

  return (
    <div
      data-component="message-bubble"
      data-type={message.type}
      className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'flex max-w-[70%] flex-col',
          isMe ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={cn(
            'relative px-4 py-2.5 text-sm shadow-soft',
            isMe
              ? 'rounded-2xl rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-2xl rounded-tl-sm border border-border bg-card text-text',
            message.type === MessageType.Template && 'overflow-hidden p-0',
          )}
        >
          <MessageContentRenderer message={message} />
        </div>
        <div className="mt-1 flex items-center gap-1 px-1">
          {message.status === MessageStatus.Failed && (
            <span className="text-xs font-medium text-red-500">Retry</span>
          )}
          <span className="text-[10px] text-text-muted">{timestamp}</span>
          {isMe && <StatusIndicator status={message.status} />}
        </div>
      </div>
    </div>
  );
};
