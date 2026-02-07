import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SendAttachmentParams,
  SendAttachmentResult,
} from '@/interfaces/attachment.interface';
import { useConversation } from '@/store';
import { MessageBuilder } from '@/utils/message-builder.util';

/**
 * 发送附件 Hook 的参数
 */
export interface UseSendAttachmentParams<
  TAttachmentParams = SendAttachmentParams,
> {
  /**
   * 发送附件的方法
   * @param params 附件发送参数
   * @returns 发送结果
   */
  sendAttachment: (params: TAttachmentParams) => Promise<SendAttachmentResult>;
  /**
   * 会话 ID（可选，如果不提供则使用当前激活的会话）
   */
  conversationId?: string;
}

/**
 * 发送附件 Hook 的返回值
 */
export interface UseSendAttachmentReturn {
  /** 发送附件 */
  sendAttachment: (
    attachments: SendAttachmentParams['attachments'],
    text?: string,
  ) => Promise<void>;
  /** 是否正在发送 */
  isSending: boolean;
  /** 错误信息 */
  error: Error | null;
}

/**
 * 发送附件 Hook
 *
 * @description
 * 处理附件发送的完整流程，包括：
 * - 文件验证
 * - 乐观更新
 * - 错误处理
 * - 状态回滚
 *
 * @example
 * ```tsx
 * const { sendAttachment, isSending } = useSendAttachment({
 *   sendAttachment: async (params) => {
 *     // 调用方实现文件上传和发送逻辑
 *     const response = await api.uploadFiles(params.attachments);
 *     return await api.sendMessage({ ...params, fileUrls: response.urls });
 *   },
 * });
 *
 * <button onClick={() => sendAttachment(attachments, '查看附件')} disabled={isSending}>
 *   发送附件
 * </button>
 * ```
 */
export function useSendAttachment<TAttachmentParams = SendAttachmentParams>({
  sendAttachment: sendAttachmentFn,
  conversationId: propConversationId,
}: UseSendAttachmentParams<TAttachmentParams>): UseSendAttachmentReturn {
  const queryClient = useQueryClient();
  const { activeConversationId: storeConversationId } = useConversation();

  // 确定使用的会话 ID
  const conversationId = propConversationId || storeConversationId;

  const mutation = useMutation({
    mutationFn: async (params: SendAttachmentParams) => {
      if (!conversationId) {
        throw new Error('No active conversation');
      }

      // 调用调用方提供的发送方法
      return await sendAttachmentFn({
        ...params,
        conversationId,
      } as TAttachmentParams);
    },
    onSuccess: (result, variables) => {
      // 发送成功后，刷新消息列表
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['messages', conversationId],
        });
      }
    },
    onError: (error) => {
      console.error('[useSendAttachment] Failed to send attachment:', error);
    },
  });

  const sendAttachment = async (
    attachments: SendAttachmentParams['attachments'],
    text?: string,
  ) => {
    const tempId = MessageBuilder.generateTempId();

    // 验证附件
    for (const attachment of attachments) {
      if (!attachment.file) {
        throw new Error('Invalid attachment: missing file');
      }
    }

    // 检查会话 ID
    if (!conversationId) {
      throw new Error('No active conversation');
    }

    // 执行发送
    await mutation.mutateAsync({
      conversationId,
      attachments,
      text,
    });
  };

  return {
    sendAttachment,
    isSending: mutation.isPending,
    error: mutation.error || null,
  };
}
