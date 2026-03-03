import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { MessageBuilder } from '@/services/message-builder.service';
import { useChatStore } from '@/store';

/**
 * 使用创建会话的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理会话创建。
 * 支持乐观更新：在 API 调用前立即更新 UI，成功后用服务器数据替换临时数据。
 *
 * @param conversation - 要创建的会话数据（在 hook 初始化时传入）
 * @param queryParams - 查询参数，用于匹配 useConversations 的 queryKey
 * @returns Mutation 结果
 *
 * @example
 * ```tsx
 * function CreateConversationButton({ userId, channel }: Props) {
 *   // conversation 在组件渲染时就已确定
 *   const conversation = { userId, channel };
 *   const createConversation = useCreateConversation(conversation);
 *
 *   const handleCreate = async () => {
 *     try {
 *       const newConversation = await createConversation.mutateAsync();
 *       console.log('会话创建成功:', newConversation);
 *     } catch (error) {
 *       console.error('创建失败:', error);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleCreate} disabled={createConversation.isPending}>
 *       创建会话
 *     </button>
 *   );
 * }
 * ```
 */
export function useCreateConversation<TParams = Record<string, unknown>>(
  conversation: Conversation,
) {
  const chatStore = useChatStore();
  const queryClient = useQueryClient();
  const { conversationService } = useServices();

  // 使用与 useConversations 相同的 queryKey
  const queryKey = queryKeys.conversations.list();

  // 生成临时 ID（在 hook 初始化时生成，保持稳定）
  const tempId = MessageBuilder.generateTempId();

  return useMutation({
    // 使用 hook 初始化时传入的 conversation
    mutationFn: () => conversationService.create(conversation),

    // 乐观更新：在 API 调用前立即更新 UI
    onMutate: async () => {
      console.log('[use-create-conversation] conversation: ', conversation);

      // 取消正在进行的查询，避免覆盖我们的乐观更新
      await queryClient.cancelQueries({ queryKey });

      // 保存旧数据，以便在出错时回滚
      const previousConversations =
        queryClient.getQueryData<Conversation[]>(queryKey);

      // 创建临时会话对象（带临时 ID）
      const tempConversation = {
        ...conversation,
        id: tempId,
        _isOptimistic: true, // 标记为乐观更新的临时数据
      } as Conversation;

      // 立即将临时会话插入到缓存列表开头
      queryClient.setQueryData(queryKey, (old: Conversation[] | undefined) => {
        if (!old?.length) return [tempConversation];
        return [tempConversation, ...old];
      });

      // 返回上下文，供 onError 和 onSuccess 使用
      return { previousConversations };
    },

    // 成功后，用服务器返回的真实数据替换临时数据
    onSuccess: (data, _variables, context) => {
      console.log('context: ', context);
      console.log('_variables: ', _variables);
      console.log('[use-create-conversation] data: ', data);

      // 用服务器返回的真实数据替换临时数据
      queryClient.setQueryData(queryKey, (old: Conversation[] | undefined) => {
        if (!old) return [data];
        // 查找并替换临时数据
        return old.map((conversation) =>
          conversation.id === tempId ? data : conversation,
        );
      });

      // 设置新会话为激活状态
      chatStore.actions.setActiveConversationId(data.id);
    },

    // 如果出错，回滚到之前的状态
    onError: (error, _variables, context) => {
      console.error('[use-create-conversation] error: ', error);

      if (context?.previousConversations) {
        queryClient.setQueryData(queryKey, context.previousConversations);
      }
    },
  });
}
