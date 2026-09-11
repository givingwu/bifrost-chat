import { memo } from 'react';
import { cn } from '@/utils/class.util';
import { TEST_IDS, TEXT_SIZES } from './composer.constants';

export interface ComposerCharCountProps {
  /** 当前输入长度 */
  currentLength: number;
  /** 最大长度；为空时表示当前消息不受字数限制 */
  maxLength?: number;
}

/**
 * ComposerCharCount 组件
 *
 * 显示输入框的字符计数，支持超过最大长度时的视觉反馈
 *
 * @example
 * ```tsx
 * <ComposerCharCount
 *   currentLength={value.length}
 *   maxLength={2000}
 * />
 * ```
 */
export const ComposerCharCount = memo<ComposerCharCountProps>(
  ({ currentLength, maxLength }) => {
    const isOverLimit = maxLength !== undefined && currentLength > maxLength;

    return (
      <span
        className={cn(
          TEXT_SIZES.HINT,
          'text-gray-400 dark:text-gray-500',
          'transition-colors duration-200',
          isOverLimit && 'text-destructive',
        )}
        data-testid={TEST_IDS.COMPOSER_CHAR_COUNT}
      >
        {maxLength === undefined
          ? currentLength
          : `${currentLength} / ${maxLength}`}
      </span>
    );
  },
);

ComposerCharCount.displayName = 'ComposerCharCount';
