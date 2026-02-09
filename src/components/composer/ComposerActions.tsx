import { Mic, Send, X } from 'lucide-react';
import { memo, useCallback, useEffect } from 'react';
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
  /** 是否启用音频输入功能 */
  enableAudioInput?: boolean;
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
 * 根据输入状态动态显示操作按钮，优先级如下：
 * 1. canSend=true: 显示发送按钮（可选显示清空按钮）
 * 2. showClear=true: 显示清空按钮
 * 3. enableAudioInput=true: 显示音频输入按钮
 * 4. 默认: 不显示任何按钮
 *
 * @example
 * ```tsx
 * // 场景1: 有内容时显示发送按钮
 * <ComposerActions canSend={true} onSend={handleSend} />
 *
 * // 场景2: 有内容且允许清空
 * <ComposerActions
 *   canSend={true}
 *   showClear={true}
 *   onSend={handleSend}
 *   onClear={handleClear}
 * />
 *
 * // 场景3: 无内容时显示音频按钮
 * <ComposerActions
 *   canSend={false}
 *   onAudioInput={handleAudioInput}
 * />
 * ```
 */
export const ComposerActions = memo<ComposerActionsProps>(
  ({
    canSend,
    onSend,
    loading = false,
    disabled = false,
    enableAudioInput = false,
    onAudioInput,
    showClear = false,
    onClear,
  }) => {
    // 开发环境警告：检测配置不一致
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        if (showClear && !onClear) {
          console.warn(
            '[ComposerActions] showClear is true but onClear callback is not provided',
          );
        }
        if (enableAudioInput && !onAudioInput) {
          console.warn(
            '[ComposerActions] enableAudioInput is true but onAudioInput callback is not provided',
          );
        }
      }
    }, [showClear, onClear, enableAudioInput, onAudioInput]);

    // 渲染发送按钮
    const renderSendButton = useCallback(
      () => (
        <IconButton
          icon={<Send className={BUTTON_SIZES.ICON_MEDIUM} />}
          variant="primary"
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95 mb-0.5"
          onClick={onSend}
          loading={loading}
          disabled={disabled}
          aria-label={ARIA_LABELS.SEND}
          data-testid={TEST_IDS.COMPOSER_SEND}
        />
      ),
      [disabled, loading, onSend],
    );

    // 渲染清空按钮
    const renderClearButton = useCallback(
      () => (
        <IconButton
          icon={<X className={BUTTON_SIZES.ICON_MEDIUM} />}
          variant="muted"
          size="sm"
          onClick={onClear}
          disabled={disabled}
          aria-label={ARIA_LABELS.CLEAR}
          data-testid={TEST_IDS.COMPOSER_CLEAR}
        />
      ),
      [disabled, onClear],
    );

    // 渲染音频按钮
    const renderAudioButton = useCallback(
      () => (
        <IconButton
          icon={<Mic className={BUTTON_SIZES.ICON_MEDIUM} />}
          variant="muted"
          size="sm"
          disabled={disabled}
          onClick={onAudioInput}
          aria-label={ARIA_LABELS.VOICE_INPUT}
          data-testid={TEST_IDS.COMPOSER_VOICE}
        />
      ),
      [disabled, onAudioInput],
    );

    // 优先级1: 可以发送消息
    if (canSend) {
      // 如果需要显示清空按钮，显示清空+发送
      if (showClear && onClear) {
        return (
          <div className="flex items-center gap-2">
            {renderClearButton()}
            {renderSendButton()}
          </div>
        );
      }
      // 否则只显示发送按钮
      return renderSendButton();
    }

    // 优先级2: 显示清空按钮
    if (showClear && onClear) {
      return renderClearButton();
    }

    // 优先级3: 音频输入
    if (enableAudioInput && onAudioInput) {
      return renderAudioButton();
    }

    // 默认: 不显示任何按钮
    return null;
  },
  // 自定义比较函数，优化性能
  (prevProps, nextProps) => {
    return (
      prevProps.canSend === nextProps.canSend &&
      prevProps.loading === nextProps.loading &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.showClear === nextProps.showClear &&
      prevProps.onSend === nextProps.onSend &&
      prevProps.onClear === nextProps.onClear &&
      prevProps.onAudioInput === nextProps.onAudioInput &&
      prevProps.enableAudioInput === nextProps.enableAudioInput
    );
  },
);

ComposerActions.displayName = 'ComposerActions';
