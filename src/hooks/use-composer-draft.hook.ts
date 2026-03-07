import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MessageTypeEnum } from '@/interfaces/message.interface';

const DRAFT_KEY_PREFIX = 'bifrost-chat-draft-';
const DEFAULT_DRAFT_DEBOUNCE_DELAY = 500;

function canUseLocalStorage(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

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
  templateCode?: string | number;
  /** 模板参数 */
  templateParams?: Record<string, string>;
  /** 模板元数据（用于发送时传递给后端） */
  templateMetadata?: unknown;
}

export interface UseComposerDraftOptions {
  conversationId?: string;
  templateLocked?: boolean;
  enableDraft?: boolean;
  draftDebounceDelay?: number;
  clearDraftOnSend?: boolean;
  keepDraftOnSwitch?: boolean;
  onSend?: (
    content: string,
    options?: Record<string, unknown>,
  ) => void | Promise<void>;
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
  templateCode?: string | number;
  /** 设置模板 ID */
  setTemplateCode: (id?: string | number) => void;
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
  /** 草稿存储 key */
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
 * 解析草稿数据，兼容旧格式（纯文本）
 */
function parseDraftData(raw: string): DraftData {
  if (!raw) {
    return { content: '' };
  }

  // 尝试解析 JSON 格式
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      // 验证是否为有效的 DraftData 结构
      if (typeof parsed.content === 'string') {
        return {
          content: parsed.content,
          messageType: parsed.messageType,
          templateCode: parsed.templateCode,
          templateParams: parsed.templateParams,
        };
      }
    } catch {
      // 解析失败，当作纯文本处理
    }
  }

  // 旧格式：纯文本
  return { content: raw };
}

/**
 * 序列化草稿数据为 JSON
 */
function serializeDraftData(data: DraftData): string {
  return JSON.stringify(data);
}

/**
 * useComposerDraft：管理会话草稿输入值、持久化与发送后清理。
 * 支持缓存消息类型（如 template），刷新后可恢复。
 */
export function useComposerDraft({
  conversationId,
  templateLocked = false,
  enableDraft = true,
  draftDebounceDelay = DEFAULT_DRAFT_DEBOUNCE_DELAY,
  clearDraftOnSend = true,
  keepDraftOnSwitch = true,
  onSend,
}: UseComposerDraftOptions): UseComposerDraftResult {
  const [value, setValue] = useState('');
  const [messageType, setMessageType] = useState<MessageTypeEnum | undefined>();
  const [templateCode, setTemplateCode] = useState<
    string | number | undefined
  >();
  const [templateParams, setTemplateParams] = useState<
    Record<string, string> | undefined
  >();
  const [templateMetadata, setTemplateMetadata] = useState<unknown>(undefined);
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const loadedDraftKeyRef = useRef<string | null>(null);
  const previousDraftKeyRef = useRef<string | null>(null);

  const draftStorageKey = useMemo(
    () =>
      conversationId
        ? `${DRAFT_KEY_PREFIX}conversation-${conversationId}`
        : null,
    [conversationId],
  );

  const clearDraftByKey = useCallback((storageKey: string | null) => {
    if (!storageKey || !canUseLocalStorage()) {
      return;
    }

    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // 忽略 localStorage 异常，避免影响输入流程
    }
  }, []);

  const clearDraft = useCallback(() => {
    clearDraftByKey(draftStorageKey);
  }, [clearDraftByKey, draftStorageKey]);

  const loadDraftData = useCallback((): DraftData => {
    if (!draftStorageKey || !canUseLocalStorage()) {
      return { content: '' };
    }

    try {
      const raw = window.localStorage.getItem(draftStorageKey);

      if (!raw) {
        return { content: '' };
      }

      return parseDraftData(raw);
    } catch {
      return { content: '' };
    }
  }, [draftStorageKey]);

  const loadDraft = useCallback(() => {
    return loadDraftData().content;
  }, [loadDraftData]);

  const saveDraftData = useCallback(
    (data: DraftData) => {
      if (!draftStorageKey || !canUseLocalStorage()) {
        return;
      }

      try {
        if (data.content || data.messageType) {
          window.localStorage.setItem(
            draftStorageKey,
            serializeDraftData(data),
          );
          return;
        }
        window.localStorage.removeItem(draftStorageKey);
      } catch {
        // 忽略 localStorage 异常，避免影响输入流程
      }
    },
    [draftStorageKey],
  );

  const saveDraft = useCallback(
    (nextValue: string) => {
      saveDraftData({
        content: nextValue,
        messageType,
        templateCode,
        templateParams,
      });
    },
    [messageType, saveDraftData, templateCode, templateParams],
  );

  const getDraftData = useCallback(
    (): DraftData => ({
      content: value,
      messageType,
      templateCode,
      templateParams,
    }),
    [messageType, templateCode, templateParams, value],
  );

  const setDraftData = useCallback((data: Partial<DraftData>) => {
    if (data.content !== undefined) {
      setValue(data.content);
    }

    if (data.messageType !== undefined) {
      setMessageType(data.messageType);
    }

    if (data.templateCode !== undefined) {
      setTemplateCode(data.templateCode);
    }

    if (data.templateParams !== undefined) {
      setTemplateParams(data.templateParams);
    }
  }, []);

  useEffect(() => {
    const previousKey = previousDraftKeyRef.current;

    if (
      enableDraft &&
      !keepDraftOnSwitch &&
      previousKey &&
      previousKey !== draftStorageKey
    ) {
      clearDraftByKey(previousKey);
    }

    previousDraftKeyRef.current = draftStorageKey;
  }, [clearDraftByKey, draftStorageKey, enableDraft, keepDraftOnSwitch]);

  useEffect(() => {
    loadedDraftKeyRef.current = null;

    if (!enableDraft || !draftStorageKey) {
      setValue('');
      setMessageType(undefined);
      setTemplateCode(undefined);
      setTemplateParams(undefined);

      return;
    }

    // 模板锁定时不覆盖当前输入，避免覆盖模板内容
    if (templateLocked) {
      return;
    }

    const draftData = loadDraftData();

    setValue(draftData.content);
    setMessageType(draftData.messageType);
    setTemplateCode(draftData.templateCode);
    setTemplateParams(draftData.templateParams);

    loadedDraftKeyRef.current = draftStorageKey;
  }, [draftStorageKey, enableDraft, loadDraftData, templateLocked]);

  useEffect(() => {
    if (!enableDraft || !draftStorageKey) {
      return;
    }

    if (loadedDraftKeyRef.current !== draftStorageKey) {
      return;
    }

    if (saveTimeoutRef.current !== undefined) {
      clearTimeout(saveTimeoutRef.current);
    }

    const draftData: DraftData = {
      content: value,
      messageType,
      templateCode,
      templateParams,
    };

    saveTimeoutRef.current = window.setTimeout(() => {
      saveDraftData(draftData);
      saveTimeoutRef.current = undefined;
    }, draftDebounceDelay);

    return () => {
      if (saveTimeoutRef.current !== undefined) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    draftDebounceDelay,
    draftStorageKey,
    enableDraft,
    messageType,
    saveDraftData,
    templateCode,
    templateParams,
    value,
  ]);

  const handleSend = useCallback(
    async (content: string, options?: Record<string, unknown>) => {
      await onSend?.(content, options);

      setValue('');
      setMessageType(undefined);
      setTemplateCode(undefined);
      setTemplateParams(undefined);

      if (clearDraftOnSend) {
        clearDraft();
      }
    },
    [clearDraft, clearDraftOnSend, onSend],
  );

  return {
    value,
    setValue,
    messageType,
    setMessageType,
    templateCode,
    setTemplateCode,
    templateParams,
    setTemplateParams,
    templateMetadata,
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
