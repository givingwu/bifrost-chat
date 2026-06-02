# 架构参考（v3.1）

## 1) 当前已实现（As-Is）

- `src/services/core/*`：接口契约（Conversation/Message/Template/Network）
- `src/services/protocol/*`、`src/services/websocket/*`：协议与实时兼容能力
- `src/services/messaging/*`：消息构建、同步、队列与离线失败消息能力
- `src/providers/*`：ConfigProvider + QueryProvider + ServiceProvider + I18nProvider
- `src/hooks/*`：声明式 Query/Mutation
- `src/components/*`：默认组件实现
- `src/store/*`：客户端交互状态

## 2) 目标架构（To-Be）

- 模板发送链路独立 mutation。
- 实时能力标准化；当前协议/WebSocket 能力已有兼容导出，缓存同步服务仍为内部能力。
- 渠道策略矩阵配置化。
- 离线队列类与错误类是否公开导出的边界决策。

## 3) 不属于 SDK 责任

- 协议适配与字段转换范式约束。
- 宿主后端协议选型。
- 宿主 DTO 字段翻译策略。

## 4) 当前差异提示

- 部分能力已在仓库内部实现，但未从包入口公开，例如
  `OfflineMessageQueueService`、`MessageCacheHelper`、`MessageSyncService`
  和错误类。
- 文档描述必须以公开导出边界为准。

## 5) 推进顺序

1. 导出边界治理（文档与 API 对齐）
2. 状态边界治理（避免双写）
3. 模板链路独立化
4. 实时能力标准化
