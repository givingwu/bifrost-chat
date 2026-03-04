import { memo, useEffect } from 'react';
import { ComposerClearButton } from './ComposerClearButton';
import { ComposerSendButton } from './ComposerSendButton';

export interface ComposerActionsProps {
  /** 是否可以发送消息 */
  canSend: boolean;
  /** 发送回调 */
  onSend?: () => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示清空按钮 */
  showClear?: boolean;
  /** 清空回调 */
  onClear?: () => void;
}

/**
 * ComposerActions 组件
 *
 * 容器组件，负责渲染 Clear、Send 按钮
 * 按钮渲染顺序：[ClearButton, SendButton]
 *
 * 渲染逻辑：
 * 1. 当 canSend=true 时，渲染 SendButton
 * 2. 当 canSend=true && showClear=true && onClear 存在时，渲染 ClearButton
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
 * ```
 */
export const ComposerActions = memo<ComposerActionsProps>(
  ({
    canSend,
    onSend,
    loading = false,
    disabled = false,
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
      }
    }, [showClear, onClear]);

    // 渲染逻辑：仅在 canSend=true 时渲染按钮
    if (canSend) {
      return (
        <>
          {/* 清空按钮（仅在 showClear=true && onClear 存在时显示） */}
          {showClear && onClear && (
            <ComposerClearButton disabled={disabled} onClick={onClear} />
          )}
          {/* 发送按钮 */}
          <ComposerSendButton
            loading={loading}
            disabled={disabled}
            onClick={onSend}
          />
        </>
      );
    } else {
      return <ComposerSendButton loading={false} disabled={true} />;
    }
  },
  // 自定义比较函数，优化性能
  (prevProps, nextProps) => {
    return (
      prevProps.canSend === nextProps.canSend &&
      prevProps.loading === nextProps.loading &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.showClear === nextProps.showClear &&
      prevProps.onSend === nextProps.onSend &&
      prevProps.onClear === nextProps.onClear
    );
  },
);

ComposerActions.displayName = 'ComposerActions';
