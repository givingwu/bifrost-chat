import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '@/providers/I18n.provider';

export type MessageType = 'audio' | 'video' | 'image' | 'file' | 'rich-media';

export interface InvalidUrlMessageProps {
  /** 图标组件 */
  icon?: LucideIcon;
  /** 消息类型 */
  type?: MessageType;
  /** 自定义类名 */
  className?: string;
  /** 是否为紧凑模式（用于图片等大尺寸组件） */
  compact?: boolean;
}

/**
 * InvalidUrlMessage：无效 URL 错误提示组件
 * - 统一的无可用 URL 错误提示
 * - 支持自定义图标
 * - 支持消息类型前缀
 * - 支持紧凑模式和标准模式
 * - 支持国际化
 */
export const InvalidUrlMessage = ({
  icon: Icon,
  type,
  className = '',
  compact = false,
}: InvalidUrlMessageProps) => {
  const { t } = useTranslation();

  const message = type ? `[${type}] : ${t('message.invalidUrl')}` : t('message.invalidUrl');

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2">
        {Icon && <Icon className="h-8 w-8 text-destructive" />}
        <p className="text-xs text-destructive">{message}</p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 ${className}`}>
      {Icon ? (
        <Icon className="h-5 w-5 text-destructive" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted" />
      )}
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
};
