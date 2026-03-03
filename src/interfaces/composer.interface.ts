import type { AudioOutputFormatEnum } from './audio.interface';

/**
 * Composer 功能配置状态
 *
 * @description
 * 控制 Composer 组件的功能开关和限制参数
 *
 * @example
 * ```typescript
 * const composer: ComposerConfig = {
 *   // 功能启用配置
 *   enableAttachments: true,
 *   enableAudioInput: true,
 *   // 限制参数配置
 *   maxAttachments: 5,
 *   maxAttachmentSize: 10 * 1024 * 1024, // 10MB
 *   allowedFileTypes: ['image/*', 'application/pdf'],
 *   maxAudioDuration: 60, // 60秒
 *   audioOutputFormat: AudioOutputFormatEnum.Raw,
 *   // UI 显示配置
 *   showChannelSwitcher: true,
 *   showCharCount: true,
 *   showHint: true,
 *   showEmojiButton: true,
 * };
 * ```
 */
export interface IComposerConfig {
  // ==================== 功能启用配置 ====================

  /**
   * 是否启用附件功能
   * @default true
   */
  enableAttachments: boolean;

  /**
   * 是否启用音频输入功能
   * @default true
   */
  enableAudioInput: boolean;

  // ==================== 草稿功能配置 ====================

  /**
   * 是否启用草稿自动保存功能
   * @default true
   */
  enableDraft?: boolean;

  /**
   * 草稿防抖延迟时间（毫秒）
   * @default 500
   */
  draftDebounceDelay?: number;

  /**
   * 是否在发送成功后自动清除草稿
   * @default true
   */
  clearDraftOnSend?: boolean;

  /**
   * 是否在切换会话时保留草稿
   * @default true
   */
  keepDraftOnSwitch?: boolean;

  // ==================== 限制参数配置 ====================

  /**
   * 最大附件数量
   * @default 10
   */
  maxAttachments?: number;

  /**
   * 最大附件大小（字节）
   * @default 10485760 (10MB)
   */
  maxAttachmentSize?: number;

  /**
   * 允许的文件类型（MIME type）
   * @example ['image/*', 'application/pdf', '.doc,.docx']
   * @default undefined (不限制)
   */
  allowedFileTypes?: string[];

  /**
   * 最大录音时长（秒）
   * @default 300 (5分钟)
   */
  maxAudioDuration?: number;

  /**
   * 音频输出格式
   * @default AudioOutputFormatEnum.Raw
   */
  audioOutputFormat?: AudioOutputFormatEnum;

  // ==================== UI 显示配置 ====================

  /**
   * 是否显示渠道切换器
   * @default true
   */
  showChannelSwitcher?: boolean;

  /**
   * 是否显示字符计数
   * @default true
   */
  showCharCount?: boolean;

  /**
   * 是否显示提示信息
   * @default true
   */
  showHint?: boolean;

  /**
   * 是否显示表情按钮
   * @default true
   */
  showEmojiButton?: boolean;

  // ==================== 模板配置 ====================

  /**
   * 模板选择模式
   * - `direct`: 点击模板后直接发送
   * - `edit`: 点击模板后将内容填充到输入框，用户可编辑后发送
   * @default 'direct'
   */
  templateMode?: 'direct' | 'edit';

  /**
   * 是否允许编辑模板内容
   * 仅在 `templateMode` 为 `edit` 时生效
   * - `true`: 用户可以编辑模板内容
   * - `false`: 用户只能直接发送或清空，不能编辑
   * @default true
   */
  allowTemplateEdit?: boolean;
}

/**
 * Composer 配置更新参数
 *
 * @description
 * 用于部分更新 Composer 配置
 */
export type ComposerUpdateParams = Partial<IComposerConfig>;
