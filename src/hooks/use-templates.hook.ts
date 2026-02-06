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
 * @param params 查询参数（可选，类型由服务实现决定）
 * @returns Query 结果
 *
 * @example
 * ```tsx
 * function TemplatePanel() {
 *   const { data: templates, isLoading, error } = useTemplates();
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
export function useTemplates<TParams>(params?: TParams) {
  const services = useServices();

  return useQuery({
    queryKey: queryKeys.templates.list(),
    queryFn: () => {
      if (!services?.templateService) {
        return [];
      }
      return services.templateService.list(params);
    },
    staleTime: 1000 * 60 * 5, // 5 分钟
    enabled: !!services?.templateService, // 只有当服务存在时才执行查询
  });
}
