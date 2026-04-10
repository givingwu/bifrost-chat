# Composer State Management Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Composer state management from dual-hook architecture to Zustand Store + simplified Hook

**Architecture:** Create a standalone Zustand store (`draft.store.ts`) with persist middleware for long-term state (content, template metadata), keep short-term UI state (attachments, isRecording, isSending) in the simplified `useComposerLogic` hook.

**Tech Stack:** Zustand (with persist middleware), Vitest, React Testing Library

---

## Important Notes

### Breaking Changes

1. **Storage Key Format**: The old `useComposerDraft` used keys like `bifrost-chat-draft-conversation-{id}-channel-{channel}` in localStorage. The new store uses `${conversationId}-${channel}`. **Existing drafts will be lost** after this migration. This is acceptable for a major refactor.

2. **keepDraftOnSwitch Behavior**: The `keepDraftOnSwitch` config is now effectively always true (drafts are never auto-cleared when switching). The config option is kept for backward compatibility but no longer controls behavior.

3. **isRestoring State**: The `isRestoring` state has been removed from `useComposerLogic` return value. If any components consume this value, they need to be updated.

---

## File Structure

### New Files
| File | Responsibility |
|------|-----------------|
| `src/store/draft.store.ts` | Zustand store managing draft state with localStorage persistence |
| `src/store/draft.store.test.ts` | Unit tests for draft store |

### Modified Files
| File | Changes |
|------|---------|
| `src/hooks/use-composer-logic.hook.ts` | Remove dependency on `useComposerDraft`, use `useDraftStore` instead |
| `src/store/index.ts` | Export `useDraftStore` and `useDraft` selector |
| `src/components/layout/DefaultChatLayout.tsx` | Add template preview restoration logic |

### Deleted Files
| File | Reason |
|------|--------|
| `src/hooks/use-composer-draft.hook.ts` | Replaced by Zustand store |
| `src/hooks/use-composer-draft.hook.test.ts` | Replaced by store tests |

---

## Task 1: Create Draft Store

**Files:**
- Create: `src/store/draft.store.ts`
- Create: `src/store/draft.store.test.ts`

- [ ] **Step 1: Write store interface and types**

Create `src/store/draft.store.ts` with core types:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { MessageTypeEnum } from '@/interfaces/message.interface';

/**
 * 草稿数据结构
 */
export interface DraftData {
  /** 输入内容 */
  content: string;
  /** 消息类型 */
  messageType?: MessageTypeEnum;
  /** 模板代码 */
  templateCode?: string;
  /** 模板参数 */
  templateParams?: Record<string, string>;
  /** 模板元数据（用于发送时传递给后端） */
  templateMetadata?: unknown;
}

/**
 * 草稿存储键生成器
 */
export function buildDraftKey(
  conversationId: string,
  channel: ChannelTypeEnum,
): string {
  return `${conversationId}-${channel}`;
}

/**
 * 草稿 Store 状态
 */
interface DraftState {
  /** 草稿数据：key = `${conversationId}-${channel}` */
  drafts: Record<string, DraftData>;
  /** 当前激活的草稿 key */
  currentDraftKey: string | null;
}

/**
 * 草稿 Store 操作
 */
interface DraftActions {
  /** 设置当前会话（切换会话时调用） */
  setCurrentDraft: (conversationId: string, channel: ChannelTypeEnum) => void;
  /** 设置输入内容 */
  setValue: (value: string) => void;
  /** 设置模板内容（语义化操作，一次设置多个相关字段） */
  setTemplate: (data: {
    content: string;
    templateCode?: string;
    templateParams?: Record<string, string>;
    templateMetadata?: unknown;
  }) => void;
  /** 清空当前草稿 */
  clearDraft: () => void;
  /** 清空所有草稿（登出时调用） */
  clearAllDrafts: () => void;
  /** 获取当前草稿数据 */
  getCurrentDraft: () => DraftData;
  /** 获取当前输入内容 */
  getValue: () => string;
  /** 检查当前草稿是否为空 */
  isEmpty: () => boolean;
}

/**
 * 草稿 Store 类型
 */
export type DraftStore = DraftState & DraftActions;

/**
 * 默认草稿数据
 */
const defaultDraft: DraftData = {
  content: '',
  messageType: undefined,
  templateCode: undefined,
  templateParams: undefined,
  templateMetadata: undefined,
};

/**
 * 创建草稿 Store
 */
export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      // ========== 状态 ==========
      drafts: {},
      currentDraftKey: null,

      // ========== 操作 ==========

      setCurrentDraft: (conversationId: string, channel: ChannelTypeEnum) => {
        const key = buildDraftKey(conversationId, channel);
        set({ currentDraftKey: key });

        // 确保草稿存在
        const { drafts } = get();
        if (!drafts[key]) {
          set((state) => ({
            drafts: { ...state.drafts, [key]: { ...defaultDraft } },
          }));
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

      setTemplate: (data) => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) return;

        set({
          drafts: {
            ...drafts,
            [currentDraftKey]: {
              ...drafts[currentDraftKey],
              content: data.content,
              templateCode: data.templateCode,
              templateParams: data.templateParams,
              templateMetadata: data.templateMetadata,
              messageType: data.templateCode
                ? ('template' as const)
                : undefined,
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
            [currentDraftKey]: { ...defaultDraft },
          },
        });
      },

      clearAllDrafts: () => {
        set({ drafts: {}, currentDraftKey: null });
      },

      getCurrentDraft: () => {
        const { currentDraftKey, drafts } = get();
        if (!currentDraftKey) return { ...defaultDraft };
        return drafts[currentDraftKey] || { ...defaultDraft };
      },

      getValue: () => {
        return get().getCurrentDraft().content;
      },

      isEmpty: () => {
        const draft = get().getCurrentDraft();
        return !draft.content.trim();
      },
    }),
    {
      name: 'bifrost-drafts',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ drafts: state.drafts }),
    },
  ),
);

/**
 * 草稿状态选择器
 * 返回当前激活会话的草稿状态
 */
export const useDraft = () => useDraftStore();
```

- [ ] **Step 2: Write the failing unit tests**

Create `src/store/draft.store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MessageTypeEnum } from '@/interfaces/message.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useDraftStore, buildDraftKey, type DraftData } from '@/store/draft.store';

describe('useDraftStore', () => {
  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear();
    // 重置 store 状态
    useDraftStore.setState({
      drafts: {},
      currentDraftKey: null,
    });
  });

  describe('buildDraftKey', () => {
    it('should build correct key', () => {
      const key = buildDraftKey('conv-123', ChannelTypeEnum.WhatsApp);
      expect(key).toBe('conv-123-whatsapp');
    });
  });

  describe('setCurrentDraft', () => {
    it('should set current draft key and create empty draft', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);

      expect(store.currentDraftKey).toBe('conv-1-whatsapp');
      expect(store.drafts['conv-1-whatsapp']).toEqual({
        content: '',
        messageType: undefined,
        templateCode: undefined,
        templateParams: undefined,
        templateMetadata: undefined,
      });
    });

    it('should not overwrite existing draft when switching back', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setValue('Hello');

      store.setCurrentDraft('conv-2', ChannelTypeEnum.SMS);
      store.setValue('World');

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);

      expect(store.getValue()).toBe('Hello');
    });
  });

  describe('setValue', () => {
    it('should set value for current draft', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setValue('Hello World');

      expect(store.getValue()).toBe('Hello World');
      expect(store.drafts['conv-1-whatsapp'].content).toBe('Hello World');
    });

    it('should do nothing when no current draft', () => {
      const store = useDraftStore.getState();

      expect(() => store.setValue('Hello')).not.toThrow();
      expect(store.currentDraftKey).toBeNull();
    });
  });

  describe('setTemplate', () => {
    it('should set all template fields atomically', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setTemplate({
        content: 'Hi {{name}}',
        templateCode: 'welcome',
        templateParams: { name: 'John' },
        templateMetadata: { version: 1 },
      });

      const draft = store.getCurrentDraft();
      expect(draft.content).toBe('Hi {{name}}');
      expect(draft.templateCode).toBe('welcome');
      expect(draft.templateParams).toEqual({ name: 'John' });
      expect(draft.templateMetadata).toEqual({ version: 1 });
      expect(draft.messageType).toBe('template');
    });

    it('should set messageType to template when templateCode provided', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setTemplate({
        content: 'Hello',
        templateCode: 'greeting',
      });

      expect(store.getCurrentDraft().messageType).toBe('template');
    });

    it('should not set messageType when templateCode not provided', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setTemplate({
        content: 'Hello',
      });

      expect(store.getCurrentDraft().messageType).toBeUndefined();
    });
  });

  describe('clearDraft', () => {
    it('should clear current draft', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setValue('Hello');
      store.clearDraft();

      expect(store.getValue()).toBe('');
      expect(store.getCurrentDraft()).toEqual({
        content: '',
        messageType: undefined,
        templateCode: undefined,
        templateParams: undefined,
        templateMetadata: undefined,
      });
    });

    it('should not affect other drafts', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setValue('Hello');

      store.setCurrentDraft('conv-2', ChannelTypeEnum.SMS);
      store.setValue('World');

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.clearDraft();

      expect(store.getValue()).toBe('');

      store.setCurrentDraft('conv-2', ChannelTypeEnum.SMS);
      expect(store.getValue()).toBe('World');
    });
  });

  describe('clearAllDrafts', () => {
    it('should clear all drafts and reset key', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setValue('Hello');

      store.setCurrentDraft('conv-2', ChannelTypeEnum.SMS);
      store.setValue('World');

      store.clearAllDrafts();

      expect(store.drafts).toEqual({});
      expect(store.currentDraftKey).toBeNull();
    });
  });

  describe('selectors', () => {
    it('getCurrentDraft should return current draft', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setValue('Hello');

      expect(store.getCurrentDraft().content).toBe('Hello');
    });

    it('getCurrentDraft should return default when no current draft', () => {
      const store = useDraftStore.getState();

      expect(store.getCurrentDraft()).toEqual({
        content: '',
        messageType: undefined,
        templateCode: undefined,
        templateParams: undefined,
        templateMetadata: undefined,
      });
    });

    it('getValue should return current content', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setValue('Hello World');

      expect(store.getValue()).toBe('Hello World');
    });

    it('isEmpty should return true for empty draft', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);

      expect(store.isEmpty()).toBe(true);
    });

    it('isEmpty should return false for draft with content', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setValue('Hello');

      expect(store.isEmpty()).toBe(false);
    });

    it('isEmpty should return true for whitespace-only content', () => {
      const store = useDraftStore.getState();

      store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
      store.setValue('   ');

      expect(store.isEmpty()).toBe(true);
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test src/store/draft.store.test.ts`
Expected: Tests fail because import paths don't exist yet

- [ ] **Step 4: Implement the store**

The code was provided in Step 1.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/store/draft.store.test.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/store/draft.store.ts src/store/draft.store.test.ts
git commit -m "feat: create draft store with persist middleware

- Add Zustand store for draft state management
- Add persist middleware for localStorage sync
- Add unit tests for all store operations

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Export Draft Store from Index

**Files:**
- Modify: `src/store/index.ts`

- [ ] **Step 1: Add exports to store index**

Add to `src/store/index.ts`:

```typescript
// ... existing imports ...
import type { DraftStore } from './draft.store';
import { useDraftStore, useDraft } from './draft.store';

// ... add to exports ...
export type { DraftStore };
export { useDraftStore, useDraft };
```

Find the existing export section and add:

```typescript
// Add to type exports (after line 28, after other type exports):
export type { DraftStore } from './draft.store';

// Add to selector exports (after line 247, after useComposerConfig):
export const useDraftStore = () => useDraftStoreInternal();
export const useDraft = () => useDraftStoreInternal();

// And add the import at the top with other imports:
import { useDraftStore as useDraftStoreInternal } from './draft.store';
```

Note: The store is NOT integrated into the main ChatStore - it's an independent store with its own selector.

- [ ] **Step 2: Verify exports compile**

Run: `pnpm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/store/index.ts
git commit -m "feat: export draft store from store index

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Refactor useComposerLogic Hook

**Files:**
- Modify: `src/hooks/use-composer-logic.hook.ts`

- [ ] **Step 1: Remove useComposerDraft import**

Remove these lines from `src/hooks/use-composer-logic.hook.ts`:
```typescript
import {
  buildConversationDraftStorageKey,
  useComposerDraft,
} from '@/hooks/use-composer-draft.hook';
```

- [ ] **Step 2: Add useDraftStore import**

Add to imports:
```typescript
import { useDraftStore } from '@/store';
```

- [ ] **Step 3: Replace draft hook usage with store**

Find and replace the draft state section (around lines 136-145):

**OLD CODE:**
```typescript
// ==================== 草稿状态 ====================
const draft = useComposerDraft({
  conversationId,
  channel,
  enableDraft,
  clearDraftOnSend: config.clearDraftOnSend,
  keepDraftOnSwitch: config.keepDraftOnSwitch,
  draftDebounceDelay: config.draftDebounceDelay,
  onSend: onSendProp,
});
```

**NEW CODE:**
```typescript
// ==================== 草稿状态 ====================
const draft = useDraftStore();

// 设置当前会话的草稿（当 conversationId 或 channel 变化时）
useEffect(() => {
  if (conversationId && channel && enableDraft) {
    draft.setCurrentDraft(conversationId, channel);
  }
}, [conversationId, channel, enableDraft, draft]);
```

Note: `enableDraft` is now handled by conditionally calling `setCurrentDraft`. When disabled, the current draft won't be set/updated.

- [ ] **Step 4: Update setComposerValue to use store directly**

Replace the `setComposerValue` callback:

**OLD CODE:**
```typescript
const setComposerValue = useCallback(
  (nextValue: string) => {
    draft.setValue(clampComposerValue(nextValue, effectiveMaxLength));
  },
  [draft, effectiveMaxLength],
);
```

**NEW CODE:**
```typescript
const setComposerValue = useCallback(
  (nextValue: string) => {
    draft.setValue(clampComposerValue(nextValue, effectiveMaxLength));
  },
  [draft, effectiveMaxLength],
);
```

Note: `draft` remains in dependencies to avoid stale closure issues.

- [ ] **Step 5: Remove template preview restoration logic**

Remove the template restoration useEffect (around lines 181-230) and related code:

**DELETE:**
- The entire template restoration useEffect
- `import { useTemplatePreview } from '@/hooks/use-template-preview.hook';`
- `const { mutateAsync: previewTemplate } = useTemplatePreview();`
- `const [isRestoring, setIsRestoring] = useState(false);`
- `const processedDraftScopeRef = useRef<string | undefined>(undefined);`

The template restoration logic will be moved to Task 4 (DefaultChatLayout).

- [ ] **Step 6: Update handleSend to use store directly**

Replace the clear draft section in `handleSend`:

**OLD CODE:**
```typescript
if (hasAttachments && onSendAttachment) {
  await onSendAttachment(attachments, messageToSend || undefined);
  setAttachments([]);
  if (config.clearDraftOnSend) {
    draft.setValue('');
    draft.setMessageType(undefined);
    draft.setTemplateCode(undefined);
    draft.setTemplateParams(undefined);
    draft.setTemplateMetadata(undefined);
    draft.clearDraft();
  }
}
```

**NEW CODE:**
```typescript
if (hasAttachments && onSendAttachment) {
  await onSendAttachment(attachments, messageToSend || undefined);
  setAttachments([]);
  if (config.clearDraftOnSend) {
    draft.clearDraft();
  }
}
```

Also update the regular message send section:

**OLD CODE:**
```typescript
} else if (messageToSend) {
  const options =
    draft.messageType === MessageTypeEnum.Template
      ? {
          type: MessageTypeEnum.Template,
          templateCode: draft.templateCode,
          templateMetadata: draft.templateMetadata,
        }
      : {
          type: draft.messageType,
        };
  await draft.handleSend(messageToSend, options);
}
```

**NEW CODE:**
```typescript
} else if (messageToSend) {
  const currentDraft = draft.getCurrentDraft();
  const options =
    currentDraft.messageType === MessageTypeEnum.Template
      ? {
          type: MessageTypeEnum.Template,
          templateCode: currentDraft.templateCode,
          templateMetadata: currentDraft.templateMetadata,
        }
      : {
          type: currentDraft.messageType,
        };

  await onSendProp?.(messageToSend, options);

  if (config.clearDraftOnSend) {
    draft.clearDraft();
  }
}
```

- [ ] **Step 7: Update handleClear**

**OLD CODE:**
```typescript
const handleClear = useCallback(() => {
  setComposerValue('');
  draft.setMessageType(undefined);
  draft.setTemplateCode(undefined);
  draft.setTemplateParams(undefined);
  setSendError(null);
}, [draft, setComposerValue]);
```

**NEW CODE:**
```typescript
const handleClear = useCallback(() => {
  draft.clearDraft();
  setSendError(null);
}, [draft]);
```

- [ ] **Step 8: Update setTemplate**

**OLD CODE:**
```typescript
const setTemplate = useCallback(
  (data: {
    content: string;
    templateCode?: string;
    templateMetadata?: unknown;
  }) => {
    setComposerValue(data.content);
    draft.setMessageType(MessageTypeEnum.Template);
    draft.setTemplateCode(data.templateCode);
    draft.setTemplateMetadata(data.templateMetadata);
  },
  [draft, setComposerValue],
);
```

**NEW CODE:**
```typescript
const setTemplate = useCallback(
  (data: {
    content: string;
    templateCode?: string;
    templateMetadata?: unknown;
  }) => {
    draft.setTemplate(data);
  },
  [draft],
);
```

Note: The `setTemplate` method in the store already handles setting `messageType` when `templateCode` is provided.

- [ ] **Step 9: Update return value**

Update the return statement to use store methods directly:

**OLD CODE:**
```typescript
return {
  // 状态
  value: draft.value,
  attachments,
  isRecording,
  isSending,
  isTemplateLocked,
  isInputReadOnly,
  isRestoring,
  sendError,

  // 草稿元数据
  messageType: draft.messageType,
  templateCode: draft.templateCode,

  // 配置
  config,

  // 计算值
  effectiveMaxLength,
  placeholder,
  canSend,

  // 操作
  setValue: setComposerValue,
  handleSend,
  handleClear,
  handleAttachmentSelect,
  handleRemoveAttachment,
  handleAudioInput,
  handleSendAudio,
  handleCancelRecording,

  // 模板操作（供外部调用）
  setTemplate,

  // Ref 支持
  inputRef,
  focus,
};
```

**NEW CODE:**
```typescript
const currentDraft = draft.getCurrentDraft();

return {
  // 状态
  value: currentDraft.content,
  attachments,
  isRecording,
  isSending,
  isTemplateLocked,
  isInputReadOnly,
  sendError,

  // 草稿元数据
  messageType: currentDraft.messageType,
  templateCode: currentDraft.templateCode,

  // 配置
  config,

  // 计算值
  effectiveMaxLength,
  placeholder,
  canSend,

  // 操作
  setValue: setComposerValue,
  handleSend,
  handleClear,
  handleAttachmentSelect,
  handleRemoveAttachment,
  handleAudioInput,
  handleSendAudio,
  handleCancelRecording,

  // 模板操作（供外部调用）
  setTemplate,

  // Ref 支持
  inputRef,
  focus,
};
```

Note: `isRestoring` has been removed since template restoration is now handled in the layout layer.

- [ ] **Step 10: Verify no isRestoring consumers**

Run: `grep -r "isRestoring" src/components/ --exclude-dir=node_modules`
Expected: No results (if there are, note which files need updates)

- [ ] **Step 11: Verify build and tests**

Run: `pnpm run build && pnpm test`
Expected: Build succeeds, tests pass

- [ ] **Step 12: Commit**

```bash
git add src/hooks/use-composer-logic.hook.ts
git commit -m "refactor(useComposerLogic): use draft store instead of draft hook

- Remove dependency on useComposerDraft hook
- Use useDraftStore for draft state management
- Simplify API (direct store method calls)
- Remove template preview restoration logic (moved to layout)
- Remove unused isRestoring state
- Handle enableDraft config in useEffect

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add Template Preview Restoration to DefaultChatLayout

**Files:**
- Modify: `src/components/layout/DefaultChatLayout.tsx`

- [ ] **Step 1: Check current implementation**

Read `src/components/layout/DefaultChatLayout.tsx` to understand the current template handling.

- [ ] **Step 2: Add template preview restoration logic**

First, add the import at the top of the file:
```typescript
import { useDraftStore } from '@/store';
```

Then add the following logic to restore template drafts when switching conversations. This should be added after the existing useEffect hooks:

```typescript
// 模板草稿恢复：当切换到包含模板草稿的会话时，重新预览获取最新内容
useEffect(() => {
  const draft = useDraftStore.getState();
  const currentDraft = draft.getCurrentDraft();

  // 如果是模板类型的 draft，重新 preview 获取最新内容
  if (
    activeConversationId &&
    currentDraft.messageType === MessageTypeEnum.Template &&
    currentDraft.templateCode &&
    currentDraft.content
  ) {
    previewTemplate({
      conversationId: activeConversationId,
      currentChannel: activeChannel,
      templateCode: currentDraft.templateCode,
    })
      .then((previewed) => {
        // 使用最新的 content
        const newContent = previewed.previewContent ?? currentDraft.content;
        draft.setTemplate({
          content: newContent,
          templateCode: previewed.code ?? currentDraft.templateCode,
          templateMetadata: previewed,
        });
      })
      .catch((error) => {
        console.warn('[Composer] Failed to preview template draft:', error);
        // fallback: 使用缓存的 content
      });
  }
}, [activeConversationId, activeChannel]);
```

- [ ] **Step 3: Verify build**

Run: `pnpm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/DefaultChatLayout.tsx
git commit -m "feat: add template preview restoration in layout layer

- Restore template draft content when switching conversations
- Re-preview template to get latest content
- Handle preview errors gracefully

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Delete Old Files

**Files:**
- Delete: `src/hooks/use-composer-draft.hook.ts`
- Delete: `src/hooks/use-composer-draft.hook.test.ts`

- [ ] **Step 1: Delete old draft hook files**

```bash
rm src/hooks/use-composer-draft.hook.ts
rm src/hooks/use-composer-draft.hook.test.ts
```

- [ ] **Step 2: Remove export from hooks index**

Remove line 5 from `src/hooks/index.ts`:
```typescript
export { useComposerDraft } from './use-composer-draft.hook';
```

- [ ] **Step 3: Verify no remaining imports**

Run: `grep -r "useComposerDraft" src/ --exclude-dir=node_modules`
Expected: No results (or only in this task's check)

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 5: Run build**

Run: `pnpm run build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove deprecated useComposerDraft hook

- Delete use-composer-draft.hook.ts (replaced by draft store)
- Delete use-composer-draft.hook.test.ts

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Integration Testing

**Files:**
- Test: Manual testing in Storybook or test app

- [ ] **Step 1: Test basic composer functionality**

1. Start Storybook: `pnpm run storybook`
2. Open Composer story
3. Test typing text
4. Test switching between conversations
5. Verify drafts are preserved
6. Refresh page - verify drafts persist

- [ ] **Step 2: Test template functionality**

1. Select a template
2. Verify template content is set
3. Send the template message
4. Verify draft is cleared

- [ ] **Step 2.5: Test template preview error handling**

1. Select a template to create a template draft
2. Switch to a different conversation
3. Mock the previewTemplate API to return an error
4. Switch back to the template conversation
5. Verify the cached template content is still used (fallback behavior)
6. Verify the composer doesn't crash or hang

- [ ] **Step 4: Test attachment functionality**

1. Add an attachment
2. Switch conversations
3. Verify attachment is NOT persisted (by design)
4. Return to original conversation
5. Verify draft text persists but attachment doesn't

- [ ] **Step 5: Test send failure handling**

1. Type a message
2. Force a send failure (disconnect network or mock error)
3. Verify message stays in composer
4. Verify user can retry

- [ ] **Step 6: Test draft clearing on send**

1. Enable clearDraftOnSend config
2. Send a message successfully
3. Verify composer is cleared

4. Disable clearDraftOnSend config
5. Send a message successfully
6. Verify composer retains the message

- [ ] **Step 7: Test enableDraft config**

1. Set enableDraft to false
2. Type a message
3. Switch conversations
4. Switch back
5. Verify draft was NOT saved

- [ ] **Step 8: Test keepDraftOnSwitch behavior**

Note: In the new architecture, drafts are always kept when switching (useDraftStore doesn't auto-clear). The `keepDraftOnSwitch` config is effectively always true. If auto-clearing is needed, it should be implemented at the call site.

---

## Task 7: Final Cleanup

**Files:**
- Update: Documentation if needed

- [ ] **Step 1: Update design docs if needed**

Check if any design docs reference the old hook structure and update them.

- [ ] **Step 2: Run final test suite**

Run: `pnpm test && pnpm run build`
Expected: All tests pass, build succeeds

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "refactor: complete composer state management refactor

- Migrate from dual-hook architecture to Zustand store
- Simplify API with semantic operations
- Improve testability with standalone store tests
- Reduce code complexity

Migration complete:
- useComposerDraft hook → useDraftStore
- useComposerLogic hook → simplified, uses store
- Template restoration moved to DefaultChatLayout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Testing Summary

After completing all tasks, verify:

1. **Unit Tests**: Store tests pass
2. **Integration Tests**: Composer functionality works end-to-end
3. **Persistence**: Drafts survive page refresh
4. **Multi-conversation**: Switching conversations preserves individual drafts
5. **Template Flow**: Selecting and sending templates works correctly
6. **Error Handling**: Failed sends preserve draft for retry
7. **enableDraft**: When false, drafts are not persisted
