# Composer 状态管理重构设计

**日期**: 2026-04-10
**状态**: 已批准
**作者**: Claude
**类型**: 架构重构

## 概述

重构 Composer 组件的状态管理层，将当前分散在 `useComposerDraft` 和 `useComposerLogic` 两个 hook 中的逻辑统一化。

**当前问题**：
- API 调用繁琐（需要通过 `draft.setValue()` 等中间层）
- 状态同步问题（draft 和其他状态不一致）
- 测试困难（两个 hook 耦合太紧）
- 没有统一的状态管理方案

## 目标

1. 简化 API 调用
2. 清晰的职责边界
3. 更易测试和维护
4. 统一使用 Zustand 管理客户端状态

## 架构设计

### 整体结构

```
┌─────────────────────────────────────────────────────────────┐
│                        Composer 组件                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         useComposerLogic (简化后)                      │  │
│  │  • 派生状态计算 (canSend, placeholder, maxLength)     │  │
│  │  • 业务逻辑整合 (onSend, onSendAttachment)            │  │
│  │  • 短期状态 (attachments, isRecording, isSending)    │  │
│  │  • 模板预览逻辑                                        │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
│               ▼                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       useComposerDraftStore (新增)                    │  │
│  │  • 长期状态 (content, messageType, templateCode...)   │  │
│  │  • 语义化操作 (setValue, setTemplate, clearDraft)     │  │
│  │  • localStorage 持久化                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         useComposerConfig (现有)                      │  │
│  │  • 功能配置 (enableAttachments, maxAttachments...)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 状态边界

| 状态类型 | 存储位置 | 持久化 |
|---------|---------|--------|
| `content` | Store | ✅ localStorage |
| `messageType` | Store | ✅ localStorage |
| `templateCode` | Store | ✅ localStorage |
| `templateParams` | Store | ✅ localStorage |
| `templateMetadata` | Store | ✅ localStorage |
| `attachments` | Hook | ❌ |
| `isRecording` | Hook | ❌ |
| `isSending` | Hook | ❌ |
| `sendError` | Hook | ❌ |

**设计原则**：长期状态（跨会话、跨刷新需要保留）→ Store，短期交互状态 → Hook

## Store 接口设计

### 文件位置
`src/store/draft.store.ts`

### 类型定义

```typescript
interface DraftData {
  content: string;
  messageType?: MessageTypeEnum;
  templateCode?: string;
  templateParams?: Record<string, string>;
  templateMetadata?: unknown;
}

interface ComposerDraftState {
  // 草稿数据：key = `${conversationId}-${channel}`
  drafts: Record<string, DraftData>;

  // 当前激活的草稿 key
  currentDraftKey: string | null;
}

interface ComposerDraftActions {
  // 核心操作
  setCurrentDraft: (conversationId: string, channel: ChannelTypeEnum) => void;
  setValue: (value: string) => void;
  setTemplate: (data: {
    content: string;
    templateCode?: string;
    templateParams?: Record<string, string>;
    templateMetadata?: unknown;
  }) => void;
  clearDraft: () => void;
  clearAllDrafts: () => void;

  // 选择器
  getCurrentDraft: () => DraftData;
  getValue: () => string;
  isEmpty: () => boolean;
}

type ComposerDraftStore = ComposerDraftState & ComposerDraftActions;
```

### 导出

```typescript
// Store
export const useComposerDraftStore = create<ComposerDraftStore>()(
  persist(
    (set, get) => ({ /* ... */ }),
    {
      name: 'bifrost-drafts',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ drafts: state.drafts }),
    }
  )
);

// 选择器
export const useComposerDraft = () => useComposerDraftStore();
```

## Hook 层设计

### useComposerLogic 返回值

```typescript
interface UseComposerLogicResult {
  // 状态
  value: string;
  attachments: Attachment[];
  isRecording: boolean;
  isSending: boolean;
  sendError: string | null;

  // 草稿元数据
  messageType?: MessageTypeEnum;
  templateCode?: string;

  // 派生状态
  effectiveMaxLength?: number;
  placeholder: string;
  canSend: boolean;
  isTemplateLocked: boolean;
  isInputReadOnly: boolean;

  // 配置
  config: ResolvedComposerConfig;

  // 操作
  setValue: (value: string) => void;
  handleSend: () => Promise<void>;
  handleClear: () => void;
  handleAttachmentSelect: (files: File[]) => void;
  handleRemoveAttachment: (index: number) => void;
  handleAudioInput: () => void;
  handleSendAudio: (audio: AudioData) => Promise<void>;
  handleCancelRecording: () => void;

  // 模板操作
  setTemplate: (data: {
    content: string;
    templateCode?: string;
    templateMetadata?: unknown;
  }) => void;

  // Ref 支持
  inputRef: React.RefObject<HTMLTextAreaElement>;
  focus: () => void;
}
```

## 数据流

### 会话切换流程

```
用户切换会话
      │
      ▼
useComposerLogic 检测 conversationId/channel 变化
      │
      ▼
store.setCurrentDraft(newConversationId, newChannel)
      │
      ├──► Store 自动保存旧草稿到 localStorage
      ├──► Store 更新 currentDraftKey
      └──► Store 从 localStorage 加载新草稿
      │
      ▼
组件自动重新渲染
```

### 发送成功流程

```
用户点击发送
      │
      ▼
handleSend() 执行
      │
      ├──► setIsSending(true)
      ├──► await onSend(content, options)
      │
      ▼
发送成功 + config.clearDraftOnSend === true
      │
      ├──► store.clearDraft()
      ├──► setAttachments([])
      └──► setIsSending(false)
```

### 模板设置流程

```
用户选择模板
      │
      ▼
外部调用 composerRef.setTemplate(data)
      │
      ▼
store.setTemplate({
  content: previewedContent,
  templateCode,
  templateMetadata
})
      │
      ├──► 一次性更新所有模板相关字段
      └──► 自动持久化到 localStorage
```

## 错误处理

### localStorage 不可用
zustand/persist 自动处理，优雅降级到内存状态

### 发送失败回滚
```typescript
try {
  await onSend(content, options);
  if (config.clearDraftOnSend) {
    store.clearDraft();
  }
} catch (error) {
  // 失败：保留草稿，用户可以重试
  setSendError(error.message);
}
```

### 草稿数据损坏
Store 初始化时使用默认值，parseDraftData 兼容旧格式

### 并发发送保护
```typescript
if (isSending || !canSend) return;
```

## 测试策略

### Store 单元测试

```typescript
describe('useComposerDraftStore', () => {
  it('should save and restore draft', () => {
    const store = useComposerDraftStore.getState();
    store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
    store.setValue('Hello');

    const draft = store.getCurrentDraft();
    expect(draft.content).toBe('Hello');
  });

  it('should set template atomically', () => {
    const store = useComposerDraftStore.getState();
    store.setTemplate({
      content: 'Hi {{name}}',
      templateCode: 'welcome',
      templateMetadata: { params: ['name'] },
    });

    const draft = store.getCurrentDraft();
    expect(draft.content).toBe('Hi {{name}}');
    expect(draft.templateCode).toBe('welcome');
    expect(draft.messageType).toBe(MessageTypeEnum.Template);
  });

  it('should clear current draft', () => {
    const store = useComposerDraftStore.getState();
    store.setCurrentDraft('conv-1', ChannelTypeEnum.WhatsApp);
    store.setValue('Hello');
    store.clearDraft();

    expect(store.getValue()).toBe('');
  });
});
```

### Hook 集成测试

```typescript
describe('useComposerLogic', () => {
  it('should send message and clear draft on success', async () => {
    const onSend = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() =>
      useComposerLogic({
        conversationId: 'conv-1',
        channel: ChannelTypeEnum.WhatsApp,
        onSend,
      })
    );

    act(() => result.current.setValue('Hello'));
    await act(async () => result.current.handleSend());

    expect(onSend).toHaveBeenCalledWith('Hello', undefined);
    expect(result.current.value).toBe('');
  });

  it('should keep draft on send failure', async () => {
    const onSend = vi.fn().mockRejectedValue(new Error('Send failed'));
    const { result } = renderHook(() =>
      useComposerLogic({
        conversationId: 'conv-1',
        channel: ChannelTypeEnum.WhatsApp,
        onSend,
        config: { clearDraftOnSend: true },
      })
    );

    act(() => result.current.setValue('Hello'));
    await act(async () => result.current.handleSend());

    expect(result.current.value).toBe('Hello');
    expect(result.current.sendError).toBe('Send failed');
  });
});
```

## 迁移计划

### 阶段 1: 创建 Store
- [ ] 创建 `draft.store.ts`
- [ ] 编写 Store 单元测试
- [ ] 确保测试通过

### 阶段 2: 重写 useComposerLogic
- [ ] 删除对 `useComposerDraft` 的依赖
- [ ] 使用 `useComposerDraftStore`
- [ ] 保留相同的返回值接口
- [ ] 编写集成测试

### 阶段 3: 更新组件
- [ ] 更新 `ComposerToolbar`（如需要）
- [ ] 验证功能正常

### 阶段 4: 清理
- [ ] 删除 `use-draft.hook.ts`
- [ ] 更新测试
- [ ] 更新文档

## 预期收益

| 指标 | 当前 | 重构后 |
|------|------|--------|
| 代码行数 | ~200 行 | ~120 行 |
| API 调用层级 | `draft.setValue()` | `setValue()` |
| 文件数量 | 2 个 hook | 1 个 store + 1 个 hook |
| 可测试性 | 需要组件测试 | Store 可独立测试 |

## 决策记录

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 重构范围 | 完全重写 | 彻底解决问题，不受历史包袱限制 |
| 状态边界 | 按生命周期划分 | 长期状态持久化，短期状态轻量 |
| 多会话草稿 | `Record<string, DraftData>` | O(1) 访问，与现有 key 格式一致 |
| API 风格 | 语义化操作 | 符合业务语义，减少状态不一致 |
| 模板预览 | 保留在 Hook | Store 保持纯粹，React Query 需在 React 中使用 |
| Store 位置 | 独立 Store | 独立性强，性能优化，易测试 |
| 配置关系 | Hook 层协调 | 保持模块独立，职责清晰 |
