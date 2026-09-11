import { X } from 'lucide-react';
import { memo } from 'react';
import { IconButton } from '@/components/IconButton';
import { useTranslation } from '@/providers/I18n.provider';
import { ARIA_LABELS, BUTTON_SIZES, TEST_IDS } from './composer.constants';

export interface ComposerClearButtonProps {
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onClick?: () => void;
}

/**
 * ComposerClearButton 组件
 *
 * 独立的清空按钮组件
 *
 * @example
 * ```tsx
 * <ComposerClearButton
 *   disabled={false}
 *   onClick={handleClear}
 * />
 * ```
 */
export const ComposerClearButton = memo<ComposerClearButtonProps>(
  ({ disabled = false, onClick }) => {
    const { t } = useTranslation();
    return (
      <IconButton
        icon={<X className={BUTTON_SIZES.ICON_XS} />}
        variant="muted"
        size="xs"
        disabled={disabled}
        onClick={onClick}
        aria-label={t(ARIA_LABELS.CLEAR)}
        data-testid={TEST_IDS.COMPOSER_CLEAR}
      />
    );
  },
);

ComposerClearButton.displayName = 'ComposerClearButton';
