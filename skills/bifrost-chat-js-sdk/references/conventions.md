# 代码规范（v3.1）

> **状态**：当前实现（As-Is） | **更新日期**：2026-03-09

## 术语

- 会话统一 `Conversation`，公开命名禁止 `Session`。
- 模板统一“模板（Template）”，禁止同音错别字混写。

## TypeScript

- 类型优先，避免 `any`。
- 公共 API 必须有明确类型。
- 服务接口优先使用泛型参数。

## React

- 函数组件 + PascalCase 文件名。
- JSX 使用双引号。

## 命名

- 组件：PascalCase
- Props：`*Props`
- 枚举：`*Enum`
- 配置：`*Config`
- QueryKey：`conversations/messages/templates`

## 结构约束

- 服务端状态只在 React Query。
- Zustand 仅管理客户端交互状态。
- 文档对外 API 清单必须对齐公开导出。

## 文档与示例

- 仓库内部示例优先 `@/*` alias。
- 每份规范文档必须明确 As-Is / To-Be。
