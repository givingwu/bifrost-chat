# 架构参考（当前实现 + 目标演进）

本文档只保留对开发决策有用的信息，并明确区分：

- 当前实现（代码已存在）
- 目标演进（尚未完全落地）

## 1) 当前实现（代码现状）

### 1.1 主要目录

- `src/components/*`：渲染层组件
- `src/store/*`：Zustand Store 与各 Slice
- `src/adapters/*`：渠道适配器与映射
- `src/interfaces/*`：公开类型与内部契约
- `src/providers/*`：I18n/Provider 封装

### 1.2 已落地的核心链路

1. UI 通过 hooks 读取 Store（如 `useStrategy/useConversation/useActions`）。
2. 发送消息主路径在 `conversation.slice.ts` 中由 `MessageBuilder` 构造标准消息。
3. 渠道适配通过 `AdapterFactory` 提供注册/创建能力，默认内置 `WabaAdapter`。
4. 消息展示由 `ChatMessageList` + `MessageRendererFactory` 负责。

### 1.3 当前已存在的边界

- DataLayer/Repository、NetLayer、OfflineQueue：当前以架构目标为主，未完整落地。
- `WabaAdapter` 中发送/上传/回执上报仍有 NetLayer 集成 TODO。
- 部分“目标架构”能力（协议热切、离线重放）尚未成为可执行实现。

## 2) 目标演进（架构约束）

目标分层保持不变：

- Rendering（UI）
- Store/ClientBus（交互状态）
- DataLayer（调度缓存）
- Adapter/Mapper（渠道防腐）
- NetLayer（连接与协议）

演进原则：

- 先固化接口，再替换实现。
- 新增渠道必须经由 `ChannelTypeEnum` + Adapter 注册链路。
- 后端字段变化只改 Mapper，不扩散到 Store/UI。

## 3) 现状与目标差异（Gap）

1. **调度层缺口**：`sendMessage` 目前直接写 Store，尚未进入 Repository/Queue。
2. **网络层缺口**：`INetwork` 目标清晰，但具体实现与协议切换未落地。
3. **状态一致性**：消息状态流（sending/sent/read/failed）已建模，但 ACK 驱动链路未闭环。
4. **性能缺口**：消息列表当前为直接 map，尚未接入虚拟滚动。

## 4) 扩展操作手册

### 新增渠道

1. 在 `src/interfaces/channel.interface.ts` 扩展 `ChannelTypeEnum`。
2. 新增适配器（建议 `src/adapters/<channel>/`）。
3. 适配器实现至少满足 `IChannelAdapter`，按能力实现发送接口。
4. 在 `AdapterFactory` 注册并补测试。
5. 补齐 UI 映射（`ChannelButtonFactory`、必要时 `ComposerToolbar`）。

### 新增消息类型

1. 扩展 `MessageTypeEnum` 与消息内容类型。
2. 在 `MessageRendererFactory` 增加映射。
3. 如需展示组件，新增 `src/components/messages/*` 与 story。
4. Mapper 增加校验与转换逻辑。

## 5) 相关文档

- `../../../docs/architecture-overview.md`
- `../../../docs/component-architecture.md`
- `../../../docs/architecture-diagrams.md`
- `../../../docs/ui-flexibility-design.md`
- `../../../docs/naming-conventions.md`
