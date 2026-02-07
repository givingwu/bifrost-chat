# SDK 架构决策记录（ADR，v3.1）

> 详细实现以 `final-architecture.md` 为准。

## ADR-001：公开 API 禁用 Session

- 决策：公开接口统一 `Conversation`。
- 当前达成度：**已达成**。
- 备注：`Session` 仅允许出现在禁用说明或迁移对照。

## ADR-002：SDK 形态固定

- 决策：SDK = 接口契约 + DI + 默认组件。
- 当前达成度：**已达成**。
- 备注：宿主实现具体服务逻辑。

## ADR-003：协议适配与字段转换不纳入 SDK 强约束

- 决策：由调用方负责协议适配和 DTO 转换。
- 当前达成度：**已达成**。
- 备注：SDK 只消费标准接口结果。

## ADR-004：状态边界固定

- 决策：React Query 管服务端状态，Zustand 管客户端状态。
- 当前达成度：**已达成（持续约束）**。
- 备注：模板列表已在 React Query，UI 交互态在 Zustand。

## ADR-005：Template 与 Profile 解耦

- 决策：模板类型、服务、组件独立于 Profile。
- 当前达成度：**已达成**。
- 备注：目录分离为 `components/template` 与 `components/profile`。

## ADR-006：QueryKey 标准化

- 决策：仅使用 `conversations/messages/templates` 前缀。
- 当前达成度：**已达成**。
- 备注：公开文档禁止 `sessions` 键。

## ADR-007：错误模型统一

- 决策：使用 `SDKError` 体系。
- 当前达成度：**已达成**。
- 当前类型：
  `SDKError`、`HTTPError`、`ValidationError`、`AuthorizationError`、
  `ConfigurationError`、`NotImplementedError`、`MapperError`。

## ADR-008：模板发送链路演进

- 决策：当前默认链路可用，未来可独立 template mutation。
- 当前达成度：**部分达成**。
- 当前实现：`TemplatePanel` -> `useSendMessage`。
- To-Be：`useSendTemplateMessage` / `useTemplatePreview`。
