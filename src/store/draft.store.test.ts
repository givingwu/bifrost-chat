import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DraftData } from '@/hooks/use-composer-draft.hook';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { MessageTypeEnum } from '@/interfaces/message.interface';
import {
  buildComposerDraftKey,
  resetComposerDraftStore,
  useComposerDraftStore,
} from './draft.store';

describe('useComposerDraftStore', () => {
  // 在 jsdom 环境中，localStorage 需要在每个测试前手动清理
  // jsdom 会模拟 localStorage，但需要在测试环境下配置
  beforeEach(() => {
    // 清理所有 localStorage
    const store = useComposerDraftStore.getState();
    store.clearAllDrafts();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 每个测试后重置 store 状态
    resetComposerDraftStore();
    vi.restoreAllMocks();
  });

  describe('基本草稿操作', () => {
    it('切换 current draft 时应返回对应会话和渠道的草稿', () => {
      const store = useComposerDraftStore.getState();

      // 设置第一个草稿
      store.setCurrentDraft('conv-1', ChannelTypeEnum.SMS);
      store.setValue('draft for conv-1 SMS');

      const draft1 = store.getCurrentDraft();
      expect(draft1.content).toBe('draft for conv-1 SMS');

      // 切换到另一个草稿
      store.setCurrentDraft('conv-2', ChannelTypeEnum.WhatsApp);
      store.setValue('draft for conv-2 WhatsApp');

      const draft2 = store.getCurrentDraft();
      expect(draft2.content).toBe('draft for conv-2 WhatsApp');

      // 切换回第一个草稿，应保留原内容
      store.setCurrentDraft('conv-1', ChannelTypeEnum.SMS);
      const draft1Again = store.getCurrentDraft();
      expect(draft1Again.content).toBe('draft for conv-1 SMS');
    });

    it('setTemplate 应一次性写入 content、messageType、templateCode、templateMetadata', () => {
      const store = useComposerDraftStore.getState();

      store.setCurrentDraft('conv-template', ChannelTypeEnum.Email);
      store.setTemplate({
        content: 'template content',
        messageType: MessageTypeEnum.Template,
        templateCode: 'TPL-001',
        templateParams: { name: 'John' },
        templateMetadata: { templateId: 'TPL-001', version: 1 },
      });

      const draft = store.getCurrentDraft();
      expect(draft.content).toBe('template content');
      expect(draft.messageType).toBe(MessageTypeEnum.Template);
      expect(draft.templateCode).toBe('TPL-001');
      expect(draft.templateParams).toEqual({ name: 'John' });
      expect(draft.templateMetadata).toEqual({
        templateId: 'TPL-001',
        version: 1,
      });
    });

    it('clearDraft 只清当前 key，clearAllDrafts 清空全部', () => {
      const store = useComposerDraftStore.getState();

      // 创建多个草稿
      store.setCurrentDraft('conv-1', ChannelTypeEnum.SMS);
      store.setValue('draft 1');

      store.setCurrentDraft('conv-2', ChannelTypeEnum.WhatsApp);
      store.setValue('draft 2');

      store.setCurrentDraft('conv-3', ChannelTypeEnum.Email);
      store.setValue('draft 3');

      // 清除当前草稿
      store.setCurrentDraft('conv-2', ChannelTypeEnum.WhatsApp);
      store.clearDraft();

      expect(store.getCurrentDraft().content).toBe('');
      expect(store.isEmpty()).toBe(true);

      // 切换到其他草稿，内容应保留
      store.setCurrentDraft('conv-1', ChannelTypeEnum.SMS);
      expect(store.getCurrentDraft().content).toBe('draft 1');

      // 清空所有草稿
      store.clearAllDrafts();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.SMS);
      expect(store.getCurrentDraft().content).toBe('');

      store.setCurrentDraft('conv-3', ChannelTypeEnum.Email);
      expect(store.getCurrentDraft().content).toBe('');
    });

    it('clearDraft 应删除当前 key，避免空草稿持续增长', () => {
      const store = useComposerDraftStore.getState();

      store.setCurrentDraft('conv-remove-empty', ChannelTypeEnum.SMS);
      store.setValue('draft to remove');

      const key = buildComposerDraftKey(
        'conv-remove-empty',
        ChannelTypeEnum.SMS,
      );
      expect(useComposerDraftStore.getState().drafts[key]).toBeDefined();

      store.clearDraft();

      expect(useComposerDraftStore.getState().drafts[key]).toBeUndefined();
    });

    it('getValue 应返回当前草稿内容', () => {
      const store = useComposerDraftStore.getState();

      store.setCurrentDraft('conv-value', ChannelTypeEnum.SMS);
      store.setValue('test content');

      expect(store.getValue()).toBe('test content');
    });

    it('isEmpty 应正确判断草稿是否为空', () => {
      const store = useComposerDraftStore.getState();

      store.setCurrentDraft('conv-empty', ChannelTypeEnum.SMS);

      // 初始状态为空
      expect(store.isEmpty()).toBe(true);

      store.setValue('not empty');
      expect(store.isEmpty()).toBe(false);

      store.clearDraft();
      expect(store.isEmpty()).toBe(true);
    });

    it('setDraftData 应支持部分更新', () => {
      const store = useComposerDraftStore.getState();

      store.setCurrentDraft('conv-partial', ChannelTypeEnum.SMS);
      store.setDraftData({
        content: 'partial content',
        messageType: MessageTypeEnum.Template,
      });

      const draft = store.getCurrentDraft();
      expect(draft.content).toBe('partial content');
      expect(draft.messageType).toBe(MessageTypeEnum.Template);
      expect(draft.templateCode).toBeUndefined();
    });
  });

  describe('buildComposerDraftKey', () => {
    it('应生成正确的 draft key 格式', () => {
      const key = buildComposerDraftKey('conv-123', ChannelTypeEnum.SMS);
      expect(key).toBe('conv-123-channel-sms');
    });

    it('不同会话+渠道组合应生成不同 key', () => {
      const key1 = buildComposerDraftKey('conv-1', ChannelTypeEnum.SMS);
      const key2 = buildComposerDraftKey('conv-1', ChannelTypeEnum.WhatsApp);
      const key3 = buildComposerDraftKey('conv-2', ChannelTypeEnum.SMS);

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe('legacy localStorage 迁移', () => {
    it('新 store 没有记录时应从 legacy localStorage key 恢复草稿', () => {
      // 预设 legacy 格式草稿（新格式 JSON）
      const legacyKey =
        'bifrost-chat-draft-conversation-conv-legacy-channel-sms';
      const legacyDraft: DraftData = {
        content: 'legacy JSON draft',
        messageType: MessageTypeEnum.Template,
        templateCode: 'TPL-LEGACY',
        templateParams: { foo: 'bar' },
        templateMetadata: { legacy: true },
      };
      localStorage.setItem(legacyKey, JSON.stringify(legacyDraft));

      // 初始化 store 并设置当前会话
      const store = useComposerDraftStore.getState();
      store.setCurrentDraft('conv-legacy', ChannelTypeEnum.SMS);

      const draft = store.getCurrentDraft();
      expect(draft.content).toBe('legacy JSON draft');
      expect(draft.messageType).toBe(MessageTypeEnum.Template);
      expect(draft.templateCode).toBe('TPL-LEGACY');
      expect(draft.templateParams).toEqual({ foo: 'bar' });
      expect(draft.templateMetadata).toEqual({ legacy: true });
    });

    it('应兼容旧格式纯文本草稿', () => {
      const legacyKey =
        'bifrost-chat-draft-conversation-conv-text-channel-whatsapp';
      localStorage.setItem(legacyKey, 'plain text draft');

      const store = useComposerDraftStore.getState();
      store.setCurrentDraft('conv-text', ChannelTypeEnum.WhatsApp);

      const draft = store.getCurrentDraft();
      expect(draft.content).toBe('plain text draft');
      expect(draft.messageType).toBeUndefined();
    });

    it('应从全局 legacy key 迁移草稿', () => {
      // 全局旧格式（无 conversation/channel 分桶）
      localStorage.setItem('bifrost-chat-draft', 'global legacy draft');

      const store = useComposerDraftStore.getState();
      store.setCurrentDraft('conv-global', ChannelTypeEnum.SMS);

      const draft = store.getCurrentDraft();
      expect(draft.content).toBe('global legacy draft');
    });

    it('迁移后应删除 legacy key', () => {
      const legacyKey =
        'bifrost-chat-draft-conversation-conv-migrate-channel-sms';
      localStorage.setItem(
        legacyKey,
        JSON.stringify({ content: 'migrate me' }),
      );

      const store = useComposerDraftStore.getState();
      store.setCurrentDraft('conv-migrate', ChannelTypeEnum.SMS);

      // 触发持久化后，legacy key 应被删除
      const draft = store.getCurrentDraft();
      expect(draft.content).toBe('migrate me');

      // legacy key 应该被清理
      expect(localStorage.getItem(legacyKey)).toBeNull();
    });

    it('优先级：分桶 key > 全局 key', () => {
      const bucketKey = 'bifrost-chat-draft-conversation-conv-prio-channel-sms';
      localStorage.setItem(
        bucketKey,
        JSON.stringify({ content: 'bucket draft' }),
      );
      localStorage.setItem('bifrost-chat-draft', 'global draft');

      const store = useComposerDraftStore.getState();
      store.setCurrentDraft('conv-prio', ChannelTypeEnum.SMS);

      const draft = store.getCurrentDraft();
      expect(draft.content).toBe('bucket draft'); // 分桶优先
    });
  });

  describe('持久化', () => {
    it('草稿应持久化到 bifrost-drafts key', () => {
      const store = useComposerDraftStore.getState();

      store.setCurrentDraft('conv-persist', ChannelTypeEnum.SMS);
      store.setValue('persist me');

      // 触发持久化写入（zustand persist 会自动同步）
      const stored = localStorage.getItem('bifrost-drafts');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored ?? '{}');
      const key = buildComposerDraftKey('conv-persist', ChannelTypeEnum.SMS);
      // zustand persist 的格式是 {state: {...}, version: 0}
      expect(parsed.state.drafts[key]).toBeDefined();
      expect(parsed.state.drafts[key].content).toBe('persist me');
    });

    it('持久化应排除 templateMetadata，避免写入超大模板对象', () => {
      const store = useComposerDraftStore.getState();

      store.setCurrentDraft('conv-full', ChannelTypeEnum.Email);
      store.setTemplate({
        content: 'full draft',
        messageType: MessageTypeEnum.Template,
        templateCode: 'TPL-FULL',
        templateParams: { key: 'value' },
        templateMetadata: { meta: 'data' },
      });

      const stored = localStorage.getItem('bifrost-drafts');
      const parsed = JSON.parse(stored ?? '{}');
      const key = buildComposerDraftKey('conv-full', ChannelTypeEnum.Email);
      const storedDraft = parsed.state.drafts[key];

      expect(storedDraft.content).toBe('full draft');
      expect(storedDraft.messageType).toBe(MessageTypeEnum.Template);
      expect(storedDraft.templateCode).toBe('TPL-FULL');
      expect(storedDraft.templateParams).toEqual({ key: 'value' });
      expect(storedDraft.templateMetadata).toBeUndefined();
      expect(store.getCurrentDraft().templateMetadata).toEqual({
        meta: 'data',
      });
    });

    it('持久化不应裁剪正文内容，避免影响刷新后草稿展示', () => {
      const store = useComposerDraftStore.getState();
      const longContent = 'x'.repeat(64 * 1024);

      store.setCurrentDraft('conv-long-content', ChannelTypeEnum.Email);
      store.setValue(longContent);

      const stored = localStorage.getItem('bifrost-drafts');
      const parsed = JSON.parse(stored ?? '{}');
      const key = buildComposerDraftKey(
        'conv-long-content',
        ChannelTypeEnum.Email,
      );

      expect(parsed.state.drafts[key].content).toBe(longContent);
    });

    it('localStorage 写入超配额时不应抛出到页面', () => {
      const store = useComposerDraftStore.getState();
      const originalSetItem = window.localStorage.setItem;
      const quotaError = new DOMException(
        'The quota has been exceeded.',
        'QuotaExceededError',
      );

      const setItemSpy = vi
        .spyOn(window.localStorage.__proto__, 'setItem')
        .mockImplementation((...args: unknown[]) => {
          const [key, value] = args as [string, string];

          if (key === 'bifrost-drafts') {
            throw quotaError;
          }
          return originalSetItem.call(window.localStorage, key, value);
        });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        expect(() => {
          store.setCurrentDraft('conv-quota', ChannelTypeEnum.SMS);
          store.setValue('quota safe draft');
        }).not.toThrow();

        expect(store.getCurrentDraft().content).toBe('quota safe draft');
        expect(setItemSpy).toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
          '[BifrostChat] Draft storage quota exceeded; using memory storage.',
          quotaError,
        );
      } finally {
        setItemSpy.mockRestore();
        warnSpy.mockRestore();
      }
    });

    it('连续切换空会话不应让 bifrost-drafts 增长空对象', () => {
      const store = useComposerDraftStore.getState();

      for (let index = 0; index < 50; index += 1) {
        store.setCurrentDraft(`conv-empty-${index}`, ChannelTypeEnum.SMS);
      }

      const stored = localStorage.getItem('bifrost-drafts');
      if (!stored) {
        expect(useComposerDraftStore.getState().drafts).toEqual({});
        return;
      }

      const parsed = JSON.parse(stored);
      expect(parsed.state.drafts).toEqual({});
    });

    it('持久化草稿数量应限制为最近 50 条', () => {
      const store = useComposerDraftStore.getState();

      for (let index = 0; index < 60; index += 1) {
        store.setCurrentDraft(`conv-limit-${index}`, ChannelTypeEnum.SMS);
        store.setValue(`draft ${index}`);
      }

      const stored = localStorage.getItem('bifrost-drafts');
      const parsed = JSON.parse(stored ?? '{}');
      const draftKeys = Object.keys(parsed.state.drafts);

      expect(draftKeys).toHaveLength(50);
      expect(parsed.state.drafts['conv-limit-0-channel-sms']).toBeUndefined();
      expect(parsed.state.drafts['conv-limit-59-channel-sms'].content).toBe(
        'draft 59',
      );
    });

    it('裁剪时应按最近使用顺序保留已重新访问的草稿', () => {
      const store = useComposerDraftStore.getState();

      for (let index = 0; index < 50; index += 1) {
        store.setCurrentDraft(`conv-lru-${index}`, ChannelTypeEnum.SMS);
        store.setValue(`draft ${index}`);
      }

      store.setCurrentDraft('conv-lru-0', ChannelTypeEnum.SMS);
      store.setCurrentDraft('conv-lru-50', ChannelTypeEnum.SMS);
      store.setValue('draft 50');

      const stored = localStorage.getItem('bifrost-drafts');
      const parsed = JSON.parse(stored ?? '{}');

      expect(parsed.state.drafts['conv-lru-0-channel-sms'].content).toBe(
        'draft 0',
      );
      expect(parsed.state.drafts['conv-lru-1-channel-sms']).toBeUndefined();
      expect(parsed.state.drafts['conv-lru-50-channel-sms'].content).toBe(
        'draft 50',
      );
    });
  });

  describe('无 localStorage 降级', () => {
    it('没有 localStorage 时初始化 store 不应抛错', () => {
      // 模拟无 localStorage 环境
      const originalLocalStorage = global.window.localStorage;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error - 模拟无 localStorage
      delete global.window.localStorage;

      expect(() => {
        useComposerDraftStore.getState();
      }).not.toThrow();

      // 恢复 localStorage
      global.window.localStorage = originalLocalStorage;
    });

    it('无 localStorage 时草稿应存储在内存中', () => {
      const originalLocalStorage = global.window.localStorage;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error - 模拟无 localStorage
      delete global.window.localStorage;

      // 创建一个新的 store 实例用于测试
      const store = useComposerDraftStore.getState();
      store.setCurrentDraft('conv-mem', ChannelTypeEnum.SMS);
      store.setValue('memory only');

      expect(store.getCurrentDraft().content).toBe('memory only');

      // 恢复 localStorage
      global.window.localStorage = originalLocalStorage;
    });

    it('无 localStorage 时 setValue、clearDraft 不应抛错', () => {
      const originalLocalStorage = global.window.localStorage;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error - 模拟无 localStorage
      delete global.window.localStorage;

      const store = useComposerDraftStore.getState();
      store.setCurrentDraft('conv-safe', ChannelTypeEnum.SMS);

      expect(() => {
        store.setValue('safe');
        store.clearDraft();
        store.clearAllDrafts();
      }).not.toThrow();

      // 恢复 localStorage
      global.window.localStorage = originalLocalStorage;
    });
  });

  describe('resetComposerDraftStore', () => {
    it('reset 应清空所有草稿和持久化数据', () => {
      const store = useComposerDraftStore.getState();

      store.setCurrentDraft('conv-reset', ChannelTypeEnum.SMS);
      store.setValue('will be reset');

      // 重置 store
      resetComposerDraftStore();

      // 验证 state 中的 drafts 已被清空
      const state = useComposerDraftStore.getState();
      expect(state.drafts).toEqual({});

      // 验证持久化存储中的 drafts 已被清空
      const stored = localStorage.getItem('bifrost-drafts');
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.drafts).toEqual({});
      }

      // 获取新状态
      const newStore = useComposerDraftStore.getState();
      newStore.setCurrentDraft('conv-reset', ChannelTypeEnum.SMS);

      expect(newStore.getCurrentDraft().content).toBe('');
    });

    it('reset 后可重新创建草稿', () => {
      const store = useComposerDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.SMS);
      store.setValue('before reset');

      resetComposerDraftStore();

      const newStore = useComposerDraftStore.getState();
      newStore.setCurrentDraft('conv-1', ChannelTypeEnum.SMS);
      newStore.setValue('after reset');

      expect(newStore.getCurrentDraft().content).toBe('after reset');
    });
  });
});
