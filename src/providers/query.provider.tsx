import {
  QueryClient,
  QueryClientProvider as TanStackQueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

export interface ReactQueryProviderProps {
  children: ReactNode;
  /**
   * 是否启用 React Query DevTools
   * @default process.env.NODE_ENV === 'development'
   */
  enableDevtools?: boolean;
  /**
   * 自定义 QueryClient 实例
   * 如果不提供，将使用默认实例
   */
  queryClient?: ReturnType<typeof createQueryClient>;
}

/**
 * 创建 QueryClient 实例
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 数据在 5 分钟内视为新鲜，不会重新获取
        staleTime: 1000 * 60 * 5,
        // 缓存时间 30 分钟
        gcTime: 1000 * 60 * 30,
        // 失败重试 1 次
        retry: 1,
        // 重试延迟
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // 窗口重新获得焦点时重新获取
        refetchOnWindowFocus: false,
        // 组件挂载时重新获取
        refetchOnMount: true,
        // 网络重连时重新获取
        refetchOnReconnect: true,
        // 全局错误处理
        throwOnError: false,
      },
      mutations: {
        // 失败重试 1 次
        retry: 1,
        // 重试延迟
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // 全局错误处理
        throwOnError: false,
      },
    },
  });
}

/**
 * Query Keys
 * 集中管理所有查询键，确保类型安全和一致性
 */
export const queryKeys = {
  // 会话相关
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.conversations.lists(), filters] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
  },
  // 消息相关
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (conversationId: string) =>
      [...queryKeys.messages.lists(), conversationId] as const,
    details: () => [...queryKeys.messages.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.messages.details(), id] as const,
  },
  // 模版相关
  templates: {
    all: ['templates'] as const,
    lists: () => [...queryKeys.templates.all, 'list'] as const,
    list: (conversationId?: string) =>
      [...queryKeys.templates.lists(), conversationId] as const,
  },
} as const;

/**
 * React Query Provider 组件
 * 提供全局的 React Query 配置和缓存管理
 */
export function ReactQueryProvider({
  children,
  enableDevtools = process.env.NODE_ENV === 'development',
  queryClient = createQueryClient(),
}: ReactQueryProviderProps) {
  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
      {enableDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </TanStackQueryClientProvider>
  );
}
