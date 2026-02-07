# 逻辑层规范（v3.1）

## 1) 状态边界

### As-Is

- React Query：会话、消息、模板列表
- Zustand：输入配置、面板开关、主题、语言、激活会话、策略等

### To-Be

- 模板发送/预览链路独立 query/mutation。

禁止：同一份服务端列表在 React Query 与 Zustand 双写。

## 2) 接口注入

- 通过 `ServiceProvider` 注入服务实现。
- hooks 通过 `useServices()` 调用接口。
- SDK 逻辑层不包含请求实现细节。

## 3) 发送消息链路

As-Is：

- `useSendMessage` -> `messageService.send`
- 已实现 optimistic update / rollback / success 更新

## 4) 模板链路

As-Is：

- 查询：`useTemplates`
- 默认发送：`TemplatePanel` -> `useSendMessage`

To-Be：

- 发送：独立模板 mutation
- 预览：独立模板 query

## 5) 测试优先级

1. hooks 的 query/mutation 行为
2. optimistic update 与 rollback
3. ServiceProvider 注入失败场景
4. 公开命名回归检查（Session 禁用）
