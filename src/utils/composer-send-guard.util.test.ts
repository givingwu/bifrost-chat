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

  describe('异常值边界情况', () => {
    it('value 为 undefined/null/isNaN 时不抛出异常且禁止发送', () => {
      expect(
        resolveComposerCanSend({
          value: undefined as unknown as string,
          attachmentCount: 0,
          isSending: false,
        }),
      ).toBe(false);

      expect(
        resolveComposerCanSend({
          value: null as unknown as string,
          attachmentCount: 0,
          isSending: false,
        }),
      ).toBe(false);

      expect(
        resolveComposerCanSend({
          value: Number.isNaN as unknown as string,
          attachmentCount: 0,
          isSending: false,
        }),
      ).toBe(false);
    });

    it('value 为 null 时不抛出异常且禁止发送', () => {
      expect(
        resolveComposerCanSend({
          value: null as unknown as string,
          attachmentCount: 0,
          isSending: false,
        }),
      ).toBe(false);
    });

    it('value 为空字符串时应禁止发送', () => {
      expect(
        resolveComposerCanSend({
          value: '',
          attachmentCount: 0,
          isSending: false,
        }),
      ).toBe(false);
    });

    it('value 仅包含空白字符时应禁止发送', () => {
      expect(
        resolveComposerCanSend({
          value: '   ',
          attachmentCount: 0,
          isSending: false,
        }),
      ).toBe(false);
    });

    it('value 为 undefined 但有附件时应允许发送', () => {
      expect(
        resolveComposerCanSend({
          value: undefined as unknown as string,
          attachmentCount: 1,
          isSending: false,
        }),
      ).toBe(true);
    });

    it('value 为空字符串但有附件时应允许发送', () => {
      expect(
        resolveComposerCanSend({
          value: '',
          attachmentCount: 2,
          isSending: false,
        }),
      ).toBe(true);
    });
  });

  describe('发送状态约束', () => {
    it('isSending 为 true 时应禁止发送，即使有内容', () => {
      expect(
        resolveComposerCanSend({
          value: 'hello',
          attachmentCount: 0,
          isSending: true,
        }),
      ).toBe(false);
    });

    it('isSending 为 true 时应禁止发送，即使有附件', () => {
      expect(
        resolveComposerCanSend({
          value: '',
          attachmentCount: 1,
          isSending: true,
        }),
      ).toBe(false);
    });
  });

  describe('模板消息约束', () => {
    it('模板消息无错误时应允许发送', () => {
      expect(
        resolveComposerCanSend({
          value: '模板内容',
          attachmentCount: 0,
          isSending: false,
          messageType: MessageTypeEnum.Template,
          templateError: null,
        }),
      ).toBe(true);
    });

    it('模板消息有 templateError 应禁止发送', () => {
      expect(
        resolveComposerCanSend({
          value: '模板内容',
          attachmentCount: 0,
          isSending: false,
          messageType: MessageTypeEnum.Template,
          templateError: '参数错误',
        }),
      ).toBe(false);
    });

    it('非模板消息应忽略 templateError', () => {
      expect(
        resolveComposerCanSend({
          value: 'hello',
          attachmentCount: 0,
          isSending: false,
          messageType: MessageTypeEnum.Text,
          templateError: 'some error',
        }),
      ).toBe(true);
    });
  });
});
