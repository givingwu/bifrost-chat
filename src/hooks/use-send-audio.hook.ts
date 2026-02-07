import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SendAudioParams,
  SendAudioResult,
} from '@/interfaces/audio.interface';
import { AudioOutputFormatEnum } from '@/interfaces/audio.interface';
import { MessageTypeEnum } from '@/interfaces/message.interface';
import { useConversation } from '@/store';
import { MessageBuilder } from '@/utils/message-builder.util';

/**
 * 发送音频消息 Hook 的参数
 */
export interface UseSendAudioParams<TAudioParams = SendAudioParams> {
  /**
   * 发送音频的方法
   * @param params 音频发送参数
   * @returns 发送结果
   */
  sendAudio: (params: TAudioParams) => Promise<SendAudioResult>;
  /**
   * 会话 ID（可选，如果不提供则使用当前激活的会话）
   */
  conversationId?: string;
}

/**
 * 发送音频消息 Hook 的返回值
 */
export interface UseSendAudioReturn {
  /** 发送音频消息 */
  sendAudio: (
    audio: SendAudioParams['audio'],
    format?: SendAudioParams['format'],
  ) => Promise<void>;
  /** 是否正在发送 */
  isSending: boolean;
  /** 错误信息 */
  error: Error | null;
}

/**
 * 发送音频消息 Hook
 *
 * @description
 * 处理音频消息发送的完整流程，包括：
 * - 音频验证
 * - 乐观更新
 * - 错误处理
 * - 状态回滚
 *
 * @example
 * ```tsx
 * const { sendAudio, isSending } = useSendAudio({
 *   sendAudio: async (params) => {
 *     // 调用方实现音频上传和发送逻辑
 *     const response = await api.uploadAudio(params.audio);
 *     return await api.sendMessage({ ...params, audioUrl: response.url });
 *   },
 * });
 *
 * <button onClick={() => sendAudio(audioBlob, AudioOutputFormatEnum.Raw)} disabled={isSending}>
 *   发送音频
 * </button>
 * ```
 */
export function useSendAudio<TAudioParams = SendAudioParams>({
  sendAudio: sendAudioFn,
  conversationId: propConversationId,
}: UseSendAudioParams<TAudioParams>): UseSendAudioReturn {
  const queryClient = useQueryClient();
  const { activeConversationId: storeConversationId } = useConversation();

  // 确定使用的会话 ID
  const conversationId = propConversationId || storeConversationId;

  const mutation = useMutation({
    mutationFn: async (params: SendAudioParams) => {
      if (!conversationId) {
        throw new Error('No active conversation');
      }

      // 调用调用方提供的发送方法
      return await sendAudioFn({
        ...params,
        conversationId,
      } as TAudioParams);
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
      console.error('[useSendAudio] Failed to send audio:', error);
    },
  });

  const sendAudio = async (
    audio: SendAudioParams['audio'],
    format?: SendAudioParams['format'],
  ) => {
    const tempId = MessageBuilder.generateTempId();

    // 验证音频
    if (!audio.blob) {
      throw new Error('Invalid audio: missing blob');
    }

    if (audio.duration <= 0) {
      throw new Error('Invalid audio: duration must be greater than 0');
    }

    // 检查会话 ID
    if (!conversationId) {
      throw new Error('No active conversation');
    }

    // 执行发送
    await mutation.mutateAsync({
      type: MessageTypeEnum.Audio,
      conversationId,
      audio,
      format: format || AudioOutputFormatEnum.Raw,
    });
  };

  return {
    sendAudio,
    isSending: mutation.isPending,
    error: mutation.error || null,
  };
}
