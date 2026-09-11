import { describe, expect, it } from 'vitest';
import {
  MessageFailureTypeEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';
import { resolveMessageSendOutcome } from './message-send-result.util';

describe('resolveMessageSendOutcome', () => {
  it('成功结果应清理草稿，且不持久化失败消息', () => {
    expect(
      resolveMessageSendOutcome({
        status: MessageStatusEnum.Sent,
      }),
    ).toEqual({
      isFailed: false,
      shouldPersist: false,
      shouldRollback: false,
      shouldClearDraft: true,
    });
  });

  it('可重试失败应保留草稿并持久化失败消息', () => {
    expect(
      resolveMessageSendOutcome({
        status: MessageStatusEnum.Failed,
        error: 'network failed',
        errorType: MessageFailureTypeEnum.Network,
        retryable: true,
      }),
    ).toEqual({
      isFailed: true,
      shouldPersist: true,
      shouldRollback: false,
      shouldClearDraft: false,
    });
  });

  it('业务失败并要求回滚时应回滚且保留草稿', () => {
    expect(
      resolveMessageSendOutcome({
        status: MessageStatusEnum.Failed,
        error: 'validation failed',
        errorType: MessageFailureTypeEnum.Validation,
        retryable: false,
        needRollback: true,
      }),
    ).toEqual({
      isFailed: true,
      shouldPersist: false,
      shouldRollback: true,
      shouldClearDraft: false,
    });
  });
});
