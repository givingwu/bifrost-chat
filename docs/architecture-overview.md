# 架构总览（v3.1）

## 1. 目标

- 提供可嵌入的默认聊天组件。
- 通过接口注入适配不同宿主后端。
- 通过声明式状态管理降低维护成本。

## 2. 当前已实现（As-Is）

```mermaid
graph LR
    Host[Host App] --> SP[ServiceProvider]
    SP --> Hooks[React Query Hooks]
    Hooks --> UI[Default Components]
    Hooks --> Cache[React Query Cache]
    Config[ConfigProvider] --> Store[Zustand Store]
    Store --> UI
```

模块职责：

- `src/services/*`：接口契约层。
- `src/providers/service.provider.tsx`：依赖注入容器。
- `src/providers/query.provider.tsx`：QueryClient 与 QueryKey。
- `src/providers/config.provider.tsx`：Store 初始化入口。
- `src/hooks/*`：声明式查询与 mutation。
- `src/components/*`：默认 UI 组件。
- `src/store/*`：客户端状态管理。

## 3. 目标架构（To-Be）

- 模板发送/预览链路进一步独立化。
- 实时消息回灌标准化并评估公开 API 方案。
- 渠道能力矩阵配置化（输入区策略完整化）。

## 4. 边界声明

- SDK 不约束调用方协议适配实现。
- SDK 不要求调用方固定 DataLayer 分层。
- SDK 只对“组件行为 + 接口契约 + 状态边界”负责。

## 5. 术语红线

- 公开 API 使用 `Conversation`，禁止 `Session`。
- Provider 命名统一 `QueryProvider`。
- 模板统一 `Template`，不与 Profile 耦合。
