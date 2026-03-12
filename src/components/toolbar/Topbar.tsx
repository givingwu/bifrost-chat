import { ConversationAvatar } from '@/components/conversation/ConversationAvatar';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';

export interface TopbarProps {
  /** 当前会话标题（人名） */
  title?: string;
  /** 当前会话副标题（渠道 · 状态） */
  subtitle?: string;
  /** 会话头像 */
  avatarUrl?: string;
  /** 附加内容 */
  extra?: React.ReactNode;
  /**
   * 自定义渲染元数据区域（在标题和副标题之间）
   * @returns ReactNode 或 null
   * @example
   * ```tsx
   * renderMeta={() => (
   *   <div className="flex flex-col gap-0.5">
   *     <span className="text-xs text-gray-500">({relationship})</span>
   *     <button
   *       className="text-xs text-blue-500 hover:underline"
   *       onClick={() => navigateToAsset(assetNumber)}
   *     >
   *       {assetNumber}
   *     </button>
   *   </div>
   * )}
   * ```
   */
  renderMeta?: () => React.ReactNode;
}

/**
 * Topbar：顶部工具栏（左侧会话信息、右侧工具入口）
 * - 显示标题、副标题
 * - 支持通过 renderMeta 自定义渲染元数据区域
 */
export const Topbar = ({
  title,
  subtitle,
  avatarUrl,
  extra,
  renderMeta,
}: TopbarProps) => {
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
        <div className="flex flex-col gap-0.5">
          {/* 第一行：标题（人名） */}
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {title ?? t('conversation.title')}
          </div>
          {/* 第二行：自定义元数据区域（由业务层渲染） */}
          {renderMeta?.()}
          {/* 第三行：副标题（渠道 · 状态） */}
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
