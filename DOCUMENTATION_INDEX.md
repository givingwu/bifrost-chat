# Bifrost-Chat 文档索引

> **状态**：当前实现（As-Is）优先 | **更新日期**：2026-06-02

本文档是仓库文档入口。若文档与代码冲突，以
`src/index.ts`、`src/components/index.ts` 和
`design/final-architecture.md` 为准。

## 必读顺序

1. [README.md](README.md)：安装、快速开始、公开 API 概览。
2. [design/final-architecture.md](design/final-architecture.md)：架构基线
   与当前实现事实。
3. [design/README.md](design/README.md)：设计文档分层与阅读路径。
4. [design/naming-conventions.md](design/naming-conventions.md)：命名红线。
5. [CODESTYLE.md](CODESTYLE.md)：编码与导入规范。

## 当前实现（As-Is）

- [design/architecture-overview.md](design/architecture-overview.md)：整体模块
  与状态边界。
- [design/architecture-diagrams.md](design/architecture-diagrams.md)：当前数据流、
  发送链路与模板链路图。
- [design/component-architecture.md](design/component-architecture.md)：组件职责
  与组合方式。
- [design/reactive-architecture-design.md](design/reactive-architecture-design.md)：
  React Query / Zustand 边界。
- [src/services/protocol/README.md](src/services/protocol/README.md)：协议层
  Packet / ACK / Heartbeat 能力。

## 使用指南

- [design/offline-message-queue-usage.md](design/offline-message-queue-usage.md)：
  离线失败消息队列注入与同步。
- [design/mark-as-read-usage.md](design/mark-as-read-usage.md)：自动已读上报。
- [design/unread-usage.md](design/unread-usage.md)：未读计数与增量缓存。
- [design/conversation-pinning-usage.md](design/conversation-pinning-usage.md)：
  会话激活与临时置顶策略。
- [design/message-type-configuration.md](design/message-type-configuration.md)：
  按渠道配置可渲染消息类型。
- [design/virtual-scroll-implementation.md](design/virtual-scroll-implementation.md)：
  消息列表虚拟滚动实现。

## 目标架构（To-Be）

- [design/sdk-interface-abstraction-design.md](design/sdk-interface-abstraction-design.md)：
  接口抽象与依赖注入演进。
- [design/sdk-final-architecture-design.md](design/sdk-final-architecture-design.md)：
  ADR 汇总。
- [design/ui-flexibility-design.md](design/ui-flexibility-design.md)：Headless、
  Compound、默认布局三种接入方式。
- [design/migration-guide.md](design/migration-guide.md)：架构迁移验收清单。
- [design/offline-message-queue-design.md](design/offline-message-queue-design.md)：
  离线队列完整设计与未落地 UI 能力。
- [design/failed-message-recovery-design.md](design/failed-message-recovery-design.md)：
  失败消息恢复机制设计。

## 历史与研究资料

以下文档保留设计背景或历史方案，不作为当前公开 API 的唯一依据：

- [design/virtual-scroll-research.md](design/virtual-scroll-research.md)
- [design/generic-architecture-design.md](design/generic-architecture-design.md)
- [design/protocol-integration-architecture.md](design/protocol-integration-architecture.md)
- [design/protocol-sequence-diagram.md](design/protocol-sequence-diagram.md)
- [design/integration-demo.md](design/integration-demo.md)
- [design/conversation-dataflow-review.md](design/conversation-dataflow-review.md)

## 项目协作文档

- [CLAUDE.md](CLAUDE.md)：仓库级开发助手指导。
- [AGENTS.md](AGENTS.md)：通用代理协作规范。
- [skills/README.md](skills/README.md)：仓库内 skills 索引。
- [TODO.md](TODO.md)：待办项。
- [CHANGELOG.md](CHANGELOG.md)：版本变更记录。

## 维护规则

- 公开 API 清单只引用包入口真实导出。
- 每份设计与规范文档必须区分 As-Is 和 To-Be。
- `Session` 仅允许出现在禁用说明、迁移对照或后端协议字段说明中。
- 历史文档若包含旧包名、旧路径或旧示例，不得优先于当前入口文档。
