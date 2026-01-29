# 架构总览

- 目标：SDK 可维护、性能稳定、可访问性友好。
- 主要分层：
  - 渲染层：React 组件 + Tailwind。
  - 交互状态层：Zustand Store + ClientBus。
  - 调度与缓存层：DataLayer (Repository/Service)。
  - 适配与翻译层：ChannelAdapter + DataMapper (Zod 校验)。
  - 基础设施层：NetLayer (Socket/SSE/Polling)。

## 变更原则

- 公共 API 必须有明确类型定义，避免 any。
- 新渠道/新消息类型优先走 Adapter/Mapper + 工厂模式扩展。
- 任何数据格式变化只在 Mapper 层消化，避免污染 Store/UI。
