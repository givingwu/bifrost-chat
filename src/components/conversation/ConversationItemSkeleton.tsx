import { memo } from 'react';
import { cn } from '@/utils/class.util';

const SKELETON_BLOCK_CLASSNAME = 'rounded bg-gray-200/90 dark:bg-gray-700/80';

/**
 * ConversationItemSkeleton：创建会话期间的列表占位项。
 *
 * @description
 * 复用 ConversationItem 的布局层级与间距，确保创建中的占位高度稳定，
 * 不会导致会话列表在真实数据返回时发生明显跳动。
 */
export const ConversationItemSkeleton = memo(
  function ConversationItemSkeleton() {
    return (
      <div
        aria-hidden="true"
        data-testid="conversation-item-skeleton"
        className={cn(
          'w-full flex items-start p-3 rounded-xl transition-all duration-200 text-left group relative',
          'hover:bg-gray-200/50 dark:hover:bg-white/5 bg-transparent',
          'pointer-events-none animate-pulse',
        )}
      >
        <div className="flex w-full items-start gap-3">
          <div className="relative shrink-0">
            <div
              className={cn(
                'h-12 w-12 rounded-full shadow-sm',
                SKELETON_BLOCK_CLASSNAME,
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-around gap-2">
              <div
                className={cn(
                  'h-3.5 flex-1 max-w-[60%]',
                  SKELETON_BLOCK_CLASSNAME,
                )}
              />
              <div
                className={cn('h-3.5 w-10 shrink-0', SKELETON_BLOCK_CLASSNAME)}
              />
            </div>
            <div
              className={cn('mt-1.5 h-2.5 w-1/2', SKELETON_BLOCK_CLASSNAME)}
            />
            <div
              className={cn('mt-1.5 h-2.5 w-[72%]', SKELETON_BLOCK_CLASSNAME)}
            />
          </div>
        </div>
      </div>
    );
  },
);
