# 架构参考（v3 基线）

## 1) 当前实现（代码现状）

- `src/services/*`：接口契约（Conversation/Message/Template）
- `src/providers/*`：ServiceProvider + QueryProvider + I18nProvider
- `src/hooks/*`：声明式 Query/Mutation
- `src/components/*`：默认组件实现
- `src/store/*`：客户端状态 + 遗留服务端状态（迁移中）

## 2) 目标架构（统一口径）

- SDK：纯接口 + DI + 默认组件
- 服务端状态：React Query
- 客户端状态：Zustand
- 公开 API：Conversation 命名（禁用 Session）
- Template：独立于 Profile

## 3) 不属于 SDK 责任

- 协议适配与字段转换设计范式
- 宿主后端协议选型
- 宿主 DTO 字段翻译策略

> 以上由调用方实现，SDK 只消费标准接口返回。

## 4) Gap（现状与目标）

1. Store 仍承载部分会话/消息数据。
2. 部分文档与示例仍有 Session 遗留。
3. 模板能力的 hooks 与组件联动需进一步完善。

## 5) 推进顺序

1. 命名治理（Session -> Conversation）
2. 收敛状态边界（服务端数据迁到 React Query）
3. 补齐模板链路（query/mutation + UI）
4. 清理遗留文档口径
