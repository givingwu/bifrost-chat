import type { MessageContent } from '@/interfaces/message.interface';

export interface RichMediaMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * RichMediaMessage：富媒体消息组件。
 * - 渲染富媒体消息，支持卡片式布局。
 */
export const RichMediaMessage = ({ content }: RichMediaMessageProps) => {
  if (!('text' in content)) {
    return null;
  }

  let data: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    buttons?: Array<{
      text: string;
      url?: string;
      action?: string;
    }>;
  } | null = null;

  try {
    data = JSON.parse(content.text);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="p-3 text-xs text-text-muted">
        Invalid rich media data.
      </div>
    );
  }

  return (
    <div className="flex max-w-sm flex-col overflow-hidden rounded-lg border border-border bg-card">
      {data.image && (
        <div className="h-32 w-full">
          <img
            src={data.image}
            alt={data.title || 'Rich Media'}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="space-y-2 p-3">
        {data.title && (
          <h4 className="text-sm font-semibold text-text">{data.title}</h4>
        )}
        {data.description && (
          <p className="text-xs text-text-muted">{data.description}</p>
        )}
        {data.buttons && data.buttons.length > 0 && (
          <div className="space-y-2">
            {data.buttons.map((button) => (
              <a
                key={button.text}
                href={button.url || '#'}
                className="block w-full rounded-md border border-border bg-muted px-3 py-1.5 text-center text-xs font-semibold text-primary transition hover:bg-muted/80"
              >
                {button.text}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
