# AGENTS.md

你是本项目的开发助手，专注于 **Bifrost-Chat JS SDK** 的库开发与维护，面向可维护性、性能与可访问性交付。

- 用中文回复，去谄媚
- 尽情结合使用各种 MCP 能力
- 尽量使用 `tsconfig.json` 中配置的路径别名 alias

## 文档口径（强约束）

- 所有设计与规范文档必须区分：
  - **当前已实现（As-Is）**
  - **目标架构（To-Be）**
- 未落地能力必须保留，但必须标注为 To-Be，不得伪装为已实现。
- 架构冲突时，以 `docs/final-architecture.md` 为准。

## 核心架构规则（v3.1）

### 1. 会话概念统一

**决策**：统一使用 **Conversation**，严格禁止公开 API 使用 **Session**。

**当前已实现（As-Is）**：

- `src/interfaces/conversation.interface.ts`
- `IConversationService`
- `useConversations` / `useCreateConversation`
- `queryKeys.conversations.*`

**目标架构（To-Be）**：

- 历史文档与示例中仅保留“Session 禁用说明”，不保留可执行示例。

**命名规范**：

```typescript
// ✅ 正确
interface Conversation {}
interface IConversationService {}
useConversations()

// ❌ 错误
interface Session {}
interface ISessionService {}
useSessions()
```

### 2. Template 从 Profile 剥离

**当前已实现（As-Is）**：

| 模块 | 职责 | 目录 |
|---|---|---|
| Profile | 展示客户/联系人信息 | `src/components/profile/` |
| Template | 管理和选择消息模板 | `src/components/template/` |

**目标架构（To-Be）**：

- 模板发送与预览可演进为独立 mutation/query 能力。
- 不改变 Template 与 Profile 组件职责边界。

### 3. 泛型解耦参数类型

**当前已实现（As-Is）**：

- `IConversationService` / `IMessageService` / `ITemplateService`
  已支持泛型参数。

**目标架构（To-Be）**：

- 为高频接入场景补充标准范型模板（HTTP/WebSocket/SSE）。

### 4. 接口抽象与依赖注入

**当前已实现（As-Is）**：

- `ServiceProvider` + `useServices` 生效。
- SDK 不直连后端 API。

**目标架构（To-Be）**：

- 增强服务实现诊断能力（注入失败与未实现方法提示分级）。

### 5. React Query + Zustand 状态边界

**当前已实现（As-Is）**：

| 状态类型 | 管理方案 | 示例 |
|---|---|---|
| 服务端状态 | React Query | 会话列表、消息列表、模板列表 |
| 客户端状态 | Zustand | 输入配置、面板开关、主题、语言、策略、激活会话 |

**目标架构（To-Be）**：

- 模板发送链路进一步标准化，减少布局组件内粘合代码。

### 6. 类型安全

**当前已实现（As-Is）**：

- TypeScript strict 模式。
- 公共接口有类型定义。
- 关键边界已有 Zod 依赖能力。

**目标架构（To-Be）**：

- DTO 映射层（如引入）统一补充 Zod 校验策略。

### 7. 错误处理

**当前已实现（As-Is）**：

```typescript
export class SDKError extends Error {}
export class HTTPError extends SDKError {}
export class ValidationError extends SDKError {}
export class AuthorizationError extends SDKError {}
export class ConfigurationError extends SDKError {}
export class NotImplementedError extends SDKError {}
export class MapperError extends SDKError {}
```

**目标架构（To-Be）**：

- 统一错误码映射表与文档示例。

### 8. 性能优化

**当前已实现（As-Is）**：

- 虚拟滚动：`@tanstack/react-virtual`
- 分页：`@tanstack/react-query` infinite query
- 缓存：React Query

**目标架构（To-Be）**：

- 备选方案研究可保留（如 `react-virtuoso`），但不作为当前默认实现。

### 9. 国际化

- 当前支持中英文。
- 目标支持扩展语言包按需加载。

### 10. 可访问性

- 当前组件包含基础 ARIA 与键盘交互。
- 目标补齐跨组件无障碍验收矩阵。

### 11. 安全性

- 当前对外文档不暴露宿主安全实现细节。
- 目标补齐接入指南中的 XSS/CSRF/脱敏建议。

## 技术栈

- TypeScript
- React
- Tailwind CSS
- Rslib
- Vitest
- Biome
- Storybook

## 职责范围

- 维护 SDK 核心能力与公开 API
- 保持 UI 与逻辑层稳定
- 保障构建与测试流程稳定
- 遵循工程约定与架构边界

## 渲染层规范

### Channel Toolbar（渠道工具栏）

**当前已实现（As-Is）**：

- 渠道集合来源于 `strategy.allowedChannels`。
- 渠道切换由 `actions.setActiveChannel` 驱动。
- 组件：`ChannelFilter`、`ChannelButtonFactory`、`TopbarTools`。

**目标架构（To-Be）**：

- 完整渠道互斥策略矩阵（如 in_call、语音互斥）持续保留并推进。

### MessageList（消息流）

**当前已实现（As-Is）**：

- `MessageRendererFactory` 基于 `MessageTypeEnum` 分发。
- `MessageList` + `InfiniteMessageList` 支持虚拟滚动与分页。

**目标架构（To-Be）**：

- 渠道特有状态语义（如双蓝勾）可进一步抽象为策略层。

### Composer（输入区）

**当前已实现（As-Is）**：

- `ComposerToolbar` / `ComposerWithSend` / `ComposerInput`
- 通过 `composer` slice 控制附件、音频等输入能力。

**目标架构（To-Be）**：

- 渠道差异策略完善（SMS/WhatsApp/Email/VoIP）并形成统一配置协议。

### Context Panel（右侧上下文）

**当前已实现（As-Is）**：

- `Profile` + `TemplatePanel` 组合。
- `TemplatePanel` 选择模板后触发发送链路。

**目标架构（To-Be）**：

- 模板点击行为支持两种模式：直接发送 / 回填 Composer。

## 逻辑层规范

### Service Interfaces + DI

- SDK 仅定义 `IConversationService` / `IMessageService` /
  `ITemplateService`。
- 调用方在宿主侧实现后通过 `ServiceProvider` 注入。

### Hooks + React Query

- 查询：`useConversations` / `useMessages` / `useTemplates`
- Mutation：`useSendMessage` / `useCreateConversation` /
  `useMarkAsRead`

### Zustand（客户端状态）

- 管理本地交互态，不存服务端列表实体。

### 错误与可观测性

- 统一使用当前错误类型体系。
- Hook 层处理重试与边界，组件按状态渲染。

## 常用命令

- `pnpm install`
- `pnpm run build`
- `pnpm run dev`
- `pnpm run test`
- `pnpm run check`
- `pnpm run format`
- `pnpm run storybook`

## 测试 / 构建 / Storybook

- 测试：Vitest
- 构建：Rslib
- 视觉示例：Storybook
- 变更策略：代码、文档、stories 同步

## 代码规范

- TypeScript 类型优先，避免 `any`
- 组件和样式结构清晰
- 复用优先，避免重复逻辑
- 与既有命名与目录保持一致

## 代码风格与命名约定

- 严格遵循 `docs/naming-conventions.md`
- Biome 统一格式：
  - 空格缩进
  - 80 字符换行
  - TS/JS 单引号
  - JSX 双引号
- 默认使用 `@/*` alias（仓库内部）

## 测试指引

- 测试命名：`*.test.ts` / `*.test.tsx`
- 重点覆盖：Store、Hooks、关键渲染交互
- 新增功能需补测试或说明缺口

## 提交与合并请求规范

- 提交前缀：`feat:` / `fix:` / `chore:` / `hotfix:` / `style:` / `refactor:` 等参照 commitlint 规范
- PR 需说明业务影响、验证步骤、UI 截图/录屏（如有）
- 提交前确保 `check/test/build` 通过

## MCP 能力与代理协作

- 复杂任务先拆分步骤并验证。
- 上下文不足时先查仓库资源，再提问。
- 敏感操作需显式权限理由。

## Skills 协作约定

- 先读 `skills/README.md`
- SDK 任务优先使用 `skills/bifrost-chat-js-sdk/SKILL.md`
- 视觉任务优先使用 `skills/bifrost-chat-ui-design/SKILL.md`
- Skill 文档必须区分 As-Is 与 To-Be，并与代码同步。

## 参考文档

- [Rslib](https://rslib.rs/llms.txt)
- [Rsbuild](https://rsbuild.rs/llms.txt)
- [Rspack](https://rspack.rs/llms.txt)
