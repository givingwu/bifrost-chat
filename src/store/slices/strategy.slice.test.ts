import { describe, expect, it } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { normalizeAllowedChannels } from './strategy.slice';

describe('normalizeAllowedChannels', () => {
  it('过滤掉不在 AvailableChannels 中的非法渠道', () => {
    const result = normalizeAllowedChannels([
      'unknown' as ChannelTypeEnum,
      ChannelTypeEnum.SMS,
    ]);
    expect(result).toEqual([ChannelTypeEnum.SMS]);
  });

  it('去重', () => {
    const result = normalizeAllowedChannels([
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.SMS,
    ]);
    expect(result).toEqual([ChannelTypeEnum.SMS, ChannelTypeEnum.WhatsApp]);
  });

  it('按 AvailableChannels 固定顺序排序（无论传入顺序）', () => {
    const result = normalizeAllowedChannels([
      ChannelTypeEnum.Viber,
      ChannelTypeEnum.Email,
      ChannelTypeEnum.SMS,
    ]);
    expect(result).toEqual([
      ChannelTypeEnum.SMS,
      ChannelTypeEnum.Email,
      ChannelTypeEnum.Viber,
    ]);
  });

  it('IVR 已从 AvailableChannels 移除，应被视为非法渠道并过滤掉', () => {
    const fallback = [ChannelTypeEnum.SMS] as const;
    const result = normalizeAllowedChannels(
      ['ivr' as ChannelTypeEnum],
      fallback,
    );
    expect(result).toEqual(fallback);
  });

  it('结果为空时回退到 fallback', () => {
    const fallback = [ChannelTypeEnum.SMS, ChannelTypeEnum.WhatsApp] as const;
    const result = normalizeAllowedChannels(
      ['bad' as ChannelTypeEnum],
      fallback,
    );
    expect(result).toEqual(fallback);
  });

  it('全部非法时回退到默认 fallback（AvailableChannels）', () => {
    const result = normalizeAllowedChannels([
      'x' as ChannelTypeEnum,
      'y' as ChannelTypeEnum,
    ]);
    // fallback 为 AvailableChannels，长度 > 0
    expect(result.length).toBeGreaterThan(0);
  });

  it('单个合法渠道正常通过', () => {
    const result = normalizeAllowedChannels([ChannelTypeEnum.Viber]);
    expect(result).toEqual([ChannelTypeEnum.Viber]);
  });
});
