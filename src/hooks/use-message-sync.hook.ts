import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useServices } from '@/providers/service.provider';
import { MessageSyncService } from '@/services/message-sync.service';

/**
 * useMessageSync
 *
 * @description
 * SDK 内部订阅消息事件并自动同步到消息缓存。
 */
export function useMessageSync() {
  const queryClient = useQueryClient();
  const { messageService } = useServices();

  const syncService = useMemo(
    () => new MessageSyncService(queryClient, messageService),
    [queryClient, messageService],
  );

  useEffect(() => {
    syncService.start();

    return () => {
      syncService.stop();
    };
  }, [syncService]);

  return syncService;
}
