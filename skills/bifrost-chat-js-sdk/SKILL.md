---
name: bifrost-chat-js-sdk
description: 针对 Bifrost-Chat JS SDK 的功能开发、维护与代码审查。适用于 TypeScript/React 组件、React Query 状态、接口抽象、依赖注入、渠道策略、消息渲染工厂、Adapter 架构、Tailwind 样式、Storybook 与 Vitest 相关任务。
---

# Bifrost-Chat JS SDK Skill

目标：用最少步骤完成 SDK 维护与扩展，优先保证可维护性、性能与可访问性。

## 核心架构规则 (v2.0.0)

### 1. 会话概念统一

**决策**: 统一使用 **Conversation**，严格禁止使用 **Session**

**理由**:
- ✅ 更符合即时通讯的业务语义
- ✅ 更直观和易于理解
- ✅ 与业界标准一致 (WhatsApp, Telegram, iMessage 都使用 Conversation)
- ✅ 更好的可读性

**命名规范**:
```typescript
// ✅ 正确 - 必须使用 Conversation
interface Conversation { }
interface IConversationService { }
useConversations()
export const ConversationList = () => { }

// ❌ 错误 - 严格禁止使用 Session
interface Session { }
interface ISessionService { }
useSessions()
export const SessionList = () => { }
```

### 2. Template 从 Profile 剥离

**职责划分**:

| 模块 | 职责 | 目录 |
|------|------|------|
| **Profile** | 展示客户/联系人信息 (姓名、头像、标签等) | `src/components/profile/` |
| **Template** | 管理和选择消息模版 (模版列表、预览、发送) | `src/components/templates/` |

### 3. 使用泛型解耦参数类型

**问题**: 不同业务方的 API 参数不同

**解决方案**: 使用泛型,调用方自定义参数类型

```typescript
// ✅ 使用泛型
interface IConversationService<
  TListParams = any,
  TCreateParams = any,
  TQueryParams = any,
> {
  list(params?: TListParams): Promise<Conversation[]>;
  create(params: TCreateParams): Promise<Conversation>;
  query(params: TQueryParams): Promise<Conversation | null>;
}
```

### 4. 接口抽象与依赖注入

**核心设计**: SDK 提供接口,调用方提供实现

```typescript
// SDK 定义接口
export interface IConversationService<...> {
  list(params?: TListParams): Promise<Conversation[]>;
}

// 调用方实现接口
class MyConversationService implements IConversationService<...> {
  async list(params) {
    // 自定义实现
  }
}
```

### 5. React Query + 声明式编程

**状态分类**:

| 状态类型 | 管理方案 | 示例 |
|---------|---------|------|
| **服务端状态** | React Query | 会话列表、消息列表、模版列表 |
| **客户端状态** | Zustand | 输入框内容、面板状态、主题、语言 |

**优势**:
- 代码量减少 80%
- 自动缓存和重新获取
- 内置乐观更新
- 更好的开发者体验

## 快速流程

1. 先判断任务落点：渲染层 / 逻辑层 / 构建测试 / 主题样式。
2. 按需读取参考文档：
   - 最终架构：`../../docs/final-architecture.md`
   - 渲染层：`references/rendering.md`
   - 逻辑层：`references/logic.md`
   - 架构快照与演进：`references/architecture.md`
   - 工具链与命令：`references/toolchain.md`
   - 命名与代码规范：`references/conventions.md`
   - 主题与视觉方案：`references/themes.md`
3. 设计变更：优先复用既有 API 与模块，避免破坏公开类型。
4. 编码：优先 TypeScript 强类型；路径优先使用 `@/*` alias。
5. 校验：至少执行受影响范围的测试/构建，并补充 Storybook（如涉及组件）。

## 当前实现快照（以仓库代码为准）

- **架构设计**: 采用接口抽象 + 依赖注入模式,支持不同业务方的 API 实现
- **状态管理**: 服务端状态使用 React Query,客户端状态使用 Zustand
- **会话概念**: 统一使用 Conversation,禁止使用 Session
- **Template**: 从 Profile 中剥离,独立管理
- **泛型支持**: 服务接口使用泛型,支持不同业务方的 API 参数
- Store 使用 Zustand Slice 组合（`ui/strategy/network/theme/language/conversation/profile`）。
- `AdapterFactory` 已落地，默认内置 `WabaAdapter`；其他渠道接口已预留。
- 消息渲染通过 `MessageRendererFactory` + `MessageBubble` 落地。
- `ComposerToolbar` 已按渠道差异控制附件类型和长度限制。
- 主题模式为 `system/light/dark`，通过 token 驱动。
- `DataLayer/NetLayer/OfflineQueue` 当前以架构约束和接口目标为主，尚未完整实现。

## 关键约束

- **会话概念**: 必须使用 Conversation, 禁止使用 Session
- **组件改动**: 必须同步更新对应 story
- **渠道渲染逻辑**: 必须策略驱动，禁止写死分支到业务数据
- **新渠道/新消息类型**: 必须走 Adapter + Mapper + Factory 扩展
- **后端字段变化**: 不把后端字段变化泄漏到 Store/UI，格式变化仅在 Mapper 层消化
- **文档描述**: 要区分"当前已实现"与"目标架构"
- **接口抽象**: SDK 提供接口,调用方提供实现
- **泛型使用**: 服务接口使用泛型,支持不同业务方的 API 参数

## 变更前检查清单

- 是否影响公开 API、枚举或 DTO 类型？
- 是否需要扩展 `ChannelButtonFactory` / `MessageRendererFactory`？
- 是否需要同步更新 Storybook、测试、README/skills 文档？
- 是否引入与现状不一致的“未来态描述”？
