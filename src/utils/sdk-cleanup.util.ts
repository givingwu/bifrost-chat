import type { QueryClient } from '@tanstack/react-query';
import { defaultQueryClient } from '@/providers/query.provider';
import { resetChatStore } from '@/store';

export interface CleanupOptions {
  /** QueryClient 实例（可选） */
  queryClient?: QueryClient;
  /** 是否清理 localStorage（默认 false） */
  clearStorage?: boolean;
}

/**
 * 清理 SDK 状态和缓存
 *
 * @description
 * 统一的清理接口，用于用户切换、登出等场景。
 * 会清理：
 * - Zustand Store 状态（activeConversationId、searchQuery、profile 等）
 * - React Query 缓存（会话列表、消息列表、模板列表等）
 * - localStorage（可选）
 *
 * 使用场景：
 * - 用户登出
 * - 切换账号
 * - 重新初始化 SDK
 *
 * @param options - 清理选项
 *
 * @example
 * ```tsx
 * import { clearSDK } from '@feoe/bifrost-chat';
 * import { useQueryClient } from '@tanstack/react-query';
 *
 * function App() {
 *   const queryClient = useQueryClient();
 *
 *   const handleLogout = () => {
 *     clearSDK({ queryClient, clearStorage: true });
 *     // ... 其他登出逻辑
 *   };
 * }
 * ```
 */
export function clearSDK(options: CleanupOptions = {}) {
  const { queryClient = defaultQueryClient, clearStorage = false } = options;

  // 1. 重置 Zustand Store
  resetChatStore();

  // 2. 清理 React Query 缓存
  if (queryClient) {
    queryClient.clear();
  }

  // 3. 清理 localStorage（可选）
  if (clearStorage) {
    // 清理草稿
    localStorage.removeItem('bifrost-chat-draft');
    // 可以根据需要清理其他 key
  }
}
