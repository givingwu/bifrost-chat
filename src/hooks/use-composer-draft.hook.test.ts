import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import { resetComposerDraftStore } from '@/store/draft.store';
import type { DraftData } from './use-composer-draft.hook';
import { useComposerDraft } from './use-composer-draft.hook';

describe('useComposerDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    resetComposerDraftStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetComposerDraftStore();
    vi.useRealTimers();
  });

  it('应在挂载时加载当前会话草稿', async () => {
    const draftData: DraftData = { content: 'saved draft' };
    localStorage.setItem(
      'bifrost-chat-draft-conversation-conv-load-channel-sms',
      JSON.stringify(draftData),
    );

    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-load',
        channel: ChannelTypeEnum.SMS,
      }),
    );

    await waitFor(() => {
      expect(result.current.value).toBe('saved draft');
    });
  });

  it('应按防抖配置保存草稿', async () => {
    // zustand persist 有自己的持久化机制，不支持自定义防抖延迟
    // 草稿会在状态变化时自动持久化到 bifrost-drafts
    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-save',
        channel: ChannelTypeEnum.SMS,
      }),
    );

    act(() => {
      result.current.setValue('draft content');
    });

    // zustand persist 是同步的，不需要等待定时器
    // 验证草稿数据在 store 中
    expect(result.current.value).toBe('draft content');

    // 验证数据被持久化到 bifrost-drafts
    const stored = localStorage.getItem('bifrost-drafts');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored ?? '');
    const key = `conv-save-channel-sms`;
    expect(parsed.state.drafts[key]).toBeDefined();
    expect(parsed.state.drafts[key].content).toBe('draft content');
  });

  it('应按 conversation + channel 保存草稿', async () => {
    // zustand persist 使用单一 bifrost-drafts key
    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-save-channel',
        channel: ChannelTypeEnum.WhatsApp,
      }),
    );

    act(() => {
      result.current.setValue('channel scoped draft');
    });

    // 验证草稿数据
    expect(result.current.value).toBe('channel scoped draft');

    // 验证数据被持久化
    const stored = localStorage.getItem('bifrost-drafts');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored ?? '');
    const key = `conv-save-channel-channel-whatsapp`;
    expect(parsed.state.drafts[key]).toBeDefined();
    expect(parsed.state.drafts[key].content).toBe('channel scoped draft');
  });

  it('多个草稿 hook 同时存在时应各自读写自己的会话渠道分桶', async () => {
    const first = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-first',
        channel: ChannelTypeEnum.SMS,
      }),
    );
    const second = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-second',
        channel: ChannelTypeEnum.WhatsApp,
      }),
    );

    act(() => {
      first.result.current.setValue('draft for first');
    });

    act(() => {
      second.result.current.setValue('draft for second');
    });

    expect(first.result.current.value).toBe('draft for first');
    expect(second.result.current.value).toBe('draft for second');

    act(() => {
      first.result.current.setValue('updated first');
    });

    expect(first.result.current.value).toBe('updated first');
    expect(second.result.current.value).toBe('draft for second');
  });

  it('发送成功后应清空输入并删除草稿', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-send',
        channel: ChannelTypeEnum.SMS,
        onSend,
        clearDraftOnSend: true,
      }),
    );

    act(() => {
      result.current.setValue('will send');
    });

    await act(async () => {
      await result.current.handleSend('will send');
    });

    expect(onSend).toHaveBeenCalledWith('will send', undefined);
    expect(result.current.value).toBe('');
    // 草稿应从 store 中被清空
    const stored = localStorage.getItem('bifrost-drafts');
    const parsed = JSON.parse(stored ?? '{}');
    const key = `conv-send-channel-sms`;
    expect(parsed.state.drafts[key]).toBeUndefined();
  });

  it('发送返回失败结果时不应清空输入和草稿', async () => {
    const onSend = vi.fn().mockResolvedValue({
      status: MessageStatusEnum.Failed,
      error: 'network failed',
    });

    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-send-failed',
        channel: ChannelTypeEnum.WhatsApp,
        onSend,
        clearDraftOnSend: true,
      }),
    );

    act(() => {
      result.current.setValue('keep me');
    });

    await act(async () => {
      await result.current.handleSend('keep me');
    });

    // 验证内容被保留（失败后回填）
    expect(result.current.value).toBe('keep me');

    // 验证草稿在 store 中被保留
    const stored = localStorage.getItem('bifrost-drafts');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored ?? '{}');
    const key = `conv-send-failed-channel-whatsapp`;
    expect(parsed.state.drafts[key]?.content).toBe('keep me');
  });

  it('keepDraftOnSwitch=false 时切换会话应清理旧会话草稿', async () => {
    const key1 = 'bifrost-chat-draft-conversation-conv-1-channel-whatsapp';
    const key2 = 'bifrost-chat-draft-conversation-conv-2-channel-whatsapp';
    localStorage.setItem(key1, JSON.stringify({ content: 'draft-1' }));

    const { result, rerender } = renderHook(
      ({ conversationId, channel }) =>
        useComposerDraft({
          conversationId,
          channel,
          keepDraftOnSwitch: false,
        }),
      {
        initialProps: {
          conversationId: 'conv-1',
          channel: ChannelTypeEnum.WhatsApp,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.value).toBe('draft-1');
    });

    rerender({
      conversationId: 'conv-2',
      channel: ChannelTypeEnum.WhatsApp,
    });

    await waitFor(() => {
      expect(result.current.value).toBe('');
    });
    expect(localStorage.getItem(key1)).toBeNull();
    expect(localStorage.getItem(key2)).toBeNull();
  });

  describe('messageType 缓存', () => {
    it('应支持设置和获取 messageType', async () => {
      // zustand persist 自动持久化
      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-type',
          channel: ChannelTypeEnum.SMS,
        }),
      );

      act(() => {
        result.current.setValue('template content');
        result.current.setMessageType(MessageTypeEnum.Template);
        result.current.setTemplateCode('template-123');
        result.current.setTemplateParams({ name: 'John' });
        result.current.setTemplateMetadata({
          templateId: 'template-123',
          previewContent: 'template content',
        });
      });

      // 验证内存中的值
      expect(result.current.value).toBe('template content');
      expect(result.current.messageType).toBe(MessageTypeEnum.Template);
      expect(result.current.templateCode).toBe('template-123');
      expect(result.current.templateParams).toEqual({ name: 'John' });
      expect(result.current.templateMetadata).toEqual({
        templateId: 'template-123',
        previewContent: 'template content',
      });

      // 验证持久化
      const stored = localStorage.getItem('bifrost-drafts');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored ?? '');
      const key = `conv-type-channel-sms`;
      const draftData = parsed.state.drafts[key];
      expect(draftData.content).toBe('template content');
      expect(draftData.messageType).toBe(MessageTypeEnum.Template);
      expect(draftData.templateCode).toBe('template-123');
      expect(draftData.templateParams).toEqual({ name: 'John' });
      expect(draftData.templateMetadata).toEqual({
        templateId: 'template-123',
        previewContent: 'template content',
      });
    });

    it('应支持 setDraftData 批量设置', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-batch',
          channel: ChannelTypeEnum.SMS,
        }),
      );

      act(() => {
        result.current.setDraftData({
          content: 'batch content',
          messageType: MessageTypeEnum.Template,
          templateCode: 'template-batch',
          templateParams: { key: 'value' },
        });
      });

      expect(result.current.value).toBe('batch content');
      expect(result.current.messageType).toBe(MessageTypeEnum.Template);
      expect(result.current.templateCode).toBe('template-batch');
      expect(result.current.templateParams).toEqual({ key: 'value' });
    });

    it('应支持 getDraftData 获取完整数据', async () => {
      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-get',
          channel: ChannelTypeEnum.SMS,
        }),
      );

      act(() => {
        result.current.setValue('test');
        result.current.setMessageType(MessageTypeEnum.Text);
      });

      const data = result.current.getDraftData();
      expect(data).toEqual({
        content: 'test',
        messageType: MessageTypeEnum.Text,
        templateCode: undefined,
        templateParams: undefined,
        templateMetadata: undefined,
      });
    });

    it('应在挂载时恢复 messageType 和旧格式 templateMetadata', async () => {
      const draftData: DraftData = {
        content: 'restored template',
        messageType: MessageTypeEnum.Template,
        templateCode: 'template-restore',
        templateParams: { param1: 'value1' },
        templateMetadata: {
          templateId: 'template-restore',
          previewContent: 'restored template',
        },
      };
      localStorage.setItem(
        'bifrost-chat-draft-conversation-conv-restore-channel-sms',
        JSON.stringify(draftData),
      );

      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-restore',
          channel: ChannelTypeEnum.SMS,
        }),
      );

      await waitFor(() => {
        expect(result.current.value).toBe('restored template');
        expect(result.current.messageType).toBe(MessageTypeEnum.Template);
        expect(result.current.templateCode).toBe('template-restore');
        expect(result.current.templateParams).toEqual({ param1: 'value1' });
        expect(result.current.templateMetadata).toEqual({
          templateId: 'template-restore',
          previewContent: 'restored template',
        });
      });
    });

    it('发送成功后应清空 messageType 和 templateMetadata', async () => {
      vi.useFakeTimers();
      const onSend = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-clear-type',
          channel: ChannelTypeEnum.SMS,
          onSend,
          clearDraftOnSend: true,
        }),
      );

      act(() => {
        result.current.setValue('will send');
        result.current.setMessageType(MessageTypeEnum.Template);
        result.current.setTemplateCode('template-clear');
        result.current.setTemplateMetadata({ templateId: 'template-clear' });
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      await act(async () => {
        await result.current.handleSend('will send');
      });

      expect(result.current.messageType).toBeUndefined();
      expect(result.current.templateCode).toBeUndefined();
      expect(result.current.templateParams).toBeUndefined();
      expect(result.current.templateMetadata).toBeUndefined();
    });

    it('应兼容旧格式（纯文本）草稿', async () => {
      // 模拟旧格式存储
      localStorage.setItem(
        'bifrost-chat-draft-conversation-conv-legacy-channel-sms',
        'legacy draft content',
      );

      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-legacy',
          channel: ChannelTypeEnum.SMS,
        }),
      );

      await waitFor(() => {
        expect(result.current.value).toBe('legacy draft content');
        // 旧格式没有 messageType
        expect(result.current.messageType).toBeUndefined();
      });
    });
  });
});
