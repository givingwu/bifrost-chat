import { forwardRef } from 'react';
import type { Attachment } from '@/interfaces/attachment.interface';
import type { AudioData } from '@/interfaces/audio.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  ComposerToolbar,
  type ComposerToolbarRef,
} from './ComposerToolbar';
import { ComposerSkeleton } from './ComposerSkeleton';

// ==================== 类型定义 ====================

/**
 * Composer 组件 Props
 */
export interface ComposerProps {
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
  /** 是否加载中，加载期间显示 ComposerSkeleton 占位 */
  loading?: boolean;
  /** 最大输入长度 */
  maxLength?: number;

  // 样式
  /** 自定义类名 */
  className?: string;
}

// 重新导出 ComposerToolbarRef 以保持向后兼容
export type ComposerRef = ComposerToolbarRef;

// ==================== 组件实现 ====================

/**
 * Composer 组件
 *
 * 统一的消息输入组件，整合了草稿、附件、录音等功能。
 * 使用 useComposerLogic hook 管理所有状态。
 *
 * @example
 * ```tsx
 * <Composer
 *   conversationId="conv-123"
 *   channel={ChannelTypeEnum.WhatsApp}
 *   onSend={handleSend}
 *   onSendAttachment={handleSendAttachment}
 *   onSendAudio={handleSendAudio}
 * />
 * ```
 */
export const Composer = forwardRef<ComposerToolbarRef, ComposerProps>(
  function Composer({ loading = false, className, ...props }, ref) {
    if (loading) {
      return <ComposerSkeleton className={className} />;
    }

    return (
      <ComposerToolbar
        {...props}
        ref={ref}
        loading={false}
        className={className}
      />
    );
  },
);

Composer.displayName = 'Composer';
