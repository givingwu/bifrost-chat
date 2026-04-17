import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { MessageTypeEnum } from '@/interfaces/message.interface';
import { useComposerDraftStore } from '@/store/draft.store';
import { resolveMessageSendOutcome } from '@/utils/message-send-result.util';

const LEGACY_DRAFT_KEY_PREFIX = 'bifrost-chat-draft-';

/**
 * 草稿数据结构
 * 支持存储消息类型和模板相关信息
 */
export interface DraftData {
  /** 输入内容 */
  content: string;
  /** 消息类型 */
  messageType?: MessageTypeEnum;
  /** 模板 ID */
  templateCode?: string;
  /** 模板参数 */
  templateParams?: Record<string, string>;
  /** 模板元数据（用于发送时传递给后端） */
  templateMetadata?: unknown;
}

export interface UseComposerDraftOptions {
  conversationId: string;
  channel: ChannelTypeEnum;
  templateLocked?: boolean;
  enableDraft?: boolean;
  clearDraftOnSend?: boolean;
  keepDraftOnSwitch?: boolean;
  onSend?: (
    content: string,
    options?: Record<string, unknown>,
  ) => unknown | Promise<unknown>;
}

export interface UseComposerDraftResult {
  /** 输入内容 */
  value: string;
  /** 设置输入内容 */
  setValue: (nextValue: string) => void;
  /** 消息类型 */
  messageType?: MessageTypeEnum;
  /** 设置消息类型 */
  setMessageType: (type?: MessageTypeEnum) => void;
  /** 模板 ID */
  templateCode?: string;
  /** 设置模板 ID */
  setTemplateCode: (templateCode?: string) => void;
  /** 模板参数 */
  templateParams?: Record<string, string>;
  /** 设置模板参数 */
  setTemplateParams: (params?: Record<string, string>) => void;
  /** 模板元数据 */
  templateMetadata?: unknown;
  /** 设置模板元数据 */
  setTemplateMetadata: (metadata?: unknown) => void;
  /** 设置完整草稿数据 */
  setDraftData: (data: Partial<DraftData>) => void;
  /** 获取完整草稿数据 */
  getDraftData: () => DraftData;
  /** 草稿存储 key（保持兼容性，返回 legacy 格式） */
  draftStorageKey: string | null;
  /** 清除草稿 */
  clearDraft: () => void;
  /** 加载草稿（仅内容） */
  loadDraft: () => string;
  /** 加载完整草稿数据 */
  loadDraftData: () => DraftData;
  /** 保存草稿（仅内容） */
  saveDraft: (nextValue: string) => void;
  /** 保存完整草稿数据 */
  saveDraftData: (data: DraftData) => void;
  /** 处理发送 */
  handleSend: (
    content: string,
    options?: Record<string, unknown>,
  ) => Promise<void>;
}

/**
 * 生成 legacy 存储键（保持兼容性）
 */
export function buildConversationDraftStorageKey(
  conversationId: string,
  channel: ChannelTypeEnum,
): string {
  return `${LEGACY_DRAFT_KEY_PREFIX}conversation-${conversationId}-channel-${channel}`;
}

/**
 * useComposerDraft：管理会话草稿输入值、持久化与发送后清理。
 *
 * 现在基于内部的 Zustand draft store，同时保持公开 API 兼容性。
 * 支持缓存消息类型（如 template），刷新后可恢复。
 */
export function useComposerDraft({
  conversationId,
  channel,
  templateLocked = false,
  enableDraft = true,
  clearDraftOnSend = true,
  keepDraftOnSwitch = true,
  onSend,
}: UseComposerDraftOptions): UseComposerDraftResult {
  // ==================== 状态选择器 ====================
  const drafts = useComposerDraftStore((state) => state.drafts);
  const currentDraftKey = useComposerDraftStore(
    (state) => state.currentDraftKey,
  );

  // 当前草稿数据
  const currentDraftData = useMemo(() => {
    if (!currentDraftKey) {
      return { content: '', messageType: undefined };
    }
    // 防御：确保 content 始终是字符串（即使 draft 对象存在但 content 是 undefined）
    const draft = drafts[currentDraftKey];
    return {
      content: draft?.content ?? '',
      messageType: draft?.messageType,
      templateCode: draft?.templateCode,
      templateParams: draft?.templateParams,
      templateMetadata: draft?.templateMetadata,
    };
  }, [drafts, currentDraftKey]);

  // ==================== 操作方法 ====================
  const store = useComposerDraftStore.getState();

  // 生成当前会话的 key
  const draftStorageKey = useMemo(() => {
    if (conversationId && channel) {
      return buildConversationDraftStorageKey(conversationId, channel);
    }
    return null;
  }, [channel, conversationId]);

  // ==================== setValue ====================
  const loadedDraftKeyRef = useRef<string | null>(null);
  const previousDraftKeyRef = useRef<string | null>(null);

  const setValue = useCallback(
    (nextValue: string) => {
      store.setValue(nextValue);
    },
    [store],
  );

  // ==================== messageType ====================
  const setMessageType = useCallback(
    (type?: MessageTypeEnum) => {
      store.setDraftData({ messageType: type });
    },
    [store],
  );

  // ==================== templateCode ====================
  const setTemplateCode = useCallback(
    (code?: string) => {
      store.setDraftData({ templateCode: code });
    },
    [store],
  );

  // ==================== templateParams ====================
  const setTemplateParams = useCallback(
    (params?: Record<string, string>) => {
      store.setDraftData({ templateParams: params });
    },
    [store],
  );

  // ==================== templateMetadata ====================
  const setTemplateMetadata = useCallback(
    (metadata?: unknown) => {
      store.setDraftData({ templateMetadata: metadata });
    },
    [store],
  );

  // ==================== setDraftData ====================
  const setDraftData = useCallback(
    (data: Partial<DraftData>) => {
      store.setDraftData(data);
    },
    [store],
  );

  // ==================== getDraftData ====================
  const getDraftData = useCallback((): DraftData => {
    return store.getCurrentDraft();
  }, [store]);

  // ==================== clearDraft ====================
  const clearDraft = useCallback(() => {
    store.clearDraft();
  }, [store]);

  // ==================== loadDraft ====================
  const loadDraft = useCallback((): string => {
    return store.getCurrentDraft().content;
  }, [store]);

  // ==================== loadDraftData ====================
  const loadDraftData = useCallback((): DraftData => {
    return store.getCurrentDraft();
  }, [store]);

  // ==================== saveDraft ====================
  const saveDraft = useCallback(
    (nextValue: string) => {
      store.setValue(nextValue);
    },
    [store],
  );

  // ==================== saveDraftData ====================
  const saveDraftData = useCallback(
    (data: DraftData) => {
      store.setDraftData(data);
    },
    [store],
  );

  // ==================== handleSend ====================
  const handleSend = useCallback(
    async (content: string, options?: Record<string, unknown>) => {
      const result = await onSend?.(content, options);
      const outcome = resolveMessageSendOutcome(result);

      if (clearDraftOnSend && outcome.shouldClearDraft) {
        // 成功：清空草稿
        store.setValue('');
        store.setDraftData({
          messageType: undefined,
          templateCode: undefined,
          templateParams: undefined,
          templateMetadata: undefined,
        });
        clearDraft();
      } else if (outcome.shouldRollback && content) {
        // 失败需要回滚：回填内容到输入框，保留模板状态方便用户重新发送
        store.setValue(content);
      }
    },
    [clearDraft, clearDraftOnSend, onSend, store],
  );

  // ==================== 初始化和切换会话 ====================
  useEffect(() => {
    const previousKey = previousDraftKeyRef.current;

    if (
      enableDraft &&
      !keepDraftOnSwitch &&
      previousKey &&
      previousKey !== draftStorageKey
    ) {
      // 不保留草稿时，清空旧 key 对应的草稿
      const oldKey = previousKey;
      if (oldKey && drafts[oldKey]) {
        store.clearDraft();
      }
    }

    previousDraftKeyRef.current = draftStorageKey;
  }, [draftStorageKey, enableDraft, keepDraftOnSwitch, drafts, store]);

  // ==================== 加载草稿 ====================
  useEffect(() => {
    loadedDraftKeyRef.current = null;

    if (!enableDraft || !draftStorageKey) {
      setValue('');
      setMessageType(undefined);
      setTemplateCode(undefined);
      setTemplateParams(undefined);
      setTemplateMetadata(undefined);
      return;
    }

    // 模板锁定时不覆盖当前输入，避免覆盖模板内容
    if (templateLocked) {
      return;
    }

    // 设置当前 key（这会触发 legacy 迁移）
    store.setCurrentDraft(conversationId, channel);
    loadedDraftKeyRef.current = draftStorageKey;
  }, [
    channel,
    conversationId,
    draftStorageKey,
    enableDraft,
    setValue,
    setMessageType,
    setTemplateCode,
    setTemplateParams,
    setTemplateMetadata,
    templateLocked,
    store,
  ]);

  // ==================== 返回值 ====================
  return {
    value: currentDraftData.content,
    setValue,
    messageType: currentDraftData.messageType,
    setMessageType,
    templateCode: currentDraftData.templateCode,
    setTemplateCode,
    templateParams: currentDraftData.templateParams,
    setTemplateParams,
    templateMetadata: currentDraftData.templateMetadata,
    setTemplateMetadata,
    setDraftData,
    getDraftData,
    draftStorageKey,
    clearDraft,
    loadDraft,
    loadDraftData,
    saveDraft,
    saveDraftData,
    handleSend,
  };
}
