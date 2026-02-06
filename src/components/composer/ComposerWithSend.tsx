import { memo, useCallback } from 'react';
import { useSendMessage } from '@/hooks/use-send-message.hook';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ComposerToolbar } from './ComposerToolbar';

export interface ComposerWithSendProps {
  /** 会话 ID */
  conversationId: string;
  /** 当前激活渠道 */
  channel?: ChannelTypeEnum;
}

/**
 * ComposerWithSend：带发送功能的输入工具栏组件
 *
 * @description
 * 组合 ComposerToolbar 和 useSendMessage Hook，提供完整的消息发送功能。
 * 支持乐观更新和错误处理。
 *
 * @example
 * ```tsx
 * function ChatPanel({ conversationId, channel }) {
 *   return (
 *     <ServiceProvider {...services}>
 *       <ComposerWithSend
 *         conversationId={conversationId}
 *         channel={channel}
 *       />
 *     </ServiceProvider>
 *   );
 * }
 * ```
 */
export const ComposerWithSend = memo(function ComposerWithSend({
  conversationId,
  channel,
}: ComposerWithSendProps) {
  const sendMessage = useSendMessage();
  // 处理发送消息
  const handleSend = useCallback(
    async (content: string) => {
      try {
        await sendMessage.mutateAsync({
          conversationId,
          content,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error; // 重新抛出错误，让 ComposerToolbar 处理
      }
    },
    [conversationId, sendMessage.mutateAsync],
  );

  return (
    <ComposerToolbar
      channel={channel}
      onSend={handleSend}
      disabled={sendMessage.isPending}
      loading={sendMessage.isPending}
    />
  );
});

ComposerWithSend.displayName = 'ComposerWithSend';
