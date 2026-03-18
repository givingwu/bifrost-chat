# activeChannel 确定流程时序图

## 概述

本文档描述 Bifrost-Chat SDK 中 `activeChannel`（当前激活渠道）的确定和切换流程。

## 时序图

### 1. 初始化阶段

```mermaid
sequenceDiagram
    autonumber
    participant Host as 宿主应用
    participant Store as Zustand Store
    participant Slice as Strategy Slice

    Note over Host,Slice: 默认值初始化

    Host->>Store: configureChatStore
    Note over Store: 初始状态<br/>activeChannel = SMS<br/>allowedChannels = AvailableChannels

    alt 宿主传入自定义配置
        Host->>Store: actions.setStrategy
        Store->>Slice: setStrategy payload
        
        Slice->>Slice: normalizeAllowedChannels
        Note over Slice: 1. 过滤非法渠道<br/>2. 去重<br/>3. 按 AvailableChannels 排序
        
        Slice->>Slice: 校正 activeChannel
        Note over Slice: 若 activeChannel 不在<br/>allowedChannels 中<br/>则取 allowedChannels[0]
        
        Slice-->>Store: 更新 strategy 状态
    end

    Store-->>Host: activeChannel 确定完成
```

### 2. 用户切换渠道

```mermaid
sequenceDiagram
    autonumber
    participant User as 用户
    participant CF as ChannelFilter
    participant TT as TopbarTools
    participant Store as Zustand Store
    participant Slice as Strategy Slice
    participant UC as useConversations
    participant RQ as React Query

    User->>CF: 点击渠道按钮
    CF->>TT: onChannelClick channel
    TT->>Store: setActiveChannel channel
    Store->>Slice: setActiveChannel

    Slice->>Slice: 校验 channel
    Note over Slice: 检查 channel 是否在<br/>allowedChannels 中

    alt channel 在 allowedChannels 中
        Slice-->>Store: 更新 activeChannel
        Store-->>TT: 状态更新通知
        
        Note over UC: activeChannel 变更触发
        UC->>RQ: queryKey 变更
        Note over RQ: queryKey: conversations.list<br/>包含 activeChannel
        RQ->>UC: 重新获取数据
        UC-->>CF: 渲染新渠道的会话列表
    else channel 不在 allowedChannels 中
        Slice-->>Store: 静默忽略，不更新
    end
```

### 3. allowedChannels 变更联动

```mermaid
sequenceDiagram
    autonumber
    participant Host as 宿主应用
    participant Store as Zustand Store
    participant Slice as Strategy Slice

    Host->>Store: setStrategy allowedChannels
    Store->>Slice: setStrategy

    Slice->>Slice: normalizeAllowedChannels
    Note over Slice: 规范化渠道列表

    Slice->>Slice: 检查当前 activeChannel

    alt activeChannel 在新 allowedChannels 中
        Note over Slice: 保持 activeChannel 不变
    else activeChannel 不在新 allowedChannels 中
        Slice->>Slice: activeChannel = allowedChannels[0]
        Note over Slice: 自动校正到第一个合法渠道
    end

    Slice-->>Store: 返回更新后的 strategy
```

## 核心逻辑说明

### activeChannel 确定规则

| 场景 | 规则 | 代码位置 |
|------|------|----------|
| 初始化 | 默认值 `ChannelTypeEnum.SMS` | [`strategy.slice.ts:102`](src/store/slices/strategy.slice.ts:102) |
| setStrategy | 若 `activeChannel` 不在 `allowedChannels` 中，取 `allowedChannels[0]` | [`strategy.slice.ts:142-147`](src/store/slices/strategy.slice.ts:142) |
| setActiveChannel | 仅允许切换到 `allowedChannels` 中的渠道，否则静默忽略 | [`strategy.slice.ts:163-174`](src/store/slices/strategy.slice.ts:163) |

### normalizeAllowedChannels 流程

```mermaid
flowchart TD
    A[输入 channels] --> B[过滤非法渠道]
    B --> C[去重]
    C --> D[按 AvailableChannels 排序]
    D --> E{结果为空?}
    E -->|是| F[返回 fallback]
    E -->|否| G[返回规范化结果]
```

### activeChannel 影响范围

```mermaid
flowchart LR
    subgraph Store[Zustand Store]
        AC[activeChannel]
    end

    subgraph Hooks[React Hooks]
        UC[useConversations]
        UCU[useChannelUnread]
        UCM[useChannelMessageTypes]
    end

    subgraph Components[UI Components]
        CF[ChannelFilter]
        CL[ConversationList]
        CT[ComposerToolbar]
    end

    AC --> UC
    AC --> UCU
    AC --> UCM
    UC --> CL
    UCU --> CF
    UCM --> CT
```

## 关键代码

### Strategy Slice 状态定义

```typescript
interface StrategyState {
  /** 允许的渠道列表 */
  allowedChannels: readonly ChannelTypeEnum[];
  /** 当前激活渠道 */
  activeChannel: ChannelTypeEnum;
  /** 会话列表请求是否按 activeChannel 过滤 */
  channelFilterEnabled: boolean;
}
```

### setActiveChannel Action

```typescript
setActiveChannel: (channel: ChannelTypeEnum) =>
  set((state) => {
    const { allowedChannels } = state.strategy;
    
    // 仅允许切换到 allowedChannels 中的渠道
    if (!allowedChannels.includes(channel)) {
      return state; // 静默忽略
    }
    
    return {
      strategy: { ...state.strategy, activeChannel: channel },
    };
  }),
```

### setStrategy 联动校正

```typescript
setStrategy: (payload: Partial<StrategyState>) =>
  set((state) => {
    // 规范化 allowedChannels
    const allowedChannels = payload.allowedChannels
      ? normalizeAllowedChannels(payload.allowedChannels, current.allowedChannels)
      : current.allowedChannels;

    // activeChannel 联动校正
    const rawActiveChannel = payload.activeChannel ?? current.activeChannel;
    const activeChannel = allowedChannels.includes(rawActiveChannel)
      ? rawActiveChannel
      : allowedChannels[0]; // 不在列表中则取首位

    return { strategy: { ...current, ...payload, allowedChannels, activeChannel } };
  }),
```

## 相关文件

- [`src/store/slices/strategy.slice.ts`](src/store/slices/strategy.slice.ts) - Strategy Slice 定义
- [`src/components/toolbar/ChannelFilter.tsx`](src/components/toolbar/ChannelFilter.tsx) - 渠道切换 UI 组件
- [`src/components/toolbar/TopbarTools.tsx`](src/components/toolbar/TopbarTools.tsx) - 顶部工具栏
- [`src/hooks/use-conversations.hook.ts`](src/hooks/use-conversations.hook.ts) - 会话列表 Hook（消费 activeChannel）
- [`src/hooks/use-channel-unread.hook.ts`](src/hooks/use-channel-unread.hook.ts) - 渠道未读数 Hook
