# 逻辑层规范（当前实现 + 目标架构）

## 1) 状态职责划分

当前实现：

- Store：Zustand，多 Slice 组合（`ui/strategy/network/theme/language/conversation/profile`）。
- hooks：`useStrategy/useConversation/useActions` 等用于 UI 订阅。
- ClientBus：事件总线能力已存在（订阅/取消/派发）。

目标架构：

- 服务端状态：React Query（会话、消息、模板）。
- 客户端状态：Zustand（输入框、面板开关、主题、语言、激活会话）。

约束：

- UI 只消费标准实体，不直接读写协议原始字段。
- 同一份服务端数据只保留一个状态源，避免 React Query 与 Store 双写。

## 2) 服务接口与依赖注入

目标采用接口抽象 + 依赖注入：

- SDK 定义 `IConversationService` / `IMessageService` / `ITemplateService`。
- 接口参数建议使用泛型，解耦业务方请求参数。
- 宿主应用实现接口，通过 `ServiceProvider` 注入服务实例。
- Hook 只依赖接口，不依赖具体请求库。

## 3) 消息发送路径

当前主路径：

1. `conversation.slice.ts` 的 `sendMessage` 构造标准消息。
2. `MessageBuilder` 统一填充默认字段。
3. `appendMessage` 入列消息流。

目标主路径：

`useSendMessage` mutation -> `IMessageService.send` -> 宿主实现
(HTTP/Socket) -> ACK/状态回执 -> React Query Cache 更新或失效重取。

## 4) Adapter 与 Mapper

当前实现：

- `AdapterFactory` 已实现注册、创建、校验与重置能力。
- 默认内置 `WabaAdapter`。
- `WabaMapper` + schema 已可用于 DTO 映射/校验。

目标约束：

- Adapter 负责协议差异与渠道能力封装。
- Mapper 负责 DTO ↔ 标准实体转换，保持纯函数并进行 Zod 校验。
- 后端字段变化只允许在 Adapter/Mapper 消化，不得泄漏到 UI/Store。

## 5) NetLayer / OfflineQueue

当前仓库仍在架构约束阶段，未形成完整实现闭环。

建议推进顺序：

1. 先补齐 `INetwork` 的具体实现与测试替身。
2. 再打通 Adapter 与 NetLayer 的发送/回执链路。
3. 最后引入离线队列与重试策略，收敛 ACK 驱动状态。

## 6) 测试优先级

- `AdapterFactory` 注册/覆盖/异常路径。
- `WabaMapper` schema 校验与转换。
- `conversation.slice` 发送、会话切换、边界条件。
- 新增：service hooks（query/mutation）行为测试。
- 未来补充：ACK 回写与离线重放。
