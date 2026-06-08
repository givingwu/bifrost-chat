import { create } from 'zustand';
import {
  type PersistStorage,
  persist,
  type StorageValue,
} from 'zustand/middleware';
import type { DraftData } from '@/hooks/use-composer-draft.hook';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { MessageTypeEnum } from '@/interfaces/message.interface';

// ==================== 常量 ====================

const LEGACY_DRAFT_KEY_PREFIX = 'bifrost-chat-draft-';
const LEGACY_GLOBAL_DRAFT_KEY = 'bifrost-chat-draft';
const PERSIST_STORAGE_KEY = 'bifrost-drafts';
const MAX_PERSISTED_DRAFTS = 50;
const MAX_PERSISTED_DRAFT_BYTES = 512 * 1024;
const MAX_TEMPLATE_PARAMS_BYTES = 8 * 1024;

// ==================== 类型定义 ====================

/**
 * 设置模板的数据结构
 */
export interface SetTemplatePayload {
  content: string;
  messageType: MessageTypeEnum;
  templateCode?: string;
  templateParams?: Record<string, string>;
  templateMetadata?: unknown;
}

/**
 * Composer Draft Store 状态
 */
export interface ComposerDraftState {
  /** 所有草稿数据，key 为 buildComposerDraftKey 生成的值 */
  drafts: Record<string, DraftData>;
  /** 当前激活的草稿 key */
  currentDraftKey: string | null;
}

/**
 * Composer Draft Store 操作
 */
export interface ComposerDraftActions {
  /** 设置当前草稿（切换会话/渠道时调用） */
  setCurrentDraft: (conversationId: string, channel: ChannelTypeEnum) => void;
  /** 设置草稿内容 */
  setValue: (value: string) => void;
  /** 设置模板数据（原子操作） */
  setTemplate: (data: SetTemplatePayload) => void;
  /** 设置部分草稿数据 */
  setDraftData: (data: Partial<DraftData>) => void;
  /** 清除当前草稿 */
  clearDraft: () => void;
  /** 清除所有草稿 */
  clearAllDrafts: () => void;
  /** 获取当前草稿数据 */
  getCurrentDraft: () => DraftData;
  /** 获取当前草稿内容 */
  getValue: () => string;
  /** 判断当前草稿是否为空 */
  isEmpty: () => boolean;
}

/**
 * Composer Draft Store 完整类型
 */
export type ComposerDraftStore = ComposerDraftState & ComposerDraftActions;

type PersistedComposerDraftState = Pick<ComposerDraftState, 'drafts'>;

// ==================== 工具函数 ====================

/**
 * 生成草稿 key
 * 格式：{conversationId}-channel-{channel}
 */
export function buildComposerDraftKey(
  conversationId: string,
  channel: ChannelTypeEnum,
): string {
  return `${conversationId}-channel-${channel}`;
}

/**
 * 解析旧格式草稿数据，兼容纯文本和 JSON 格式
 */
function parseLegacyDraftData(raw: string): DraftData {
  if (!raw) {
    return { content: '' };
  }

  // 尝试解析 JSON 格式
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as DraftData;
      // 验证是否为有效的 DraftData 结构
      if (typeof parsed.content === 'string') {
        return {
          content: parsed.content,
          messageType: parsed.messageType,
          templateCode: parsed.templateCode,
          templateParams: parsed.templateParams,
          templateMetadata: parsed.templateMetadata,
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
 * 从 legacy localStorage key 读取草稿数据
 */
function readLegacyDraftData(key: string): DraftData | null {
  if (
    typeof window === 'undefined' ||
    typeof window.localStorage === 'undefined'
  ) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return parseLegacyDraftData(raw);
  } catch {
    return null;
  }
}

/**
 * 从全局 legacy key 读取草稿数据
 */
function readGlobalLegacyDraftData(): DraftData | null {
  return readLegacyDraftData(LEGACY_GLOBAL_DRAFT_KEY);
}

/**
 * 从分桶 legacy key 读取草稿数据
 */
function readBucketLegacyDraftData(
  conversationId: string,
  channel: ChannelTypeEnum,
): DraftData | null {
  const key = `${LEGACY_DRAFT_KEY_PREFIX}conversation-${conversationId}-channel-${channel}`;
  return readLegacyDraftData(key);
}

/**
 * 删除 legacy key（迁移后清理）
 */
function removeLegacyKeys(
  conversationId: string,
  channel: ChannelTypeEnum,
): void {
  if (
    typeof window === 'undefined' ||
    typeof window.localStorage === 'undefined'
  ) {
    return;
  }

  try {
    // 删除分桶 key
    const bucketKey = `${LEGACY_DRAFT_KEY_PREFIX}conversation-${conversationId}-channel-${channel}`;
    window.localStorage.removeItem(bucketKey);

    // 删除全局 key
    window.localStorage.removeItem(LEGACY_GLOBAL_DRAFT_KEY);
  } catch {
    // 忽略异常
  }
}

/**
 * 估算字符串持久化体积，用于控制 localStorage 写入上限。
 */
function getStringByteSize(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }

  return value.length * 2;
}

/**
 * 判断模板参数是否包含可持久化内容。
 */
function hasTemplateParams(params?: Record<string, string>): boolean {
  return Boolean(params && Object.keys(params).length > 0);
}

/**
 * 判断运行时草稿是否为空。
 */
function isRuntimeDraftEmpty(draft?: Partial<DraftData>): boolean {
  return (
    !draft ||
    (!draft.content &&
      !draft.messageType &&
      !draft.templateCode &&
      !hasTemplateParams(draft.templateParams) &&
      draft.templateMetadata === undefined)
  );
}

/**
 * 判断草稿是否需要写入持久化存储。
 */
function shouldPersistDraft(draft?: DraftData): boolean {
  return Boolean(
    draft &&
      (draft.content ||
        draft.messageType ||
        draft.templateCode ||
        hasTemplateParams(draft.templateParams)),
  );
}

/**
 * 标准化运行时草稿结构，避免 content 变成 undefined。
 */
function normalizeRuntimeDraft(draft: Partial<DraftData>): DraftData {
  return {
    content: draft.content ?? '',
    messageType: draft.messageType,
    templateCode: draft.templateCode,
    templateParams: draft.templateParams,
    templateMetadata: draft.templateMetadata,
  };
}

/**
 * 更新草稿时删除空 key，并将最近更新的 key 移到对象末尾。
 */
function upsertDraft(
  drafts: Record<string, DraftData>,
  key: string,
  draft: Partial<DraftData>,
): Record<string, DraftData> {
  const nextDrafts = { ...drafts };
  delete nextDrafts[key];

  if (!isRuntimeDraftEmpty(draft)) {
    nextDrafts[key] = normalizeRuntimeDraft(draft);
  }

  return nextDrafts;
}

/**
 * 过滤并限制模板参数，避免宿主传入异常大对象。
 */
function sanitizeTemplateParams(
  params?: Record<string, string>,
): Record<string, string> | undefined {
  if (!params) {
    return undefined;
  }

  const safeParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return typeof value === 'string';
    }),
  );

  if (Object.keys(safeParams).length === 0) {
    return undefined;
  }

  try {
    const serialized = JSON.stringify(safeParams);
    if (getStringByteSize(serialized) > MAX_TEMPLATE_PARAMS_BYTES) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  return safeParams;
}

/**
 * 生成可持久化草稿，只保留恢复草稿需要的最小字段。
 */
function sanitizeDraftForPersistence(draft: DraftData): DraftData {
  const content = draft.content ?? '';
  return {
    content,
    messageType: draft.messageType,
    templateCode: draft.templateCode,
    templateParams: sanitizeTemplateParams(draft.templateParams),
  };
}

/**
 * 压缩草稿集合，限制数量与总体积。
 */
function compactDraftsForPersistence(
  drafts: Record<string, DraftData>,
  maxDrafts = MAX_PERSISTED_DRAFTS,
): Record<string, DraftData> {
  const entries = Object.entries(drafts)
    .map(([key, draft]) => {
      return [key, sanitizeDraftForPersistence(draft)] as const;
    })
    .filter(([, draft]) => shouldPersistDraft(draft))
    .slice(-maxDrafts);

  while (entries.length > 0) {
    const compacted = Object.fromEntries(entries);

    try {
      const serialized = JSON.stringify({ drafts: compacted });
      if (getStringByteSize(serialized) <= MAX_PERSISTED_DRAFT_BYTES) {
        return compacted;
      }
    } catch {
      return {};
    }

    entries.shift();
  }

  return {};
}

/**
 * 生成持久化 state，确保不会写入运行时大对象。
 */
function createPersistedDraftState(
  drafts: Record<string, DraftData>,
  maxDrafts?: number,
): PersistedComposerDraftState {
  return {
    drafts: compactDraftsForPersistence(drafts, maxDrafts),
  };
}

/**
 * 压缩 Zustand persist 的存储值。
 */
function compactStorageValue(
  value: StorageValue<PersistedComposerDraftState>,
  options?: { maxDrafts?: number },
): StorageValue<PersistedComposerDraftState> {
  return {
    ...value,
    state: createPersistedDraftState(
      value.state?.drafts ?? {},
      options?.maxDrafts,
    ),
  };
}

/**
 * 解析已持久化数据，并兼容旧版本中写入的超大字段。
 */
function parsePersistedStorageValue(
  raw: string,
): StorageValue<PersistedComposerDraftState> | null {
  try {
    return compactStorageValue(
      JSON.parse(raw) as StorageValue<PersistedComposerDraftState>,
    );
  } catch {
    return null;
  }
}

/**
 * 安全获取浏览器 localStorage，兼容受限环境。
 */
function getBrowserLocalStorage(): Storage | null {
  try {
    if (
      typeof window === 'undefined' ||
      typeof window.localStorage === 'undefined'
    ) {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * 判断是否为浏览器存储配额异常。
 */
function isQuotaExceededError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: number; name?: string };
  return (
    maybeError.name === 'QuotaExceededError' ||
    maybeError.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    maybeError.code === 22 ||
    maybeError.code === 1014
  );
}

/**
 * 创建安全的存储适配器。
 *
 * localStorage 超配额时会压缩草稿并重试；仍失败则降级为内存存储，
 * 避免同步 setItem 异常冒泡到宿主页面。
 */
function createSafeDraftStorage(): PersistStorage<PersistedComposerDraftState> {
  const memoryStorage: Record<string, string> = {};

  return {
    getItem: (name: string) => {
      const storage = getBrowserLocalStorage();
      let raw = memoryStorage[name];

      try {
        raw = storage?.getItem(name) ?? raw;
      } catch {
        // localStorage 读取受限时使用内存 fallback
      }

      if (!raw) {
        return null;
      }

      return parsePersistedStorageValue(raw);
    },

    setItem: (
      name: string,
      value: StorageValue<PersistedComposerDraftState>,
    ) => {
      const storage = getBrowserLocalStorage();
      const compactedValue = compactStorageValue(value);
      const serialized = JSON.stringify(compactedValue);

      if (!storage) {
        memoryStorage[name] = serialized;
        return;
      }

      try {
        storage.setItem(name, serialized);
        delete memoryStorage[name];
        return;
      } catch (error) {
        if (!isQuotaExceededError(error)) {
          memoryStorage[name] = serialized;
          console.warn(
            '[BifrostChat] Draft persistence failed; using memory storage.',
            error,
          );
          return;
        }
      }

      const prunedValue = compactStorageValue(value, { maxDrafts: 10 });
      const prunedSerialized = JSON.stringify(prunedValue);

      try {
        storage.setItem(name, prunedSerialized);
        delete memoryStorage[name];
        return;
      } catch (error) {
        try {
          storage.removeItem(name);
        } catch {
          // 忽略清理失败，继续降级到内存存储
        }

        memoryStorage[name] = prunedSerialized;
        console.warn(
          '[BifrostChat] Draft storage quota exceeded; using memory storage.',
          error,
        );
      }
    },

    removeItem: (name: string) => {
      const storage = getBrowserLocalStorage();
      try {
        storage?.removeItem(name);
      } catch {
        // 忽略清理失败，避免受限环境影响页面运行
      }
      delete memoryStorage[name];
    },
  };
}

/**
 * 获取默认的空草稿数据
 */
function createEmptyDraft(): DraftData {
  return {
    content: '',
    messageType: undefined,
    templateCode: undefined,
    templateParams: undefined,
    templateMetadata: undefined,
  };
}

// ==================== Store 创建 ====================

/**
 * Composer Draft Store 初始状态
 */
const initialState: ComposerDraftState = {
  drafts: {},
  currentDraftKey: null,
};

/**
 * 创建 Composer Draft Store
 */
export const useComposerDraftStore = create<ComposerDraftStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentDraft: (conversationId: string, channel: ChannelTypeEnum) => {
        const newKey = buildComposerDraftKey(conversationId, channel);
        const currentState = get();

        // 如果切换到不同的 key，需要迁移旧数据
        if (currentState.currentDraftKey !== newKey) {
          set({ currentDraftKey: newKey });

          // 检查是否需要从 legacy 迁移
          if (!currentState.drafts[newKey]) {
            // 优先尝试分桶 legacy key
            let legacyData = readBucketLegacyDraftData(conversationId, channel);

            // 如果分桶没有，尝试全局 legacy key
            if (!legacyData || !legacyData.content) {
              const globalData = readGlobalLegacyDraftData();

              if (globalData?.content) {
                legacyData = globalData;
              }
            }

            // 如果找到 legacy 数据，迁移到新 store
            if (legacyData?.content) {
              set((state) => ({
                drafts: upsertDraft(state.drafts, newKey, legacyData),
              }));

              // 清理 legacy keys
              removeLegacyKeys(conversationId, channel);
            }
          }
        }
      },

      setValue: (value: string) => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) return;

        set({
          drafts: upsertDraft(drafts, currentDraftKey, {
            ...drafts[currentDraftKey],
            content: value,
          }),
        });
      },

      setTemplate: (data: SetTemplatePayload) => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) return;

        set({
          drafts: upsertDraft(drafts, currentDraftKey, data),
        });
      },

      setDraftData: (data: Partial<DraftData>) => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) return;

        set({
          drafts: upsertDraft(drafts, currentDraftKey, {
            ...drafts[currentDraftKey],
            ...data,
          }),
        });
      },

      clearDraft: () => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) return;

        const newDrafts = { ...drafts };
        delete newDrafts[currentDraftKey];
        set({ drafts: newDrafts });
      },

      clearAllDrafts: () => {
        set({ drafts: {} });
      },

      getCurrentDraft: () => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) {
          return createEmptyDraft();
        }

        return drafts[currentDraftKey] || createEmptyDraft();
      },

      getValue: () => {
        return get().getCurrentDraft().content;
      },

      isEmpty: () => {
        const draft = get().getCurrentDraft();
        return isRuntimeDraftEmpty(draft);
      },
    }),
    {
      name: PERSIST_STORAGE_KEY,
      storage: createSafeDraftStorage(),
      // 只持久化 drafts，currentDraftKey 在运行时计算
      partialize: (state) => createPersistedDraftState(state.drafts),
    },
  ),
);

// ==================== Reset 函数 ====================

/**
 * 重置 Composer Draft Store
 * 用于 SDK 清理场景，清空所有草稿和持久化数据
 */
export function resetComposerDraftStore(): void {
  // 先清空持久化存储（在清空状态之前）
  if (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  ) {
    try {
      window.localStorage.removeItem(PERSIST_STORAGE_KEY);
    } catch {
      // 忽略异常
    }
  }

  // 清空 store 状态
  useComposerDraftStore.setState(initialState);
}
