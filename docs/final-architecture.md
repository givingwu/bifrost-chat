# Bifrost-Chat Final Architecture (v3.1)

> 最后更新：2026-02-28  
> 适用范围：`@feoe/bifrost-chat` JS SDK（公开 API、组件层、逻辑层、文档口径）

## 文档定位

- 本文档是架构单一事实源（SSOT）。
- 当 `README`、`docs`、`specs`、`skills` 与本文档冲突时，以本文档为准。
- 所有规范与设计文档必须明确区分：
  - 当前已实现（As-Is）
  - 目标架构（To-Be）

## 1. 会话概念统一

### As-Is

- 公开领域模型统一使用 `Conversation`：
  - `src/interfaces/conversation.interface.ts`
  - `src/services/conversation.service.ts`（`IConversationService`）
  - `src/hooks/use-conversations.hook.ts`
  - `src/hooks/use-create-conversation.hook.ts`
  - `src/providers/query.provider.ts`（`queryKeys.conversations.*`）

### To-Be

- 历史文档中的 `Session` 仅保留“禁用说明”，不再提供可执行示例。
- 所有新增公开 API、示例与文档统一使用 `Conversation` / `conversationId`。

## 2. Template 与 Profile 职责边界

### As-Is

- `Profile`：客户/联系人信息展示，目录 `src/components/profile/`
- `Template`：模板选择与模板面板，目录 `src/components/template/`
- 默认布局 `src/components/layout/DefaultChatLayout.tsx` 中两者并列组合。

### To-Be

- 模板发送与预览继续演进为独立 query/mutation 能力。
- 不改变 Template/Profile 的职责边界。

## 3. 泛型解耦参数类型

### As-Is

- `IConversationService<TListParams, TCreateParams, TQueryParams>`
- `IMessageService<TListParams, TSendParams, TReadParams, ...>`
- `ITemplateService<TListParams, TSendParams>`

### To-Be

- 补齐高频接入场景范型模板（HTTP/WebSocket/SSE）。

## 4. 接口抽象与依赖注入

### As-Is

- 通过 `ServiceProvider` + `useServices` 注入业务实现。
- SDK 不直接实现业务后端请求。
- `createNotImplementedServices` 提供兜底占位实现。

### To-Be

- 增强 DI 诊断分级（注入缺失、方法未实现、能力降级提示）。

## 5. React Query 与 Zustand 状态边界

### As-Is

- React Query：会话/消息/模板等服务端数据。
- Zustand：输入配置、主题、语言、策略、激活会话等客户端交互态。
- 关键入口：
  - `src/providers/query.provider.tsx`
  - `src/store/index.ts`
  - `src/store/slices/*.slice.ts`

### To-Be

- 模板发送链路标准化，减少布局层粘合逻辑。

## 6. 类型安全

### As-Is

- TypeScript `strict` 模式。
- 核心公共接口有类型定义。
- 协议层关键边界已有校验与转换能力（`src/services/protocol/*`）。

### To-Be

- DTO 映射层（如引入）补齐统一 Zod 校验策略。

## 7. 错误处理

### As-Is

- 错误体系在 `src/interfaces/error.interface.ts`：
  - `SDKError`
  - `HTTPError`
  - `ValidationError`
  - `AuthorizationError`
  - `ConfigurationError`
  - `NotImplementedError`
  - `MapperError`

### To-Be

- 统一错误码映射表与接入示例。

## 8. 性能优化

### As-Is

- 虚拟滚动：`@tanstack/react-virtual`
- 消息分页：React Query infinite query
- 缓存：React Query query cache

### To-Be

- 可保留备选方案研究（如 `react-virtuoso`），但不作为默认实现。

## 9. 国际化

### As-Is

- 当前内置中英文：
  - `src/locales/zh-CN.json`
  - `src/locales/en-US.json`

### To-Be

- 扩展语言包按需加载与动态注册策略。

## 10. 可访问性

### As-Is

- 组件具备基础 ARIA 与键盘交互能力（以组件源码与测试为准）。

### To-Be

- 建立跨组件无障碍验收矩阵与回归清单。

## 11. 安全性

### As-Is

- SDK 公开文档不暴露宿主侧安全实现细节。

### To-Be

- 接入指南补齐 XSS / CSRF / 敏感信息脱敏建议。

## 公开 API 边界（As-Is）

- 公开导出以 `src/index.ts` 与 `src/components/index.ts` 为准。
- 公开 hooks（包入口）：`useConversations`、`useCreateConversation`、
  `useMessages`、`useSendMessage`、`useMarkAsRead`、`useTemplates` 等。
- 未从包入口导出的内部能力，不可在文档中写成已公开能力。

## 术语兼容策略（协议层 vs SDK 层）

### As-Is

- 协议文档历史字段仍存在 `chatId` / `session*` 命名（`specs/*`）。
- SDK 公开模型统一为 `Conversation` / `conversationId`。

### To-Be

- 新增文档示例默认使用 `Conversation` 术语。
- 协议历史术语仅保留“兼容映射说明”，不再作为 SDK 公开命名。

## 文档治理要求

- 任何架构、规范、skill、spec 变更必须同步更新本文档或显式引用本文档。
- 文档中的 “As-Is” 必须可追溯到源码或测试。
- 文档中的 “To-Be” 必须标注尚未落地，不得伪装为现状。
