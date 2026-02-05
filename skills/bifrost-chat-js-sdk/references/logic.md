# 逻辑层规范（v3）

## 1) 状态边界

- React Query：会话、消息、模板（服务端状态）
- Zustand：输入框、面板、主题、语言、激活会话（客户端状态）

禁止：同一份服务端数据在 React Query 与 Zustand 双写。

## 2) 接口注入

- 通过 `ServiceProvider` 注入服务实现。
- Hooks 只通过 `useServices()` 调用接口。
- SDK 逻辑层不包含请求实现细节。

## 3) 发送消息链路

`useSendMessage` -> `messageService.send` -> 宿主实现 -> 回写缓存。

必须支持：

- optimistic update
- error rollback
- success replace（临时消息替换）

## 4) 模板链路

- 查询：`useTemplates`
- 发送：模板发送 mutation（可扩展）
- 本地交互态：Zustand（面板开关/变量草稿）

## 5) 测试优先级

- hooks 的 query/mutation 行为
- optimistic update 与 rollback
- ServiceProvider 注入失败场景
- Session 命名回归检查
