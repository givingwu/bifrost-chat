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
  // 先判断是否有内容传入
  if (!content || !('text' in content) || content.text == null) {
    return <div className="p-3 text-xs">Template payload missing.</div>;
  }
  const text =
    typeof content.text === 'string' ? content.text.trim() : '';
  if (!text) {
    return <div className="p-3 text-xs">Template payload missing.</div>;
  }

  let data: {
    title?: string;
    description?: string;
    image?: string;
    buttons?: string[];
  } | null = null;

  try {
    const parsed = JSON.parse(text);
    // 仅当解析结果为非空对象且具备展示字段时才视为有效模板 JSON
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      (parsed.title !== undefined ||
        parsed.description !== undefined ||
        parsed.image !== undefined ||
        (Array.isArray(parsed.buttons) && parsed.buttons.length > 0))
    ) {
      data = parsed;
    }
  } catch {
    data = null;
  }

  // 非 JSON 或非预期结构（如服务端只存了纯文本模板正文）时降级为纯文本展示
  if (!data) {
    return (
      <div className="p-3 text-sm leading-relaxed text-text">{text}</div>
    );
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
