# Bifrost-Chat JS SDK 架构流程图

> 本文档包含 Bifrost-Chat JS SDK 的关键架构流程图，用于可视化系统设计和数据流。

## 目录

1. [系统架构图](#1-系统架构图)
2. [数据流图](#2-数据流图)
3. [关键流程图](#3-关键流程图)
4. [状态机图](#4-状态机图)
5. [组件关系图](#5-组件关系图)

---

## 1. 系统架构图

### 1.1 整体架构层次

```mermaid
graph TB
    subgraph Host[宿主系统 Host System]
        H[Host Application]
    end

    subgraph SDK[Bifrost-Chat JS SDK]
        subgraph Rendering[渲染层 Rendering Layer]
            CC[ChatContainer]
            CT[ChatTopbar]
            CL[ChatLayout]
            CM[ChatMessageList]
            CP[Profile]
            CS[ComposerToolbar]
            CF[ChannelFilter]
            NS[NetworkStatus]
            TS[ThemeSwitcher]
            LS[LanguageSwitcher]
        end

        subgraph Logic[交互与状态层 Logic Layer]
            CB[ClientBus]
            ST[Store - Zustand]
            UI[UiSlice]
            SS[StrategySlice]
            NSL[NetworkSlice]
            TH[ThemeSlice]
            LG[LanguageSlice]
            CSV[ConversationSlice]
            CX[ProfileSlice]
        end

        subgraph DataLayer[调度与缓存层 DataLayer]
            DL[DataLayer - Repository]
            OQ[Offline Queue]
            OU[Optimistic UI]
        end

        subgraph Adapter[适配与翻译层 Adapter Layer]
            CA[ChannelAdapter]
            DM[DataMapper - Zod]
            AF[AdapterFactory]
            SMSA[SMSAdapter]
            WAA[WhatsAppAdapter]
            EA[EmailAdapter]
            VA[VoIPAdapter]
        end

        subgraph Network[基础设施层 Infrastructure Layer]
            NL[NetLayer]
            PS[Protocol Switcher]
            CMgr[Connection Manager]
            WS[WebSocket]
            SSE[SSE]
            POLL[Polling]
        end
    end

    subgraph Backend[后端系统 Backend]
        HE[Heimdall - 长连接服务]
        HU[Hugin - 协议路由]
        HM[Hermod - 投递执行]
    end

    H -->|SDK API| CB
    CB --> ST
    ST --> CC
    CC --> CT
    CC --> CL
    CL --> CM
    CL --> CP
    CL --> CS

    CT --> CF
    CT --> NS
    CT --> TS
    CT --> LS

    ST -->|订阅| UI
    ST -->|订阅| SS
    ST -->|订阅| NSL
    ST -->|订阅| TH
    ST -->|订阅| LG
    ST -->|订阅| CSV
    ST -->|订阅| CX

    ST --> DL
    DL --> OQ
    DL --> OU
    DL --> AF
    AF --> CA
    CA --> SMSA
    CA --> WAA
    CA --> EA
    CA --> VA
    CA --> DM
    DM --> NL
    NL --> PS
    PS --> WS
    PS --> SSE
    PS --> POLL
    PS --> CMgr

    CMgr --> HE
    HE --> HU
    HU --> HM
    HM --> NL
```

### 1.2 分层架构详细视图

```mermaid
graph TB
    subgraph Level1[Level 1: 渲染层 Rendering]
        R1[ChatContainer]
        R2[ChatTopbar]
        R3[ChatMessageList]
        R4[ComposerToolbar]
        R5[Profile]
    end

    subgraph Level2[Level 2: 交互与状态层 Logic]
        L1[ClientBus]
        L2[Store - Zustand]
    end

    subgraph Level3[Level 3: 调度与缓存层 DataLayer]
        D1[DataLayer - Repository]
        D2[Offline Queue]
        D3[Optimistic UI]
    end

    subgraph Level4[Level 4: 适配与翻译层 Adapter]
        A1[ChannelAdapter]
        A2[DataMapper - Zod]
        A3[AdapterFactory]
    end

    subgraph Level5[Level 5: 基础设施层 Infrastructure]
        I1[NetLayer]
        I2[Protocol Switcher]
        I3[Connection Manager]
    end

    R1 --> L1
    R2 --> L2
    R3 --> L2
    R4 --> L2
    R5 --> L2

    L1 --> D1
    L2 --> D1

    D1 --> A1
    D2 --> A1
    D3 --> A1

    A1 --> A2
    A1 --> A3
    A2 --> I1
    A3 --> I1

    I1 --> I2
    I1 --> I3
```

---

## 2. 数据流图

### 2.1 发送消息数据流（Outbound）

```mermaid
graph LR
    A[用户输入] --> B[ComposerToolbar]
    B --> C[Store - 生成 tempId]
    C --> D[Optimistic UI - 更新 UI]
    C --> E[DataLayer]
    E --> F[AdapterFactory - 选择渠道]
    F --> G[ChannelAdapter]
    G --> H[DataMapper - 转换 DTO]
    H --> I[Zod 校验]
    I --> J[NetLayer]
    J --> K[Protocol Switcher]
    K --> L[Connection Manager]
    L --> M[后端服务]

    M -->|返回 mid| N[NetLayer]
    N --> O[DataMapper - 解析响应]
    O --> P[DataLayer]
    P --> Q[Store - 更新 id/status]
    Q --> R[UI - 刷新状态]

    style D fill:#e1f5e1
    style Q fill:#e1f5e1
    style R fill:#e1f5e1
```

### 2.2 接收消息数据流（Inbound）

```mermaid
graph LR
    A[后端服务] --> B[Connection Manager]
    B --> C[Protocol Switcher]
    C --> D[NetLayer]
    D --> E[AdapterFactory - 分发]
    E --> F[ChannelAdapter]
    F --> G[DataMapper - 转换 StandardMessage]
    G --> H[Zod 校验]
    H --> I[DataLayer]
    I --> J[Store - 写入消息]
    J --> K[UI - 被动刷新]
    J --> L[ClientBus - 触发事件]
    L --> M[Host - message_received]

    style J fill:#e1f5e1
    style K fill:#e1f5e1
    style M fill:#e1f5e1
```

### 2.3 状态同步数据流

```mermaid
graph LR
    A[后端服务] --> B[Connection Manager]
    B --> C[NetLayer]
    C --> D[AdapterFactory - 分发 ACK]
    D --> E[ChannelAdapter]
    E --> F[DataMapper - 解析 ACK]
    F --> G[Store - 更新消息状态]
    G --> H[UI - 刷新状态指示器]

    style G fill:#e1f5e1
    style H fill:#e1f5e1
```

### 2.4 网络重连数据流

```mermaid
graph LR
    A[心跳超时] --> B[Connection Manager]
    B --> C[Store - 更新状态 disconnected]
    C --> D[UI - 显示断网状态]
    B --> E[NetLayer - 触发重连]
    E --> F[Protocol Switcher - 协议切换]
    F -->|Socket| G[WebSocket]
    F -->|SSE| H[SSE]
    F -->|Polling| I[Polling]
    G -->|成功| J[Connection Manager]
    H -->|成功| J
    I -->|成功| J
    J --> K[Store - 更新状态 connected]
    K --> L[UI - 显示连接状态]
    J --> M[Offline Queue - 重发消息]

    style C fill:#ffe1e1
    style K fill:#e1f5e1
    style M fill:#fff4e1
```

---

## 3. 关键流程图

### 3.1 发送消息完整流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as UI 组件
    participant Store as Store
    participant DataLayer as DataLayer
    participant Adapter as ChannelAdapter
    participant Mapper as DataMapper
    participant NetLayer as NetLayer
    participant Server as 后端服务

    User->>UI: 输入消息并点击发送
    UI->>Store: 触发 sendMessage action
    Store->>Store: 生成 tempId
    Store->>Store: 创建消息对象 status=Sending
    Store->>UI: 乐观更新（显示发送中）
    Store->>DataLayer: 调用 send()

    DataLayer->>DataLayer: 检查网络状态
    alt 网络断开
        DataLayer->>DataLayer: 写入 Offline Queue
        DataLayer->>UI: 显示离线状态
    else 网络正常
        DataLayer->>Adapter: 选择渠道适配器
        Adapter->>Mapper: 转换为协议 DTO
        Mapper->>Mapper: Zod Schema 校验
        alt 校验失败
            Mapper->>Store: 更新状态 Failed
            Store->>UI: 显示错误 + 重试按钮
        else 校验成功
            Mapper->>NetLayer: 发送 Payload
            NetLayer->>Server: Socket/HTTP 请求
            Server-->>NetLayer: 返回响应（mid）
            NetLayer->>Mapper: 解析响应
            Mapper->>Store: 更新 id + status=Sent
            Store->>UI: 刷新状态（已发送）
        end
    end
```

### 3.2 接收消息完整流程

```mermaid
sequenceDiagram
    participant Server as 后端服务
    participant NetLayer as NetLayer
    participant Adapter as ChannelAdapter
    participant Mapper as DataMapper
    participant DataLayer as DataLayer
    participant Store as Store
    participant UI as UI 组件
    participant Host as Host 应用

    Server->>NetLayer: 推送消息（Packet）
    NetLayer->>Adapter: 分发到对应渠道
    Adapter->>Mapper: 转换为 StandardMessage
    Mapper->>Mapper: Zod Schema 校验
    alt 校验失败
        Mapper->>DataLayer: 返回错误
        DataLayer->>UI: 显示错误提示
    else 校验成功
        Mapper->>DataLayer: 返回标准化消息
        DataLayer->>Store: 写入消息列表
        Store->>UI: 被动刷新（显示新消息）
        Store->>Host: 触发 message_received 事件
        Host->>Host: 处理消息事件
    end
```

### 3.3 消息状态更新流程

```mermaid
sequenceDiagram
    participant Server as 后端服务
    participant NetLayer as NetLayer
    participant Adapter as ChannelAdapter
    participant Mapper as DataMapper
    participant Store as Store
    participant UI as UI 组件

    Server->>NetLayer: 发送 ACK（msg_receive_ack）
    NetLayer->>Adapter: 分发 ACK
    Adapter->>Mapper: 解析 ACK
    Mapper->>Store: 更新消息状态 Delivered
    Store->>UI: 刷新状态指示器（单钩）

    Server->>NetLayer: 发送 ACK（msg_read_ack）
    NetLayer->>Adapter: 分发 ACK
    Adapter->>Mapper: 解析 ACK
    Mapper->>Store: 更新消息状态 Read
    Store->>UI: 刷新状态指示器（双蓝勾）
```

### 3.4 网络重连流程

```mermaid
sequenceDiagram
    participant CMgr as Connection Manager
    participant Store as Store
    participant UI as UI 组件
    participant NetLayer as NetLayer
    participant PS as Protocol Switcher
    participant OQ as Offline Queue

    CMgr->>CMgr: 心跳超时
    CMgr->>Store: 更新状态 Disconnected
    Store->>UI: 显示断网状态
    CMgr->>NetLayer: 触发重连

    NetLayer->>PS: 尝试协议切换
    PS->>PS: Socket → SSE → Polling

    alt 重连成功
        PS->>CMgr: 连接成功
        CMgr->>Store: 更新状态 Connected
        Store->>UI: 显示连接状态
        CMgr->>OQ: 触发离线队列重发
        OQ->>NetLayer: 重发消息
        NetLayer->>Store: 更新消息状态
    else 重连失败
        PS->>CMgr: 连接失败
        CMgr->>CMgr: 延迟重试
    end
```

### 3.5 渠道切换流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as UI 组件
    participant Store as Store
    participant Composer as ComposerToolbar
    participant ChannelFilter as ChannelFilter

    User->>ChannelFilter: 点击渠道按钮
    ChannelFilter->>Store: setActiveChannel(channel)
    Store->>Store: 更新 activeChannel
    Store->>ChannelFilter: 刷新激活状态
    Store->>Composer: 通知渠道变化

    Composer->>Composer: 根据渠道切换输入能力
    alt SMS 渠道
        Composer->>Composer: 禁用视频、禁用富文本
        Composer->>UI: 显示字符数/计费
    else WhatsApp 渠道
        Composer->>Composer: 允许图片/文件
        Composer->>UI: 显示模板选择按钮
    else Email 渠道
        Composer->>Composer: 显示富文本编辑器
        Composer->>UI: 显示 Subject + Body
    end
```

---

## 4. 状态机图

### 4.1 消息状态机

```mermaid
stateDiagram-v2
    [*] --> Created: 生成 tempId
    Created --> Sending: 发送消息
    Sending --> Sent: 服务端接收
    Sending --> Failed: 发送失败
    Sent --> Delivered: msg_receive_ack
    Delivered --> Read: msg_read_ack
    Failed --> Sending: 重试发送
    Read --> [*]
    Failed --> [*]
```

### 4.2 网络状态机

```mermaid
stateDiagram-v2
    [*] --> Disconnected: 初始状态
    Disconnected --> Connecting: 发起连接
    Connecting --> Connected: 连接成功
    Connecting --> Disconnected: 连接失败
    Connected --> Disconnected: 连接断开
    Connected --> Connecting: 心跳超时
    Disconnected --> Connecting: 自动重连
```

### 4.3 坐席状态机

```mermaid
stateDiagram-v2
    [*] --> Offline: 初始状态
    Offline --> Online: 上线
    Online --> InCall: 发起/接听通话
    Online --> Busy: 设置忙碌
    Online --> Offline: 下线
    InCall --> Online: 通话结束
    Busy --> Online: 取消忙碌
    Busy --> Offline: 下线
```

### 4.4 渠道状态机

```mermaid
stateDiagram-v2
    [*] --> SMS: 初始化
    SMS --> WhatsApp: 切换渠道
    SMS --> Email: 切换渠道
    WhatsApp --> SMS: 切换渠道
    WhatsApp --> Email: 切换渠道
    Email --> SMS: 切换渠道
    Email --> WhatsApp: 切换渠道
```

---

## 5. 组件关系图

### 5.1 渲染层组件关系

```mermaid
graph TB
    CC[ChatContainer] --> CT[ChatTopbar]
    CC --> CL[ChatLayout]

    CT --> CF[ChannelFilter]
    CT --> NS[NetworkStatus]
    CT --> TS[ThemeSwitcher]
    CT --> LS[LanguageSwitcher]

    CL --> CList[ConversationList]
    CL --> CML[ChatMessageList]
    CL --> CTB[ComposerToolbar]
    CL --> CP[Profile]

    CF --> CBF[ChannelButtonFactory]
    CML --> MRF[MessageRendererFactory]

    CP --> CPH[ProfileHeader]
    CP --> CPS[ProfileSearch]
    CP --> CPI[ProfileInfoList]
    CP --> CPT[ProfileTemplates]

    CTB --> CTA[ComposerActions]
    CTB --> CAtts[ComposerAttachments]
    CTB --> CH[ComposerHint]
    CTB --> CI[ComposerInput]
```

### 5.2 Store Slice 关系

```mermaid
graph TB
    Store[useChatStore] --> UI[UiSlice]
    Store --> Strategy[StrategySlice]
    Store --> Network[NetworkSlice]
    Store --> Theme[ThemeSlice]
    Store --> Language[LanguageSlice]
    Store --> Conversation[ConversationSlice]
    Store --> Profile[ProfileSlice]

    UI --> UIActions[actions.setUI]
    Strategy --> StrategyActions[actions.setStrategy]
    Strategy --> ActiveChannelActions[actions.setActiveChannel]
    Network --> NetworkActions[actions.setNetwork]
    Theme --> ThemeActions[actions.setTheme]
    Language --> LanguageActions[actions.setLanguage]
    Conversation --> ConversationActions[actions.setConversation]
    Context --> ContextActions[actions.setContext]
```

### 5.3 ChannelAdapter 关系

```mermaid
graph TB
    AF[AdapterFactory] --> SMSA[SMSAdapter]
    AF --> WAA[WhatsAppAdapter]
    AF --> EA[EmailAdapter]
    AF --> VA[VoIPAdapter]

    SMSA --> IText[ITextSender]
    WAA --> IText
    WAA --> IMedia[IMediaSender]
    EA --> IText
    EA --> IMedia
    VA --> IText
    VA --> IReporter[IInteractionReporter]

    IText --> DM[DataMapper]
    IMedia --> DM
    IReporter --> DM
```

### 5.4 MessageRendererFactory 关系

```mermaid
graph TB
    MRF[MessageRendererFactory] --> BubbleMap[BubbleMap]
    BubbleMap --> TB[TextBubble]
    BubbleMap --> IB[ImageBubble]
    BubbleMap --> AB[AudioPlayerBubble]
    BubbleMap --> VB[VideoPlayerBubble]
    BubbleMap --> FB[FileBubble]
    BubbleMap --> TMB[WhatsAppTemplateBubble]
    BubbleMap --> LB[LocationBubble]
    BubbleMap --> RMB[RichMediaBubble]
    BubbleMap --> CSM[CallSystemMessage]
    BubbleMap --> USB[UnsupportedBubble]

    MRF --> SI[StatusIndicator]
    SI --> Sending[Loader2]
    SI --> Failed[AlertCircle]
    SI --> Read[CheckCheck]
    SI --> Delivered[CheckCheck]
    SI --> Sent[Check]
```

---

## 6. 协议映射图

### 6.1 Packet → StandardMessage 映射

```mermaid
graph LR
    A[Packet] --> B[id → tempId]
    A --> C[mid → id]
    A --> D[upid → metadata.upid]
    A --> E[from → sender]
    A --> F[to → receiver]
    A --> G[ptype → metadata.ptype]
    A --> H[body.type → type]
    A --> I[body.content → content]
    A --> J[timestamp → timestamp]

    B --> K[StandardMessage]
    C --> K
    D --> K
    E --> K
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
```

### 6.2 ACK → MessageStatus 映射

```mermaid
graph LR
    A[msg_receive_ack] --> B[Delivered]
    C[msg_read_ack] --> D[Read]

    B --> E[MessageStatus]
    D --> E
```

### 6.3 会话列表映射

```mermaid
graph LR
    A[会话列表协议] --> B[sid → conversation.id]
    A --> C[newUnreadCount → conversation.hasUnread]
    A --> D[lastMessage → conversation.lastMessage]
    A --> E[time → conversation.lastMessageTime]

    B --> F[Conversation]
    C --> F
    D --> F
    E --> F
```

---

## 7. 设计模式应用

### 7.1 工厂模式

```mermaid
graph TB
    F[Factory] -->|type| M1[Component 1]
    F -->|type| M2[Component 2]
    F -->|type| M3[Component 3]
    F -->|type| M4[Component 4]

    M1 --> R[Renderer]
    M2 --> R
    M3 --> R
    M4 --> R
```

### 7.2 策略模式

```mermaid
graph TB
    C[Context] -->|channel| S1[Strategy 1]
    C -->|channel| S2[Strategy 2]
    C -->|channel| S3[Strategy 3]

    S1 --> A[Algorithm]
    S2 --> A
    S3 --> A
```

### 7.3 适配器模式

```mermaid
graph LR
    C[Client] --> I[Interface]
    A1[Adapter 1] --> I
    A2[Adapter 2] --> I
    A3[Adapter 3] --> I

    A1 --> S1[Service 1]
    A2 --> S2[Service 2]
    A3 --> S3[Service 3]
```

---

**文档版本**: 1.0.0
**最后更新**: 2026-02-02
**维护者**: Bifrost-Chat Team
