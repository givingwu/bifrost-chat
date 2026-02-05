import { useState } from 'react';
import { useSendMessage } from '@/hooks/use-send-message.hook';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ComposerToolbar } from './ComposerToolbar';

export interface ComposerToolbarContainerProps {
  /** 会话 ID */
  conversationId: string;
  /** 当前激活渠道 */
  channel?: ChannelTypeEnum;
  /** 自定义类名 */
  className?: string;
}

/**
 * ComposerToolbarContainer：输入工具栏容器组件
 *
 * @description
 * 使用 React Query Hook 发送消息，支持乐观更新。
 *
 * @example
 * ```tsx
 * function ChatPanel({ conversationId, channel }) {
 *   return (
 *     <ServiceProvider {...services}>
 *       <ComposerToolbarContainer
 *         conversationId={conversationId}
 *         channel={channel}
 *       />
 *     </ServiceProvider>
 *   );
 * }
 * ```
 */
export function ComposerToolbarContainer({
  conversationId,
  channel,
  className,
}: ComposerToolbarContainerProps) {
  const sendMessage = useSendMessage();

  // 处理发送消息
  const handleSend = async (content: string) => {
    try {
      await sendMessage.mutateAsync({
        conversationId,
        content,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error; // 重新抛出错误，让 ComposerToolbar 处理
    }
  };

  return (
    <div className={className}>
      <ComposerToolbar
        channel={channel}
        onSend={handleSend}
        disabled={sendMessage.isPending}
        loading={sendMessage.isPending}
      />
    </div>
  );
}
