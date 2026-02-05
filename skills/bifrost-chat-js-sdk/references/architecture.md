# 架构参考（接口抽象 + 声明式）

本文档基于以下设计文档更新逻辑层叙述：

- `../../../docs/sdk-interface-abstraction-design.md`
- `../../../docs/reactive-architecture-design.md`

并继续区分两类信息：

- 当前实现（仓库里已经存在）
- 目标架构（设计已确定，逐步落地）

## 1) 当前实现（代码现状）

### 1.1 主要目录

- `src/components/*`：渲染层组件（Conversation、Message、Composer 等）
- `src/store/*`：Zustand Store 与 Slice（UI + 部分服务端数据）
- `src/adapters/*`：渠道适配器与映射（`AdapterFactory`、`WabaAdapter`）
- `src/interfaces/*`：公开类型与 SDK 契约
- `src/providers/*`：当前主要为 I18n Provider

### 1.2 已落地链路

1. UI 通过 Store selectors 读取状态（`useStrategy/useConversation/useActions`）。
2. `conversation.slice.ts` 使用 `MessageBuilder` 构造标准消息并写入 Store。
3. 渠道扩展已具备 `AdapterFactory` 注册机制，默认内置 `WabaAdapter`。
4. 消息展示由 `ChatMessageList` + `MessageRendererFactory` 承担。

### 1.3 当前边界

- React Query 与 `ServiceProvider` 依赖注入链路尚未在代码中完整落地。
- `INetwork`/协议热切/离线重放仍属于目标能力，未形成可执行闭环。

## 2) 目标架构（新逻辑）

### 2.1 逻辑分层

1. **Service Interfaces**：SDK 定义 `IConversationService` /
   `IMessageService` / `ITemplateService` 等接口（建议泛型参数解耦）。
2. **Dependency Injection**：宿主实现服务并通过 `ServiceProvider` 注入。
3. **React Query Hooks**：`useConversations/useMessages/useTemplates` +
   mutation hooks 统一管理服务端状态。
4. **Zustand**：仅保留客户端状态（输入、面板、主题、语言、选中会话）。
5. **Adapter + Mapper**：协议与字段防腐层，做 DTO ↔ 标准实体转换与 Zod 校验。

### 2.2 数据流（目标）

UI 组件 → Hook（React Query）→ Service 接口 → 宿主实现（HTTP/Socket）→
后端 API → 标准实体回流到 React Query Cache → UI 声明式刷新。

关键约束：

- UI 不直接依赖请求库或后端协议。
- 后端字段变化只允许在 Adapter/Mapper 层处理。
- 服务端状态只在 React Query，Zustand 不做同源数据二次存储。

## 3) 现状与目标差异（Gap）

1. **状态管理差异**：当前仍由 Zustand 持有会话/消息数据，目标改为 React Query。
2. **接口注入差异**：当前缺少完整 Service 接口 + Provider 注入链路。
3. **网络调度差异**：当前发送链路偏本地状态写入，目标为服务 mutation + 回执驱动。
4. **离线与实时差异**：目标要求“实时回灌缓存 + 离线重试”，当前未全量实现。
5. **命名遗留**：仍存在 `session` 遗留命名（如 `src/interfaces/sdk.interface.ts`），
   按 v2 规则需迁移为 `conversation` 语义。

## 4) 演进优先级（建议）

1. 先新增服务接口与 `ServiceProvider`（不破坏现有 UI API）。
2. 引入 React Query，并先迁移会话与消息查询。
3. 将发送/已读等写操作迁移为 mutation（补齐乐观更新与回滚）。
4. 收敛 Zustand 到纯客户端状态。
5. 最后接入实时订阅与离线队列重试。

## 5) 扩展操作手册

### 新增渠道

1. 在 `src/interfaces/channel.interface.ts` 扩展 `ChannelTypeEnum`。
2. 新增适配器（建议 `src/adapters/<channel>/`）。
3. 实现 `IChannelAdapter` 并补齐 mapper 与 schema 校验。
4. 在 `AdapterFactory` 注册并补 `*.test.ts`。
5. 更新 `ChannelButtonFactory` / `ComposerToolbar` 的渠道能力映射。

### 新增消息类型

1. 扩展 `MessageTypeEnum` 与消息内容类型。
2. 在 `MessageRendererFactory` 增加映射。
3. 新增 `src/components/messages/*` 组件与 story。
4. 在 mapper 层补齐 DTO 转换与 Zod 校验。

## 6) 相关文档

- `../../../docs/sdk-interface-abstraction-design.md`
- `../../../docs/reactive-architecture-design.md`
- `../../../docs/architecture-overview.md`
- `../../../docs/component-architecture.md`
- `../../../docs/naming-conventions.md`
