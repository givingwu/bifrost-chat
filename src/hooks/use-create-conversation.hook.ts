import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationStatusEnum } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { useChatStore } from '@/store';

/**
 * useCreateConversationHook 选项
 */
export interface UseCreateConversationOptions<TParams> {
  /**
   * 自定义临时会话构建器
   * @description用于在乐观更新时构建临时会话对象
   * @param params 创建参数
   * @returns 部分会话对象，将覆盖默认值
   */
  tempConversationBuilder?: (params: TParams) => Partial<Conversation>;

  /**
   * 创建成功回调
   */
  onSuccess?: (
    data: Conversation,
    variables: TParams,
    context: {
      previousConversations: Conversation[] | undefined;
      tempId: string;
    },
  ) => void;

  /**
   * 创建失败回调
   */
  onError?: (
    error: Error,
    variables: TParams,
    context:
      | { previousConversations: Conversation[] | undefined; tempId: string }
      | undefined,
  ) => void;
}

/**
 * 默认临时会话构建器
 * @description 提供合理的默认值，避免 UI 渲染错误
 */
function buildTempConversation<TParams>(
  params: TParams,
  tempId: string,
  channel: ChannelTypeEnum,
): Conversation {
  return {
    id: tempId,
    user: {
      id: 'temp-user',
      name: 'Loading...',
      status: AgentStatusEnum.Offline,
    },
    lastMessage: '',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 0,
    channel: channel, // 默认渠道
    status: ConversationStatusEnum.Active,
  };
}

/**
 * 使用创建会话的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理会话创建。
 * 支持乐观更新，创建成功后会自动更新会话列表缓存。
 *
 * 特性：
 * - 乐观更新：创建前立即在 UI 显示临时会话
 * - 错误回滚：创建失败时恢复到之前状态
 * - 无额外请求：成功后直接更新缓存，不触发重新获取
 *
 * @returns Mutation 结果
 *
 * @example
 * ```tsx
 * function CreateConversationButton() {
 *   const createConversation = useCreateConversation();
 *
 *   const handleCreate = async () => {
 *     try {
 *       const newConversation = await createConversation.mutateAsync({
 *         userId: 'user-123',
 *         channel: 'whatsapp',
 *       });
 *       console.log('会话创建成功:', newConversation);
 *     } catch (error) {
 *       console.error('创建失败:', error);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleCreate} disabled={createConversation.isPending}>
 *       {createConversation.isPending ? '创建中...' : '创建会话'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 自定义临时会话构建器
 * function CreateConversationWithCustomBuilder() {
 *   const createConversation = useCreateConversation({
 *     tempConversationBuilder: (params) => ({
 *       user: {
 *         id: params.userId,
 *         name: 'Loading...',
 *         status: AgentStatusEnum.Offline,
 *       },
 *       channel: params.channel,
 *     }),
 *     onSuccess: (data) => {
 *       console.log('创建成功，可以跳转到会话详情');
 *     },
 *   });
 * }
 * ```
 */
export function useCreateConversation<TParams = any>(
  options?: UseCreateConversationOptions<TParams>,
) {
  const chatStore = useChatStore();
  const queryClient = useQueryClient();
  const { conversationService } = useServices();

  return useMutation<
    Conversation,
    Error,
    TParams,
    { previousConversations: Conversation[] | undefined; tempId: string }
  >({
    mutationFn: (params: TParams) => conversationService.create(params),

    // 乐观更新：创建前立即显示临时会话
    onMutate: async (params: TParams) => {
      // 1. 取消正在进行的查询，避免覆盖我们的乐观更新
      await queryClient.cancelQueries({
        queryKey: queryKeys.conversations.lists(),
      });

      // 2. 保存旧数据，以便在出错时回滚
      const previousConversations = queryClient.getQueryData<Conversation[]>(
        queryKeys.conversations.lists(),
      );

      // 3. 生成临时 ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // 4. 构建临时会话
      const defaultTempConversation = buildTempConversation<TParams>(
        params,
        tempId,
        chatStore.strategy.activeChannel ||
          chatStore.strategy.allowedChannels?.[0], // 使用当前激活渠道或第一个允许的渠道
      );
      const tempConversation: Conversation = {
        ...defaultTempConversation,
        // 使用自定义构建器覆盖默认值
        ...(options?.tempConversationBuilder?.(params) || {}),
        // 确保 ID 不被覆盖
        id: tempId,
      };

      // 5. 乐观更新：添加临时会话到列表头部
      queryClient.setQueryData<Conversation[]>(
        queryKeys.conversations.lists(),
        (old) => {
          if (!old) return [tempConversation];
          return [tempConversation, ...old];
        },
      );

      return { previousConversations, tempId };
    },

    // 错误处理：回滚到之前状态
    onError: (
      error: Error,
      variables: TParams,
      context:
        | { previousConversations: Conversation[] | undefined; tempId: string }
        | undefined,
    ) => {
      console.error('[useCreateConversation] 创建会话失败:', error);

      if (context?.previousConversations) {
        queryClient.setQueryData(
          queryKeys.conversations.lists(),
          context.previousConversations,
        );
      }

      options?.onError?.(error, variables, context);
    },

    // 成功处理：用真实数据替换临时会话（无额外请求）
    onSuccess: (
      data: Conversation,
      variables: TParams,
      context: {
        previousConversations: Conversation[] | undefined;
        tempId: string;
      },
    ) => {
      if (context?.tempId) {
        queryClient.setQueryData<Conversation[]>(
          queryKeys.conversations.lists(),
          (old) => {
            if (!old) return [data];
            return old.map((conversation) =>
              conversation.id === context.tempId ? data : conversation,
            );
          },
        );
      }

      options?.onSuccess?.(data, variables, context);
    },
  });
}
