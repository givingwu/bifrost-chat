# Conversation Cache 重构设计

## 文档信息

- 日期：2026-03-23
- 状态：已完成设计评审，待进入实现计划
- 范围：`Conversation` 列表 / 详情缓存、creating/pending 会话可见性、消息驱动的会话投影、宿主权威回灌

## 1. 背景

当前 SDK 使用
[`ConversationCacheHelper`](../../../src/services/cache/conversation-cache-helper.service.ts)
统一管理以下能力：

1. React Query 会话列表缓存
2. 会话详情缓存
3. creating / pending 本地占位态
4. 消息到会话摘要的投影
5. 未读数写入
6. 陌生会话的 synthetic 构造

这导致一个核心问题：**宿主权威数据、SDK 本地状态、消息派生状态混在同一个
`Conversation` 对象里被合并和覆盖。**

在当前宿主接入模型下，这种设计已经出现确定性问题：

1. 多页 infinite query 写入时重复插入、错误置顶
2. `replaceConversationList()` 破坏分页结构
3. `pending/creating` 本地状态残留到 detail cache
4. 宿主权威 `unreadCount=0` 无法可靠覆盖旧值
5. `mergeUser()` 过度保守，在线状态等字段无法更新

## 2. 宿主侧事实

本设计不基于抽象猜测，而基于当前仓库中的宿主接入口径：

1. `IConversationService.create/get/query` 在电催场景里通常都映射到
   `/chat/v2/session/info` 或 `/chat/v2/session/query`，返回的是**权威会话信息**，
   不是临时壳对象。
2. `IConversationService.list()` 提供的是会话列表快照，字段可能比 `info/get`
   稀疏。
3. 若宿主实现 `subscribeToListUpdates` /
   `subscribeToConversationUpdates`，这些回调也是**宿主权威回灌源**。
4. `Conversation.unreadCount` 是当前实现里的唯一展示值；SDK 可以做局部乐观显示，
   但不能长期覆盖宿主权威值。

相关依据：

- [README.md](../../../README.md)
- [specs/电催接口.md](../../../specs/电催接口.md)
- [design/conversation-list-render-sequence.md](../../../design/conversation-list-render-sequence.md)
- [design/unread-usage.md](../../../design/unread-usage.md)

## 3. 目标

### 3.1 当前已实现（As-Is）

当前 SDK 需要继续支持：

1. `useConversations` 的 infinite query 分页
2. `useConversationDetail` 的详情缓存复用
3. 创建中 skeleton 与 pending 会话首位展示
4. 消息先于列表到达时的陌生会话可见性
5. 宿主 list / detail / subscription 回灌

### 3.2 目标架构（To-Be）

本轮重构后，需要达到：

1. 宿主权威 `Conversation` 与 SDK 本地 overlay 分层
2. 分页缓存写入语义正确，不再按“每页都执行同一个 upsert”处理
3. 本地 creating/pending/synthetic 状态不再污染宿主 `metadata`
4. 合并策略按数据来源区分，不再依赖单一的泛化 merge
5. 缓存 helper 收敛为内部实现，不再作为公开宿主 API

## 4. 非目标

本次设计不包含：

1. 公开 API 的破坏性改名
2. UI 视觉结构改动
3. message cache 的整体重构
4. `Conversation` 类型结构的大改
5. 重新设计宿主服务接口

## 5. 方案比较

### 方案 A：继续在现有 helper 上打补丁

做法：

- 修正 `mergeUser`
- 修正 `updatePages`
- 修正 `replaceConversationList`
- 对 `metadata` 和 `unreadCount` 增加更多条件分支

优点：

- 改动最小
- 风险可控

缺点：

- 仍然保留“一个类处理所有语义”
- 问题会从单点 bug 演变成长期条件分支堆积
- 无法真正收敛宿主权威与 SDK 本地状态边界

### 方案 B：拆成权威缓存、overlay、本地投影三层

做法：

1. 权威缓存只收宿主 `Conversation`
2. overlay 只存 creating / pending / ephemeral 可见性状态
3. 投影层只处理消息驱动的摘要和置顶

优点：

- 边界清晰
- 可以对应当前宿主模型
- 后续问题更容易定位和测试

缺点：

- 需要拆模块
- 迁移步骤比方案 A 多

### 方案 C：大幅减少本地写缓存，主要依赖 invalidate/refetch

优点：

- 最保守
- 逻辑简单

缺点：

- 创建中与陌生会话体验明显退化
- 对宿主回灌时序依赖更强

### 推荐

采用 **方案 B**。

原因：

当前问题不是少量逻辑缺陷，而是缓存层没有区分“这是谁的真相”。只要这点不改，
补丁会持续增加。

## 6. 目标结构

### 6.1 模块拆分

新增内部模块，替代当前“万能 helper”：

1. `conversation-authoritative-cache.service.ts`
2. `conversation-overlay.service.ts`
3. `conversation-projection.service.ts`
4. `conversation-merge.policy.ts`

`ConversationCacheHelper` 保留为过渡 facade，逐步收口到内部使用，最终不再从包入口导出。

### 6.2 职责定义

#### A. authoritative cache

职责：

1. 读写宿主权威 `Conversation`
2. 管理 list/detail 两类 React Query cache
3. 处理宿主 `list/get/query/create/subscription` 回灌

约束：

1. 不写入 `creating/pending/synthetic/localState`
2. 不生成本地占位 `Conversation`
3. 不猜测宿主 `unreadCount=0` 是否是占位值

#### B. overlay

职责：

1. 管理 creating placeholder
2. 管理 pending 可见性
3. 管理消息先到时的 `ephemeralFromMessage`

约束：

1. 不写回宿主 `Conversation.metadata`
2. 不作为 detail cache 的真实来源
3. 仅用于列表展示合成

#### C. projection

职责：

1. 基于消息生成列表摘要
2. 将会话移动到顶部
3. 为陌生会话生成最小可渲染列表项

约束：

1. 只处理列表显示属性
2. 不改宿主权威 metadata
3. 不负责 unread 基线的最终决策

#### D. merge policy

职责：

为不同来源定义不同合并策略，显式区分：

1. `authoritative-list`
2. `authoritative-detail`
3. `authoritative-subscription`
4. `projection`

禁止再使用“一个 merge 函数 + 零散布尔参数”处理所有来源。

## 7. 数据模型设计

### 7.1 权威会话

继续沿用 `Conversation`，但只承载宿主事实。

### 7.2 overlay 结构

新增内部类型：

```ts
interface ConversationOverlayItem {
  conversationId: string;
  channel: ChannelTypeEnum;
  kind: 'creating' | 'pending' | 'ephemeral-from-message';
  insertedAt: string;
  previewConversation: Conversation;
}
```

规则：

1. `previewConversation` 仅用于列表展示
2. overlay 项不进入 detail cache
3. overlay 消失条件明确可计算

### 7.3 metadata 规则

本地字段不再进入 `Conversation.metadata`：

- `localState`
- `pendingSince`
- `pendingSource`
- `synthetic`
- `seedMessageId`

如仍需保留调试信息，放入 overlay 或内部调试结构，不向宿主对象回写。

## 8. 核心行为设计

### 8.1 list 返回

行为：

1. `useConversations` 写 authoritative list cache
2. 用 authoritative list 中的 `conversation.id` 对 overlay 做确认与清理
3. 渲染层按 `overlay + authoritative` 组合出 visible list

约束：

1. 不再用 `replaceConversationList(Conversation[])` 直接重写 entire infinite cache
2. 多页结构必须保持合法

### 8.2 get/query/create 返回

行为：

1. 将宿主返回值写入 detail cache
2. 若 list 中已存在该会话，按“权威覆盖”更新对应列表项
3. 若 overlay 中存在同 ID 或可确认占位项，则移除 overlay

关键点：

`create()` 成功后返回的真实会话不再被立即降级为 `pending_create`。

### 8.3 creating skeleton

行为：

1. `useCreateConversation.onMutate` 创建 `kind='creating'` overlay
2. `create` 成功后移除 creating overlay
3. 若宿主尚未把该会话出现在列表中，可视情况新增一个 `pending` overlay，
   但该 overlay 不污染 detail cache

### 8.4 pending 可见性

`pending` 的定义不是“宿主返回的数据还不可信”，而是：

> 宿主已创建成功，但列表快照还没追上，为了列表可见性临时补位。

因此：

1. pending 只影响列表展示
2. pending 不应改写 detail
3. 宿主权威 list/detail 到达后立即清除

### 8.5 消息先于列表到达

行为：

1. 若消息所属会话不在 authoritative list/detail 中，生成
   `ephemeral-from-message` overlay
2. 该 overlay 只包含列表展示必要字段
3. 后续宿主回灌到达后，以宿主数据替换并清理 overlay

### 8.6 unread

规则：

1. `Conversation.unreadCount` 仍然是最终展示值
2. 宿主权威回灌可直接覆盖
3. SDK 的本地 unread 处理只作为短时投影，不再在 helper 内提供一整组“权威 unread 修改 API”

因此下列 API 标记为待删除：

1. `incrementUnread`
2. `decrementUnread`
3. `clearUnread`
4. `setExactUnread`

## 9. 分页写入策略

### 9.1 当前问题

现有 `updatePages()` 将同一个 updater 施加到每一页，导致：

1. 新会话被插入到每一页
2. 后续页命中的会话无法真正移到整个列表顶部

### 9.2 新策略

新增分页写入 primitives：

1. `updateConversationInPlace`
2. `moveConversationToFirstPage`
3. `prependConversationToFirstPage`
4. `replaceFirstPageSnapshot`

规则：

1. 会话级修改必须先定位目标页
2. 置顶操作必须跨页搬运，不能只做页内排序
3. “列表快照替换”只替换第一页内容，且必须显式重置分页游标策略

## 10. merge policy 细则

### 10.1 user

`mergeUser` 改为按来源决策：

1. 权威来源可覆盖 `status`
2. 权威来源可覆盖 `avatarUrl/email/phone/role`
3. 仅在 incoming 缺失字段时才保留旧值

### 10.2 metadata

metadata 不再做泛化“尽量保守保留”。

改为：

1. 对宿主明确字段使用白名单 merge
2. 对空字符串是否可覆盖，按字段语义单独定义
3. 对 SDK 本地字段禁止 merge 回宿主 metadata

### 10.3 unreadCount

规则：

1. `authoritative-detail` 与 `authoritative-subscription` 的
   `unreadCount` 可直接覆盖
2. `authoritative-list` 是否保留本地短时投影，由 unread 专用逻辑处理
3. 不再因为值为 `0` 就默认保留旧值

## 11. 对公开 API 的影响

### 11.1 当前已实现（As-Is）

`ConversationCacheHelper` 当前从包入口导出。

### 11.2 目标架构（To-Be）

1. 下一阶段：保留导出，但标记 `@deprecated`
2. 再下一阶段：从 `src/index.ts` 移除导出，仅保留内部模块

说明：

这属于内部缓存编排器，不应成为宿主集成 API。

## 12. 迁移计划

### 阶段 1：正确性修复

先在不大改公开接口的前提下修复：

1. `mergeUser.status`
2. multi-page upsert
3. `replaceConversationList`
4. `unreadCount=0` 覆盖语义
5. 本地 metadata 残留

### 阶段 2：overlay 分层

1. creating / pending 从 metadata 中剥离
2. `useConversations` 改为 `overlay + authoritative` 合成展示

### 阶段 3：helper 收口

1. 拆出内部模块
2. 让旧 helper 仅做 facade
3. 逐步移除无用公开 API

## 13. 测试设计

新增或补强测试：

1. 多页缓存下新增会话只能插入第一页一次
2. 多页缓存下第 N 页会话置顶后，原页不残留
3. `create -> detail -> list` 流程中，本地 overlay 会被正确移除
4. `create` 成功后 detail cache 不带 `pending/creating`
5. 宿主权威 `unreadCount=0` 可正确覆盖旧值
6. `mergeUser` 能更新 status
7. 陌生会话由消息生成 overlay，宿主回灌后自动替换

## 14. 风险

1. 过渡期 facade 与新模块并存，容易出现双写
2. unread 逻辑与现有 hook 的耦合较深，需要先画清楚调用顺序
3. 若外部宿主已经直接使用 `ConversationCacheHelper`，移除导出需要兼容窗口

## 15. 决策摘要

最终决策：

1. 保留“本地可见性补丁”能力
2. 不再让本地状态污染宿主权威 `Conversation`
3. 按数据来源拆分 merge policy
4. 分页缓存写入改为显式的跨页操作
5. `ConversationCacheHelper` 收口为内部实现

这份设计的核心不是“删掉 helper”，而是**把 helper 从“万能状态容器”改成明确边界的缓存编排层**。
