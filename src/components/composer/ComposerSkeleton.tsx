import { memo } from 'react';
import { cn } from '@/utils/class.util';
import { TEST_IDS } from './composer.constants';

const SKELETON_BLOCK_CLASSNAME = 'bg-gray-200/90 dark:bg-gray-700/80';

export interface ComposerSkeletonProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * ComposerSkeleton 组件
 *
 * 在会话详情加载期间占位输入区，避免先渲染真实 Composer 后又切换告警。
 */
export const ComposerSkeleton = memo(function ComposerSkeleton({
  className,
}: ComposerSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-testid={TEST_IDS.COMPOSER_SKELETON}
      className={cn(
        'pointer-events-none animate-pulse p-4',
        'border-t border-gray-200/50 bg-white/50 backdrop-blur-md',
        'dark:border-white/10 dark:bg-gray-900/50',
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <div
          className={cn(
            'h-20 w-full rounded-sm border border-transparent',
            SKELETON_BLOCK_CLASSNAME,
          )}
        />
        <div className="flex items-center justify-between">
          <div className={cn('h-3 w-24 rounded', SKELETON_BLOCK_CLASSNAME)} />
          <div className="flex items-center gap-2">
            <div
              className={cn('h-6 w-6 rounded-full', SKELETON_BLOCK_CLASSNAME)}
            />
            <div
              className={cn('h-6 w-6 rounded-full', SKELETON_BLOCK_CLASSNAME)}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
