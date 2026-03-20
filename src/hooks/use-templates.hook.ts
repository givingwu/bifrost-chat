import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import type { ITemplateListParams } from '@/services/core/template.service';
import { useActiveConversationId } from '@/store';
import { useConversationDetail } from './use-conversation-detail.hook';

/**
 * 使用模板列表的 Hook
 *
 * @description
 * 使用 React Query 管理模板列表的获取和缓存。
 * 数据会在 5 分钟内视为新鲜，不会重复请求。
 *
 * @param params 查询参数
 * @param params.conversationId 会话 ID（可选）
 * @param params.currentChannel 当前渠道（可选）
 * @returns Query 结果
 *
 * @example
 * ```tsx
 * function TemplatePanel() {
 *   const { data: templates, isLoading, error } = useTemplates({
 *     conversationId: 'conv-123',
 *     currentChannel: 'whatsapp'
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <ul>
 *       {templates?.map(template => (
 *         <TemplateItem key={template.id} {...template} />
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export interface UseTemplatesParams extends ITemplateListParams {}

export function useTemplates(params?: UseTemplatesParams) {
  const { templateService } = useServices();
  const activeConversationId = useActiveConversationId();
  const { conversationId, currentChannel } = params || {};
  const effectiveConversationId = conversationId ?? activeConversationId;
  const { isPending: isConversationDetailLoading } = useConversationDetail(
    effectiveConversationId ?? '',
  );

  return useQuery({
    queryKey: queryKeys.templates.list(conversationId, currentChannel),
    queryFn: () => {
      if (!templateService) {
        return [];
      }

      return templateService.list(params ?? ({} as never));
    },
    staleTime: 1000 * 60 * 5, // 5 分钟
    enabled:
      !!templateService &&
      !!effectiveConversationId &&
      !isConversationDetailLoading, // 会话切换完成后再查询模板
  });
}
