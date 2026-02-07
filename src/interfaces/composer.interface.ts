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
 *   enableAttachments: true,
 *   enableAudioInput: true,
 *   maxAttachments: 5,
 *   maxAttachmentSize: 10 * 1024 * 1024, // 10MB
 *   allowedFileTypes: ['image/*', 'application/pdf'],
 *   maxAudioDuration: 60, // 60秒
 *   audioOutputFormat: AudioOutputFormatEnum.Raw,
 * };
 * ```
 */
export interface IComposerConfig {
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
}

/**
 * Composer 配置更新参数
 *
 * @description
 * 用于部分更新 Composer 配置
 */
export type ComposerUpdateParams = Partial<IComposerConfig>;
