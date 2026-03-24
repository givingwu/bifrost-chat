import { memo, type ReactNode } from 'react';
import { useTranslation } from '@/providers/I18n.provider';

export interface ConversationPanelProps {
  /** 头部内容 */
  header?: ReactNode;
  /** 主体内容 */
  children?: ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 自定义宽度 */
  width?: string;
  /** 是否显示边框 */
  showBorder?: boolean;
}

/**
 * ConversationPanel：会话面板容器组件。
 * - 提供会话列表的布局容器。
 * - 支持自定义宽度和边框。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持无障碍访问（ARIA 标签）。
 */
export const ConversationPanel = memo(
  ({
    header,
    children,
    className = '',
    width = '',
    showBorder = true,
  }: ConversationPanelProps) => {
    const { t } = useTranslation();
    // 容器类名
    const containerClassName = `shrink-0 ${
      showBorder ? 'border-r border-gray-200/50 dark:border-white/10' : ''
    } flex flex-col bg-gray-50/50 dark:bg-black/20 ${className}`.trim();

    return (
      <aside
        style={{ width }}
        className={containerClassName}
        aria-label={t('conversation.panel')}
      >
        {header}
        {children}
      </aside>
    );
  },
);

ConversationPanel.displayName = 'ConversationPanel';
