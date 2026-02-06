# Bifrost-Chat JS SDK 文档导航（v3 基线）

本目录文档统一遵循以下基线：

- 公开 API 彻底禁用 `Session`，统一使用 `Conversation`
- SDK 形态：`纯接口 + DI + 默认组件实现`
- SDK 不关心协议适配与字段转换细节（由调用方在宿主侧处理）
- 服务端状态统一归 React Query（包含模板数据）
- 客户端状态统一归 Zustand（仅 UI 本地状态）

## 推荐阅读顺序

1. `final-architecture.md`（单一事实源，先读）
2. `sdk-interface-abstraction-design.md`（接口与 DI）
3. `reactive-architecture-design.md`（React Query + Zustand 边界）
4. `component-architecture.md`（组件职责与数据流）
5. `migration-guide.md`（迁移落地步骤）
6. `naming-conventions.md`（命名红线）

## 文档说明

- `final-architecture.md`：v3 架构基线与实现约束。
- `sdk-interface-abstraction-design.md`：服务接口、Provider 注入、宿主实现。
- `reactive-architecture-design.md`：声明式状态管理与 Hooks 规范。
- `architecture-overview.md`：高层架构总览。
- `architecture-diagrams.md`：架构图与关键流程图。
- `component-architecture.md`：默认组件与可扩展边界。
- `ui-flexibility-design.md`：Headless/Compound/All-in-One 设计。
- `migration-guide.md`：从旧架构迁移到 v3 的步骤。
- `naming-conventions.md`：术语、命名、QueryKey 规则。
- `sdk-final-architecture-design.md`：v3 决策记录（ADR 风格）。

## 执行原则

- 文档中的路径、类型名、Hook 名必须与仓库实现一致。
- 设计描述必须区分“当前已实现”和“目标落地”。
- 若与本基线冲突，以 `final-architecture.md` 为准。
