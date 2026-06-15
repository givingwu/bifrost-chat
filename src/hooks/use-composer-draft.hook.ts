import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { MessageTypeEnum } from '@/interfaces/message.interface';
import {
  buildComposerDraftKey,
  useComposerDraftStore,
} from '@/store/draft.store';
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
  const setCurrentDraft = useComposerDraftStore(
    (state) => state.setCurrentDraft,
  );
  const setDraftDataByKey = useComposerDraftStore(
    (state) => state.setDraftDataByKey,
  );
  const clearDraftByKey = useComposerDraftStore(
    (state) => state.clearDraftByKey,
  );
  const getDraftByKey = useComposerDraftStore((state) => state.getDraftByKey);

  const draftKey = useMemo(() => {
    if (conversationId && channel) {
      return buildComposerDraftKey(conversationId, channel);
    }

    return null;
  }, [channel, conversationId]);

  const draftStorageKey = useMemo(() => {
    if (conversationId && channel) {
      return buildConversationDraftStorageKey(conversationId, channel);
    }
    return null;
  }, [channel, conversationId]);

  const emptyDraft = useMemo<DraftData>(
    () => ({
      content: '',
      messageType: undefined,
      templateCode: undefined,
      templateParams: undefined,
      templateMetadata: undefined,
    }),
    [],
  );

  // 当前草稿数据
  const currentDraftData = useMemo(() => {
    if (!draftKey) {
      return emptyDraft;
    }
    // 防御：确保 content 始终是字符串（即使 draft 对象存在但 content 是 undefined）
    const draft = drafts[draftKey];
    return {
      content: draft?.content ?? '',
      messageType: draft?.messageType,
      templateCode: draft?.templateCode,
      templateParams: draft?.templateParams,
      templateMetadata: draft?.templateMetadata,
    };
  }, [draftKey, drafts, emptyDraft]);

  // ==================== setValue ====================
  const loadedDraftKeyRef = useRef<string | null>(null);
  const previousDraftKeyRef = useRef<string | null>(null);

  const setValue = useCallback(
    (nextValue: string) => {
      if (!draftKey) return;

      setDraftDataByKey(draftKey, { content: nextValue });
    },
    [draftKey, setDraftDataByKey],
  );

  // ==================== messageType ====================
  const setMessageType = useCallback(
    (type?: MessageTypeEnum) => {
      if (!draftKey) return;

      setDraftDataByKey(draftKey, { messageType: type });
    },
    [draftKey, setDraftDataByKey],
  );

  // ==================== templateCode ====================
  const setTemplateCode = useCallback(
    (code?: string) => {
      if (!draftKey) return;

      setDraftDataByKey(draftKey, { templateCode: code });
    },
    [draftKey, setDraftDataByKey],
  );

  // ==================== templateParams ====================
  const setTemplateParams = useCallback(
    (params?: Record<string, string>) => {
      if (!draftKey) return;

      setDraftDataByKey(draftKey, { templateParams: params });
    },
    [draftKey, setDraftDataByKey],
  );

  // ==================== templateMetadata ====================
  const setTemplateMetadata = useCallback(
    (metadata?: unknown) => {
      if (!draftKey) return;

      setDraftDataByKey(draftKey, { templateMetadata: metadata });
    },
    [draftKey, setDraftDataByKey],
  );

  // ==================== setDraftData ====================
  const setDraftData = useCallback(
    (data: Partial<DraftData>) => {
      if (!draftKey) return;

      setDraftDataByKey(draftKey, data);
    },
    [draftKey, setDraftDataByKey],
  );

  // ==================== getDraftData ====================
  const getDraftData = useCallback((): DraftData => {
    return getDraftByKey(draftKey);
  }, [draftKey, getDraftByKey]);

  // ==================== clearDraft ====================
  const clearDraft = useCallback(() => {
    if (!draftKey) return;

    clearDraftByKey(draftKey);
  }, [clearDraftByKey, draftKey]);

  // ==================== loadDraft ====================
  const loadDraft = useCallback((): string => {
    return getDraftByKey(draftKey).content;
  }, [draftKey, getDraftByKey]);

  // ==================== loadDraftData ====================
  const loadDraftData = useCallback((): DraftData => {
    return getDraftByKey(draftKey);
  }, [draftKey, getDraftByKey]);

  // ==================== saveDraft ====================
  const saveDraft = useCallback(
    (nextValue: string) => {
      if (!draftKey) return;

      setDraftDataByKey(draftKey, { content: nextValue });
    },
    [draftKey, setDraftDataByKey],
  );

  // ==================== saveDraftData ====================
  const saveDraftData = useCallback(
    (data: DraftData) => {
      if (!draftKey) return;

      setDraftDataByKey(draftKey, data);
    },
    [draftKey, setDraftDataByKey],
  );

  // ==================== handleSend ====================
  const handleSend = useCallback(
    async (content: string, options?: Record<string, unknown>) => {
      const result = await onSend?.(content, options);
      const outcome = resolveMessageSendOutcome(result);

      if (clearDraftOnSend && outcome.shouldClearDraft) {
        // 成功：清空草稿
        if (!draftKey) return;

        setDraftDataByKey(draftKey, {
          content: '',
          messageType: undefined,
          templateCode: undefined,
          templateParams: undefined,
          templateMetadata: undefined,
        });
        clearDraft();
      } else if (outcome.shouldRollback && content) {
        // 失败需要回滚：回填内容到输入框，保留模板状态方便用户重新发送
        if (!draftKey) return;

        setDraftDataByKey(draftKey, { content });
      }
    },
    [clearDraft, clearDraftOnSend, draftKey, onSend, setDraftDataByKey],
  );

  // ==================== 初始化和切换会话 ====================
  useEffect(() => {
    const previousKey = previousDraftKeyRef.current;

    if (
      enableDraft &&
      !keepDraftOnSwitch &&
      previousKey &&
      previousKey !== draftKey
    ) {
      // 不保留草稿时，清空旧 key 对应的草稿
      const oldKey = previousKey;
      if (oldKey && drafts[oldKey]) {
        clearDraftByKey(oldKey);
      }
    }

    previousDraftKeyRef.current = draftKey;
  }, [clearDraftByKey, draftKey, enableDraft, keepDraftOnSwitch, drafts]);

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
    setCurrentDraft(conversationId, channel);
    loadedDraftKeyRef.current = draftKey;
  }, [
    channel,
    conversationId,
    draftKey,
    draftStorageKey,
    enableDraft,
    setValue,
    setMessageType,
    setTemplateCode,
    setTemplateParams,
    setTemplateMetadata,
    templateLocked,
    setCurrentDraft,
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
