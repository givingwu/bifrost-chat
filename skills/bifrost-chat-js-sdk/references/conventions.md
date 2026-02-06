# 代码规范（v3）

## 术语

- 会话统一 `Conversation`，公开命名禁止 `Session`。
- 模板统一“模板（Template）”，避免“模版”混写。

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
- SDK 文档中不引入协议适配作为强制实现。

## 文档与示例

- 示例代码优先 `@/*` alias。
- 文档示例必须与仓库真实导出一致。
