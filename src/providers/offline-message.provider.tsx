import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { OfflineQueueConfig } from '@/interfaces/offline-message.interface';
import { DEFAULT_OFFLINE_QUEUE_CONFIG } from '@/interfaces/offline-message.interface';
import { OfflineMessageQueueService } from '@/services/offline-message-queue.service';

/**
 * 离线消息 Provider Props
 */
export interface OfflineMessageProviderProps {
  children: ReactNode;
  /** 离线队列配置 */
  config?: Partial<OfflineQueueConfig>;
}

/**
 * 离线消息上下文
 */
interface OfflineMessageContextValue {
  /** 离线消息队列服务实例 */
  queueService: OfflineMessageQueueService | null;
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 初始化错误 */
  error: Error | null;
}

const OfflineMessageContext = createContext<OfflineMessageContextValue>({
  queueService: null,
  isInitialized: false,
  error: null,
});

/**
 * 离线消息 Provider
 *
 * @description
 * 提供离线消息队列服务的全局访问
 * 初始化 IndexedDB 数据库
 * 应用启动时恢复未发送的消息
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <OfflineMessageProvider
 *       config={{
 *         maxQueueSize: 500,
 *         messageExpiration: 3 * 24 * 60 * 60 * 1000, // 3 天
 *       }}
 *     >
 *       <ChatApp />
 *     </OfflineMessageProvider>
 *   );
 * }
 * ```
 */
export function OfflineMessageProvider({
  children,
  config: userConfig,
}: OfflineMessageProviderProps) {
  const [queueService, setQueueService] =
    useState<OfflineMessageQueueService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 合并配置
  const config = useMemo(() => {
    return { ...DEFAULT_OFFLINE_QUEUE_CONFIG, ...userConfig };
  }, [userConfig]);

  useEffect(() => {
    let service: OfflineMessageQueueService | null = null;

    async function initialize() {
      try {
        // 检查是否启用离线队列
        if (!config.enabled) {
          console.info('[OfflineMessageProvider] Offline queue is disabled');
          setIsInitialized(true);
          return;
        }

        // 创建服务实例
        service = new OfflineMessageQueueService(config);
        await service.initialize();

        console.info(
          '[OfflineMessageProvider] Offline queue initialized successfully',
        );

        setQueueService(service);
        setIsInitialized(true);
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        console.error(
          '[OfflineMessageProvider] Failed to initialize offline queue:',
          errorObj,
        );
        setError(errorObj);
        setIsInitialized(true);
      }
    }

    initialize();

    // 清理函数
    return () => {
      if (service) {
        service.destroy();
      }
    };
  }, [config]);

  const contextValue = useMemo<OfflineMessageContextValue>(
    () => ({
      queueService,
      isInitialized,
      error,
    }),
    [queueService, isInitialized, error],
  );

  return (
    <OfflineMessageContext.Provider value={contextValue}>
      {children}
    </OfflineMessageContext.Provider>
  );
}

/**
 * 使用离线消息队列服务的 Hook
 *
 * @throws {Error} 如果在 Provider 外部使用
 * @returns 离线消息上下文值
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { queueService, isInitialized, error } = useOfflineMessage();
 *
 *   if (!isInitialized) {
 *     return <div>初始化中...</div>;
 *   }
 *
 *   if (error) {
 *     return <div>初始化失败: {error.message}</div>;
 *   }
 *
 *   // 使用 queueService
 * }
 * ```
 */
export function useOfflineMessage(): OfflineMessageContextValue {
  const context = useContext(OfflineMessageContext);

  if (!context) {
    throw new Error(
      'useOfflineMessage must be used within OfflineMessageProvider',
    );
  }

  return context;
}
