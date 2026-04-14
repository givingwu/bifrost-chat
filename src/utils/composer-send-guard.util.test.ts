import { describe, expect, it } from 'vitest';
import { MessageTypeEnum } from '@/interfaces/message.interface';
import { resolveComposerCanSend } from './composer-send-guard.util';

describe('resolveComposerCanSend', () => {
  it('普通文本有内容且未发送中时应允许发送', () => {
    expect(
      resolveComposerCanSend({
        attachmentCount: 0,
        isSending: false,
        messageType: MessageTypeEnum.Text,
        templateError: null,
        value: 'hello',
      }),
    ).toBe(true);
  });

  it('模板消息存在模板替换错误时应禁止发送', () => {
    expect(
      resolveComposerCanSend({
        attachmentCount: 0,
        isSending: false,
        messageType: MessageTypeEnum.Template,
        templateError: '模板参数替换失败',
        value: '模板内容',
      }),
    ).toBe(false);
  });
});
