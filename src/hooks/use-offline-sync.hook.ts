import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { NetworkReachabilityEnum } from '@/interfaces/network.interface';
import type { OfflineMessage } from '@/interfaces/offline-message.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { useNetwork } from '@/store';

function resolveOfflineMessageChannel(
  offlineMessage: Pick<OfflineMessage, 'message' | 'sendParams'>,
): ChannelTypeEnum | undefined {
  const sendParamsChannel = offlineMessage.sendParams.channelType;

  if (typeof sendParamsChannel === 'string') {
    return sendParamsChannel as ChannelTypeEnum;
  }

  return offlineMessage.message.channelType;
}

function invalidateConversationMessages(
  conversationId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  channel?: ChannelTypeEnum,
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.messages.list(conversationId),
  });

  if (channel) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.messages.list(conversationId, channel),
    });
  }
}

/**
 * 使用离线消息同步的 Hook
 *
 * @description
 * 监听网络状态变化，当网络恢复时自动重试发送离线队列中的消息
 * 支持手动触发同步
 *
 * @returns 同步状态和操作
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { sync, isSyncing, lastSyncAt } = useOfflineSync();
 *
 *   return (
 *     <div>
 *       <button onClick={sync} disabled={isSyncing}>
 *         {isSyncing ? '同步中...' : '立即同步'}
 *       </button>
 *       {lastSyncAt && (
 *         <div>上次同步: {new Date(lastSyncAt).toLocaleString()}</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOfflineSync() {
  const { offlineMessageQueue, messageService } = useServices();
  const queryClient = useQueryClient();
  const reachability = useNetwork().reachability;
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  // 跟踪上一次的网络状态，避免重复触发
  const [prevReachability, setPrevReachability] = useState(reachability);

  /**
   * 同步离线消息队列
   */
  const sync = useCallback(async () => {
    // 检查是否有离线队列服务
    if (!offlineMessageQueue) {
      console.info('[useOfflineSync] 离线队列服务未启用');
      return;
    }

    // 检查网络是否已连接
    if (reachability !== NetworkReachabilityEnum.Online) {
      console.info('[useOfflineSync] 网络未连接，跳过同步');
      return;
    }

    // 防止重复同步
    if (isSyncing) {
      console.info('[useOfflineSync] 同步正在进行中');
      return;
    }

    setIsSyncing(true);
    console.info('[useOfflineSync] 开始同步离线消息...');

    try {
      // 获取需要重试的消息
      const messages = await offlineMessageQueue.getPendingRetry();

      if (messages.length === 0) {
        console.info('[useOfflineSync] 没有需要同步的消息');
        return;
      }

      console.info(`[useOfflineSync] 找到 ${messages.length} 条待发送消息`);

      let successCount = 0;
      let failCount = 0;

      for (const offlineMsg of messages) {
        // 检查是否达到重试上限
        if (offlineMsg.retryCount >= offlineMsg.maxRetries) {
          console.warn(
            `[useOfflineSync] 消息 ${offlineMsg.id} 已达到最大重试次数`,
          );
          failCount++;
          continue;
        }

        try {
          // 重试发送
          await messageService.send(
            offlineMsg.conversationId,
            offlineMsg.sendParams,
          );

          // 发送成功，从队列中移除
          await offlineMessageQueue.dequeue(offlineMsg.id);

          console.info(`[useOfflineSync] 消息 ${offlineMsg.id} 发送成功`);
          successCount++;

          // 更新 UI
          invalidateConversationMessages(
            offlineMsg.conversationId,
            queryClient,
            resolveOfflineMessageChannel(offlineMsg),
          );
        } catch (error) {
          // 更新重试信息
          const nextRetryAt = offlineMessageQueue.calculateNextRetry(
            offlineMsg.retryCount,
          );

          await offlineMessageQueue.update(offlineMsg.id, {
            retryCount: offlineMsg.retryCount + 1,
            lastRetryAt: Date.now(),
            nextRetryAt,
            error: error instanceof Error ? error.message : String(error),
          });

          console.error(
            `[useOfflineSync] 消息 ${offlineMsg.id} 发送失败:`,
            error,
          );
          failCount++;
        }
      }

      console.info(
        `[useOfflineSync] 同步完成: ${successCount} 成功, ${failCount} 失败`,
      );
    } catch (error) {
      console.error('[useOfflineSync] 同步失败:', error);
    } finally {
      setIsSyncing(false);
      setLastSyncAt(Date.now());
    }
  }, [
    offlineMessageQueue,
    messageService,
    reachability,
    isSyncing,
    queryClient,
  ]);

  // 监听网络状态变化
  useEffect(() => {
    // 只在从非连接状态切换到连接状态时触发同步
    if (
      prevReachability !== NetworkReachabilityEnum.Online &&
      reachability === NetworkReachabilityEnum.Online
    ) {
      console.info('[useOfflineSync] 网络已连接，触发自动同步');
      // 使用 setTimeout 避免阻塞 UI
      const timer = setTimeout(() => {
        sync();
      }, 1000);

      return () => clearTimeout(timer);
    }

    // 更新上一次的网络状态
    setPrevReachability(reachability);
  }, [reachability, sync, prevReachability]);

  return {
    sync,
    isSyncing,
    lastSyncAt,
  };
}

/**
 * 使用重试离线消息的 Hook
 *
 * @description
 * 手动重试单条离线消息
 *
 * @returns 重试函数
 *
 * @example
 * ```tsx
 * function RetryButton({ messageId }) {
 *   const { retryMessage } = useRetryOfflineMessage();
 *
 *   return (
 *     <button onClick={() => retryMessage(messageId)}>
 *       重试
 *     </button>
 *   );
 * }
 * ```
 */
export function useRetryOfflineMessage() {
  const { offlineMessageQueue, messageService } = useServices();
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * 重试单条离线消息
   * @param messageId 离线消息 ID
   */
  const retryMessage = useCallback(
    async (messageId: string) => {
      if (!offlineMessageQueue || !messageService) {
        throw new Error('离线队列服务或消息服务未初始化');
      }

      setIsRetrying(true);

      try {
        // 获取离线消息
        const messages = await offlineMessageQueue.getAll();
        const offlineMsg = messages.find((m) => m.id === messageId);

        if (!offlineMsg) {
          throw new Error(`消息未找到: ${messageId}`);
        }

        // 重试发送
        await messageService.send(
          offlineMsg.conversationId,
          offlineMsg.sendParams,
        );

        // 发送成功，从队列中移除
        await offlineMessageQueue.dequeue(messageId);

        // 更新 UI
        invalidateConversationMessages(
          offlineMsg.conversationId,
          queryClient,
          resolveOfflineMessageChannel(offlineMsg),
        );

        console.info(`[useRetryOfflineMessage] 消息 ${messageId} 重试成功`);
      } catch (error) {
        console.error(
          `[useRetryOfflineMessage] 消息 ${messageId} 重试失败:`,
          error,
        );
        throw error;
      } finally {
        setIsRetrying(false);
      }
    },
    [offlineMessageQueue, messageService, queryClient],
  );

  return {
    retryMessage,
    isRetrying,
  };
}
