import { Mic, Send } from 'lucide-react';
import { memo } from 'react';
import { IconButton } from '@/components/IconButton';
import { ARIA_LABELS, BUTTON_SIZES, TEST_IDS } from './composer.constants';

export interface ComposerActionsProps {
  /** 是否可以发送消息 */
  canSend: boolean;
  /** 发送回调 */
  onSend?: () => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * ComposerActions 组件
 *
 * 根据输入状态显示发送按钮或语音输入按钮
 *
 * @example
 * ```tsx
 * <ComposerActions
 *   canSend={hasContent}
 *   onSend={handleSend}
 *   loading={isSending}
 * />
 * ```
 */
export const ComposerActions = memo<ComposerActionsProps>(
  ({ canSend, onSend, loading = false, disabled = false }) => {
    if (canSend) {
      return (
        <IconButton
          icon={<Send className={BUTTON_SIZES.ICON_MEDIUM} />}
          variant="primary"
          size="md"
          onClick={onSend}
          loading={loading}
          disabled={disabled}
          aria-label={ARIA_LABELS.SEND}
          data-testid={TEST_IDS.COMPOSER_SEND}
        />
      );
    }

    return (
      <IconButton
        icon={<Mic className={BUTTON_SIZES.ICON_MEDIUM} />}
        variant="muted"
        size="md"
        disabled={disabled}
        aria-label={ARIA_LABELS.VOICE_INPUT}
        data-testid={TEST_IDS.COMPOSER_VOICE}
        // TODO: 实现语音输入功能
        onClick={() => {
          console.warn('Voice input not implemented yet');
        }}
      />
    );
  },
);

ComposerActions.displayName = 'ComposerActions';
