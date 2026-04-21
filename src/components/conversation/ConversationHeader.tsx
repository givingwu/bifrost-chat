import { memo, type ReactNode } from 'react';
import { cn } from '@/utils/class.util';
import { Title } from '../Title';

export interface ConversationHeaderProps {
  /** 自定义类名 */
  className?: string;
  /** 标题 */
  title?: ReactNode;
  /** 头部扩展内容 */
  extra?: ReactNode;
  /** 搜索区域 */
  search?: ReactNode;
  /** 子组件 */
  children?: ReactNode;
}

/**
 * ConversationHeader：会话列表头部组件。
 * - 负责组织标题、扩展区、搜索区的布局结构。
 * - 不持有搜索状态，只接收外部组装好的节点。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 */
export const ConversationHeader = memo(
  ({
    className = '',
    title,
    extra,
    search,
    children,
  }: ConversationHeaderProps) => {
    const titleNode =
      typeof title === 'string' ? <Title>{title}</Title> : title;

    return (
      <div className={cn('p-4 pt-4 pb-2 space-y-4', className)}>
        {(titleNode || extra) && (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">{titleNode}</div>
            {extra ? <div className="shrink-0">{extra}</div> : null}
          </div>
        )}

        {search ? <div>{search}</div> : null}

        {children}
      </div>
    );
  },
);

ConversationHeader.displayName = 'ConversationHeader';
