import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';

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
export interface UseTemplatesParams {
  /** 会话 ID（可选） */
  conversationId?: string;
  /** 当前渠道（可选） */
  currentChannel?: string;
}

export function useTemplates(params?: UseTemplatesParams) {
  const { templateService } = useServices();

  // 调试日志：检查服务注入状态
  console.log('📊 [useTemplates] Hook 调用状态:', {
    hasTemplateService: !!templateService,
    params,
    serviceName: templateService?.constructor?.name,
    queryKey: queryKeys.templates.list(params?.conversationId),
  });

  return useQuery({
    queryKey: queryKeys.templates.list(params?.conversationId),
    queryFn: () => {
      console.log('🚀 [useTemplates] queryFn 执行开始');

      if (!templateService) {
        console.warn('⚠️ [useTemplates] templateService 不存在，返回空数组');
        return [];
      }

      console.log('📡 [useTemplates] 准备调用 templateService.list', {
        params,
        serviceInstance: templateService,
        hasListMethod: typeof templateService.list === 'function',
      });

      // 在这里打断点可以确认 templateService.list() 被调用
      const result = templateService.list(params ?? ({} as never));
      console.log('📦 [useTemplates] templateService.list 返回 Promise');

      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 分钟
    enabled: !!templateService, // 只有当服务存在时才执行查询
  });
}
