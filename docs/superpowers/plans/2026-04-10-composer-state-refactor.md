# Composer 状态管理重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用内部的 Zustand 持久化草稿 store 替换 `use-composer-draft` 的本地状态实现，同时保持 `useComposerLogic` 与公开 `useComposerDraft` API 的兼容行为。

**Architecture:** 新增一个仅仓库内部使用的 `draft.store.ts`，负责长期草稿状态、旧 localStorage key 迁移与持久化。`useComposerLogic` 直接消费 store；`useComposerDraft` 保留为公开兼容包装层，把现有选项与返回值映射到新 store 与发送逻辑，避免破坏 `src/index.ts` 现有导出边界。

**Tech Stack:** TypeScript, React, Zustand, Vitest, Testing Library

---

## 文件结构与职责

- Create: `src/store/draft.store.ts`
  负责定义 `DraftData`、draft key 生成、legacy localStorage 迁移、`useComposerDraftStore` 与语义化 action。
- Create: `src/store/draft.store.test.ts`
  覆盖当前草稿切换、模板原子写入、清空草稿、旧 key 迁移、禁用/清空边界。
- Create: `src/hooks/use-composer-logic.hook.test.tsx`
  覆盖 `useComposerLogic` 的发送成功/失败、模板预览恢复、clear 行为与 `canSend` 计算。
- Modify: `src/hooks/use-composer-draft.hook.ts`
  保留公开 hook 名称与选项签名，改为基于 store 的兼容包装层；继续支持 `clearDraftOnSend`、`keepDraftOnSwitch`、`onSend`。
- Modify: `src/hooks/use-composer-draft.hook.test.ts`
  从“直接操作 localStorage”切到“验证兼容包装层行为”，保留关键兼容场景。
- Modify: `src/hooks/use-composer-logic.hook.ts`
  移除对旧 hook 内部状态机的依赖，直接消费 store，并保留既有返回值形状。
- Modify: `src/utils/sdk-cleanup.util.ts`
  把新旧草稿 key 一并纳入 `clearSDK({ clearStorage: true })` 清理路径。
- Modify: `src/utils/sdk-cleanup.util.test.ts`
  覆盖 `bifrost-chat-draft`、`bifrost-chat-draft-*`、`bifrost-drafts` 三类 key 的清理行为。
- Modify: `design/final-architecture.md`
  把 Composer 长期草稿状态更新为 As-Is 的 Zustand 持久化事实。
- Modify: `README.md`
  在状态管理/特性描述里补一句 Composer 草稿已统一由 Zustand 持久化管理，并更新 `clearSDK` 的清理口径。

## 全局实施约束

- 公开 API 兼容性优先：`src/hooks/index.ts` 继续导出 `useComposerDraft`，不要删除或重命名。
- `Conversation` 命名不变，不新增 `Session`/`Chat` 公共命名。
- 不把新 draft store 从 `src/store/index.ts` 公开导出，避免无必要扩大包 API。
- 必须兼容旧格式草稿：
  - 全局旧 key：`bifrost-chat-draft`
  - 分桶旧 key：`bifrost-chat-draft-*`
  - 旧 value：纯文本和 JSON 两种格式
- 新持久化 key 固定为 `bifrost-drafts`，并且 `clearSDK({ clearStorage: true })`
  必须同时清理 `bifrost-chat-draft`、`bifrost-chat-draft-*` 和
  `bifrost-drafts`。
- `clearSDK({ clearStorage: true })` 除了清理浏览器存储，还必须重置独立的
  draft store 内存状态，避免 UI 仍展示已删除草稿。
- `draftDebounceDelay` 是现有对外配置，最终实现必须明确落在持久化写入链路上，并用测试证明“输入更新后不会立即写入持久化存储”。
- 无 `window.localStorage` 的环境必须优雅降级到内存态，不允许在模块导入或 store 初始化时抛错。
- 每个任务都遵守 TDD：先写失败测试，再写最小实现，再跑通过。

### Task 1: 落内部草稿 Store

**Files:**
- Create: `src/store/draft.store.ts`
- Test: `src/store/draft.store.test.ts`

- [ ] **Step 1: 写失败测试，锁定 store 契约**

```ts
it('切换 current draft 时应返回对应会话和渠道的草稿');
it('setTemplate 应一次性写入 content、messageType、templateCode、templateMetadata');
it('clearDraft 只清当前 key，clearAllDrafts 清空全部');
it('新 store 没有记录时应从 legacy localStorage key 恢复草稿');
it('没有 localStorage 时初始化 store 不应抛错');
```

- [ ] **Step 2: 运行单测确认失败**

Run: `pnpm exec vitest run src/store/draft.store.test.ts`
Expected: FAIL，提示 `draft.store.ts` 或对应 action 尚不存在。

- [ ] **Step 3: 实现最小 store**

```ts
type ComposerDraftStore = {
  drafts: Record<string, DraftData>;
  currentDraftKey: string | null;
  setCurrentDraft: (conversationId: string, channel: ChannelTypeEnum) => void;
  setValue: (value: string) => void;
  setTemplate: (data: SetTemplatePayload) => void;
  setDraftData: (data: Partial<DraftData>) => void;
  clearDraft: () => void;
  clearAllDrafts: () => void;
  getCurrentDraft: () => DraftData;
  getValue: () => string;
  isEmpty: () => boolean;
};
```

实现时同时补上：
- `buildComposerDraftKey(conversationId, channel)`
- `readLegacyDraftData(key)` / `parseLegacyDraftData(raw)`
- `readGlobalLegacyDraftData()`，兼容 `bifrost-chat-draft`
- `createSafeDraftStorage()`，在没有 `window.localStorage` 时回退到 no-op memory storage
- `zustand/persist` 配置，`name` 固定为 `bifrost-drafts`
- `partialize` 只持久化 `drafts`
- `DraftData`、`setTemplate`、`setDraftData` 必须覆盖
  `content/messageType/templateCode/templateParams/templateMetadata`
- 针对 `draftDebounceDelay` 增加独立的持久化调度层，不要把即时 store 更新和持久化写盘混成同一步
- 为 `clearSDK` 预留显式 reset 入口，例如 `resetComposerDraftStore()`

- [ ] **Step 4: 再跑 store 单测确认通过**

Run: `pnpm exec vitest run src/store/draft.store.test.ts`
Expected: PASS

- [ ] **Step 5: 提交 Task 1**

```bash
git add src/store/draft.store.ts src/store/draft.store.test.ts
git commit -m "refactor: add persisted composer draft store"
```

### Task 2: 保留公开 hook 兼容层并重写 useComposerLogic

**Files:**
- Modify: `src/hooks/use-composer-draft.hook.ts`
- Modify: `src/hooks/use-composer-draft.hook.test.ts`
- Modify: `src/hooks/use-composer-logic.hook.ts`
- Create: `src/hooks/use-composer-logic.hook.test.tsx`

- [ ] **Step 1: 先写失败测试，覆盖逻辑层关键行为**

```ts
it('发送成功且 clearDraftOnSend=true 时应清空当前草稿');
it('发送失败时应保留草稿和模板元数据');
it('template draft 恢复时应重新 preview 并用最新内容更新 store');
it('handleClear 应清空 content、messageType、templateCode、templateParams、templateMetadata');
it('公开 useComposerDraft 仍可返回完整兼容接口');
it('draftDebounceDelay 到期前不应把最新草稿写入持久化存储');
```

- [ ] **Step 2: 运行 hook 测试确认失败**

Run: `pnpm exec vitest run src/hooks/use-composer-draft.hook.test.ts src/hooks/use-composer-logic.hook.test.tsx`
Expected: FAIL，说明旧实现与新 store 契约还未对齐。

- [ ] **Step 3: 用最小改动接入 store**

实现要求：
- `useComposerLogic` 直接用 `useComposerDraftStore` 读取当前草稿与 action。
- 会话/渠道变化时切换 `currentDraftKey`，并在 `keepDraftOnSwitch=false` 时清除旧 key 对应草稿。
- 模板恢复逻辑继续存在，但更新目标改为 store。
- `useComposerDraft` 变成兼容包装层：
  - 维持现有 options / return shape
  - 必须继续提供：`value`、`setValue`、`messageType`、`setMessageType`、
    `templateCode`、`setTemplateCode`、`templateParams`、
    `setTemplateParams`、`templateMetadata`、`setTemplateMetadata`、
    `setDraftData`、`getDraftData`、`draftStorageKey`、`clearDraft`、
    `loadDraft`、`loadDraftData`、`saveDraft`、`saveDraftData`、
    `handleSend`
  - 内部调用 store action
  - `handleSend` 继续用 `resolveMessageSendOutcome`
  - `saveDraft` / `saveDraftData` / 自动保存都要共用同一条防抖持久化链路
  - `draftStorageKey` 继续暴露 legacy key 形态，避免接入方行为变化
  - 在 `clearDraft`、发送成功清空、`keepDraftOnSwitch=false` 切换会话时，必须取消尚未执行的防抖写入，避免旧草稿被回写

- [ ] **Step 4: 跑 hook 测试确认通过**

Run: `pnpm exec vitest run src/hooks/use-composer-draft.hook.test.ts src/hooks/use-composer-logic.hook.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交 Task 2**

```bash
git add src/hooks/use-composer-draft.hook.ts src/hooks/use-composer-draft.hook.test.ts src/hooks/use-composer-logic.hook.ts src/hooks/use-composer-logic.hook.test.tsx
git commit -m "refactor: move composer logic to draft store"
```

### Task 3: 打通清理链路、文档事实并做回归验证

**Files:**
- Modify: `src/utils/sdk-cleanup.util.ts`
- Modify: `src/utils/sdk-cleanup.util.test.ts`
- Modify: `design/final-architecture.md`
- Modify: `README.md`

- [ ] **Step 1: 先写或更新回归断言**

如果 Task 2 为了兼容 UI 行为修改了 `src/components/composer/*`：
- 先补对应组件测试，再更新对应 stories。

如果没有组件代码变更：
- 保持组件 stories 不动，避免无意义改动。

- [ ] **Step 2: 更新文档事实**

文档要点：
- `clearSDK({ clearStorage: true })` 同时清理 `bifrost-chat-draft`、
  `bifrost-chat-draft-*`、`bifrost-drafts`
- `clearSDK({ clearStorage: true })` 还要同步重置 draft store 内存状态
- `design/final-architecture.md` 的 As-Is 状态边界中补充 Composer 长期草稿状态由 Zustand 持久化管理
- `README.md` 在特性或状态管理段落中说明 Composer 草稿已经统一到 Zustand 持久化层

- [ ] **Step 3: 运行针对性测试确认未引入回归**

Run: `pnpm exec vitest run src/store/draft.store.test.ts src/hooks/use-composer-draft.hook.test.ts src/hooks/use-composer-logic.hook.test.tsx src/utils/sdk-cleanup.util.test.ts src/components/composer/Composer.config.test.tsx`
Expected: PASS

- [ ] **Step 4: 提交 Task 3**

```bash
git add src/utils/sdk-cleanup.util.ts src/utils/sdk-cleanup.util.test.ts design/final-architecture.md README.md
git commit -m "docs: align composer draft architecture"
```

## 全量验证

- [ ] `pnpm run check`
- [ ] `pnpm run test`
- [ ] `pnpm run build`

如果 `check/test/build` 任一步失败，先修复再继续，不允许带失败结果提交。
