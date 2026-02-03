import type { MessageContent } from '@/interfaces/message.interface';

export interface WhatsAppMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * WhatsAppMessage：WhatsApp 模板消息组件。
 * - 渲染 WhatsApp 模板消息，包含标题、描述、图片和按钮。
 */
export const WhatsAppMessage = ({ content }: WhatsAppMessageProps) => {
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
