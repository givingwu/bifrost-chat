import type { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import { useActions, useStrategy } from '@/store';

/**
 * 管理会话自动选择的 Hook Options
 */
export interface UseConversationAutoSelectOptions {
  /** 会话列表 */
  conversations: Conversation[];
  /** 当前激活的会话 ID */
  activeConversationId: string;
  /** 会话列表是否正在获取中 */
  isConversationsFetching: boolean;
  /** React Query Client */
  queryClient: QueryClient;
}

/**
 * 管理会话自动选择的 Hook
 *
 * 负责在以下场景自动选择会话：
 * 1. 初始加载时选择第一个会话
 * 2. 渠道切换时选择新渠道的第一个会话
 * 3. 当前会话不存在于列表中时选择第一个会话
 *
 * 包含三重幂等守卫，防止无效 store 写入触发循环：
 * - conversations 正在 fetch 时跳过（渠道切换竞态）
 * - 清空 activeId 前检查是否已经为空
 * - auto-select 前检查目标 id 是否和当前相同
 *
 * @param options 配置选项
 *
 * @example
 * ```tsx
 * const queryClient = useQueryClient();
 * const { conversations, isFetching } = useConversations();
 * const { activeConversationId } = useConversation();
 *
 * useConversationAutoSelect({
 *   conversations,
 *   activeConversationId,
 *   isConversationsFetching: isFetching,
 *   queryClient,
 * });
 * ```
 */
export function useConversationAutoSelect({
  conversations,
  activeConversationId,
  isConversationsFetching,
  queryClient,
}: UseConversationAutoSelectOptions): void {
  const actions = useActions();
  const { autoSelectFirstConversation } = useStrategy();

  useEffect(() => {
    // customer 模式下由 useConversationInitializer 管理激活，跳过 auto-select
    if (!autoSelectFirstConversation) return;
    // 跳过正在获取数据的状态（渠道切换竞态）
    if (isConversationsFetching) return;

    // 列表为空时的处理
    if (!conversations || conversations.length === 0) {
      if (activeConversationId !== '') {
        // 列表为空时，不要盲目清空 activeId：
        // - 宿主可能走"临时创建会话/仅详情模式"，会话只写入 detail cache
        // - 若此处清空，会与宿主 setActiveConversationId 形成抖动循环，
        //   进而触发 useConversationDetail 频繁请求
        const cached = ConversationCacheHelper.findConversation(
          queryClient,
          activeConversationId,
        );

        if (!cached) {
          actions.setActiveConversationId('');
        }
      }
      return;
    }

    // 检查当前 activeConversationId 是否在会话列表中
    const exists = conversations.some(
      (conversation) => conversation.id === activeConversationId,
    );

    // 如果不存在，自动选择第一个会话
    if (!exists) {
      const firstId = conversations[0].id;
      if (firstId !== activeConversationId) {
        actions.setActiveConversationId(firstId);
      }
    }
  }, [
    autoSelectFirstConversation,
    conversations,
    activeConversationId,
    actions,
    isConversationsFetching,
    queryClient,
  ]);
}
