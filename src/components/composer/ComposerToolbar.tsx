import {
  type FormEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AudioData } from '@/interfaces/audio.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useComposerConfig } from '@/store';
import { cn } from '@/utils/class.util';
import {
  type Attachment,
  AttachmentPreview,
  createAttachments,
  revokeAttachmentPreviews,
} from './AttachmentPreview';
import { AudioRecorder } from './AudioRecorder';
import { ComposerActions } from './ComposerActions';
import { ComposerAttachments } from './ComposerAttachments';
import { ComposerHint } from './ComposerHint';
import { ComposerInput, type ComposerInputRef } from './ComposerInput';
import { INPUT_LIMITS, TEST_IDS } from './composer.constants';

/**
 * ComposerToolbar 暴露的 ref 接口
 */
export interface ComposerToolbarRef {
  /** 设置输入框的值 */
  setValue: (value: string, templateId?: string) => void;
  /** 聚焦输入框 */
  focus: () => void;
  /** 获取当前输入框的值 */
  getValue: () => string;
  /** 设置模板锁定状态 */
  setTemplateLocked: (locked: boolean) => void;
  /** 设置模板 ID（用于发送时携带模板信息） */
  setTemplateId: (templateId: string | undefined) => void;
}

export interface ComposerToolbarProps {
  /** 输入框值（受控组件） */
  value?: string;
  /** 输入框值变更回调（受控组件） */
  onChange?: (value: string) => void;
  /** 会话 ID（用于日志记录或未来扩展） */
  conversationId?: string;
  /** 当前激活渠道 */
  channel?: ChannelTypeEnum;
  /** 发送回调 */
  onSend?: (message: string, templateId?: string) => void | Promise<void>;
  /** 发送附件回调 */
  onSendAttachment?: (
    attachments: Attachment[],
    text?: string,
  ) => void | Promise<void>;
  /** 发送音频回调 */
  onSendAudio?: (audio: AudioData) => void | Promise<void>;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** Emoji 点击回调 */
  onEmojiClick?: () => void;
  /** 最大长度 */
  maxLength?: number;
  /** 是否锁定输入（禁止编辑，如模板内容不允许编辑时） */
  templateLocked?: boolean;
  /** 模板 ID（用于发送时携带模板信息） */
  templateId?: string;
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
export const ComposerToolbar = forwardRef<
  ComposerToolbarRef,
  ComposerToolbarProps
>(function ComposerToolbar(
  {
    channel,
    onSend,
    onSendAttachment,
    onSendAudio,
    disabled = false,
    loading = false,
    onEmojiClick,
    maxLength,
    templateLocked = false,
    value: controlledValue,
    onChange: controlledOnChange,
  }: ComposerToolbarProps,
  ref,
) {
  const { t } = useTranslation();
  const composerConfig = useComposerConfig();
  // 支持受控和非受控模式
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = useCallback(
    (newValue: string) => {
      if (controlledOnChange) {
        controlledOnChange(newValue);
      } else {
        setInternalValue(newValue);
      }
    },
    [controlledOnChange],
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTemplateLocked, setIsTemplateLocked] = useState(templateLocked);
  const [currentTemplateId, setCurrentTemplateId] = useState<
    string | undefined
  >();
  const inputRef = useRef<ComposerInputRef>(null);

  // 同步 templateLocked prop 的变化到内部状态
  useEffect(() => {
    setIsTemplateLocked(templateLocked);
  }, [templateLocked]);

  // 暴露 ref 方法给父组件
  useImperativeHandle(
    ref,
    () => ({
      setValue: (newValue: string, templateId?: string) => {
        handleChange(newValue);
        // 设置模板 ID
        if (templateId) {
          setCurrentTemplateId(templateId);
        }
        // 当设置新值时，如果是模板模式且不允许编辑，则锁定输入框
        if (
          composerConfig.templateMode === 'edit' &&
          composerConfig.allowTemplateEdit === false
        ) {
          setIsTemplateLocked(true);
        }
      },
      focus: () => {
        inputRef.current?.focus();
      },
      getValue: () => value,
      setTemplateLocked: (locked: boolean) => {
        setIsTemplateLocked(locked);
      },
      setTemplateId: (templateId: string | undefined) => {
        setCurrentTemplateId(templateId);
      },
    }),
    [
      value,
      composerConfig.templateMode,
      composerConfig.allowTemplateEdit,
      handleChange,
    ],
  );

  // 清理附件预览 URL
  useEffect(() => {
    return () => {
      revokeAttachmentPreviews(attachments);
    };
  }, [attachments]);

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
    const hasContent = value.trim().length > 0 || attachments.length > 0;
    return hasContent && !isSending;
  }, [value, isSending, attachments]);

  // 处理发送消息
  const handleSend = useCallback(async () => {
    if (!canSend || disabled || isSending) {
      console.log('[ComposerToolbar] Send ignored:', {
        canSend,
        disabled,
        isSending,
      });
      return;
    }

    const messageToSend = value.trim();
    const hasAttachments = attachments.length > 0;

    if (!messageToSend && !hasAttachments) {
      console.log('[ComposerToolbar] No message or attachments to send');
      return;
    }

    console.log('[ComposerToolbar] Sending:', {
      message: messageToSend,
      attachments,
      templateId: currentTemplateId,
    });

    setIsSending(true);

    try {
      // 如果有附件，使用附件发送回调
      if (hasAttachments && onSendAttachment) {
        await onSendAttachment(attachments, messageToSend || undefined);
        // 清空附件和输入框
        setAttachments([]);
      } else if (messageToSend && onSend) {
        // 传递 templateId 给发送回调
        await onSend(messageToSend, currentTemplateId);
      }
      // 仅在发送成功后清空输入框并解除锁定
      handleChange('');
      setIsTemplateLocked(false);
      setCurrentTemplateId(undefined);
      console.log('[ComposerToolbar] Message sent successfully');
    } catch (error) {
      // 错误处理由调用方负责，这里只重置状态
      console.error('[ComposerToolbar] Failed to send message:', error);
      // 可以选择不清空输入框，让用户可以重试
    } finally {
      setIsSending(false);
      console.log(
        '[ComposerToolbar] isSending set to false, focusing input...',
      );
      // 在状态更新后自动聚焦输入框
      // 使用 setTimeout 确保 isSending 状态已更新
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [
    canSend,
    disabled,
    isSending,
    value,
    attachments,
    onSend,
    onSendAttachment,
    handleChange,
    currentTemplateId,
  ]);

  // 处理附件选择
  const handleAttachmentSelect = useCallback(
    async (files: File[]) => {
      if (disabled) {
        return;
      }

      // 检查配置是否启用附件
      if (!composerConfig.enableAttachments) {
        console.warn('[ComposerToolbar] Attachments are disabled');
        return;
      }

      // 检查附件数量限制
      const maxAttachments = composerConfig.maxAttachments || 10;

      if (attachments.length + files.length > maxAttachments) {
        console.error(
          `[ComposerToolbar] Maximum attachments limit reached: ${maxAttachments}`,
        );
        // TODO: 显示错误提示给用户
        return;
      }

      // 验证文件大小和类型
      for (const file of files) {
        const maxSize = composerConfig.maxAttachmentSize || 10 * 1024 * 1024; // 10MB

        if (file.size > maxSize) {
          console.error(
            `[ComposerToolbar] File size exceeds limit: ${file.name}`,
          );
          // TODO: 显示错误提示给用户
          return;
        }

        // 检查文件类型
        if (composerConfig.allowedFileTypes) {
          const isAllowed = composerConfig.allowedFileTypes.some((type) => {
            if (type.startsWith('.')) {
              return file.name.endsWith(type);
            }
            return file.type.match(type);
          });
          if (!isAllowed) {
            console.error(
              `[ComposerToolbar] File type not allowed: ${file.name}`,
            );
            // TODO: 显示错误提示给用户
            return;
          }
        }
      }

      // 创建附件对象
      const newAttachments = await createAttachments(files);
      setAttachments((prev) => [...prev, ...newAttachments]);
    },
    [disabled, composerConfig, attachments.length],
  );

  // 处理移除附件
  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      const removed = newAttachments.splice(index, 1)[0];
      // 清理预览 URL
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newAttachments;
    });
  }, []);

  // 处理音频输入
  const handleAudioInput = useCallback(() => {
    setIsRecording(true);
  }, []);

  // 处理发送音频
  const handleSendAudio = useCallback(
    async (audio: AudioData) => {
      if (!onSendAudio) {
        console.warn('[ComposerToolbar] onSendAudio callback not provided');
        return;
      }

      setIsSending(true);

      try {
        await onSendAudio(audio);
        setIsRecording(false);
        console.log('[ComposerToolbar] Audio sent successfully');
      } catch (error) {
        console.error('[ComposerToolbar] Failed to send audio:', error);
      } finally {
        setIsSending(false);
      }
    },
    [onSendAudio],
  );

  // 处理取消录音
  const handleCancelRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  // 处理清空输入框
  const handleClear = useCallback(() => {
    handleChange('');
    setIsTemplateLocked(false);
    setCurrentTemplateId(undefined);
    // 使用 setTimeout 确保在状态更新后再聚焦
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [handleChange]);

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
        {/* 附件预览 */}
        {attachments.length > 0 && (
          <AttachmentPreview
            attachments={attachments}
            onRemove={handleRemoveAttachment}
            disabled={disabled || isSending}
          />
        )}

        {/* 音频录音器 */}
        {isRecording && composerConfig.enableAudioInput && (
          <AudioRecorder
            onSendAudio={handleSendAudio}
            onCancel={handleCancelRecording}
            disabled={disabled || isSending}
            maxDuration={composerConfig.maxAudioDuration}
          />
        )}

        <div className="flex items-center gap-3">
          {composerConfig.enableAttachments && (
            <ComposerAttachments
              disabled={
                disabled ||
                isSending ||
                isRecording ||
                isTemplateLocked ||
                !accept
              }
              onAttachmentSelect={handleAttachmentSelect}
              accept={accept}
              multiple
            />
          )}
          <ComposerInput
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            onEnter={handleSend}
            disabled={disabled || isSending || isRecording || isTemplateLocked}
            maxLength={effectiveMaxLength}
            onEmojiClick={onEmojiClick}
            showEmojiButton={composerConfig.showEmojiButton}
            showCharCount={composerConfig.showCharCount}
          />
          <ComposerActions
            canSend={canSend}
            onSend={handleSend}
            enableAudioInput={composerConfig.enableAudioInput}
            onAudioInput={handleAudioInput}
            loading={isSending || loading}
            disabled={disabled || isRecording}
            showClear={isTemplateLocked}
            onClear={handleClear}
          />
        </div>
        {/* 底部信息栏 - 根据配置控制显示 */}
        {(composerConfig.showChannelBadge ||
          composerConfig.showCharCount ||
          composerConfig.showHint) && (
          <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
            {composerConfig.showChannelBadge && (
              <span
                className="rounded-full border border-border px-2.5 py-1"
                data-testid={TEST_IDS.COMPOSER_CHANNEL_BADGE}
              >
                {channel ?? 'default'}
              </span>
            )}
            <div className="flex items-center gap-3">
              {composerConfig.showHint && <ComposerHint channel={channel} />}
              {composerConfig.showCharCount && (
                <span
                  className={cn(
                    'transition-colors duration-200',
                    value.length > effectiveMaxLength && 'text-destructive',
                  )}
                  data-testid={TEST_IDS.COMPOSER_CHAR_COUNT}
                >
                  {value.length} / {effectiveMaxLength}
                </span>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
});

ComposerToolbar.displayName = 'ComposerToolbar';
