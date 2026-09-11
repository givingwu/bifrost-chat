# Bifrost-Chat JS SDK 文档导航（v3.1）

本目录采用双轨口径：**当前已实现（As-Is）** 与
**目标架构（To-Be）** 并行描述，避免混写。

> **更新日期**：2026-06-02。仓库级入口见
> [`../DOCUMENTATION_INDEX.md`](../DOCUMENTATION_INDEX.md)。

## 文档分层

### 1) SSOT（单一事实源）

- `final-architecture.md`

用途：

- 定义当前生效的不可变决策。
- 记录当前实现事实（公开导出、状态边界、接口签名）。
- 标记目标架构阶段与前置条件。

### 2) 当前实现（As-Is）

- `architecture-overview.md`
- `architecture-diagrams.md`
- `component-architecture.md`
- `reactive-architecture-design.md`
- `message-type-configuration.md`
- `conversation-pinning-usage.md`
- `offline-message-queue-usage.md`
- `mark-as-read-usage.md`
- `unread-usage.md`
- `virtual-scroll-implementation.md`

用途：

- 说明仓库当前代码行为和数据流。
- 作为排查问题、评审改动的直接依据。
- 其中 usage 文档描述当前可接入的调用方式；若出现旧路径，以当前包入口
  导出为准。

### 3) 目标架构（To-Be）

- `sdk-interface-abstraction-design.md`
- `sdk-final-architecture-design.md`
- `ui-flexibility-design.md`
- `migration-guide.md`
- `naming-conventions.md`
- `offline-message-queue-design.md`
- `failed-message-recovery-design.md`

用途：

- 定义未来演进方向和迁移步骤。
- 与当前实现冲突时，必须在文档中显式标注“未落地”。

### 4) 历史记录（非 SSOT）

- `virtual-scroll-implementation.md`
- `virtual-scroll-research.md`
- `generic-architecture-design.md`
- `protocol-integration-architecture.md`
- `protocol-sequence-diagram.md`
- `integration-demo.md`
- `conversation-dataflow-review.md`

用途：

- 保留历史设计与实施背景。
- 不作为当前实现的唯一依据。

说明：`virtual-scroll-implementation.md` 同时记录已实现事实与实施历史；
当其与 `final-architecture.md` 或真实代码冲突时，以后者为准。

## 推荐阅读顺序

1. `final-architecture.md`
2. `architecture-overview.md`
3. `architecture-diagrams.md`
4. `component-architecture.md`
5. `reactive-architecture-design.md`
6. 当前任务相关 usage 文档
7. 其余 To-Be 文档

## 口径规则

- 与代码冲突时，优先核对 `src/index.ts`、`src/components/index.ts`、
  `src/store/index.ts`、`src/services/core/*.service.ts`。
- 文档冲突时，以 `final-architecture.md` 为准。
- `Session` 仅允许出现在“禁用说明/迁移对照”或后端协议字段说明语境。
- 术语统一：`Conversation`、`Template`、`QueryProvider`。
- 当前包名统一为 `@feoe/bifrost-chat`，历史文档中的旧包名仅作背景。

### 常见错误示例

**❌ 错误**：
```typescript
interface Session {}
interface ISessionService {}
useSessions()
```

**✅ 正确**：
```typescript
interface Conversation {}
interface IConversationService {}
useConversations()
```

**❌ 错误**：
```markdown
参考 `docs/final-architecture.md`
```

**✅ 正确**：
```markdown
参考 `design/final-architecture.md`
```

## 相关资源

- **技能文档**：`../skills/README.md`
- **项目指导**：`../CLAUDE.md`
- **版本历史**：`../CHANGELOG.md`
- **待办事项**：`../TODO.md`
