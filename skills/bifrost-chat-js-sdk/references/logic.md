# 逻辑层规范（当前实现 + 规划）

## 1) Store 与事件

当前实现：

- Store：Zustand，多 Slice 组合（ui/strategy/network/theme/language/conversation/profile）。
- hooks：`useStrategy/useConversation/useActions` 等用于 UI 订阅。
- ClientBus：事件总线能力已存在（订阅/取消/派发）。

约束：

- UI 只读标准状态，不直接读写协议原始字段。
- action 命名与枚举命名遵循 `docs/naming-conventions.md`。

## 2) 消息发送路径

当前主路径：

1. `conversation.slice.ts` 的 `sendMessage` 构造标准消息。
2. 使用 `MessageBuilder` 统一填充默认字段。
3. 通过 `appendMessage` 入列消息流。

规划路径（目标态）：

- `sendMessage` -> Repository/DataLayer -> Adapter -> NetLayer -> ACK 回写 Store。

## 3) Adapter 与 Mapper

当前实现：

- `AdapterFactory` 已实现注册表、创建、校验与重置能力。
- 默认内置 `WabaAdapter`。
- `WabaMapper` + schema 已可用于 DTO 映射/校验。

当前缺口：

- `WabaAdapter` 的 NetLayer 集成、媒体上传、交互回执仍为 TODO。

## 4) NetLayer / OfflineQueue

当前仓库处于接口与架构约束阶段，尚未形成完整实现。

建议推进顺序：

1. 先抽象 `INetwork` 具体实现与测试替身。
2. 再串联 Adapter -> NetLayer。
3. 最后落地 OfflineQueue 与 ACK 驱动状态收敛。

## 5) 测试优先级

- `AdapterFactory` 注册/覆盖/异常路径。
- `WabaMapper` 的 schema 校验与转换。
- `conversation.slice` 的发送、会话切换、边界条件。
- 未来补充：ACK 回写与离线重放。
