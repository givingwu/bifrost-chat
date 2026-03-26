import {
  type FormEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { useComposerLogic } from '@/hooks/use-composer-logic.hook';
import type { Attachment } from '@/interfaces/attachment.interface';
import type { AudioData } from '@/interfaces/audio.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Template } from '@/interfaces/template.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useComposerConfig } from '@/store';
import { cn } from '@/utils/class.util';
import { AttachmentPreview } from './AttachmentPreview';
import { AudioRecorder } from './AudioRecorder';
import { ComposerActions } from './ComposerActions';
import { ComposerAttachments } from './ComposerAttachments';
import { ComposerCharCount } from './ComposerCharCount';
import { ComposerHint } from './ComposerHint';
import { ComposerInput, type ComposerInputRef } from './ComposerInput';
import { ComposerVoice } from './ComposerVoice';
import { TEST_IDS } from './composer.constants';

// ==================== 类型定义 ====================

/**
 * ComposerCore 组件 Props
 */
export interface ComposerCoreProps {
  // 核心配置
  /** 会话 ID（用于草稿存储） */
  conversationId: string;
  /** 当前激活渠道 */
  channel: ChannelTypeEnum;

  // 功能开关
  /** 是否启用草稿功能 */
  enableDraft?: boolean;

  // 回调
  /** 发送消息回调（如果不提供，使用内置发送逻辑） */
  onSend?: (
    content: string,
    options?: { templateMetadata?: unknown },
  ) => Promise<unknown> | undefined;
  /** 发送附件回调 */
  onSendAttachment?: (
    attachments: Attachment[],
    text?: string,
  ) => void | Promise<void>;
  /** 发送音频回调 */
  onSendAudio?: (audio: AudioData) => void | Promise<void>;

  // UI 状态
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 最大输入长度 */
  maxLength?: number;

  // 样式
  /** 自定义类名 */
  className?: string;
}

/**
 * ComposerCore 组件 Ref 接口
 */
export interface ComposerCoreRef {
  /** 设置输入框的值 */
  setValue: (
    value: string,
    templateCode?: string,
    templateMetadata?: unknown,
  ) => void;
  /** 聚焦输入框 */
  focus: () => void;
  /** 获取当前输入框的值 */
  getValue: () => string;
  /** 清空输入框（包括模板状态） */
  clear: () => void;
  /** 设置模板内容（由外部布局组件调用） */
  setTemplate: (data: {
    content: string;
    templateCode?: Template['code'];
    templateMetadata?: unknown;
  }) => void;
  /** 获取当前附件列表 */
  getAttachments: () => Attachment[];
}

// ==================== 工具函数 ====================

/**
 * 根据渠道类型获取允许的文件类型
 * @param channel - 渠道类型
 * @returns 文件接受类型字符串
 */
function getAcceptTypesByChannel(channel: ChannelTypeEnum): string {
  switch (channel) {
    case ChannelTypeEnum.SMS:
      // SMS 通常不支持附件
      return '';
    case ChannelTypeEnum.WhatsApp:
      // WhatsApp 支持图片、视频、音频、文档等
      return 'image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx';
    case ChannelTypeEnum.Email:
      // Email 支持所有类型
      return '*';
    default:
      return '*';
  }
}

// ==================== 组件实现 ====================

/**
 * ComposerCore 组件
 * 负责渲染 Composer 的核心功能，与外层 Composer 组件分离以支持 loading 状态
 */
export const ComposerCore = forwardRef<ComposerCoreRef, ComposerCoreProps>(
  function ComposerCore(
    {
      conversationId,
      channel,
      enableDraft = true,
      onSend,
      onSendAttachment,
      onSendAudio,
      disabled = false,
      loading = false,
      maxLength: maxLengthProp,
      className,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const composerConfig = useComposerConfig();
    const inputRef = useRef<ComposerInputRef>(null);
    const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 使用统一的逻辑 hook
    const logic = useComposerLogic({
      conversationId,
      channel,
      enableDraft,
      onSend,
      onSendAttachment,
      onSendAudio,
      disabled,
      loading,
      maxLength: maxLengthProp,
    });

    // 从 logic 解构出需要的状态（提前解构以便在多个地方使用）
    const {
      value,
      attachments,
      isRecording,
      isSending,
      isTemplateLocked,
      sendError,
      canSend,
      effectiveMaxLength,
      placeholder,
    } = logic;

    // 暴露 ref 方法给父组件
    // 使用稳定的依赖项避免不必要的重新创建
    useImperativeHandle(
      ref,
      () => ({
        setValue: (
          value: string,
          templateCode?: string,
          templateMetadata?: unknown,
        ) => {
          logic.setValue(value);

          if (templateCode) {
            logic.setTemplate({
              content: value,
              templateCode,
              templateMetadata,
            });
          }
        },
        focus: () => {
          inputRef.current?.focus();
        },
        getValue: () => value,
        setTemplate: (data: {
          content: string;
          templateCode?: string;
          templateMetadata?: unknown;
        }) => {
          logic.setTemplate(data);
        },
        clear: logic.handleClear,
        getAttachments: () => attachments,
      }),
      [logic, value, attachments],
    );

    // 清理焦点定时器
    const clearFocusTimer = useCallback(() => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    }, []);

    // 调度输入框焦点
    const scheduleFocusInput = useCallback(() => {
      clearFocusTimer();
      focusTimerRef.current = setTimeout(() => {
        inputRef.current?.focus();
        focusTimerRef.current = null;
      }, 0);
    }, [clearFocusTimer]);

    // 组件卸载时清理定时器
    useEffect(() => {
      return () => {
        clearFocusTimer();
      };
    }, [clearFocusTimer]);

    // 处理表单提交（防止意外的表单提交）
    const handleSubmit = useCallback(
      (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        logic.handleSend();
      },
      [logic.handleSend],
    );

    // 处理移除附件
    const handleRemoveAttachment = useCallback(
      (index: number) => {
        logic.handleRemoveAttachment(index);
      },
      [logic.handleRemoveAttachment],
    );

    // 处理音频输入
    const handleAudioInput = useCallback(() => {
      logic.handleAudioInput();
    }, [logic.handleAudioInput]);

    // 处理发送音频
    const handleSendAudio = useCallback(
      async (audio: AudioData) => {
        await logic.handleSendAudio(audio);
      },
      [logic.handleSendAudio],
    );

    // 处理取消录音
    const handleCancelRecording = useCallback(() => {
      logic.handleCancelRecording();
    }, [logic.handleCancelRecording]);

    // 处理清空输入框
    const handleClear = useCallback(() => {
      logic.handleClear();
      scheduleFocusInput();
    }, [logic.handleClear, scheduleFocusInput]);

    // 处理错误关闭（仅关闭错误提示，不清空输入）
    const handleErrorDismiss = useCallback(() => {
      logic.handleClear();
    }, [logic.handleClear]);

    // 根据渠道确定允许的文件类型（使用工具函数提高可测试性）
    const accept = useMemo(() => getAcceptTypesByChannel(channel), [channel]);

    // 计算附件按钮是否禁用
    const isAttachmentsDisabled = useMemo(
      () => disabled || isSending || isRecording || isTemplateLocked || !accept,
      [disabled, isSending, isRecording, isTemplateLocked, accept],
    );

    // 计算语音按钮是否禁用
    const isVoiceDisabled = useMemo(
      () => disabled || isRecording,
      [disabled, isRecording],
    );

    // 计算操作按钮是否禁用
    const isActionsDisabled = useMemo(
      () => disabled || isRecording,
      [disabled, isRecording],
    );

    // 计算输入框是否禁用
    const isInputDisabled = useMemo(
      () => disabled || isSending || isRecording,
      [disabled, isSending, isRecording],
    );

    return (
      <div
        data-testid={TEST_IDS.COMPOSER}
        data-component={TEST_IDS.COMPOSER}
        data-channel={channel}
        className={cn(
          'p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md',
          'border-t border-gray-200/50 dark:border-white/10',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
        aria-disabled={disabled}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-1">
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

          {/* 错误提示 */}
          {sendError && (
            <div
              className="bg-error/10 text-error text-sm px-3 py-2 rounded-lg flex items-center justify-between"
              role="alert"
              aria-live="polite"
            >
              <span>{sendError}</span>
              <button
                type="button"
                onClick={handleErrorDismiss}
                className="text-error hover:text-error/80 ml-2 p-1 rounded hover:bg-error/10 transition-colors"
                aria-label={t('composer.aria.closeError')}
              >
                ✕
              </button>
            </div>
          )}

          {/* 输入框区域（带视觉包裹） */}
          <ComposerInput
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            onChange={logic.setValue}
            onEnter={logic.handleSend}
            disabled={isInputDisabled}
            readOnly={isTemplateLocked}
            maxLength={effectiveMaxLength}
          />

          {/* 底部工具栏 - 所有操作按钮 */}
          <div className="flex items-center justify-between">
            {/* 左侧：渠道相关 */}
            <div className="flex items-center gap-1">
              {composerConfig.showHint && <ComposerHint channel={channel} />}
              {composerConfig.showCharCount && (
                <ComposerCharCount
                  currentLength={value.length}
                  maxLength={effectiveMaxLength}
                />
              )}
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-1">
              {composerConfig.enableAttachments && (
                <ComposerAttachments
                  disabled={isAttachmentsDisabled}
                  onAttachmentSelect={logic.handleAttachmentSelect}
                  accept={accept}
                  multiple
                />
              )}
              {composerConfig.enableAudioInput && !canSend && (
                <ComposerVoice
                  disabled={isVoiceDisabled}
                  onClick={handleAudioInput}
                />
              )}
              <ComposerActions
                canSend={canSend}
                onSend={logic.handleSend}
                loading={isSending}
                disabled={isActionsDisabled}
                showClear={isTemplateLocked}
                onClear={handleClear}
              />
            </div>
          </div>
        </form>
      </div>
    );
  },
);

ComposerCore.displayName = 'ComposerCore';
