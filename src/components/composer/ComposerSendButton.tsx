import { Send } from 'lucide-react';
import { memo } from 'react';
import { IconButton } from '@/components/IconButton';
import { ARIA_LABELS, BUTTON_SIZES, TEST_IDS } from './composer.constants';

export interface ComposerSendButtonProps {
  /** 是否加载中 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onClick?: () => void;
}

/**
 * ComposerSendButton 组件
 *
 * 独立的发送按钮组件
 *
 * @example
 * ```tsx
 * <ComposerSendButton
 *   loading={false}
 *   disabled={false}
 *   onClick={handleSend}
 * />
 * ```
 */
export const ComposerSendButton = memo<ComposerSendButtonProps>(
  ({ loading = false, disabled = false, onClick }) => {
    return (
      <IconButton
        icon={<Send className={BUTTON_SIZES.ICON_XS} />}
        variant="primary"
        size="xs"
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95"
        onClick={onClick}
        loading={loading}
        disabled={disabled}
        aria-label={ARIA_LABELS.SEND}
        data-testid={TEST_IDS.COMPOSER_SEND}
      />
    );
  },
);

ComposerSendButton.displayName = 'ComposerSendButton';
