import { Mic, Send, X } from 'lucide-react';
import { memo } from 'react';
import { IconButton } from '@/components/IconButton';
import { useComposerConfig } from '@/store';
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
  /** 音频输入回调 */
  onAudioInput?: () => void;
  /** 是否显示清空按钮 */
  showClear?: boolean;
  /** 清空回调 */
  onClear?: () => void;
}

/**
 * ComposerActions 组件
 *
 * 根据输入状态显示发送按钮或音频输入按钮
 *
 * @example
 * ```tsx
 * <ComposerActions
 *   canSend={hasContent}
 *   onSend={handleSend}
 *   onAudioInput={handleAudioInput}
 *   loading={isSending}
 *   showClear={true}
 *   onClear={handleClear}
 * />
 * ```
 */
export const ComposerActions = memo<ComposerActionsProps>(
  ({
    canSend,
    onSend,
    loading = false,
    disabled = false,
    onAudioInput,
    showClear = false,
    onClear,
  }) => {
    const composerConfig = useComposerConfig();

    // 如果显示清空按钮，显示清空按钮（即使 canSend 为 false）
    if (showClear) {
      return (
        <div className="flex items-center gap-2">
          <IconButton
            icon={<X className={BUTTON_SIZES.ICON_MEDIUM} />}
            variant="muted"
            size="md"
            onClick={onClear}
            disabled={disabled}
            aria-label="清空"
            data-testid="composer-clear"
          />
          {canSend && (
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
          )}
        </div>
      );
    }

    // 如果不显示清空按钮但可以发送，显示发送按钮
    if (canSend) {
      return (
        <div className="flex items-center gap-2">
          <IconButton
            icon={<X className={BUTTON_SIZES.ICON_MEDIUM} />}
            variant="muted"
            size="md"
            onClick={onClear}
            disabled={disabled}
            aria-label="清空"
            data-testid="composer-clear"
          />
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
        </div>
      );
    }

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

    // 如果启用了音频输入功能，显示音频按钮
    if (composerConfig.enableAudioInput && onAudioInput) {
      return (
        <IconButton
          icon={<Mic className={BUTTON_SIZES.ICON_MEDIUM} />}
          variant="muted"
          size="md"
          disabled={disabled}
          onClick={onAudioInput}
          aria-label={ARIA_LABELS.VOICE_INPUT}
          data-testid={TEST_IDS.COMPOSER_VOICE}
        />
      );
    }

    // 如果没有启用音频输入，不显示任何按钮
    return null;
  },
);

ComposerActions.displayName = 'ComposerActions';
