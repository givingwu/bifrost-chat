import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '@/providers/I18n.provider';

export type MessageType =
  | 'audio'
  | 'video'
  | 'image'
  | 'file'
  | 'text'
  | 'rich-media';

export interface EmptyMessageProps {
  /** 图标组件 */
  icon?: LucideIcon;
  /** 消息类型 */
  type: MessageType;
  /** 自定义类名 */
  className?: string;
}

/**
 * EmptyMessage：空消息提示组件
 * - 统一的空消息错误提示
 * - 支持自定义图标
 * - 支持消息类型前缀
 * - 支持国际化
 */
export const EmptyMessage = ({
  icon: Icon,
  type,
  className = '',
}: EmptyMessageProps) => {
  const { t } = useTranslation();

  const message = t('message.empty', { type });

  return (
    <div
      className={`flex items-center gap-2 text-gray-400 dark:text-gray-500 ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <p className="text-sm">{message}</p>
    </div>
  );
};
