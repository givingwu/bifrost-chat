import type { Attachment } from '@/interfaces/attachment.interface';
import type { AudioData } from '@/interfaces/audio.interface';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { IComposerConfig } from '@/interfaces/composer.interface';
import type { MessageTypeEnum } from '@/interfaces/message.interface';

// 复用现有的 Attachment 类型
export type { Attachment };

/**
 * Composer 组件 Props
 */
export interface ComposerProps {
  // 核心配置
  /** 会话 ID（用于草稿存储） */
  conversationId?: string;
  /** 当前激活渠道 */
  channel?: ChannelTypeEnum;

  // 功能开关
  /** 是否启用草稿功能 */
  enableDraft?: boolean;

  // 回调
  /** 发送消息回调（如果不提供，使用内置发送逻辑） */
  onSend?: (content: string, templateId?: string) => void | Promise<void>;
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
 * Composer 组件 Ref 接口
 */
export interface ComposerRef {
  /** 设置输入框的值 */
  setValue: (value: string, templateId?: string) => void;
  /** 聚焦输入框 */
  focus: () => void;
  /** 获取当前输入框的值 */
  getValue: () => string;
  /** 清空输入框（包括模板状态） */
  clear: () => void;
  /** 设置模板内容（由外部布局组件调用） */
  setTemplate: (data: {
    content: string;
    templateCode?: string | number;
  }) => void;
  /** 获取当前附件列表 */
  getAttachments: () => Attachment[];
}

/**
 * 合并后的 Composer 配置
 */
export type ResolvedComposerConfig = IComposerConfig & {
  disabled?: boolean;
  loading?: boolean;
};

/**
 * useComposerLogic Hook 选项
 */
export interface UseComposerLogicOptions {
  conversationId?: string;
  channel?: ChannelTypeEnum;
  enableDraft?: boolean;
  onSend?: (content: string, templateId?: string) => void | Promise<void>;
  onSendAttachment?: (
    attachments: Attachment[],
    text?: string,
  ) => void | Promise<void>;
  onSendAudio?: (audio: AudioData) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  maxLength?: number;
}

/**
 * useComposerLogic Hook 返回值
 */
export interface UseComposerLogicResult {
  // 状态
  value: string;
  attachments: Attachment[];
  isRecording: boolean;
  isSending: boolean;
  isTemplateLocked: boolean;
  isRestoring: boolean;
  sendError: string | null;

  // 草稿元数据
  messageType: MessageTypeEnum | undefined;
  templateCode: string | number | undefined;

  // 配置
  config: ResolvedComposerConfig;

  // 计算值
  effectiveMaxLength: number;
  placeholder: string;
  canSend: boolean;

  // 操作
  setValue: (value: string) => void;
  handleSend: () => Promise<void>;
  handleClear: () => void;
  handleAttachmentSelect: (files: File[]) => void;
  handleRemoveAttachment: (index: number) => void;
  handleAudioInput: () => void;
  handleSendAudio: (audio: AudioData) => Promise<void>;
  handleCancelRecording: () => void;

  // 模板操作（供外部调用）
  setTemplate: (data: {
    content: string;
    templateCode?: string | number;
  }) => void;

  // Ref 支持
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  focus: () => void;
}
