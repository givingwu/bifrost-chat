import { ConversationAvatar } from '@/components/conversation/ConversationAvatar';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';

export interface TopbarProps {
  /** 当前会话标题 */
  title?: string;
  /** 当前会话副标题 */
  subtitle?: string;
  /** 会话头像 */
  avatarUrl?: string;
  /** 附加内容 */
  extra?: React.ReactNode;
}

/**
 * Topbar：顶部工具栏（左侧会话信息、右侧工具入口）
 */
export const Topbar = ({ title, subtitle, avatarUrl, extra }: TopbarProps) => {
  const { t } = useTranslation();

  return (
    <header
      data-component="topbar"
      className={cn(
        'flex flex-wrap items-center justify-between gap-4',
        'border-b border-gray-200/50 dark:border-white/10',
        'flex items-center justify-between px-6 py-3',
        'relative shadow-soft dark:bg-gray-900/50 bg-card/80 backdrop-blur-md z-10',
      )}
    >
      <div className="flex items-center gap-3">
        {avatarUrl && (
          <div className="relative">
            <ConversationAvatar
              src={avatarUrl}
              name={title ?? 'conversation'}
              className="h-10 w-10 rounded-full object-cover shadow-soft"
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {title ?? t('conversation.title')}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {extra}
    </header>
  );
};
