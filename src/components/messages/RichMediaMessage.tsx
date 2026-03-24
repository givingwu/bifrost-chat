import { ImageOff } from 'lucide-react';
import type { MessageContent } from '@/interfaces/message.interface';
import { isValidHttpUrl } from '@/utils/url.util';
import { InvalidUrlMessage } from './InvalidUrlMessage';

export interface RichMediaMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * RichMediaMessage：富媒体消息组件。
 * - 渲染富媒体消息，支持卡片式布局。
 * - 验证图片 URL 和按钮 URL 有效性。
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
      <div className="p-3 text-xs text-gray-400 dark:text-gray-500">
        Invalid rich media data.
      </div>
    );
  }

  const isValidImageUrl = data.image ? isValidHttpUrl(data.image) : false;

  return (
    <div className="flex max-w-sm flex-col overflow-hidden rounded-lg border border-border bg-card">
      {data.image && isValidImageUrl ? (
        <div className="h-32 w-full">
          <img
            src={data.image}
            alt={data.title || 'Rich Media'}
            className="h-full w-full object-cover"
          />
        </div>
      ) : data.image ? (
        <div className="flex h-32 w-full items-center justify-center bg-muted">
          <InvalidUrlMessage icon={ImageOff} compact />
        </div>
      ) : null}
      <div className="space-y-2 p-3">
        {data.title && (
          <h4 className="text-sm font-semibold text-text">{data.title}</h4>
        )}
        {data.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {data.description}
          </p>
        )}
        {data.buttons && data.buttons.length > 0 && (
          <div className="space-y-2">
            {data.buttons.map((button) => {
              const isValidButtonUrl = button.url ? isValidHttpUrl(button.url) : false;
              return (
                <a
                  key={button.text}
                  href={isValidButtonUrl ? button.url : undefined}
                  className="block w-full rounded-md border border-border bg-muted px-3 py-1.5 text-center text-xs font-semibold text-primary transition hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  {...(!isValidButtonUrl && { tabIndex: -1, 'aria-disabled': true })}
                >
                  {button.text}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
