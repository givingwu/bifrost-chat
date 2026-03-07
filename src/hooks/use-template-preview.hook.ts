import { useMutation } from '@tanstack/react-query';
import { useServices } from '@/providers/service.provider';
import type {
  TemplatePreviewParams,
  TemplatePreviewResult,
} from '@/services/template.service';

/**
 * 使用模板预览的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理模板预览。
 * 调用模板预览接口获取参数替换后的预览内容和参数。
 *
 * @returns Mutation 结果
 *
 * @example
 * ```tsx
 * function TemplateItem({ template, conversationId, channel }) {
 *   const { mutate: preview, data, isPending } = useTemplatePreview();
 *
 *   const handleClick = () => {
 *     preview({
 *       conversationId,
 *       currentChannel: channel,
 *       templateCode: template.code,
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleClick}>预览</button>
 *       {isPending && <Spinner />}
 *       {data && (
 *         <div>
 *           <p>预览: {data.content}</p>
 *           <pre>{JSON.stringify(data.params, null, 2)}</pre>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTemplatePreview() {
  const { templateService } = useServices();

  return useMutation({
    mutationFn: async (params: TemplatePreviewParams) => {
      // 检查服务是否实现了 preview 方法
      if (!templateService?.preview) {
        throw new Error(
          '[useTemplatePreview] preview method not implemented on templateService',
        );
      }

      return templateService.preview(params) as Promise<TemplatePreviewResult>;
    },
  });
}
