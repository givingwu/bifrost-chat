import type { StateCreator } from 'zustand';
import { AudioOutputFormatEnum } from '@/interfaces/audio.interface';
import type {
  ComposerUpdateParams,
  IComposerConfig,
} from '@/interfaces/composer.interface';

/**
 * Composer 配置 Slice
 *
 * @description
 * 管理 Composer 组件的功能配置，包括附件和音频输入的开关及限制参数
 */
export interface ComposerSlice {
  /** Composer 配置状态 */
  composer: IComposerConfig;
  /** Composer 配置操作 */
  actions: {
    /** 更新 Composer 配置（部分更新） */
    setComposerConfig: (params: ComposerUpdateParams) => void;
    /** 重置 Composer 配置为默认值 */
    resetComposerConfig: () => void;
  };
}

export type ComposerState = IComposerConfig;

/**
 * 默认 Composer 配置
 */
const DEFAULT_COMPOSER_CONFIG: IComposerConfig = {
  // 功能启用配置
  enableAttachments: false,
  enableAudioInput: false,
  // 限制参数配置
  maxAttachments: 10,
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: undefined,
  maxAudioDuration: 300, // 5分钟
  audioOutputFormat: AudioOutputFormatEnum.Raw,
  // UI 显示配置
  showChannelBadge: true,
  showCharCount: true,
  showHint: true,
  showEmojiButton: true,
};

/**
 * 创建 Composer 配置 Slice
 *
 * @example
 * ```typescript
 * const composerSlice = createComposerSlice(...args);
 * ```
 */
export const createComposerSlice: StateCreator<
  ComposerSlice,
  [],
  [],
  ComposerSlice
> = (set) => ({
  composer: DEFAULT_COMPOSER_CONFIG,
  actions: {
    setComposerConfig: (params: ComposerUpdateParams) =>
      set((state) => ({
        composer: { ...state.composer, ...params },
      })),
    resetComposerConfig: () =>
      set(() => ({
        composer: DEFAULT_COMPOSER_CONFIG,
      })),
  },
});
