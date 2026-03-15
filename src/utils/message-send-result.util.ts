import {
  MessageFailureTypeEnum,
  type MessageSendResult,
  MessageStatusEnum,
} from '@/interfaces/message.interface';

export interface MessageSendOutcome {
  isFailed: boolean;
  shouldPersist: boolean;
  shouldRollback: boolean;
  shouldClearDraft: boolean;
}

export function shouldPersistMessageFailure(
  errorType?: MessageFailureTypeEnum,
  retryable?: boolean,
): boolean {
  return errorType === MessageFailureTypeEnum.Network || retryable === true;
}

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
