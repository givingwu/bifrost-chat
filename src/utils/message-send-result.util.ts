import {
  MessageFailureTypeEnum,
  type MessageSendResult,
  MessageStatusEnum,
} from '@/interfaces/message.interface';

/**
 * 发送结果经统一归类后的行为决策。
 *
 * @property isFailed 当前发送结果是否属于失败。
 * @property shouldPersist 失败结果是否应进入离线持久化队列。
 * @property shouldRollback 失败结果是否应回滚乐观消息。
 * @property shouldClearDraft 当前结果是否允许清理输入草稿。
 */
export interface MessageSendOutcome {
  isFailed: boolean;
  shouldPersist: boolean;
  shouldRollback: boolean;
  shouldClearDraft: boolean;
}

/**
 * 判断失败结果是否需要写入离线队列。
 *
 * @param errorType 发送失败类型。
 * @param retryable 宿主显式声明的是否可重试标记。
 * @returns 当失败属于网络问题或宿主显式允许重试时返回 `true`。
 */
export function shouldPersistMessageFailure(
  errorType?: MessageFailureTypeEnum,
  retryable?: boolean,
): boolean {
  return errorType === MessageFailureTypeEnum.Network || retryable === true;
}

/**
 * 将宿主返回的发送结果统一映射为 SDK 可消费的行为语义。
 *
 * @param result 消息发送结果；允许为空或未知对象，以兼容不同宿主实现。
 * @returns 统一的发送结果决策对象，用于驱动草稿清理、回滚和离线队列。
 */
export function resolveMessageSendOutcome(result: unknown): MessageSendOutcome {
  if (!result || typeof result !== 'object') {
    return {
      isFailed: false,
      shouldPersist: false,
      shouldRollback: false,
      shouldClearDraft: true,
    };
  }

  const messageSendResult = result as Partial<MessageSendResult>;
  const isFailed =
    messageSendResult.status === MessageStatusEnum.Failed ||
    Boolean(messageSendResult.error);
  const shouldPersist = shouldPersistMessageFailure(
    messageSendResult.errorType,
    messageSendResult.retryable,
  );
  const shouldRollback =
    messageSendResult.needRollback === true ||
    (isFailed &&
      !shouldPersist &&
      (messageSendResult.retryable === false ||
        messageSendResult.errorType !== undefined ||
        messageSendResult.retryable === undefined));

  return {
    isFailed,
    shouldPersist,
    shouldRollback,
    shouldClearDraft:
      messageSendResult.needRollback !== true && isFailed === false,
  };
}
