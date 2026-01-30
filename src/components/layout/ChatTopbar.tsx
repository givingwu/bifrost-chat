import { cn } from '@/utils/class.util';

export interface ChatTopbarProps {
  /** 当前会话标题 */
  title?: string;
  /** 当前会话副标题 */
  subtitle?: string;
  /** 会话头像 */
  avatarUrl?: string;
  extra?: React.ReactNode;
}

/**
 * ChatTopbar：顶部工具栏（左侧渠道工具、右侧网络/主题状态）
 */
export const ChatTopbar = ({
  title,
  subtitle,
  avatarUrl,
  extra,
}: ChatTopbarProps) => {
  return (
    <header
      data-component="chat-topbar"
      className={cn(
        'flex flex-wrap items-center justify-between gap-4',
        'border-b border-gray-200/50 dark:border-white/10',
        'flex items-center justify-between px-6 py-3',
        'shadow-soft dark:bg-gray-900/50 bg-card/80 backdrop-blur-md z-10',
      )}
    >
      <div className="flex items-center gap-3">
        {avatarUrl && (
          <div className="relative">
            <img
              src={avatarUrl}
              alt={title ?? 'conversation'}
              className="h-10 w-10 rounded-full object-cover shadow-soft"
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-text">
            {title ?? 'Conversation'}
          </div>
          {subtitle && (
            <div className="text-xs text-text-muted">{subtitle}</div>
          )}
        </div>
      </div>

      {extra}
    </header>
  );
};
