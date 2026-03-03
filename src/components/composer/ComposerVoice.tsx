import { Mic } from 'lucide-react';
import { memo } from 'react';
import { IconButton } from '@/components/IconButton';
import { ARIA_LABELS, BUTTON_SIZES, TEST_IDS } from './composer.constants';

export interface ComposerVoiceProps {
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onClick?: () => void;
}

/**
 * ComposerVoice 组件
 *
 * 独立的语音输入按钮组件
 *
 * @example
 * ```tsx
 * <ComposerVoice
 *   disabled={false}
 *   onClick={handleVoiceInput}
 * />
 * ```
 */
export const ComposerVoice = memo<ComposerVoiceProps>(
  ({ disabled = false, onClick }) => {
    return (
      <IconButton
        icon={<Mic className={BUTTON_SIZES.ICON_XS} />}
        variant="muted"
        size="xs"
        disabled={disabled}
        onClick={onClick}
        aria-label={ARIA_LABELS.VOICE_INPUT}
        data-testid={TEST_IDS.COMPOSER_VOICE}
      />
    );
  },
);

ComposerVoice.displayName = 'ComposerVoice';
