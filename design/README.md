# Bifrost-Chat JS SDK 文档导航（v3.1）

本目录采用双轨口径：**当前已实现（As-Is）** 与
**目标架构（To-Be）** 并行描述，避免混写。

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

用途：

- 说明仓库当前代码行为和数据流。
- 作为排查问题、评审改动的直接依据。

### 3) 目标架构（To-Be）

- `sdk-interface-abstraction-design.md`
- `sdk-final-architecture-design.md`
- `ui-flexibility-design.md`
- `migration-guide.md`
- `naming-conventions.md`

用途：

- 定义未来演进方向和迁移步骤。
- 与当前实现冲突时，必须在文档中显式标注“未落地”。

### 4) 历史记录（非 SSOT）

- `virtual-scroll-implementation.md`
- `virtual-scroll-research.md`

用途：

- 保留历史设计与实施背景。
- 不作为当前实现的唯一依据。

## 推荐阅读顺序

1. `final-architecture.md`
2. `architecture-overview.md`
3. `architecture-diagrams.md`
4. `component-architecture.md`
5. `reactive-architecture-design.md`
6. 其余 To-Be 文档

## 口径规则

- 与代码冲突时，优先核对 `src/index.ts`、`src/components/index.ts`、
  `src/store/index.ts`、`src/services/*.service.ts`。
- 文档冲突时，以 `final-architecture.md` 为准。
- `Session` 仅允许出现在“禁用说明/迁移对照”语境。
- 术语统一：`Conversation`、`Template`、`QueryProvider`。

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
