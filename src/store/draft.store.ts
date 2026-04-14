import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DraftData } from '@/hooks/use-composer-draft.hook';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { MessageTypeEnum } from '@/interfaces/message.interface';

// ==================== 常量 ====================

const LEGACY_DRAFT_KEY_PREFIX = 'bifrost-chat-draft-';
const LEGACY_GLOBAL_DRAFT_KEY = 'bifrost-chat-draft';
const PERSIST_STORAGE_KEY = 'bifrost-drafts';

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
 * 创建安全的存储适配器
 * 无 localStorage 时降级到内存存储
 */
function createSafeDraftStorage() {
  if (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  ) {
    return createJSONStorage(() => window.localStorage);
  }

  // 内存存储 fallback
  const memoryStorage: Record<string, string> = {};
  return {
    getItem: (name: string) => {
      const value = memoryStorage[name];
      return value ?? null;
    },
    setItem: (name: string, value: string) => {
      memoryStorage[name] = value;
    },
    removeItem: (name: string) => {
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
              if (globalData && globalData.content) {
                legacyData = globalData;
              }
            }

            // 如果找到 legacy 数据，迁移到新 store
            if (legacyData && legacyData.content) {
              set((state) => ({
                drafts: {
                  ...state.drafts,
                  [newKey]: legacyData,
                },
              }));

              // 清理 legacy keys
              removeLegacyKeys(conversationId, channel);
            } else {
              // 初始化空草稿
              set((state) => ({
                drafts: {
                  ...state.drafts,
                  [newKey]: createEmptyDraft(),
                },
              }));
            }
          }
        }
      },

      setValue: (value: string) => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) return;

        set({
          drafts: {
            ...drafts,
            [currentDraftKey]: {
              ...drafts[currentDraftKey],
              content: value,
            },
          },
        });
      },

      setTemplate: (data: SetTemplatePayload) => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) return;

        set({
          drafts: {
            ...drafts,
            [currentDraftKey]: {
              content: data.content,
              messageType: data.messageType,
              templateCode: data.templateCode,
              templateParams: data.templateParams,
              templateMetadata: data.templateMetadata,
            },
          },
        });
      },

      setDraftData: (data: Partial<DraftData>) => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) return;

        set({
          drafts: {
            ...drafts,
            [currentDraftKey]: {
              ...drafts[currentDraftKey],
              ...data,
            },
          },
        });
      },

      clearDraft: () => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) return;

        set({
          drafts: {
            ...drafts,
            [currentDraftKey]: createEmptyDraft(),
          },
        });
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
        return !draft.content && !draft.messageType;
      },
    }),
    {
      name: PERSIST_STORAGE_KEY,
      storage: createSafeDraftStorage(),
      // 只持久化 drafts，currentDraftKey 在运行时计算
      partialize: (state) => ({
        drafts: state.drafts,
      }),
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
