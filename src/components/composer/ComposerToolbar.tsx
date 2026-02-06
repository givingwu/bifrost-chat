import { type FormEvent, useCallback, useMemo, useState } from 'react';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import { ComposerActions } from './ComposerActions';
import { ComposerAttachments } from './ComposerAttachments';
import { ComposerHint } from './ComposerHint';
import { ComposerInput } from './ComposerInput';
import { INPUT_LIMITS, TEST_IDS } from './composer.constants';

export interface ComposerToolbarProps {
  /** 当前激活渠道 */
  channel?: ChannelTypeEnum;
  /** 发送回调 */
  onSend?: (message: string) => void | Promise<void>;
  /** 附件选择回调 */
  onAttachmentSelect?: (files: File[]) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** Emoji 点击回调 */
  onEmojiClick?: () => void;
  /** 最大长度 */
  maxLength?: number;
}

/**
 * 最大长度数量
 */
export const MAX_LENGTH_MAP: Record<ChannelTypeEnum, number> = {
  [ChannelTypeEnum.SMS]: INPUT_LIMITS.SMS_MAX_LENGTH,
  [ChannelTypeEnum.Email]: INPUT_LIMITS.DEFAULT_MAX_LENGTH,
  [ChannelTypeEnum.WhatsApp]: INPUT_LIMITS.WHATSAPP_MAX_LENGTH,
  [ChannelTypeEnum.Waba]: INPUT_LIMITS.WABA_MAX_LENGTH,
};

/**
 * ComposerToolbar 组件
 *
 * 输入框策略工具栏，根据不同渠道展示不同的交互方式
 *
 * @example
 * ```tsx
 * <ComposerToolbar
 *   channel="whatsapp"
 *   onSend={handleSendMessage}
 *   onAttachmentSelect={handleFiles}
 *   maxLength={4096}
 * />
 * ```
 */
export const ComposerToolbar = ({
  channel,
  onSend,
  onAttachmentSelect,
  disabled = false,
  loading = false,
  onEmojiClick,
  maxLength,
}: ComposerToolbarProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 根据渠道确定最大长度
  const effectiveMaxLength = useMemo(() => {
    if (maxLength) {
      return maxLength;
    }

    if (channel) {
      return MAX_LENGTH_MAP[channel];
    }

    return INPUT_LIMITS.DEFAULT_MAX_LENGTH;
  }, [channel, maxLength]);

  // 计算占位符文本
  const placeholder = useMemo(() => {
    if (channel) {
      return t('composer.placeholder.channel', { channel });
    }
    return t('composer.placeholder.default');
  }, [channel, t]);

  // 计算是否可以发送
  const canSend = useMemo(() => {
    return value.trim().length > 0 && !isSending;
  }, [value, isSending]);

  // 处理发送消息
  const handleSend = useCallback(async () => {
    if (!canSend || disabled || isSending) {
      return;
    }

    const messageToSend = value.trim();
    if (!messageToSend) {
      return;
    }

    setIsSending(true);
    try {
      await onSend?.(messageToSend);
      setValue(''); // 仅在发送成功后清空输入框
    } catch (error) {
      // 错误处理由调用方负责，这里只重置状态
      console.error('Failed to send message:', error);
      // 可以选择不清空输入框，让用户可以重试
    } finally {
      setIsSending(false);
    }
  }, [canSend, disabled, isSending, value, onSend]);

  // 处理附件选择
  const handleAttachmentSelect = useCallback(
    (files: File[]) => {
      if (!disabled) {
        onAttachmentSelect?.(files);
      }
    },
    [disabled, onAttachmentSelect],
  );

  // 处理表单提交（防止意外的表单提交）
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleSend();
    },
    [handleSend],
  );

  // 根据渠道确定允许的文件类型
  const accept = useMemo(() => {
    switch (channel) {
      case ChannelTypeEnum.SMS:
        // SMS 通常不支持附件
        return '';
      case ChannelTypeEnum.WhatsApp:
        // WhatsApp 支持图片、视频、文档等
        return 'image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx';
      case ChannelTypeEnum.Waba:
        // WABA 支持的文件类型（与 WhatsApp 类似但可能有差异）
        return 'image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx';
      case ChannelTypeEnum.Email:
        // Email 支持所有类型
        return '*';
      default:
        return '*';
    }
  }, [channel]);

  return (
    <div
      data-testid={TEST_IDS.COMPOSER}
      data-component={TEST_IDS.COMPOSER}
      data-channel={channel}
      className={cn(
        'p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md',
        'border-t border-gray-200/50 dark:border-white/10',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ComposerAttachments
            disabled={disabled || !accept}
            onAttachmentSelect={handleAttachmentSelect}
            accept={accept}
            multiple
          />
          <ComposerInput
            value={value}
            placeholder={placeholder}
            onChange={setValue}
            onEnter={handleSend}
            disabled={disabled || isSending}
            maxLength={effectiveMaxLength}
            onEmojiClick={onEmojiClick}
          />
          <ComposerActions
            canSend={canSend}
            onSend={handleSend}
            loading={isSending || loading}
            disabled={disabled}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
          <span
            className="rounded-full border border-border px-2.5 py-1"
            data-testid={TEST_IDS.COMPOSER_CHANNEL_BADGE}
          >
            {channel ?? 'default'}
          </span>
          <div className="flex items-center gap-3">
            <ComposerHint channel={channel} />
            <span
              className={cn(
                'transition-colors duration-200',
                value.length > effectiveMaxLength && 'text-destructive',
              )}
              data-testid={TEST_IDS.COMPOSER_CHAR_COUNT}
            >
              {value.length} / {effectiveMaxLength}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};
