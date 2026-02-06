# SDK 架构决策记录（ADR，v3）

> 本文档记录 v3 关键决策，详细实现以 `final-architecture.md` 为准。

## ADR-001：公开 API 禁用 Session

- 决策：全部公开接口统一 `Conversation` 术语。
- 影响：类型、Hook、事件、QueryKey、字段均禁止 `Session`。

## ADR-002：SDK 形态固定

- 决策：SDK = 纯接口 + DI + 默认组件实现。
- 影响：SDK 不绑定后端 API，不提供业务协议层实现。

## ADR-003：协议适配与字段转换不纳入 SDK 架构责任

- 决策：协议适配、DTO 转换由调用方负责。
- 影响：SDK 文档不再规定协议适配分层或目录。

## ADR-004：状态边界固定

- 决策：React Query 管服务端状态；Zustand 管客户端状态。
- 影响：模板数据归 React Query，模板交互状态归 Zustand。

## ADR-005：Template 与 Profile 解耦

- 决策：模板类型、服务、组件独立于 Profile。
- 影响：禁止 `ITemplateService` 依赖 Profile 类型。

## ADR-006：QueryKey 标准化

- 决策：只允许 `conversations/messages/templates` 前缀。
- 影响：迁移遗留 `sessions` 键，统一失效策略。

## ADR-007：错误模型

- 决策：统一使用 `SDKError` 体系（含 HTTP/Validation/Authorization）。
- 影响：文档示例禁止使用不存在的错误类型命名。
