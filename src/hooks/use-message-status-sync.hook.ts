import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useServices } from '@/providers/service.provider';
import { MessageSyncService } from '@/services/message-sync.service';

/**
 * 消息状态实时同步 Hook
 *
 * @description
 * 订阅 messageService 的实时状态推送，自动将服务端 ACK 同步到 React Query 缓存。
 *
 * **调用规范**：
 * 必须在布局顶层调用一次（如 DefaultChatLayout 或应用根组件），
 * 不要在每个发送组件内部重复调用，避免重复订阅导致缓存多次写入。
 *
 * @example
 * ```tsx
 * function ChatLayout() {
 *   // 在布局顶层调用一次即可
 *   useMessageStatusSync();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useMessageStatusSync() {
  const queryClient = useQueryClient();
  const { messageService } = useServices();

  const messageSyncService = useMemo(
    () => new MessageSyncService(queryClient),
    [queryClient],
  );

  useEffect(() => {
    const unsubscribe = messageService.subscribeToMessageStatus((event) => {
      messageSyncService.updateMessageStatus(event);
    });

    return () => {
      unsubscribe?.();
    };
  }, [messageService, messageSyncService]);
}
