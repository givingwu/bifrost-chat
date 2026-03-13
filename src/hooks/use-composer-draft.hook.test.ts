import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import type { DraftData } from './use-composer-draft.hook';
import { useComposerDraft } from './use-composer-draft.hook';

describe('useComposerDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应在挂载时加载当前会话草稿', async () => {
    const draftData: DraftData = { content: 'saved draft' };
    localStorage.setItem(
      'bifrost-chat-draft-conversation-conv-load',
      JSON.stringify(draftData),
    );

    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-load',
      }),
    );

    await waitFor(() => {
      expect(result.current.value).toBe('saved draft');
    });
  });

  it('应按防抖配置保存草稿', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-save',
        draftDebounceDelay: 200,
      }),
    );

    act(() => {
      result.current.setValue('draft content');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const saved = localStorage.getItem(
      'bifrost-chat-draft-conversation-conv-save',
    );
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved ?? '');
    expect(parsed.content).toBe('draft content');
  });

  it('应按 conversation + channel 保存草稿', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-save-channel',
        channel: ChannelTypeEnum.WhatsApp,
        draftDebounceDelay: 200,
      }),
    );

    act(() => {
      result.current.setValue('channel scoped draft');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const saved = localStorage.getItem(
      'bifrost-chat-draft-conversation-conv-save-channel-channel-whatsapp',
    );
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved ?? '');
    expect(parsed.content).toBe('channel scoped draft');
  });

  it('发送成功后应清空输入并删除草稿', async () => {
    vi.useFakeTimers();
    const onSend = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-send',
        onSend,
        clearDraftOnSend: true,
      }),
    );

    act(() => {
      result.current.setValue('will send');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await act(async () => {
      await result.current.handleSend('will send');
    });

    expect(onSend).toHaveBeenCalledWith('will send', undefined);
    expect(result.current.value).toBe('');
    expect(
      localStorage.getItem('bifrost-chat-draft-conversation-conv-send'),
    ).toBeNull();
  });

  it('发送返回失败结果时不应清空输入和草稿', async () => {
    vi.useFakeTimers();
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

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await act(async () => {
      await result.current.handleSend('keep me');
    });

    expect(result.current.value).toBe('keep me');
    expect(
      localStorage.getItem(
        'bifrost-chat-draft-conversation-conv-send-failed-channel-whatsapp',
      ),
    ).not.toBeNull();
  });

  it('keepDraftOnSwitch=false 时切换会话应清理旧会话草稿', async () => {
    const key1 = 'bifrost-chat-draft-conversation-conv-1';
    const key2 = 'bifrost-chat-draft-conversation-conv-2';
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
      vi.useFakeTimers();
      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-type',
          draftDebounceDelay: 200,
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

      act(() => {
        vi.advanceTimersByTime(200);
      });

      const saved = localStorage.getItem(
        'bifrost-chat-draft-conversation-conv-type',
      );
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved ?? '');
      expect(parsed.content).toBe('template content');
      expect(parsed.messageType).toBe(MessageTypeEnum.Template);
      expect(parsed.templateCode).toBe('template-123');
      expect(parsed.templateParams).toEqual({ name: 'John' });
      expect(parsed.templateMetadata).toEqual({
        templateId: 'template-123',
        previewContent: 'template content',
      });
    });

    it('应支持 setDraftData 批量设置', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-batch',
          draftDebounceDelay: 200,
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

    it('应在挂载时恢复 messageType 和 templateMetadata', async () => {
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
        'bifrost-chat-draft-conversation-conv-restore',
        JSON.stringify(draftData),
      );

      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-restore',
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

    it('存在旧 conversation key 时应迁移到 channel key', async () => {
      const draftData: DraftData = {
        content: 'legacy channel draft',
        messageType: MessageTypeEnum.Template,
        templateCode: 'template-migrate',
      };

      localStorage.setItem(
        'bifrost-chat-draft-conversation-conv-migrate',
        JSON.stringify(draftData),
      );

      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-migrate',
          channel: ChannelTypeEnum.Email,
        }),
      );

      await waitFor(() => {
        expect(result.current.value).toBe('legacy channel draft');
      });

      expect(
        localStorage.getItem(
          'bifrost-chat-draft-conversation-conv-migrate-channel-email',
        ),
      ).toBe(JSON.stringify(draftData));
      expect(
        localStorage.getItem('bifrost-chat-draft-conversation-conv-migrate'),
      ).toBeNull();
    });

    it('发送成功后应清空 messageType 和 templateMetadata', async () => {
      vi.useFakeTimers();
      const onSend = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-clear-type',
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
        'bifrost-chat-draft-conversation-conv-legacy',
        'legacy draft content',
      );

      const { result } = renderHook(() =>
        useComposerDraft({
          conversationId: 'conv-legacy',
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
