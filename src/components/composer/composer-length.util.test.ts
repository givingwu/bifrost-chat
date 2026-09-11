import { describe, expect, it } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  clampComposerValue,
  getDefaultComposerMaxLength,
  resolveCustomMessageMaxLength,
  shouldIgnoreComposerMaxLength,
} from './composer-length.util';

describe('composer-length util', () => {
  it('应返回渠道默认字数限制', () => {
    expect(getDefaultComposerMaxLength(ChannelTypeEnum.SMS)).toBe(160);
    expect(getDefaultComposerMaxLength(ChannelTypeEnum.WhatsApp)).toBe(4096);
    expect(getDefaultComposerMaxLength(ChannelTypeEnum.Email)).toBe(2000);
  });

  it('应优先使用显式传入的 maxLength', () => {
    expect(
      resolveCustomMessageMaxLength({
        channel: ChannelTypeEnum.WhatsApp,
        maxLength: 120,
        customMessageMaxLength: 80,
      }),
    ).toBe(120);
  });

  it('应在未传 props 时使用 composer 配置的 customMessageMaxLength', () => {
    expect(
      resolveCustomMessageMaxLength({
        channel: ChannelTypeEnum.WhatsApp,
        customMessageMaxLength: 80,
      }),
    ).toBe(80);
  });

  it('模板消息默认应跳过字数限制', () => {
    expect(
      shouldIgnoreComposerMaxLength({
        isTemplateMessage: true,
      }),
    ).toBe(true);
  });

  it('关闭配置后模板消息应继续受字数限制', () => {
    expect(
      shouldIgnoreComposerMaxLength({
        isTemplateMessage: true,
        ignoreMaxLengthForTemplateMessages: false,
      }),
    ).toBe(false);
  });

  it('应按最大长度裁剪输入内容', () => {
    expect(clampComposerValue('123456', 4)).toBe('1234');
    expect(clampComposerValue('123456')).toBe('123456');
  });
});
